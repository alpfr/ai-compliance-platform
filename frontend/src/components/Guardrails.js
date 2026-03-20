/**
 * Guardrails Component for AI Compliance Platform
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  IconButton,
  Switch,
  FormControlLabel,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  PlayArrow as TestIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { useApi } from '../contexts/ApiContext';

export default function Guardrails() {
  const { getGuardrails, createGuardrail, filterContent } = useApi();
  
  const [guardrails, setGuardrails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [editingGuardrail, setEditingGuardrail] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    rule_type: 'pii_protection',
    pattern: '',
    action: 'block',
    is_active: true,
    industry_profile: 'financial_services'
  });
  const [testContent, setTestContent] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [testLoading, setTestLoading] = useState(false);

  useEffect(() => {
    loadGuardrails();
  }, []);

  const loadGuardrails = async () => {
    setLoading(true);
    const result = await getGuardrails();
    
    if (result.success) {
      setGuardrails(result.data);
      setError('');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const handleOpenDialog = (guardrail = null) => {
    if (guardrail) {
      setEditingGuardrail(guardrail);
      setFormData({
        name: guardrail.name,
        rule_type: guardrail.rule_type,
        pattern: guardrail.pattern,
        action: guardrail.action,
        is_active: guardrail.is_active,
        industry_profile: guardrail.industry_profile
      });
    } else {
      setEditingGuardrail(null);
      setFormData({
        name: '',
        rule_type: 'pii_protection',
        pattern: '',
        action: 'block',
        is_active: true,
        industry_profile: 'financial_services'
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingGuardrail(null);
    setError('');
  };

  const handleSubmit = async () => {
    const result = await createGuardrail(formData);

    if (result.success) {
      handleCloseDialog();
      loadGuardrails();
    } else {
      setError(result.error);
    }
  };

  const handleTestContent = async () => {
    if (!testContent.trim()) return;
    
    setTestLoading(true);
    const result = await filterContent(testContent);
    
    if (result.success) {
      setTestResult(result.data);
    } else {
      setError(result.error);
    }
    
    setTestLoading(false);
  };

  const getRuleTypeColor = (type) => {
    switch (type) {
      case 'pii_protection':
        return 'error';
      case 'regulatory_language':
        return 'warning';
      case 'bias_check':
        return 'info';
      default:
        return 'default';
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'block':
        return 'error';
      case 'flag':
        return 'warning';
      case 'escalate':
        return 'info';
      default:
        return 'default';
    }
  };

  const samplePatterns = {
    pii_protection: {
      'SSN': '\\b\\d{3}-\\d{2}-\\d{4}\\b',
      'Credit Card': '\\b\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}\\b',
      'Email': '\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b',
      'Phone': '\\b\\d{3}[-.\\s]?\\d{3}[-.\\s]?\\d{4}\\b'
    },
    regulatory_language: {
      'Investment Advice': '\\b(guaranteed returns|risk-free investment|sure profit)\\b',
      'Medical Claims': '\\b(cure|treat|diagnose)\\b.*\\b(cancer|diabetes|disease)\\b',
      'Financial Promises': '\\b(guaranteed|promise|ensure)\\b.*\\b(profit|return|income)\\b'
    },
    bias_check: {
      'Gender Bias': '\\b(he|she)\\b.*\\b(should|must|always)\\b',
      'Age Discrimination': '\\b(too old|too young|age limit)\\b',
      'Racial Terms': '\\b(race|ethnicity)\\b.*\\b(better|worse|superior)\\b'
    }
  };

  if (loading) {
    return (
      <Box className="main-content" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="main-content">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          AI Guardrails
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<TestIcon />}
            onClick={() => setTestDialogOpen(true)}
          >
            Test Content
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            New Guardrail
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SecurityIcon sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Active Guardrails ({guardrails.filter(g => g.is_active).length})
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Real-time content filtering rules to ensure AI outputs comply with regulations
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Pattern</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Industry</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {guardrails.map((guardrail) => (
                  <TableRow key={guardrail.id}>
                    <TableCell>{guardrail.name}</TableCell>
                    <TableCell>
                      <Chip
                        label={guardrail.rule_type.replace('_', ' ').toUpperCase()}
                        color={getRuleTypeColor(guardrail.rule_type)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', maxWidth: 200 }}>
                        {guardrail.pattern.length > 50 
                          ? `${guardrail.pattern.substring(0, 50)}...` 
                          : guardrail.pattern
                        }
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={guardrail.action.toUpperCase()}
                        color={getActionColor(guardrail.action)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{guardrail.industry_profile}</TableCell>
                    <TableCell>
                      <Chip
                        label={guardrail.is_active ? 'ACTIVE' : 'INACTIVE'}
                        color={guardrail.is_active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(guardrail)}
                        title="Edit Guardrail"
                      >
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {guardrails.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No guardrails configured
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>

      {/* Guardrail Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingGuardrail ? 'Edit Guardrail' : 'Create New Guardrail'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              fullWidth
              label="Rule Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., PII Protection - SSN"
            />

            <FormControl fullWidth>
              <InputLabel>Rule Type</InputLabel>
              <Select
                value={formData.rule_type}
                label="Rule Type"
                onChange={(e) => setFormData({ ...formData, rule_type: e.target.value })}
              >
                <MenuItem value="pii_protection">PII Protection</MenuItem>
                <MenuItem value="regulatory_language">Regulatory Language</MenuItem>
                <MenuItem value="bias_check">Bias Check</MenuItem>
                <MenuItem value="safety_constraint">Safety Constraint</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Regex Pattern"
              value={formData.pattern}
              onChange={(e) => setFormData({ ...formData, pattern: e.target.value })}
              placeholder="Enter regex pattern"
              multiline
              rows={2}
              helperText="Regular expression pattern to match content"
            />

            {/* Sample patterns */}
            {samplePatterns[formData.rule_type] && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" gutterBottom>
                  Sample patterns:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {Object.entries(samplePatterns[formData.rule_type]).map(([name, pattern]) => (
                    <Button
                      key={name}
                      size="small"
                      variant="outlined"
                      onClick={() => setFormData({ ...formData, pattern, name: `${formData.rule_type.replace('_', ' ')} - ${name}` })}
                    >
                      {name}
                    </Button>
                  ))}
                </Box>
              </Box>
            )}

            <FormControl fullWidth>
              <InputLabel>Action</InputLabel>
              <Select
                value={formData.action}
                label="Action"
                onChange={(e) => setFormData({ ...formData, action: e.target.value })}
              >
                <MenuItem value="block">Block (Replace with [REDACTED])</MenuItem>
                <MenuItem value="flag">Flag (Log but allow)</MenuItem>
                <MenuItem value="escalate">Escalate (Block and notify)</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Industry Profile</InputLabel>
              <Select
                value={formData.industry_profile}
                label="Industry Profile"
                onChange={(e) => setFormData({ ...formData, industry_profile: e.target.value })}
              >
                <MenuItem value="financial_services">Financial Services</MenuItem>
                <MenuItem value="healthcare">Healthcare</MenuItem>
                <MenuItem value="automotive">Automotive</MenuItem>
                <MenuItem value="government">Government</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
              }
              label="Active"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingGuardrail ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Test Content Dialog */}
      <Dialog open={testDialogOpen} onClose={() => setTestDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Test Content Filtering</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              fullWidth
              label="Test Content"
              value={testContent}
              onChange={(e) => setTestContent(e.target.value)}
              multiline
              rows={4}
              placeholder="Enter content to test against guardrails..."
            />
            
            <Button
              variant="contained"
              onClick={handleTestContent}
              disabled={testLoading || !testContent.trim()}
            >
              {testLoading ? <CircularProgress size={20} /> : 'Test Content'}
            </Button>

            {testResult && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Test Results
                </Typography>
                
                <Alert severity={testResult.is_compliant ? 'success' : 'error'} sx={{ mb: 2 }}>
                  Content is {testResult.is_compliant ? 'compliant' : 'non-compliant'}
                </Alert>

                <Typography variant="subtitle2" gutterBottom>
                  Filtered Content:
                </Typography>
                <Paper sx={{ p: 2, bgcolor: 'grey.100', mb: 2 }}>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {testResult.filtered_content}
                  </Typography>
                </Paper>

                {testResult.violations.length > 0 && (
                  <>
                    <Typography variant="subtitle2" gutterBottom>
                      Violations:
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      {testResult.violations.map((violation, index) => (
                        <Alert key={index} severity="warning" sx={{ mb: 1 }}>
                          {violation}
                        </Alert>
                      ))}
                    </Box>
                  </>
                )}

                {testResult.applied_rules.length > 0 && (
                  <>
                    <Typography variant="subtitle2" gutterBottom>
                      Applied Rules:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {testResult.applied_rules.map((rule, index) => (
                        <Chip key={index} label={rule} size="small" />
                      ))}
                    </Box>
                  </>
                )}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}