import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Card, Button, Typography, Space, Progress, Tag, Input, message } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import Header from './components/Header';
import ReactDOMServer from 'react-dom/server';
import EmailTemplateHot from './components/template/emailTemplateHot'; // Assume this is your email template

const { Title, Text } = Typography;

const DiseaseDetection = ({ user }) => {
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [timerInterval, setTimerInterval] = useState(5000); // Default 5 seconds
    const [unitMultiplier, setUnitMultiplier] = useState(1000); // Default to seconds
    const [isTimerActive, setIsTimerActive] = useState(false);

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const resultCanvasRef = useRef(null);
    const timerRef = useRef(null);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const startCamera = async () => {
        setIsCameraOn(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }
        } catch (err) {
            console.error('Camera error:', err);
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
        }
        setIsCameraOn(false);
        stopTimer();
    };

    const captureFrame = async () => {
        if (!videoRef.current || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;

        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const image = canvas.toDataURL('image/jpeg').split(',')[1];
        detectDisease(image);
    };

    const detectDisease = async (base64Image) => {
        setIsLoading(true);
        setResults(null);
        try {
            const response = await axios.post(
                'https://outline.roboflow.com/aquaponic_polygan_disease_test/5',
                base64Image,
                {
                    params: { api_key: process.env.REACT_APP_ROBOFLOW_API_KEY },
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                }
            );
            setResults(response.data);
            drawPredictions(response.data.predictions);
            sendEmailResults(response.data.predictions);
        } catch (err) {
            console.error(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const sendEmailResults = async (predictions) => {
        const lastEmailTimestamp = localStorage.getItem('lastEmailTimestamp');
        const now = new Date().getTime();

        if (!lastEmailTimestamp || now - lastEmailTimestamp > 10 * 60 * 1000) {
            try {
                if (user && user.email) {
                    const emailData = {
                        to: user.email,
                        from: 'AI-Ponics@jeiem.site',
                        subject: 'Plant Disease Detection Results',
                        html: ReactDOMServer.renderToStaticMarkup(
                            <EmailTemplateHot predictions={predictions} />
                        ),
                        text: JSON.stringify(predictions, null, 2),
                    };

                    const response = await fetch('/emails', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${process.env.REACT_APP_RESEND_API_KEY}`,
                        },
                        body: JSON.stringify(emailData),
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(
                            `Network response was not ok: ${response.status} - ${errorData.message}`
                        );
                    }

                    const data = await response.json();
                    console.log('Email successfully sent!', data);
                    localStorage.setItem('lastEmailTimestamp', now);
                    message.success('Results emailed successfully!');
                }
            } catch (err) {
                message.error('Failed to send email');
                console.error('Failed to send email:', err);
            }
        } else {
            console.log('Email not sent: 10 minutes have not passed yet.');
        }
    };

    const drawPredictions = (predictions) => {
        if (!resultCanvasRef.current || !predictions) return;

        const canvas = resultCanvasRef.current;
        const context = canvas.getContext('2d');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;

        context.drawImage(canvasRef.current, 0, 0);

        predictions.forEach(({ x, y, width, height, confidence, class: label }) => {
            context.strokeStyle = confidence > 0.7 ? 'red' : 'orange';
            context.lineWidth = 2;
            context.strokeRect(x, y, width, height);
            context.fillStyle = 'yellow';
            context.font = '16px Arial';
            context.fillText(`${label} (${Math.round(confidence * 100)}%)`, x, y - 5);
        });
    };

    const startTimer = () => {
        if (isTimerActive) return;
        startCamera(); // Start the camera before starting the timer
        timerRef.current = setInterval(captureFrame, timerInterval);
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
            const color =
                prediction.class === 'normal_lettuce'
                    ? 'green'
                    : confidence > 70
                    ? 'red'
                    : 'orange';
            const labelText =
                prediction.class === 'normal_lettuce' ? 'Healthy' : `${confidence}% Diseased`;

            return (
                <Card key={index} style={{ marginTop: '16px' }} bordered>
                    <Space direction="vertical" style={{ width: '100%' }}>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <Text strong style={{ fontSize: 16 }}>
                                {prediction.class}
                            </Text>
                            <Tag color={color}>
                                {labelText} <CheckCircleOutlined />
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
                <Title level={2} style={{ marginBottom: '24px', fontSize: isMobile ? '24px' : '32px' }}>
                    Plant Disease Detection
                </Title>
                <Card
                    hoverable
                    className="upload-card"
                    style={{
                        background: '#ffffff',
                        borderRadius: '12px',
                        minHeight: '480px',
                        width: '100%',
                        maxWidth: isMobile ? '100%' : '600px',
                    }}
                >
                    <Space direction="vertical" style={{ width: '100%', gap: '20px' }}>
                        <div style={{ textAlign: 'center' }}>
                            {isCameraOn ? (
                                <>
                                    <video ref={videoRef} style={{ width: '100%' }} />
                                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                                    <canvas
                                        ref={resultCanvasRef}
                                        style={{ width: '100%', marginTop: '16px' }}
                                    />
                                    <Button
                                        type="primary"
                                        onClick={captureFrame}
                                        disabled={isLoading}
                                        loading={isLoading}
                                    >
                                        {isLoading ? 'Detecting...' : 'Capture & Detect'}
                                    </Button>
                                    <Button onClick={stopCamera}>Stop Camera</Button>
                                    <Button onClick={startTimer} disabled={isTimerActive}>
                                        Start Timer ({timerInterval / 1000} sec)
                                    </Button>
                                    <Button onClick={stopTimer} disabled={!isTimerActive}>
                                        Stop Timer
                                    </Button>
                                </>
                            ) : (
                                <Button type="primary" onClick={startTimer}>
                                    Start Camera & Timer
                                </Button>
                            )}
                        </div>
                        <div style={{ width: '100%' }}>
                            <Space style={{ width: '100%' }} direction="vertical">
                                <Input
                                    type="number"
                                    value={timerInterval / unitMultiplier}
                                    onChange={(e) => {
                                        const value = parseFloat(e.target.value);
                                        if (!isNaN(value)) {
                                            setTimerInterval(value * unitMultiplier);
                                        }
                                    }}
                                    addonBefore="Timer Interval"
                                    addonAfter={
                                        <select
                                            onChange={(e) => {
                                                const unit = e.target.value;
                                                const currentValue = timerInterval / unitMultiplier;
                                                const multiplier =
                                                    unit === 'seconds'
                                                        ? 1000
                                                        : unit === 'minutes'
                                                        ? 60000
                                                        : 3600000;
                                                setUnitMultiplier(multiplier);
                                                setTimerInterval(currentValue * multiplier);
                                            }}
                                        >
                                            <option value="seconds">Seconds</option>
                                            <option value="minutes">Minutes</option>
                                            <option value="hours">Hours</option>
                                        </select>
                                    }
                                    style={{ width: '100%' }}
                                />
                                {renderPredictions()}
                            </Space>
                        </div>
                    </Space>
                </Card>
            </div>
        </div>
    );
};

export default DiseaseDetection;
