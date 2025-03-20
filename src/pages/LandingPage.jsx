import React, {useEffect } from 'react';
import { Typography, Button, Row, Col, Card, Divider, Layout, Menu, Space } from 'antd';
import './css/LandingPage.css';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import TempHumidCard from './components/Sensors/TempHumid';
import { 
  Leaf, 
  Thermometer, 
  Monitor, 
  Mail, 
  Layers,
  Code,
  Brain,
  Cpu,
  Database
} from 'lucide-react';

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
      icon: Leaf,
      title: "Plant State Detection",
      description: "Powered by Gemini 2.0 Flash AI to analyze plant health, identify diseases, and provide growth insights."
    },
    {
      icon: Thermometer,
      title: "Real-Time Sensor Monitoring",
      description: "Track temperature, humidity, and other critical parameters remotely with Blynk API integration."
    },
    {
      icon: Monitor,
      title: "AI-Powered Chatbot",
      description: "Get personalized plant care advice and answers to your questions through our Gemini 2.0 Flash chatbot."
    },
    {
      icon: Mail,
      title: "Email Notifications",
      description: "Stay informed with alerts when environmental conditions require your attention."
    },
    {
      icon: Monitor,
      title: "User-Friendly Interface",
      description: "Intuitive React JS and Ant Design interface for seamless management of your aeroponic system."
    },
    {
      icon: Layers,
      title: "Multiple System Support",
      description: "Manage different aeroponic setups with multiple Blynk API keys for scalable operations."
    }
  ];

  const technologies = [
    {
      icon: Code,
      title: "React JS",
      description: "For building a dynamic and responsive user interface."
    },
    {
      icon: Brain,
      title: "Gemini AI",
      description: "For image and text prompt analysis tailored to aeroponic systems."
    },
    {
      icon: Cpu,
      title: "Blynk API",
      description: "For real-time sensor data integration and monitoring."
    },
    {
      icon: Database,
      title: "Firebase",
      description: "For user authentication and synchronization of data."
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