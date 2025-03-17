import React, { useEffect, useState } from "react";
import Header from "./components/Header";
import "./css/DiseaseDetection.css";
import { UserAuth } from "../context/AuthContext";
import { fetchSelectedApiKey } from "../services/headerService";
import { generateAIResponse, fetchUserData } from "../services/chatService";
import { Spin, message, Typography } from "antd";
import { fetchSensorData } from "../services/sensorService";
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { getStatusConfig, StatusMessage } from '../services/sensorService'; // Adjust the import path

const firebaseHost = process.env.REACT_APP_FIREBASE_DATABASE_URL;
const firebaseAuth = process.env.REACT_APP_FIREBASE_AUTH;

function DiseaseDetection() {
  const { currentUser } = UserAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedApiKey, setSelectedApiKey] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [lastImage, setLastImage] = useState("");
  const [cropStatus, setCropStatus] = useState(null);
  const [messages, setMessages] = useState([]);
  const [daysSincePlanting, setDaysSincePlanting] = useState(0);
  const [plantName, setPlantName] = useState('');
  const [humidity, setHumidity] = useState(null);
  const [temperature, setTemperature] = useState(null);
  const [flowRate, setFlowRate] = useState(null); // New state for flow rate
  const [isApiKeyValid, setIsApiKeyValid] = useState(true);
  const [isDeviceOnline, setIsDeviceOnline] = useState(false);
  const [sensorDataLoaded, setSensorDataLoaded] = useState(false);



  
  const fetchSensorDataFromBlynk = async (selectedApiKey) => {
    await fetchSensorData({ 
      selectedApiKey, 
      setIsDeviceOnline, 
      setTemperature, 
      setHumidity, 
      setFlowRate, // Pass setFlowRate to fetchSensorData
      setIsLoading: setSensorDataLoaded, 
      setIsApiKeyValid
    });
  };

  useEffect(() => {
    if (!currentUser) {
      setSensorDataLoaded(true);
      return;
    }
    fetchUserData(doc, currentUser, db, getDoc, setSensorDataLoaded, setPlantName, setDaysSincePlanting, setSelectedApiKey, fetchSensorDataFromBlynk, message);
  }, [currentUser]);

  useEffect(() => {
    fetchSelectedApiKey(currentUser, setSelectedApiKey);
  }, [currentUser]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedApiKey) {
        fetchSensorDataFromBlynk(selectedApiKey);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [selectedApiKey]);

  useEffect(() => {
    const interval = setInterval(fetchImage, 5000);
    return () => clearInterval(interval);
  }, [lastImage]);

  const fetchImage = async () => {
    try {
      console.log("📸 Fetching latest image from Firebase...");
      const response = await fetch(`https://${firebaseHost}/images.json?auth=${firebaseAuth}`);
      if (!response.ok) throw new Error(`🚨 HTTP error! Status: ${response.status}`);
      const data = await response.json();
      if (data) {
        const imageBase64 = data.image || Object.values(data)[0]?.image;
        if (imageBase64 && imageBase64 !== lastImage) {
          setImageUrl(`data:image/jpeg;base64,${imageBase64}`);
          setLastImage(imageBase64);
          console.log("🖼 New image detected! Updating...");
        }
      }
    } catch (error) {
      console.error("❌ Error fetching image:", error);
    }
  };

  const sendCaptureCommand = async () => {
    try {
      console.log("📢 Sending capture command...");
      await fetch(`https://${firebaseHost}/capture.json?auth=${firebaseAuth}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ capture: true }),
      });
      console.log("✅ Capture command sent!");
      setTimeout(async () => {
        console.log("⏳ Fetching new image...");
        await fetchImage();
        setTimeout(() => analyzeImage(lastImage), 2000);
      }, 3000);
    } catch (error) {
      console.error("❌ Failed to send capture command:", error);
    }
  };

  const analyzeImage = async (imageBase64) => {
    try {
      console.log("📤 Sending image to AI chatbot...");
      const prompt = `Analyze the given plant image and provide:
        - Health: (Healthy or Not Healthy)
        - Status: (Ready to Harvest or Not Ready to Harvest)`;
      const responseStream = generateAIResponse(
        prompt, imageBase64, plantName, daysSincePlanting, temperature, humidity, messages
      );
      let currentText = "";
      for await (const chunk of responseStream) currentText += chunk;
      console.log("✅ AI Response:", currentText);
      setCropStatus({
        health: extractValue(currentText, "Health", "Unknown"),
        status: extractValue(currentText, "Status", "Not Ready to Harvest"),
      });
    } catch (error) {
      console.error("❌ Error analyzing image:", error);
    }
  };

  const extractValue = (text, key, defaultValue) => {
    const regex = new RegExp(`${key}:\s*(.+)`, "i");
    const match = text.match(regex);
    return match ? match[1].trim() : defaultValue;
  };

  // Get the current status configuration
  const status = getStatusConfig(selectedApiKey, isApiKeyValid, isDeviceOnline, isLoading)
    .find(status => status.when);

  return (
    <div style={{ width: "100%", overflowX: "hidden" }}>
      <Header />
      <div className="page-container">
        <div className="container">
          <h2>Capture Image</h2>
          {/* Display status message if applicable */}
          {status && (
            <StatusMessage
              message={status.message}
              className={status.className}
              style={status.style}
            />
          )}
          {/* Render the rest of the UI if no status message is displayed */}
          {!status && (
            <>
              <button className="btn" onClick={sendCaptureCommand}>Capture</button>
              {isLoading ? <Spin /> : imageUrl ? (
                <>
                  <img src={imageUrl} alt="Captured" className="captured-image" />
                  {cropStatus && (
                    <div className="analysis-result">
                      <p>🌱 <strong>Crop Status:</strong> {cropStatus.health}</p>
                      <p>⏳ <strong>Ready for Harvest:</strong> {cropStatus.status}</p>
                    </div>
                  )}
                </>
              ) : <p className="error-text">⚠️ No image available</p>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default DiseaseDetection;