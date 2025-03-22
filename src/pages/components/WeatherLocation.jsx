import React, { useState, useEffect } from 'react';
import { Card, Typography } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt, faCloudSun, faWind, faTemperature0, faTemperatureHalf, faTint } from '@fortawesome/free-solid-svg-icons';
import '../css/WeatherLocation.css';

const API_KEY = 'fe8fdf4a679557807c63d297f2817e6b';

function WeatherCard() {
  const [weatherData, setWeatherData] = useState(null);
  const [location, setLocation] = useState({ city: '', country: '' });

  useEffect(() => {
    // Get user's location
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;

      try {
        // Get city and country from coordinates
        const geoRes = await fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${API_KEY}`);
        const geoData = await geoRes.json();
        const city = geoData[0].name;
        const country = geoData[0].country;

        setLocation({ city, country });

        // Get weather using city
        const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city},${country}&units=metric&appid=${API_KEY}`);
        const weatherJson = await weatherRes.json();
        setWeatherData(weatherJson);
      } catch (err) {
        console.error("Failed to fetch location or weather data:", err);
      }
    }, (err) => {
      console.error("Geolocation error:", err.message);
    });
  }, []);

  return (
    <div className='flex-container'>
      <div className='weather-card-container'>
        <Card
          title={
            <div style={{ fontSize: '16px' }}>
              <FontAwesomeIcon icon={faMapMarkerAlt} style={{ marginRight: 10 }} />
              {location.city}, {location.country}
            </div>
          }
          bordered={false}
          className='weather-card'
        >
          {weatherData ? (
            <div className="weather-info">
              <Typography.Text>
                <FontAwesomeIcon icon={faCloudSun} style={{ marginRight: 8 }} />
                <strong>Weather:</strong> {weatherData.weather[0].main}
              </Typography.Text>
              <Typography.Text>
                <FontAwesomeIcon icon={faTemperatureHalf} style={{ marginRight: 8 }}/>
                <strong>Temp:</strong> {weatherData.main.temp} °C
              </Typography.Text>
              <Typography.Text>
                <FontAwesomeIcon icon={faTint} style={{ marginRight: 8 }} />
                <strong>Humidity:</strong> {weatherData.main.humidity}%
              </Typography.Text>
              <Typography.Text>
                <FontAwesomeIcon icon={faWind} style={{ marginRight: 8 }} />
                <strong>Wind:</strong> {weatherData.wind.speed} m/s
              </Typography.Text>
            </div>
          ) : (
            <Typography.Text>Loading weather data...</Typography.Text>
          )}
        </Card>
      </div>
    </div>
  );
}

export default WeatherCard;
