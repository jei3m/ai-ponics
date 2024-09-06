import React, { useEffect } from 'react';
import {Typography, Box, Container } from '@mui/material';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { useNavigate } from 'react-router-dom';
import '../App.css';
import './css/Login.css';

function Login() {
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                navigate('/home');
            }
        });

        return () => unsubscribe();
    }, [navigate]);

    const handleGoogleSignIn = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
            navigate('/home'); // Redirect to sensors page after successful login
        } catch (error) {
            console.error('Error signing in with Google:', error);
        }
    };

    return (
        <div className="Appokform"> {/* Wrapper for the form container, applies styling from a CSS class */}
        <div className="Appcardform"> {/* Card-like container for the login form */}
            <h2 style={{ fontSize: '2em', marginBottom:'20px', textAlign:'center' }}>Welcome to <br/> AI-Ponics</h2> {/* Header for the form with inline font size styling */}
            
            {/* New image area */}
            <div className="logo-container" style={{ marginBottom: '20px', textAlign: 'center' }}>
                <img 
                    src="/logo192.png" 
                    alt="AI-Ponics Logo" 
                    style={{ maxWidth: '200px', height: 'auto' }}
                />
            </div>

            <button onClick={handleGoogleSignIn} className='google-login-btn'>
                <img 
                    src='https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/768px-Google_%22G%22_logo.svg.png' 
                    alt='Google logo' 
                    className='google-logo' 
                />
                <span className='google-btn-text'>Sign in with Google</span>
            </button>
        </div>
    </div>
    );
}

export default Login;