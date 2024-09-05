import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faImage, faCamera, faSearch, faSyncAlt, faTimes } from '@fortawesome/free-solid-svg-icons';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getBase64 } from '../helpers/imageHelper';
import './Chat.css';

const apiKey = process.env.REACT_APP_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const AiwithImage = () => {
  const [image, setImage] = useState('');
  const [imageInlineData, setImageInlineData] = useState('');
  const [loading, setLoading] = useState(false);
  const [textPrompt, setTextPrompt] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [currentFacingMode, setCurrentFacingMode] = useState('user'); // Front camera by default
  const videoRef = useRef(null); // Reference to the video element
  const canvasRef = useRef(null); // Reference to the canvas for capturing photo
  const navigate = useNavigate();

  async function aiRun() {
    setLoading(true);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: "Analyze anything is sent to you.",
    });
    const result = await model.generateContent([textPrompt, imageInlineData]);
    const response = await result.response;
    const text = response.text();
    setLoading(false);
    setMessages((prevMessages) => [
      ...prevMessages,
      { user: true, text: textPrompt, image: imagePreview },
      { user: false, text: sanitizeText(text) },
    ]);
  }

  const sanitizeText = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*/g, '<br />');
  };

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

  const openCamera = async () => {
    setIsCameraOpen(true);
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: currentFacingMode },
    });
    videoRef.current.srcObject = stream;
    videoRef.current.play();
  };

  const switchCamera = () => {
    const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
    setCurrentFacingMode(newFacingMode);
    openCamera(); // Reopen the camera with the new facing mode
  };

  const capturePhoto = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/png');
    setImagePreview(dataUrl);
    setIsCameraOpen(false);

    // Stop camera stream
    const stream = videoRef.current.srcObject;
    const tracks = stream.getTracks();
    tracks.forEach(track => track.stop());

    setImageInlineData({
      inlineData: { data: dataUrl.split(',')[1], mimeType: 'image/png' },
    });
  };

  const exitCamera = () => {
    setIsCameraOpen(false);
    const stream = videoRef.current.srcObject;
    const tracks = stream.getTracks();
    tracks.forEach(track => track.stop());
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
            onChange={handleChange}
            value={textPrompt}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
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
              disabled={loading}
            >
              <FontAwesomeIcon icon={faImage} />
            </button>
            <button
              className={`camera-button ${isCameraOpen ? 'capture-button' : ''}`}
              onClick={isCameraOpen ? capturePhoto : openCamera}
              disabled={loading}
            >
              <FontAwesomeIcon icon={faCamera} />
            </button>
            <button className="send-button" onClick={sendMessage} disabled={loading}>
              {loading ? <div className="loading-spinner"></div> : <FontAwesomeIcon icon={faSearch} />}
            </button>
          </div>

        {isCameraOpen && (
          <div className="camera-container">
            <video ref={videoRef} className="video-feed" />
            <div className="camera-controls">
              <button className="camera-toggle-button" onClick={switchCamera}>
                <FontAwesomeIcon icon={faSyncAlt} />
              </button>
              <button className="exit-button" onClick={exitCamera}>
                <FontAwesomeIcon icon={faTimes} />
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

        <canvas ref={canvasRef} style={{ display: 'none' }} width="640" height="480" />
      </div>
    </div>
  );
};

export default AiwithImage;
