/**
 * Model Selection Dropdown Component for LLM Assessment
 */

import React, { useState, useEffect } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Chip,
  Avatar,
  Tooltip,
  CircularProgress,
  Alert,
  ListItemText,
  ListItemAvatar,
  Button,
  IconButton
} from '@mui/material';
import {
  Psychology as AIIcon,
  Recommend as RecommendedIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  RestartAlt as ResetIcon,
  Star as DefaultIcon
} from '@mui/icons-material';
import { useApi } from '../contexts/ApiContext';
import useModelSelection from '../hooks/useModelSelection';

const ModelSelectionDropdown = ({ 
  selectedModelId, 
  onModelChange, 
  industryProfile = 'financial_services',
  disabled = false,
  showModelInfo = true,
  size = 'medium'
}) => {
  const { apiCall } = useApi();
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Use the model selection hook for state management
  const {
    handleModelChange: handleHookModelChange,
    validateSelection,
    getRecentSelections,
    defaultModelId,
    isUsingDefault,
    autoSelectDefault,
    resetToDefault,
    setAsDefault
  } = useModelSelection(industryProfile);

  useEffect(() => {
    loadModels();
  }, [industryProfile]);

  // Auto-select default model when models load and no selection exists
  useEffect(() => {
    if (models.length > 0 && !selectedModelId) {
      const defaultModel = autoSelectDefault(models);
      if (defaultModel) {
        onModelChange(defaultModel);
      }
    }
  }, [models, selectedModelId, autoSelectDefault, onModelChange]);

  // Validate selection when models load
  useEffect(() => {
    if (models.length > 0 && selectedModelId) {
      validateSelection(models);
    }
  }, [models, selectedModelId, validateSelection]);

  const loadModels = async () => {
    setLoading(true);
    setError('');
    
    try {
      const result = await apiCall(`/api/v1/models?industry_profile=${industryProfile}`, 'GET');
      if (result.success) {
        setModels(result.data || []);
      } else {
        setError(result.error || 'Failed to load models');
      }
    } catch (err) {
      setError('Failed to load models');
    }
    
    setLoading(false);
  };

  const handleModelChangeInternal = (modelId) => {
    // Update local state via prop
    onModelChange(modelId);
    
    // Update persistent state via hook
    handleHookModelChange(modelId);
  };

  const getProviderColor = (provider) => {
    const colors = {
      'OpenAI': '#10a37f',
      'Anthropic': '#d97706',
      'Google': '#4285f4',
      'Meta': '#1877f2',
      'Mistral AI': '#ff6b35'
    };
    return colors[provider] || '#6b7280';
  };

  const getProviderIcon = (provider) => {
    // You could add specific provider icons here
    return <AIIcon />;
  };

  const selectedModel = models.find(model => model.id === selectedModelId);
  const recentSelections = getRecentSelections();

  if (loading) {
    return (
      <FormControl fullWidth size={size} disabled>
        <InputLabel>Loading models...</InputLabel>
        <Select value="">
          <MenuItem value="">
            <CircularProgress size={20} sx={{ mr: 2 }} />
            Loading available models...
          </MenuItem>
        </Select>
      </FormControl>
    );
  }

  if (error) {
    return (
      <Box>
        <FormControl fullWidth size={size} disabled error>
          <InputLabel>Model Selection</InputLabel>
          <Select value="">
            <MenuItem value="">Error loading models</MenuItem>
          </Select>
        </FormControl>
        <Alert 
          severity="error" 
          sx={{ mt: 1 }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={loadModels}
              startIcon={<RefreshIcon />}
            >
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <FormControl fullWidth size={size} disabled={disabled}>
          <InputLabel id="model-selection-label">
            AI Model for Assessment
          </InputLabel>
          <Select
            labelId="model-selection-label"
            value={selectedModelId || ''}
            label="AI Model for Assessment"
            onChange={(e) => handleModelChangeInternal(e.target.value)}
            renderValue={(value) => {
              if (!value) return 'Select a model...';
              const model = models.find(m => m.id === value);
              if (!model) return value;
              
              return (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar 
                    sx={{ 
                      width: 24, 
                      height: 24, 
                      bgcolor: getProviderColor(model.provider),
                      fontSize: '0.75rem'
                    }}
                  >
                    {model.provider.charAt(0)}
                  </Avatar>
                  <Typography variant="body2">
                    {model.name}
                  </Typography>
                  {model.is_recommended && (
                    <Chip 
                      label="Recommended" 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                      sx={{ height: 20, fontSize: '0.7rem' }}
                    />
                  )}
                  {isUsingDefault && (
                    <Chip 
                      icon={<DefaultIcon />}
                      label="Default" 
                      size="small" 
                      color="secondary" 
                      variant="outlined"
                      sx={{ height: 20, fontSize: '0.7rem' }}
                    />
                  )}
                </Box>
              );
            }}
          >
            {models.length === 0 ? (
              <MenuItem value="" disabled>
                <Typography color="text.secondary">
                  No models available for {industryProfile}
                </Typography>
              </MenuItem>
            ) : (
              models.map((model) => (
                <MenuItem key={model.id} value={model.id}>
                  <ListItemAvatar>
                    <Avatar 
                      sx={{ 
                        bgcolor: getProviderColor(model.provider),
                        width: 32,
                        height: 32
                      }}
                    >
                      {getProviderIcon(model.provider)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                          {model.name}
                        </Typography>
                        {model.is_recommended && (
                          <Tooltip title="Recommended for this industry">
                            <Chip 
                              icon={<RecommendedIcon />}
                              label="Recommended" 
                              size="small" 
                              color="primary" 
                              variant="outlined"
                            />
                          </Tooltip>
                        )}
                        {model.id === defaultModelId && (
                          <Tooltip title="Default model for this industry">
                            <Chip 
                              icon={<DefaultIcon />}
                              label="Default" 
                              size="small" 
                              color="secondary" 
                              variant="outlined"
                            />
                          </Tooltip>
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          {model.provider} • {model.version}
                        </Typography>
                        <br />
                        <Typography variant="caption" color="text.secondary">
                          {model.description}
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                          {model?.capabilities?.slice(0, 3).map((capability) => (
                            <Chip
                              key={capability}
                              label={capability.replace('_', ' ')}
                              size="small"
                              variant="outlined"
                              sx={{ height: 16, fontSize: '0.6rem' }}
                            />
                          ))}
                          {model?.capabilities?.length > 3 && (
                            <Typography variant="caption" color="text.secondary">
                              +{model.capabilities.length - 3} more
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    }
                  />
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>
        
        {/* Reset and Default Actions */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Tooltip title="Reset to default model">
            <IconButton 
              size="small" 
              onClick={() => {
                resetToDefault();
                onModelChange(defaultModelId || '');
              }}
              disabled={!defaultModelId || isUsingDefault}
            >
              <ResetIcon />
            </IconButton>
          </Tooltip>
          
          {selectedModelId && !isUsingDefault && (
            <Tooltip title="Set as default for this industry">
              <IconButton 
                size="small" 
                onClick={() => setAsDefault(selectedModelId)}
                color="secondary"
              >
                <DefaultIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Recent Selections */}
      {recentSelections.length > 0 && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Recent selections:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
            {recentSelections.map((entry, index) => {
              const model = models.find(m => m.id === entry.modelId);
              if (!model) return null;
              
              return (
                <Chip
                  key={`${entry.modelId}-${index}`}
                  label={model.name}
                  size="small"
                  variant="outlined"
                  onClick={() => handleModelChangeInternal(entry.modelId)}
                  sx={{ 
                    height: 20, 
                    fontSize: '0.7rem',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                />
              );
            })}
          </Box>
        </Box>
      )}

      {/* Model Information Display */}
      {showModelInfo && selectedModel && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <InfoIcon color="primary" fontSize="small" />
            <Typography variant="subtitle2" color="primary">
              Selected Model Information
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">Provider:</Typography>
              <Typography variant="body2">{selectedModel.provider}</Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">Version:</Typography>
              <Typography variant="body2">{selectedModel.version}</Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Typography variant="body2" color="text.secondary">Capabilities:</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, maxWidth: '60%', justifyContent: 'flex-end' }}>
                {selectedModel?.capabilities?.map((capability) => (
                  <Chip
                    key={capability}
                    label={capability.replace('_', ' ')}
                    size="small"
                    variant="outlined"
                    sx={{ height: 18, fontSize: '0.65rem' }}
                  />
                ))}
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">Industry Support:</Typography>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {selectedModel?.supported_industries?.includes(industryProfile) ? (
                  <Chip 
                    label="Supported" 
                    size="small" 
                    color="success" 
                    variant="outlined"
                    sx={{ height: 18, fontSize: '0.65rem' }}
                  />
                ) : (
                  <Chip 
                    label="Limited Support" 
                    size="small" 
                    color="warning" 
                    variant="outlined"
                    sx={{ height: 18, fontSize: '0.65rem' }}
                  />
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default ModelSelectionDropdown;
