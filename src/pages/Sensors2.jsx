import React, { useState, useEffect } from "react";
import { Typography, Card, Button, Flex, Input, DatePicker, message } from "antd";
import Header from "../components/Header";
import "./css/Sensors.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faThermometerHalf, faTint, faExclamationTriangle, faLeaf } from "@fortawesome/free-solid-svg-icons";
import Gauge from "../components/Gauge";
import { db, auth } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { useApiKey } from "../context/ApiKeyContext";
import { StatusMessage } from "../services/sensorService";
import { 
  fetchSensorData,
  MAX_TEMPERATURE,
  MIN_TEMPERATURE,
  calculateDaysSincePlanting,
  getDatePickerConfig,
  getStatusConfig
} from '../services/sensorService';

dayjs.extend(customParseFormat);

function Sensors2() {
  const [temperature, setTemperature] = useState(null);
  const [humidity, setHumidity] = useState(null);
  const [plantingDate, setPlantingDate] = useState(null);
  const [plantName, setPlantName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isApiKeyValid, setIsApiKeyValid] = useState(true);
  const [isDeviceOnline, setIsDeviceOnline] = useState(true);
  const [isPlantInfoChanged, setIsPlantInfoChanged] = useState(false);
  const { selectedApiKey } = useApiKey();
  const [user, setUser] = useState(null);

  // Fetch sensor data effect
  useEffect(() => {
    if (!selectedApiKey) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    let isMounted = true;
    const controller = new AbortController();

    const fetchData = async () => {
      if (isMounted) {
        await fetchSensorData({
          selectedApiKey,
          user,
          setIsDeviceOnline,
          setTemperature,
          setHumidity,
          setIsLoading,
          setIsApiKeyValid,
          signal: controller.signal
        });
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 2000);

    return () => {
      isMounted = false;
      controller.abort();
      clearInterval(interval);
    };
  }, [selectedApiKey, user]);

  // Fetch user data effect
  useEffect(() => {
    const fetchUserData = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        setUser(currentUser);

        // Check cache first
        const cachedData = localStorage.getItem(`plantData_${currentUser.uid}`);
        if (cachedData) {
          const parsedData = JSON.parse(cachedData);
          const cacheTimestamp = parsedData.timestamp;
          const currentTime = new Date().getTime(); // This is in UTC format

          // Check if cache is less than 5 minutes old
          if ( currentTime - cacheTimestamp < 5 * 60 * 1000) {
            if (parsedData.plantingDate) {
              setPlantingDate(dayjs(parsedData.plantingDate, 'MM/DD/YYYY'))
            }
            if (parsedData.plantName) {
              setPlantName(parsedData.plantName);
            }
            return;
          }
        }

        // If cache is not available or expired, fetch from Firestore
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.plantingDate) {
            setPlantingDate(dayjs(data.plantingDate, 'MM/DD/YYYY'));
          }
          if (data.plantName) {
            setPlantName(data.plantName);
          }

          // Update cache after fetching
          localStorage.setItem(`plantData_${currentUser.uid}`, JSON.stringify({
            ...data,
            timestamp: new Date().getTime()
          }));
        }
      }
    };

    fetchUserData();
  }, []);

  const handlePlantingDateChange = (date) => {
    setPlantingDate(date);
    setIsPlantInfoChanged(true);
  };

  const handlePlantNameChange = (event) => {
    setPlantName(event.target.value);
    setIsPlantInfoChanged(true);
  };

  const handleSaveChanges = async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        await setDoc(doc(db, "users", currentUser.uid), {
          plantName,
          plantingDate: plantingDate ? plantingDate.format('MM/DD/YYYY') : null,
          daysSincePlanting: calculateDaysSincePlanting(plantingDate)
        }, { merge: true });

        // Update cache data upon saving
        localStorage.setItem(`plantData_${currentUser.uid}`, JSON.stringify({
          plantName,
          plantingDate: plantingDate ? plantingDate.format('MM/DD/YYYY') : null,
          daysSincePlanting: calculateDaysSincePlanting(plantingDate),
          timestamp: new Date().getTime()
        }));
        
        message.success('Plant data saved successfully!');
        setIsPlantInfoChanged(false);
      } catch (error) {
        message.error('Failed to save plant data:', error);
      }
    }
  };

  const daysSincePlanting = calculateDaysSincePlanting(plantingDate);
  const datePickerConfig = getDatePickerConfig(handlePlantingDateChange);
  const status = getStatusConfig(selectedApiKey, isApiKeyValid, isDeviceOnline, isLoading)
    .find(status => status.when);

  return (
    <div style={{ width: '100%', overflowX: 'hidden' }}>
      <Header />

      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        padding: '0.4rem',
        margin: '0 auto',
      }}>

        <div
          style={{
            maxWidth: '100vw',
            borderRadius: '14px',
            height: 'fit-content',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column',
            padding: '1.8rem'
          }}>

          <Flex gap="middle" style={{ 
            width: '100%', 
            height: 'fit-content', 
            marginTop: '-14px' 
            }}>

            <div style={{ width: '94vw', maxWidth: '600px', display: 'flex', flexDirection: 'row', marginTop: '-20px', borderRadius: '10px', justifyContent: 'center', border: '1px solid #ddd', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)', marginBottom: '10px' }}>
              <Card
                title={
                  <div style={{ fontSize: '16px' }}>
                    <FontAwesomeIcon icon={faThermometerHalf} style={{ marginRight: 10 }} />
                    Temperature
                  </div>
                }
                bordered={false}
                style={{
                  minWidth: '50%',
                  height: 230,
                  background: 'white',
                  borderBottomRightRadius: '0',
                  borderTopRightRadius: '0',
                }}>

                <div className="gauge-container">
                  {status && (
                    <StatusMessage message={status.message} className={status.className} style={status.style} />
                  )}
                  {!status && temperature !== null && (
                    <Gauge value={temperature} max={MAX_TEMPERATURE} label="°C" />
                  )}
                </div>
              </Card>

              <Card
                title={
                  <div style={{ fontSize: '16px' }}>
                    <FontAwesomeIcon icon={faTint} style={{ marginRight: 10 }} />
                    Humidity
                  </div>
                }
                bordered={false}
                style={{
                  minWidth: '50%',
                  height: 230,
                  overflowY: 'hidden',
                  borderBottomLeftRadius: '0',
                  borderTopLeftRadius: '0',
                }}
              >
                <div className="gauge-container">
                  {status && (
                    <StatusMessage message={status.message} className={status.className} style={status.style} />
                  )}
                  {!status && humidity !== null && (
                    <Gauge value={humidity} max={100} label="%" />
                  )}
                </div>
              </Card>
            </div>
          </Flex>

          <Card
            title={
              <div style={{ fontSize: '16px', textAlign: 'center' }}>
                <FontAwesomeIcon icon={faExclamationTriangle} /> Temperature Alert
              </div>
            }
            style={{
              width: '100%',
              height: 230,
              background: 'white',
              border: '1px solid #ddd',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              marginBottom: '10px'
            }}>
            {status && (
              <StatusMessage message={status.message} className={status.className} style={status.style} />
            )}
            {!status && temperature > MAX_TEMPERATURE && (
              <div>
                <Typography.Text strong className="temperature-alert-icon">
                  🔥 <br />
                </Typography.Text>
                <Typography.Text strong>
                  Too Hot
                </Typography.Text>
              </div>
            )}
            {!status && temperature >= MIN_TEMPERATURE && temperature <= MAX_TEMPERATURE && (
              <div>
                <Typography.Text strong className="temperature-alert-icon">
                  ✅ <br />
                </Typography.Text>
                <Typography.Text strong className="temperature-alert-text">
                  Normal
                </Typography.Text>
              </div>
            )}
            {!status && temperature < MIN_TEMPERATURE && (
              <div>
                <Typography.Text strong className="temperature-alert-icon">
                  ❄️ <br />
                </Typography.Text>
                <Typography.Text strong className="temperature-alert-text">
                  Too Cold
                </Typography.Text>
              </div>
            )}
          </Card>

          <Card
            title={
              <div style={{ fontSize: '16px' }}>
                <FontAwesomeIcon icon={faLeaf} style={{ marginRight: 10 }} />
                Plant Information
              </div>
            }
            bordered={false}
            style={{
              width: '100%',
              height: 230,              
              background: 'white',
              border: '1px solid #ddd',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              marginBottom: '10px'
            }}
          >
            {status && (
              <StatusMessage message={status.message} className={status.className} style={status.style} />
            )}
            {!status && (
              <div>
                <div style={{ width: '100%' }}>
                  <Input
                    type="text"
                    id="plantName"
                    name="plantName"
                    value={plantName}
                    onChange={handlePlantNameChange}
                    placeholder="Enter plant name"
                    style={{ width: '100%', marginBottom: 16 }}
                  />
                  <DatePicker
                    {...datePickerConfig}
                    id="plantingDate"
                    name="plantingDate"
                    onFocus={e => e.target.blur()}
                    value={plantingDate ? dayjs(plantingDate, 'DD/MM/YYYY') : null}
                  />
                </div>
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ textAlign: 'left' }}>
                    {plantingDate && (
                      <Typography.Text strong style={{ fontWeight: 540, fontFamily: 'Inter, sans-serif', marginTop: '12px', textAlign: 'left', marginLeft:'1px' }}>
                        Days planted: {daysSincePlanting}
                      </Typography.Text>
                    )}
                  </div>
                  {isPlantInfoChanged && (
                    <Button
                      type="primary"
                      style={{ fontSize: '14px', marginBottom: '-18px', marginTop:'10px'}}
                      onClick={handleSaveChanges}
                    >
                      Save
                    </Button>
                  )}
                </div>

              </div>
            )}
          </Card>

        </div>

        <div className="ask-aiponics-container">
          <a href="/chat" className="ask-aiponics-button">
            <img
              src="/img/aiponicsbot.png"
              alt="AI-Ponics Bot"
              className="profile-pic"
            />
          </a>
        </div>

      </div>
    </div>
  );
}

export default Sensors2;