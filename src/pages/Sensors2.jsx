// Sensors2.jsx
import React, { useState } from "react";
import { Typography, Card, Button, Flex, Input } from "antd";
import { Gauge } from "../components/Gauge";
import Header from "../components/Header";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./css/Sensors.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationTriangle, faThermometerHalf, faTint, faLeaf } from "@fortawesome/free-solid-svg-icons";
import { useSensorsLogic } from "../services/sensorService";
import { format } from "date-fns"; // Import format from date-fns

function Sensors2() {
  const {
    temperature,
    humidity,
    plantingDate,
    daysSincePlanting,
    plantName,
    isLoading,
    isApiKeyValid,
    selectedApiKey,
    auth, 
    setDoc,
    doc, 
    db,
    setPlantingDate,
    setPlantName,
  } = useSensorsLogic();

  const [isPlantInfoChanged, setIsPlantInfoChanged] = useState(false);
  const [isBlynkApiKeyChanged, setIsBlynkApiKeyChanged] = useState(false);

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
      <div style={{ backgroundColor: '#d1e9d3' }}>
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
            minHeight: '100dvh',
            height: 'fit-content',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column',
            backgroundColor: '#d1e9d3',
            padding: '4rem'
          }}
        >
          <Flex gap="middle" horizontal style={{ width: '100%', height: 'fit-content', marginTop: '-14px' }}>
            <div style={{ width: '94vw', maxWidth: '600px', display: 'flex', flexDirection: 'row', marginTop: '-20px', borderRadius: '10px', justifyContent: 'center', border: '1px solid #ddd', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)', marginBottom: '10px' }}>
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
                  borderBottomRightRadius: '0',
                  borderTopRightRadius: '0',
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
                  borderBottomLeftRadius: '0',
                  borderTopLeftRadius: '0',
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
              <div style={{ fontSize: '16px', textAlign: 'center' }}>
                <FontAwesomeIcon icon={faExclamationTriangle} /> Temperature Alert
              </div>
            }
            style={{
              width: '100%',
              height: 230,
              background: 'white',
              border: '1px solid #ddd',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              marginBottom: '10px'
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
                  🔥 <br />
                </Typography.Text>
                <Typography.Text>
                  Too Hot
                </Typography.Text>
              </div>
            ) : temperature >= 15 && temperature <= 73 ? (
              <div>
                <Typography.Text strong className="temperature-alert-icon">
                  ✅ <br />
                </Typography.Text>
                <Typography.Text strong className="temperature-alert-text">
                  Normal
                </Typography.Text>
              </div>
            ) : (
              <div>
                <Typography.Text strong className="temperature-alert-icon">
                  ❄️ <br />
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
              marginBottom: '10px'
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
                <div style={{ width: '100%' }}>
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
                    max={format(new Date(), "yyyy-MM-dd")} // Use format from date-fns
                  />
                </div>
                {plantingDate && (
                  <div style={{ textAlign: 'left', marginLeft: '3px' }}>
                    <Typography.Text strong style={{ fontWeight: 540, fontFamily: 'Inter, sans-serif', marginTop: '-10px', textAlign: 'left', }}>
                      Days planted: {daysSincePlanting}
                    </Typography.Text>
                  </div>
                )}
                {isPlantInfoChanged && (
                  <Button
                    type="primary"
                    style={{ float: 'left', fontSize: '14px' }}
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