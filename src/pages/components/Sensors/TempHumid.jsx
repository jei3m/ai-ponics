import React from 'react';
import { Card, Flex } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faThermometerHalf, faTint } from '@fortawesome/free-solid-svg-icons';
import Gauge from './Gauge';
import { StatusMessage } from "../../../services/sensorService";
import './css/TempHumid.css'

function TempHumidCard({ temperature, humidity, status }) {
  return (
    <Flex gap="middle" className='flex-container'>

      <div className='temphumid-cards-container'>
        
        <Card
          title={
            <div style={{ fontSize: '16px' }}>
              <FontAwesomeIcon icon={faThermometerHalf} style={{ marginRight: 10 }} />
              Temperature
            </div>
          }
          bordered={false}
          className='temp-card'
          >

          <div className="gauge-container">
            {status && (
              <StatusMessage message={status.message} className={status.className} style={status.style} />
            )}
            {!status && temperature !== null && (
              <Gauge value={temperature} max={100} label="°C" />
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
          className='humid-card'
        >
          <div className="gauge-container">
            {status && (
              <StatusMessage message={status.message} className={status.className} style={status.style} />
            )}
            {!status && humidity !== null && (
              <Gauge value={humidity} max={100} label="%" />
            )}
          </div>
        </Card>
        
      </div>
        
    </Flex>
  );
}

export default TempHumidCard;