import React from 'react';
import { Card, Typography } from 'antd';
import Gauge from './Gauge';
import { StatusMessage, getPlantThresholds } from '../../../services/sensorService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFlask } from '@fortawesome/free-solid-svg-icons';
import './css/TempStatus.css';

function PHLevel({ pHlevel, status, thresholds }) {

  if (!thresholds) {
    return (
      <Card
        title={
          <div style={{ fontSize: '16px', textAlign: 'center' }}>
            <FontAwesomeIcon icon={faFlask} style={{ marginRight: 2 }} /> pH Level
          </div>
        }
        className='pH-level-card'
      >
        <StatusMessage message="Loading..." className="loading-text" />
      </Card>
    );
  }

  const { MIN_PH_LEVEL, MAX_PH_LEVEL } = thresholds;

  return (
    <Card
      title={
        <div style={{ fontSize: '16px', textAlign: 'center' }}>
          <FontAwesomeIcon icon={faFlask} style={{ marginRight: 2 }} /> pH Level
        </div>
      }
      className='pH-level-card'
    >
      {status && (
        <StatusMessage message={status.message} className={status.className} style={status.style} />
      )}

      {!status && (
        <div style={{ textAlign: 'center' }}>
          {!status && pHlevel !== null && (
            <Gauge value={pHlevel} max={MAX_PH_LEVEL} min={MIN_PH_LEVEL} label="" />
          )}
          <div>
            <Typography.Text strong className="temperature-alert-text">
              {pHlevel >= MIN_PH_LEVEL && pHlevel <= MAX_PH_LEVEL
                ? 'Normal'
                : pHlevel < MIN_PH_LEVEL
                ? 'Too Low'
                : pHlevel > MAX_PH_LEVEL
                ? 'Too High'
                : ''}
            </Typography.Text>
          </div>
        </div>
      )}
    </Card>
  );
}

export default PHLevel;