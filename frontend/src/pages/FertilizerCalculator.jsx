import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Calculator, Leaf, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const FertilizerCalculator = ({ location }) => {
  const [searchParams] = useSearchParams();
  const [crop, setCrop] = useState(searchParams.get('crop') || '');
  const [farmSize, setFarmSize] = useState('');
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!location) {
      toast.error('Location not available');
      return;
    }

    if (!crop || !farmSize) {
      toast.error('Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/fertilizer-advice`, null, {
        params: {
          crop,
          farm_size_acres: parseFloat(farmSize),
          latitude: location.lat,
          longitude: location.lon
        }
      });
      setAdvice(response.data);
      toast.success('Fertilizer advice generated!');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to generate advice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page" data-testid="fertilizer-calculator-page">
      <nav className="navbar">
        <div className="navbar-content">
          <Link to="/" className="navbar-brand">
            <Leaf size={28} />
            ArogyaMitti
          </Link>
          <ul className="navbar-menu">
            <li><Link to="/" className="navbar-link"><ArrowLeft size={16} /> Back</Link></li>
            <li><Link to="/crop-recommendation" className="navbar-link">Crop Recommendation</Link></li>
            <li><Link to="/fertilizer" className="navbar-link active">Fertilizer</Link></li>
            <li><Link to="/mandi-prices" className="navbar-link">Mandi Prices</Link></li>
            <li><Link to="/voice-assistant" className="navbar-link">Voice</Link></li>
          </ul>
        </div>
      </nav>

      <div className="container" style={{ maxWidth: '900px', padding: '3rem 2rem' }}>
        <div className="page-header">
          <h1 data-testid="page-title">
            <Calculator size={40} style={{ color: 'var(--accent)' }} />
            Fertilizer Calculator
          </h1>
          <p>Get simple, actionable fertilizer advice for your farm</p>
        </div>

        <div className="card" data-testid="calculator-form">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Select Crop *</label>
              <select 
                className="form-select" 
                value={crop} 
                onChange={(e) => setCrop(e.target.value)}
                data-testid="crop-select"
                required
              >
                <option value="">Choose a crop...</option>
                <option value="Soybean">Soybean</option>
                <option value="Wheat">Wheat</option>
                <option value="Cotton">Cotton</option>
                <option value="Rice">Rice</option>
                <option value="Maize">Maize</option>
                <option value="Pigeon Pea">Pigeon Pea</option>
                <option value="Tomato">Tomato</option>
                <option value="Onion">Onion</option>
                <option value="Potato">Potato</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Farm Size (acres) *</label>
              <input 
                type="number" 
                className="form-input" 
                value={farmSize} 
                onChange={(e) => setFarmSize(e.target.value)}
                placeholder="e.g., 2.5"
                step="0.1"
                min="0.1"
                data-testid="farm-size-input"
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
              data-testid="submit-btn"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {loading ? (
                <><Loader2 className="spinner" size={20} /> Calculating...</>
              ) : (
                <><Calculator size={20} /> Get Fertilizer Advice</>
              )}
            </button>
          </form>
        </div>

        {advice && !loading && (
          <div className="results" data-testid="results-container">
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Fertilizer Advice for {advice.crop}</h2>
                <p className="card-description">Farm Size: {advice.farm_size_acres} acres</p>
              </div>

              <div className="advice-content">
                <div className="soil-summary">
                  <h3>Your Soil Health</h3>
                  <div className="soil-badges">
                    <span className="badge badge-success">N: {advice.soil_data.nitrogen}</span>
                    <span className="badge badge-success">P: {advice.soil_data.phosphorus}</span>
                    <span className="badge badge-success">K: {advice.soil_data.potassium}</span>
                    <span className="badge badge-warning">pH: {advice.soil_data.ph}</span>
                  </div>
                </div>

                <div className="advice-text" data-testid="advice-text">
                  {advice.advice}
                </div>
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

        .results {
          margin-top: 2rem;
        }

        .soil-summary {
          background: var(--bg-secondary);
          padding: 1.5rem;
          border-radius: 12px;
          margin-bottom: 2rem;
        }

        .soil-summary h3 {
          font-size: 1.25rem;
          margin-bottom: 1rem;
          color: var(--text-primary);
        }

        .soil-badges {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .advice-text {
          white-space: pre-wrap;
          line-height: 1.8;
          font-size: 1.05rem;
          color: var(--text-primary);
        }

        .advice-content {
          padding-top: 1rem;
        }
      `}</style>
    </div>
  );
};

export default FertilizerCalculator;