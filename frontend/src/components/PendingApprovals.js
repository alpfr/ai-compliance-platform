import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Box,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import { useApi } from '../contexts/ApiContext';

export default function PendingApprovals() {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const { getPendingUsers, approveUser } = useApi();

  const fetchApprovals = async () => {
    setLoading(true);
    const result = await getPendingUsers();
    
    if (result.success) {
      setApprovals(result.data || []);
      setError('');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchApprovals();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleApprove = async (userId, username, email) => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    const result = await approveUser(userId);
    
    if (result.success) {
      setSuccess(`User ${username} (${email}) has been fully approved! They will receive an email shortly.`);
      // Remove approved user from the state directly
      setApprovals(approvals.filter(user => user.id !== userId));
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3, ml: { sm: '240px' }, mt: 8 }}>
      <Container maxWidth="lg">
        <Typography variant="h4" gutterBottom>
          Pending B2B Corporate Approvals
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Review and securely authorize newly registered corporate client accounts before granting dashboard access.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

        <Paper elevation={3}>
          {loading && approvals.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Username</strong></TableCell>
                    <TableCell><strong>Corporate Email</strong></TableCell>
                    <TableCell><strong>Requested Role</strong></TableCell>
                    <TableCell><strong>Registration Date</strong></TableCell>
                    <TableCell align="right"><strong>Action</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {approvals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                          No pending corporate accounts awaiting authorization.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    approvals.map((user) => (
                      <TableRow key={user.id} hover>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Chip 
                            label={user.role === 'organization_admin' ? 'Organization Admin' : user.role} 
                            color={user.role === 'organization_admin' ? 'primary' : 'default'}
                            size="small" 
                          />
                        </TableCell>
                        <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                        <TableCell align="right">
                          <Button 
                            variant="contained" 
                            color="success" 
                            size="small"
                            onClick={() => handleApprove(user.id, user.username, user.email)}
                            disabled={loading}
                          >
                            Authorize Access
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
