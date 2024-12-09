import React, { useState } from 'react';
import axios from 'axios';
import { Card, Upload, Button, Typography, Space, Progress, Tag } from 'antd';
import { UploadOutlined, CheckCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const DiseaseDetection = () => {
    const [base64Image, setBase64Image] = useState('');
    const [previewUrl, setPreviewUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);

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
            const color = confidence > 70 ? 'red' : confidence > 50 ? 'orange' : 'green';

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
                            <Tag color={color} icon={<CheckCircleOutlined />}>
                                {confidence}% with Disease
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
        <div style={{ 
            padding: '24px', 
            maxWidth: '100dvw', 
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
        }}>
            <Title level={2} style={{ marginBottom: '12px' }}>Plant Disease Detection</Title>
            
            <Card 
                hoverable
                className="upload-card"
                style={{
                    background: '#fafafa',
                    borderRadius: '8px',
                    minHeight: '480px',
                    width: '500px'
                }}>
                    
                <Space direction="vertical" style={{ width: '100%' }}>
                    <div style={{ textAlign: 'center'}}>
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
                                size="large"
                                style={{ width: '200px' }}
                            >
                                Select Image
                            </Button>
                        </Upload>
                        {renderPredictions()}
                    </div>

                    {previewUrl && (
                        <div 
                            style={{ 
                                textAlign: 'center',
                                marginTop: '16px',
                                padding: '16px',
                                background: '#fff',
                                borderRadius: '8px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                            }}
                        >
                            <img 
                                src={previewUrl} 
                                alt="Preview" 
                                style={{ 
                                    maxWidth: '100%', 
                                    maxHeight: '300px',
                                    objectFit: 'contain',
                                    borderRadius: '4px'
                                }} 
                            />
                        </div>
                    )}

                    <Button 
                        type="primary" 
                        onClick={detectDisease}
                        disabled={!base64Image || isLoading}
                        loading={isLoading}
                        size="large"
                        style={{ width: '100%', marginTop: '20px' }}
                    >
                        {isLoading ? 'Detecting...' : 'Detect Disease'}
                    </Button>
                </Space>
            </Card>
        
        </div>
    );
};

export default DiseaseDetection;
