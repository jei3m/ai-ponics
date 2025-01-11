import React, { useState, useEffect } from "react";
import { message } from "antd";
import Header from "./components/Header";
import "./css/Sensors.css";
import TempHumidCard from "./components/Sensors/TempHumid";
import TempStatus from "./components/Sensors/TempStatus";
import PlantInfo from "./components/Sensors/PlantInfo";
import { db, auth } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { useApiKey } from "../context/ApiKeyContext";
import { 
  fetchSensorData,
  calculateDaysSincePlanting,
  getDatePickerConfig,
  getStatusConfig
} from '../services/sensorService';

dayjs.extend(customParseFormat);

function Sensors() {
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

  // Automatically sync daysSincePlanting
  useEffect(() => {
    const syncDaysSincePlanting = async () => {
      const currentUser = auth.currentUser;
      if (currentUser && plantingDate) {
        try {
          const daysSincePlanting = calculateDaysSincePlanting(plantingDate);

          await setDoc(doc(db, "users", currentUser.uid), {
            plantName,
            plantingDate: plantingDate ? plantingDate.format('MM/DD/YYYY') : null,
            daysSincePlanting
          }, { merge: true });

          // Update cache data upon syncing
          localStorage.setItem(`plantData_${currentUser.uid}`, JSON.stringify({
            plantName,
            plantingDate: plantingDate ? plantingDate.format('MM/DD/YYYY') : null,
            daysSincePlanting,
            timestamp: new Date().getTime()
          }));

          // console.log('Days since planting synced successfully!');
        } catch (error) {
          console.error('Failed to sync days since planting:', error);
          message.error('Failed to sync days since planting:', error.message);
        }
      }
    };

    syncDaysSincePlanting();
  }, [plantingDate]);

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

          <TempHumidCard
            temperature={temperature}
            humidity={humidity}
            status={status}
          />

          <TempStatus
            temperature={temperature}
            status={status}
          />

          <PlantInfo
            status={status}
            plantName={plantName}
            handlePlantNameChange={handlePlantNameChange}
            datePickerConfig={datePickerConfig}
            plantingDate={plantingDate}
            daysSincePlanting={daysSincePlanting}
            isPlantInfoChanged={isPlantInfoChanged}
            handleSaveChanges={handleSaveChanges}
          />

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

export default Sensors;