import React from "react";
import { Card, Typography } from "antd";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Gauge } from "../components/Gauge";

const GaugeCard = ({ title, icon, value, max, label, isLoading, isError }) => (
  <Card
    title={
      <div style={{ fontSize: '16px' }}>
        <FontAwesomeIcon icon={icon} style={{ marginRight: 10 }} />
        {title}
      </div>
    }
    bordered={false}
    style={{
      minWidth: '50%',
      height: 230,
      background: 'white',
      borderRadius: '10px',
      marginBottom: '10px'
    }}
  >
    <div className="gauge-container">
      {isLoading ? (
        <Typography.Text strong className="loading-text">
          Loading...
        </Typography.Text>
      ) : isError ? (
        <Typography.Text strong className="error-text">
          Invalid API Token
        </Typography.Text>
      ) : (
        <Gauge value={value} max={max} label={label} />
      )}
    </div>
  </Card>
);

export default GaugeCard;