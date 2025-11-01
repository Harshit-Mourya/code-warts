from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from dotenv import load_dotenv
from pathlib import Path
import os
import logging
import uuid
import httpx
from emergentintegrations.llm.chat import LlmChat, UserMessage
from google.cloud import speech, texttospeech
import asyncio
import io
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="ArogyaMitti API")
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ===== MODELS =====

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: str
    email: Optional[str] = None
    location: Optional[Dict[str, float]] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None

class CropRecommendation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    location: Dict[str, float]
    soil_type: str
    weather_data: Dict[str, Any]
    recommended_crops: List[str]
    reasoning: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FertilizerAdvice(BaseModel):
    crop: str
    farm_size_acres: float
    soil_data: Dict[str, Any]
    advice: Dict[str, Any]

class MandiPrice(BaseModel):
    mandi_name: str
    location: str
    distance_km: float
    crop: str
    min_price: float
    max_price: float
    unit: str = "quintal"

class PestAlert(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    crop: str
    pest_name: str
    severity: str
    description: str
    weather_conditions: Dict[str, Any]
    preventive_measures: List[str]
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class VoiceQueryRequest(BaseModel):
    language: str = "english"

class VoiceResponse(BaseModel):
    transcript: str
    response_text: str
    confidence: float

# ===== SERVICES =====

class WeatherService:
    def __init__(self):
        self.api_key = os.getenv("OPENWEATHERMAP_API_KEY")
        self.base_url = "https://api.openweathermap.org/data/2.5"
    
    async def get_forecast(self, lat: float, lon: float) -> Dict:
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.base_url}/forecast",
                    params={
                        "lat": lat,
                        "lon": lon,
                        "appid": self.api_key,
                        "units": "metric"
                    },
                    timeout=10.0
                )
                response.raise_for_status()
                data = response.json()
                
                # Process forecast data
                forecasts = data.get('list', [])[:8]  # Next 24 hours
                processed = {
                    "temperature_avg": sum(f['main']['temp'] for f in forecasts) / len(forecasts),
                    "humidity_avg": sum(f['main']['humidity'] for f in forecasts) / len(forecasts),
                    "precipitation_probability": max(f.get('pop', 0) for f in forecasts) * 100,
                    "weather_main": forecasts[0]['weather'][0]['main'] if forecasts else "Clear",
                    "forecasts": forecasts[:3]
                }
                return processed
            except Exception as e:
                logger.error(f"Weather API error: {e}")
                # Return mock data if API fails
                return {
                    "temperature_avg": 28.5,
                    "humidity_avg": 65.0,
                    "precipitation_probability": 40.0,
                    "weather_main": "Partly Cloudy",
                    "forecasts": []
                }

class SoilService:
    async def get_soil_data(self, lat: float, lon: float) -> Dict:
        # Query nearest soil data from database
        soil_data = await db.soil_health_cards.find_one(
            {"location": {"$near": {"$geometry": {"type": "Point", "coordinates": [lon, lat]}, "$maxDistance": 50000}}},
            {"_id": 0}
        )
        
        if not soil_data:
            # Return default soil data
            soil_data = {
                "nitrogen": "Medium",
                "phosphorus": "Medium",
                "potassium": "Medium",
                "ph": 6.8,
                "organic_carbon": "Medium",
                "district": "Unknown"
            }
        
        return soil_data

