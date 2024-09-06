import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Typography, Card, CardContent, CardHeader, Box, TextField, Button } from '@mui/material';
import { differenceInDays, format} from 'date-fns';
import emailjs from 'emailjs-com';
import { Gauge } from '../components/Gauge';
import Header from '../components/Header';
import { db, auth } from '../firebase';  // Import Firebase
import { doc, setDoc, getDoc } from 'firebase/firestore';  // Firestore methods
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './css/Sensors.css'

function Sensors() {
    const [temperature, setTemperature] = useState(null);
    const [humidity, setHumidity] = useState(null);
    const [plantingDate, setPlantingDate] = useState('');
    const [daysSincePlanting, setDaysSincePlanting] = useState(0);
    const [temperatureAlert, setTemperatureAlert] = useState('');
    const [plantName, setPlantName] = useState('');
    const [user, setUser] = useState(null); 
    const [isDataChanged, setIsDataChanged] = useState(false);
    const [blynkApiKey, setBlynkApiKey] = useState('');
    const [showBlynkApiKey, setShowBlynkApiKey] = useState(false);
    const [isPlantInfoChanged, setIsPlantInfoChanged] = useState(false);
    const [isBlynkApiKeyChanged, setIsBlynkApiKeyChanged] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isApiKeyValid, setIsApiKeyValid] = useState(true);
    const [toastShown, setToastShown] = useState(false);

    useEffect(() => {
        if (!blynkApiKey) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setIsApiKeyValid(true);

        const fetchSensorData = async () => {
            try {
                const temperatureResponse = await axios.get(`https://blynk.cloud/external/api/get?token=${blynkApiKey}&V0`);
                const humidityResponse = await axios.get(`https://blynk.cloud/external/api/get?token=${blynkApiKey}&V1`);
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
                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching data from Blynk:', error);
                setIsApiKeyValid(false);
                setTemperature(null);
                setHumidity(null);
                setTemperatureAlert('Error fetching data');
                if (!toastShown) {
                    toast.error('Error fetching data. Please check your API token and try again.', {
                        position: "top-right",
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        onClose: () => setToastShown(false)
                    });
                    setToastShown(true);
                }
                setIsLoading(false);
            }
        };

        fetchSensorData();
        const interval = setInterval(fetchSensorData, 5000);

        return () => clearInterval(interval);
    }, [blynkApiKey, toastShown]); // Add blynkApiKey to the dependency array

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
                    if (data.blynkApiKey) {
                        setBlynkApiKey(data.blynkApiKey);
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
            const selectedDate = new Date(plantingDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const days = differenceInDays(today, selectedDate);
            setDaysSincePlanting(days >= 0 ? days : 0);

            // Save planting date and days since planting to Firestore when it changes
            const currentUser = auth.currentUser;
            if (currentUser) {
                setDoc(doc(db, 'users', currentUser.uid), {
                    plantingDate: plantingDate,
                    daysSincePlanting: days >= 0 ? days : 0
                }, { merge: true });
            }
        }
    }, [plantingDate]);

    const handlePlantingDateChange = (event) => {
        setPlantingDate(event.target.value);
        setIsPlantInfoChanged(true);
    };

    const handlePlantNameChange = (event) => {
        setPlantName(event.target.value);
        setIsPlantInfoChanged(true);

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
            if (user) { 
                const templateParams = {
                    to_name: user.displayName || 'User', 
                    message: `The temperature is too high: ${temperature}°C`,
                    user_email: user.email, 
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

    const handleBlynkApiKeyChange = (event) => {
        setBlynkApiKey(event.target.value);
        setIsBlynkApiKeyChanged(true);
    };

    const toggleBlynkApiKeyVisibility = () => {
        setShowBlynkApiKey(!showBlynkApiKey);
    };

    const handleSave = (field) => {
        const currentUser = auth.currentUser;
        if (currentUser) {
            let dataToUpdate = {};
            if (field === 'plantInfo') {
                dataToUpdate = { 
                    plantName, 
                    plantingDate,
                    daysSincePlanting // Add this line to include daysSincePlanting
                };
                setIsPlantInfoChanged(false);
            } else if (field === 'blynkApiKey') {
                dataToUpdate = { blynkApiKey };
                setIsBlynkApiKeyChanged(false);
            }

            setDoc(doc(db, 'users', currentUser.uid), dataToUpdate, { merge: true })
                .then(() => {
                    window.location.reload();
                })
                .catch((error) => {
                    console.error("Error saving data: ", error);
                });
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
                                <Typography variant="h6" sx={{ fontWeight: 'bold', fontFamily: 'Nunito, sans-serif' }}>
                                    Temperature Alert
                                </Typography>
                            }
                        />
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                {!blynkApiKey ? (
                                    <Typography variant="h6" className="loading-text">Add API Token</Typography>
                                ) : isLoading ? (
                                    <Typography variant="h6" className="loading-text">Loading...</Typography>
                                ) : !isApiKeyValid ? (
                                    <Typography variant="h6" className="error-text">Invalid API Token</Typography>
                                ) : temperature > 73 ? (
                                    <Box sx={{ textAlign: 'center', margin: '0 16px' }}>
                                        <Typography component="div" className="temperature-alert-icon">🔥</Typography>
                                        <Typography variant="body2" className="temperature-alert-text">Too Hot</Typography>
                                    </Box>
                                ) : temperature >= 15 && temperature <= 73 ? (
                                    <Box sx={{ textAlign: 'center', margin: '0 16px' }}>
                                        <Typography component="div" className="temperature-alert-icon">✅</Typography>
                                        <Typography variant="body2" className="temperature-alert-text">Normal</Typography>
                                    </Box>
                                ) : (
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
                                <Typography variant="h6" sx={{ fontWeight: 'bold', fontFamily: 'Nunito, sans-serif' }}>
                                    Temperature
                                </Typography>
                            }
                        />
                        <CardContent className="gauge-container">
                            {!blynkApiKey ? (
                                <Typography variant="h6" className="loading-text">Add API Token</Typography>
                            ) : !isApiKeyValid ? (
                                <Typography variant="h6" className="error-text">Invalid API Token</Typography>
                            ) : temperature !== null ? (
                                <Gauge value={temperature} max={50} label="°C" />
                            ) : (
                                <Typography variant="h6" className="loading-text">Loading...</Typography>
                            )}
                        </CardContent>
                    </Card>
                    <Card className="sensor-card">
                        <CardHeader 
                            title={
                                <Typography variant="h6" sx={{ fontWeight: 'bold', fontFamily: 'Nunito, sans-serif' }}>
                                    Humidity
                                </Typography>
                            }
                        />
                        <CardContent className="gauge-container">
                            {!blynkApiKey ? (
                                <Typography variant="h6" className="loading-text">Add API Token</Typography>
                            ) : !isApiKeyValid ? (
                                <Typography variant="h6" className="error-text">Invalid API Token</Typography>
                            ) : humidity !== null ? (
                                <Gauge value={humidity} max={100} label="%" />
                            ) : (
                                <Typography variant="h6" className="loading-text">Loading...</Typography>
                            )}
                        </CardContent>
                    </Card>
                    <Card className="sensor-card">
                        <CardHeader 
                            title={
                                <Typography variant="h6" sx={{ fontWeight: 'bold', fontFamily: 'Nunito, sans-serif' }}>
                                    Plant Information
                                </Typography>
                            }
                        />
                        <CardContent>
                            {!blynkApiKey ? (
                                <Typography variant="h6" className="loading-text" sx={{ textAlign: 'center' }}>Add API Token</Typography>
                            ) : !isApiKeyValid ? (
                                <Typography variant="h6" className="error-text" sx={{ textAlign: 'center' }}>Invalid API Token</Typography>
                            ) : (
                                <>
                                    <TextField
                                        type="text"
                                        value={plantName}
                                        onChange={handlePlantNameChange}
                                        fullWidth
                                        variant="outlined"
                                        label="Plant Name"
                                        placeholder="Enter plant name"
                                        className="plant-info-input"
                                        sx={{ marginBottom: 2 }}
                                    />
                                    <TextField
                                        type="date"
                                        value={plantingDate}
                                        onChange={handlePlantingDateChange}
                                        fullWidth
                                        variant="outlined"
                                        label=""
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
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginTop: 1,
                                            }}
                                        >
                                            <Typography variant="body1" className="days-planted-text">
                                                Days planted: {daysSincePlanting}
                                            </Typography>
                                            {isPlantInfoChanged && (
                                                <Button
                                                    variant="contained"
                                                    sx={{
                                                        backgroundColor: '#388E3C',
                                                        '&:hover': {
                                                            backgroundColor: '#2E7D32',
                                                        }
                                                    }}
                                                    onClick={() => handleSave('plantInfo')}
                                                >
                                                    Save
                                                </Button>
                                            )}
                                        </Box>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>
                    <Card className="sensor-card">
                        <CardHeader 
                            title={
                                <Typography variant="h6" sx={{ fontWeight: 'bold', fontFamily: 'Nunito, sans-serif' }}>
                                    Blynk API Token
                                </Typography>
                            }
                        />
                        <CardContent>
                            <TextField
                                type={showBlynkApiKey ? "text" : "password"}
                                value={blynkApiKey}
                                onChange={handleBlynkApiKeyChange}
                                fullWidth
                                variant="outlined"
                                label="Blynk API Token"
                                placeholder="Enter your Blynk API Token"
                                className="blynk-api-input"
                                sx={{ marginBottom: 2 }}
                                InputProps={{
                                    endAdornment: (
                                        <Button onClick={toggleBlynkApiKeyVisibility}>
                                            {showBlynkApiKey ? "Hide" : "Show"}
                                        </Button>
                                    ),
                                }}
                            />
                            {isBlynkApiKeyChanged && (
                                <Button
                                    variant="contained"
                                    sx={{
                                        backgroundColor: '#388E3C',
                                        '&:hover': {
                                            backgroundColor: '#2E7D32',
                                        }
                                    }}
                                    onClick={() => handleSave('blynkApiKey')}
                                >
                                    Save
                                </Button>
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
            <ToastContainer />
        </div>
    );
}

export default Sensors;