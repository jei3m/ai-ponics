import React, {useEffect } from 'react';
import { Layout } from 'antd';
import './css/LandingPage.css';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import LandingTempHumidCard from './components/Landingpage/LandingTempHumidCard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLeaf, faThermometerHalf, faEnvelope, faCloud, faLayerGroup, faMessage, faLink, faExternalLink } from '@fortawesome/free-solid-svg-icons';

const LandingPage = () => {

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
        if (user) {
            navigate('/home');
        }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleGoogleSignIn = async () => {
    try {
        await signInWithPopup(auth, googleProvider);
        navigate('/home'); // Redirect to sensors page after successful login
    } catch (error) {
        console.error('Error signing in with Google:', error);
    }
  };

  const features = [
    {
      icon: faLeaf,
      title: "Plant State Detection",
      description: "Powered by Gemini 2.0 Flash AI to analyze images and assess plant health, identify diseases, and provide growth insights."
    },
    {
      icon: faThermometerHalf,
      title: "Real-Time Sensor Monitoring",
      description: "Track temperature, humidity, and pH level remotely with Blynk API integration."
    },
    {
      icon: faMessage,
      title: "AI-Powered Chatbot",
      description: "Get personalized plant care advice and answers to your questions through our Gemini 2.0 Flash chatbot."
    },
    {
      icon: faEnvelope,
      title: "Email Notifications",
      description: "Stay informed with alerts when environmental conditions require your attention."
    },
    {
      icon: faCloud,
      title: "Real-Time Weather Forecast",
      description: "Integrated OpenWeather API providing accurate local weather data and forecasts for optimal plant growth conditions."
    },
    {
      icon: faLayerGroup,
      title: "Multiple System Support",
      description: "Manage different aeroponic setups with multiple Blynk API keys for scalable operations."
    }
  ];

  return (
    <Layout className="landing-page">
      {/* Hero Section */}
      <section className="hero">
        <div className='hero-content'>
          <div className='hero-badge'>AI-Ponics: Aeroponics driven by AI</div>
          <div className='landing-title'>Smart Plant Monitoring</div>
          <div className='landing-title gradient-text'>Powered by AI</div>
          <p>AI-Ponics utilizes real-time sensor data, and weather forecasts to monitor, analyze, and optimize AI responses.</p>
          <button onClick={handleGoogleSignIn} className='google-login-button'>
              <img 
                  src='https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/768px-Google_%22G%22_logo.svg.png' 
                  alt='Google logo' 
                  className='google-logo' 
              />
              <span>Sign in with Google</span>
          </button>
        </div>
        <div style={{padding: '3.4rem'}}>
          <LandingTempHumidCard
            isDeviceOnline={true}
            temperature={25}
            humidity={50}
          />
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="section-header">
          <div className='section-title'>Intelligent Features for Plant Monitoring</div>
          <p className='landing-p'>
            AI-Ponics combines cutting-edge technology with easy-to-use features
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div className="feature-card" key={index}>
              <div className="feature-icon">
                <FontAwesomeIcon icon={feature.icon} size="2x" />
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
        <a href='https://github.com/jei3m/ai-ponics' target='_blank'>Learn more about AI-Ponics <FontAwesomeIcon icon={faExternalLink} style={{ marginLeft: '8px' }} /></a>
      </section>

      {/* AI Chat Section */}
      <section className="chat">
        <div className="section-header">
          <div className='section-title'>AI-Powered Chat Assistant</div>
          <p className='landing-p'>
            Powered by real-time weather forecast and sensor data for precise, 24/7 support.
          </p>
          <img
            src="/img/chat.png"
            alt="AI Chat Assistant"
            className='chat-img'
          />
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="tech-stack">
        <div className="section-header">
          <div className='section-title'>Tech Stack</div>
          <p className='landing-p'>
            Built with up-to-date technologies to provide a seamless plant monitoring experience.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="section-header">
          <div className='section-title'>Ready to Enhance Your</div>
          <div className='section-title gradient-text'>Aeroponic Growing Experience?</div>
          <p className='landing-p'>
            Sign in now to start monitoring your plants with AI-Ponics.
          </p>
          <button onClick={handleGoogleSignIn} className='google-login-button'>
              <img 
                  src='https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/768px-Google_%22G%22_logo.svg.png' 
                  alt='Google logo' 
                  className='google-logo' 
              />
              <span>Sign in with Google</span>
          </button>   
        </div>     
      </section>

    </Layout>
  );
};

export default LandingPage;