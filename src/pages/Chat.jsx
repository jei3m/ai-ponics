import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faImage, faCamera, faSearch, faSyncAlt, faTimes } from '@fortawesome/free-solid-svg-icons';
import { UserAuth } from '../context/AuthContext';
import { db } from '../firebase'; 
import { doc, getDoc } from 'firebase/firestore';
import Webcam from 'react-webcam';
import './css/Chat.css';
import { useApiKey } from "../context/ApiKeyContext";
import ReactMarkdown from 'react-markdown';
import { message } from 'antd';
import { fetchSensorData, generateGreeting, generateAIResponse, fileToGenerativePart, getBase64 } from '../services/chatServices';

const AiwithImage = () => {
  const [image, setImage] = useState('');
  const [imageInlineData, setImageInlineData] = useState('');
  const [loading, setLoading] = useState(false);
  const { selectedApiKey } = useApiKey();
  const [textPrompt, setTextPrompt] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [currentFacingMode, setCurrentFacingMode] = useState('environment'); // Back camera by default
  const [webcamRef, setWebcamRef] = useState(null); 
  const [plantName, setPlantName] = useState('');
  const [daysSincePlanting, setDaysSincePlanting] = useState(0);
  const [temperature, setTemperature] = useState(null);
  const [humidity, setHumidity] = useState(null);
  const [systemStatus, setSystemStatus] = useState(null);
  const [blynkApiKey, setBlynkApiKey] = useState('');
  const navigate = useNavigate();
  const { currentUser } = UserAuth();
  const [sensorDataLoaded, setSensorDataLoaded] = useState(false);

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
        setSensorDataLoaded(true); // Ensure sensor data loading state is updated on error
      }
    };
  
    fetchUserData();
  }, [currentUser]);

  const fetchSensorDataFromBlynk = async (selectedApiKey) => {
    try {
      const sensorData = await fetchSensorData(selectedApiKey);
      setSystemStatus(sensorData.systemStatus);
      setTemperature(sensorData.temperature);
      setHumidity(sensorData.humidity);
      setSensorDataLoaded(true);
    } catch (error) {
      console.error('Error fetching sensor data:', error);
      setMessages([{ user:false, text: "Invalid API key. Please check your API key and try again." }]);
      setSensorDataLoaded(true);
    }
  };

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

  // Function for Greeting the User
  useEffect(() => {
    async function greetUser() {

      if (!sensorDataLoaded) {
        setMessages([{ user:false, text: "Sensor data is still loading... Please wait."}])
        return;
      }

      if (systemStatus == null) {
        setMessages([{ user:false, text: "Your API key missing. Please provide a valid API key to proceed."}])
        return;
      }

      if (!systemStatus) {
        console.log(`System status:${systemStatus}`)
        setMessages([{ user:false, text: "I apologize, but I cannot provide readings as your Aeroponic System appears to be offline."}])
        return;
      }

      try {
        const greetingText = await generateGreeting(plantName, daysSincePlanting, temperature, humidity);
        setMessages([{ user: false, text: greetingText }]);
      } catch (error) {
        console.error('Error generating greeting:', error);
        setMessages([{ user: false, text: "Sorry, I encountered an error while generating a greeting." }]);
      }
    }

    greetUser();
  }, [sensorDataLoaded, systemStatus, plantName, daysSincePlanting, temperature, humidity]);

  async function aiRun() {
    if (!systemStatus) {
      return;
    }

    // Error message from the AI if image is sent with no text
    if (!textPrompt || textPrompt.trim() === '') {
      setMessages((prevMessages) => [
        ...prevMessages,
        {user: true, image: imagePreview}
      ]);
      setMessages((prevMessages) => [
        ...prevMessages,
        {user: false, text: "Please add some information about the image."}
      ]);
      return;
    }

    setLoading(true);
    try {
      // Add user's message immediately
      setMessages((prevMessages) => [
        ...prevMessages,
        { user: true, text: textPrompt, image: imagePreview }
      ]);

      // Add an empty AI message that will be updated with streaming content
      setMessages((prevMessages) => [
        ...prevMessages,
        { user: false, text: '', isStreaming: true }
      ]);

      const previousMessages = messages;
      const responseStream = generateAIResponse(textPrompt, imageInlineData, plantName, daysSincePlanting, temperature, humidity, previousMessages);
      let accumulatedText = '';

      for await (const chunk of responseStream) {
        accumulatedText += chunk;
        setMessages((prevMessages) => {
          const newMessages = [...prevMessages];
          newMessages[newMessages.length - 1] = {
            user: false,
            text: accumulatedText,
            isStreaming: true
          };
          return newMessages;
        });
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

  // Custom components for ReactMarkdown
  const components = {
    p: ({ children }) => <div style={{ margin: 0 }}>{children}</div>,
    strong: ({ children }) => <strong>{children}</strong>,
    br: () => <br />,
    h2: ({ children }) => <h3>{children}</h3>
  };

  // Error when sending a prompt with cleared fields
  const sendMessage = () => {
    if (textPrompt || imageInlineData) {
      aiRun();
      setTextPrompt('');
      setImagePreview(null);
      setImage('');
      setImageInlineData('');
    } else {
      message.error('Please provide a prompt.');
    }
  };

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

  return (
    <div className="App-Chat">
      <div className="chat-container">

        <div className="header" style={{display: "flex", justifyContent: "space-between"}}>
          <h2>Ask AI-Ponics!</h2>
          <button className="back-button" onClick={goBack}>
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
              <button className="exit-button" onClick={exitCamera}>
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
            <button className="remove-image-button" onClick={() => setImagePreview(null)}>
              Remove
            </button>
          </div>
        )}
        
      </div>
    </div>
  );
};

export default AiwithImage;