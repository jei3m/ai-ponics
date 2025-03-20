import React from 'react';
import { CircularProgress, Box, Typography } from '@mui/material';

export function Gauge({ value, max, min, label }) {
    const normalizedValue = (value / max) * 100;
    const isAboveMax = normalizedValue >= 101;
    const isBelowMin = value < min;
    const getGaugeColor = () => {
        if (isAboveMax) return '#e70000';
        if (isBelowMin) return '#e77b00';
        return '#3cb371';
    };

    const getTextColor = () => {
        if (isAboveMax) return '#e70000';
        if (isBelowMin) return '#e77b00';
        return 'textPrimaryu';
    }

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
                aria-label={`Background progress`}
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
                    color: getGaugeColor(),
                    borderRadius: '50%',
                }}
                aria-label={`Progress: ${Math.round(value)}${label}`}
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
                <Typography 
                    variant="h5" 
                    component="div" 
                    color={getTextColor()} 
                    sx={{
                        fontFamily: 'Inter, sans-serif', 
                        fontWeight: '500'
                    }}
                >
                    {`${value}${label}`}
                </Typography>
            </Box>
        </Box>
    );
}

export default Gauge;