import React, { useEffect, useState } from "react";
import Header from "./components/Header";
import "./css/DiseaseDetection.css";
import { UserAuth } from "../context/AuthContext";
import { fetchSelectedApiKey } from "../services/headerService";
import { Spin } from "antd";

const firebaseHost = process.env.REACT_APP_FIREBASE_DATABASE_URL;
const firebaseAuth = process.env.REACT_APP_FIREBASE_AUTH;

function DiseaseDetection() {
  const { currentUser } = UserAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedApiKey, setSelectedApiKey] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [lastImage, setLastImage] = useState(""); // Store last image to compare

  useEffect(() => {
    fetchSelectedApiKey(currentUser, setSelectedApiKey);
  }, [currentUser]);

  // ✅ Define fetchImage before using it
  const fetchImage = async () => {
    try {
      console.log("📸 Fetching latest image from Firebase...");

      const response = await fetch(
        `https://${firebaseHost}/images.json?auth=${firebaseAuth}`
      );

      if (!response.ok) {
        throw new Error(`🚨 HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log("✅ Fetched image data:", data);

      if (data) {
        const imageBase64 = data.image || Object.values(data)[0]?.image;
        if (imageBase64) {
          // ✅ Only update if new image is different
          if (imageBase64 !== lastImage) {
            setImageUrl(`data:image/jpeg;base64,${imageBase64}`);
            setLastImage(imageBase64); // Update last image
            console.log("🖼 New image detected! Updating...");
          } else {
            console.log("🔄 No new image, skipping update.");
          }
        } else {
          console.warn("⚠️ No image found in Firebase!");
        }
      }
    } catch (error) {
      console.error("❌ Error fetching image:", error);
    }
  };

  // ✅ Fetch new image every 5 seconds
  useEffect(() => {
    const interval = setInterval(fetchImage, 5000);
    return () => clearInterval(interval);
  }, [lastImage]); // Only refresh if lastImage changes

  // ✅ Capture command function
  const sendCaptureCommand = async () => {
    try {
      console.log("📢 Sending capture command...");
      await fetch(
        `https://${firebaseHost}/capture.json?auth=${firebaseAuth}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ capture: true }),
        }
      );
      console.log("✅ Capture command sent!");

      // ✅ Wait before fetching the new image
      setTimeout(() => {
        console.log("⏳ Waiting before fetching new image...");
        fetchImage();
      }, 3000);
    } catch (error) {
      console.error("❌ Failed to send capture command:", error);
    }
  };

  return (
    <div style={{ width: "100%", overflowX: "hidden" }}>
      <Header /> {/* Keep header at the top */}
      <div className="page-container"> {/* Center only the capture section */}
        <div className="container">
          <h2>Capture Image</h2>
          <button className="btn" onClick={sendCaptureCommand}>
            Capture
          </button>
          {isLoading ? (
            <Spin />
          ) : imageUrl ? (
            <img
              src={imageUrl}
              alt="Captured"
              className="captured-image"
            />
          ) : (
            <p className="error-text">⚠️ No image available</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default DiseaseDetection;
