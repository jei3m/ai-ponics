import React, { useState, useEffect } from 'react';
import { Card, Typography, Button, Modal, Form, Select } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt, faCloudSun, faWind, faTemperature0, faTemperatureHalf, faTint } from '@fortawesome/free-solid-svg-icons';
import './css/WeatherCard.css';
import regionData from '../../../ph-json/region.json';
import provinceData from '../../../ph-json/province.json';
import cityData from '../../../ph-json/city.json';
import barangayData from '../../../ph-json/barangay.json';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../../firebase';

function WeatherCard() {
  // State for weather and location data
  const [weatherData, setWeatherData] = useState(null);
  const [location, setLocation] = useState({
    city: '',
    province: '',
    barangay: '',
    country: 'Philippines'
  });

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form] = Form.useForm();

  // Location data states
  const [regions, setRegions] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [barangays, setBarangays] = useState([]);

  // Selected values
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedBarangay, setSelectedBarangay] = useState(null);

  // Load saved location data on component mount
  useEffect(() => {
    const loadSavedLocation = async () => {
      if (auth.currentUser) {
        const userDoc = doc(db, 'users', auth.currentUser.uid);
        const docSnap = await getDoc(userDoc);

        if (docSnap.exists() && docSnap.data().location) {
          const savedLocation = docSnap.data().location;
          setLocation(savedLocation);

          // Fetch weather data using saved coordinates
          if (savedLocation.coordinates) {
            const { lat, lon } = savedLocation.coordinates;
            const weatherRes = await fetch(
              `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${process.env.REACT_APP_OPENWEATHER_API_KEY}`
            );
            const weatherJson = await weatherRes.json();
            setWeatherData(weatherJson);
          }
        }
      }
    };

    loadSavedLocation();
    setRegions(regionData);
  }, []);

  // Update provinces when region changes
  useEffect(() => {
    if (!selectedRegion) {
      setProvinces([]);
      return;
    }
    const filteredProvinces = provinceData.filter(province =>
      province.region_code === selectedRegion
    ).sort((a, b) => a.province_name.localeCompare(b.province_name));
    setProvinces(filteredProvinces);
  }, [selectedRegion]);

  // Update cities when province changes
  useEffect(() => {
    if (!selectedProvince) {
      setCities([]);
      return;
    }
    const filteredCities = cityData.filter(city =>
      city.province_code === selectedProvince
    ).sort((a, b) => a.city_name.localeCompare(b.city_name));
    setCities(filteredCities);
  }, [selectedProvince]);

  // Update barangays when city changes
  useEffect(() => {
    if (!selectedCity) {
      setBarangays([]);
      return;
    }
    const filteredBarangays = barangayData.filter(barangay =>
      barangay.city_code === selectedCity
    ).sort((a, b) => a.brgy_name.localeCompare(b.brgy_name));
    setBarangays(filteredBarangays);
  }, [selectedCity]);

  // Save location data to Firebase
  const saveLocationToFirebase = async (locationData, coordinates) => {
    if (auth.currentUser) {
      try {
        const userDoc = doc(db, 'users', auth.currentUser.uid);
        await setDoc(userDoc, {
          location: {
            ...locationData,
            coordinates: coordinates
          }
        }, { merge: true });
      } catch (error) {
        console.error("Error saving location to Firebase:", error);
        throw error;
      }
    }
  };

  // Modal control functions
  const showModal = () => {
    setIsModalVisible(true);
  };

  // Handle modal cancel and reset form
  const handleCancel = () => {
    if (!isSubmitting) {
      setIsModalVisible(false);
      form.resetFields();
      setSelectedRegion(null);
      setSelectedProvince(null);
      setSelectedCity(null);
      setSelectedBarangay(null);
    }
  };

  // Handle location selection changes
  const handleRegionChange = (value) => {
    setSelectedRegion(value);
    setSelectedProvince(null);
    setSelectedCity(null);
    setSelectedBarangay(null);
    form.setFieldsValue({ province: undefined, city: undefined, barangay: undefined });
  };

  const handleProvinceChange = (value) => {
    setSelectedProvince(value);
    setSelectedCity(null);
    setSelectedBarangay(null);
    form.setFieldsValue({ city: undefined, barangay: undefined });
  };

  const handleCityChange = (value) => {
    setSelectedCity(value);
    setSelectedBarangay(null);
    form.setFieldsValue({ barangay: undefined });
  };

  const handleBarangayChange = (value) => {
    setSelectedBarangay(value);
  };

  // Handle form submission and API calls
  const handleSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      const selectedCityObj = cities.find(city => city.city_code === values.city);
      const selectedProvinceObj = provinces.find(province => province.province_code === values.province);
      const selectedBarangayObj = barangays.find(barangay => barangay.brgy_code === values.barangay);

      if (!selectedCityObj || !selectedProvinceObj) {
        console.error("City or province not found");
        return;
      }

      const cityName = selectedCityObj.city_name;
      const provinceName = selectedProvinceObj.province_name;
      const barangayName = selectedBarangayObj ? selectedBarangayObj.brgy_name : '';

      const addressQuery = encodeURIComponent(
        `${barangayName} ${cityName}, ${provinceName}, Philippines`
      );

      // Get coordinates using Geoapify
      const geoRes = await fetch(
        `https://api.geoapify.com/v1/geocode/search?text=${addressQuery}&apiKey=${process.env.REACT_APP_GEOAPIFY_API_KEY}`
      );
      const geoData = await geoRes.json();

      if (geoData.features && geoData.features.length > 0) {
        const coordinates = geoData.features[0].geometry.coordinates;
        const [lon, lat] = coordinates;

        // Get weather data using coordinates
        const weatherRes = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${process.env.REACT_APP_OPENWEATHER_API_KEY}`
        );
        const weatherJson = await weatherRes.json();

        const locationData = {
          city: cityName,
          province: provinceName,
          barangay: barangayName,
          country: 'Philippines'
        };

        setLocation(locationData);
        setWeatherData(weatherJson);

        // Save to Firebase
        await saveLocationToFirebase(locationData, { lat, lon });

        setIsModalVisible(false);
        form.resetFields();
        setSelectedRegion(null);
        setSelectedProvince(null);
        setSelectedCity(null);
        setSelectedBarangay(null);
      }
    } catch (err) {
      console.error("Failed to fetch weather data:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='flex-container'>
      <div className='weather-card-container'>
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <FontAwesomeIcon icon={faMapMarkerAlt} style={{ marginRight: 10, marginLeft: 175 }} />
              <div>
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>Weather Data</div>
                {location.city && (
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {location.barangay && `${location.barangay}, `}
                    {location.city}, {location.province}
                  </div>
                )}
              </div>
            </div>
          }
          className='weather-card'
        >
          {weatherData ? (
            <div className="weather-info">
              <Typography.Text style={{ marginTop: -5 }}>
                <FontAwesomeIcon icon={faCloudSun} style={{ marginRight: 8, marginLeft: 200 }} />
                <strong>Weather:</strong> {weatherData.weather[0].main}
              </Typography.Text>
              <Typography.Text>
                <FontAwesomeIcon icon={faTemperatureHalf} style={{ marginRight: 8, marginLeft: 200 }} />
                <strong>Temp:</strong> {weatherData.main.temp} °C
              </Typography.Text>
              <Typography.Text>
                <FontAwesomeIcon icon={faTint} style={{ marginRight: 18, marginLeft: 200 }} />
                <strong>Humidity:</strong> {weatherData.main.humidity}%
              </Typography.Text>
              <Typography.Text>
                <FontAwesomeIcon icon={faWind} style={{ marginRight: 2, marginLeft: 200 }} />
                <strong>Wind:</strong> {weatherData.wind.speed} m/s
              </Typography.Text>
              <div style={{ position: 'absolute', bottom: '60px', right: '10px' }}>
                <Button type="primary" onClick={showModal}>
                  Edit Location
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <div>
                <Typography.Text>Please set a location to view weather data</Typography.Text>
                {location.city && (
                  <Typography.Text style={{ display: 'block', marginTop: 8 }}>
                    Current location: {location.barangay && `${location.barangay}, `}
                    {location.city}, {location.province}
                  </Typography.Text>
                )}
                <div style={{ position: 'absolute', bottom: '12px', right: '12px' }}>
                  <Button type="primary" onClick={showModal}>
                    {location.city ? 'Edit Location' : 'Add Location'}
                  </Button>
                </div>
              </div>
              <div style={{ position: 'absolute', bottom: '12px', right: '12px' }}>
                <Button type="primary" onClick={showModal}>
                  Add Location
                </Button>
              </div>
            </div>
          )}
        </Card>

        <Modal
          title="Add Location"
          open={isModalVisible}
          onCancel={handleCancel}
          onOk={form.submit}
          okButtonProps={{ disabled: isSubmitting }}
          cancelButtonProps={{ disabled: isSubmitting }}
          confirmLoading={isSubmitting}
        >
          <Form
            form={form}
            onFinish={handleSubmit}
            layout="vertical"
          >
            <Form.Item
              name="region"
              label="Region"
              rules={[{ required: true, message: 'Please select a region!' }]}
            >
              <Select
                placeholder="Choose Region"
                onChange={handleRegionChange}
                options={regions.map(region => ({
                  value: region.region_code,
                  label: region.region_name
                }))}
                disabled={isSubmitting}
              />
            </Form.Item>
            <Form.Item
              name="province"
              label="Province/State"
              rules={[{ required: true, message: 'Please select a province!' }]}
            >
              <Select
                placeholder="Choose Province/State"
                onChange={handleProvinceChange}
                disabled={!selectedRegion || isSubmitting}
                options={provinces.map(province => ({
                  value: province.province_code,
                  label: province.province_name
                }))}
              />
            </Form.Item>
            <Form.Item
              name="city"
              label="City/Municipality"
              rules={[{ required: true, message: 'Please select a city!' }]}
            >
              <Select
                placeholder="Choose City/Municipality"
                onChange={handleCityChange}
                disabled={!selectedProvince || isSubmitting}
                options={cities.map(city => ({
                  value: city.city_code,
                  label: city.city_name
                }))}
              />
            </Form.Item>
            <Form.Item
              name="barangay"
              label="Barangay"
            >
              <Select
                placeholder="Choose Barangay"
                onChange={handleBarangayChange}
                disabled={!selectedCity || isSubmitting}
                options={barangays.map(barangay => ({
                  value: barangay.brgy_code,
                  label: barangay.brgy_name
                }))}
              />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
}

export default WeatherCard;