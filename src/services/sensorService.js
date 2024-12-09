import axios from "axios";
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { sendEmailHot, sendEmailCold } from './emailService';
import { Typography } from "antd";

dayjs.extend(customParseFormat);

// Temperature thresholds
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


// Functions for pulling sensor data from Blynk API
export const fetchSensorData = async ({ selectedApiKey, user, setIsDeviceOnline, setTemperature, setHumidity, setIsLoading, setIsApiKeyValid }) => {
  try {
    const [deviceStatusResponse, temperatureResponse, humidityResponse] = await Promise.all([
      axios.get(`https://blynk.cloud/external/api/isHardwareConnected?token=${selectedApiKey}`),
      axios.get(`https://blynk.cloud/external/api/get?token=${selectedApiKey}&V0`),
      axios.get(`https://blynk.cloud/external/api/get?token=${selectedApiKey}&V1`)
    ]);

    setIsDeviceOnline(true); // Set to true for testing purposes
    setTemperature(temperatureResponse.data);
    setHumidity(humidityResponse.data);

    // Send email alerts only if device is online
    if (deviceStatusResponse.data) {
      if (canSendEmail()) {
        if (temperatureResponse.data > MAX_TEMPERATURE) {
          sendEmailHot(user, temperatureResponse.data);
          console.log("Email for Hot Temperature Sent");
          lastEmailSent = dayjs().toISOString();
        } else if (temperatureResponse.data < MIN_TEMPERATURE) {
          sendEmailCold(user, temperatureResponse.data);
          console.log("Email for Cold Temperature Sent");
          lastEmailSent = dayjs().toISOString();
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
  const plantingDay = dayjs(plantingDate, 'MM/DD/YYYY');
  return dayjs().diff(plantingDay, 'day');
};

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

export const StatusMessage = ({ message, className, style }) => (
  <Typography.Text strong className={className} style={style}>
    {message}
  </Typography.Text>
);