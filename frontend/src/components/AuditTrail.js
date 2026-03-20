/**
 * Audit Trail Component for AI Compliance Platform
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button
} from '@mui/material';
import {
  History as HistoryIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useApi } from '../contexts/ApiContext';

export default function AuditTrail() {
  const { user } = useAuth();
  const { getAuditTrail } = useApi();
  
  const [auditTrail, setAuditTrail] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [limit, setLimit] = useState(100);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadAuditTrail();
  }, [limit]);

  const loadAuditTrail = async () => {
    setLoading(true);
    const result = await getAuditTrail(limit);
    
    if (result.success) {
      setAuditTrail(result.data);
      setError('');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'CREATE':
        return 'success';
      case 'UPDATE':
        return 'info';
      case 'DELETE':
        return 'error';
      case 'FILTER':
        return 'warning';
      case 'LOGIN':
        return 'primary';
      default:
        return 'default';
    }
  };

  const getResourceTypeIcon = (resourceType) => {
    switch (resourceType) {
      case 'assessment':
        return '📋';
      case 'guardrail_rule':
        return '🛡️';
      case 'organization':
        return '🏢';
      case 'llm_content':
        return '🤖';
      default:
        return '📄';
    }
  };

  const formatDetails = (details) => {
    if (!details) return '-';
    
    try {
      const parsed = JSON.parse(details);
      return Object.entries(parsed)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
    } catch {
      return details;
    }
  };

  const filteredAuditTrail = auditTrail.filter(entry => {
    if (filter === 'all') return true;
    return entry.action === filter;
  });

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
          Audit Trail
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadAuditTrail}
        >
          Refresh
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
                <HistoryIcon sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Activity Log ({filteredAuditTrail.length} entries)
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Complete audit trail of all compliance-related activities
                {user?.role !== 'regulatory_inspector' && ' for your organization'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Filter</InputLabel>
              <Select
                value={filter}
                label="Filter"
                onChange={(e) => setFilter(e.target.value)}
              >
                <MenuItem value="all">All Actions</MenuItem>
                <MenuItem value="CREATE">Create</MenuItem>
                <MenuItem value="UPDATE">Update</MenuItem>
                <MenuItem value="DELETE">Delete</MenuItem>
                <MenuItem value="FILTER">Filter</MenuItem>
                <MenuItem value="LOGIN">Login</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Limit</InputLabel>
              <Select
                value={limit}
                label="Limit"
                onChange={(e) => setLimit(e.target.value)}
              >
                <MenuItem value={50}>50 entries</MenuItem>
                <MenuItem value={100}>100 entries</MenuItem>
                <MenuItem value={200}>200 entries</MenuItem>
                <MenuItem value={500}>500 entries</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Resource</TableCell>
                  <TableCell>Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAuditTrail.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(entry.timestamp).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {entry.username || 'System'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={entry.action}
                        color={getActionColor(entry.action)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ marginRight: 8 }}>
                          {getResourceTypeIcon(entry.resource_type)}
                        </span>
                        <Typography variant="body2">
                          {entry.resource_type}
                          {entry.resource_id && ` #${entry.resource_id}`}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          maxWidth: 300, 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                        title={formatDetails(entry.details)}
                      >
                        {formatDetails(entry.details)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredAuditTrail.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No audit trail entries found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Box>
  );
}