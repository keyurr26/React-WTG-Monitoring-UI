import React from 'react';
import { Box, Typography, CircularProgress, Paper } from '@mui/material';
import { CloudOff } from 'lucide-react'; // Make sure lucide-react is installed

const TempHost = () => {
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        bgcolor: '#0a0e17', // Dark theme matching modern aesthetics
        p: 3
      }}
    >
      <Paper 
        elevation={6} 
        sx={{ 
          p: 5, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          borderRadius: 4,
          maxWidth: 500,
          textAlign: 'center',
          bgcolor: 'rgba(25, 33, 48, 0.9)',
          backdropFilter: 'blur(10px)',
          color: 'white',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <CloudOff size={64} color="#60a5fa" style={{ marginBottom: '24px' }} />
        
        <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom sx={{ color: '#60a5fa' }}>
          Temporary Host
        </Typography>
        
        <Typography variant="body1" sx={{ mb: 4, color: 'rgba(255, 255, 255, 0.7)' }}>
          This environment is currently being hosted temporarily. The WTG Monitoring UI features will be available shortly.
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <CircularProgress size={24} sx={{ color: '#60a5fa' }} />
          <Typography variant="body2" sx={{ color: '#60a5fa' }}>
            System standby...
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default TempHost;
