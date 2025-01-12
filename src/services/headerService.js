import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { message } from 'antd';

// To fetch the Blynk API keys from Firestore
export const fetchBlynkKeysData = async (currentUser, setBlynkApiKeys, setSelectedApiKeyIndex, setEditableBlynkApiKey) => {
  if (!currentUser) return;

  try {
    const docRef = doc(db, 'users', currentUser.uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      const apiKeys = data.blynkApiKeys || [];
      
      // console.log('Fetched API Keys:', apiKeys);
      setBlynkApiKeys(apiKeys);
      setSelectedApiKeyIndex(0);
      setEditableBlynkApiKey(apiKeys[0] || '');
    } else {
      // console.log('No document exists, initializing with empty array');
      setBlynkApiKeys([]);
      setSelectedApiKeyIndex(0);
      setEditableBlynkApiKey('');
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
    message.error('Failed to fetch user data');
  }
};

// Save the selected Blynk API key to Firestore
export const saveBlynkApiKey = async (currentUser, blynkApiKeys, selectedApiKeyIndex, editableBlynkApiKey, setBlynkApiKeys, setSelectedApiKey, setLoading) => {
  if (!currentUser) return;
  setLoading(true);
  try {
    const updatedApiKeys = [...blynkApiKeys];
    updatedApiKeys[selectedApiKeyIndex] = editableBlynkApiKey;
    
    await setDoc(doc(db, 'users', currentUser.uid), {
      blynkApiKeys: updatedApiKeys,
      selectedApiKey: editableBlynkApiKey
    }, { merge: true });
    
    setBlynkApiKeys(updatedApiKeys);
    setSelectedApiKey(editableBlynkApiKey);
    message.success('Blynk API Key saved successfully!');
  } catch (error) {
    console.error('Error saving Blynk API Key:', error);
    message.error('Failed to save Blynk API Key');
  } finally {
    setLoading(false);
  }
};

// Add a new Blynk API key
export const addNewApiKey = (blynkApiKeys, setBlynkApiKeys, setSelectedApiKeyIndex, setEditableBlynkApiKey) => {
  const updatedKeys = [...blynkApiKeys, ''];
  const newIndex = blynkApiKeys.length;
  
  setBlynkApiKeys(updatedKeys);
  setSelectedApiKeyIndex(newIndex);
  setEditableBlynkApiKey('');
};

// Delete a Blynk API key
export const deleteApiKey = async (currentUser, blynkApiKeys, selectedApiKeyIndex, setBlynkApiKeys, setSelectedApiKeyIndex, setEditableBlynkApiKey, setLoading) => {
  if (!currentUser) return;
  setLoading(true);
  try {
    const updatedApiKeys = blynkApiKeys.filter((_, index) => index !== selectedApiKeyIndex);
    
    await setDoc(doc(db, 'users', currentUser.uid), {
      blynkApiKeys: updatedApiKeys,
      selectedApiKey: updatedApiKeys[0] || ''
    }, { merge: true });
    
    setBlynkApiKeys(updatedApiKeys);
    setSelectedApiKeyIndex(0);
    setEditableBlynkApiKey(updatedApiKeys[0] || '');
    message.success('Blynk API Key deleted successfully!');
  } catch (error) {
    console.error('Error deleting Blynk API Key:', error);
    message.error('Failed to delete Blynk API Key');
  } finally {
    setLoading(false);
  }
};