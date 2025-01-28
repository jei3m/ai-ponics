import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import Router from './Router'
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <AuthProvider>
      <React.StrictMode>
        <Router />
      </React.StrictMode>
    </AuthProvider>
  </BrowserRouter>
);

reportWebVitals();
