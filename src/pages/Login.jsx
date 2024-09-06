import React from 'react';
import { Button, Typography, Box, Container } from '@mui/material';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { useNavigate } from 'react-router-dom';
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
        <div className='App'>
        <Container className="login-container" maxWidth="sm">
            <Box className="login-box">
                <Typography variant="h4" component="h1" gutterBottom>
                    Welcome to AI-Ponics
                </Typography>
                <Typography variant="body1" gutterBottom>
                    Sign in to access your plant monitoring dashboard
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleGoogleSignIn}
                    className="google-signin-button"
                >
                    Sign in with Google
                </Button>
            </Box>
        </Container>
        </div>
    );
}

export default Login;