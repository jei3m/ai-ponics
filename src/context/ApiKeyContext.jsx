import React, { createContext, useState, useContext } from 'react';

const ApiKeyContext = createContext();

export const ApiKeyProvider = ({ children }) => {
  const [selectedApiKey, setSelectedApiKey] = useState('');

  return (
    <ApiKeyContext.Provider value={{ selectedApiKey, setSelectedApiKey }}>
      {children}
    </ApiKeyContext.Provider>
  );
};

export const useApiKey = () => useContext(ApiKeyContext);