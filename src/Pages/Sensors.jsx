import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Typography, Card, CardContent, CardHeader, Box } from '@mui/material';
import '../App.css';
import './css/Sensors.css';
import { Gauge } from '../components/Gauge';

function Sensors() {
    const [temperature, setTemperature] = useState(null);
    const [humidity, setHumidity] = useState(null);

    useEffect(() => {
        const BLYNK_AUTH_TOKEN = process.env.REACT_APP_BLYNK_TOKEN;
        const fetchSensorData = async () => {
            try {
                const temperatureResponse = await axios.get(`https://blynk.cloud/external/api/get?token=${BLYNK_AUTH_TOKEN}&V0`);
                const humidityResponse = await axios.get(`https://blynk.cloud/external/api/get?token=${BLYNK_AUTH_TOKEN}&V1`);
                setTemperature(temperatureResponse.data);
                setHumidity(humidityResponse.data);
            } catch (error) {
                console.error('Error fetching data from Blynk:', error);
            }
        };

        fetchSensorData();
        const interval = setInterval(fetchSensorData, 5000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="Appnobg">
            <header className="App-header">
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        gap: 4,
                        padding: 4,
                    }}
                >
                    <Card sx={{ flex: '1 1 300px', maxWidth: 260, margin: '2px', display: 'flex', flexDirection: 'column', borderRadius: '10px' }}>
                        <CardHeader 
                            title={
                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                    Temperature
                                </Typography>
                            }
                        />
                        <CardContent sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            {temperature !== null ? (
                                <Gauge value={temperature} max={50} label="°C" />
                            ) : (
                                <Typography variant="h6" className="loading-text">Loading...</Typography>
                            )}
                        </CardContent>
                    </Card>
                    <Card sx={{ flex: '1 1 300px', maxWidth: 260, margin: '2px', display: 'flex', flexDirection: 'column', borderRadius: '10px' }}>
                        <CardHeader 
                            title={
                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                    Humidity
                                </Typography>
                            }
                        />
                        <CardContent sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            {humidity !== null ? (
                                <Gauge value={humidity} max={100} label="%" />
                            ) : (
                                <Typography variant="h6" className="loading-text">Loading...</Typography>
                            )}
                        </CardContent>
                    </Card>
                </Box>
            </header>
            <div className="ask-aiponics-container">
                <a href="/chat" className="ask-aiponics-button">
                    <img src="/img/aiponicsbot.png" alt="profile" className="profile-pic" />
                </a>
                <div className="text-bubble">Ask AI-Ponics!</div>
            </div>
        </div>
    );
}

export default Sensors;
