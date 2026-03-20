import React, { useState } from 'react';
import { Box, Typography, Paper, Switch, FormControlLabel, Button, TextField, Divider, Snackbar } from '@mui/material';

export default function Settings() {
  const [alerts, setAlerts] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);
  const [autoBlock, setAutoBlock] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
  };

  return (
    <Box className="main-content">
      <Typography variant="h4" gutterBottom>
        Platform Settings
      </Typography>
      
      <Paper sx={{ p: 4, mt: 3, maxWidth: 800 }}>
        <Typography variant="h6" gutterBottom color="primary">
          Security & Rules Engine
        </Typography>
        <FormControlLabel
          control={<Switch checked={autoBlock} onChange={(e) => setAutoBlock(e.target.checked)} color="error" />}
          label="Strict Mode: Automatically block IP on repeated severe PII violations"
          sx={{ display: 'block', mb: 2 }}
        />
        
        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom color="primary">
          Notifications & Alerts
        </Typography>
        <FormControlLabel
          control={<Switch checked={alerts} onChange={(e) => setAlerts(e.target.checked)} color="primary" />}
          label="Real-time email alerts for high-severity compliance violations"
          sx={{ display: 'block', mb: 1 }}
        />
        <FormControlLabel
          control={<Switch checked={weeklyReport} onChange={(e) => setWeeklyReport(e.target.checked)} color="primary" />}
          label="Generate and email weekly organizational compliance summaries"
          sx={{ display: 'block', mb: 2 }}
        />
        
        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom color="primary">
          Administrator Contact
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField label="Primary Contact Email" defaultValue="admin@alpfr.com" fullWidth size="small" />
          <TextField label="Support Phone Number" defaultValue="+1 (555) 019-2831" fullWidth size="small" />
        </Box>

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button variant="outlined" color="inherit">Reset Defaults</Button>
          <Button variant="contained" color="primary" onClick={handleSave}>Save Configuration</Button>
        </Box>
      </Paper>
      
      <Snackbar
        open={saved}
        autoHideDuration={4000}
        onClose={() => setSaved(false)}
        message="Platform configurations securely updated and propagated."
      />
    </Box>
  );
}
