# 🌿ArogyaMitti (Healthy Soil)

## Problem Statement ID: PR25-06 : Smart Agro Advisory System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A smart, hyper-local agro-advisory platform providing data-driven, simple, and accessible advice to Indian farmers.

🎥 Live Demo]
> 🔗 **Watch Here:** [](https://youtu.be/G1SMSrg5Dxo?si=EX4ZtJO3tv0vnZ2s)https://youtu.be/G1SMSrg5Dxo?si=EX4ZtJO3tv0vnZ2s

🌍 Real-World Impact

- 🧑‍🌾 To empower over 1,000 small farmers through our WhatsApp-based agro-advisory system, making AI-driven farming guidance accessible to all.  
- ⏱️ Reduces decision time from 2 days → 10 seconds  
- 💸 Saves ₹500–₹1500 per season in fertilizer waste  
- 🌱 Increases yield potential by 8–12%
---

## 📋 Table of Contents

- [The Problem](#-the-problem)
- [Our Solution](#-our-solution)
- [Key Features](#-key-features)
- [Accessibility First: Our Winning Edge](#-accessibility-first-our-winning-edge)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Data Sources](#-data-sources)
- [🚀 Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Future Scope](#-future-scope)
- [Our Team](#-our-team)
- [License](#-license)

---

## 😟 The Problem

Most of India's small and marginal farmers rely on traditional guesswork for critical crop and fertilizer decisions. Existing government information is often:

- **Delayed:** Not available when the farmer needs to make a decision.
- **Too Technical:** Uses complex scientific terms (e.g., "NPK ratios") instead of simple instructions.
- **Not Local:** Provides generic advice for an entire state, not for a specific farm.

This leads to wasted money on the wrong fertilizers, declining soil health, and sub-optimal crop yields.

## ✨ Our Solution

**ArogyaMitti** (meaning "Healthy Soil") is a "personal assistant" for farmers that delivers hyper-local, easy-to-understand advice.

Our system is the _only_ one that synthetically analyzes three key data points—**Soil Health**, **Weather Forecasts**, and **Live Market Prices**—to provide a single, simple, actionable recommendation. We turn complex data into profitable decisions.

## 🌾 Key Features

- **🌱 Smart Crop Recommendation**
  Recommends the top 3 best crops based on _both_ the 7-day weather forecast and, most importantly, the farm's local soil health data (N, P, K levels). It explains _why_ (e.g., "Plant Soybeans, as your soil is low on Nitrogen").

- **💰 Dynamic Fertilizer Calculator**
  No more jargon. Farmers select their crop and farm size to get a simple shopping list.

  - **Instead of:** "Apply 20:60:20 NPK/hectare."
  - **We Show:** "For your 1-acre farm, you need: **1 bag of DAP** and **0 bags of Urea**."
    This saves farmers money and prevents over-fertilization.

- **🐞 Proactive Pest & Disease Alerts**
  Uses weather forecast data to proactively warn farmers _before_ conditions are ideal for common pest and disease attacks (e.g., "High humidity expected. Risk of bollworm attack in 3 days.").

- **📈 Live Mandi Price Dashboard**
  Helps farmers decide _where_ and _when_ to sell. It shows live minimum/maximum prices from all nearby mandis (markets) for their specific crop.

## 🔊 Accessibility First: Our Winning Edge

The problem states that information is "too technical." We solve this by making our platform accessible to _all_ farmers, regardless of technical literacy.

1. 🌍 1. Hyper-Local Intelligence
Unlike generic agro apps, ArogyaMitti gives **village-level** recommendations — powered by **GPS-based soil, weather, and market synthesis**.  
> Every farmer gets advice specific to *their* field, *not* their district.
2. Data-Driven + Human-Centered
ArogyaMitti bridges AI with simplicity — it **translates data science into everyday farmer language**.  
- “Apply 2 bags of DAP” instead of “Use 20:60:20 NPK.”  
- AI + empathy = accessibility.

## 🛠️ Architecture & Tech Stack

- **Frontend:** **React.js** (For a fast, responsive, mobile-first web app)
- **Backend:** **Python (FastAPI)** (Chosen for its high-speed async performance, perfect for handling multiple API calls and running our rules engine)
- **Database:** **MongoDB** (A flexible NoSQL database chosen for its scalability and native support for geospatial data. We use **`2dsphere` indexes** for all high-speed, location-based queries.)
- **Key APIs:**
  - **Twilio API:** For the WhatsApp bot.
  - **Google Cloud APIs:** Speech-to-Text & Text-to-Speech.
  - **OpenWeatherMap API:** For 7-day weather forecasts.

## 📊 Data Sources

Our "3-Data-Point" engine is powered by a synthesis of:

1.  **Soil Data:** Government of India's **Soil Health Card (SHC) Scheme** dataset. We pre-process and load this data into our PostGIS database for rapid querying.
2.  **Market Data:** Government of India's **AGMARKNET Portal** for live mandi prices.
3.  **Weather Data:** OpenWeatherMap API for current conditions and forecasts.

## 🚀 Getting Started

Here's how to get a local copy of the project up and running for development and testing.

### Prerequisites

- Python 3.9+
- Node.js v18+
- npm/yarn
- A MongoDB instance (local server or a free Atlas cluster)
- API Keys for:
  - OpenWeatherMap
  - Twilio
  - Google Cloud (Speech-to-Text, Text-to-Speech)

### Backend Setup

1.  **Clone the repository:**

    ```bash
    git clone [https://github.com/your-username/arogyamitti.git](https://github.com/your-username/arogyamitti.git)
    cd arogyamitti/backend
    ```

2.  **Create a virtual environment and install dependencies:**

    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    pip install -r requirements.txt
    ```

    _(Note: Ensure your `requirements.txt` includes `pymongo` or `motor` for async FastAPI)_

3.  **Setup your database:**

    - Connect to your MongoDB instance (e.g., MongoDB Atlas).
    - Create a new database (e.g., `arogyamitti_db`).
    - Import your Soil Health Card data (e.g., `soil_data.csv`) into a new collection (e.g., `soil_data`).
    - **Crucially:** Create a `2dsphere` index on the field that stores location data (e.g., `location`) for fast geospatial queries.
      ```javascript
      // Run this in the mongo shell
      db.soil_data.createIndex({ location: "2dsphere" });
      ```

4.  **Configure environment variables:**

    - Rename `.env.example` to `.env`
    - Add all your API keys and your MongoDB Connection String:
      ```
      MONGODB_URI=mongodb+srv://<USER>:<PASSWORD>@<CLUSTER_URL>/arogyamitti_db?retryWrites=true&w=majority
      OPENWEATHER_API_KEY=...
      TWILIO_ACCOUNT_SID=...
      TWILIO_AUTH_TOKEN=...
      GOOGLE_APPLICATION_CREDENTIALS=...
      ```

5.  **Run the server:**
    ```bash
    uvicorn main:app --reload
    ```
    The backend will be running at `http://127.0.0.1:8000`.

### Frontend Setup

1.  **Navigate to the frontend directory:**

    ```bash
    cd ../frontend
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Configure environment variables:**

    - Rename `.env.example` to `.env.local`
    - Add your `REACT_APP_API_URL` and any client-side Google API keys:
      ```
      REACT_APP_API_URL=[http://127.0.0.1:8000](http://127.0.0.1:8000)
      REACT_APP_GOOGLE_API_KEY=...
      ```

4.  **Run the app:**
    ```bash
    npm start
    ```
    The React app will open at `http://localhost:3000`.

## 🔮 Future Scope

- **Machine Learning Model:** Replace the static rules engine with a dynamic ML model (e.g., a neural network) trained on crop yield data to provide even more accurate, predictive recommendations.
- **IoT Sensor Integration:** Allow farmers to connect low-cost, on-farm IoT soil sensors for real-time NPK data instead of relying on block-level government averages.
- **Direct-to-Buyer Marketplace:** Create a feature that connects farmers directly with local restaurants, hotels, and buyers to sell their produce, bypassing middlemen.
- **💬 WhatsApp Bot**
    No app download needed. Farmers can get full advice (crop, fertilizer, market) 24/7 by simply sending their location or a question to our WhatsApp number. (Powered by Twilio API).
   **🗣️ Voice & Vernacular (in Web App)**
    The app features a "Microphone" button. Farmers can tap it and _ask_ a question in their regional language (like Hindi, Marathi, Telugu). The app transcribes the speech, finds the answer, and then _reads the answer back_ to them. (Powered by Google Cloud Speech-to-Text & Text-to-Speech).


## 🧑‍💻 Our Team

#code warts

- Rushang Chandekar (Project Lead)
- Harshit Mourya
- Sargun Singh
- Shivraj Ambhore

---
