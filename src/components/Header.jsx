import React, { useState, useEffect } from 'react';
import Modal from 'react-modal'; // Import React Modal
import { UserAuth } from '../context/AuthContext';
import { db } from '../firebase'; // Make sure this points to your Firebase config
import { doc, getDoc } from 'firebase/firestore'; // Firestore methods
import '../pages/css/Header.css'

// Set app element for accessibility (optional)
Modal.setAppElement('#root');

function Header() {
  const { logOut, currentUser } = UserAuth(); // Get logOut function and currentUser from context
  const [modalIsOpen, setModalIsOpen] = useState(false); // Modal visibility state
  const [plantName, setPlantName] = useState('');

  useEffect(() => {
    const fetchPlantName = async () => {
      if (currentUser) {
        try {
          const docRef = doc(db, 'users', currentUser.uid); // Adjust collection path if necessary
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            setPlantName(docSnap.data().plantName || 'AI-Ponics'); // Default to 'AI-Ponics' if no plantName
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

  // Open and close modal functions
  const openModal = () => setModalIsOpen(true);
  const closeModal = () => setModalIsOpen(false);

  return (
    <header style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem 2rem',
      backgroundColor: '#FAF9F6',
      borderBottom: '1px solid #dee2e6',
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      zIndex: 1000
    }}>
      <a href='/' style={{
        textDecoration: 'none',
        color: '#000',
        fontWeight: 'bold',
        fontSize: '1.8rem',
      }}>
        <span style={{ color: '#006400' }}>{plantName || 'AI-Ponics'}</span> Dashboard
      </a>
      <div style={{
        display: 'flex',
        alignItems: 'center'
      }}>
        {currentUser && (
          <>
            <img
              src={currentUser.photoURL}
              alt='User Avatar'
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                marginRight: '4rem',
                border: '3px solid #006400',
                cursor: 'pointer' // Add cursor pointer for clickable image
              }}
              onClick={openModal} // Open modal on click
            />
            <Modal
              isOpen={modalIsOpen}
              onRequestClose={closeModal}
              style={{
                overlay: {
                  backgroundColor: 'rgba(0, 0, 0, 0.7)', // Semi-transparent dark background
                  zIndex: 1000 // Ensure it's above other content
                },
                content: {
                  top: '50%',
                  left: '50%',
                  right: 'auto',
                  bottom: 'auto',
                  transform: 'translate(-50%, -50%)',
                  borderRadius: '8px',
                  padding: '1.5rem', // Reduced padding
                  width: '280px', // Slightly reduced width
                  textAlign: 'center',
                  backgroundColor: '#F8F8FF', // Ensure content background is white
                  border: 'none' // Remove default border
                }
              }}
              contentLabel='Profile Modal'
            >
              <h2 style={{ marginTop: '0', marginBottom: '1rem' }}>User Profile</h2>
              <img
                src={currentUser.photoURL}
                alt='User Avatar'
                style={{
                  width: '80px', // Reduced size
                  height: '80px', // Reduced size
                  borderRadius: '50%',
                  marginBottom: '0.5rem', // Reduced margin
                  marginTop: '5px' // Reduced margin
                }}
              />
              <p>Name: {currentUser.displayName || 'No name provided'}</p>
              <p>Email: {currentUser.email}</p>
              <div style={{ marginTop: '1rem' }}>
                <button
                  onClick={closeModal}
                  style={{
                    background: '#6c757d',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    padding: '0.5rem 1rem',
                    display: 'inline-block',
                    marginRight: '0.5rem', // Add spacing between buttons
                    transition: 'background-color 0.3s ease, transform 0.3s ease' // Add transition
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.backgroundColor = '#5a6268'; // Lighter gray on hover
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.backgroundColor = '#6c757d'; // Original gray color
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  Close
                </button>
                <button
                  onClick={logOut}
                  style={{
                    background: '#006400',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s ease, transform 0.3s ease',
                    borderRadius: '4px',
                    padding: '0.5rem 1rem',
                    display: 'inline-block',
                    marginLeft: '0.5rem' // Add spacing between buttons
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.backgroundColor = '#004d00';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.backgroundColor = '#006400';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
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
