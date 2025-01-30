import React from 'react';
import { Card, Typography } from 'antd';
import {StatusMessage} from '../../../services/sensorService';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import './css/TempStatus.css'

function FlowRate({ flowRate, status }) {
  return (
    <Card
      title={
        <div style={{ fontSize: '16px', textAlign: 'center' }}>
          <ExclamationCircleOutlined style={{marginTop:'1px'}}/> Pump Operation
        </div>
      }
      className='temp-status-card'
    >
        {status && (
            <StatusMessage message={status.message} className={status.className} style={status.style} />
        )}

        {!status && (
        <div style={{ textAlign: 'center' }}>
            <Typography.Text strong className="temperature-alert-icon">
            {flowRate > 0 ? '✅' : '⚠️'} <br />
            </Typography.Text>
            <Typography.Text strong className="temperature-alert-text">
            {flowRate > 0 ? 'Working' : 'Not Working'}
            </Typography.Text>
        </div>
        )}
    </Card>
  );
}

export default FlowRate;