import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Card, Button, Typography, Space, Progress, Tag, Input, message } from 'antd';
import { CameraOutlined, CheckCircleOutlined } from '@ant-design/icons';
import Header from './components/Header';
import ReactDOMServer from 'react-dom/server';
import EmailTemplateHot from './components/template/emailTemplateHot'; // Assume this is your email template

const { Title, Text } = Typography;

const DiseaseDetection = ({ user }) => {  // Assuming user is passed as a prop
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [timerInterval, setTimerInterval] = useState(5000); // default to 5 seconds
    const [isTimerActive, setIsTimerActive] = useState(false);

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const resultCanvasRef = useRef(null);

    const timerRef = useRef(null);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const startCamera = async () => {
        setIsCameraOn(true);
        setError(null);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }
        } catch (err) {
            setError("Unable to access the camera.");
            console.error("Camera error:", err);
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
        }
        setIsCameraOn(false);
        stopTimer();  // Stop the timer when the camera is stopped
    };

    const captureFrame = async () => {
        if (!videoRef.current || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;

        // Capture the current frame from the video
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        // Convert to base64 image
        const image = canvas.toDataURL('image/jpeg').split(',')[1];
        detectDisease(image);
    };

    const detectDisease = async (base64Image) => {
        setIsLoading(true);
        setError(null);
        setResults(null);

        try {
            const response = await axios({
                method: "POST",
                url: "https://outline.roboflow.com/aquaponic_polygan_disease_test/5",
                params: {
                    api_key: process.env.REACT_APP_ROBOFLOW_API_KEY
                },
                data: base64Image,
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            });

            setResults(response.data);
            drawPredictions(response.data.predictions);
            sendEmailResults(response.data.predictions);  // Send results via email
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const sendEmailResults = async (predictions) => {
        const lastEmailTimestamp = localStorage.getItem("lastEmailTimestamp");
        const now = new Date().getTime();

        // Avoid sending emails too frequently (10 minutes interval)
        if (!lastEmailTimestamp || now - lastEmailTimestamp > 10 * 60 * 1000) {
            try {
                if (user && user.email) {
                    const emailData = {
                        to: user.email,
                        from: "AI-Ponics@jeiem.site",
                        subject: "Plant Disease Detection Results",
                        html: ReactDOMServer.renderToStaticMarkup(<EmailTemplateHot predictions={predictions} />),
                        text: JSON.stringify(predictions, null, 2),
                    };

                    const response = await fetch('/emails', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${process.env.REACT_APP_RESEND_API_KEY}` // Ensure your API key is correct
                        },
                        body: JSON.stringify(emailData)
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(`Network response was not ok: ${response.status} - ${errorData.message}`);
                    }

                    const data = await response.json();
                    console.log("Email successfully sent!", data);
                    localStorage.setItem("lastEmailTimestamp", now); // Update the last email sent timestamp
                    message.success('Results emailed successfully!');
                }
            } catch (err) {
                message.error('Failed to send email');
                console.error("Failed to send email:", err);
            }
        } else {
            console.log("Email not sent: 10 minutes have not passed yet.");
        }
    };

    const drawPredictions = (predictions) => {
        if (!resultCanvasRef.current || !predictions) return;

        const canvas = resultCanvasRef.current;
        const context = canvas.getContext('2d');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;

        const videoContext = canvasRef.current.getContext('2d');
        context.drawImage(canvasRef.current, 0, 0);

        predictions.forEach((prediction) => {
            const { x, y, width, height, confidence, class: label } = prediction;

            // Draw bounding box
            context.strokeStyle = confidence > 0.7 ? 'red' : 'orange';
            context.lineWidth = 2;
            context.strokeRect(x, y, width, height);

            // Add label
            context.fillStyle = 'yellow';
            context.font = '16px Arial';
            context.fillText(`${label} (${Math.round(confidence * 100)}%)`, x, y - 5);
        });
    };

    const startTimer = () => {
        if (isTimerActive) return;

        timerRef.current = setInterval(() => {
            captureFrame();
        }, timerInterval);
        setIsTimerActive(true);
    };

    const stopTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            setIsTimerActive(false);
        }
    };

    const renderPredictions = () => {
        if (!results || !results.predictions) return null;

        return results.predictions.map((prediction, index) => {
            const confidence = Math.round(prediction.confidence * 100);
            const color = prediction.class === 'normal_lettuce' ? 'green' : confidence > 70 ? 'red' : 'orange';
            const labelText = prediction.class === 'normal_lettuce' ? "Healthy" : `${confidence}% Diseased`;
            const icon = <CheckCircleOutlined />;

            return (
                <Card
                    key={index}
                    style={{ marginTop: '16px' }}
                    bordered={true}
                    className="prediction-card"
                >
                    <Space direction="vertical" style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text strong style={{ fontSize: 16 }}>
                                {prediction.class}
                            </Text>
                            <Tag color={color} icon={icon}>
                                {labelText}
                            </Tag>
                        </div>
                        <Progress
                            percent={confidence}
                            status="active"
                            strokeColor={color}
                            size="small"
                        />
                    </Space>
                </Card>
            );
        });
    };

    return (
        <div className="disease-detection-container">
            <Header />
            <div
                style={{
                    padding: isMobile ? '16px' : '24px',
                    maxWidth: '1200px',
                    margin: '0 auto',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    minHeight: 'calc(100vh - 64px)',
                }}
            >
                <Title level={2} style={{ marginBottom: '24px', fontSize: isMobile ? '24px' : '32px', textAlign: 'center' }}>
                    Plant Disease Detection
                </Title>

                <Card hoverable className="upload-card" style={{ background: '#ffffff', borderRadius: '12px', minHeight: '480px', width: '100%', maxWidth: isMobile ? '100%' : '600px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', transition: 'all 0.3s ease' }}>
                    <Space direction="vertical" style={{ width: '100%', gap: '20px' }}>
                        <div style={{ textAlign: 'center' }}>
                            {isCameraOn ? (
                                <>
                                    <video ref={videoRef} style={{ width: '100%', borderRadius: '8px' }} />
                                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                                    <canvas ref={resultCanvasRef} style={{ width: '100%', marginTop: '16px', borderRadius: '8px' }} />
                                    <Button type="primary" onClick={captureFrame} disabled={isLoading} loading={isLoading} style={{ marginTop: '12px', borderRadius: '8px', background: '#1890ff' }}>
                                        {isLoading ? 'Detecting...' : 'Capture & Detect'}
                                    </Button>
                                    <Button onClick={stopCamera} style={{ marginTop: '8px', borderRadius: '8px' }}>
                                        Stop Camera
                                    </Button>
                                    <Button onClick={startTimer} style={{ marginTop: '8px', borderRadius: '8px' }} disabled={isTimerActive}>
                                        Start Timer ({timerInterval / 1000} sec)
                                    </Button>
                                    <Button onClick={stopTimer} style={{ marginTop: '8px', borderRadius: '8px' }} disabled={!isTimerActive}>
                                        Stop Timer
                                    </Button>
                                </>
                            ) : (
                                <Button icon={<CameraOutlined />} onClick={startCamera} style={{ width: isMobile ? '160px' : '200px', height: isMobile ? '36px' : '40px', borderRadius: '8px' }}>
                                    Start Camera
                                </Button>
                            )}
                        </div>

                        <div style={{ width: '100%' }}>
                            <Input
                                value={timerInterval / 1000}
                                onChange={(e) => setTimerInterval(e.target.value * 1000)}
                                addonBefore="Timer Interval (Seconds)"
                                style={{ width: '100%' }}
                            />
                            {renderPredictions()}
                        </div>
                    </Space>
                </Card>
            </div>
        </div>
    );
};

export default DiseaseDetection;
