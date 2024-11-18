import React, { useState, useEffect } from 'react';
import { Modal, Button, Select, Input, Avatar, Typography, Space, message } from 'antd';
import { EyeInvisibleOutlined, EyeTwoTone, PlusOutlined, SaveOutlined, DeleteOutlined, LogoutOutlined } from '@ant-design/icons';
import { UserAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { useApiKey } from '../context/ApiKeyContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faLeaf, faNewspaper, faHome, faTimes } from '@fortawesome/free-solid-svg-icons';
import { fetchPlantName, fetchUserData, saveBlynkApiKey, addNewApiKey, deleteApiKey } from '../services/headerService';

import "../pages/css/Header.css"
const { Option } = Select;
const { Text } = Typography;

function Header() {
  const { logOut, currentUser } = UserAuth();
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [plantName, setPlantName] = useState('');
  const [blynkApiKeys, setBlynkApiKeys] = useState([]);
  const [editableBlynkApiKey, setEditableBlynkApiKey] = useState('');
  const [showBlynkApiKey, setShowBlynkApiKey] = useState(false);
  const [selectedApiKeyIndex, setSelectedApiKeyIndex] = useState(0);
  const location = useLocation();
  const { setSelectedApiKey } = useApiKey();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPlantName(currentUser, setPlantName);
    fetchUserData(currentUser, setPlantName, setBlynkApiKeys, setSelectedApiKeyIndex, setEditableBlynkApiKey);
  }, [currentUser]);

  useEffect(() => {
    if (blynkApiKeys.length > 0) {
      setSelectedApiKey(blynkApiKeys[selectedApiKeyIndex]);
      localStorage.setItem('selectedApiKeyIndex', selectedApiKeyIndex);
    }
  }, [blynkApiKeys, selectedApiKeyIndex, setSelectedApiKey]);

  // Used Input.Password component to hide/show password
  // const toggleBlynkApiKeyVisibility = () => {
  //   setShowBlynkApiKey(!showBlynkApiKey);
  // };

  const openModal = () => setModalIsOpen(true);
  const closeModal = () => setModalIsOpen(false);

  const handleBlynkApiKeyChange = (e) => {
    setEditableBlynkApiKey(e.target.value);
  };

  const handleSaveBlynkApiKey = async () => {
    await saveBlynkApiKey(currentUser, blynkApiKeys, selectedApiKeyIndex, editableBlynkApiKey, setBlynkApiKeys, setSelectedApiKey, setLoading);
  };

  const handleAddNewApiKey = () => {
    // Check if there is any blank API key
    const hasBlankKey = blynkApiKeys.some(key => key.trim() === '');
    if (!hasBlankKey) {
      addNewApiKey(blynkApiKeys, setBlynkApiKeys, setSelectedApiKeyIndex, setEditableBlynkApiKey);
    } else {
      message.warning('Please fill in the existing blank API key before adding a new one.');
    }
  };

  const handleDeleteApiKey = async () => {
    await deleteApiKey(currentUser, blynkApiKeys, selectedApiKeyIndex, setBlynkApiKeys, setSelectedApiKeyIndex, setEditableBlynkApiKey, setLoading);
  };

  return (
    <header style={{ marginBottom:'10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 1.5rem', backgroundColor: '#FAF9F6', borderBottom: '1px solid #dee2e6', position: 'sticky' }}>
      <div className="header-logo">
        {/* <a href='/'>
          <FontAwesomeIcon icon={faLeaf} className="header-logo-icon" />
          <span>{plantName || 'AI-Ponics'}</span> Dashboard
        </a> */}

        <a href='/'>
          <FontAwesomeIcon icon={faLeaf} className="header-logo-icon" />
          <span>AI</span>-Ponics
        </a>
      </div>
      <div>
        {/* {location.pathname === '/home' && (
          <a href='/forum'>
            <FontAwesomeIcon icon={faNewspaper} className='forum-icon'/>
          </a>
        )}
        {location.pathname === '/forum' && (
          <a href='/'>
           <FontAwesomeIcon icon={faHome} className='forum-icon'/>
          </a>
        )} */}
        {currentUser && (
          <FontAwesomeIcon
          icon={faUser}
          className="header-user-icon"
          onClick={openModal}
          />
        )}
      </div>
      <Modal
        title={
          <div style={{fontSize: '20px', textAlign: 'center' }}>
            User Profile
          </div>
        }
        open={modalIsOpen}
        onCancel={closeModal}
        footer={null}
      >
        <Avatar 
          size={80} 
          src={currentUser?.photoURL} 
          style={{
            border: '3px solid #006400', 
            marginBottom: '10px', 
            display: 'block', 
            margin: '0 auto'
          }}
        />
          <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
          <Button icon={<LogoutOutlined />} onClick={logOut}>Log Out</Button>
          </div>
        <div style={{ marginTop: '1rem' }}>
          <Text strong>Name:</Text>
          <br />
          <Text>{currentUser?.displayName || 'No name provided'}</Text>
        </div>
        <div style={{ marginTop: '1rem' }}>
          <Text strong>Email:</Text>
          <br />
          <Text>{currentUser?.email}</Text>
        </div>
        <div style={{ marginTop: '1rem' }}>
          <Text strong>Blynk API Tokens:</Text>
          <Select
            value={selectedApiKeyIndex}
            onChange={(value) => {
              setSelectedApiKeyIndex(value);
              setEditableBlynkApiKey(blynkApiKeys[value] || '');
            }}
            style={{ width: '100%', marginTop: '0.5rem' }}
          >
            {blynkApiKeys.map((key, index) => (
              <Option key={index} value={index}>API Key {index + 1}</Option>
            ))}
          </Select>
          <Input.Password
            value={editableBlynkApiKey}
            id="BlynkApiKey"
            name="BlynkApiKey"
            onChange={handleBlynkApiKeyChange}
            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
            style={{ marginTop: '0.5rem' }}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: '1rem' }}>
            <Button icon={<DeleteOutlined />} onClick={handleDeleteApiKey} loading={loading} >Delete</Button>
            <Button icon={<PlusOutlined />} onClick={handleAddNewApiKey}>Add</Button>
            <Button icon={<SaveOutlined />} onClick={handleSaveBlynkApiKey} loading={loading}>Save</Button>
          </div>
        </div>
      </Modal>
    </header>
  );
}

export default Header;