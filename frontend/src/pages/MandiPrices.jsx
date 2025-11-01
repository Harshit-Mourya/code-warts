import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { TrendingUp, Leaf, MapPin, Navigation, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const MandiPrices = ({ location }) => {
  const [crop, setCrop] = useState('Cotton');
  const [loading, setLoading] = useState(false);
  const [prices, setPrices] = useState(null);

  useEffect(() => {
    if (location && crop) {
      fetchPrices();
    }
  }, [location, crop]);

  const fetchPrices = async () => {
    if (!location) {
      toast.error('Location not available');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`${API}/mandi-prices`, {
        params: {
          crop,
          latitude: location.lat,
          longitude: location.lon
        }
      });
      setPrices(response.data);
    } catch (error) {
      console.error('Error fetching prices:', error);
      toast.error('Failed to fetch mandi prices');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page" data-testid="mandi-prices-page">
      <nav className="navbar">
        <div className="navbar-content">
          <Link to="/" className="navbar-brand">
            <Leaf size={28} />
            ArogyaMitti
          </Link>
          <ul className="navbar-menu">
            <li><Link to="/" className="navbar-link"><ArrowLeft size={16} /> Back</Link></li>
            <li><Link to="/crop-recommendation" className="navbar-link">Crop Recommendation</Link></li>
            <li><Link to="/fertilizer" className="navbar-link">Fertilizer</Link></li>
            <li><Link to="/mandi-prices" className="navbar-link active">Mandi Prices</Link></li>
            <li><Link to="/voice-assistant" className="navbar-link">Voice</Link></li>
          </ul>
        </div>
      </nav>

      <div className="container" style={{ maxWidth: '1200px', padding: '3rem 2rem' }}>
        <div className="page-header">
          <h1 data-testid="page-title">
            <TrendingUp size={40} style={{ color: 'var(--accent)' }} />
            Mandi Prices
          </h1>
          <p>Check current crop prices at nearby mandis</p>
        </div>

        <div className="card" data-testid="crop-selector">
          <div className="form-group">
            <label className="form-label">Select Crop</label>
            <select 
              className="form-select" 
              value={crop} 
              onChange={(e) => setCrop(e.target.value)}
              data-testid="crop-select"
            >
              <option value="Cotton">Cotton</option>
              <option value="Soybean">Soybean</option>
              <option value="Wheat">Wheat</option>
              <option value="Rice">Rice</option>
              <option value="Maize">Maize</option>
              <option value="Pigeon Pea">Pigeon Pea</option>
              <option value="Onion">Onion</option>
              <option value="Tomato">Tomato</option>
            </select>
          </div>
        </div>

        {loading && (
          <div className="loading-container" data-testid="loading-spinner">
            <Loader2 className="spinner" size={48} />
            <p>Fetching mandi prices...</p>
          </div>
        )}

        {prices && !loading && (
          <div className="mandis-grid" data-testid="mandis-grid">
            {prices.mandis.map((mandi, index) => (
              <div key={index} className="mandi-card" data-testid={`mandi-card-${index}`}>
                <div className="mandi-header">
                  <h3 className="mandi-name">{mandi.mandi_name}</h3>
                  <span className="mandi-distance">
                    <MapPin size={16} />
                    {mandi.distance_km} km
                  </span>
                </div>
                <div className="mandi-location">{mandi.location}</div>
                
                <div className="price-section">
                  <div className="price-label">Price Range (per {mandi.unit})</div>
                  <div className="price-range">
                    <div className="price-box">
                      <span className="price-label-sm">Min</span>
                      <span className="price-value">₹{mandi.min_price}</span>
                    </div>
                    <div className="price-divider">-</div>
                    <div className="price-box">
                      <span className="price-label-sm">Max</span>
                      <span className="price-value">₹{mandi.max_price}</span>
                    </div>
                  </div>
                </div>

                <a 
                  href={mandi.maps_link} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn btn-primary"
                  data-testid={`directions-btn-${index}`}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <Navigation size={18} />
                  Get Directions
                </a>
              </div>
            ))}
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

        .loading-container {
          text-align: center;
          padding: 4rem 2rem;
        }

        .loading-container p {
          margin-top: 1.5rem;
          color: var(--text-secondary);
          font-size: 1.1rem;
        }

        .mandis-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 2rem;
          margin-top: 2rem;
        }

        .mandi-card {
          background: white;
          border-radius: 16px;
          padding: 2rem;
          border: 2px solid var(--border);
          transition: all 0.3s ease;
        }

        .mandi-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
          border-color: var(--accent);
        }

        .mandi-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.5rem;
        }

        .mandi-name {
          font-size: 1.5rem;
          color: var(--text-primary);
          margin: 0;
        }

        .mandi-distance {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          background: var(--bg-secondary);
          padding: 0.375rem 0.75rem;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--accent);
        }

        .mandi-location {
          color: var(--text-secondary);
          margin-bottom: 1.5rem;
          font-size: 0.95rem;
        }

        .price-section {
          background: linear-gradient(135deg, #f8f6f3 0%, #e8f5e9 100%);
          padding: 1.5rem;
          border-radius: 12px;
          margin-bottom: 1.5rem;
        }

        .price-label {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin-bottom: 1rem;
          text-align: center;
        }

        .price-range {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
        }

        .price-box {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .price-label-sm {
          font-size: 0.75rem;
          text-transform: uppercase;
          color: var(--text-secondary);
          font-weight: 600;
          margin-bottom: 0.25rem;
        }

        .price-value {
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--accent);
          font-family: 'Cormorant Garamond', serif;
        }

        .price-divider {
          font-size: 1.5rem;
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
};

export default MandiPrices;