import React, {useEffect } from 'react';
import { Typography, Button, Row, Col, Card, Divider, Layout, Menu, Space } from 'antd';
import { 
  RightOutlined, 
  TwitterOutlined, 
  LinkedinOutlined, 
  InstagramOutlined, 
  YoutubeOutlined 
} from '@ant-design/icons';
import './css/LandingPage.css';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

const { Title, Paragraph, Text } = Typography;
const { Header, Footer, Content } = Layout;

const LandingPage = () => {

    const navigate = useNavigate();

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
        <h1>Smart Aeroponic Monitoring</h1>
        <h1 className='gradient-text'>Powered by AI</h1>
        <p>AI-Ponics utilizes real-time sensor data to monitor, analyze, and optimize AI responses, providing better output driven by real-time context.</p>
        <button onClick={handleGoogleSignIn} className='google-login-btn'>
            <img 
                src='https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/768px-Google_%22G%22_logo.svg.png' 
                alt='Google logo' 
                className='google-logo' 
            />
            <span className='google-btn-text'>Sign in with Google</span>
        </button>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="section-header">
          <h2>Intelligent Plant Management</h2>
          <p>
            AI-Ponics combines cutting-edge technology with easy-to-use features
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <img src="/images/plant-detection.svg" alt="Plant Detection" />
            </div>
            <h3>Plant State Detection</h3>
            <p>
              Powered by Gemini 2.0 Flash AI to analyze plant health, identify diseases, and provide growth insights.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <img src="/images/real-time-monitoring.svg" alt="Real-time Monitoring" />
            </div>
            <h3>Real-Time Sensor Monitoring</h3>
            <p>
              Track temperature, humidity, and other critical parameters remotely with Blynk API integration.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <img src="/images/ai-chatbot.svg" alt="AI Chatbot" />
            </div>
            <h3>AI-Powered Chatbot</h3>
            <p>
              Get personalized plant care advice and answers to your questions through our Gemini 2.0 Flash chatbot.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <img src="/images/notifications.svg" alt="Email Notifications" />
            </div>
            <h3>Email Notifications</h3>
            <p>
              Stay informed with alerts when environmental conditions require your attention.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <img src="/images/user-interface.svg" alt="User Interface" />
            </div>
            <h3>User-Friendly Interface</h3>
            <p>
              Intuitive React JS and Ant Design interface for seamless management of your aeroponic system.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <img src="/images/multi-system.svg" alt="Multiple Systems" />
            </div>
            <h3>Multiple System Support</h3>
            <p>
              Manage different aeroponic setups with multiple Blynk API keys for scalable operations.
            </p>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="tech-stack">
        <div className="section-header">
          <Title level={2}>Built with Advanced Technology</Title>
          <Paragraph>
            AI-Ponics leverages industry-leading tools and platforms
          </Paragraph>
        </div>
        
        <Row justify="center" gutter={[48, 24]} className="tech-logos">
          <Col>
            <div className="tech-logo">
              <img src="/images/react-logo.svg" alt="React JS" />
              <Text strong>React JS</Text>
            </div>
          </Col>
          <Col>
            <div className="tech-logo">
              <img src="/images/gemini-logo.svg" alt="Gemini 2.0" />
              <Text strong>Gemini 2.0</Text>
            </div>
          </Col>
          <Col>
            <div className="tech-logo">
              <img src="/images/blynk-logo.svg" alt="Blynk API" />
              <Text strong>Blynk API</Text>
            </div>
          </Col>
          <Col>
            <div className="tech-logo">
              <img src="/images/firebase-logo.svg" alt="Firebase" />
              <Text strong>Firebase</Text>
            </div>
          </Col>
        </Row>
      </section>

      {/* Footer */}
      <Footer className="footer">        
        <div className="footer-bottom">
          <Row justify="space-between" align="middle">
            <Col>
              <Text type="secondary">&copy; {new Date().getFullYear()} AI-Ponics. All rights reserved.</Text>
            </Col>
            <Col>
              <Space size="middle" className="social-links">
                <a href="#twitter" className="social-link"><TwitterOutlined /></a>
                <a href="#linkedin" className="social-link"><LinkedinOutlined /></a>
                <a href="#instagram" className="social-link"><InstagramOutlined /></a>
                <a href="#youtube" className="social-link"><YoutubeOutlined /></a>
              </Space>
            </Col>
          </Row>
        </div>
      </Footer>
    </Layout>
  );
};

export default LandingPage;