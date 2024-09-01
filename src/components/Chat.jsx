import React, { useState, useEffect, useRef } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Webcam from "react-webcam";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faCamera, faArrowLeft, faSyncAlt } from "@fortawesome/free-solid-svg-icons";
import { ToastContainer, toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import "./Chat.css";

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [showWebcam, setShowWebcam] = useState(false);
  const webcamRef = useRef(null);

  const API_KEY = process.env.REACT_APP_API_KEY;
  const navigate = useNavigate();

  const sanitizeText = (text) => {
    text = text.replace(/##\s*([^\n]+)/g, "<h3>$1</h3>");
    text = text.replace(/\*\*([^\*]+)\*\*/g, "<strong>$1</strong>");
    text = text.replace(/\*([^\*]+)\*\*/g, "<br />$1<br />");
    text = text.replace(/\*([^\*]+)\*/g, "<br />$1<br />");
    return text;
  };

  useEffect(() => {
    const startChat = async () => {
      if (messages.length === 0) {
        try {
          const genAI = new GoogleGenerativeAI(API_KEY);
          const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
          const prompt = "hello!";
          const result = await model.generateContent(prompt);
          const response = result.response;
          const text = await response.text();

          setMessages([
            {
              text: sanitizeText(text),
              user: false,
            },
          ]);
        } catch (error) {
          toast.error("Error starting chat.");
        }
      }
    };

    startChat();
  }, [API_KEY, messages.length]);

  const sendMessage = async () => {
    if (!userInput.trim() && !image) {
      toast.warning("Please type a message or add an image before sending.");
      return;
    }

    setLoading(true);
    const userMessage = { text: userInput, user: true, image };

    setMessages((prevMessages) => [...prevMessages, userMessage]);

    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: "You are not Gemini, you are AI-Ponics. Talk as if you are a Gardening Expert. Dont use *",
      });
      const prompt = userMessage.text;
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = await response.text();

      setMessages((prevMessages) => [
        ...prevMessages,
        { text: sanitizeText(text), user: false },
      ]);
    } catch (error) {
      toast.error("Error sending message.");
    } finally {
      setLoading(false);
      setUserInput("");
      setImage(null);
      setImagePreview(null);
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  const goBack = () => {
    navigate(-1);
  };

  const handleCameraToggle = () => {
    setIsFrontCamera((prev) => !prev);
    const cameraType = isFrontCamera ? "Back Camera" : "Front Camera";
    toast.info(`Switched to ${cameraType}`);
  };

  const toggleWebcam = () => {
    setShowWebcam((prev) => !prev);
  };

  const capture = () => {
    if (showWebcam) {
      const imageSrc = webcamRef.current.getScreenshot();
      setImagePreview(imageSrc);
      setImage(imageSrc);
      setShowWebcam(false);
    } else {
      toggleWebcam();
    }
  };

  return (
    <div className="Appnobg">
      <div className="chat-container">
        <ToastContainer />
        <div className="header">
          <h2>Ask AI-Ponics!</h2>
          <button className="back-button" onClick={goBack}>
            <FontAwesomeIcon icon={faArrowLeft} />
            Back
          </button>
        </div>
        <div className="messages-container">
          {messages.map((msg, index) => (
            <div key={index} className={`message-container ${msg.user ? "user" : "ai"}`}>
              <div
                className={`message ${msg.user ? "user" : "ai"}`}
                dangerouslySetInnerHTML={{ __html: msg.text }}
              />
              {msg.image && <img src={msg.image} alt="user-uploaded" className="uploaded-image" />}
            </div>
          ))}
        </div>
        <div className="input-container">
          <input
            className="message-input"
            placeholder="Type a message"
            onChange={(e) => setUserInput(e.target.value)}
            value={userInput}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
        </div>
        <div className="input-button-container">
          <button className="camera-toggle-button" onClick={handleCameraToggle} disabled={loading}>
            <FontAwesomeIcon icon={faSyncAlt} />
          </button>
          <button
            className="camera-button"
            onClick={capture}
            disabled={loading}
          >
            <FontAwesomeIcon icon={faCamera} />
          </button>
          <button className="send-button" onClick={sendMessage} disabled={loading}>
            {loading ? <div className="loading-spinner"></div> : <FontAwesomeIcon icon={faSearch} />}
          </button>
        </div>

        {imagePreview && (
          <div className="image-preview-container">
            <img src={imagePreview} alt="preview" className="image-preview" />
            <button className="remove-image-button" onClick={() => setImagePreview(null)}>
              Remove
            </button>
          </div>
        )}

        {showWebcam && (
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/png"
            videoConstraints={{
              facingMode: isFrontCamera ? "user" : "environment",
            }}
            className="webcam"
          />
        )}
      </div>
    </div>
  );
};

export default Chat;
