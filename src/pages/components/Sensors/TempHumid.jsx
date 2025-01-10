import React from 'react';
import { Card, Flex } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faThermometerHalf, faTint } from '@fortawesome/free-solid-svg-icons';
import Gauge from './Gauge';
import { StatusMessage } from "../../../services/sensorService";


function TempHumidCard({ temperature, humidity, status }) {
  return (
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
            style={{
              minWidth: '50%',
              height: 230,
              overflowY: 'hidden',
              borderBottomLeftRadius: '0',
              borderTopLeftRadius: '0',
            }}
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