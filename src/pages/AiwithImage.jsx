import React from 'react';
import { ToastContainer } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faImage, faCamera, faSearch, faSyncAlt, faTimes } from '@fortawesome/free-solid-svg-icons';
import Webcam from 'react-webcam';
import './css/Chat.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { useChatService } from '../services/chatService';

const AiwithImage = () => {
  const {
    image,
    imageInlineData,
    loading,
    textPrompt,
    imagePreview,
    setImagePreview,
    messages,
    isCameraOpen,
    currentFacingMode,
    webcamRef,
    setWebcamRef,
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
  } = useChatService();

  return (
    <div className="App-Chat">
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
              <div className={`message ${msg.user ? "user" : "ai"}`}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                  className="markdown-content"
                >
                  {msg.text}
                </ReactMarkdown>
              </div>
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
            className={`camera-button ${imagePreview ? 'disabled' : ''}`}
            onClick={openCamera}
            disabled={imagePreview || loading}
          >
            <FontAwesomeIcon icon={faCamera} />
          </button>
          <button className="send-button" onClick={sendMessage} disabled={loading}>
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