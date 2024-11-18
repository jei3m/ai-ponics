// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { ToastContainer, toast } from 'react-toastify';
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import { faArrowLeft, faImage, faCamera, faSearch, faSyncAlt, faTimes } from '@fortawesome/free-solid-svg-icons';
// import { GoogleGenerativeAI } from "@google/generative-ai";
// import { UserAuth } from '../context/AuthContext';
// import { getBase64 } from '../helpers/imageHelper';
// import { db } from '../firebase'; // Make sure this points to your Firebase config
// import { doc, getDoc } from 'firebase/firestore'; // Firestore methods
// import Webcam from 'react-webcam';
// import './css/Chat.css';
// import axios from 'axios';

// // Setting constants to process environment variables (API Keys)
// const apiKey = process.env.REACT_APP_API_KEY;
// const genAI = new GoogleGenerativeAI(apiKey);

// const AiwithImage2 = () => {
//   const [image, setImage] = useState('');
//   const [imageInlineData, setImageInlineData] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [textPrompt, setTextPrompt] = useState('');
//   const [imagePreview, setImagePreview] = useState(null);
//   const [messages, setMessages] = useState([]);
//   const [isCameraOpen, setIsCameraOpen] = useState(false);
//   const [currentFacingMode, setCurrentFacingMode] = useState('environment'); // Back camera by default
//   const [webcamRef, setWebcamRef] = useState(null); 
//   const [plantName, setPlantName] = useState('AI-Ponics');
//   const [daysSincePlanting, setDaysSincePlanting] = useState(0);
//   const [temperature, setTemperature] = useState(null);
//   const [humidity, setHumidity] = useState(null);
//   const [blynkApiKey, setBlynkApiKey] = useState('');
//   const navigate = useNavigate();
//   const { currentUser } = UserAuth();
//   const [sensorDataLoaded, setSensorDataLoaded] = useState(false);

//   useEffect(() => {
//     const fetchUserData = async () => {
//       if (currentUser) {
//         try {
//           const docRef = doc(db, 'users', currentUser.uid); // Adjust collection path if necessary
//           const docSnap = await getDoc(docRef);

//           if (docSnap.exists()) {
//             const userData = docSnap.data();
//             setPlantName(userData.plantName || 'AI-Ponics'); // Default to 'AI-Ponics' if no plantName
//             setDaysSincePlanting(userData.daysSincePlanting || 0); // Default to 0 if no daysSincePlanting
//             setBlynkApiKey(userData.blynkApiKey || '');
            
//             // Start fetching sensor data immediately after getting the API key
//             if (userData.blynkApiKey) {
//               fetchSensorData(userData.blynkApiKey);
//             } else {
//               setSensorDataLoaded(true);
//             }
//           } else {
//             console.log('No such document!');
//             setSensorDataLoaded(true);
//           }
//         } catch (error) {
//           console.error('Error fetching user data:', error);
//           setSensorDataLoaded(true);
//         }
//       } else {
//         setSensorDataLoaded(true);
//       }
//     };

//     fetchUserData();
//   }, [currentUser]);

//   const fetchSensorData = async (apiKey) => {
//     try {
//       const temperatureResponse = await axios.get(`https://blynk.cloud/external/api/get?token=${apiKey}&V0`);
//       const humidityResponse = await axios.get(`https://blynk.cloud/external/api/get?token=${apiKey}&V1`);
//       setTemperature(temperatureResponse.data);
//       setHumidity(humidityResponse.data);
//       setSensorDataLoaded(true);
//     } catch (error) {
//       console.error('Error fetching sensor data:', error);
//       setSensorDataLoaded(true);
//     }
//   };

//   useEffect(() => {
//     let interval;
//     if (blynkApiKey) {
//       fetchSensorData(blynkApiKey);
//       interval = setInterval(() => fetchSensorData(blynkApiKey), 8000);
//     }

//     return () => {
//       if (interval) clearInterval(interval);
//     };
//   }, [blynkApiKey]);

//   async function aiRun() {
//     if (!sensorDataLoaded) {
//       toast.error('Sensor data is still loading. Please wait.');
//       return;
//     }
//     setLoading(true);
//     const model = genAI.getGenerativeModel({
//       model: "gemini-1.5-pro-exp-0827",
//       systemInstruction: `Even with less context, answer the best you can`,
//     });
//     const result = await model.generateContent([textPrompt, imageInlineData]);
//     const response = await result.response;
//     const text = response.text();
//     setLoading(false);
//     setMessages((prevMessages) => [
//       ...prevMessages,
//       { user: true, text: textPrompt, image: imagePreview },
//       { user: false, text: sanitizeText(text) },
//     ]);
//   }

//   async function greetUser() {
//     if (!sensorDataLoaded) {
//       return; // Don't greet until sensor data is loaded
//     }
//     const model = genAI.getGenerativeModel({
//       model: "gemini-1.5-pro-exp-0827",
//       systemInstruction: "Even with less context, answer the best you can",
//     });
//     const result = await model.generateContent(`Introduce yourself as AI-Ponics concisely.`);
//     const response = await result.response;
//     const text = response.text();
//     setMessages([{ user: false, text: sanitizeText(text) }]);
//   }

