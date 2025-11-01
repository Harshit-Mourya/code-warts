import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Leaf, MapPin, Cloud, Droplets, ThermometerSun, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CropRecommendation = ({ location }) => {
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState(null);

  useEffect(() => {
    if (location) {
      fetchRecommendation();
    }
  }, [location]);

  const fetchRecommendation = async () => {
    if (!location) {
      toast.error('Location not available');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/crop-recommendation`, null, {
        params: {
          latitude: location.lat,
          longitude: location.lon
        }
      });
      setRecommendation(response.data);
      toast.success('Crop recommendation generated successfully!');
    } catch (error) {
      console.error('Error fetching recommendation:', error);
      toast.error('Failed to fetch recommendation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page" data-testid="crop-recommendation-page">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-content">
          <Link to="/" className="navbar-brand">
            <Leaf size={28} />
            ArogyaMitti
          </Link>
          <ul className="navbar-menu">
            <li><Link to="/" className="navbar-link"><ArrowLeft size={16} /> Back</Link></li>
            <li><Link to="/crop-recommendation" className="navbar-link active">Crop Recommendation</Link></li>
            <li><Link to="/fertilizer" className="navbar-link">Fertilizer</Link></li>
            <li><Link to="/mandi-prices" className="navbar-link">Mandi Prices</Link></li>
            <li><Link to="/voice-assistant" className="navbar-link">Voice</Link></li>
          </ul>
        </div>
      </nav>

      <div className="container" style={{ maxWidth: '1200px', padding: '3rem 2rem' }}>
        {/* Header */}
        <div className="page-header">
          <h1 data-testid="page-title">
            <Leaf size={40} style={{ color: 'var(--accent)' }} />
            Crop Recommendation
          </h1>
          <p>Get personalized crop suggestions based on your location, soil, and weather data</p>
        </div>

        {/* Location Card */}
        {location && (
          <div className="info-card" data-testid="location-card">
            <MapPin size={20} style={{ color: 'var(--accent)' }} />
            <span>Your Location: Lat {location.lat.toFixed(4)}, Lon {location.lon.toFixed(4)}</span>
          </div>
        )}

        {loading && (
          <div className="loading-container" data-testid="loading-spinner">
            <Loader2 className="spinner" size={48} />
            <p>Analyzing soil, weather, and location data...</p>
          </div>
        )}

        {recommendation && !loading && (
          <div className="results" data-testid="results-container">
            {/* Weather Card */}
            <div className="card" data-testid="weather-card">
              <div className="card-header">
                <h2 className="card-title">Current Weather Conditions</h2>
              </div>
              <div className="weather-grid">
                <div className="weather-item">
                  <ThermometerSun size={24} style={{ color: '#ff6b6b' }} />
                  <div>
                    <div className="weather-label">Temperature</div>
                    <div className="weather-value">{recommendation.weather.temperature_avg.toFixed(1)}°C</div>
                  </div>
                </div>
                <div className="weather-item">
                  <Droplets size={24} style={{ color: '#4dabf7' }} />
                  <div>
                    <div className="weather-label">Humidity</div>
                    <div className="weather-value">{recommendation.weather.humidity_avg.toFixed(1)}%</div>
                  </div>
                </div>
                <div className="weather-item">
                  <Cloud size={24} style={{ color: '#868e96' }} />
                  <div>
                    <div className="weather-label">Rain Probability</div>
                    <div className="weather-value">{recommendation.weather.precipitation_probability.toFixed(0)}%</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Soil Data Card */}
            <div className="card" data-testid="soil-card">
              <div className="card-header">
                <h2 className="card-title">Soil Health Data</h2>
              </div>
              <div className="soil-grid">
                <div className="soil-item">
                  <span className="soil-label">Nitrogen</span>
                  <span className="badge badge-success">{recommendation.soil.nitrogen}</span>
                </div>
                <div className="soil-item">
                  <span className="soil-label">Phosphorus</span>
                  <span className="badge badge-success">{recommendation.soil.phosphorus}</span>
                </div>
                <div className="soil-item">
                  <span className="soil-label">Potassium</span>
                  <span className="badge badge-success">{recommendation.soil.potassium}</span>
                </div>
                <div className="soil-item">
                  <span className="soil-label">pH Level</span>
                  <span className="badge badge-warning">{recommendation.soil.ph}</span>
                </div>
              </div>
            </div>

            {/* Recommended Crops */}
            <div className="card" data-testid="crops-card">
              <div className="card-header">
                <h2 className="card-title">Recommended Crops for Your Farm</h2>
                <p className="card-description">Based on 3-data-point analysis (Soil + Weather + Location)</p>
              </div>
              <div className="crops-grid">
                {recommendation.recommended_crops.map((crop, index) => (
                  <div key={index} className="crop-item" data-testid={`crop-${index}`}>
                    <div className="crop-rank">{index + 1}</div>
                    <div className="crop-name">{crop}</div>
                    <Link 
                      to={`/fertilizer?crop=${encodeURIComponent(crop)}`} 
                      className="btn btn-secondary btn-sm"
                      data-testid={`fertilizer-btn-${index}`}
                    >
                      Get Fertilizer Advice
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Reasoning */}
            <div className="card" data-testid="reasoning-card">
              <div className="card-header">
                <h2 className="card-title">Why These Crops?</h2>
              </div>
              <div className="reasoning-text">
                {recommendation.reasoning}
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .page-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .page-header h1 {
          font-size: 2.5rem;
          margin-bottom: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
        }

        .page-header p {
          color: var(--text-secondary);
          font-size: 1.1rem;
        }

        .info-card {
          background: white;
          padding: 1rem 1.5rem;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 2rem;
          border: 1px solid var(--border);
          box-shadow: 0 2px 8px var(--shadow);
        }

        .loading-container {
          text-align: center;
          padding: 4rem 2rem;
        }

        .loading-container p {
          margin-top: 1.5rem;
          color: var(--text-secondary);
          font-size: 1.1rem;
        }

        .results {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .weather-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 2rem;
        }

        .weather-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.5rem;
          background: var(--bg-secondary);
          border-radius: 12px;
        }

        .weather-label {
          font-size: 0.9rem;
          color: var(--text-secondary);
          margin-bottom: 0.25rem;
        }

        .weather-value {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .soil-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
        }

        .soil-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: var(--bg-secondary);
          border-radius: 10px;
        }

        .soil-label {
          font-weight: 600;
          color: var(--text-primary);
        }

        .crops-grid {
          display: grid;
          gap: 1.5rem;
        }

        .crop-item {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          padding: 1.5rem;
          background: linear-gradient(135deg, #f8f6f3 0%, #e8f5e9 100%);
          border-radius: 12px;
          border: 2px solid var(--border);
          transition: all 0.3s ease;
        }

        .crop-item:hover {
          transform: translateX(8px);
          border-color: var(--accent);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        }

        .crop-rank {
          width: 48px;
          height: 48px;
          background: var(--accent);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: 700;
          flex-shrink: 0;
        }

        .crop-name {
          flex: 1;
          font-size: 1.375rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .btn-sm {
          padding: 0.625rem 1.25rem;
          font-size: 0.9rem;
        }

        .reasoning-text {
          white-space: pre-wrap;
          line-height: 1.8;
          color: var(--text-secondary);
          font-size: 1rem;
        }
      `}</style>
    </div>
  );
};

export default CropRecommendation;