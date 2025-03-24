import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSystemInstructions, getImageSystemInstructions } from "../chatbot-config/systemInstructions";
import {getSystemKnowledge} from "../chatbot-config/systemKnowledge"

const apiKey = process.env.REACT_APP_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);


// Fetch user data from firebase
export const fetchUserData = async (doc, currentUser, db, getDoc, setSensorDataLoaded, setPlantName, setDaysSincePlanting, setSelectedApiKey, fetchSensorDataFromBlynk, message) => {
  try {
    const docRef = doc(db, 'users', currentUser.uid);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.log('No such document!');
      setSensorDataLoaded(true);
      return;
    }

    const {
      plantName = '',
      daysSincePlanting = 0,
      selectedApiKey = '',
    } = docSnap.data();

    setSelectedApiKey(selectedApiKey);
    setPlantName(plantName);
    setDaysSincePlanting(daysSincePlanting);

    if (!selectedApiKey) {
      setSensorDataLoaded(true);
      return;
    }

    fetchSensorDataFromBlynk(selectedApiKey); // Fetch sensor data if API key is present
  } catch (error) {
    console.error('Error fetching user data:', error);
    message.error('Error fetching user data. Please try again.');
    setSensorDataLoaded(true);
  }
};

// AI Generated greeting message
export const generateGreeting = async (plantName, daysSincePlanting, temperature, humidity, useCurrentUTCDate) => {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp", //Recently release 2.0 Flash Model
  });
  const result = await model.generateContent(
    `Be somehow concise and friendly. Introduce yourself as AI-Ponics an Aeroponic System Assistant. Share in a bullet form that the plant name is ${plantName}, Today is ${useCurrentUTCDate} and it has been planted for ${daysSincePlanting} days ago, with sensor readings of ${temperature}°C and ${humidity}%.`
  );
  const response = await result.response;
  return response.text();
};

// Greet User Function
export async function greetUser(
  sensorDataLoaded,
  isApiKeyValid,
  setMessages,
  selectedApiKey,
  isDeviceOnline,
  temperature,
  plantName,
  daysSincePlanting,
  pHlevel,
  humidity,
  weatherData,
  currentDate
) {
  const getErrorState = () => {
    if (!sensorDataLoaded) return 'LOADING';
    if (!isApiKeyValid) return 'INVALID_KEY';
    if (!selectedApiKey) return 'MISSING_KEY';
    if (!isDeviceOnline) return 'OFFLINE';
    return 'READY';
  };

  switch (getErrorState()) {
    case 'LOADING':
      setMessages([{ user: false, text: "Sensor data is still loading... Please wait." }]);
      return;
    
    case 'INVALID_KEY':
      setMessages([{ user: false, text: "Your API key is invalid. Please check your API key and try again." }]);
      return;
    
    case 'MISSING_KEY':
      setMessages([{ user: false, text: "Your API key missing. Please provide a valid API key to proceed." }]);
      return;
    
    case 'OFFLINE':
      setMessages([{ user: false, text: "I apologize, but I cannot provide readings as your Aeroponic System appears to be offline." }]);
      return;
    
    case 'READY':
      break;

    default:
      setMessages([{ user: false, text: "An unexpected error occurred. Please try again." }]);
      return;
  }

  try {
    const greetingText = 
`Hey there, I'm AI-Ponics, your friendly Aeroponic System Assistant! 👋

**Today's Date:** ${currentDate}

**System Status:**
- Plant: ${plantName || 'N/A'}
- Age: ${daysSincePlanting} days
- Temperature: ${temperature} °C
- Humidity: ${humidity}%
- pH Level: ${pHlevel}

**Weather Conditions:**
- Weather: ${weatherData?.weather[0]?.main || 'N/A'}
- Temperature: ${weatherData?.main?.temp || 'N/A'}°C
- Humidity: ${weatherData?.main?.humidity || 'N/A'}%
- Wind Speed: ${weatherData?.wind?.speed || 'N/A'} m/s

Need help or have questions? Don't hesitate to ask!`;

    setMessages([{ user: false, text: greetingText }]);
  } catch (error) {
    console.error('Error generating greeting:', error);
    setMessages([{ user: false, text: "Sorry, I encountered an error while generating a greeting." }]);
  }
}


// Generate AI response for user queries
export const generateAIResponse = async function* ( textPrompt, imageInlineData, plantName, daysSincePlanting, temperature, humidity, pHlevel, weatherData, previousMessages = [], currentDate ) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp", // Recently released 2.0 Flash Model
    systemInstruction: getSystemInstructions(plantName, daysSincePlanting, temperature, humidity, pHlevel, weatherData, currentDate),
  });

  // Declaration of messageHistory
  const chatContext = previousMessages.filter((_, index) => index !== 0).map((msg) => ({
    text: msg.user ? `User: ${msg.text}` : msg.text,
  }));

  // Append the current user prompts (Text and Images) as the latest entry
  if (textPrompt) {
    chatContext.push({ text: `User : ${textPrompt}` });
  }

  if (imageInlineData) {
    chatContext.push(imageInlineData);
  }

  // Append Custom Knowledge Base
  chatContext.push({text: `System Knowledge: ${getSystemKnowledge(plantName)}`});

  // Logging message history for debugging
  // console.log(`textPrompt: ${textPrompt}`);
  // console.log(`chatContext: ${JSON.stringify(chatContext)}`);

  // Generate content stream then yield generated chunks
  const result = await model.generateContentStream(chatContext);
  for await (const chunk of result.stream) {
    const chunkText = chunk.text();
    if (chunkText) {
      yield chunkText;
    }
  }
};

// Convert file to generative part
export const fileToGenerativePart = async (blob) => {
  const base64EncodedDataPromise = new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.readAsDataURL(blob);
  });

  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: blob.type },
  };
};

// Custom components for ReactMarkdown
export const components = {
  p: ({ children }) => <div style={{ margin: 4 }}>{children}</div>,
  strong: ({ children }) => <strong>{children}</strong>,
  br: () => <br />,
  h2: ({ children }) => <h3>{children}</h3>
};