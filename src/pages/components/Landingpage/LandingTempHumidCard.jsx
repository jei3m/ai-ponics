import React from 'react';
import { Card, Flex, Typography } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faThermometerHalf, faTint } from '@fortawesome/free-solid-svg-icons';
import Gauge from '../Sensors/Gauge';
import { StatusMessage } from "../../../services/sensorService";
import '../Sensors/css/TempHumid.css'; 

function LandingTempHumidCard({ temperature, humidity, status }) {

    const MIN_TEMPERATURE = 10;
    const MAX_TEMPERATURE = 30;
    const MIN_HUMIDITY = 40;
    const MAX_HUMIDITY = 60;

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

export default LandingTempHumidCard;