class GeminiService:
    def __init__(self):
        self.api_key = os.getenv("EMERGENT_LLM_KEY")
        self.chat = None
    
    def _get_chat(self, session_id: str, system_message: str):
        chat = LlmChat(
            api_key=self.api_key,
            session_id=session_id,
            system_message=system_message
        )
        chat.with_model("gemini", "gemini-2.0-flash")
        return chat
    
    async def get_crop_recommendation(self, weather: Dict, soil: Dict, location: Dict) -> Dict:
        system_msg = "You are an agricultural expert. Provide crop recommendations based on weather, soil, and location data. Be concise and practical."
        chat = self._get_chat("crop_rec", system_msg)
        
        prompt = f"""Based on the following data, recommend top 3 crops:
        
Weather: Temperature {weather['temperature_avg']:.1f}°C, Humidity {weather['humidity_avg']:.1f}%, Rain probability {weather['precipitation_probability']:.1f}%
Soil: N={soil['nitrogen']}, P={soil['phosphorus']}, K={soil['potassium']}, pH={soil['ph']}
        
Provide: 1) Top 3 crop names, 2) Brief reasoning (2-3 sentences)"""
        
        message = UserMessage(text=prompt)
        response = await chat.send_message(message)
        
        return {"raw_response": response}
    
    async def get_fertilizer_advice(self, crop: str, farm_size: float, soil: Dict) -> Dict:
        system_msg = "You are an agricultural advisor. Provide simple, actionable fertilizer advice in non-technical terms."
        chat = self._get_chat("fertilizer", system_msg)
        
        prompt = f"""For a {farm_size} acre {crop} farm with soil N={soil['nitrogen']}, P={soil['phosphorus']}, K={soil['potassium']}, pH={soil['ph']}:
        
Provide simple fertilizer advice in this format:
- Urea: X bags (reason)
- DAP: X bags (reason)
- Potash: X bags (reason)
- Watering: advice based on conditions"""
        
        message = UserMessage(text=prompt)
        response = await chat.send_message(message)
        
        return {"advice_text": response}
    
    async def analyze_pest_risk(self, crop: str, weather: Dict) -> Optional[Dict]:
        system_msg = "You are a pest management expert. Analyze weather conditions for pest risks."
        chat = self._get_chat("pest", system_msg)
        
        prompt = f"""For {crop} crop with weather: temp {weather['temperature_avg']:.1f}°C, humidity {weather['humidity_avg']:.1f}%:
        
Is there high pest risk? If yes, provide:
1) Pest name
2) Risk level (High/Medium/Low)
3) 3 preventive measures

If no high risk, respond with 'NO_ALERT'."""
        
        message = UserMessage(text=prompt)
        response = await chat.send_message(message)
        
        if "NO_ALERT" in response:
            return None
        
        return {"alert_text": response}

class SpeechService:
    def __init__(self):
        self.speech_client = speech.SpeechClient()
        self.tts_client = texttospeech.TextToSpeechClient()
    
    async def transcribe_audio(self, audio_content: bytes, language: str = "english") -> Dict:
        language_codes = {
            "english": "en-US",
            "hindi": "hi-IN",
            "marathi": "mr-IN"
        }
        
        audio = speech.RecognitionAudio(content=audio_content)
        config = speech.RecognitionConfig(
            encoding=speech.RecognitionConfig.AudioEncoding.WEBM_OPUS,
            sample_rate_hertz=48000,
            language_code=language_codes.get(language, "en-US"),
            enable_automatic_punctuation=True
        )
        
        try:
            response = self.speech_client.recognize(config=config, audio=audio)
            
            if response.results:
                transcript = response.results[0].alternatives[0].transcript
                confidence = response.results[0].alternatives[0].confidence
                return {"transcript": transcript, "confidence": confidence}
            else:
                return {"transcript": "", "confidence": 0.0}
        except Exception as e:
            logger.error(f"Speech recognition error: {e}")
            return {"transcript": "", "confidence": 0.0, "error": str(e)}
    
    async def synthesize_speech(self, text: str, language: str = "english") -> bytes:
        voice_configs = {
            "english": {"language_code": "en-US", "name": "en-US-Neural2-C"},
            "hindi": {"language_code": "hi-IN", "name": "hi-IN-Neural2-A"},
            "marathi": {"language_code": "mr-IN", "name": "mr-IN-Standard-A"}
        }
        
        config = voice_configs.get(language, voice_configs["english"])
        
        synthesis_input = texttospeech.SynthesisInput(text=text)
        voice = texttospeech.VoiceSelectionParams(
            language_code=config["language_code"],
            name=config["name"]
        )
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3
        )
        
        try:
            response = self.tts_client.synthesize_speech(
                input=synthesis_input,
                voice=voice,
                audio_config=audio_config
            )
            return response.audio_content
        except Exception as e:
            logger.error(f"TTS error: {e}")
            return b""

# Initialize services
weather_service = WeatherService()
soil_service = SoilService()
gemini_service = GeminiService()
speech_service = SpeechService()

# ===== ENDPOINTS =====

@api_router.get("/")
async def root():
    return {"message": "Welcome to ArogyaMitti API", "status": "active"}

# User endpoints
@api_router.post("/users", response_model=User)
async def create_user(user: UserCreate):
    user_obj = User(**user.model_dump())
    doc = user_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.users.insert_one(doc)
    return user_obj

@api_router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str):
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if isinstance(user['created_at'], str):
        user['created_at'] = datetime.fromisoformat(user['created_at'])
    return User(**user)

