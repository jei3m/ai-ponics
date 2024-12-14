import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Upload, Button, Typography, Space, Progress, Tag } from 'antd';
import { UploadOutlined, CheckCircleOutlined } from '@ant-design/icons';
import Header from '../components/Header';

const { Title, Text } = Typography;

const DiseaseDetection = () => {
    const [base64Image, setBase64Image] = useState('');
    const [previewUrl, setPreviewUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleImageChange = (info) => {
        if (info.file) {
            // Create preview URL
            const objectUrl = URL.createObjectURL(info.file);
            setPreviewUrl(objectUrl);

            // Convert to base64
            const reader = new FileReader();
            reader.onload = (e) => {
                const base64 = e.target.result.split(',')[1];
                setBase64Image(base64);
            };
            reader.readAsDataURL(info.file);
        }
    };

    const detectDisease = async () => {
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
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const renderPredictions = () => {
        if (!results || !results.predictions) return null;

        return results.predictions.map((prediction, index) => {
            const confidence = Math.round(prediction.confidence * 100);
            const color = prediction.class === 'normal_lettuce' ? 'green' : confidence > 70 ? 'red' : confidence > 50 ? 'orange' : 'green';
            const labelText = prediction.class === 'normal_lettuce' ? "Healthy" : `${confidence}% with Disease`
            const icon = prediction.class === 'normal_lettuce' ? <CheckCircleOutlined /> : <CheckCircleOutlined />;


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
                        {prediction.class !== 'normal_lettuce' && <Progress 
                            percent={confidence} 
                            status="active"
                            strokeColor={color}
                            size="small"
                        />}
                    </Space>
                </Card>
            );
        });
    };

    return (
        <div className="disease-detection-container">
            <Header/>
            <div style={{ 
                padding: isMobile ? '16px' : '24px', 
                maxWidth: '1200px', 
                margin: '0 auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minHeight: 'calc(100vh - 64px)',
            }}>
                <Title level={2} style={{ 
                    marginBottom: '24px',
                    fontSize: isMobile ? '24px' : '32px',
                    textAlign: 'center'
                }}>
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
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        transition: 'all 0.3s ease'
                    }}>
                        
                    <Space direction="vertical" style={{ width: '100%', gap: '20px' }}>
                        <div style={{ 
                            textAlign: 'center',
                            padding: isMobile ? '16px' : '24px'
                        }}>
                            <Upload
                                beforeUpload={(file) => {
                                    handleImageChange({ file });
                                    return false;
                                }}
                                accept="image/*"
                                maxCount={1}
                                showUploadList={false}
                            >
                                <Button 
                                    icon={<UploadOutlined />} 
                                    size={isMobile ? 'middle' : 'large'}
                                    style={{ 
                                        width: isMobile ? '160px' : '200px',
                                        height: isMobile ? '36px' : '40px',
                                        borderRadius: '8px'
                                    }}
                                >
                                    Select Image
                                </Button>
                            </Upload>
                        </div>

                        {previewUrl && (
                            <div 
                                style={{ 
                                    textAlign: 'center',
                                    padding: isMobile ? '12px' : '16px',
                                    background: '#f8f8f8',
                                    borderRadius: '12px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                                }}
                            >
                                <img 
                                    src={previewUrl} 
                                    alt="Preview" 
                                    style={{ 
                                        maxWidth: '100%', 
                                        maxHeight: isMobile ? '200px' : '300px',
                                        objectFit: 'contain',
                                        borderRadius: '8px',
                                        transition: 'all 0.3s ease'
                                    }} 
                                />
                            </div>
                        )}

                        <div style={{ width: '100%' }}>
                            {renderPredictions()}
                        </div>

                        <Button 
                            type="primary" 
                            onClick={detectDisease}
                            disabled={!base64Image || isLoading}
                            loading={isLoading}
                            size={isMobile ? 'middle' : 'large'}
                            style={{ 
                                width: '100%',
                                height: isMobile ? '40px' : '48px',
                                borderRadius: '8px',
                                marginTop: '12px',
                                background: '#1890ff',
                                fontWeight: 500
                            }}
                        >
                            {isLoading ? 'Detecting...' : 'Detect Disease'}
                        </Button>
                    </Space>
                </Card>
            
            </div>
        </div>
    );
};

export default DiseaseDetection;