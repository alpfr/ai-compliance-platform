/**
 * Organizations Component for AI Compliance Platform
 * Only visible to regulatory inspectors
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
  Card,
  CardContent,
  Grid
} from '@mui/material';
import {
  Add as AddIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useApi } from '../contexts/ApiContext';

export default function Organizations() {
  const { user } = useAuth();
  const { getOrganizations, createOrganization } = useApi();
  
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    industry: 'financial_services',
    jurisdiction: 'US'
  });

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    setLoading(true);
    const result = await getOrganizations();
    
    if (result.success) {
      setOrganizations(result.data);
      setError('');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const handleOpenDialog = () => {
    setFormData({
      name: '',
      industry: 'financial_services',
      jurisdiction: 'US'
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setError('');
  };

  const handleSubmit = async () => {
    const result = await createOrganization(formData);

    if (result.success) {
      handleCloseDialog();
      loadOrganizations();
    } else {
      setError(result.error);
    }
  };

  const getIndustryColor = (industry) => {
    switch (industry) {
      case 'financial_services':
        return 'primary';
      case 'healthcare':
        return 'success';
      case 'automotive':
        return 'warning';
      case 'government':
        return 'error';
      default:
        return 'default';
    }
  };

  const getJurisdictionColor = (jurisdiction) => {
    switch (jurisdiction) {
      case 'US':
        return 'primary';
      case 'EU':
        return 'secondary';
      case 'UK':
        return 'success';
      case 'CA':
        return 'info';
      default:
        return 'default';
    }
  };

  // Only regulatory inspectors can access this page
  if (user?.role !== 'regulatory_inspector') {
    return (
      <Box className="main-content">
        <Alert severity="error">
          Access denied. Only regulatory inspectors can view organizations.
        </Alert>
      </Box>
    );
  }

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
          Organizations
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          New Organization
        </Button>
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
                <BusinessIcon sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Registered Organizations ({organizations.length})
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Organizations under regulatory oversight for AI compliance assessment
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Industry</TableCell>
                  <TableCell>Jurisdiction</TableCell>
                  <TableCell>Created</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {organizations.map((organization) => (
                  <TableRow key={organization.id}>
                    <TableCell>{organization.id}</TableCell>
                    <TableCell>
                      <Typography variant="body1" fontWeight="medium">
                        {organization.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={organization.industry.replace('_', ' ').toUpperCase()}
                        color={getIndustryColor(organization.industry)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={organization.jurisdiction}
                        color={getJurisdictionColor(organization.jurisdiction)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(organization.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
                {organizations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No organizations registered
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>

      {/* Organization Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Organization</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              fullWidth
              label="Organization Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Acme Financial Services"
            />

            <FormControl fullWidth>
              <InputLabel>Industry</InputLabel>
              <Select
                value={formData.industry}
                label="Industry"
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              >
                <MenuItem value="financial_services">Financial Services</MenuItem>
                <MenuItem value="healthcare">Healthcare</MenuItem>
                <MenuItem value="automotive">Automotive</MenuItem>
                <MenuItem value="government">Government</MenuItem>
                <MenuItem value="technology">Technology</MenuItem>
                <MenuItem value="energy">Energy & Utilities</MenuItem>
                <MenuItem value="telecommunications">Telecommunications</MenuItem>
                <MenuItem value="retail">Retail & E-commerce</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Jurisdiction</InputLabel>
              <Select
                value={formData.jurisdiction}
                label="Jurisdiction"
                onChange={(e) => setFormData({ ...formData, jurisdiction: e.target.value })}
              >
                <MenuItem value="US">United States</MenuItem>
                <MenuItem value="EU">European Union</MenuItem>
                <MenuItem value="UK">United Kingdom</MenuItem>
                <MenuItem value="CA">Canada</MenuItem>
                <MenuItem value="AU">Australia</MenuItem>
                <MenuItem value="JP">Japan</MenuItem>
                <MenuItem value="SG">Singapore</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            Create Organization
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}