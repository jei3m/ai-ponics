import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from 'axios';

const apiKey = process.env.REACT_APP_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

// Fetch sensor data from Blynk API
export const fetchSensorData = async (selectedApiKey) => {
  try {
    const [deviceResponse, temperatureResponse, humidityResponse] = await Promise.all([
      axios.get(`https://blynk.cloud/external/api/isHardwareConnected?token=${selectedApiKey}`),
      axios.get(`https://blynk.cloud/external/api/get?token=${selectedApiKey}&V0`),
      axios.get(`https://blynk.cloud/external/api/get?token=${selectedApiKey}&V1`)
    ]);
    
    return {
      temperature: temperatureResponse.data,
      humidity: humidityResponse.data,
      systemStatus: deviceResponse.data === true  // Ensure boolean value
    };
  } catch (error) {
    console.error('Error fetching sensor data:', error);
    throw error;
  }
};

// Generate AI greeting message
export const generateGreeting = async (plantName, daysSincePlanting, temperature, humidity) => {
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
  });
  const result = await model.generateContent(
    `Be somehow concise and friendly. Introduce yourself as AI-Ponics an Aeroponic System Assistant. Share in a bullet form that the plant name is ${plantName}, planted ${daysSincePlanting} days ago, with sensor readings of ${temperature}°C and ${humidity}%.`
  );
  const response = await result.response;
  return response.text();
};

// Generate AI response for user queries
export const generateAIResponse = async (textPrompt, imageInlineData, plantName, daysSincePlanting, temperature, humidity) => {
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro-exp-0827",
    systemInstruction: `You are AI-Ponics, Aeroponics expert, answer concisely. Take note of plant name is ${plantName} and it has been ${daysSincePlanting} days since planting, sensor readings: temperature is ${temperature !== null ? temperature + '°C' : 'unavailable'} and humidity ${humidity !== null ? humidity + '%' : 'unavailable'}.`,
  });
  const result = await model.generateContent([textPrompt, imageInlineData]);
  const response = await result.response;
  return response.text();
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
