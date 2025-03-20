import React, { useEffect, useState } from "react";
import "./css/DiseaseDetection.css";
import { UserAuth } from "../context/AuthContext";
import { fetchSelectedApiKey } from "../services/headerService";
import { generateAIResponse, fetchUserData } from "../services/chatService";
import { 
  Spin, 
  message, 
  Typography, 
  Button, 
  Card, 
  Empty, 
  Alert, 
  Divider 
} from "antd";
import { 
  CameraOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  WarningOutlined,
  LoadingOutlined
} from "@ant-design/icons";
import { fetchSensorData } from "../services/sensorService";
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const { Title, Text } = Typography;
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
  const [flowRate, setFlowRate] = useState(null);
  const [pHlevel, setpHlevel] = useState(null);
  const [isApiKeyValid, setIsApiKeyValid] = useState(true);
  const [isDeviceOnline, setIsDeviceOnline] = useState(false);
  const [sensorDataLoaded, setSensorDataLoaded] = useState(false);
  const [captureStatus, setCaptureStatus] = useState("");
  const [analysisStatus, setAnalysisStatus] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      setIsLoading(true);
      return;
    }
    fetchUserData(doc, currentUser, db, getDoc, setIsLoading, setPlantName, setDaysSincePlanting, setSelectedApiKey, fetchSensorDataFromBlynk, message);
  }, [currentUser]);

  useEffect(() => {
    fetchSelectedApiKey(currentUser, setSelectedApiKey);
  }, [currentUser]);

  useEffect(() => {
    if (selectedApiKey) fetchSensorDataFromBlynk(selectedApiKey);
  }, [selectedApiKey]);

  useEffect(() => {
    let interval;
    if (selectedApiKey) {
      interval = setInterval(() => fetchSensorDataFromBlynk(selectedApiKey), 2000);
    }
    return () => interval && clearInterval(interval);
  }, [selectedApiKey]);

  useEffect(() => {
    if (selectedApiKey) fetchImage();
  }, [selectedApiKey]);

  useEffect(() => {
    const interval = setInterval(fetchImage, 5000);
    return () => clearInterval(interval);
  }, [lastImage]);

  const fetchSensorDataFromBlynk = async (selectedApiKey) => {
    try {
      await fetchSensorData({ 
        selectedApiKey, 
        setIsDeviceOnline, 
        setTemperature, 
        setHumidity, 
        setFlowRate,
        setpHlevel,
        setIsLoading, 
        setIsApiKeyValid
      });
      setSensorDataLoaded(true);
    } catch (error) {
      setIsDeviceOnline(false);
      setIsApiKeyValid(false);
    }
  };

  const sendCaptureCommand = async () => {
    try {
      if (!selectedApiKey) return;

      setIsCapturing(true);
      // Hide previous image
      setImageUrl("");
      setCaptureStatus("Capturing image...");
      setAnalysisStatus("");

      console.log("Sending first capture command...");

      // First capture command
      await fetch(`https://${firebaseHost}/capture/${selectedApiKey}.json?auth=${firebaseAuth}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ capture: true }),
      });

      console.log("First capture command sent!");

      setTimeout(async () => {
        console.log("Sending second capture command...");

        await fetch(`https://${firebaseHost}/capture/${selectedApiKey}.json?auth=${firebaseAuth}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ capture: true }),
        });

        console.log("Second capture command sent!");
        setCaptureStatus("Image captured! Fetching new image...");

        setTimeout(async () => {
          console.log("Fetching new image...");
          await fetchImage(true);
          setIsCapturing(false);
        }, 3000);

      }, 3000);

    } catch (error) {
      console.error("Failed to send capture command:", error);
      setCaptureStatus("Failed to capture image.");
      setIsCapturing(false);
    }
  };

  // Fetch image from Firebase
  const fetchImage = async (isFromCapture = false) => {
    try {
      if (!selectedApiKey) return;

      // Fetch the latest image reference
      const latestImageResponse = await fetch(`https://${firebaseHost}/latest_image/${selectedApiKey}.json?auth=${firebaseAuth}`);
      if (!latestImageResponse.ok) throw new Error(`HTTP error! Status: ${latestImageResponse.status}`);
      const latestImageData = await latestImageResponse.json();

      if (latestImageData && latestImageData.path) {
        // Fetch the actual image using the path
        const imageResponse = await fetch(latestImageData.path);
        if (!imageResponse.ok) throw new Error(`HTTP error! Status: ${imageResponse.status}`);
        const imageData = await imageResponse.json();

        const imageBase64 = imageData.image;
        if (imageBase64 && imageBase64 !== lastImage) {
          console.log("New image detected! Waiting 1 second before displaying...");
          
          setTimeout(() => {
            setImageUrl(`data:image/jpeg;base64,${imageBase64}`);
            setLastImage(imageBase64);
            setCaptureStatus("");
            console.log("New image displayed!");

            // Start AI analysis only if this fetch was triggered by a capture command
            if (isFromCapture) {
              setAnalysisStatus("Analyzing image...");
              setIsAnalyzing(true);
              setTimeout(() => analyzeImage(imageBase64), 2000);
            }
          }, 1000); // Delay displaying the image by 1 second
        }
      }
    } catch (error) {
      console.error("Error fetching image:", error);
    }
  };

  // Analyze image using AI
  const analyzeImage = async (imageBase64) => {
    try {
      console.log("Sending image to AI chatbot...");
      const prompt = `Analyze the given plant image and provide:
          - Health: (Healthy or Not Healthy)
          - Status: (Ready to Harvest or Not Ready to Harvest)`;
      const responseStream = generateAIResponse(
        prompt, imageBase64, plantName, daysSincePlanting, temperature, humidity, messages
      );
      let currentText = "";
      for await (const chunk of responseStream) currentText += chunk;
      console.log("AI Response:", currentText);
      setCropStatus({
        health: extractValue(currentText, "Health", "Unknown"),
        status: extractValue(currentText, "Status", "Not Ready to Harvest"),
      });
      setAnalysisStatus("");
      setIsAnalyzing(false);
    } catch (error) {
      console.error("Error analyzing image:", error);
      setAnalysisStatus("Failed to analyze image.");
      setIsAnalyzing(false);
      setTimeout(() => setAnalysisStatus(""), 3000);
    }
  };

  const extractValue = (text, key, defaultValue) => {
    const regex = new RegExp(`${key}:\s*(.+)`, "i");
    const match = text.match(regex);
    return match ? match[1].trim() : defaultValue;
  };

  const getStatusMessage = () => {
    if (!selectedApiKey) return "Missing API Key. Please configure your API key.";
    if (!isApiKeyValid) return "Invalid API Key. Please check your API key.";
    if (!isDeviceOnline) return "Device Offline. Please check your device connection.";
    if (!sensorDataLoaded) return "Loading sensor data...";
    return null;
  };

  const getHealthIcon = (health) => {
    if (health === "Healthy") return <CheckCircleOutlined className="icon status-healthy" />;
    if (health === "Not Healthy") return <CloseCircleOutlined className="icon status-unhealthy" />;
    return <WarningOutlined className="icon" />;
  };

  const getStatusIcon = (status) => {
    if (status === "Ready to Harvest") return <CheckCircleOutlined className="icon status-ready" />;
    return <WarningOutlined className="icon status-not-ready" />;
  };

  return (
    <>
      <div className="page-container">
        <Card className="container"
          title={
            <Title level={3} className="card-title">Health Analysis</Title>
          }
        >
          <div className="card-content">
            {getStatusMessage() && (
              <Alert
                className="status-message"
                message={getStatusMessage()}
                type="warning"
                showIcon
              />
            )}
            
            {!getStatusMessage() && (
              <div>
                {plantName && imageUrl && (
                  <Alert
                    className="status-message"
                    message={`Analyzing: ${plantName} (${daysSincePlanting} days old)`}
                    type="info"
                    showIcon
                  />
                )}
                
                {isAnalyzing ? (
                  <div className="loading-container">
                    <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
                    <Text className="loading-text">Analyzing image...</Text>
                  </div>
                ) : isLoading ? (
                  <div className="loading-container">
                    <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
                    <Text className="loading-text">Loading...</Text>
                  </div>
                ) : imageUrl ? (
                  <>
                    <img src={imageUrl} alt="Captured" className="captured-image" />
                    
                    {cropStatus && (
                      <div className="analysis-result">
                        <Title level={4}>Analysis Results</Title>
                        <Divider style={{ margin: '12px 0' }} />
                        
                        <div className="analysis-item">
                          {getHealthIcon(cropStatus.health)}
                          <Text className="label">Plant Health:</Text>
                          <Text className={cropStatus.health === "Healthy" ? "status-healthy" : "status-unhealthy"}>
                            {cropStatus.health}
                          </Text>
                        </div>
                        
                        <div className="analysis-item">
                          {getStatusIcon(cropStatus.status)}
                          <Text className="label">Harvest Status:</Text>
                          <Text className={cropStatus.status === "Ready to Harvest" ? "status-ready" : "status-not-ready"}>
                            {cropStatus.status}
                          </Text>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <Empty
                    description="No image available"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                )}

                {captureStatus && <Alert message={captureStatus} type="info" showIcon />}
                {analysisStatus && <Alert message={analysisStatus} type="info" showIcon />}

                <Button 
                  type="primary" 
                  icon={<CameraOutlined />} 
                  size="large"
                  className="capture-button"
                  onClick={sendCaptureCommand}
                  loading={isCapturing}
                  disabled={isCapturing}
                >
                  Capture Image
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}

export default DiseaseDetection;