import React from 'react';
import { Link } from 'react-router-dom';
import Footer from './Footer';

const LandingPage = () => {
  return (
    <div className="landing-page">
      <section className="landing-header">
        <div className="header-text">
          <h1 className="app-title">LeadNest</h1>
          <p className="app-tagline">Agile Project Management Made Simple</p>
          <div className="header-cta">
            <Link to="/signup" className="btn btn-primary btn-lg">
              Get Started
            </Link>
          </div>
        </div>
        <div className="header-logo">
          <img src="/logo.png" alt="KarmaSync Logo" className="app-logo" />
        </div>
      </section>

      <section className="landing-about">
        <div className="about-content">
          <h2>About LeadNest</h2>
          <p>
          LeadNest is a lightweight project and task management tool for individuals and teams. Plan projects, track progress, and collaborate effortlessly. It also includes a personal to-do manager to organize daily tasks, prioritize goals, and boost productivity — all from one clean dashboard.
                   </p>
        </div>
      </section>

      <section className="landing-team">
        <h2>Our Team</h2>
        <div className="team-members">
          <div className="team-member">
            <p>M. Tirupati Patra</p>
          </div>
          <div className="team-member">
            <p>Piyush Pattnaik</p>
          </div>
          <div className="team-member">
            <p>Jignesh Patra</p>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default LandingPage; 