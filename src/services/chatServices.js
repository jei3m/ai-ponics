import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from 'axios';

const apiKey = process.env.REACT_APP_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

// Fetch sensor data from Blynk API
export const fetchSensorData = async (selectedApiKey) => {
  try {
    const [deviceStatusResponse, temperatureResponse, humidityResponse] = await Promise.all([
      axios.get(`https://blynk.cloud/external/api/isHardwareConnected?token=${selectedApiKey}`),
      axios.get(`https://blynk.cloud/external/api/get?token=${selectedApiKey}&V0`),
      axios.get(`https://blynk.cloud/external/api/get?token=${selectedApiKey}&V1`)
    ]);
    
    return {
      systemStatus: deviceStatusResponse.data, 
      temperature: Math.round(temperatureResponse.data),
      humidity: Math.round(humidityResponse.data)
    };
  } catch (error) {
    console.error('Error fetching sensor data:', error);
    throw error;
  }
};

// Generate AI greeting message
export const generateGreeting = async (plantName, daysSincePlanting, temperature, humidity) => {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp", //Recently release 2.0 Flash Model
  });
  const result = await model.generateContent(
    `Be somehow concise and friendly. Introduce yourself as AI-Ponics an Aeroponic System Assistant. Share in a bullet form that the plant name is ${plantName}, planted ${daysSincePlanting} days ago, with sensor readings of ${temperature}°C and ${humidity}%.`
  );
  const response = await result.response;
  return response.text();
};

// Generate AI response for user queries
export const generateAIResponse = async function* (textPrompt, imageInlineData, plantName, daysSincePlanting, temperature, humidity, previousMessages = []) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp", //Recently released 2.0 Flash Model
    systemInstruction: `You are AI-Ponics, an Aeroponics expert, answer concisely. Take note of plant name is ${plantName} and it has been ${daysSincePlanting} days since planting, sensor readings: temperature is ${temperature} and humidity ${humidity}.`,
  });

  const chatHistory = previousMessages.map(msg => `${msg.user ? 'User' : 'Assistant'} : ${msg.text}`).join('\n');
  
  // Create content parts array
  const parts = [{ text: chatHistory ? `Previous conversation \n ${chatHistory} \n \n Current message: ${textPrompt}` : textPrompt}];

  if (imageInlineData) {
    parts.push(imageInlineData);
  }
  
  const result = await model.generateContentStream(parts);
  
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

// Responsible for image files to Base64 conversion
export const getBase64 = (file) => new Promise(function (resolve, reject) {
  let reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result)
  reader.onerror = (error) => reject('Error: ', error);
})
