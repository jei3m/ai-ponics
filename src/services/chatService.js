import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.REACT_APP_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

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
export const generateAIResponse = async function* ( textPrompt, imageInlineData, plantName, daysSincePlanting, temperature, humidity, previousMessages = [] ) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp", // Recently released 2.0 Flash Model
    systemInstruction: `
    You are AI-Ponics, an Aeroponics expert. 
    Provide concise and friendly answers to user queries. 
    Never start your messages with "AI-Ponics:". 
    Always identify yourself when asked "Who are you?" or "What are you?" by responding, "I am AI-Ponics, an Aeroponics expert here to help you." 
    Keep your responses relevant to the user's input. 
    Take note that the plant name is ${plantName}, and it has been ${daysSincePlanting} days since planting. 
    Sensor readings: temperature is ${temperature}°C and humidity is ${humidity}%.`,
  });

  // Start with the previous messages (AI Greeting)
  const messageHistory = previousMessages.map((msg) => ({
    text: `${msg.user ? "User" : "AI-Ponics"} : ${msg.text}`,
  }));

  // Append the current user prompts (Text and Images) as the latest entry
  if (textPrompt) {
    messageHistory.push({ text: `User : ${textPrompt}` });
  }

  if (imageInlineData) {
    messageHistory.push(imageInlineData);
  }

  // Logging message history for debugging
  // console.log(`textPrompt: ${textPrompt}`);
  // console.log(`messageHistory: ${JSON.stringify(messageHistory)}`);

  // Generate content stream then yield generated chunks
  const result = await model.generateContentStream(messageHistory);

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

// Custom components for ReactMarkdown
export const components = {
  p: ({ children }) => <div style={{ margin: 0 }}>{children}</div>,
  strong: ({ children }) => <strong>{children}</strong>,
  br: () => <br />,
  h2: ({ children }) => <h3>{children}</h3>
};
