import axios from "axios";
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { Typography } from "antd";
import { db, auth } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

dayjs.extend(customParseFormat);

// Thresholds based on plantName
export const getPlantData = (plantName) => {
  const plantData = {
    Lettuce: {
      MIN_TEMPERATURE: 15,
      MAX_TEMPERATURE: 21,
      MIN_HUMIDITY: 50,
      MAX_HUMIDITY: 70,
      MIN_PH_LEVEL: 5.5,
      MAX_PH_LEVEL: 6.5,
      DISEASES: {
        "Root rot (Pythium)": "Oxygenate solution, clean system.",
        "Powdery mildew": "Improve airflow, reduce humidity.",
        "Gray mold (Botrytis)": "Remove infected leaves, lower humidity.",
        "Tip burn": "Maintain calcium levels.",
      },
      NOTES: [
        "Lettuce doesn't demand a lot of light, so start with 10 to 14 hours of moderate to low light each day.",
        "If plants don't get enough light, they won't grow efficiently, while too much light may cause the leaves to go bitter.",
        "If temp goes up to 21°C, it will introduce bolting and result in bitter lettuce.",
        "Nutrient solution temp at 21.1°C increases shoot fresh weight by 15%.",
        "Use shade and airflow during heat, maintain appropriate ventilation.",
      ],
    },
    Basil: {
      MIN_TEMPERATURE: 24,
      MAX_TEMPERATURE: 29,
      MIN_HUMIDITY: 60,
      MAX_HUMIDITY: 80,
      MIN_PH_LEVEL: 5.5,
      MAX_PH_LEVEL: 6.5,
      DISEASES: {
        "Downy mildew": "Reduce humidity.",
        "Fusarium": "Sterilize medium, maintain pH.",
        "Root rot": "Ensure drainage.",
      },
      NOTES: [
        "When harvesting, cut the leaves as needed to promote new growth.",
        "Store basil in a vented bag at around 15°C to increase shelf life to 10-12 days.",
        "Use a hydroponic nutrient regimen high in nitrogen, and consider adding Cal-Mag for magnesium and calcium.",
        "Prune basil once it reaches 6 inches in height by cutting the main stalk just above a growth node to encourage lateral growth.",
      ],
    },
    Spinach: {
      MIN_TEMPERATURE: 15,
      MAX_TEMPERATURE: 18,
      MIN_HUMIDITY: 50,
      MAX_HUMIDITY: 70,
      MIN_PH_LEVEL: 6.0,
      MAX_PH_LEVEL: 7.0,
      DISEASES: {
        "Downy mildew": "Improve airflow.",
        "Leaf spot": "Remove leaves, avoid wet foliage.",
        "Root rot": "Clean system.",
      },
      NOTES: [
        "Start with a weaker nutrient solution (about ¼ strength) and gradually increase as plants grow.",
        "Harvest outer leaves and stagger planting every 2–3 weeks.",
        "Keep cool to prevent bolting; add iron for yellowing.",
        "Requires 10–14 hours of light per day, with blue or white light ideal for chlorophyll production.",
      ],
    },
    Strawberries: {
      MIN_TEMPERATURE: 18,
      MAX_TEMPERATURE: 24,
      MIN_HUMIDITY: 65,
      MAX_HUMIDITY: 75,
      MIN_PH_LEVEL: 5.8,
      MAX_PH_LEVEL: 6.2,
      DISEASES: {
        "Gray mold": "Improve airflow.",
        "Anthracnose": "Remove infected fruit.",
        "Verticillium wilt": "Use resistant varieties.",
      },
      NOTES: [
        "Ensure a well-balanced nutrient solution with primary and secondary nutrients.",
        "Manually pollinate using a small paintbrush to transfer pollen.",
        "Maintain consistent lighting with full-spectrum grow lights for 8–12 hours daily.",
        "Prune old or diseased leaves and runners to promote air circulation.",
        "Ensure the crown is at the correct height in the growing medium to avoid root rot.",
      ],
    },
    Tomatoes: {
      MIN_TEMPERATURE: 20,
      MAX_TEMPERATURE: 30,
      MIN_HUMIDITY: 50,
      MAX_HUMIDITY: 70,
      MIN_PH_LEVEL: 5.8,
      MAX_PH_LEVEL: 6.3,
      DISEASES: {
        "Fusarium wilt": "Use resistant varieties.",
        "Blight": "Remove infected leaves, improve airflow.",
        "Tobacco mosaic virus": "Sanitize tools, remove infected plants.",
        "Root rot": "Avoid overwatering.",
      },
      NOTES: [
        "Prune suckers and support with trellises; hand-pollinate if necessary.",
        "Adjust calcium for blossom-end rot and magnesium for yellow leaves.",
        "Provide 14–16 hours of light daily; LED grow lights are efficient.",
        "Regular pruning is essential for indeterminate tomatoes.",
        "Control the environment with grow lights, ventilation, and temperature regulation.",
        "Change the nutrient solution weekly and check pH regularly.",
      ],
    },
  };

  return plantData[plantName] || null;
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