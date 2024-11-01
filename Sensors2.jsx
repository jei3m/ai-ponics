import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Typography,
  Card,
  Button,
  Flex,
  Input,
} from "antd";
import { differenceInDays, format } from "date-fns";
import emailjs from "emailjs-com";
import { Gauge } from "../components/Gauge";
import Header from "../components/Header";
import { db, auth } from "../firebase"; // Import Firebase
import { doc, setDoc, getDoc } from "firebase/firestore"; // Firestore methods
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./css/Sensors.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faExclamationTriangle,
  faThermometerHalf,
  faTint,
  faLeaf,
} from "@fortawesome/free-solid-svg-icons";
import { useApiKey } from "../context/ApiKeyContext";
import { Resend } from 'resend';


function Sensors2() {
  const [temperature, setTemperature] = useState(null);
  const [humidity, setHumidity] = useState(null);
  const [plantingDate, setPlantingDate] = useState("");
  const [daysSincePlanting, setDaysSincePlanting] = useState(0);
  const [temperatureAlert, setTemperatureAlert] = useState("");
  const [plantName, setPlantName] = useState("");
  const [user, setUser] = useState(null);
  // const [isDataChanged, setIsDataChanged] = useState(false);
  // const [showBlynkApiKey, setShowBlynkApiKey] = useState(false);
  const [isPlantInfoChanged, setIsPlantInfoChanged] = useState(false);
  const [isBlynkApiKeyChanged, setIsBlynkApiKeyChanged] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isApiKeyValid, setIsApiKeyValid] = useState(true);
  const [toastShown, setToastShown] = useState(false);
  const { selectedApiKey } = useApiKey();

  useEffect(() => {
    if (!selectedApiKey) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setIsApiKeyValid(true);

    const fetchSensorData = async () => {
      try {
        const temperatureResponse = await axios.get(
          `https://blynk.cloud/external/api/get?token=${selectedApiKey}&V0`,
        );
        const humidityResponse = await axios.get(
          `https://blynk.cloud/external/api/get?token=${selectedApiKey}&V1`,
        );
        setTemperature(temperatureResponse.data);
        setHumidity(humidityResponse.data);

        if (temperatureResponse.data > 60) {
          setTemperatureAlert("Temperature too high!");
          sendEmailHot(temperatureResponse.data);
        } else if (temperatureResponse.data < 15) {
          setTemperatureAlert("Temperature too low!");
          sendEmailCold(temperatureResponse.data);
        } else {
          setTemperatureAlert("");
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching data from Blynk:", error);
        setIsApiKeyValid(false);
        setTemperature(null);
        setHumidity(null);
        setTemperatureAlert("Error fetching data");
        if (!toastShown) {
          toast.error(
            "Error fetching data. Please check your API token and try again.",
            {
              position: "top-center",
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              onClose: () => setToastShown(false),
            },
          );
          setToastShown(true);
        }
        setIsLoading(false);
      }
    };

    fetchSensorData();
    const interval = setInterval(fetchSensorData, 5000);

    return () => clearInterval(interval);
  }, [selectedApiKey, toastShown]); // Add selectedApiKey to the dependency array

  useEffect(() => {
    const fetchUserData = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        setUser(currentUser); // Set user state
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.plantingDate) {
            setPlantingDate(data.plantingDate);
          }
          if (data.plantName) {
            setPlantName(data.plantName);
          }
        } else {
          console.log("No such document!");
        }
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    if (plantingDate) {
      const selectedDate = new Date(plantingDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const days = differenceInDays(today, selectedDate);
      setDaysSincePlanting(days >= 0 ? days : 0);

      // Save planting date and days since planting to Firestore when it changes
      const currentUser = auth.currentUser;
      if (currentUser) {
        setDoc(
          doc(db, "users", currentUser.uid),
          {
            plantingDate: plantingDate,
            daysSincePlanting: days >= 0 ? days : 0,
          },
          { merge: true },
        );
      }
    }
  }, [plantingDate]);

  const handlePlantingDateChange = (event) => {
    setPlantingDate(event.target.value);
    setIsPlantInfoChanged(true);
  };

  const handlePlantNameChange = (event) => {
    setPlantName(event.target.value);
    setIsPlantInfoChanged(true);

    const currentUser = auth.currentUser;
    if (currentUser) {
      setDoc(
        doc(db, "users", currentUser.uid),
        {
          plantName: event.target.value,
        },
        { merge: true },
      );
    }
  };

  const resend = new Resend(process.env.REACT_APP_RESEND_API_KEY);


  // Function to send email if the temperature is too hot
  const sendEmailHot = async (temperature) => {
    const lastEmailTimestamp = localStorage.getItem("lastEmailTimestamp");
    const now = new Date().getTime();
  
    if (!lastEmailTimestamp || now - lastEmailTimestamp > 10 * 60 * 1000) {
      if (user) {
        const emailData = {
          to: user.email,
          from: "Acme <onboarding@resend.dev>", // Corrected format
          subject: "Temperature Alert - Too Hot!",
          text: `Temperature is too high! ${temperature}°C`,
        };
  
        try {
          const response = await fetch('/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.REACT_APP_RESEND_API_KEY}`
            },
            body: JSON.stringify(emailData)
          });
  
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Network response was not ok: ${response.status} - ${errorData.message}`);
          }
  
          const data = await response.json();
          console.log("Email successfully sent!", data);
          localStorage.setItem("lastEmailTimestamp", now);
        } catch (err) {
          console.error("Failed to send email:", err);
        }
      }
    } else {
      console.log("Email not sent: 10 minutes have not passed yet.");
    }
  };

   // Function to send email if the temperature is too cold
  const sendEmailCold = (temperature) => {
    const lastEmailTimestamp = localStorage.getItem("lastEmailTimestamp");
    const now = new Date().getTime();

    if (!lastEmailTimestamp || now - lastEmailTimestamp > 10 * 60 * 1000) {
      if (user) {
        const templateParams = {
          to_name: user.displayName || "User",
          message: `Temperature is too cold! ${temperature}°C`,
          user_email: user.email,
        };

        emailjs
          .send(
            process.env.REACT_APP_EMAILJS_SERVICE_ID,
            process.env.REACT_APP_EMAILJS_TEMPLATE_ID,
            templateParams,
            process.env.REACT_APP_EMAILJS_USER_ID,
          )
          .then(
            (response) => {
              console.log(
                "Email successfully sent!",
                response.status,
                response.text,
              );
              localStorage.setItem("lastEmailTimestamp", now);
            },
            (err) => {
              console.error("Failed to send email:", err);
            },
          );
      }
    } else {
      console.log("Email not sent: 10 minutes have not passed yet.");
    }
  };

  const handleSave = (field) => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      let dataToUpdate = {};
      if (field === "plantInfo") {
        dataToUpdate = {
          plantName,
          plantingDate,
          daysSincePlanting, // Add this line to include daysSincePlanting
        };
        setIsPlantInfoChanged(false);
      } else if (field === "blynkApiKey") {
        dataToUpdate = { selectedApiKey };
        setIsBlynkApiKeyChanged(false);
      }

      setDoc(doc(db, "users", currentUser.uid), dataToUpdate, { merge: true })
        .then(() => {
          window.location.reload();
        })
        .catch((error) => {
          console.error("Error saving data: ", error);
        });
    }
  };

  return (
    <div style={{ width: '100%', overflowX: 'hidden', backgroundColor: '#d1e9d3' }}>
      <div style={{backgroundColor: '#d1e9d3'}}>
        <Header />
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          padding: '0.5rem',
        }}>
          <Card               
            bordered={false}
            style={{
              width: '100vw', 
              borderRadius: '14px', 
              minHeight:'100dvh',
              height: 'fit-content',
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              flexDirection: 'column',
              backgroundColor: '#d1e9d3',
              padding:'4rem'
            }}
          >
            <Flex gap="middle" horizontal style={{ width: '100%', height: 'fit-content', marginTop:'-14px'}}>
              <div style={{width:'94vw', maxWidth:'600px',  display: 'flex', flexDirection: 'row', marginTop:'-20px', borderRadius:'10px', justifyContent:'center',                       border: '1px solid #ddd',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                        marginBottom:'10px'}}>
              <Card
                title={
                  <div style={{ fontSize: '16px' }}>
                    <FontAwesomeIcon icon={faThermometerHalf} style={{ marginRight: 10 }} />
                  Temperature
                  </div>
                }
                bordered={false}
                style={{
                  minWidth: '50%',
                  height: 230,
                  background: 'white',
                  borderBottomRightRadius:'0',
                  borderTopRightRadius:'0',
                }}
              >
                <div className="gauge-container">
                  {!selectedApiKey ? (
                    <Typography.Text strong className="loading-text">
                      Please Add API Token
                    </Typography.Text>
                  ) : !isApiKeyValid ? (
                    <Typography.Text strong className="error-text">
                      Invalid API Token
                    </Typography.Text>
                  ) : temperature !== null ? (
                    <Gauge value={temperature} max={60} label="°C" />
                  ) : (
                    <Typography.Text strong className="loading-text">
                      Loading...
                    </Typography.Text>
                  )}
                </div>
              </Card>

              <Card
                title={
                  <div style={{ fontSize: '16px' }}>
                    <FontAwesomeIcon icon={faTint} style={{ marginRight: 10 }} />
                    Humidity
                  </div>
                }
                bordered={false}
                style={{
                  minWidth: '50%',
                  height: 230,
                  overflowY: 'hidden',
                  borderBottomLeftRadius:'0',
                  borderTopLeftRadius:'0',
                }}
              >
                <div className="gauge-container">
                  {!selectedApiKey ? (
                    <Typography.Text strong className="loading-text">
                    Please Add API Token
                    </Typography.Text>
                  ) : !isApiKeyValid ? (
                    <Typography.Text strong className="error-text">
                      Invalid API Token
                    </Typography.Text>
                  ) : temperature !== null ? (
                    <Gauge value={humidity} max={100} label="%" />
                  ) : (
                    <Typography.Text strong className="loading-text">
                      Loading...
                    </Typography.Text>
                  )}
                </div>
              </Card>
              </div>
            </Flex>
            <Card 
               title={
                 <div style={{fontSize: '16px', textAlign: 'center' }}>
                   <FontAwesomeIcon icon={faExclamationTriangle}/> Temperature Alert
                 </div>
                    }
                    style={{
                      width: '100%',
                      height: 230,
                      background: 'white',
                      border: '1px solid #ddd',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                      marginBottom:'10px'
                    }}>
              {!selectedApiKey ? (
                <Typography.Text strong className="loading-text">
                  Please Add API Token
                </Typography.Text>
              ) : isLoading ? (
                <Typography.Text strong className="loading-text">
                  Loading...
                </Typography.Text>
              ) : !isApiKeyValid ? (
                <Typography.Text strong className="error-text">
                  Invalid API Token
                </Typography.Text>
              ) : temperature > 73 ? (
                <div>
                  <Typography.Text strong className="temperature-alert-icon">
                    🔥 <br/>
                  </Typography.Text>
                  <Typography.Text>
                    Too Hot
                  </Typography.Text>
                </div>
              ) : temperature >= 15 && temperature <= 73 ? (
                <div>
                  <Typography.Text strong className="temperature-alert-icon">
                    ✅ <br/>
                  </Typography.Text>
                  <Typography.Text strong className="temperature-alert-text">
                    Normal
                  </Typography.Text>
                </div>
              ) : (
                <div>
                  <Typography.Text strong className="temperature-alert-icon">
                    ❄️ <br/>
                  </Typography.Text>
                  <Typography.Text strong className="temperature-alert-text">
                    Too Cold
                  </Typography.Text>
                </div>
              )}
            </Card>
            <Card
              title={
                <div style={{ fontSize: '16px' }}>
                  <FontAwesomeIcon icon={faLeaf} style={{ marginRight: 10 }} />
                  Plant Information
                </div>
              }
              bordered={false}
              style={{
                width: '100%',
                height: 230,
                background: 'white',
                
                border: '1px solid #ddd',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                marginBottom:'10px'
              }}
            >
              {!selectedApiKey ? (
                <Typography.Text strong style={{ textAlign: 'center' }} className="loading-text">
                  Please Add API Token
                </Typography.Text>
              ) : !isApiKeyValid ? (
                <Typography.Text strong style={{ textAlign: 'center' }}>
                  Invalid API Token
                </Typography.Text>
              ) : (
                <>
                  <div style={{ width: '100%'}}> 
                    <Input
                      type="text"
                      value={plantName}
                      onChange={handlePlantNameChange}
                      placeholder="Enter plant name"
                      style={{ width: '100%', marginBottom: 16 }}
                    />
                    <Input
                      type="date"
                      value={plantingDate}
                      onChange={handlePlantingDateChange}
                      style={{ width: '100%', marginBottom: 8 }}
                      max={format(new Date(), "yyyy-MM-dd")}
                    />
                  </div>
                  {plantingDate && (
                    <div style={{textAlign:'left', marginLeft:'3px'}}>
                      <Typography.Text strong style={{ fontWeight: 540, fontFamily: 'Inter, sans-serif', marginTop: '-10px', textAlign:'left', }}>
                        Days planted: {daysSincePlanting}
                      </Typography.Text>
                    </div>
                  )}
                  {isPlantInfoChanged && (
                    <Button
                      type="primary"
                      style={{float:'left', fontSize:'14px'}}
                      onClick={() => handleSave('plantInfo')}
                    >
                      Save
                    </Button>
                  )}
                </>
              )}
            </Card>
          </Card>
          <div className="ask-aiponics-container">
            <a href="/chat" className="ask-aiponics-button">
              <img
                src="/img/aiponicsbot.png"
                alt="AI-Ponics Bot"
                className="profile-pic"
              />
            </a>
          </div>
          <ToastContainer />
      </div>
    </div>
  );
}

export default Sensors2;