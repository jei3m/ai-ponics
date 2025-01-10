import React from 'react';
import { Card, Typography } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import {MIN_TEMPERATURE, MAX_TEMPERATURE, StatusMessage} from '../../../services/sensorService';

function TempStatus({ temperature, status }) {
  return (
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
        marginBottom: '10px',
      }}
    >
      {status && (
        <StatusMessage message={status.message} className={status.className} style={status.style} />
      )}
      {!status && temperature > MAX_TEMPERATURE && (
        <div style={{ textAlign: 'center' }}>
          <Typography.Text strong className="temperature-alert-icon">
            🔥 <br />
          </Typography.Text>
          <Typography.Text strong>Too Hot</Typography.Text>
        </div>
      )}
      {!status && temperature >= MIN_TEMPERATURE && temperature <= MAX_TEMPERATURE && (
        <div style={{ textAlign: 'center' }}>
          <Typography.Text strong className="temperature-alert-icon">
            ✅ <br />
          </Typography.Text>
          <Typography.Text strong className="temperature-alert-text">
            Normal
          </Typography.Text>
        </div>
      )}
      {!status && temperature < MIN_TEMPERATURE && (
        <div style={{ textAlign: 'center' }}>
          <Typography.Text strong className="temperature-alert-icon">
            ❄️ <br />
          </Typography.Text>
          <Typography.Text strong className="temperature-alert-text">
            Too Cold
          </Typography.Text>
        </div>
      )}
    </Card>
  );
}

export default TempStatus;