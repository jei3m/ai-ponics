import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { UserAuth } from '../context/AuthContext';
import { db } from '../firebase'; 
import { doc, getDoc } from 'firebase/firestore';
import Webcam from 'react-webcam';
import './css/Chat.css';
import { useApiKey } from "../context/ApiKeyContext";
import ReactMarkdown from 'react-markdown';
import { message } from 'antd';

import { 
  faArrowLeft, 
  faImage, 
  faCamera, 
  faSearch, 
  faSyncAlt, 
  faTimes 
} from '@fortawesome/free-solid-svg-icons';

import { 
  generateGreeting, 
  generateAIResponse, 
  fileToGenerativePart, 
  getBase64, 
  components 
} from '../services/chatService';

import { 
  MAX_TEMPERATURE, 
  MIN_TEMPERATURE,
  fetchSensorData 
} from "../services/sensorService";

const Chat = () => {
  const navigate = useNavigate();

  // States for chat messages
  const [textPrompt, setTextPrompt] = useState('');
  const [messages, setMessages] = useState([]);
  const [image, setImage] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [imageInlineData, setImageInlineData] = useState('');

  // Planting Information States
  const [daysSincePlanting, setDaysSincePlanting] = useState(0);
  const [plantName, setPlantName] = useState('');


  // API Key States
  const { selectedApiKey } = useApiKey();
  const [blynkApiKey, setBlynkApiKey] = useState('');

  // Loading States
  const [loading, setLoading] = useState(false);
  const [sensorDataLoaded, setSensorDataLoaded] = useState(false);

  // Sensor Data States
  const [humidity, setHumidity] = useState(null);
  const [temperature, setTemperature] = useState(null);
  const [systemStatus, setSystemStatus] = useState(null);

  // Fetch sensor data from Blynk API
  const fetchSensorDataFromBlynk = async (selectedApiKey) => {
    try {
      await fetchSensorData({ 
        selectedApiKey, 
        setIsDeviceOnline: setSystemStatus, 
        setTemperature, 
        setHumidity, 
        setIsLoading: setSensorDataLoaded, 
        setIsApiKeyValid: setBlynkApiKey 
      });
      setSensorDataLoaded(true);
    } catch (error) {
      console.error('Error fetching sensor data:', error);
      message.error('Error fetching sensor data. Please try again.');
      setSensorDataLoaded(true);
      setBlynkApiKey(false);
      return;
    }
  };
  
  // Fetch sensor data from Blynk API on API key change
  useEffect(() => {
    let interval;
    if (selectedApiKey) {
      fetchSensorDataFromBlynk(selectedApiKey);
      interval = setInterval(() => fetchSensorDataFromBlynk(selectedApiKey), 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [selectedApiKey]);

  // Fetch user data and sensor data
  const { currentUser } = UserAuth();
  useEffect(() => {
    if (!currentUser) {
      setSensorDataLoaded(true); // Exit early if no user is logged in
      return;
    }
  
    const fetchUserData = async () => {
      try {
        const docRef = doc(db, 'users', currentUser.uid); // Adjust collection path if necessary
        const docSnap = await getDoc(docRef);
  
        if (!docSnap.exists()) {
          console.log('No such document!');
          setSensorDataLoaded(true); // Exit early if document does not exist
          return;
        }
  
        const {
          plantName = '', 
          daysSincePlanting = 0,
          selectedApiKey = '',
        } = docSnap.data();
  
        setPlantName(plantName);
        setDaysSincePlanting(daysSincePlanting);
        setBlynkApiKey(selectedApiKey);
  
        if (!selectedApiKey) {
          setSensorDataLoaded(true); // Exit early if no API key is available
          return;
        }
  
        fetchSensorDataFromBlynk(selectedApiKey); // Fetch sensor data if API key is present
      } catch (error) {
        console.error('Error fetching user data:', error);
        message.error('Error fetching user data. Please try again.');
        setSensorDataLoaded(true); // Ensure sensor data loading state is updated on error
      }
    };
  
    fetchUserData();
  }, [currentUser]);

  // Function for Greeting the User
  useEffect(() => {
    async function greetUser() {

      if (!sensorDataLoaded) {
        setMessages([{ user:false, text: "Sensor data is still loading... Please wait."}])
        return;
      }

      if (blynkApiKey === false) {
        setMessages([{ user:false, text: "Your API key is invalid. Please check your API key and try again." }]);
        return;
      }

      if (systemStatus === null) {
        setMessages([{ user:false, text: "Your API key missing. Please provide a valid API key to proceed."}])
        return;
      }

      if (systemStatus === false) {
        console.log(`System status:${systemStatus}`)
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
     *   **Age:** ${daysSincePlanting}
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

    greetUser();
  }, [sensorDataLoaded, systemStatus, plantName, daysSincePlanting, temperature, humidity]);

  // AI conversation after greeting
  async function aiRun() {
    // If system is offline, do not proceed
    if (!systemStatus) {
      return;
    }
  
    setLoading(true);
    try {
      // Add user's message immediately
      setMessages((prevMessages) => [
        ...prevMessages,
        { user: true, text: textPrompt, image: imagePreview, imageInlineData: imageInlineData, isStreaming: false }
      ]);
  
      // Add an empty AI message that will be updated with streaming content
      setMessages((prevMessages) => [
        ...prevMessages,
        { user: false, text: '', isStreaming: true }
      ]);
  
      const previousMessages = messages;
      const responseStream = generateAIResponse(textPrompt, imageInlineData, plantName, daysSincePlanting, temperature, humidity, previousMessages);
      let accumulatedText = '';
  
      // Separate the response into chunks and stream letter by letter
      for await (const chunk of responseStream) {
        for (let i = 0; i < chunk.length; i++) {
          accumulatedText += chunk[i]; // Add one character at a time
          setMessages((prevMessages) => {
            const newMessages = [...prevMessages];
            newMessages[newMessages.length - 1] = {
              user: false,
              text: accumulatedText,
              isStreaming: true
            };
            return newMessages;
          });
  
          // Add a small delay between characters for a smooth typing effect
          await new Promise((resolve) => setTimeout(resolve, 10)); // Delay
        }
      }
  
      // Mark streaming as complete
      setMessages((prevMessages) => {
        const newMessages = [...prevMessages];
        newMessages[newMessages.length - 1] = {
          user: false,
          text: accumulatedText,
          isStreaming: false
        };
        return newMessages;
      });
    } catch (error) {
      console.error('Error generating AI response:', error);
      message.error('Failed to generate response. Please try again.');
      // Remove the streaming message if there was an error
      setMessages((prevMessages) => prevMessages.slice(0, -1));
    }
    setLoading(false);
  }

  // Send Message function
  const sendMessage = () => {
    if (textPrompt) {
      aiRun();
      setTextPrompt('');
      setImagePreview(null);
      setImage('');
      setImageInlineData('');
    } else if (imageInlineData && !textPrompt) {
      message.error('Please add additional information when sending an image.')
    } else {
      message.error('Please provide a prompt.');
    }
  };

  // For text input
  const handleChange = (e) => {
    setTextPrompt(e.target.value);
  };

  // For file upload
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

  // Switch camera facing mode
  const [currentFacingMode, setCurrentFacingMode] = useState('environment'); // Back camera by default

  const switchCamera = () => {
    const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
    setCurrentFacingMode(newFacingMode);
  };

  // Camera states
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // Open Camera
  const openCamera = () => {
    setIsCameraOpen(true);
  };

  // Capture photo from camera
  const [webcamRef, setWebcamRef] = useState(null); 
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

  // Clears all data related to the image
  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageInlineData('');
    setImage('');
  }

  // Scroll to latest generated message
  const messageEnd = useRef(null);
  useEffect(() => {
    messageEnd.current?.scrollIntoView({behavior: "smooth"})
  },[messages])

  return (
    <>
      <div className="App-Chat">
        <div className="chat-container">

          <div className="header" style={{display: "flex", justifyContent: "space-between"}}>
            <h2>Ask AI-Ponics!</h2>
            <button className="back-button" onClick={() => navigate(-1)}>
              <FontAwesomeIcon icon={faArrowLeft} />
              Back
            </button>
          </div>

          <div className="messages-container">
            {messages.map((msg, index) => (
              <div key={index} className={`message-container ${msg.user ? "user" : "ai"}`}>
                <div className={`message ${msg.user ? "user" : "ai"} ${msg.isStreaming ? "streaming" : ""}`}>
                  {msg.user ? (
                    <p>{msg.text}</p>
                  ) : (
                    <ReactMarkdown components={components}>{msg.text}</ReactMarkdown>
                  )}
                </div>
                {msg.image && (
                  <img src={msg.image} alt="user-uploaded" className="uploaded-image" />
                )}
              </div>
            ))}
            <div ref={messageEnd} />
          </div>

          <div className="input-container">
            <input
              className="message-input"
              placeholder={!systemStatus ? "Aeroponic System is Offline" : "Type a message"}
              onChange={handleChange}
              value={textPrompt}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              disabled={!systemStatus}
            />
          </div>

          <div className="input-button-container">
            <input
              type="file"
              id="file-upload"
              style={{ display: 'none' }}
              accept="image/*"
              onChange={handleFileChange}
            />
            <button
              className="upload-button"
              onClick={() => document.getElementById('file-upload').click()}
              disabled={loading || !systemStatus}
            >
              <FontAwesomeIcon icon={faImage} />
            </button>
            <button
              className={`camera-button ${imagePreview ? 'disabled' : ''}`}
              onClick={openCamera}
              disabled={imagePreview || loading || !systemStatus}
            >
              <FontAwesomeIcon icon={faCamera} />
            </button>
            <button className="send-button" onClick={sendMessage} disabled={loading || !systemStatus}>
              {loading ? <div className="loading-spinner"></div> : <FontAwesomeIcon icon={faSearch} />}
            </button>
          </div>

          {isCameraOpen && (
            <div className="camera-container">
              <Webcam
                audio={false}
                ref={(node) => setWebcamRef(node)}
                screenshotFormat="image/png"
                width="100%"
                videoConstraints={{ facingMode: currentFacingMode }}
                className="video-feed"
              />
              <div className="camera-controls">
                <button className="exit-button" onClick={() => setIsCameraOpen(false)}>
                  <FontAwesomeIcon icon={faTimes} />
                </button>
                <button className="camera-toggle-button" onClick={switchCamera}>
                  <FontAwesomeIcon icon={faSyncAlt} />
                </button>
                <button className="capture-button" onClick={capturePhoto}>
                  <FontAwesomeIcon icon={faCamera} />
                </button>
              </div>
            </div>
          )}

          {imagePreview && (
            <div className="image-preview-container">
              <img src={imagePreview} alt="preview" className="image-preview" />
              <button className="remove-image-button" onClick={handleRemoveImage}>
                Remove
              </button>
            </div>
          )}
          
        </div>
      </div>
    </>
  );
};

export default Chat;