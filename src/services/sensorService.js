import { useState, useEffect } from "react";
import axios from "axios";
import { differenceInDays } from "date-fns";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useApiKey } from "../context/ApiKeyContext";
import { sendEmailHot, sendEmailCold } from './emailService';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { message } from "antd";

dayjs.extend(customParseFormat);

// Temperature thresholds in Celsius
export const MAX_TEMPERATURE = 73; 
export const MIN_TEMPERATURE = 15; 

// Time constants
const EMAIL_COOLDOWN_MINUTES = 10;
let lastEmailSent = null;

// To check if an email can be sent based on the cooldown period
const canSendEmail = () => {
  if (!lastEmailSent) return true;
  const now = dayjs(); // Using current time
  const timeSinceLastEmail = now.diff(dayjs(lastEmailSent), 'minute');
  const remainingMinutes = EMAIL_COOLDOWN_MINUTES - timeSinceLastEmail;
  if (remainingMinutes > 0) {
    console.log(`${remainingMinutes} minutes remaining before next email can be sent`);
  }
  return timeSinceLastEmail >= EMAIL_COOLDOWN_MINUTES;
};

export const fetchSensorData = async ({ selectedApiKey, user, setIsDeviceOnline, setTemperature, setHumidity, setIsApiKeyValid, setIsLoading }) => {
  try {
    // Check device online status
    const deviceStatusResponse = await axios.get(
      `https://blynk.cloud/external/api/isHardwareConnected?token=${selectedApiKey}`
    );

    setIsDeviceOnline(deviceStatusResponse.data);

    // Pulling Temperature Data
    const temperatureResponse = await axios.get(
      `https://blynk.cloud/external/api/get?token=${selectedApiKey}&V0`,
    );

    // Pulling Humidity Data
    const humidityResponse = await axios.get(
      `https://blynk.cloud/external/api/get?token=${selectedApiKey}&V1`,
    );
    
    setTemperature(temperatureResponse.data);
    setHumidity(humidityResponse.data);

    // Send email alerts only if device is online
    if (deviceStatusResponse.data) {
      if (canSendEmail()) {
        if (temperatureResponse.data > MAX_TEMPERATURE) {
          sendEmailHot(user, temperatureResponse.data);
          console.log("Email for Hot Temperature Sent");
          lastEmailSent = dayjs().toISOString(); // Using current time
        } else if (temperatureResponse.data < MIN_TEMPERATURE) {
          sendEmailCold(user, temperatureResponse.data);
          console.log("Email for Cold Temperature Sent");
          lastEmailSent = dayjs().toISOString(); // Using current time
        }
      }
    }

    setIsLoading(false);
    
  } catch (error) {
      console.error("Error fetching data from Blynk:", error);
      setIsApiKeyValid(false);
      setTemperature(null);
      setHumidity(null);
      setIsLoading(false);
    }
};

// Date-related utilities
export const calculateDaysSincePlanting = (plantingDate) => {
  if (!plantingDate) return 0;
  const plantingDay = dayjs(plantingDate, 'DD/MM/YYYY');
  return dayjs().diff(plantingDay, 'day');
};

export const disabledDate = (current) => {
  return current && current > dayjs().endOf('day');
};

export const getDatePickerConfig = (handlePlantingDateChange) => ({
  format: "DD/MM/YYYY",
  disabledDate: disabledDate,
  placeholder: "Select planting date",
  style: { width: '100%', marginBottom: 8 },
  onChange: handlePlantingDateChange,
  allowClear: true,
  showToday: true,
});

// Status configuration
export const getStatusConfig = (selectedApiKey, isApiKeyValid, isDeviceOnline) => [
  {
    when: !selectedApiKey,
    message: 'Please Add API Token',
    className: 'loading-text'
  },
  {
    when: !isApiKeyValid,
    message: 'Invalid API Token',
    className: 'error-text',
    style: { textAlign: 'center', color: '#ff4d4f' }
  },
  {
    when: !isDeviceOnline,
    message: 'Device Offline',
    style: { textAlign: 'center', color: '#ff4d4f' }
  }
];

// State change handlers
export const createHandlers = (auth, db, setDoc) => ({
  handleSave: (field, { plantName, plantingDate, daysSincePlanting, selectedApiKey }) => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      let dataToUpdate = {};
      if (field === "plantInfo") {
        dataToUpdate = {
          plantName,
          plantingDate: plantingDate ? plantingDate.format('DD/MM/YYYY') : null,
          daysSincePlanting,
        };
      } else if (field === "blynkApiKey") {
        dataToUpdate = { selectedApiKey };
      }

      return setDoc(doc(db, "users", currentUser.uid), dataToUpdate, { merge: true })
        .then(() => {
          message.success('Plant Data saved successfully!');
        })
        .catch((error) => {
          console.error("Error saving data: ", error);
        });
    }
  }
});

export const useSensorsLogic = () => {
  const [temperature, setTemperature] = useState(null);
  const [humidity, setHumidity] = useState(null);
  const [plantingDate, setPlantingDate] = useState(null);
  const [daysSincePlanting, setDaysSincePlanting] = useState(0);
  const [plantName, setPlantName] = useState("");
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isApiKeyValid, setIsApiKeyValid] = useState(false);
  const [isDeviceOnline, setIsDeviceOnline] = useState(true);
  const { selectedApiKey } = useApiKey();

  useEffect(() => {
    if (!selectedApiKey) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setIsApiKeyValid(true);

    const interval = setInterval(() => {
      fetchSensorData({
        selectedApiKey,
        user,
        setIsDeviceOnline,
        setTemperature,
        setHumidity,
        setIsApiKeyValid,
        setIsLoading,
      });
    }, 3000);

    return () => { clearInterval(interval); };
  }, [selectedApiKey]);

  useEffect(() => {
    const fetchUserData = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        setUser(currentUser);
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.plantingDate) {
            setPlantingDate(dayjs(data.plantingDate, 'DD/MM/YYYY'));
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
      const selectedDate = dayjs(plantingDate).toDate();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const days = differenceInDays(today, selectedDate);
      setDaysSincePlanting(days >= 0 ? days : 0);

      const currentUser = auth.currentUser;
      if (currentUser) {
        setDoc(
          doc(db, "users", currentUser.uid),
          {
            plantingDate: plantingDate.format('DD/MM/YYYY'),
            daysSincePlanting: days >= 0 ? days : 0,
          },
          { merge: true },
        );
      }
    }
  }, [plantingDate]);

  return {
    temperature,
    humidity,
    plantingDate,
    daysSincePlanting,
    plantName,
    user,
    isLoading,
    isApiKeyValid,
    selectedApiKey, 
    auth, 
    setDoc, 
    doc, 
    db,
    setPlantingDate,
    setPlantName,
    isDeviceOnline,
  };
};