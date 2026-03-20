import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

export default function About() {
  return (
    <Box className="main-content">
      <Typography variant="h4" gutterBottom>
        About AI Compliance Platform
      </Typography>
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="body1" paragraph>
          The AI Compliance Platform is an enterprise-grade solution designed to monitor, filter, and audit interactions with Large Language Models (LLMs) across multiple corporate and regulatory environments.
        </Typography>
        <Typography variant="body1" paragraph>
          Version: 1.0.0-MVP
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          © 2026 Built for Regulatory Demo.
        </Typography>
      </Paper>
    </Box>
  );
}
