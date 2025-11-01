import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Bug, Leaf, Loader2, AlertTriangle, CheckCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PestAlerts = ({ location }) => {
  const [crop, setCrop] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  const checkAlert = async () => {
    if (!location) {
      toast.error('Location not available');
      return;
    }

    if (!crop) {
      toast.error('Please select a crop');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/pest-alert`, null, {
        params: {
          crop,
          latitude: location.lat,
          longitude: location.lon
        }
      });
      setAlert(response.data);
      if (response.data.has_alert) {
        toast.warning('Pest alert detected!');
      } else {
        toast.success('No pest risk detected');
      }
    } catch (error) {
      console.error('Error checking alert:', error);
      toast.error('Failed to check pest alert');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page" data-testid="pest-alerts-page">
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
            <li><Link to="/mandi-prices" className="navbar-link">Mandi Prices</Link></li>
            <li><Link to="/voice-assistant" className="navbar-link">Voice</Link></li>
          </ul>
        </div>
      </nav>

      <div className="container" style={{ maxWidth: '900px', padding: '3rem 2rem' }}>
        <div className="page-header">
          <h1 data-testid="page-title">
            <Bug size={40} style={{ color: '#c5221f' }} />
            Pest & Disease Alerts
          </h1>
          <p>Get proactive alerts about potential pest and disease risks</p>
        </div>

        <div className="card" data-testid="alert-checker">
          <div className="form-group">
            <label className="form-label">Select Crop *</label>
            <select 
              className="form-select" 
              value={crop} 
              onChange={(e) => setCrop(e.target.value)}
              data-testid="crop-select"
            >
              <option value="">Choose a crop...</option>
              <option value="Cotton">Cotton</option>
              <option value="Soybean">Soybean</option>
              <option value="Wheat">Wheat</option>
              <option value="Rice">Rice</option>
              <option value="Maize">Maize</option>
              <option value="Tomato">Tomato</option>
              <option value="Potato">Potato</option>
            </select>
          </div>

          <button 
            onClick={checkAlert} 
            className="btn btn-primary" 
            disabled={loading || !crop}
            data-testid="check-alert-btn"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {loading ? (
              <><Loader2 className="spinner" size={20} /> Analyzing...</>
            ) : (
              <><Bug size={20} /> Check Pest Risk</>
            )}
          </button>
        </div>

        {alert && !loading && (
          <div className="results" data-testid="results-container">
            {alert.has_alert ? (
              <div className="alert-card alert-danger" data-testid="alert-warning">
                <div className="alert-header">
                  <AlertTriangle size={32} />
                  <h2>Pest Alert Detected!</h2>
                </div>
                <div className="alert-content">
                  <div className="alert-info">
                    <strong>Crop:</strong> {alert.crop}
                  </div>
                  <div className="alert-details">
                    {alert.alert_details}
                  </div>
                  {alert.weather_conditions && (
                    <div className="weather-info">
                      <h3>Current Weather Conditions</h3>
                      <p>Temperature: {alert.weather_conditions.temperature_avg?.toFixed(1)}°C</p>
                      <p>Humidity: {alert.weather_conditions.humidity_avg?.toFixed(1)}%</p>
                      <p>Rain Probability: {alert.weather_conditions.precipitation_probability?.toFixed(0)}%</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="alert-card alert-success" data-testid="alert-success">
                <div className="alert-header">
                  <CheckCircle size={32} />
                  <h2>No Significant Risk Detected</h2>
                </div>
                <div className="alert-content">
                  <div className="alert-info">
                    <strong>Crop:</strong> {alert.crop}
                  </div>
                  <p className="alert-message">{alert.message}</p>
                  <p className="alert-note">Continue monitoring your crops regularly for early detection of any issues.</p>
                </div>
              </div>
            )}
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

        .alert-card {
          padding: 2.5rem;
          border-radius: 16px;
          border: 2px solid;
        }

        .alert-danger {
          background: linear-gradient(135deg, #fce8e6 0%, #fff5f5 100%);
          border-color: #c5221f;
        }

        .alert-success {
          background: linear-gradient(135deg, #e6f4ea 0%, #f0fdf4 100%);
          border-color: #137333;
        }

        .alert-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .alert-danger .alert-header {
          color: #c5221f;
        }

        .alert-success .alert-header {
          color: #137333;
        }

        .alert-header h2 {
          font-size: 1.75rem;
          margin: 0;
        }

        .alert-content {
          line-height: 1.8;
        }

        .alert-info {
          margin-bottom: 1rem;
          font-size: 1.05rem;
        }

        .alert-details {
          white-space: pre-wrap;
          font-size: 1.05rem;
          color: var(--text-primary);
          margin-top: 1.5rem;
          padding: 1.5rem;
          background: white;
          border-radius: 12px;
        }

        .weather-info {
          margin-top: 1.5rem;
          padding: 1.5rem;
          background: white;
          border-radius: 12px;
        }

        .weather-info h3 {
          font-size: 1.25rem;
          margin-bottom: 1rem;
          color: var(--text-primary);
        }

        .weather-info p {
          margin: 0.5rem 0;
          color: var(--text-secondary);
        }

        .alert-message {
          font-size: 1.125rem;
          color: var(--text-primary);
          margin: 1rem 0;
        }

        .alert-note {
          margin-top: 1.5rem;
          padding: 1rem;
          background: white;
          border-radius: 8px;
          font-size: 0.95rem;
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
};

export default PestAlerts;