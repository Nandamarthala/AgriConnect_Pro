import { ArrowRight, BadgeCheck, CalendarCheck, MapPin, ShieldCheck, Star, Tractor, Users, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import BrandMark from '../components/BrandMark';
import './Landing.css';

const services = [
  { icon: '🚜', name: 'Tractors', detail: 'Power for every field' },
  { icon: '🌾', name: 'Harvesters', detail: 'Make harvest time count' },
  { icon: '⚙️', name: 'Rotavators', detail: 'Prepare soil with ease' },
  { icon: '🌱', name: 'Seeders', detail: 'Plant with precision' },
  { icon: '🧑‍🌾', name: 'Farm labour', detail: 'Find skilled local teams' },
  { icon: '🛠️', name: 'Cultivators', detail: 'Tools for healthy soil' },
];

const steps = [
  ['01', 'Create your account', 'Tell us where you farm and what you need.'],
  ['02', 'Explore local services', 'Compare nearby providers, prices and ratings.'],
  ['03', 'Request and get to work', 'Post a job and connect with available providers.'],
];

export default function Landing() {
  return (
    <main className="landing-page">
      <header className="landing-nav">
        <Link className="landing-brand" to="/" aria-label="AgriConnect Pro home">
          <BrandMark className="landing-brand-icon" />
          <span>AgriConnect <span>Pro</span></span>
        </Link>
        <nav className="landing-nav-links" aria-label="Main navigation">
          <a href="#services">Services</a>
          <a href="#how-it-works">How it works</a>
          <Link className="landing-signin" to="/login">Sign in</Link>
          <Link className="btn btn-primary landing-nav-cta" to="/register">Get started <ArrowRight size={16} /></Link>
        </nav>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-copy">
          <span className="landing-eyebrow"><span /> The local network for getting farm work done</span>
          <h1>Good work.<br /><span>Grows together.</span></h1>
          <p>Find reliable farm teams, book the right equipment, and bring your next season into focus—all through the people and services around you.</p>
          <div className="landing-hero-actions">
            <Link className="btn btn-primary btn-lg" to="/register">Get started <ArrowRight size={18} /></Link>
            <Link className="btn btn-outline btn-lg" to="/login">Explore services <Tractor size={18} /></Link>
          </div>
          <div className="landing-proof">
            <div className="landing-proof-avatars"><span>F</span><span>L</span><span>M</span><span>+</span></div>
            <div><div className="landing-proof-stars"><Star size={14} fill="currentColor" /> <b>Built around local knowledge</b></div><span>People, tools, and work in one place</span></div>
          </div>
        </div>
        <div className="landing-hero-visual" aria-label="Illustration representing connected farm services">
          <div className="landing-visual-sun" />
          <div className="landing-visual-cloud landing-cloud-one" />
          <div className="landing-visual-cloud landing-cloud-two" />
          <div className="landing-visual-hill hill-back" />
          <div className="landing-visual-hill hill-front" />
          <div className="landing-visual-field-lines" />
          <span className="landing-tractor">🌱</span>
          <div className="landing-floating-card"><span className="landing-card-check"><BadgeCheck size={18} /></span><div><b>One connected community</b><small>Work starts with a good match</small></div></div>
          <div className="landing-visual-caption"><MapPin size={15} /> Your local network</div>
        </div>
      </section>

      <section className="landing-trust-strip" aria-label="Platform benefits">
        <div><ShieldCheck size={19} /><span>Trusted local providers</span></div>
        <div><MapPin size={19} /><span>Services close to home</span></div>
        <div><Wallet size={19} /><span>Clear pricing upfront</span></div>
        <div><CalendarCheck size={19} /><span>Simple service requests</span></div>
      </section>

      <section className="landing-section" id="services">
        <div className="landing-section-heading">
          <div><span className="landing-eyebrow">WHAT YOU NEED, WHEN YOU NEED IT</span><h2>Popular farm services</h2></div>
          <Link to="/login" className="landing-text-link">Explore services <ArrowRight size={16} /></Link>
        </div>
        <div className="landing-service-grid">
          {services.map((service) => (
            <Link key={service.name} to="/login" className="landing-service-card">
              <span className="landing-service-icon">{service.icon}</span>
              <span className="landing-service-name">{service.name}</span>
              <span className="landing-service-detail">{service.detail}</span>
              <ArrowRight className="landing-service-arrow" size={17} />
            </Link>
          ))}
        </div>
      </section>

      <section className="landing-how" id="how-it-works">
        <div className="landing-section-heading">
          <div><span className="landing-eyebrow">FARMING MADE EASIER</span><h2>From search to service</h2></div>
          <p>Get what your farm needs with a few simple steps.</p>
        </div>
        <div className="landing-steps">
          {steps.map(([number, title, detail]) => (
            <article className="landing-step" key={number}>
              <span className="landing-step-number">{number}</span>
              <h3>{title}</h3><p>{detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-why">
        <div className="landing-why-copy">
          <span className="landing-eyebrow">ROOTED IN YOUR COMMUNITY</span>
          <h2>Good work grows<br />when we work together.</h2>
          <p>AgriConnect Pro brings farmers and service providers closer, helping you find the right support for the work ahead.</p>
          <Link className="btn btn-primary btn-lg" to="/register">Join AgriConnect Pro <ArrowRight size={18} /></Link>
        </div>
        <div className="landing-benefits">
          <div><BadgeCheck size={21} /><span><b>Provider profiles</b><small>See experience and community ratings.</small></span></div>
          <div><MapPin size={21} /><span><b>Nearby discovery</b><small>Explore work and services by location.</small></span></div>
          <div><Users size={21} /><span><b>Easy coordination</b><small>Keep requests and accepted work together.</small></span></div>
          <div><Star size={21} /><span><b>Community feedback</b><small>Share ratings after completed work.</small></span></div>
        </div>
      </section>

      <footer className="landing-footer">
        <Link className="landing-brand" to="/" aria-label="AgriConnect Pro home"><BrandMark className="landing-brand-icon" /><span>AgriConnect <span>Pro</span></span></Link>
        <span>Connecting local farms to the people and tools that help them grow.</span>
        <Link to="/login">Sign in <ArrowRight size={15} /></Link>
      </footer>
    </main>
  );
}
