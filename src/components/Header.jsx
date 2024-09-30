import React, { useState, useEffect } from 'react';
import { Modal, Button, Select, Input, Avatar, Typography, Space } from 'antd';
import { UserOutlined, EyeInvisibleOutlined, EyeTwoTone, PlusOutlined, SaveOutlined, DeleteOutlined, LogoutOutlined } from '@ant-design/icons';
import { UserAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useLocation } from 'react-router-dom';
import { useApiKey } from '../context/ApiKeyContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faLeaf, faNewspaper, faHome, faTimes } from '@fortawesome/free-solid-svg-icons';

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
    const fetchPlantName = async () => {
      if (currentUser) {
        try {
          const docRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            setPlantName(docSnap.data().plantName || 'AI-Ponics');
          } else {
            console.log('No such document!');
          }
        } catch (error) {
          console.error('Error fetching plant name:', error);
        }
      }
    };

    fetchPlantName();
  }, [currentUser]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser) {
        try {
          const docRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            setPlantName(docSnap.data().plantName || 'AI-Ponics');
            setBlynkApiKeys(docSnap.data().blynkApiKeys || []);
            const savedIndex = localStorage.getItem('selectedApiKeyIndex');
            const index = savedIndex ? parseInt(savedIndex, 10) : 0;
            setSelectedApiKeyIndex(index);
            setEditableBlynkApiKey(docSnap.data().blynkApiKeys?.[index] || '');
          } else {
            console.log('No such document!');
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };

    fetchUserData();
  }, [currentUser]);

  useEffect(() => {
    if (blynkApiKeys.length > 0) {
      setSelectedApiKey(blynkApiKeys[selectedApiKeyIndex]);
      localStorage.setItem('selectedApiKeyIndex', selectedApiKeyIndex);
    }
  }, [blynkApiKeys, selectedApiKeyIndex, setSelectedApiKey]);

  const toggleBlynkApiKeyVisibility = () => {
    setShowBlynkApiKey(!showBlynkApiKey);
  };

  const openModal = () => setModalIsOpen(true);
  const closeModal = () => setModalIsOpen(false);

  const handleBlynkApiKeyChange = (e) => {
    setEditableBlynkApiKey(e.target.value);
  };

  const saveBlynkApiKey = async () => {
    if (currentUser) {
      setLoading(true);
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const updatedApiKeys = [...blynkApiKeys];
        updatedApiKeys[selectedApiKeyIndex] = editableBlynkApiKey;
        await setDoc(userRef, { blynkApiKeys: updatedApiKeys }, { merge: true });
        setBlynkApiKeys(updatedApiKeys);
        alert('Blynk API Key saved successfully!');
        window.location.reload();
      } catch (error) {
        console.error('Error saving Blynk API Key:', error);
        alert('Failed to save Blynk API Key. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const addNewApiKey = () => {
    setBlynkApiKeys([...blynkApiKeys, '']);
    setSelectedApiKeyIndex(blynkApiKeys.length);
    setEditableBlynkApiKey('');
  };

  const deleteApiKey = async () => {
    if (currentUser) {
      setLoading(true);
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const updatedApiKeys = blynkApiKeys.filter((_, index) => index !== selectedApiKeyIndex);
        await setDoc(userRef, { blynkApiKeys: updatedApiKeys }, { merge: true });
        setBlynkApiKeys(updatedApiKeys);
        setSelectedApiKeyIndex(0);
        setEditableBlynkApiKey(updatedApiKeys[0] || '');
        alert('Blynk API Key deleted successfully!');
        window.location.reload();
      } catch (error) {
        console.error('Error deleting Blynk API Key:', error);
        alert('Failed to delete Blynk API Key. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 1.5rem', backgroundColor: '#FAF9F6', borderBottom: '1px solid #dee2e6', position: 'fixed', top: '0', left: '0', width: '100%', zIndex: '1000' }}>
      <div className="header-logo">
        <a href='/'>
          <FontAwesomeIcon icon={faLeaf} className="header-logo-icon" />
          <span>{plantName || 'AI-Ponics'}</span> Dashboard
        </a>
      </div>
      <div>
        {location.pathname === '/home' && (
          <a href='/forum'>
            <FontAwesomeIcon icon={faNewspaper} className='forum-icon'/>
          </a>
        )}
        {location.pathname === '/forum' && (
          <a href='/'>
           <FontAwesomeIcon icon={faHome} className='forum-icon'/>
          </a>
        )}
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
            Sensor Monitoring
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
            onChange={handleBlynkApiKeyChange}
            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
            style={{ marginTop: '0.5rem' }}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: '1rem' }}>
            <Button icon={<DeleteOutlined />} onClick={deleteApiKey} loading={loading} >Delete</Button>
            <Button icon={<PlusOutlined />} onClick={addNewApiKey}>Add</Button>
            <Button icon={<SaveOutlined />} onClick={saveBlynkApiKey} loading={loading}>Save</Button>
          </div>
        </div>
      </Modal>
    </header>
  );
}

export default Header;