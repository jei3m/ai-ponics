// headerService.js
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { message } from 'antd';

// To fetch the plant name from Firestore, to be displayed in the header
export const fetchPlantName = async (currentUser, setPlantName) => {
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

// To fetch the user data from Firestore, to be displayed in the user profile modal
export const fetchUserData = async (currentUser, setPlantName, setBlynkApiKeys, setSelectedApiKeyIndex, setEditableBlynkApiKey) => {
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

// To save the selected Blynk API key to Firestore 
export const saveBlynkApiKey = async (currentUser, blynkApiKeys, selectedApiKeyIndex, editableBlynkApiKey, setBlynkApiKeys, setSelectedApiKey, setLoading) => {
  if (currentUser) {
    setLoading(true);
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const updatedApiKeys = [...blynkApiKeys];
      updatedApiKeys[selectedApiKeyIndex] = editableBlynkApiKey;
      await setDoc(userRef, { 
        blynkApiKeys: updatedApiKeys,
        selectedApiKey: editableBlynkApiKey // Save the selected API key
      }, { merge: true });
      setBlynkApiKeys(updatedApiKeys);
      setSelectedApiKey(editableBlynkApiKey); // Set the selected API key
      message.success('Blynk API Key saved successfully!');
      window.location.reload();
    } catch (error) {
      console.error('Error saving Blynk API Key:', error);
      message.error('Failed to save Blynk API Key. Please try again.');
    } finally {
      setLoading(false);
    }
  }
};

// Add a new Blynk API key
export const addNewApiKey = (blynkApiKeys, setBlynkApiKeys, setSelectedApiKeyIndex, setEditableBlynkApiKey) => {
  setBlynkApiKeys([...blynkApiKeys, '']);
  setSelectedApiKeyIndex(blynkApiKeys.length);
  setEditableBlynkApiKey('');
};


// Delete a Blynk API key
export const deleteApiKey = async (currentUser, blynkApiKeys, selectedApiKeyIndex, setBlynkApiKeys, setSelectedApiKeyIndex, setEditableBlynkApiKey, setLoading) => {
  if (currentUser) {
    setLoading(true);
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const updatedApiKeys = blynkApiKeys.filter((_, index) => index !== selectedApiKeyIndex);
      await setDoc(userRef, { 
        blynkApiKeys: updatedApiKeys,
        selectedApiKey: updatedApiKeys[0] || '' 
      }, { merge: true });
      setBlynkApiKeys(updatedApiKeys);
      setSelectedApiKeyIndex(0);
      setEditableBlynkApiKey(updatedApiKeys[0] || '');
      message.success('Blynk API Key deleted successfully!');
      window.location.reload();
    } catch (error) {
      console.error('Error deleting Blynk API Key:', error);
      message.error('Failed to delete Blynk API Key. Please try again.');
    } finally {
      setLoading(false);
    }
  }
};

