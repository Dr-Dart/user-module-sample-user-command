/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/
import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { FallbackProps } from 'react-error-boundary';
import { logger } from 'dart-api';

/**
 * Error Fallback Component
 * Displayed when an error occurs in the component tree
 */
export function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  // Log error to console and logger
  React.useEffect(() => {
    logger.error(`[ErrorBoundary] Caught error: ${error.message}`);
    logger.error(`[ErrorBoundary] Stack: ${error.stack}`);
  }, [error]);

  return (
    <Box
      sx={{
        'display': 'flex',
        'flexDirection': 'column',
        'alignItems': 'center',
        'justifyContent': 'center',
        'height': '100%',
        'padding': '20px',
        'textAlign': 'center',
      }}
    >
      <Box
        sx={{
          'color': 'error.main',
          'fontSize': '48px',
          'marginBottom': '16px',
        }}
      >
        ⚠️
      </Box>
      <Typography variant="h5" sx={{ 'fontWeight': 'bold', 'marginBottom': '8px' }}>
        Oops! Something went wrong
      </Typography>
      <Typography variant="body1" sx={{ 'color': 'text.secondary', 'marginBottom': '16px' }}>
        {error.message || 'An unexpected error occurred'}
      </Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={resetErrorBoundary}
      >
        Try Again
      </Button>
      {process.env.NODE_ENV === 'development' && (
        <Box
          sx={{
            'marginTop': '24px',
            'padding': '16px',
            'backgroundColor': '#f5f5f5',
            'borderRadius': '4px',
            'maxWidth': '600px',
            'textAlign': 'left',
            'overflow': 'auto',
          }}
        >
          <Typography variant="caption" component="pre" sx={{ 'margin': 0 }}>
            {error.stack}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

/**
 * Compact Error Fallback for smaller components (e.g., PIP screens)
 */
export function CompactErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  React.useEffect(() => {
    logger.error(`[ErrorBoundary] Caught error: ${error.message}`);
    logger.error(`[ErrorBoundary] Stack: ${error.stack}`);
  }, [error]);

  return (
    <Box
      sx={{
        'display': 'flex',
        'flexDirection': 'column',
        'alignItems': 'center',
        'justifyContent': 'center',
        'height': '600px',
        'width': '484px',
        'padding': '20px',
        'textAlign': 'center',
      }}
    >
      <Typography variant="h6" sx={{ 'color': 'error.main', 'marginBottom': '8px' }}>
        Error Occurred
      </Typography>
      <Typography variant="body2" sx={{ 'marginBottom': '16px', 'color': 'text.secondary' }}>
        {error.message}
      </Typography>
      <Button variant="contained" size="small" onClick={resetErrorBoundary}>
        Retry
      </Button>
    </Box>
  );
}
