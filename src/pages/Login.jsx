import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { useApp } from '../context/AppContext';
import BrandMark from '../components/BrandMark';
import './Login.css';

const demoAccounts = import.meta.env.DEV ? [
  { role: 'Farmer', email: 'farmer@connectpro.demo', password: 'ConnectProDemo!2026' },
  { role: 'Labour worker', email: 'labour@connectpro.demo', password: 'ConnectProDemo!2026' },
  { role: 'Machine owner', email: 'machine@connectpro.demo', password: 'ConnectProDemo!2026' },
  { role: 'Administrator', email: 'admin@connectpro.demo', password: 'ConnectProDemo!2026' },
] : [];

export default function Login() {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const { login } = useAuth();
  const { showToast } = useApp();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    setLoading(true);
    setApiError('');
    try {
      await login(data.identifier, data.password, rememberMe);
      showToast('Welcome back! 👋');
      navigate('/home');
    } catch (err) {
      setApiError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page" id="login-page">
      <main className="login-scene">
        <img
          className="login-hero-image"
          src="/images/tractor-plowing-india.jpg"
          alt=""
          aria-hidden="true"
          fetchPriority="high"
        />
        <aside className="login-pitch">
          <span className="login-pitch-kicker">AGRICONNECT PRO / LOCAL AGRICULTURE</span>
          <h2>More hands.<br />Better tools.<br /><span>Stronger seasons.</span></h2>
          <p>Find the people and equipment that move your farm forward.</p>
        </aside>
        <section className="login-panel" aria-labelledby="login-title">
          <Link className="login-brand" to="/" aria-label="AgriConnect Pro home">
            <BrandMark className="login-brand-mark" />
            <span>AgriConnect <span>Pro</span></span>
          </Link>
          <h1 className="login-title" id="login-title">Log in</h1>

          <form onSubmit={handleSubmit(onSubmit)} className="login-form" noValidate>
            {apiError && <div className="login-error" id="login-api-error" role="alert">{apiError}</div>}

            <div className="input-group">
              <label className="input-label" htmlFor="login-identifier">Email or mobile number</label>
              <div className="login-input-wrap">
                <Mail className="login-field-icon" size={17} />
                <input
                  id="login-identifier"
                  type="text"
                  autoComplete="username"
                  className={`input-field ${errors.identifier ? 'input-error' : ''}`}
                  placeholder="Enter email or mobile number"
                  aria-invalid={Boolean(errors.identifier)}
                  aria-describedby={errors.identifier ? 'login-identifier-error' : undefined}
                  {...register('identifier', {
                    required: 'Email address or mobile number is required',
                    validate: (value) =>
                      /^\S+@\S+\.\S+$/.test(value.trim()) || /^[6-9]\d{9}$/.test(value.trim()) ||
                      'Enter a valid email address or 10-digit mobile number',
                  })}
                />
              </div>
              {errors.identifier && <span className="field-error" id="login-identifier-error">{errors.identifier.message}</span>}
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="login-password">Password</label>
              <div className="login-input-wrap">
                <LockKeyhole className="login-field-icon" size={17} />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={`input-field ${errors.password ? 'input-error' : ''}`}
                  placeholder="Enter password"
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? 'login-password-error' : undefined}
                  {...register('password', { required: 'Password is required' })}
                />
                <button
                  type="button"
                  className="login-pw-toggle"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {errors.password && <span className="field-error" id="login-password-error">{errors.password.message}</span>}
            </div>

            <Link to="/forgot-password" className="login-forgot-link" id="login-forgot-link">Forgot password?</Link>

            <label className="login-remember">
              <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} />
              <span>Remember me</span>
            </label>
            {!rememberMe && <span className="login-session-note">You’ll be signed out when you close this tab.</span>}

            <button id="login-submit" type="submit" className="btn btn-primary btn-lg login-submit" disabled={loading}>
              {loading ? <><span className="login-spinner" /> Signing in...</> : 'Log in'}
            </button>
          </form>

          {demoAccounts.length > 0 && (
            <details className="login-demo">
              <summary>Try a local demo account</summary>
              <p>Development only · demo password: <code>ConnectProDemo!2026</code></p>
              <div className="login-demo-grid">
                {demoAccounts.map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    className="login-demo-account"
                    onClick={() => {
                      setValue('identifier', account.email, { shouldValidate: true });
                      setValue('password', account.password, { shouldValidate: true });
                      setApiError('');
                    }}
                  >
                    <span>{account.role}</span>
                    <span>Use demo</span>
                  </button>
                ))}
              </div>
            </details>
          )}

          <div className="login-register">
            <span>Don’t have an account? </span>
            <Link to="/register" id="login-register-link">Sign up</Link>
          </div>
        </section>
      </main>
    </div>
  );
}
