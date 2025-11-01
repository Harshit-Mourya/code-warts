import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Calculator, TrendingUp, Bug, Mic, ArrowLeft } from 'lucide-react';

const Dashboard = ({ location }) => {
  return (
    <div className="page" data-testid="dashboard-page">
      <nav className="navbar">
        <div className="navbar-content">
          <Link to="/" className="navbar-brand">
            <Leaf size={28} />
            ArogyaMitti
          </Link>
          <ul className="navbar-menu">
            <li><Link to="/" className="navbar-link"><ArrowLeft size={16} /> Back</Link></li>
          </ul>
        </div>
      </nav>

      <div className="container" style={{ maxWidth: '1200px', padding: '3rem 2rem' }}>
        <div className="page-header">
          <h1 data-testid="page-title">Dashboard</h1>
          <p>Access all ArogyaMitti features from one place</p>
        </div>

        <div className="dashboard-grid">
          <Link to="/crop-recommendation" className="dashboard-card" data-testid="crop-card">
            <Leaf size={48} style={{ color: '#4a7c59' }} />
            <h3>Crop Recommendation</h3>
            <p>Get AI-powered crop suggestions</p>
          </Link>

          <Link to="/fertilizer" className="dashboard-card" data-testid="fertilizer-card">
            <Calculator size={48} style={{ color: '#6b9c7a' }} />
            <h3>Fertilizer Calculator</h3>
            <p>Calculate fertilizer requirements</p>
          </Link>

          <Link to="/mandi-prices" className="dashboard-card" data-testid="mandi-card">
            <TrendingUp size={48} style={{ color: '#4a7c59' }} />
            <h3>Mandi Prices</h3>
            <p>Check current market prices</p>
          </Link>

          <Link to="/pest-alerts" className="dashboard-card" data-testid="pest-card">
            <Bug size={48} style={{ color: '#c5221f' }} />
            <h3>Pest Alerts</h3>
            <p>Get pest risk assessments</p>
          </Link>

          <Link to="/voice-assistant" className="dashboard-card" data-testid="voice-card">
            <Mic size={48} style={{ color: '#6b9c7a' }} />
            <h3>Voice Assistant</h3>
            <p>Ask questions using voice</p>
          </Link>
        </div>
      </div>

      <style jsx>{`
        .page-header {
          text-align: center;
          margin-bottom: 4rem;
        }

        .page-header h1 {
          font-size: 3rem;
          margin-bottom: 0.75rem;
        }

        .page-header p {
          color: var(--text-secondary);
          font-size: 1.2rem;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 2rem;
        }

        .dashboard-card {
          background: white;
          padding: 3rem 2rem;
          border-radius: 20px;
          border: 2px solid var(--border);
          text-decoration: none;
          color: inherit;
          text-align: center;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .dashboard-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
          border-color: var(--accent);
        }

        .dashboard-card h3 {
          font-size: 1.5rem;
          margin: 0;
        }

        .dashboard-card p {
          color: var(--text-secondary);
          margin: 0;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;