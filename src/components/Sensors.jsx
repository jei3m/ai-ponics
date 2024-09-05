import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CircularProgress, Box, Typography, Card, CardContent, CardHeader, Grid2} from '@mui/material';
import '../App.css';
import './Sensors.css';

function Gauge({ value, max, label }) {
    const normalizedValue = (value / max) * 100;

    return (
        <Box position="relative" display="inline-flex">
            <CircularProgress
                variant="determinate"
                value={100}
                size={120}
                thickness={4}
                sx={{
                    color: 'grey.400', // Color for the background (dark gray)
                }}
            />
            <CircularProgress
                variant="determinate"
                value={normalizedValue}
                size={120}
                thickness={4}
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    color: '#3693f7', // Color for the value (blue)
                    borderRadius: '50%',
                }}
            />
            <Box
                position="absolute"
                top={0}
                left={0}
                right={0}
                bottom={0}
                display="flex"
                alignItems="center"
                justifyContent="center"
            >
                <Typography variant="h5" component="div" color="textPrimary">
                    {`${Math.round(value)}${label}`}
                </Typography>
            </Box>
        </Box>
    );
}

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
        <div className="App">
            <header className="App-header">
                <Grid2 container spacing={4} justifyContent="center">
                    <Grid2 item xs={12} sm={6} md={4} lg={3}>
                        <Card sx={{ width: '90%', maxWidth: 400, margin: 'auto', display: 'flex', flexDirection: 'column', borderRadius: '10px' }}>
                            <CardHeader title="Temperature" />
                            <CardContent sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                {temperature !== null ? (
                                    <Gauge value={temperature} max={50} label="°C" />
                                ) : (
                                    <Typography variant="h6" className="loading-text">Loading...</Typography>
                                )}
                            </CardContent>
                        </Card>
                    </Grid2>
                    <Grid2 item xs={12} sm={6} md={4} lg={3}>
                        <Card sx={{ width: '90%', maxWidth: 400, margin: 'auto', display: 'flex', flexDirection: 'column', borderRadius: '10px' }}>
                            <CardHeader title="Humidity" />
                            <CardContent sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                {humidity !== null ? (
                                    <Gauge value={humidity} max={100} label="%" />
                                ) : (
                                    <Typography variant="h6" className="loading-text">Loading...</Typography>
                                )}
                            </CardContent>
                        </Card>
                    </Grid2>
                </Grid2>
                
            </header>
            <div className="ask-aiponics-container"> {/* Container for the ask Aerobot section */}
        <a href="/chat" className="ask-aiponics-button"> {/* Link to chat with Aerobot */}
          <img
            src="/img/aiponicsbot.png" // Path to the Aerobot image
            alt="profile" // Alt text for the image
            className="profile-pic" // Class for profile picture styling
          />
        </a>
        <div className="text-bubble"> {/* Bubble text for asking Aerobot */}
          Ask AI-Ponics!
        </div>
      </div>
        </div>
        
    );
}

export default Sensors;
