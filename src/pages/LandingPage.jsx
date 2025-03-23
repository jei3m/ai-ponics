import React, {useEffect } from 'react';
import { Typography, Button, Row, Col, Card, Divider, Layout, Menu, Space } from 'antd';
import './css/LandingPage.css';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import TempHumidCard from './components/Sensors/TempHumid';

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

  return (
    <Layout className="landing-page">
      {/* Hero Section */}
      <section className="hero">
        <div className='hero-content'>
          <div className='hero-badge'>AI-Ponics: Aeroponics driven by AI</div>
          <div className='landing-title'>Smart Plant Monitoring</div>
          <div className='landing-title gradient-text'>Powered by AI</div>
          <p>AI-Ponics utilizes real-time sensor data to monitor, analyze, and optimize AI responses.</p>
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
          <TempHumidCard
            isDeviceOnline={true}
            temperature={25}
            humidity={50}
          />
        </div>
      </section>
    </Layout>
  );
};

export default LandingPage;