from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File
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
import base64
import google.generativeai as genai
import os
from typing import Dict, Optional
import httpx
from fastapi import APIRouter, HTTPException
from loguru import logger

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI(title="ArogyaMitti API")
api_router = APIRouter(prefix="/api")

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
    location: Dict[str, float]
    soil_type: str
    weather_data: Dict[str, Any]
    recommended_crops: List[str]
    reasoning: str


class FertilizerAdvice(BaseModel):
    crop: str
    farm_size_acres: float
    soil_data: Dict[str, Any]
    advice: Dict[str, Any]


# ===== SERVICES =====
class WeatherService:
    def __init__(self):
        self.api_key = os.getenv("OPENWEATHERMAP_API_KEY")
        self.base_url = "https://api.openweathermap.org/data/2.5"

    async def get_forecast(self, lat: float, lon: float) -> Dict:
        async with httpx.AsyncClient() as client:
            try:
                r = await client.get(
                    f"{self.base_url}/forecast",
                    params={
                        "lat": lat,
                        "lon": lon,
                        "appid": self.api_key,
                        "units": "metric",
                    },
                    timeout=10.0,
                )
                r.raise_for_status()
                data = r.json()
                forecasts = data.get("list", [])[:8]
                return {
                    "temperature_avg": sum(f["main"]["temp"] for f in forecasts)
                    / len(forecasts),
                    "humidity_avg": sum(f["main"]["humidity"] for f in forecasts)
                    / len(forecasts),
                    "precipitation_probability": max(
                        f.get("pop", 0) for f in forecasts
                    )
                    * 100,
                    "weather_main": forecasts[0]["weather"][0]["main"]
                    if forecasts
                    else "Clear",
                }
            except Exception as e:
                logger.error(f"Weather error: {e}")
                return {
                    "temperature_avg": 28.5,
                    "humidity_avg": 65.0,
                    "precipitation_probability": 40.0,
                    "weather_main": "Clear",
                }


class SoilService:
    async def get_soil_data(self, lat: float, lon: float) -> Dict:
        soil_data = await db.soil_health_cards.find_one(
            {
                "location": {
                    "$near": {
                        "$geometry": {
                            "type": "Point",
                            "coordinates": [lon, lat],
                        },
                        "$maxDistance": 50000,
                    }
                }
            },
            {"_id": 0},
        )
        if not soil_data:
            soil_data = {
                "nitrogen": "Medium",
                "phosphorus": "Medium",
                "potassium": "Medium",
                "ph": 6.8,
                "organic_carbon": "Medium",
            }
        return soil_data


class GeminiService:
    def __init__(self):
        # ⚠️ SECURITY WARNING: Don't hardcode API keys! Use environment variables
        self.api_key = "AIzaSyC3ZOdUBKW38J_Oz5d8l9t07CNz9Ce08wo"
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel('gemini-2.0-flash-exp')
    
    async def get_crop_recommendation(self, weather: Dict, soil: Dict, location: Dict) -> Dict:
        prompt = f"""You are an agricultural expert. Based on the following data, recommend top 3 crops:
        
Weather: Temperature {weather['temperature_avg']:.1f}°C, Humidity {weather['humidity_avg']:.1f}%, Rain probability {weather['precipitation_probability']:.1f}%
Soil: N={soil['nitrogen']}, P={soil['phosphorus']}, K={soil['potassium']}, pH={soil['ph']}
Location: {location}
        
Provide: 
1) Top 3 crop names
2) Brief reasoning for each (2-3 sentences)"""
        
        response = await self.model.generate_content_async(prompt)
        return {"raw_response": response.text}
    
    async def get_fertilizer_advice(self, crop: str, farm_size: float, soil: Dict) -> Dict:
        prompt = f"""You are an agricultural advisor. For a {farm_size} acre {crop} farm with soil N={soil['nitrogen']}, P={soil['phosphorus']}, K={soil['potassium']}, pH={soil['ph']}:
        
Provide simple fertilizer advice in this format:
- Urea: X bags (reason)
- DAP: X bags (reason)
- Potash: X bags (reason)
- Watering: advice based on conditions

Be practical and non-technical."""
        
        response = await self.model.generate_content_async(prompt)
        return {"advice_text": response.text}
    
    async def analyze_pest_risk(self, crop: str, weather: Dict) -> Optional[Dict]:
        prompt = f"""You are a pest management expert. For {crop} crop with weather: temp {weather['temperature_avg']:.1f}°C, humidity {weather['humidity_avg']:.1f}%:
        
Is there high pest risk? If yes, provide:
1) Pest name
2) Risk level (High/Medium/Low)
3) 3 preventive measures

If no high risk, respond with only 'NO_ALERT'."""
        
        response = await self.model.generate_content_async(prompt)
        
        if "NO_ALERT" in response.text:
            return None
        
        return {"alert_text": response.text}

