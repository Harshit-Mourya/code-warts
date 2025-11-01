import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Mic, Leaf, Square, Loader2, Volume2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { ReactMic } from 'react-mic';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const VoiceAssistant = ({ location }) => {
  const [language, setLanguage] = useState('english');
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const audioRef = useRef(null);

  const startRecording = () => {
    setRecording(true);
    toast.info('Recording started... Speak now');
  };

  const stopRecording = () => {
    setRecording(false);
  };

  const onStop = async (recordedBlob) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', recordedBlob.blob, 'audio.webm');

      const res = await axios.post(
        `${API}/voice-query?language=${language}`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );

      setResponse(res.data);
      toast.success('Response generated!');

      // Play audio response
      if (res.data.audio_response && audioRef.current) {
        const audioSrc = `data:audio/mp3;base64,${res.data.audio_response}`;
        audioRef.current.src = audioSrc;
        audioRef.current.play();
      }
    } catch (error) {
      console.error('Error processing voice:', error);
      toast.error('Failed to process voice query');
    } finally {
      setLoading(false);
    }
  };

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
    }
  };

  return (
    <div className="page" data-testid="voice-assistant-page">
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
            <li><Link to="/voice-assistant" className="navbar-link active">Voice</Link></li>
          </ul>
        </div>
      </nav>

      <div className="container" style={{ maxWidth: '900px', padding: '3rem 2rem' }}>
        <div className="page-header">
          <h1 data-testid="page-title">
            <Mic size={40} style={{ color: 'var(--accent)' }} />
            Voice Assistant
          </h1>
          <p>Ask questions in your language and get instant voice responses</p>
        </div>

        <div className="card" data-testid="voice-interface">
          <div className="form-group">
            <label className="form-label">Select Language</label>
            <select 
              className="form-select" 
              value={language} 
              onChange={(e) => setLanguage(e.target.value)}
              data-testid="language-select"
              disabled={recording || loading}
            >
              <option value="english">English</option>
              <option value="hindi">Hindi (हिंदी)</option>
              <option value="marathi">Marathi (मराठी)</option>
            </select>
          </div>

          <div className="mic-container">
            <div className="mic-visualizer">
              <ReactMic
                record={recording}
                className="sound-wave"
                onStop={onStop}
                strokeColor="#4a7c59"
                backgroundColor="#f8f6f3"
                mimeType="audio/webm"
              />
            </div>

            <div className="mic-controls">
              {!recording && !loading && (
                <button 
                  onClick={startRecording} 
                  className="btn-mic"
                  data-testid="start-recording-btn"
                >
                  <Mic size={32} />
                </button>
              )}

              {recording && (
                <button 
                  onClick={stopRecording} 
                  className="btn-mic recording"
                  data-testid="stop-recording-btn"
                >
                  <Square size={32} />
                </button>
              )}

              {loading && (
                <div className="btn-mic loading">
                  <Loader2 className="spinner" size={32} />
                </div>
              )}
            </div>

            <p className="mic-instruction">
              {recording ? 'Recording... Tap to stop' : 
               loading ? 'Processing your query...' : 
               'Tap the microphone to start recording'}
            </p>
          </div>
        </div>

        {response && !loading && (
          <div className="results" data-testid="results-container">
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Your Question</h2>
              </div>
              <div className="transcript" data-testid="transcript">
                {response.transcript}
              </div>
              <div className="confidence">
                Confidence: {(response.confidence * 100).toFixed(0)}%
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Response</h2>
                <button 
                  onClick={playAudio} 
                  className="btn btn-secondary btn-sm"
                  data-testid="play-audio-btn"
                >
                  <Volume2 size={18} />
                  Play Audio
                </button>
              </div>
              <div className="response-text" data-testid="response-text">
                {response.response_text}
              </div>
            </div>
          </div>
        )}

        <audio ref={audioRef} style={{ display: 'none' }} />
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

        .mic-container {
          text-align: center;
          padding: 2rem 0;
        }

        .mic-visualizer {
          margin-bottom: 2rem;
          border-radius: 12px;
          overflow: hidden;
          height: 100px;
        }

        .sound-wave {
          width: 100% !important;
          height: 100px !important;
        }

        .mic-controls {
          display: flex;
          justify-content: center;
          margin-bottom: 1.5rem;
        }

        .btn-mic {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: var(--accent);
          color: white;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          box-shadow: 0 8px 24px rgba(74, 124, 89, 0.3);
        }

        .btn-mic:hover {
          transform: scale(1.05);
          box-shadow: 0 12px 32px rgba(74, 124, 89, 0.4);
        }

        .btn-mic.recording {
          background: #c5221f;
          animation: pulse 1.5s ease-in-out infinite;
        }

        .btn-mic.loading {
          background: var(--bg-secondary);
          color: var(--accent);
          cursor: not-allowed;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        .mic-instruction {
          font-size: 1.05rem;
          color: var(--text-secondary);
        }

        .results {
          margin-top: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .transcript {
          font-size: 1.125rem;
          line-height: 1.8;
          color: var(--text-primary);
          padding: 1rem;
          background: var(--bg-secondary);
          border-radius: 10px;
          margin-bottom: 1rem;
        }

        .confidence {
          font-size: 0.9rem;
          color: var(--text-secondary);
        }

        .response-text {
          font-size: 1.125rem;
          line-height: 1.8;
          color: var(--text-primary);
          white-space: pre-wrap;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
      `}</style>
    </div>
  );
};

export default VoiceAssistant;