import React from "react";
import { Card, Typography } from "antd";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const AlertCard = ({ title, icon, condition, trueText, falseText, isLoading, isError }) => (
  <Card
    title={
      <div style={{ fontSize: '16px', textAlign: 'center' }}>
        <FontAwesomeIcon icon={icon} /> {title}
      </div>
    }
    style={{
      width: '100%',
      height: 230,
      background: 'white',
      border: '1px solid #ddd',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      marginBottom: '10px'
    }}
  >
    {isLoading ? (
      <Typography.Text strong className="loading-text">
        Loading...
      </Typography.Text>
    ) : isError ? (
      <Typography.Text strong className="error-text">
        Invalid API Token
      </Typography.Text>
    ) : condition ? (
      <div>
        <Typography.Text strong className="temperature-alert-icon">
          🔥 <br />
        </Typography.Text>
        <Typography.Text>
          {trueText}
        </Typography.Text>
      </div>
    ) : (
      <div>
        <Typography.Text strong className="temperature-alert-icon">
          ✅ <br />
        </Typography.Text>
        <Typography.Text strong className="temperature-alert-text">
          {falseText}
        </Typography.Text>
      </div>
    )}
  </Card>
);

export default AlertCard;