# ===== INIT =====
weather_service = WeatherService()
soil_service = SoilService()
gemini_service = GeminiService()

# ===== ENDPOINTS =====
@api_router.get("/")
async def root():
    return {"message": "ArogyaMitti API active"}


@api_router.post("/users", response_model=User)
async def create_user(user: UserCreate):
    user_obj = User(**user.model_dump())
    await db.users.insert_one(user_obj.model_dump())
    return user_obj


@api_router.post("/crop-recommendation")
async def get_crop_recommendation(latitude: float, longitude: float):
    weather = await weather_service.get_forecast(latitude, longitude)
    soil = await soil_service.get_soil_data(latitude, longitude)
    rec = await gemini_service.get_crop_recommendation(weather, soil, {"lat": latitude, "lon": longitude})
    return {
        "location": {"lat": latitude, "lon": longitude},
        "weather": weather,
        "soil": soil,
        "recommended_crops": ["Soybean", "Cotton", "Pigeon Pea"],
        "reasoning": rec["raw_response"],
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@api_router.post("/fertilizer-advice")
async def get_fertilizer_advice(crop: str, farm_size_acres: float, latitude: float, longitude: float):
    soil = await soil_service.get_soil_data(latitude, longitude)
    advice = await gemini_service.get_fertilizer_advice(crop, farm_size_acres, soil)
    return {
        "crop": crop,
        "farm_size_acres": farm_size_acres,
        "soil_data": soil,
        "advice": advice["advice_text"],
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


# @api_router.get("/mandi-prices")
# async def get_mandi_prices(crop: str, latitude: float, longitude: float):
#     return {
#         "mandis": [
#             {"mandi_name": "Nagpur", "min_price": 6800, "max_price": 7100, "unit": "quintal"},
#             {"mandi_name": "Wardha", "min_price": 7000, "max_price": 7250, "unit": "quintal"},
#         ]
#     }

@api_router.get("/mandi-prices")
async def get_mandi_prices(crop: str, latitude: float, longitude: float):
    try:
        api_url = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"
        params = {
            "api-key": "579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b",
            "format": "json",
            "filters[commodity]": crop,
            "limit": 5,
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(api_url, params=params)
            logger.info(f"Mandi API URL: {resp.url}")
            logger.info(f"Status: {resp.status_code}, Response: {resp.text[:500]}")
            resp.raise_for_status()
            data = resp.json()

        records = data.get("records", [])
        if not records:
            raise HTTPException(status_code=404, detail="No mandi prices found")

        mandis = [
            {
                "mandi_name": r.get("market", "Unknown"),
                "state": r.get("state"),
                "district": r.get("district"),
                "min_price": int(r.get("min_price", 0)),
                "max_price": int(r.get("max_price", 0)),
                "unit": r.get("price_unit", "quintal"),
            }
            for r in records
        ]

        return {"mandis": mandis[:5]}

    except Exception as e:
        logger.error(f"Mandi API error: {e}")
        raise HTTPException(status_code=500, detail="Error fetching mandi prices")


# ===== Register API router =====
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
