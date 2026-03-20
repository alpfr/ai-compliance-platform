import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  Alert,
  Snackbar,
  CircularProgress,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  FormControlLabel,
  Switch,
  Grid,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Checkbox,
  Menu,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useApi } from '../contexts/ApiContext';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`llm-tabpanel-${index}`}
      aria-labelledby={`llm-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const LLMManagement = () => {
  const { user } = useAuth();
  const { apiCall } = useApi();
  
  // State management
  const [tabValue, setTabValue] = useState(0);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Model list state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProvider, setFilterProvider] = useState('');
  const [filterIndustry, setFilterIndustry] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedModels, setSelectedModels] = useState([]);
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [auditDialogOpen, setAuditDialogOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    provider: '',
    version: 'latest',
    description: '',
    capabilities: [],
    supported_industries: [],
    is_active: true,
    is_recommended: false,
    status: 'active'
  });
  
  // Audit log state
  const [auditLogs, setAuditLogs] = useState([]);
  
  // Menu state
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuModel, setMenuModel] = useState(null);

  // Check admin access
  useEffect(() => {
    if (!user || !['organization_admin', 'regulatory_inspector'].includes(user.role)) {
      setError('Admin access required for LLM Management');
      return;
    }
    loadModels();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load models
  const loadModels = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterProvider) params.append('provider', filterProvider);
      if (filterIndustry) params.append('industry', filterIndustry);
      if (filterStatus) params.append('status', filterStatus);
      params.append('skip', page * rowsPerPage);
      params.append('limit', rowsPerPage);
      
      const result = await apiCall(`/api/v1/models?${params.toString()}`);
      if (result.success) {
        setModels(result.data);
      } else {
        setError('Failed to load models: ' + result.error);
      }
    } catch (err) {
      setError('Failed to load models: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load audit logs
  const loadAuditLogs = async (modelId = null) => {
    try {
      const params = new URLSearchParams();
      if (modelId) params.append('model_id', modelId);
      params.append('limit', 50);
      
      const result = await apiCall(`/api/v1/models/audit?${params.toString()}`);
      if (result.success) {
        setAuditLogs(result.data);
      } else {
        setError('Failed to load audit logs: ' + result.error);
      }
    } catch (err) {
      setError('Failed to load audit logs: ' + err.message);
    }
  };

  // Handle model creation
  const handleCreateModel = async () => {
    try {
      setLoading(true);
      const result = await apiCall('/api/v1/models', 'POST', formData);
      if (result.success) {
        setSuccess('Model created successfully');
        setCreateDialogOpen(false);
        resetForm();
        loadModels();
      } else {
        setError('Failed to create model: ' + result.error);
      }
    } catch (err) {
      setError('Failed to create model: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle model update
  const handleUpdateModel = async () => {
    try {
      setLoading(true);
      const updateData = { ...formData };
      delete updateData.id; // Don't send ID in update
      
      const result = await apiCall(`/api/v1/models/${selectedModel.id}`, 'PUT', updateData);
      if (result.success) {
        setSuccess('Model updated successfully');
        setEditDialogOpen(false);
        resetForm();
        loadModels();
      } else {
        setError('Failed to update model: ' + result.error);
      }
    } catch (err) {
      setError('Failed to update model: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle model deletion
  const handleDeleteModel = async () => {
    try {
      setLoading(true);
      const result = await apiCall(`/api/v1/models/${selectedModel.id}`, 'DELETE');
      if (result.success) {
        setSuccess('Model deleted successfully');
        setDeleteDialogOpen(false);
        setSelectedModel(null);
        loadModels();
      } else {
        setError('Failed to delete model: ' + result.error);
      }
    } catch (err) {
      setError('Failed to delete model: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle bulk operations
  const handleBulkDelete = async () => {
    if (selectedModels.length === 0) return;
    
    try {
      setLoading(true);
      const result = await apiCall('/api/v1/models/bulk', 'POST', {
        operation: 'delete',
        model_ids: selectedModels
      });
      
      if (result.success) {
        setSuccess(`Bulk operation completed: ${result.data.successful} successful, ${result.data.failed} failed`);
        setSelectedModels([]);
        loadModels();
      } else {
        setError('Bulk delete failed: ' + result.error);
      }
    } catch (err) {
      setError('Bulk delete failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      provider: '',
      version: 'latest',
      description: '',
      capabilities: [],
      supported_industries: [],
      is_active: true,
      is_recommended: false,
      status: 'active'
    });
  };

  // Open edit dialog
  const openEditDialog = (model) => {
    setSelectedModel(model);
    setFormData({
      id: model.id,
      name: model.name,
      provider: model.provider,
      version: model.version,
      description: model.description,
      capabilities: model.capabilities,
      supported_industries: model.supported_industries,
      is_active: model.is_active,
      is_recommended: model.is_recommended,
      status: model.status || 'active'
    });
    setEditDialogOpen(true);
  };

  // Open delete dialog
  const openDeleteDialog = (model) => {
    setSelectedModel(model);
    setDeleteDialogOpen(true);
  };

  // Open view dialog
  const openViewDialog = (model) => {
    setSelectedModel(model);
    setViewDialogOpen(true);
  };

  // Open audit dialog
  const openAuditDialog = (model = null) => {
    setSelectedModel(model);
    loadAuditLogs(model?.id);
    setAuditDialogOpen(true);
  };

  // Handle menu
  const handleMenuClick = (event, model) => {
    setAnchorEl(event.currentTarget);
    setMenuModel(model);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuModel(null);
  };

  // Handle selection
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedModels(models.map(model => model.id));
    } else {
      setSelectedModels([]);
    }
  };

  const handleSelectModel = (modelId) => {
    setSelectedModels(prev => 
      prev.includes(modelId) 
        ? prev.filter(id => id !== modelId)
        : [...prev, modelId]
    );
  };

  // Filter models for display
  const filteredModels = models.filter(model => {
    const matchesSearch = !searchTerm || 
      model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      model.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
      model.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesProvider = !filterProvider || model.provider === filterProvider;
    const matchesIndustry = !filterIndustry || model.supported_industries.includes(filterIndustry);
    const matchesStatus = !filterStatus || model.status === filterStatus;
    
    return matchesSearch && matchesProvider && matchesIndustry && matchesStatus;
  });

  // Get unique providers and industries for filters
  const providers = [...new Set(models.map(model => model.provider))];
  const industries = [...new Set(models.flatMap(model => model.supported_industries))];

  // Available options
  const capabilityOptions = [
    'text_generation', 'code_generation', 'analysis', 'reasoning',
    'conversation', 'summarization', 'translation', 'multilingual',
    'image_analysis', 'document_processing'
  ];
  
  const industryOptions = [
    'financial_services', 'healthcare', 'automotive', 'government', 'education', 'retail'
  ];

  if (!user || !['organization_admin', 'regulatory_inspector'].includes(user.role)) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          Admin access required for LLM Management
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        LLM Management
      </Typography>
      
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Model List" />
          <Tab label="Audit Log" />
        </Tabs>
        
        <TabPanel value={tabValue} index={0}>
          {/* Model List Tab */}
          <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              size="small"
              placeholder="Search models..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Provider</InputLabel>
              <Select
                value={filterProvider}
                onChange={(e) => setFilterProvider(e.target.value)}
                label="Provider"
              >
                <MenuItem value="">All</MenuItem>
                {providers.map(provider => (
                  <MenuItem key={provider} value={provider}>{provider}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Industry</InputLabel>
              <Select
                value={filterIndustry}
                onChange={(e) => setFilterIndustry(e.target.value)}
                label="Industry"
              >
                <MenuItem value="">All</MenuItem>
                {industries.map(industry => (
                  <MenuItem key={industry} value={industry}>
                    {industry.replace('_', ' ').toUpperCase()}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="Status"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="deprecated">Deprecated</MenuItem>
              </Select>
            </FormControl>
            
            <Button
              variant="outlined"
              onClick={loadModels}
              startIcon={<FilterIcon />}
            >
              Apply Filters
            </Button>
            
            {selectedModels.length > 0 && (
              <Button
                variant="outlined"
                color="error"
                onClick={handleBulkDelete}
                startIcon={<DeleteIcon />}
              >
                Delete Selected ({selectedModels.length})
              </Button>
            )}
          </Box>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={selectedModels.length > 0 && selectedModels.length < models.length}
                      checked={models.length > 0 && selectedModels.length === models.length}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Provider</TableCell>
                  <TableCell>Version</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Industries</TableCell>
                  <TableCell>Capabilities</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : filteredModels.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      No models found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredModels.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((model) => (
                    <TableRow key={model.id} hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedModels.includes(model.id)}
                          onChange={() => handleSelectModel(model.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {model.name}
                          {model.is_recommended && (
                            <Chip label="Recommended" size="small" color="primary" />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>{model.provider}</TableCell>
                      <TableCell>{model.version}</TableCell>
                      <TableCell>
                        <Chip 
                          label={model.status || 'active'} 
                          size="small"
                          color={
                            (model.status || 'active') === 'active' ? 'success' :
                            (model.status || 'active') === 'inactive' ? 'warning' : 'error'
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {model.supported_industries.slice(0, 2).map(industry => (
                            <Chip 
                              key={industry} 
                              label={industry.replace('_', ' ')} 
                              size="small" 
                              variant="outlined"
                            />
                          ))}
                          {model.supported_industries.length > 2 && (
                            <Chip 
                              label={`+${model.supported_industries.length - 2}`} 
                              size="small" 
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {model.capabilities.slice(0, 2).map(capability => (
                            <Chip 
                              key={capability} 
                              label={capability.replace('_', ' ')} 
                              size="small" 
                              variant="outlined"
                            />
                          ))}
                          {model.capabilities.length > 2 && (
                            <Chip 
                              label={`+${model.capabilities.length - 2}`} 
                              size="small" 
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuClick(e, model)}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredModels.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          {/* Audit Log Tab */}
          <Box sx={{ mb: 2 }}>
            <Button
              variant="outlined"
              onClick={() => openAuditDialog()}
              startIcon={<HistoryIcon />}
            >
              Refresh Audit Log
            </Button>
          </Box>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Operation</TableCell>
                  <TableCell>Model</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Changes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {auditLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      {new Date(log.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={log.operation_type} 
                        size="small"
                        color={
                          log.operation_type === 'create' ? 'success' :
                          log.operation_type === 'update' ? 'info' :
                          log.operation_type === 'delete' ? 'error' : 'default'
                        }
                      />
                    </TableCell>
                    <TableCell>{log.model_name}</TableCell>
                    <TableCell>{log.user_name}</TableCell>
                    <TableCell>
                      {log.changes && Object.keys(log.changes).length > 0 ? (
                        <Tooltip title={JSON.stringify(log.changes, null, 2)}>
                          <Chip label={`${Object.keys(log.changes).length} fields`} size="small" />
                        </Tooltip>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Paper>
      
      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => setCreateDialogOpen(true)}
      >
        <AddIcon />
      </Fab>
      
      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { openViewDialog(menuModel); handleMenuClose(); }}>
          <ListItemIcon><ViewIcon /></ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { openEditDialog(menuModel); handleMenuClose(); }}>
          <ListItemIcon><EditIcon /></ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { openAuditDialog(menuModel); handleMenuClose(); }}>
          <ListItemIcon><HistoryIcon /></ListItemIcon>
          <ListItemText>Audit History</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { openDeleteDialog(menuModel); handleMenuClose(); }}>
          <ListItemIcon><DeleteIcon /></ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
      
      {/* Snackbars */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
      >
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      </Snackbar>
      
      <Snackbar
        open={!!success}
        autoHideDuration={4000}
        onClose={() => setSuccess('')}
      >
        <Alert severity="success" onClose={() => setSuccess('')}>
          {success}
        </Alert>
      </Snackbar>
      
      {/* Create Model Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New AI Model</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Model ID"
                value={formData.id}
                onChange={(e) => setFormData({...formData, id: e.target.value})}
                helperText="Unique identifier (lowercase, alphanumeric, hyphens, underscores)"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Model Name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Provider"
                value={formData.provider}
                onChange={(e) => setFormData({...formData, provider: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Version"
                value={formData.version}
                onChange={(e) => setFormData({...formData, version: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Capabilities</InputLabel>
                <Select
                  multiple
                  value={formData.capabilities}
                  onChange={(e) => setFormData({...formData, capabilities: e.target.value})}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value.replace('_', ' ')} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {capabilityOptions.map((capability) => (
                    <MenuItem key={capability} value={capability}>
                      {capability.replace('_', ' ')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Supported Industries</InputLabel>
                <Select
                  multiple
                  value={formData.supported_industries}
                  onChange={(e) => setFormData({...formData, supported_industries: e.target.value})}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value.replace('_', ' ')} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {industryOptions.map((industry) => (
                    <MenuItem key={industry} value={industry}>
                      {industry.replace('_', ' ').toUpperCase()}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="deprecated">Deprecated</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  />
                }
                label="Active"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_recommended}
                    onChange={(e) => setFormData({...formData, is_recommended: e.target.checked})}
                  />
                }
                label="Recommended"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateModel} 
            variant="contained"
            disabled={loading || !formData.id || !formData.name || !formData.provider}
          >
            {loading ? <CircularProgress size={20} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Edit Model Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit AI Model</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Model ID"
                value={formData.id}
                disabled
                helperText="Model ID cannot be changed"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Model Name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Provider"
                value={formData.provider}
                onChange={(e) => setFormData({...formData, provider: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Version"
                value={formData.version}
                onChange={(e) => setFormData({...formData, version: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Capabilities</InputLabel>
                <Select
                  multiple
                  value={formData.capabilities}
                  onChange={(e) => setFormData({...formData, capabilities: e.target.value})}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value.replace('_', ' ')} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {capabilityOptions.map((capability) => (
                    <MenuItem key={capability} value={capability}>
                      {capability.replace('_', ' ')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Supported Industries</InputLabel>
                <Select
                  multiple
                  value={formData.supported_industries}
                  onChange={(e) => setFormData({...formData, supported_industries: e.target.value})}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value.replace('_', ' ')} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {industryOptions.map((industry) => (
                    <MenuItem key={industry} value={industry}>
                      {industry.replace('_', ' ').toUpperCase()}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="deprecated">Deprecated</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  />
                }
                label="Active"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_recommended}
                    onChange={(e) => setFormData({...formData, is_recommended: e.target.checked})}
                  />
                }
                label="Recommended"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleUpdateModel} 
            variant="contained"
            disabled={loading || !formData.name || !formData.provider}
          >
            {loading ? <CircularProgress size={20} /> : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete AI Model</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the model "{selectedModel?.name}"?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This action cannot be undone. The model will be removed from all configurations.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleDeleteModel} 
            variant="contained" 
            color="error"
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* View Model Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Model Details</DialogTitle>
        <DialogContent>
          {selectedModel && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Model ID</Typography>
                <Typography>{selectedModel.id}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                <Typography>{selectedModel.name}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Provider</Typography>
                <Typography>{selectedModel.provider}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Version</Typography>
                <Typography>{selectedModel.version}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                <Typography>{selectedModel.description}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Capabilities</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                  {selectedModel.capabilities.map((capability) => (
                    <Chip key={capability} label={capability.replace('_', ' ')} size="small" />
                  ))}
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Supported Industries</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                  {selectedModel.supported_industries.map((industry) => (
                    <Chip key={industry} label={industry.replace('_', ' ')} size="small" />
                  ))}
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                <Chip 
                  label={selectedModel.status || 'active'} 
                  size="small"
                  color={
                    (selectedModel.status || 'active') === 'active' ? 'success' :
                    (selectedModel.status || 'active') === 'inactive' ? 'warning' : 'error'
                  }
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2" color="text.secondary">Active</Typography>
                <Typography>{selectedModel.is_active ? 'Yes' : 'No'}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2" color="text.secondary">Recommended</Typography>
                <Typography>{selectedModel.is_recommended ? 'Yes' : 'No'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Created At</Typography>
                <Typography>{new Date(selectedModel.created_at).toLocaleString()}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Updated At</Typography>
                <Typography>{new Date(selectedModel.updated_at).toLocaleString()}</Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      
      {/* Audit Dialog */}
      <Dialog open={auditDialogOpen} onClose={() => setAuditDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Model Audit History</DialogTitle>
        <DialogContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Operation</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Changes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {auditLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      {new Date(log.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={log.operation_type} 
                        size="small"
                        color={
                          log.operation_type === 'create' ? 'success' :
                          log.operation_type === 'update' ? 'info' :
                          log.operation_type === 'delete' ? 'error' : 'default'
                        }
                      />
                    </TableCell>
                    <TableCell>{log.user_name}</TableCell>
                    <TableCell>
                      {log.changes && Object.keys(log.changes).length > 0 ? (
                        <Tooltip title={JSON.stringify(log.changes, null, 2)}>
                          <Chip label={`${Object.keys(log.changes).length} fields`} size="small" />
                        </Tooltip>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAuditDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default LLMManagement;
