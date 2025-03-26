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
      },
      NOTES: [
        "Lettuce doesn't demand a lot of light, so start with 10 to 14 hours of moderate to low light each day.",
        "If plants don't get enough light, they won't grow efficiently, while too much light may cause the leaves to go bitter.",
        "If temp goes up to 21°C, it will introduce bolting and result in bitter lettuce.",
        "Nutrient solution temp at 21.1°C increases shoot fresh weight by 15%.",
        "Use shade and airflow during heat, maintain appropriate ventilation.",
      ],
      RECOMMENDED_VARIETIES: {
        types: [
          "Lollo Rossa – Frilly, bolt-resistant, handles partial shade",
          "Jericho – Slow to bolt, great for hot climates",
          "Red Salad Bowl – Loose-leaf, tolerates humidity"
        ],
        why: "Fast-growing, low-light tolerant, minimal root space needed",
        proTip: "Grow in shade nets (30-50%) or under taller plants"
      },
      ENVIRONMENTAL_TIPS: {
        pestControl: [
          "Neem Oil Spray – For aphids, whiteflies",
          "Chili-Garlic Spray – Deters chewing insects",
          "Ants? Sprinkle cinnamon or coffee grounds"
        ],
        heatSolutions: [
          "Shade Cloth (50%) – Protects from scorching",
          "Water in Early AM – Reduces evaporation",
          "Mulch with Coconut Husk – Cools roots"
        ],
        rainySeason: [
          "Use raised beds/sand mix for drainage",
          "DIY Rain Covers – Plastic sheets/umbrellas",
          "Spray baking soda + water weekly"
        ]
      },
      BEST_SEASONS: {
        plant: "Nov–Feb",
        avoid: "Jun–Oct (rainy)",
        tips: "Shade cloth in hot afternoons"
      },
      CARE_INSTRUCTIONS: {
        planting: [
          "Cool-season crop – Early spring/fall",
          "Optimal Soil Temp: 45–75°F (7–24°C)",
          "Succession Planting: Sow every 2 weeks"
        ],
        growing: [
          "Sunlight: Partial shade (3–6 hours)",
          "Keep soil consistently moist",
          "Soil: Well-draining, pH 6.0–7.0",
          "Fertilizer: Balanced 10-10-10 every 3–4 weeks"
        ]
      },
      LIFE_CYCLE: {
        Seed: "Small, oval-shaped, and often light brown or black.",
        Germination: "Takes 5–10 days in cool soil (optimum: 60–70°F / 15–21°C).",
        Seedling: "First true leaves appear after cotyledons (seed leaves).",
        VegetativeGrowth: "Forms a rosette of leaves; grows rapidly in cool weather.",
        Maturity: "Reaches harvest size in 30–70 days (depending on variety).",
        Bolting: "In hot weather, lettuce sends up a flower stalk, becoming bitter.",
        SeedProduction: "Flowers produce small, fluffy seeds (if allowed to bolt)."
      }
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
          Symptoms: "Yellow spots with fuzzy undersides on leaves.",
          Prevention: "Maintain ventilation and avoid leaf wetness.",
          Cure: "Reduce humidity and prune affected leaves.",
        },
      },
      NOTES: [
        "Harvest by cutting leaves as needed to promote new growth.",
        "For storage, keep basil in a vented bag at around 60°F (15°C) to extend shelf life.",
        "Use a hydroponic nutrient regimen high in nitrogen and consider adding Cal-Mag.",
        "Pruning above a growth node once the plant reaches 6 inches encourages bushier growth and higher yields.",
      ],
      RECOMMENDED_VARIETIES: {
        types: [
          "Holy Basil (Sulasi) – Native, medicinal",
          "Thai Basil – Sturdy, pest-resistant",
          "Genovese – Needs good drainage"
        ],
        why: "Thrives in warm conditions",
        proTip: "Plant in hanging pots to avoid flooding"
      },
      ENVIRONMENTAL_TIPS: {
        pestControl: [
          "Neem Oil Spray – For whiteflies",
          "Garlic Spray – Deters aphids",
          "Companion Planting – Marigolds repel pests"
        ],
        heatSolutions: [
          "Afternoon shade in extreme heat",
          "Mist leaves in early morning",
          "Use reflective mulch"
        ],
        rainySeason: [
          "Elevated growing systems",
          "Improve air circulation",
          "Reduce watering frequency"
        ]
      },
      BEST_SEASONS: {
        plant: "Dec–Apr",
        avoid: "Typhoon season",
        tips: "Grow in pots for drainage"
      },
      CARE_INSTRUCTIONS: {
        planting: [
          "Warm-season crop – After last frost",
          "Best Months: Late spring to early summer",
          "Start seeds indoors 6–8 weeks early"
        ],
        growing: [
          "Full sun (6–8 hours daily)",
          "Moist soil – Avoid wetting leaves",
          "Pinch flowers for bushiness",
          "Use compost every 4 weeks"
        ]
      },
      LIFE_CYCLE: {
        Seed: "Tiny, black, and round.",
        Germination: "Takes 5–10 days (warm soil: 70–85°F / 21–29°C).",
        Seedling: "First true leaves are fragrant and oval-shaped.",
        VegetativeGrowth: "Bushy growth with opposing leaves; thrives in warm weather.",
        Maturity: "Ready for harvest in 50–60 days.",
        Flowering: "Produces white or purple flower spikes (pinching delays flowering).",
        SeedProduction: "Flowers dry into seed pods containing tiny black seeds."
      }
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
          Prevention: "Avoid overcrowding and high humidity.",
          Cure: "Remove infected leaves and improve airflow.",
        },
      },
      NOTES: [
        "Begin with a ¼ strength nutrient solution, gradually increasing as plants mature.",
        "Harvest outer leaves and stagger planting every 2–3 weeks.",
        "Maintain cooler conditions to prevent bolting, and supplement with iron if yellowing occurs.",
        "Aim for 10 to 14 hours of light per day with blue or white light for optimal chlorophyll production.",
      ],
      RECOMMENDED_VARIETIES: {
        types: [
          "Malabar Spinach (Alugbati) – Perennial heat-lover",
          "New Zealand Spinach – Slow to bolt"
        ],
        why: "Heat-tolerant alternatives",
        proTip: "Soak seeds overnight for faster germination"
      },
      ENVIRONMENTAL_TIPS: {
        pestControl: [
          "Row Covers – Prevent leaf miners",
          "Diatomaceous Earth – Slugs/snails",
          "Companion Planting – Radishes deter beetles"
        ],
        heatSolutions: [
          "Shade cloth during peak sun",
          "Chill nutrient solution",
          "Increase air circulation"
        ],
        rainySeason: [
          "Avoid overhead watering",
          "Use well-draining media",
          "Apply cinnamon anti-fungal spray"
        ]
      },
      BEST_SEASONS: {
        plant: "Dec–Feb",
        avoid: "Mar–Nov (too hot)",
        tips: "Fast-growing varieties only"
      },
      CARE_INSTRUCTIONS: {
        planting: [
          "Cool-season crop – Early spring/fall",
          "Can tolerate light frost",
          "Winter planting in mild climates"
        ],
        growing: [
          "Partial shade in warm climates",
          "Keep soil evenly moist",
          "Nitrogen-rich fertilizer every 3–4 weeks",
          "Harvest outer leaves at 4–6 inches"
        ]
      },
      LIFE_CYCLE: {
        Seed: "Small, round, and slightly spiky.",
        Germination: "Takes 7–14 days (cool soil: 50–70°F / 10–21°C).",
        Seedling: "Cotyledons appear, followed by true leaves.",
        VegetativeGrowth: "Forms a rosette of dark green, tender leaves.",
        Maturity: "Ready for harvest in 40–50 days.",
        Bolting: "In warm weather, it sends up a tall flower stalk (becomes bitter).",
        SeedProduction: "Produces small, clustered seeds if left to flower."
      }
    },
    Tomatoes: {
      MIN_TEMPERATURE: 20,
      MAX_TEMPERATURE: 30,
      MIN_HUMIDITY: 50,
      MAX_HUMIDITY: 70,
      MIN_PH_LEVEL: 5.8,
      MAX_PH_LEVEL: 6.3,
      DISEASES: {
        "Blight": {
          Symptoms: "Dark spots on leaves with rapid wilting.",
          Prevention: "Avoid wet foliage and ensure airflow.",
          Cure: "Remove infected leaves and apply copper spray.",
        },
      },
      NOTES: [
        "Regularly prune suckers, support plants with trellises, and hand-pollinate if needed.",
        "Adjust calcium levels to combat blossom-end rot and supplement magnesium if yellowing occurs.",
        "Provide 14–16 hours of light daily, using LED or fluorescent grow lights.",
        "Change the nutrient solution in the reservoir about once a week and check pH levels regularly.",
      ],
      RECOMMENDED_VARIETIES: {
        types: [
          "Cherry Tomato (Yellow Pear) – Crack-resistant",
          "Tropical (EG 203 F1) – Blight-resistant",
          "Native Filipino Varieties – Pest-resistant"
        ],
        why: "Adapted to humid climates",
        proTip: "Use banana trunk mulch for moisture retention"
      },
      ENVIRONMENTAL_TIPS: {
        pestControl: [
          "BT Spray – For hornworms",
          "Companion Planting – Basil repels pests",
          "Yellow Sticky Traps – Whiteflies"
        ],
        heatSolutions: [
          "Shade net during noon hours",
          "Increase potassium in nutrients",
          "Mulch with rice hulls"
        ],
        rainySeason: [
          "Raised growing systems",
          "Weekly hydrogen peroxide treatment",
          "Prune lower leaves for airflow"
        ]
      },
      BEST_SEASONS: {
        plant: "Nov–Mar",
        avoid: "Rainy season",
        tips: "Use fungicides and raised beds"
      },
      CARE_INSTRUCTIONS: {
        planting: [
          "Warm-season crop – After last frost",
          "Soil Temp >60°F (15°C)",
          "Start seeds indoors 6–8 weeks early"
        ],
        growing: [
          "Full sun (6–8+ hours daily)",
          "Deep watering 1–2x/week",
          "Support with cages/trellises",
          "High-potassium fertilizer during flowering"
        ]
      },
      LIFE_CYCLE: {
        Seed: "Small, flat, and fuzzy.",
        Germination: "Takes 5–10 days (warm soil: 70–85°F / 21–29°C).",
        Seedling: "Develops true leaves after cotyledons; requires strong light.",
        VegetativeGrowth: "Grows into a vine/bush (indeterminate/determinate varieties).",
        Flowering: "Yellow flowers appear in 30–50 days (pollination needed for fruit).",
        FruitDevelopment: "Green tomatoes form and ripen to red/yellow/etc. (60–85 days total).",
        SeedProduction: "Seeds inside fruit can be saved for replanting."
      }
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
          Symptoms: "Fuzzy gray mold on fruits.",
          Prevention: "Maintain good airflow",
          Cure: "Remove infected fruits",
        },
      },
      NOTES: [
        "Ensure a well-balanced nutrient solution that includes primary nutrients (nitrogen, phosphorus, potassium) along with secondary nutrients (calcium, magnesium).",
        "Manual pollination with a small paintbrush can improve fruit set.",
        "Maintain consistent lighting with full spectrum grow lights (8–12 hours daily).",
        "Practice regular pruning to enhance air circulation and prevent disease.",
      ],
      RECOMMENDED_VARIETIES: {
        types: [
          "Baguio Strawberry – Cool highland variety",
          "Sweet Charlie – Heat-tolerant"
        ],
        why: "Best for PH conditions",
        proTip: "Grow in towers/pots to avoid diseases"
      },
      ENVIRONMENTAL_TIPS: {
        pestControl: [
          "Bird Netting – Protect fruits",
          "Beer Traps – Slugs/snails",
          "Companion Planting – Borage deters worms"
        ],
        heatSolutions: [
          "Shade cloth during peak heat",
          "Mist plants in early morning",
          "Use white plastic mulch"
        ],
        rainySeason: [
          "Elevated growing systems",
          "Improve air circulation",
          "Apply silica supplements"
        ]
      },
      BEST_SEASONS: {
        plant: "Nov–Feb",
        avoid: "Summer heat",
        tips: "Grow in shade, high-altitude helps"
      },
      CARE_INSTRUCTIONS: {
        planting: [
          "Perennial – Early spring/fall",
          "June-bearing: Spring planting",
          "Everbearing: Spring/fall planting"
        ],
        growing: [
          "Full sun (6–10 hours daily)",
          "Keep soil moist with drip irrigation",
          "Balanced fertilizer at planting",
          "Harvest when fully red"
        ]
      },
      LIFE_CYCLE: {
        Seed: "Tiny, yellow, and embedded in the fruit’s skin (most growers use runners).",
        Germination: "Slow (2–6 weeks); cold stratification helps.",
        Seedling: "Develops a small rosette of leaves.",
        VegetativeGrowth: "Spreads via runners (stolons) in first year.",
        FloweringFruiting: "White flowers appear in spring (Year 2), then develop into berries.",
        Harvest: "Berries ripen 4–6 weeks after flowering.",
        PerennialCycle: "Plants produce for 3–5 years, then decline."
      }
    }
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