# Crop recommendation endpoint
@api_router.post("/crop-recommendation")
async def get_crop_recommendation(latitude: float, longitude: float):
    try:
        # Get weather and soil data
        weather_data = await weather_service.get_forecast(latitude, longitude)
        soil_data = await soil_service.get_soil_data(latitude, longitude)
        
        # Get AI recommendation
        recommendation = await gemini_service.get_crop_recommendation(
            weather_data, soil_data, {"lat": latitude, "lon": longitude}
        )
        
        # Parse response (simplified)
        crops = []
        reasoning = recommendation['raw_response']
        
        # Extract crop names from response
        for line in reasoning.split('\n'):
            if any(word in line.lower() for word in ['1.', '2.', '3.', 'soybean', 'wheat', 'cotton', 'rice', 'maize', 'pigeon pea']):
                for crop in ['Soybean', 'Wheat', 'Cotton', 'Rice', 'Maize', 'Pigeon Pea', 'Tomato', 'Onion']:
                    if crop.lower() in line.lower() and crop not in crops:
                        crops.append(crop)
        
        if not crops:
            crops = ['Soybean', 'Wheat', 'Pigeon Pea']
        
        result = {
            "location": {"lat": latitude, "lon": longitude},
            "weather": weather_data,
            "soil": soil_data,
            "recommended_crops": crops[:3],
            "reasoning": reasoning,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        return result
    
    except Exception as e:
        logger.error(f"Crop recommendation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Fertilizer advice endpoint
@api_router.post("/fertilizer-advice")
async def get_fertilizer_advice(
    crop: str,
    farm_size_acres: float,
    latitude: float,
    longitude: float
):
    try:
        soil_data = await soil_service.get_soil_data(latitude, longitude)
        advice = await gemini_service.get_fertilizer_advice(crop, farm_size_acres, soil_data)
        
        return {
            "crop": crop,
            "farm_size_acres": farm_size_acres,
            "soil_data": soil_data,
            "advice": advice['advice_text'],
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        logger.error(f"Fertilizer advice error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Pest alert endpoint
@api_router.post("/pest-alert")
async def check_pest_alert(crop: str, latitude: float, longitude: float):
    try:
        weather_data = await weather_service.get_forecast(latitude, longitude)
        alert = await gemini_service.analyze_pest_risk(crop, weather_data)
        
        if alert:
            return {
                "has_alert": True,
                "crop": crop,
                "alert_details": alert['alert_text'],
                "weather_conditions": weather_data,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        else:
            return {
                "has_alert": False,
                "crop": crop,
                "message": "No significant pest risk detected",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
    except Exception as e:
        logger.error(f"Pest alert error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Mandi prices endpoint (mock data)
@api_router.get("/mandi-prices")
async def get_mandi_prices(crop: str, latitude: float, longitude: float):
    # Mock mandi data
    mandis = [
        {
            "mandi_name": "Nagpur Mandi",
            "location": "Nagpur, Maharashtra",
            "distance_km": 15.0,
            "crop": crop,
            "min_price": 6800,
            "max_price": 7100,
            "unit": "quintal",
            "maps_link": f"https://www.google.com/maps/dir/{latitude},{longitude}/Nagpur+Mandi"
        },
        {
            "mandi_name": "Wardha Mandi",
            "location": "Wardha, Maharashtra",
            "distance_km": 75.0,
            "crop": crop,
            "min_price": 7000,
            "max_price": 7250,
            "unit": "quintal",
            "maps_link": f"https://www.google.com/maps/dir/{latitude},{longitude}/Wardha+Mandi"
        },
        {
            "mandi_name": "Yavatmal Mandi",
            "location": "Yavatmal, Maharashtra",
            "distance_km": 120.0,
            "crop": crop,
            "min_price": 6900,
            "max_price": 7150,
            "unit": "quintal",
            "maps_link": f"https://www.google.com/maps/dir/{latitude},{longitude}/Yavatmal+Mandi"
        }
    ]
    
    return {"mandis": mandis, "timestamp": datetime.now(timezone.utc).isoformat()}

# Voice interface endpoint
@api_router.post("/voice-query")
async def process_voice_query(file: UploadFile = File(...), language: str = "english"):
    try:
        # Read audio file
        audio_content = await file.read()
        
        # Transcribe
        transcription = await speech_service.transcribe_audio(audio_content, language)
        
        if not transcription['transcript']:
            raise HTTPException(status_code=400, detail="Could not transcribe audio")
        
        # Generate response using Gemini
        system_msg = "You are a helpful agricultural assistant. Provide concise, practical advice to farmers."
        chat = gemini_service._get_chat("voice_query", system_msg)
        message = UserMessage(text=transcription['transcript'])
        response_text = await chat.send_message(message)
        
        # Synthesize response
        audio_response = await speech_service.synthesize_speech(response_text, language)
        
        # Encode audio as base64
        audio_base64 = base64.b64encode(audio_response).decode('utf-8')
        
        return {
            "transcript": transcription['transcript'],
            "confidence": transcription['confidence'],
            "response_text": response_text,
            "audio_response": audio_base64,
            "language": language
        }
    except Exception as e:
        logger.error(f"Voice query error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()