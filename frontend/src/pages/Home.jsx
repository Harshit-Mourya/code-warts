import React from "react";
import { Link } from "react-router-dom";
import { Leaf, Calculator, TrendingUp, Bug, Mic, MapPin } from "lucide-react";

const Home = ({ location }) => {
  const features = [
    {
      icon: <Leaf size={32} />,
      title: "Crop Recommendation",
      description:
        "Get personalized crop suggestions based on soil, weather, and location data",
      link: "/crop-recommendation",
      color: "#4a7c59",
    },
    {
      icon: <Calculator size={32} />,
      title: "Fertilizer Calculator",
      description:
        "Calculate exact fertilizer requirements in simple, actionable terms",
      link: "/fertilizer",
      color: "#6b9c7a",
    },
    {
      icon: <TrendingUp size={32} />,
      title: "Mandi Prices",
      description:
        "Check real-time crop prices at nearby mandis with directions",
      link: "/mandi-prices",
      color: "#4a7c59",
    },
    {
      icon: <Bug size={32} />,
      title: "Pest Alerts",
      description:
        "Receive proactive alerts about potential pest and disease risks",
      link: "/pest-alerts",
      color: "#c5221f",
    },
    // {
    //   icon: <Mic size={32} />,
    //   title: 'Voice Assistant',
    //   description: 'Ask questions in your language and get instant voice responses',
    //   link: '/voice-assistant',
    //   color: '#6b9c7a'
    // }
  ];

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero" data-testid="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <MapPin size={16} />
            <span>
              {location
                ? `Location: ${location.lat.toFixed(2)}, ${location.lon.toFixed(
                    2
                  )}`
                : "Getting your location..."}
            </span>
          </div>
          <h1 className="hero-title" data-testid="hero-title">
            ArogyaMitti
          </h1>
          <p className="hero-subtitle">
            स्मार्ट कृषि सलाहकार मंच | Smart Agro-Advisory Platform
          </p>
          <p className="hero-description">
            Empowering farmers with AI-driven insights for better crop yields
            and sustainable farming practices
          </p>
          <div className="hero-actions">
            <Link
              to="/crop-recommendation"
              className="btn btn-primary btn-lg"
              data-testid="get-started-btn"
            >
              <Leaf size={20} />
              Get Started
            </Link>
            {/* <Link to="/voice-assistant" className="btn btn-secondary btn-lg" data-testid="voice-assistant-btn">
              <Mic size={20} />
              Voice Assistant
            </Link> */}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="features" data-testid="features-section">
        <div className="container">
          <h2 className="section-title">Our Features</h2>
          <div className="features-grid">
            {features.map((feature, index) => (
              <Link
                key={index}
                to={feature.link}
                className="feature-card"
                data-testid={`feature-card-${index}`}
                style={{ "--accent-color": feature.color }}
              >
                <div className="feature-icon" style={{ color: feature.color }}>
                  {feature.icon}
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
                <span className="feature-arrow">→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats" data-testid="stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">500+</div>
              <div className="stat-label">Farmers Helped</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">95%</div>
              <div className="stat-label">Accuracy Rate</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">3</div>
              <div className="stat-label">Languages Supported</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">24/7</div>
              <div className="stat-label">AI Assistance</div>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        .home-page {
          min-height: 100vh;
        }

        .hero {
          background: linear-gradient(135deg, #f8f6f3 0%, #e8f5e9 100%);
          padding: 6rem 2rem;
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        .hero::before {
          content: "";
          position: absolute;
          top: -50%;
          right: -20%;
          width: 600px;
          height: 600px;
          background: radial-gradient(
            circle,
            rgba(74, 124, 89, 0.1) 0%,
            transparent 70%
          );
          border-radius: 50%;
        }

        .hero-content {
          max-width: 900px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: white;
          border-radius: 20px;
          font-size: 0.875rem;
          margin-bottom: 2rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .hero-title {
          font-size: clamp(3rem, 8vw, 5rem);
          margin-bottom: 1rem;
          color: var(--accent);
          font-weight: 700;
        }

        .hero-subtitle {
          font-size: clamp(1.25rem, 3vw, 1.75rem);
          margin-bottom: 1rem;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .hero-description {
          font-size: 1.125rem;
          color: var(--text-secondary);
          margin-bottom: 2.5rem;
          max-width: 700px;
          margin-left: auto;
          margin-right: auto;
        }

        .hero-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .btn-lg {
          padding: 1rem 2rem;
          font-size: 1.05rem;
        }

        .features {
          padding: 5rem 0;
        }

        .section-title {
          text-align: center;
          font-size: 2.5rem;
          margin-bottom: 3rem;
          color: var(--text-primary);
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
        }

        .feature-card {
          background: white;
          padding: 2.5rem;
          border-radius: 20px;
          border: 2px solid var(--border);
          text-decoration: none;
          color: inherit;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .feature-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 4px;
          height: 0;
          background: var(--accent-color, var(--accent));
          transition: height 0.3s ease;
        }

        .feature-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
          border-color: var(--accent-color, var(--accent));
        }

        .feature-card:hover::before {
          height: 100%;
        }

        .feature-icon {
          margin-bottom: 1.5rem;
        }

        .feature-title {
          font-size: 1.5rem;
          margin-bottom: 0.75rem;
          color: var(--text-primary);
        }

        .feature-description {
          color: var(--text-secondary);
          line-height: 1.6;
          margin-bottom: 1rem;
        }

        .feature-arrow {
          font-size: 1.5rem;
          color: var(--accent);
          opacity: 0;
          transition: opacity 0.3s ease, transform 0.3s ease;
        }

        .feature-card:hover .feature-arrow {
          opacity: 1;
          transform: translateX(8px);
        }

        .stats {
          background: linear-gradient(135deg, #4a7c59 0%, #6b9c7a 100%);
          padding: 4rem 0;
          color: white;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 3rem;
          text-align: center;
        }

        .stat-number {
          font-size: 3rem;
          font-weight: 700;
          font-family: "Cormorant Garamond", serif;
          margin-bottom: 0.5rem;
        }

        .stat-label {
          font-size: 1rem;
          opacity: 0.9;
        }

        @media (max-width: 768px) {
          .hero {
            padding: 4rem 1.5rem;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 2rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Home;
