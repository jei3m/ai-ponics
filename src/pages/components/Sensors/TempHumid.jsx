import React from 'react';
import { Card, Flex, Typography } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faThermometerHalf, faTint } from '@fortawesome/free-solid-svg-icons';
import Gauge from './Gauge';
import { StatusMessage } from "../../../services/sensorService";
import './css/TempHumid.css'; 

function TempHumidCard({ temperature, humidity, status, thresholds }) {

  if (!thresholds) {
    return (
      <Flex gap="middle" className='flex-container'>
      <div className='temphumid-cards-container'>
        {/* Temperature Card */}
        <Card
          title={
            <div style={{ fontSize: '16px' }}>
              <FontAwesomeIcon icon={faThermometerHalf} style={{ marginRight: 10 }} />
              Temperature
            </div>
          }
          className='temp-card'
          variant='borderless'
        >
          <div className="gauge-container">
            <StatusMessage message="Loading..." className="loading-text" />
          </div>
        </Card>
  
        {/* Humidity Card */}
        <Card
          title={
            <div style={{ fontSize: '16px' }}>
              <FontAwesomeIcon icon={faTint} style={{ marginRight: 10 }} />
              Humidity
            </div>
          }
          className='humid-card'
          variant='borderless'
        >
          <div className="gauge-container">
            <StatusMessage message="Loading..." className="loading-text" />
          </div>
        </Card>
      </div>
      </Flex>
    );
  }

  const { MIN_TEMPERATURE, MAX_TEMPERATURE, MIN_HUMIDITY, MAX_HUMIDITY } = thresholds;

  return (
    <Flex gap="middle" className='flex-container'>
      <div className='temphumid-cards-container'>
        {/* Temperature Card */}
        <Card
          title={
            <div style={{ fontSize: '16px' }}>
              <FontAwesomeIcon icon={faThermometerHalf} style={{ marginRight: 10 }} />
              Temperature
            </div>
          }
          variant='borderless'
          className='temp-card'
        >
          <div className="gauge-container">
            {status && (
              <StatusMessage message={status.message} className={status.className} style={status.style} />
            )}
            {!status && temperature !== null && (
              <div>
                <Gauge value={temperature} max={MAX_TEMPERATURE} min={MIN_TEMPERATURE} label="°C" />
                <div>
                  <Typography.Text strong className="temphumid-status">
                    {temperature >= MIN_TEMPERATURE && temperature <= MAX_TEMPERATURE
                      ? 'Normal'
                      : temperature < MIN_TEMPERATURE
                      ? 'Too Low'
                      : temperature >= MAX_TEMPERATURE
                      ? 'Too High'
                      : ''}
                  </Typography.Text>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Humidity Card */}
        <Card
          title={
            <div style={{ fontSize: '16px' }}>
              <FontAwesomeIcon icon={faTint} style={{ marginRight: 10 }} />
              Humidity
            </div>
          }
          variant='borderless'
          className='humid-card'
        >
          <div className="gauge-container">
            {status && (
              <StatusMessage message={status.message} className={status.className} style={status.style} />
            )}
            {!status && humidity !== null && (
              <div>
                <Gauge value={humidity} max={MAX_HUMIDITY} min={MIN_HUMIDITY} label="%" />
                <div>
                  <Typography.Text strong className="temphumid-status">
                    {humidity >= MIN_HUMIDITY && humidity <= MAX_HUMIDITY
                      ? 'Normal'
                      : humidity < MIN_HUMIDITY
                      ? 'Too Low'
                      : humidity > MAX_HUMIDITY
                      ? 'Too High'
                      : ''}
                  </Typography.Text>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </Flex>
  );
}

export default TempHumidCard;