//   useEffect(() => {
//     if (sensorDataLoaded) {
//       greetUser();
//     }
//   }, [plantName, daysSincePlanting, sensorDataLoaded]);

//   // Replacing asterisks from the output of AI
//   const sanitizeText = (text) => {
//     return text
//       .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
//       .replace(/\*/g, '<br />');
//   };

//   // Error when sending a prompt with cleared fields
//   const sendMessage = () => {
//     if (textPrompt || imageInlineData) {
//       aiRun();
//       setTextPrompt('');
//       setImagePreview(null);
//       setImage('');
//       setImageInlineData('');
//     } else {
//       toast.error('Please provide at least an image or text prompt.');
//     }
//   };

//   // It extracts the first selected file, converts it to Base64 format,
//   const handleFileChange = async (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       const base64 = await getBase64(file);
//       setImage(base64);

//       const imageData = await fileToGenerativePart(file);
//       setImageInlineData(imageData);
//       setImagePreview(URL.createObjectURL(file));
//     }
//   };

//   // Converts a file (blob) into a format that can be passed to the generative AI model
//   async function fileToGenerativePart(blob) {
//     const base64EncodedDataPromise = new Promise((resolve) => {
//       const reader = new FileReader();
//       reader.onloadend = () => resolve(reader.result.split(',')[1]);
//       reader.readAsDataURL(blob);
//     });

//     return {
//       inlineData: { data: await base64EncodedDataPromise, mimeType: blob.type },
//     };
//   }

//   const handleChange = (e) => {
//     setTextPrompt(e.target.value);
//   };

//   const goBack = () => {
//     navigate(-1);
//   };

//   const openCamera = () => {
//     setIsCameraOpen(true);
//   };

//   const switchCamera = () => {
//     const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
//     setCurrentFacingMode(newFacingMode);
//   };

//   const capturePhoto = () => {
//     if (webcamRef) {
//       const imageSrc = webcamRef.getScreenshot();
//       setImagePreview(imageSrc);
//       setIsCameraOpen(false);

//       // Encode image data for AI processing
//       setImageInlineData({
//         inlineData: { data: imageSrc.split(',')[1], mimeType: 'image/png' },
//       });
//     }
//   };

//   const exitCamera = () => {
//     setIsCameraOpen(false);
//   };

//   return (
//     <div className="App-Chat">
//       <div className="chat-container">
//         <ToastContainer />
//         <div className="header">
//           <h2>Ask AI-Ponics!</h2>
//           <button className="back-button" onClick={goBack}>
//             <FontAwesomeIcon icon={faArrowLeft} />
//             Back
//           </button>
//         </div>
//         <div className="messages-container">
//           {messages.map((msg, index) => (
//             <div key={index} className={`message-container ${msg.user ? "user" : "ai"}`}>
//               <div
//                 className={`message ${msg.user ? "user" : "ai"}`}
//                 dangerouslySetInnerHTML={{ __html: msg.text }}
//               />
//               {msg.image && <img src={msg.image} alt="user-uploaded" className="uploaded-image" />}
//             </div>
//           ))}
//         </div>
//         <div className="input-container">
//           <input
//             className="message-input"
//             placeholder="Type a message"
//             onChange={handleChange}
//             value={textPrompt}
//             onKeyDown={(e) => e.key === "Enter" && sendMessage()}
//           />
//         </div>
//         <div className="input-button-container">
//           <input
//             type="file"
//             id="file-upload"
//             style={{ display: 'none' }}
//             accept="image/*"
//             onChange={handleFileChange}
//           />
//           <button
//             className="upload-button"
//             onClick={() => document.getElementById('file-upload').click()}
//             disabled={loading}
//           >
//             <FontAwesomeIcon icon={faImage} />
//           </button>
//           <button
//             className={`camera-button ${imagePreview ? 'disabled' : ''}`}
//             onClick={openCamera}
//             disabled={imagePreview || loading}
//           >
//             <FontAwesomeIcon icon={faCamera} />
//           </button>
//           <button className="send-button" onClick={sendMessage} disabled={loading}>
//             {loading ? <div className="loading-spinner"></div> : <FontAwesomeIcon icon={faSearch} />}
//           </button>
//         </div>

//         {isCameraOpen && (
//           <div className="camera-container">
//             <Webcam
//               audio={false}
//               ref={(node) => setWebcamRef(node)}
//               screenshotFormat="image/png"
//               width="100%"
//               videoConstraints={{ facingMode: currentFacingMode }}
//               className="video-feed"
//             />
//             <div className="camera-controls">
//               <button className="exit-button" onClick={exitCamera}>
//                 <FontAwesomeIcon icon={faTimes} />
//               </button>
//               <button className="camera-toggle-button" onClick={switchCamera}>
//                 <FontAwesomeIcon icon={faSyncAlt} />
//               </button>
//               <button className="capture-button" onClick={capturePhoto}>
//                 <FontAwesomeIcon icon={faCamera} />
//               </button>
//             </div>
//           </div>
//         )}

//         {imagePreview && (
//           <div className="image-preview-container">
//             <img src={imagePreview} alt="preview" className="image-preview" />
//             <button className="remove-image-button" onClick={() => setImagePreview(null)}>
//               Remove
//             </button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default AiwithImage2;