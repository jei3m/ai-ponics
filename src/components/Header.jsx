import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { UserAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import '../pages/css/Header.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faLeaf, faNewspaper, faHome } from '@fortawesome/free-solid-svg-icons';
import { useLocation } from 'react-router-dom';
import { useApiKey } from '../context/ApiKeyContext';

Modal.setAppElement('#root');

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

  const [loading, setLoading] = useState(false);
  const saveBlynkApiKey = async () => {
    if (currentUser) {
      setLoading(true);  // Start loading
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
        setLoading(false);  // Stop loading
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
      setLoading(true);  // Start loading
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
        setLoading(false);  // Stop loading
      }
    }
  };

  return (
    <header>
      <div className="header-logo">
        <a href='/'>
          <FontAwesomeIcon icon={faLeaf} className="header-logo-icon" />
          <span>{plantName || 'AI-Ponics'}</span> Dashboard
        </a>
      </div>
      <div className="header-user">
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
         </div>
        {currentUser && (
          <>
            <FontAwesomeIcon
              icon={faUser}
              className="header-user-icon"
              onClick={openModal}
            />
            <Modal
              isOpen={modalIsOpen}
              onRequestClose={closeModal}
              style={{
                overlay: {
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  zIndex: 1000
                },
                content: {
                  top: '50%',
                  left: '50%',
                  right: 'auto',
                  bottom: 'auto',
                  transform: 'translate(-50%, -50%)',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  width: '80vw',
                  maxWidth: '500px', 
                  textAlign: 'center',
                  backgroundColor: '#F8F8FF',
                  border: 'none'
                }
              }}
              contentLabel='Profile Modal'
            >
              <h2 className="modal-title">User Profile</h2>
              <img
                src={currentUser.photoURL}
                alt='User Avatar'
                className="user-avatar"
              />
              <div className="user-info">
                <p><strong>Name:</strong><br/> {currentUser.displayName || 'No name provided'}</p>
                <p><strong>Email:</strong><br/>{currentUser.email}</p>
              </div>
              <div className="blynk-api-section">
                <p className="blynk-api-label"><strong>Blynk API Tokens:</strong></p>
                <select
                  value={selectedApiKeyIndex}
                  onChange={(e) => {
                    setSelectedApiKeyIndex(parseInt(e.target.value));
                    setEditableBlynkApiKey(blynkApiKeys[parseInt(e.target.value)] || '');
                  }}
                  className="api-key-select"
                >
                  {blynkApiKeys.map((key, index) => (
                    <option key={index} value={index}>API Key {index + 1}</option>
                  ))}
                </select>
                <div className="blynk-api-input-container">
                  <input
                    type={showBlynkApiKey ? "text" : "password"}
                    value={editableBlynkApiKey}
                    onChange={handleBlynkApiKeyChange}
                    className="blynk-api-input"
                  />
                  <button
                    onClick={toggleBlynkApiKeyVisibility}
                    className="toggle-visibility-button"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {showBlynkApiKey ? (
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      ) : (
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      )}
                      {!showBlynkApiKey && <line x1="1" y1="1" x2="23" y2="23"></line>}
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  </button>
                </div>
                <div className='button-container'>
                <button
                  onClick={addNewApiKey}
                  className="add-api-key-button"
                >
                  Add
                </button>
                <button
                  onClick={saveBlynkApiKey}
                  className="save-api-key-button"
                >
                  Save
                </button>
                <button
                  onClick={deleteApiKey}
                  className="delete-api-key-button"
                >
                  Delete
                </button>
              </div>
              </div>
              <div className="modal-buttons">
                <button
                  onClick={closeModal}
                  className="close-button"
                >
                  Close
                </button>
                <button
                  onClick={logOut}
                  className="logout-button"
                >
                  Log Out
                </button>
              </div>
            </Modal>
          </>
        )}
      </div>
    </header>
  );
}

export default Header;