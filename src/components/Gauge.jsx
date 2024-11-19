import React from 'react';
import { CircularProgress, Box, Typography } from '@mui/material';

export function Gauge({ value, max, label }) {
    const normalizedValue = (value / max) * 100;

    return (
        <Box position="relative" display="inline-flex">
            <CircularProgress
                variant="determinate"
                value={100}
                size={120}
                thickness={4}
                sx={{
                    color: 'grey.400', 
                }}
                aria-label={`Background progress`} // Accessible name for the background progress
            />
            <CircularProgress
                variant="determinate"
                value={normalizedValue}
                size={120}
                thickness={4}
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    color: '#3cb371', 
                    borderRadius: '50%',
                }}
                aria-label={`Progress: ${Math.round(value)}${label}`} // Accessible name for the progress
            />
            <Box
                position="absolute"
                top={0}
                left={0}
                right={0}
                bottom={0}
                display="flex"
                alignItems="center"
                justifyContent="center"
            >
                <Typography variant="h5" component="div" color="textPrimary" sx={{
                    fontFamily: 'Inter, sans-serif', fontWeight: '500'
                }}>
                    {`${Math.round(value)}${label}`}
                </Typography>
            </Box>
        </Box>
    );
}

export default Gauge;