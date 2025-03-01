import React, { useState, useEffect } from "react";
import { message } from "antd";
import "./css/Sensors.css";
import TempHumidCard from "./components/Sensors/TempHumid";
import FlowRate from "./components/Sensors/FlowRate";
import PlantInfo from "./components/Sensors/PlantInfo";
import { db, auth } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { 
  fetchSensorData,
  fetchUserData,
  calculateDaysSincePlanting,
  getDatePickerConfig,
  getStatusConfig
} from '../services/sensorService';

dayjs.extend(customParseFormat);

function Sensors() {

  // States for sensor data
  const [temperature, setTemperature] = useState(null);
  const [humidity, setHumidity] = useState(null);
  const [flowRate, setFlowRate] = useState(null);

  // States for plant info
  const [plantingDate, setPlantingDate] = useState(null);
  const [plantName, setPlantName] = useState("");
  const [isPlantInfoChanged, setIsPlantInfoChanged] = useState(false);


  const [isLoading, setIsLoading] = useState(false);

  // States for conditional rendering
  const [isApiKeyValid, setIsApiKeyValid] = useState(true);
  const [isDeviceOnline, setIsDeviceOnline] = useState(true);

  // States for user info
  // const { selectedApiKey } = useApiKey();
  const [user, setUser] = useState(null);
  const [selectedApiKey, setSelectedApiKey] = useState(null);

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
          setIsDeviceOnline,
          setTemperature,
          setHumidity,
          setFlowRate,
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
    fetchUserData(setUser, setPlantingDate, setPlantName, setSelectedApiKey);
  }, []);

  // Automatically sync daysSincePlanting
  useEffect(() => {
    const syncDaysSincePlanting = async () => {
      const currentUser = auth.currentUser;
      if (currentUser && plantingDate) {
        try {
          const daysSincePlanting = calculateDaysSincePlanting(plantingDate);

          await setDoc(doc(db, "users", currentUser.uid), {
            daysSincePlanting
          }, { merge: true });

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
    <>
      <div className="sensor-page-container">

        <div className="sensor-content-container">

          <div className="sensor-cards-container">

            <TempHumidCard
              temperature={temperature}
              humidity={humidity}
              status={status}
            />

            <FlowRate
             flowRate={flowRate}
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
    </>
  );
}

export default Sensors;