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
    async def get_crop_recommendation(self, weather, soil, location):
        return {
            "raw_response": (
                "1. Soybean – good match for moderate temperature.\n"
                "2. Cotton – suitable for warm dry weather.\n"
                "3. Pigeon Pea – tolerates medium rainfall well."
            )
        }

    async def get_fertilizer_advice(self, crop, farm_size, soil):
        return {
            "advice_text": f"Use balanced NPK fertilizer for {crop}. Apply 2 bags urea, 1 bag DAP per acre."
        }

    async def analyze_pest_risk(self, crop, weather):
        if weather["humidity_avg"] > 70:
            return {"alert_text": f"High pest risk for {crop}. Spray neem extract weekly."}
        return None


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


@api_router.get("/mandi-prices")
async def get_mandi_prices(crop: str, latitude: float, longitude: float):
    return {
        "mandis": [
            {"mandi_name": "Nagpur", "min_price": 6800, "max_price": 7100, "unit": "quintal"},
            {"mandi_name": "Wardha", "min_price": 7000, "max_price": 7250, "unit": "quintal"},
        ]
    }


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

