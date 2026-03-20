/**
 * Assessments Component for AI Compliance Platform
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
  IconButton
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useApi } from '../contexts/ApiContext';

export default function Assessments() {
  const { user } = useAuth();
  const { getAssessments, createAssessment, updateAssessment, getOrganizations } = useApi();
  
  const [assessments, setAssessments] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState(null);
  const [formData, setFormData] = useState({
    organization_id: '',
    assessment_type: 'self',
    industry_profile: 'financial_services',
    jurisdiction: 'US',
    status: 'in_progress',
    compliance_score: '',
    findings: []
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    
    // Load assessments
    const assessmentsResult = await getAssessments();
    if (assessmentsResult.success) {
      setAssessments(assessmentsResult.data);
    } else {
      setError(assessmentsResult.error);
    }

    // Load organizations for dropdown
    const orgsResult = await getOrganizations();
    if (orgsResult.success) {
      setOrganizations(orgsResult.data);
    }
    
    setLoading(false);
  };

  const handleOpenDialog = (assessment = null) => {
    if (assessment) {
      setEditingAssessment(assessment);
      setFormData({
        organization_id: assessment.organization_id,
        assessment_type: assessment.assessment_type,
        industry_profile: assessment.industry_profile,
        jurisdiction: assessment.jurisdiction,
        status: assessment.status,
        compliance_score: assessment.compliance_score || '',
        findings: assessment.findings || []
      });
    } else {
      setEditingAssessment(null);
      setFormData({
        organization_id: user?.organization_id || '',
        assessment_type: 'self',
        industry_profile: 'financial_services',
        jurisdiction: 'US',
        status: 'in_progress',
        compliance_score: '',
        findings: []
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingAssessment(null);
    setError('');
  };

  const handleSubmit = async () => {
    const assessmentData = {
      ...formData,
      compliance_score: formData.compliance_score ? parseFloat(formData.compliance_score) : null,
      completed_at: formData.status === 'completed' ? new Date().toISOString() : null
    };

    let result;
    if (editingAssessment) {
      result = await updateAssessment(editingAssessment.id, assessmentData);
    } else {
      result = await createAssessment(assessmentData);
    }

    if (result.success) {
      handleCloseDialog();
      loadData();
    } else {
      setError(result.error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'under_review':
        return 'warning';
      case 'in_progress':
        return 'info';
      default:
        return 'default';
    }
  };

  const getAssessmentTypeColor = (type) => {
    return type === 'regulatory' ? 'error' : 'primary';
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
          Assessments
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          New Assessment
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              {user?.role === 'regulatory_inspector' && <TableCell>Organization</TableCell>}
              <TableCell>Type</TableCell>
              <TableCell>Industry</TableCell>
              <TableCell>Jurisdiction</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Score</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {assessments.map((assessment) => (
              <TableRow key={assessment.id}>
                <TableCell>{assessment.id}</TableCell>
                {user?.role === 'regulatory_inspector' && (
                  <TableCell>{assessment.organization_name || `Org ${assessment.organization_id}`}</TableCell>
                )}
                <TableCell>
                  <Chip
                    label={assessment.assessment_type.toUpperCase()}
                    color={getAssessmentTypeColor(assessment.assessment_type)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{assessment.industry_profile}</TableCell>
                <TableCell>{assessment.jurisdiction}</TableCell>
                <TableCell>
                  <Chip
                    label={assessment.status.replace('_', ' ').toUpperCase()}
                    color={getStatusColor(assessment.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {assessment.compliance_score ? `${assessment.compliance_score}%` : '-'}
                </TableCell>
                <TableCell>
                  {new Date(assessment.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(assessment)}
                    title="Edit Assessment"
                  >
                    <EditIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {assessments.length === 0 && (
              <TableRow>
                <TableCell colSpan={user?.role === 'regulatory_inspector' ? 9 : 8} align="center">
                  No assessments found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Assessment Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingAssessment ? 'Edit Assessment' : 'Create New Assessment'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            {user?.role === 'regulatory_inspector' && (
              <FormControl fullWidth>
                <InputLabel>Organization</InputLabel>
                <Select
                  value={formData.organization_id}
                  label="Organization"
                  onChange={(e) => setFormData({ ...formData, organization_id: e.target.value })}
                >
                  {organizations.map((org) => (
                    <MenuItem key={org.id} value={org.id}>
                      {org.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <FormControl fullWidth>
              <InputLabel>Assessment Type</InputLabel>
              <Select
                value={formData.assessment_type}
                label="Assessment Type"
                onChange={(e) => setFormData({ ...formData, assessment_type: e.target.value })}
              >
                <MenuItem value="self">Self Assessment</MenuItem>
                <MenuItem value="regulatory">Regulatory Assessment</MenuItem>
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
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                label="Status"
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="under_review">Under Review</MenuItem>
              </Select>
            </FormControl>

            {formData.status === 'completed' && (
              <TextField
                fullWidth
                label="Compliance Score (%)"
                type="number"
                value={formData.compliance_score}
                onChange={(e) => setFormData({ ...formData, compliance_score: e.target.value })}
                inputProps={{ min: 0, max: 100 }}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingAssessment ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}