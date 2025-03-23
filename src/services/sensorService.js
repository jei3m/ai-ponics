import axios from "axios";
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { Typography } from "antd";
import { db, auth } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

dayjs.extend(customParseFormat);

// Thresholds based on plantName
export const getPlantThresholds = (plantName) => {
  const thresholds = {
    Lettuce: {
      MIN_TEMPERATURE: 15,
      MAX_TEMPERATURE: 21,
      MIN_HUMIDITY: 50,
      MAX_HUMIDITY: 70,
      MIN_PH_LEVEL: 5.5,
      MAX_PH_LEVEL: 6.5,
    },
    Basil: {
      MIN_TEMPERATURE: 24,
      MAX_TEMPERATURE: 29,
      MIN_HUMIDITY: 60,
      MAX_HUMIDITY: 80,
      MIN_PH_LEVEL: 5.5,
      MAX_PH_LEVEL: 6.5,
    },
    Spinach: {
      MIN_TEMPERATURE: 15,
      MAX_TEMPERATURE: 18,
      MIN_HUMIDITY: 50,
      MAX_HUMIDITY: 70,
      MIN_PH_LEVEL: 6.0,
      MAX_PH_LEVEL: 7.0,
    },
    Strawberries: {
      MIN_TEMPERATURE: 18,
      MAX_TEMPERATURE: 24,
      MIN_HUMIDITY: 65,
      MAX_HUMIDITY: 75,
      MIN_PH_LEVEL: 5.8,
      MAX_PH_LEVEL: 6.2,
    },
    Tomatoes: {
      MIN_TEMPERATURE: 20,
      MAX_TEMPERATURE: 30,
      MIN_HUMIDITY: 50,
      MAX_HUMIDITY: 70,
      MIN_PH_LEVEL: 5.8,
      MAX_PH_LEVEL: 6.3,
    },
  };

  return thresholds[plantName] || null;
};

// Flow rate thresholds 
export const MAX_FLOWRATE  = 30;

// Functions for pulling sensor data from Blynk API
export const fetchSensorData = async ({ selectedApiKey, setIsDeviceOnline, setTemperature, setHumidity, setFlowRate, setpHlevel, setIsLoading, setIsApiKeyValid }) => {
  try {
    const [deviceStatusResponse, temperatureResponse, humidityResponse, flowResponse, pHResponse] = await Promise.all([
      axios.get(`https://blynk.cloud/external/api/isHardwareConnected?token=${selectedApiKey}`),
      axios.get(`https://blynk.cloud/external/api/get?token=${selectedApiKey}&V0`),
      axios.get(`https://blynk.cloud/external/api/get?token=${selectedApiKey}&V1`),
      axios.get(`https://blynk.cloud/external/api/get?token=${selectedApiKey}&V2`),
      axios.get(`https://blynk.cloud/external/api/get?token=${selectedApiKey}&V3`)
    ]);

    // Round temperature and humidity values
    const roundedTemperature = Math.round(temperatureResponse.data);
    const roundedHumidity = Math.round(humidityResponse.data);

    setIsDeviceOnline(true);
    setTemperature(roundedTemperature);
    setHumidity(roundedHumidity);
    setFlowRate(flowResponse.data)
    setpHlevel(pHResponse.data)
    setIsLoading(false);
    
  } catch (error) {
    console.error("Error fetching data from Blynk:", error);
    setIsApiKeyValid(false);
    setTemperature(null);
    setHumidity(null);
    setIsLoading(false);
  }
};

// Fetch user data for plant info
export const fetchUserData = async (setUser, setPlantingDate, setPlantName, setSelectedApiKey) => {
  const currentUser = auth.currentUser;
  if (currentUser) {
    setUser(currentUser);

    // Fetch data directly from Firestore
    const docRef = doc(db, "users", currentUser.uid);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.log("No such document!");
      return;
    }

    const {
      plantingDate = null,
      plantName = "",
      selectedApiKey = "",
    } = docSnap.data();

    setPlantingDate(dayjs(plantingDate, 'MM/DD/YYYY'));
    setPlantName(plantName);
    setSelectedApiKey(selectedApiKey);
  }
};

// Date-related utilities
export const calculateDaysSincePlanting = (plantingDate) => {
  if (!plantingDate) return 0;
  const plantingDay = dayjs(plantingDate, 'MM/DD/YYYY');
  return dayjs().diff(plantingDay, 'day');
};

// Configuration for date picker
export const getDatePickerConfig = (handlePlantingDateChange) => ({
  format: "MM/DD/YYYY",
  disabledDate: (current) => current && current.isAfter(dayjs(), 'day'),
  placeholder: "Select planting date",
  style: { width: '100%', marginBottom: 8 },
  onChange: handlePlantingDateChange,
  allowClear: true,
  showToday: true,
});

// Status configuration
export const getStatusConfig = (selectedApiKey, isApiKeyValid, isDeviceOnline, isLoading) => [
  {
    when: isLoading,
    message: 'Loading...',
    className: 'loading-text'
  },
  {
    when: !selectedApiKey,
    message: 'Please Add API Key',
    className: 'loading-text'
  },
  {
    when: !isApiKeyValid,
    message: 'Invalid API Key',
    className: 'error-text',
    style: { textAlign: 'center', color: '#ff4d4f' }
  },
  {
    when: !isDeviceOnline,
    message: 'Device Offline',
    style: { textAlign: 'center', color: '#ff4d4f' }
  }
];

// Status message component
export const StatusMessage = ({ message, className, style }) => (
  <Typography.Text strong className={className} style={style}>
    {message}
  </Typography.Text>
);