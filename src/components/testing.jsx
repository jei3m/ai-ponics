import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Typography, Card, CardContent, CardHeader, Box, TextField } from '@mui/material';
import { differenceInDays } from 'date-fns';
import '../App.css';
import './css/Sensors.css';
import { Gauge } from '../components/Gauge';

function Sensors() {
    const [temperature, setTemperature] = useState(null);
    const [humidity, setHumidity] = useState(null);
    const [plantName, setPlantName] = useState('Tomato');
    const [plantImage, setPlantImage] = useState('/img/tomato-plant.jpg');
    const [plantingDate, setPlantingDate] = useState('');
    const [daysSincePlanting, setDaysSincePlanting] = useState(0);
    const [temperatureAlert, setTemperatureAlert] = useState('');

    useEffect(() => {
        const BLYNK_AUTH_TOKEN = process.env.REACT_APP_BLYNK_TOKEN;
        const fetchSensorData = async () => {
            try {
                const temperatureResponse = await axios.get(`https://blynk.cloud/external/api/get?token=${BLYNK_AUTH_TOKEN}&V0`);
                const humidityResponse = await axios.get(`https://blynk.cloud/external/api/get?token=${BLYNK_AUTH_TOKEN}&V1`);
                setTemperature(temperatureResponse.data);
                setHumidity(humidityResponse.data);

                // Check temperature and set alert
                if (temperatureResponse.data > 30) {
                    setTemperatureAlert('Temperature too high!');
                } else if (temperatureResponse.data < 15) {
                    setTemperatureAlert('Temperature too low!');
                } else {
                    setTemperatureAlert('');
                }
            } catch (error) {
                console.error('Error fetching data from Blynk:', error);
            }
        };

        fetchSensorData();
        const interval = setInterval(fetchSensorData, 5000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        // Retrieve planting date from localStorage on component mount
        const storedPlantingDate = localStorage.getItem('plantingDate');
        if (storedPlantingDate) {
            setPlantingDate(storedPlantingDate);
        }
    }, []);

    useEffect(() => {
        if (plantingDate) {
            const days = differenceInDays(new Date(), new Date(plantingDate));
            setDaysSincePlanting(days);

            // Store planting date in localStorage whenever it changes
            localStorage.setItem('plantingDate', plantingDate);
        }
    }, [plantingDate]);

    const handlePlantingDateChange = (event) => {
        setPlantingDate(event.target.value);
    };

    return (
        <div className="Appsensor">
            <header className="App-header">
                <h2>Plant Monitoring Dashboard</h2>
                <Box className="sensor-container">
                <Card className="sensor-card">
                        <CardHeader 
                            title={
                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                    Temperature Alert
                                </Typography>
                            }
                        />
                        <CardContent>
                            <Typography variant="body1" color={temperatureAlert ? 'error' : 'textPrimary'} sx={{ fontWeight: 'bold' }}>
                                {temperatureAlert || 'Temperature is normal'}
                            </Typography>
                        </CardContent>
                    </Card>
                    <Card className="sensor-card">
                        <CardHeader 
                            title={
                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                    Temperature
                                </Typography>
                            }
                        />
                        <CardContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2px' }}>
                            {temperature !== null ? (
                                <Gauge value={temperature} max={50} label="°C" />
                            ) : (
                                <Typography variant="h6" className="loading-text">Loading...</Typography>
                            )}
                        </CardContent>
                    </Card>
                    <Card className="sensor-card">
                        <CardHeader 
                            title={
                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                    Humidity
                                </Typography>
                            }
                        />
                        <CardContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2px' }}>
                            {humidity !== null ? (
                                <Gauge value={humidity} max={100} label="%" />
                            ) : (
                                <Typography variant="h6" className="loading-text">Loading...</Typography>
                            )}
                        </CardContent>
                    </Card>
                    {/* <Card className="sensor-card">
                        <CardHeader 
                            title={
                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                    Plant Information
                                </Typography>
                            }
                        />
                        <CardContent>
                            <Typography variant="body1">Plant: {plantName}</Typography>
                            <img src={plantImage} alt={plantName} style={{ width: '100%', maxHeight: '200px', objectFit: 'cover' }} />
                        </CardContent>
                    </Card> */}
                    <Card className="sensor-card">
                        <CardHeader 
                            title={
                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                    Planting Date
                                </Typography>
                            }
                        />
                        <CardContent>
                            <TextField
                                type="date"
                                value={plantingDate}
                                onChange={handlePlantingDateChange}
                                fullWidth
                                margin="normal"
                            />
                            {plantingDate && (
                                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                    Days since planting: {daysSincePlanting}
                                </Typography>
                            )}
                        </CardContent>
                    </Card>

                </Box>
            </header>
            <div className="ask-aiponics-container">
                <a href="/chat" className="ask-aiponics-button">
                    <img src="/img/aiponicsbot.png" alt="AI-Ponics Bot" className="profile-pic" />
                </a>
                <div className="text-bubble">Ask AI-Ponics!</div>
            </div>
        </div>
    );
}

export default Sensors;