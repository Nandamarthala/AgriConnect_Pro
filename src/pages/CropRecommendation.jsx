import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Spinner from '../components/Spinner';
import { useAuth } from '../context/useAuth';
import { cropService } from '../services/cropService';
import { ALL_STATES } from '../constants/categories';
import './CropRecommendation.css';

const SEASONS = [
  { id: 'kharif', label: 'Kharif', desc: 'Jun – Nov (Monsoon)', icon: '🌧️' },
  { id: 'rabi', label: 'Rabi', desc: 'Nov – Apr (Winter)', icon: '❄️' },
];

const getProfileStateId = (state) => {
  const normalizedState = String(state || '').trim().toLowerCase();
  return ALL_STATES.find((item) =>
    item.id === normalizedState || item.name.toLowerCase() === normalizedState
  )?.id || '';
};

const getCurrentSeason = () => {
  const month = new Date().getMonth() + 1;
  return month >= 6 && month <= 11 ? 'kharif' : 'rabi';
};

export default function CropRecommendation() {
  const { user } = useAuth();
  const profileStateId = getProfileStateId(user?.state);
  const [state, setState] = useState(profileStateId);
  const [season, setSeason] = useState(getCurrentSeason);
  const [crops, setCrops] = useState([]);
  const [isGeneral, setIsGeneral] = useState(false);
  const [loading, setLoading] = useState(Boolean(profileStateId));
  const [error, setError] = useState('');
  const selectedState = ALL_STATES.find((item) => item.id === state);

  useEffect(() => {
    let active = true;
    if (!state) return () => { active = false; };

    const fetchCrops = async () => {
      try {
        const data = await cropService.getRecommendations(state, season);
        if (active) {
          setCrops(data.crops || []);
          setIsGeneral(Boolean(data.isGeneral));
          setError('');
        }
      } catch (err) {
        if (active) setError(err.message || 'Crop recommendations could not be loaded.');
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchCrops();
    return () => { active = false; };
  }, [state, season]);

  const riskColor = (r) => r === 'low' ? 'var(--success)' : r === 'medium' ? 'var(--warning)' : 'var(--error)';

  return (
    <Layout title="Crop Recommendation" showBack>
      <div id="crop-recommendation-page">
        <div className="input-group">
          <label className="input-label">Select State</label>
          <select id="crop-state" className="input-field select-field"
            value={state}
            onChange={(event) => {
              const nextState = event.target.value;
              setError('');
              setLoading(Boolean(nextState));
              if (!nextState) {
                setCrops([]);
                setIsGeneral(false);
              }
              setState(nextState);
            }}>
            <option value="">Choose your state</option>
            {ALL_STATES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <p className="crop-location-note">
            {selectedState
              ? isGeneral
                ? `Location: ${selectedState.name}. Showing general seasonal suggestions until local crop data is configured.`
                : `Recommendations are set to your profile state: ${selectedState.name}.`
              : 'Choose a state to see seasonal recommendations.'}
          </p>
        </div>

        <div className="crop-seasons">
          {SEASONS.map(s => (
            <button key={s.id} id={`season-${s.id}`}
              className={`season-card card ${season === s.id ? 'season-selected' : ''}`}
              type="button"
              onClick={() => {
                if (season !== s.id) {
                  setError('');
                  setLoading(true);
                }
                setSeason(s.id);
              }}>
              <span className="season-icon">{s.icon}</span>
              <span className="season-label">{s.label}</span>
              <span className="season-desc">{s.desc}</span>
            </button>
          ))}
        </div>

        {loading && <Spinner text="Getting recommendations..." />}
        {error && <p className="crop-error" role="alert">{error}</p>}

        {!loading && crops.length > 0 && (
          <div className="crop-grid">
            {crops.map((crop, i) => (
              <div key={i} className="crop-card card">
                <div className="crop-top">
                  <span className="crop-emoji">{crop.emoji}</span>
                  <div>
                    <h3 className="crop-name">{crop.name}</h3>
                    <span className="crop-risk" style={{ color: riskColor(crop.risk) }}>
                      ● {crop.risk} risk
                    </span>
                  </div>
                </div>
                <div className="crop-details">
                  <div className="crop-detail"><span>📅</span> {crop.season || season}</div>
                  <div className="crop-detail"><span>📦</span> {crop.yield}</div>
                  <div className="crop-detail"><span>💧</span> Water: {crop.water}</div>
                  <div className="crop-detail"><span>🌍</span> {crop.soil}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && state && crops.length === 0 && !error && (
          <div className="crop-empty">
            <p>No crops found for the selected state and season.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
