import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { UserAuth } from '../context/AuthContext';
import { getBase64 } from '../helpers/imageHelper';
import { db } from '../firebase'; 
import { doc, getDoc } from 'firebase/firestore'; 
import axios from 'axios';
import { useApiKey } from "../context/ApiKeyContext";

// Setting constants to process environment variables (API Keys)
const apiKey = process.env.REACT_APP_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

export const useChatService = () => {
  const [image, setImage] = useState('');
  const [imageInlineData, setImageInlineData] = useState('');
  const [loading, setLoading] = useState(false);
  const [textPrompt, setTextPrompt] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [currentFacingMode, setCurrentFacingMode] = useState('environment'); // Setting back camera by default
  const [webcamRef, setWebcamRef] = useState(null); 
  const [plantName, setPlantName] = useState('AI-Ponics');
  const [daysSincePlanting, setDaysSincePlanting] = useState(0);
  const [temperature, setTemperature] = useState(null);
  const [humidity, setHumidity] = useState(null);
  const [blynkApiKey, setBlynkApiKey] = useState('');
  const navigate = useNavigate();
  const { currentUser } = UserAuth();
  const [sensorDataLoaded, setSensorDataLoaded] = useState(false);
  const { selectedApiKey } = useApiKey();

  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser) {
        try {
          const docRef = doc(db, 'users', currentUser.uid); // Adjust collection path if necessary
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const userData = docSnap.data();
            setPlantName(userData.plantName || 'AI-Ponics'); // Default to 'AI-Ponics' if no plantName
            setDaysSincePlanting(userData.daysSincePlanting || 0); // Default to 0 if no daysSincePlanting
            setBlynkApiKey(userData.selectedApiKey || '');
            
            // Start fetching sensor data immediately after getting the API key
            if (userData.selectedApiKey) {
              fetchSensorData(userData.selectedApiKey);
            } else {
              setSensorDataLoaded(true);
            }
          } else {
            console.log('No such document!');
            setSensorDataLoaded(true);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setSensorDataLoaded(true);
        }
      } else {
        setSensorDataLoaded(true);
      }
    };

    fetchUserData();
  }, [currentUser]);

  //Fetching sensor data from Blynk API
  const fetchSensorData = async (selectedApiKey) => {
    try {
      const temperatureResponse = await axios.get(`https://blynk.cloud/external/api/get?token=${selectedApiKey}&V0`);
      const humidityResponse = await axios.get(`https://blynk.cloud/external/api/get?token=${selectedApiKey}&V1`);
      setTemperature(temperatureResponse.data);
      setHumidity(humidityResponse.data);
      setSensorDataLoaded(true);
    } catch (error) {
      console.error('Error fetching sensor data:', error);
      setSensorDataLoaded(true);
    }
  };

  useEffect(() => {
    let interval;
    if (selectedApiKey) {
      fetchSensorData(selectedApiKey);
      interval = setInterval(() => fetchSensorData(selectedApiKey), 8000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [selectedApiKey]);

  async function aiRun() {
    if (!sensorDataLoaded) {
      toast.error('Sensor data is still loading. Please wait.');
      return;
    }
    
    //List of models as of this moment for testing
    //gemini-1.5-pro-exp-0827 Pro Experimental
    //gemini-1.5-flash Flash
    setLoading(true);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro-exp-0827",
      systemInstruction: `You are AI-Ponics, Aeroponics expert, answer concisely. Take note of plant name is ${plantName} and it has been ${daysSincePlanting} days since planting, sensor readings: temperature is ${temperature !== null ? temperature + '°C' : 'unavailable'} and humidity ${humidity !== null ? humidity + '%' : 'unavailable'}.`,
    });
    const result = await model.generateContent([textPrompt, imageInlineData]);
    const response = await result.response;
    const text = response.text();
    setLoading(false);
    setMessages((prevMessages) => [
      ...prevMessages,
      { user: true, text: textPrompt, image: imagePreview },
      { user: false, text },
    ]);
  }

  // Don't greet until sensor data is loaded
  async function greetUser() {
    if (!sensorDataLoaded) {
      return; 
    }
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: "You are AI-Ponics, an Aeroponics expert. Greet the user warmly and offer assistance.",
    });
    const result = await model.generateContent(`Introduce yourself as AI-Ponics concisely. Tell plant name is ${plantName} and it has been ${daysSincePlanting} days since planting, and sensor readings: temperature is ${temperature !== null ? temperature + '°C' : 'unavailable'} and humidity ${humidity !== null ? humidity + '%' : 'unavailable'}.`);
    const response = await result.response;
    const text = response.text();
    setMessages([{ user: false, text }]);
  }

  useEffect(() => {
    if (sensorDataLoaded) {
      greetUser();
    }
  }, [plantName, daysSincePlanting, sensorDataLoaded]);

  // Error when sending a prompt with cleared fields
  const sendMessage = () => {
    if (textPrompt || imageInlineData) {
      aiRun();
      setTextPrompt('');
      setImagePreview(null);
      setImage('');
      setImageInlineData('');
    } else {
      toast.error('Please provide at least an image or text prompt.');
    }
  };

  // It extracts the first selected file, converts it to Base64 format,
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const base64 = await getBase64(file);
      setImage(base64);

      const imageData = await fileToGenerativePart(file);
      setImageInlineData(imageData);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Converts a file (blob) into a format that can be passed to the generative AI model
  async function fileToGenerativePart(blob) {
    const base64EncodedDataPromise = new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(blob);
    });

    return {
      inlineData: { data: await base64EncodedDataPromise, mimeType: blob.type },
    };
  }

  const handleChange = (e) => {
    setTextPrompt(e.target.value);
  };

  const goBack = () => {
    navigate(-1);
  };

  const openCamera = () => {
    setIsCameraOpen(true);
  };

  const switchCamera = () => {
    const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
    setCurrentFacingMode(newFacingMode);
  };

  const capturePhoto = () => {
    if (webcamRef) {
      const imageSrc = webcamRef.getScreenshot();
      setImagePreview(imageSrc);
      setIsCameraOpen(false);

      // Encode image data for AI processing
      setImageInlineData({
        inlineData: { data: imageSrc.split(',')[1], mimeType: 'image/png' },
      });
    }
  };

  const exitCamera = () => {
    setIsCameraOpen(false);
  };

  return {
    image,
    imageInlineData,
    loading,
    textPrompt,
    imagePreview,
    messages,
    isCameraOpen,
    currentFacingMode,
    webcamRef,
    plantName,
    daysSincePlanting,
    temperature,
    humidity,
    blynkApiKey,
    sensorDataLoaded,
    handleFileChange,
    handleChange,
    goBack,
    openCamera,
    switchCamera,
    capturePhoto,
    exitCamera,
    sendMessage,
  };
};