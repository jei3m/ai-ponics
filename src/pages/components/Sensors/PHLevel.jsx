import React from 'react';
import { Card, Typography } from 'antd';
import Gauge from './Gauge';
import {StatusMessage} from '../../../services/sensorService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFlask } from '@fortawesome/free-solid-svg-icons';
import './css/TempStatus.css'

function PHLevel({ pHlevel, status }) {
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
                    <Gauge value={pHlevel} max={10} label="" />
                )}
                <div>
                    <Typography.Text strong className="temperature-alert-text">
                        {pHlevel >= 5.5 && pHlevel <= 7.5
                            ? 'Normal'
                            : pHlevel < 5.5
                            ? 'Too Low'
                            : pHlevel > 7.5
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