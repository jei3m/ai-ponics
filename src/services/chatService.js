import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.REACT_APP_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

// Fetch user data from firebase
export const fetchUserData = async (doc, currentUser, db, getDoc, setSensorDataLoaded, setPlantName, setDaysSincePlanting, setBlynkApiKey, fetchSensorDataFromBlynk, message) => {
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

    setPlantName(plantName);
    setDaysSincePlanting(daysSincePlanting);
    setBlynkApiKey(selectedApiKey); // Update the state with the fetched API key

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

// Greet User Function
export async function greetUser(sensorDataLoaded, isApiKeyValid, setMessages, blynkApiKey, isDeviceOnline, temperature, MAX_TEMPERATURE, MIN_TEMPERATURE, plantName, daysSincePlanting, humidity) {

  if (!sensorDataLoaded) {
    setMessages([{ user:false, text: "Sensor data is still loading... Please wait."}])
    return;
  }

  if (!isApiKeyValid) {
    setMessages([{ user:false, text: "Your API key is invalid. Please check your API key and try again." }]);
    return;
  }

  if (!blynkApiKey) {
    setMessages([{ user:false, text: "Your API key missing. Please provide a valid API key to proceed."}])
    return;
  }

  if (!isDeviceOnline) {
    setMessages([{ user:false, text: "I apologize, but I cannot provide readings as your Aeroponic System appears to be offline."}])
    return;
  }

  try {
    const warningMessage =
      temperature > MAX_TEMPERATURE
      ? "**Warning:** Temperature is too Hot"
      : temperature < MIN_TEMPERATURE
      ? "**Warning:** Temperature is too Cold"
      : "Need help or have questions? Don&apos;t hesitate to ask!";


    // Hard-coded message greeting, to reduce loading time from AI generated greeting
    const greetingText = 
`Hey there, I'm AI-Ponics, your friendly Aeroponic System Assistant! 👋 \n
* Here's a quick update on your system:\n
  *   **Plant:** ${plantName}
  *   **Age:** ${daysSincePlanting} days
  *   **Temperature:** ${temperature}
  *   **Humidity:** ${humidity}\n
${warningMessage}`

    // const greetingText = await generateGreeting(plantName, daysSincePlanting, temperature, humidity);
    setMessages([{ user: false, text: greetingText}]);
  } catch (error) {
    console.error('Error generating greeting:', error);
    setMessages([{ user: false, text: "Sorry, I encountered an error while generating a greeting." }]);
  }
}

// Generate AI response for user queries
export const generateAIResponse = async function* ( textPrompt, imageInlineData, plantName, daysSincePlanting, temperature, humidity, previousMessages = [] ) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp", // Recently released 2.0 Flash Model
    systemInstruction: `
    You are AI-Ponics, an Aeroponics expert. 
    Provide concise and friendly answers to user queries. 
    Never start your messages with "AI-Ponics:".
    About messageHistory, you are AI-Ponics, then User is the one chatting you.
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
  console.log(`textPrompt: ${textPrompt}`);
  console.log(`messageHistory: ${JSON.stringify(messageHistory)}`);

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
