import React from "react";
import { Button, Typography } from "antd";
import { Link } from "react-router-dom";
import { WarningTwoTone } from '@ant-design/icons';
import "./css/NotFound.css";

function NotFound() {
  return (
    <div className="not-found-container">
      <WarningTwoTone className="not-found-icon" twoToneColor="#d9363e" /> {/* Darker red color */}
      <Typography.Title className="not-found-title">
        Error 404
      </Typography.Title>
      <Typography.Text className="not-found-subtitle">
        Oops! The page you're looking for could not be found.
      </Typography.Text>

      <Link to="/">
        <Button type="primary" className="not-found-button">
          Go HOME
        </Button>
      </Link>
    </div>
  );
}

export default NotFound;