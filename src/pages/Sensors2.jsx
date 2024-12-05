import React, { useState, useMemo } from "react";
import { Typography, Card, Button, Flex, Input, DatePicker } from "antd";
import Header from "../components/Header";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./css/Sensors.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useSensorsLogic, MAX_TEMPERATURE, MIN_TEMPERATURE } from "../services/sensorService";
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { faThermometerHalf, faTint, faExclamationTriangle, faLeaf } from "@fortawesome/free-solid-svg-icons";
import Gauge from "../components/Gauge";

dayjs.extend(customParseFormat);

function Sensors2() {
  const {
    temperature,
    humidity,
    plantingDate,
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
    isDeviceOnline,
  } = useSensorsLogic();

  const [isPlantInfoChanged, setIsPlantInfoChanged] = useState(false);
  const [isBlynkApiKeyChanged, setIsBlynkApiKeyChanged] = useState(false);

  const daysSincePlanting = useMemo(() => {
    if (!plantingDate) return 0;
    const plantingDay = dayjs(plantingDate, 'DD/MM/YYYY');
    return dayjs().diff(plantingDay, 'day');
  }, [plantingDate]);

  const handlePlantingDateChange = (date) => {
    setPlantingDate(date);
    setIsPlantInfoChanged(true);
  };

  const handlePlantNameChange = (event) => {
    setPlantName(event.target.value);
    setIsPlantInfoChanged(true);
  };

  const handleSave = (field) => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      let dataToUpdate = {};
      if (field === "plantInfo") {
        dataToUpdate = {
          plantName,
          plantingDate: plantingDate ? plantingDate.format('DD/MM/YYYY') : null,
          daysSincePlanting,
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

  const disabledDate = (current) => {
    return current && current > dayjs().endOf('day');
  };

  const datePickerConfig = {
    format: "DD/MM/YYYY",
    disabledDate: disabledDate,
    placeholder: "Select planting date",
    style: { width: '100%', marginBottom: 8 },
    onChange: handlePlantingDateChange,
    allowClear: true,
    showToday: true,
  };

  const statusConfig = [
    {
      when: !selectedApiKey,
      message: 'Please Add API Token',
      className: 'loading-text'
    },
    {
      when: !isApiKeyValid,
      message: 'Invalid API Token',
      className: 'error-text'
    },
    {
      when: !isDeviceOnline,
      message: 'Device Offline',
      style: { textAlign: 'center', color: '#ff4d4f' }
    }
  ];

  return (
    <div style={{ width: '100%', overflowX: 'hidden' }}>
      
      <div>
        <Header />
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        padding: '0.4rem',
        margin: '0 auto',
      }}>

        <div
          style={{
            maxWidth: '100vw',
            borderRadius: '14px',
            height: 'fit-content',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column',
            padding: '1.8rem'
          }}>
            
          <Flex gap="middle" style={{ 
            width: '100%', 
            height: 'fit-content', 
            marginTop: '-14px' 
            }}>

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
                }}>

                <div className="gauge-container">
                  {statusConfig.find(status => status.when) && (
                    <Typography.Text 
                      strong 
                      className={statusConfig.find(status => status.when)?.className}
                      style={statusConfig.find(status => status.when)?.style}
                    >
                      {statusConfig.find(status => status.when)?.message}
                    </Typography.Text>
                  )}
                  {!(statusConfig.find(status => status.when)) && temperature !== null && (
                    <Gauge value={temperature} max={60} label="°C" />
                  )}
                  {!(statusConfig.find(status => status.when)) && temperature === null && (
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
                  {statusConfig.find(status => status.when) && (
                    <Typography.Text 
                      strong 
                      className={statusConfig.find(status => status.when)?.className}
                      style={statusConfig.find(status => status.when)?.style}
                    >
                      {statusConfig.find(status => status.when)?.message}
                    </Typography.Text>
                  )}
                  {!(statusConfig.find(status => status.when)) && humidity !== null && (
                    <Gauge value={humidity} max={100} label="%" />
                  )}
                  {!(statusConfig.find(status => status.when)) && humidity === null && (
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
            {statusConfig.find(status => status.when) && (
              <Typography.Text 
                strong 
                className={statusConfig.find(status => status.when)?.className}
                style={statusConfig.find(status => status.when)?.style}
              >
                {statusConfig.find(status => status.when)?.message}
              </Typography.Text>
            )}
            {!(statusConfig.find(status => status.when)) && isLoading && (
              <Typography.Text strong className="loading-text">
                Loading.Config
              </Typography.Text>
            )}
            {!(statusConfig.find(status => status.when)) && !isLoading && temperature > MAX_TEMPERATURE && (
              <div>
                <Typography.Text strong className="temperature-alert-icon">
                  🔥 <br />
                </Typography.Text>
                <Typography.Text strong>
                  Too Hot
                </Typography.Text>
              </div>
            )}
            {!(statusConfig.find(status => status.when)) && !isLoading && temperature >= MIN_TEMPERATURE && temperature <= MAX_TEMPERATURE && (
              <div>
                <Typography.Text strong className="temperature-alert-icon">
                  ✅ <br />
                </Typography.Text>
                <Typography.Text strong className="temperature-alert-text">
                  Normal
                </Typography.Text>
              </div>
            )}
            {!(statusConfig.find(status => status.when)) && !isLoading && temperature < MIN_TEMPERATURE && (
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
            {statusConfig.find(status => status.when) && (
              <Typography.Text 
                strong 
                className={statusConfig.find(status => status.when)?.className}
                style={statusConfig.find(status => status.when)?.style}
              >
                {statusConfig.find(status => status.when)?.message}
              </Typography.Text>
            )}
            {!(statusConfig.find(status => status.when)) && isLoading && (
              <Typography.Text strong className="loading-text">
                Loading...
              </Typography.Text>
            )}
            {!(statusConfig.find(status => status.when)) && !isLoading && (
              <div>
                <div style={{ width: '100%' }}>
                  <Input
                    type="text"
                    id="plantName"
                    name="plantName"
                    value={plantName}
                    onChange={handlePlantNameChange}
                    placeholder="Enter plant name"
                    style={{ width: '100%', marginBottom: 16 }}
                  />
                  <DatePicker
                    {...datePickerConfig}
                    id="plantingDate"
                    name="plantingDate"
                    onFocus={e => e.target.blur()}
                    value={plantingDate ? dayjs(plantingDate, 'DD/MM/YYYY') : null}
                  />
                </div>
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ textAlign: 'left' }}>
                    {plantingDate && (
                      <Typography.Text strong style={{ fontWeight: 540, fontFamily: 'Inter, sans-serif', marginTop: '-10px', textAlign: 'left', marginLeft:'1px' }}>
                        Days planted: {daysSincePlanting}
                      </Typography.Text>
                    )}
                  </div>
                  {isPlantInfoChanged && (
                    <Button
                      type="primary"
                      style={{ fontSize: '14px', marginBottom: '-10px' }}
                      onClick={() => handleSave('plantInfo')}
                    >
                      Save
                    </Button>
                  )}
                </div>

              </div>
            )}
          </Card>

        </div>

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