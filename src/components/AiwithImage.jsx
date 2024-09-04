import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Box, Button } from '@mui/material';
import { ToastContainer, toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faImage, faSearch } from '@fortawesome/free-solid-svg-icons';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getBase64 } from '../helpers/imageHelper';
import './Chat.css';

// Initialize the Google Generative AI with API key from environment variables
const apiKey = process.env.REACT_APP_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const AiwithImage = () => {
  const [image, setImage] = useState('');
  const [imageInlineData, setImageInlineData] = useState('');
  const [loading, setLoading] = useState(false);
  const [textPrompt, setTextPrompt] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [messages, setMessages] = useState([]);
  const navigate = useNavigate(); // Use the useNavigate hook

  async function aiRun() {
    setLoading(true);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: "You are now AI-Ponics, the plant assistant.",
    });
    const result = await model.generateContent([textPrompt, imageInlineData]);
    const response = await result.response;
    const text = response.text();
    setLoading(false);
    setMessages((prevMessages) => [
      ...prevMessages,
      { user: true, text: textPrompt, image: imagePreview }, // User message with image preview
      { user: false, text: sanitizeText(text) } // AI response with generated image
    ]);
  }

  const sanitizeText = (text) => {
    // Replace ** with <strong> tags and * with <br /> for new lines
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold text
      .replace(/\*/g, '<br />'); // New line
  };

  const sendMessage = () => {
    if (textPrompt || imageInlineData) {
      aiRun();
      setTextPrompt(''); // Clear text input
      setImagePreview(null); // Clear image preview
      setImage(''); // Clear image state
      setImageInlineData(''); // Clear image inline data
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
      setImagePreview(URL.createObjectURL(file)); // Update preview
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

  // Implement the goBack function
  const goBack = () => {
    navigate(-1); // Go back to the previous page
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
      </div>
    </div>
  );
};

export default AiwithImage;
