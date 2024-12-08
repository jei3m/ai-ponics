// headerService.js
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { message } from 'antd';

// To fetch the user data from Firestore, to be displayed in the user profile modal
export const fetchUserData = async (currentUser, setBlynkApiKeys, setSelectedApiKeyIndex, setEditableBlynkApiKey) => {
  if (!currentUser) return;
  try {
    const docSnap = await getDoc(doc(db, 'users', currentUser.uid));
    if (docSnap.exists()) {
      const data = docSnap.data();
      setBlynkApiKeys(data.blynkApiKeys || []);
      const index = parseInt(localStorage.getItem('selectedApiKeyIndex'), 10) || 0;
      setSelectedApiKeyIndex(index);
      setEditableBlynkApiKey(data.blynkApiKeys?.[index] || '');
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
  }
};

// To save the selected Blynk API key to Firestore 
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
  setBlynkApiKeys([...blynkApiKeys, '']);
  setSelectedApiKeyIndex(blynkApiKeys.length);
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
