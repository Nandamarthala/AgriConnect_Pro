import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Leaf, RotateCcw, UploadCloud } from 'lucide-react';
import Layout from '../components/Layout';
import Spinner from '../components/Spinner';
import { diseaseService } from '../services/diseaseService';
import './DiseaseDetection.css';

const ACCEPTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export default function DiseaseDetection() {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState('');
  const fileRef = useRef(null);

  useEffect(() => {
    let active = true;
    diseaseService.getHistory()
      .then((data) => {
        if (active) setHistory(data.scans || []);
      })
      .catch((err) => {
        if (active) setHistoryError(err.message || 'Scan history could not be loaded.');
      })
      .finally(() => {
        if (active) setHistoryLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (preview?.startsWith('blob:')) {
      return () => URL.revokeObjectURL(preview);
    }
    return undefined;
  }, [preview]);

  const handleFile = async (file) => {
    if (!file) return;
    setError('');
    setResult(null);

    if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
      setError('Choose a JPG, PNG, or WebP image.');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError('Image must be 5 MB or smaller.');
      return;
    }

    setPreview(URL.createObjectURL(file));
    setLoading(true);

    try {
      const data = await diseaseService.detect(file);
      setResult(data);
      setHistory((current) => [
        data,
        ...current.filter((scan) => (scan._id || scan.scanId) !== (data._id || data.scanId)),
      ].slice(0, 10));
    } catch (err) {
      setError(err.message || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileInput = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    handleFile(file);
  };

  const openPreviousScan = (scan) => {
    setResult(scan);
    setPreview(scan.imageUrl || null);
    setError('');
  };

  const startAnotherScan = () => {
    setResult(null);
    setPreview(null);
    setError('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const severityColor = (s) => s === 'high' ? 'var(--error)' : s === 'medium' ? 'var(--warning)' : 'var(--success)';
  const scanId = (scan) => scan._id || scan.scanId;

  return (
    <Layout title="Disease Detection" showBack>
      <div id="disease-detection-page">
        <button
          type="button"
          className={`disease-upload-area ${isDragging ? 'is-dragging' : ''} ${preview ? 'has-preview' : ''}`}
          disabled={loading}
          onClick={(event) => {
            if (event.target !== fileRef.current) fileRef.current?.click();
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            handleFile(event.dataTransfer.files?.[0]);
          }}
          aria-describedby="disease-upload-hint"
        >
          {preview ? (
            <img src={preview} alt="Selected plant preview" className="disease-preview-img" />
          ) : (
            <span className="disease-upload-icon"><UploadCloud size={28} /></span>
          )}
          <span className="disease-upload-copy">
            <span className="disease-upload-text">
              {preview ? 'Choose another plant photo' : 'Tap to upload or drag and drop a plant photo'}
            </span>
            <span className="disease-upload-hint" id="disease-upload-hint">
              JPG, PNG, or WebP · 5 MB maximum
            </span>
          </span>
          <input
            ref={fileRef}
            id="disease-image-input"
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            hidden
            disabled={loading}
            onChange={handleFileInput}
          />
        </button>

        {error && <div className="disease-error" role="alert">{error}</div>}

        {loading && <Spinner text="Analyzing plant... Please wait" />}

        {result && (
          <div className="disease-result">
            {result.isHealthy ? (
              <div className="disease-healthy card">
                <CheckCircle2 className="disease-icon" size={30} />
                <h2>Plant is Healthy!</h2>
                <p>No diseases detected. Keep up the good farm care!</p>
              </div>
            ) : (
              <div className="disease-card card">
                <div className="disease-header">
                  <span className="disease-icon">{result.disease?.icon || '🦠'}</span>
                  <div>
                    <h2 className="disease-name">{result.disease?.name}</h2>
                    <div className="disease-meta">
                      <span className="disease-confidence">
                        {result.disease?.confidence}% confidence
                      </span>
                      <span className="disease-severity" style={{ color: severityColor(result.disease?.severity) }}>
                        ● {result.disease?.severity} severity
                      </span>
                    </div>
                    {result.disease?.crop && <span className="disease-crop-badge badge badge-primary">{result.disease.crop}</span>}
                  </div>
                </div>

                {result.disease?.cause && (
                  <div className="disease-section">
                    <h3>🔬 Cause</h3>
                    <p>{result.disease.cause}</p>
                  </div>
                )}

                {result.disease?.symptoms?.length > 0 && (
                  <div className="disease-section">
                    <h3>⚠️ Symptoms</h3>
                    <ul>{result.disease.symptoms.map((s, i) => <li key={i}>{s}</li>)}</ul>
                  </div>
                )}

                {result.disease?.prevention?.length > 0 && (
                  <div className="disease-section">
                    <h3>🛡️ Prevention</h3>
                    <ul>{result.disease.prevention.map((p, i) => <li key={i}>{p}</li>)}</ul>
                  </div>
                )}

                {result.disease?.medicine?.length > 0 && (
                  <div className="disease-section disease-medicine">
                    <h3>💊 Recommended Treatment</h3>
                    <ul>{result.disease.medicine.map((m, i) => <li key={i}>{m}</li>)}</ul>
                  </div>
                )}

              </div>
            )}

            <button className="btn btn-ghost btn-lg" type="button" onClick={startAnotherScan}>
              <RotateCcw size={17} /> Scan Another Plant
            </button>
          </div>
        )}

        <section className="disease-history" aria-labelledby="disease-history-title">
          <div className="disease-history-heading">
            <div>
              <h2 id="disease-history-title">Your scan history</h2>
              <p>Saved privately to your AgriConnect Pro account</p>
            </div>
            <Leaf size={21} aria-hidden="true" />
          </div>
          {historyLoading ? (
            <p className="disease-history-message">Loading your scans...</p>
          ) : historyError ? (
            <p className="disease-history-message disease-history-error" role="alert">{historyError}</p>
          ) : history.length === 0 ? (
            <p className="disease-history-message">Your completed scans will appear here.</p>
          ) : (
            <div className="disease-history-list">
              {history.map((scan) => (
                <button
                  type="button"
                  className="disease-history-item"
                  key={scanId(scan)}
                  onClick={() => openPreviousScan(scan)}
                >
                  <span className={`disease-history-status ${scan.isHealthy ? 'healthy' : 'attention'}`}>
                    {scan.isHealthy ? 'Healthy' : scan.disease?.name || 'Result'}
                  </span>
                  <span className="disease-history-meta">
                    {scan.createdAt ? new Date(scan.createdAt).toLocaleString() : 'Saved scan'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
