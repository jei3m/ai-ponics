import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Typography, Card, CardContent, CardHeader, Box, TextField, InputAdornment, Button } from '@mui/material';
import { differenceInDays, format } from 'date-fns';
import emailjs from 'emailjs-com';
import { Gauge } from '../components/Gauge';
import Header from '../components/Header';
import { db, auth } from '../firebase';  // Import Firebase
import { doc, setDoc, getDoc } from 'firebase/firestore';  // Firestore methods
import './css/Sensors.css'

function Sensors() {
    const [temperature, setTemperature] = useState(null);
    const [humidity, setHumidity] = useState(null);
    const [plantingDate, setPlantingDate] = useState('');
    const [daysSincePlanting, setDaysSincePlanting] = useState(0);
    const [temperatureAlert, setTemperatureAlert] = useState('');
    const [plantName, setPlantName] = useState('');
    const [user, setUser] = useState(null); // Add user state

    useEffect(() => {
        const BLYNK_AUTH_TOKEN = process.env.REACT_APP_BLYNK_TOKEN;
        const fetchSensorData = async () => {
            try {
                const temperatureResponse = await axios.get(`https://blynk.cloud/external/api/get?token=${BLYNK_AUTH_TOKEN}&V0`);
                const humidityResponse = await axios.get(`https://blynk.cloud/external/api/get?token=${BLYNK_AUTH_TOKEN}&V1`);
                setTemperature(temperatureResponse.data);
                setHumidity(humidityResponse.data);

                if (temperatureResponse.data > 73) {
                    setTemperatureAlert('Temperature too high!');
                    sendEmail(temperatureResponse.data);
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
        const fetchUserData = async () => {
            const currentUser = auth.currentUser;
            if (currentUser) {
                setUser(currentUser); // Set user state
                const docRef = doc(db, 'users', currentUser.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data.plantingDate) {
                        setPlantingDate(data.plantingDate);
                    }
                    if (data.plantName) {
                        setPlantName(data.plantName);
                    }
                } else {
                    console.log("No such document!");
                }
            }
        };

        fetchUserData();
    }, []);

    useEffect(() => {
        if (plantingDate) {
            const days = differenceInDays(new Date(), new Date(plantingDate));
            setDaysSincePlanting(days);

            // Save planting date to Firestore when it changes
            const currentUser = auth.currentUser;
            if (currentUser) {
                setDoc(doc(db, 'users', currentUser.uid), {
                    plantingDate: plantingDate
                }, { merge: true });
            }
        }
    }, [plantingDate]);

    const handlePlantingDateChange = (event) => {
        const selectedDate = new Date(event.target.value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDate <= today) {
            setPlantingDate(event.target.value);
        } else {
            setPlantingDate(format(today, 'yyyy-MM-dd'));
        }
    };

    const handlePlantNameChange = (event) => {
        setPlantName(event.target.value);

        const currentUser = auth.currentUser;
        if (currentUser) {
            setDoc(doc(db, 'users', currentUser.uid), {
                plantName: event.target.value
            }, { merge: true });
        }
    };

    const sendEmail = (temperature) => {
        const lastEmailTimestamp = localStorage.getItem('lastEmailTimestamp');
        const now = new Date().getTime();

        if (!lastEmailTimestamp || now - lastEmailTimestamp > 10 * 60 * 1000) {
            if (user) { // Ensure user is defined
                const templateParams = {
                    to_name: 'Justin Miguel',
                    message: `The temperature is too high: ${temperature}°C`,
                    user_email: user.email, // Use user.email
                };

                emailjs.send(
                    process.env.REACT_APP_EMAILJS_SERVICE_ID,
                    process.env.REACT_APP_EMAILJS_TEMPLATE_ID,
                    templateParams,
                    process.env.REACT_APP_EMAILJS_USER_ID
                )
                .then((response) => {
                    console.log('Email successfully sent!', response.status, response.text);
                    localStorage.setItem('lastEmailTimestamp', now);
                }, (err) => {
                    console.error('Failed to send email:', err);
                });
            }
        } else {
            console.log('Email not sent: 10 minutes have not passed yet.');
        }
    };

    return (
        <div className="Appsensor">
            <Header />
            <br/>
            <div className="sensor-content">
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
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                {temperature > 73 && (
                                    <Box sx={{ textAlign: 'center', margin: '0 16px' }}>
                                        <Typography component="div" className="temperature-alert-icon">🔥</Typography>
                                        <Typography variant="body2" className="temperature-alert-text">Too Hot</Typography>
                                    </Box>
                                )}
                                {temperature >= 15 && temperature <= 73 && (
                                    <Box sx={{ textAlign: 'center', margin: '0 16px' }}>
                                        <Typography component="div" className="temperature-alert-icon">✅</Typography>
                                        <Typography variant="body2" className="temperature-alert-text">Normal</Typography>
                                    </Box>
                                )}
                                {temperature < 15 && (
                                    <Box sx={{ textAlign: 'center', margin: '0 16px' }}>
                                        <Typography component="div" className="temperature-alert-icon">❄️</Typography>
                                        <Typography variant="body2" className="temperature-alert-text">Too Cold</Typography>
                                    </Box>
                                )}
                            </Box>
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
                        <CardContent className="gauge-container">
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
                        <CardContent className="gauge-container">
                            {humidity !== null ? (
                                <Gauge value={humidity} max={100} label="%" />
                            ) : (
                                <Typography variant="h6" className="loading-text">Loading...</Typography>
                            )}
                        </CardContent>
                    </Card>
                    <Card className="sensor-card">
                        <CardHeader 
                            title={
                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                    Plant Information
                                </Typography>
                            }
                        />
                        <CardContent>
                            <TextField
                                type="text"
                                value={plantName}
                                onChange={handlePlantNameChange}
                                fullWidth
                                variant="outlined"
                                label="Plant Name"
                                placeholder="Enter plant name"
                                className="plant-info-input"
                                sx={{ marginBottom: 2 }} // Add margin to the bottom
                            />
                            <TextField
                                type="date"
                                value={plantingDate}
                                onChange={handlePlantingDateChange}
                                fullWidth
                                variant="outlined"
                                label="Planting Date"
                                placeholder=''
                                className="plant-info-input"
                                sx={{ marginBottom: 1 }}
                                InputProps={{
                                    inputProps: { max: format(new Date(), 'yyyy-MM-dd') }
                                }}
                            />
                            {plantingDate && (
                                <Box
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between', // Align items on both sides
                                        alignItems: 'center',
                                        marginTop: 1,
                                    }}
                                >
                                    <Typography variant="body1" className="days-planted-text">
                                        Days planted: {daysSincePlanting}
                                    </Typography>
                                    
                                    {/* Save button aligned to the right */}
                                    <Button
                                        variant="contained"
                                        sx={{
                                            backgroundColor: '#388E3C', // Custom color
                                            '&:hover': {
                                                backgroundColor: '#2E7D32', // Darker shade for hover
                                            }
                                        }}
                                        onClick={() => window.location.reload()}
                                    >
                                        Save
                                    </Button>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Box>
            </div>
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
