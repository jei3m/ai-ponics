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
        "Root rot (Pythium)": {
          Symptoms: "Wilting, brown/black decaying roots, stunted growth.",
          Prevention: "Keep water oxygenated and control solution temperature.",
          Cure: "Oxygenate the solution and clean the system regularly.",
        },
        "Powdery mildew": {
          Symptoms: "White, powdery spots on the leaves.",
          Prevention: "Ensure good airflow and avoid prolonged high humidity.",
          Cure: "Improve airflow and reduce humidity around the plants.",
        },
        "Gray mold (Botrytis)": {
          Symptoms: "Fuzzy, gray mold on leaves, especially in damp conditions.",
          Prevention: "Avoid overcrowding and water directly on foliage.",
          Cure: "Remove infected leaves and lower ambient humidity.",
        },
        "Tip burn": {
          Symptoms: "Browning or burning at the leaf edges.",
          Prevention: "Ensure proper calcium levels in the nutrient mix.",
          Cure: "Adjust nutrient levels to restore adequate calcium.",
        },
      },
      NOTES: [
        "Lettuce doesn't demand a lot of light, so start with 10 to 14 hours of moderate to low light each day.",
        "If plants don't get enough light, they won't grow efficiently, while too much light may cause the leaves to go bitter.",
        "If temp goes up to 21°C, it will introduce bolting and result in bitter lettuce.",
        "Nutrient solution temp at 21.1°C increases shoot fresh weight by 15%.",
        "Use shade and airflow during heat, maintain appropriate ventilation.",
      ],
      SEASONAL_DATA: {
        "Dry Season (March to May)": {
          pH: "5.5–6.5",
          Humidity: "50–70%",
          Temperature: "60–70°F (15–21°C)",
          SolutionTemperature: "65–68°F (18–20°C)",
        },
      },
    },
    Basil: {
      MIN_TEMPERATURE: 24,
      MAX_TEMPERATURE: 29,
      MIN_HUMIDITY: 60,
      MAX_HUMIDITY: 80,
      MIN_PH_LEVEL: 5.5,
      MAX_PH_LEVEL: 6.5,
      DISEASES: {
        "Downy mildew": {
          Symptoms: "Yellow or discolored spots with fuzzy growth on the undersides of leaves.",
          Prevention: "Maintain proper ventilation and moderate humidity.",
          Cure: "Reduce humidity and improve airflow around the plants.",
        },
        "Fusarium": {
          Symptoms: "Wilting, yellowing leaves, and possible stem discoloration.",
          Prevention: "Sterilize the growing medium and monitor pH closely.",
          Cure: "Replace or sterilize the medium and adjust pH as needed.",
        },
        "Root rot": {
          Symptoms: "Mushy, discolored roots leading to overall wilting.",
          Prevention: "Ensure excellent drainage in the system.",
          Cure: "Improve drainage and remove any infected portions.",
        },
      },
      NOTES: [
        "Harvest by cutting leaves as needed to promote new growth.",
        "For storage, keep basil in a vented bag at around 60°F (15°C) to extend shelf life.",
        "Use a hydroponic nutrient regimen high in nitrogen and consider adding Cal-Mag.",
        "Pruning above a growth node once the plant reaches 6 inches encourages bushier growth and higher yields.",
      ],
      SEASONAL_DATA: {
        "Rainy Season (June to August)": {
          pH: "5.5–6.5",
          Humidity: "60–80%",
          Temperature: "75–85°F (24–29°C)",
          SolutionTemperature: "68–72°F (20–22°C)",
        },
      },
    },
    Spinach: {
      MIN_TEMPERATURE: 15,
      MAX_TEMPERATURE: 18,
      MIN_HUMIDITY: 50,
      MAX_HUMIDITY: 70,
      MIN_PH_LEVEL: 6.0,
      MAX_PH_LEVEL: 7.0,
      DISEASES: {
        "Downy mildew": {
          Symptoms: "Yellow spots with fuzzy undersides on leaves.",
          Prevention: "Ensure adequate airflow and avoid high humidity.",
          Cure: "Remove infected leaves and improve ventilation.",
        },
        "Leaf spot": {
          Symptoms: "Dark, water-soaked spots on the foliage.",
          Prevention: "Avoid excessive overhead watering and wet foliage.",
          Cure: "Remove affected leaves promptly and consider a mild fungicide if necessary.",
        },
        "Root rot": {
          Symptoms: "Decaying roots with reduced plant vigor.",
          Prevention: "Maintain proper system sanitation and avoid overwatering.",
          Cure: "Clean the system thoroughly and adjust watering practices.",
        },
      },
      NOTES: [
        "Begin with a ¼ strength nutrient solution, gradually increasing as plants mature.",
        "Harvest outer leaves and stagger planting every 2–3 weeks.",
        "Maintain cooler conditions to prevent bolting, and supplement with iron if yellowing occurs.",
        "Aim for 10 to 14 hours of light per day with blue or white light for optimal chlorophyll production.",
      ],
      SEASONAL_DATA: {
        "Monsoon Season (September to November)": {
          pH: "6.0–7.0",
          Humidity: "50–70%",
          Temperature: "60–65°F (15–18°C)",
          SolutionTemperature: "65–68°F (18–20°C)",
        },
      },
    },
    Strawberries: {
      MIN_TEMPERATURE: 18,
      MAX_TEMPERATURE: 24,
      MIN_HUMIDITY: 65,
      MAX_HUMIDITY: 75,
      MIN_PH_LEVEL: 5.8,
      MAX_PH_LEVEL: 6.2,
      DISEASES: {
        "Gray mold": {
          Symptoms: "Fuzzy gray mold on fruits and leaves.",
          Prevention: "Maintain good airflow and moderate humidity.",
          Cure: "Remove infected fruits and leaves, and improve ventilation.",
        },
        "Anthracnose": {
          Symptoms: "Dark, sunken spots on fruits and leaves.",
          Prevention: "Avoid overcrowding and high humidity conditions.",
          Cure: "Remove infected parts and, if necessary, apply an appropriate fungicide.",
        },
        "Verticillium wilt": {
          Symptoms: "Wilting, discoloration, and stunted growth.",
          Prevention: "Use resistant varieties and practice crop rotation.",
          Cure: "There is no effective cure; remove and destroy infected plants to halt spread.",
        },
      },
      NOTES: [
        "Ensure a well-balanced nutrient solution that includes primary nutrients (nitrogen, phosphorus, potassium) along with secondary nutrients (calcium, magnesium).",
        "Manual pollination with a small paintbrush can improve fruit set.",
        "Maintain consistent lighting with full spectrum grow lights (8–12 hours daily).",
        "Practice regular pruning to enhance air circulation and prevent disease.",
      ],
      SEASONAL_DATA: {
        "Cool Season (December to February)": {
          pH: "5.8–6.2",
          Humidity: "65–75%",
          Temperature: "65–75°F (18–24°C)",
          SolutionTemperature: "65–70°F (18–21°C)",
        },
      },
    },
    Tomatoes: {
      MIN_TEMPERATURE: 20,
      MAX_TEMPERATURE: 30,
      MIN_HUMIDITY: 50,
      MAX_HUMIDITY: 70,
      MIN_PH_LEVEL: 5.8,
      MAX_PH_LEVEL: 6.3,
      DISEASES: {
        "Fusarium wilt": {
          Symptoms: "Yellowing and wilting of leaves, often starting asymmetrically.",
          Prevention: "Use disease-resistant varieties and maintain sanitation in the growing area.",
          Cure: "Remove infected plants and disinfect the system.",
        },
        "Blight": {
          Symptoms: "Dark, irregular spots on leaves with rapid defoliation.",
          Prevention: "Ensure adequate airflow and avoid overhead watering.",
          Cure: "Remove infected foliage immediately and enhance ventilation.",
        },
        "Tobacco mosaic virus": {
          Symptoms: "Mottled, discolored leaves with stunted growth.",
          Prevention: "Sanitize tools and avoid cross-contamination from infected plants.",
          Cure: "Remove infected plants and thoroughly disinfect any equipment used.",
        },
        "Root rot": {
          Symptoms: "Decaying roots leading to a general decline in plant health.",
          Prevention: "Water appropriately and ensure proper drainage.",
          Cure: "Avoid overwatering and clean the system to prevent re-infection.",
        },
      },
      NOTES: [
        "Regularly prune suckers, support plants with trellises, and hand-pollinate if needed.",
        "Adjust calcium levels to combat blossom-end rot and supplement magnesium if yellowing occurs.",
        "Provide 14–16 hours of light daily, using LED or fluorescent grow lights.",
        "Change the nutrient solution in the reservoir about once a week and check pH levels regularly.",
      ],
      SEASONAL_DATA: {
        "Year-Round": {
          pH: "5.8–6.3",
          Humidity: "50–70% (lower during fruiting)",
          Temperature: "70–80°F (21–27°C) day / 60–65°F (15–18°C) night",
          SolutionTemperature: "68–75°F (20–24°C)",
        },
      },
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

export const getCompatiblePlants = (temperature, humidity, pHlevel) => {
  const ALL_PLANTS = ['Lettuce', 'Basil', 'Spinach', 'Strawberries', 'Tomatoes'];
  
  return ALL_PLANTS.filter(plant => {
    const data = getPlantData(plant);
    if (!data) return false;
    
    return (
      temperature >= data.MIN_TEMPERATURE &&
      temperature <= data.MAX_TEMPERATURE &&
      humidity >= data.MIN_HUMIDITY &&
      humidity <= data.MAX_HUMIDITY &&
      pHlevel >= data.MIN_PH_LEVEL &&
      pHlevel <= data.MAX_PH_LEVEL
    );
  });
};