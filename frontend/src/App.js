import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import '@/App.css';
import Home from './pages/Home';
import CropRecommendation from './pages/CropRecommendation';
import FertilizerCalculator from './pages/FertilizerCalculator';
import MandiPrices from './pages/MandiPrices';
import PestAlerts from './pages/PestAlerts';
import VoiceAssistant from './pages/VoiceAssistant';
import Dashboard from './pages/Dashboard';
import { Toaster } from 'sonner';

function App() {
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);

  useEffect(() => {
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        (error) => {
          console.error('Location error:', error);
          setLocationError(error.message);
          // Set default location (Nagpur, Maharashtra)
          setLocation({ lat: 21.1458, lon: 79.0882 });
        }
      );
    } else {
      setLocationError('Geolocation not supported');
      setLocation({ lat: 21.1458, lon: 79.0882 });
    }
  }, []);

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home location={location} />} />
          <Route path="/dashboard" element={<Dashboard location={location} />} />
          <Route path="/crop-recommendation" element={<CropRecommendation location={location} />} />
          <Route path="/fertilizer" element={<FertilizerCalculator location={location} />} />
          <Route path="/mandi-prices" element={<MandiPrices location={location} />} />
          <Route path="/pest-alerts" element={<PestAlerts location={location} />} />
          <Route path="/voice-assistant" element={<VoiceAssistant location={location} />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;