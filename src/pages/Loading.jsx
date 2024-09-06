import React from 'react';

function Loading() {
    const containerStyle = {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh', // Full viewport height
        width: '100vw',  // Full viewport width
        position: 'absolute', // Ensure it covers the whole screen
        top: 0,
        left: 0,
        backgroundColor: '#FAF9F6', // White background color
    };

    const spinnerStyle = {
        border: '8px solid #f3f3f3', // Light grey
        borderTop: '8px solid #007bff', // Blue
        borderRadius: '50%',
        width: '60px',
        height: '60px',
        animation: 'spin 1s linear infinite',
    };

    return (
        <div style={containerStyle}>
            <div style={spinnerStyle}></div>
            <style>
                {`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}
            </style>
        </div>
    );
}

export default Loading;
