import React from 'react';
import {Typography, Box, Container } from '@mui/material';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { useNavigate } from 'react-router-dom';
import '../App.css';
import './css/Login.css';

function Login() {
    const navigate = useNavigate();

    const handleGoogleSignIn = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
            navigate('/sensors'); // Redirect to sensors page after successful login
        } catch (error) {
            console.error('Error signing in with Google:', error);
        }
    };

    return (
        <div className='Appbg'>
        <Container className="login-container" maxWidth="sm">
            <Box className="login-box">
                <Typography variant="h4" component="h1" gutterBottom>
                    Welcome to <br/> AI-Ponics
                </Typography>
                <Typography variant="body1" gutterBottom>
                    Sign in to access your plant monitoring dashboard
                </Typography>
                <button
                    variant="contained"
                    color="primary"
                    onClick={handleGoogleSignIn}
                    className="google-signin-button"
                >
                                        <img 
                        src='https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/768px-Google_%22G%22_logo.svg.png' 
                        alt='Google logo' 
                        className='google-logo' 
                    />
                    Sign in with Google
                </button>
            </Box>
        </Container>
        </div>
    );
}

export default Login;