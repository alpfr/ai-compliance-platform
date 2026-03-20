/**
 * Custom hook for managing model selection state with persistence
 */

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'ai-compliance-model-selection';

const useModelSelection = (industryProfile = 'financial_services') => {
  const [selectedModelId, setSelectedModelId] = useState('');
  const [modelHistory, setModelHistory] = useState([]);
  const [defaultModelId, setDefaultModelId] = useState('');

  // Load persisted state on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        
        // Check if we have a model for this industry profile
        if (data.selections && data.selections[industryProfile]) {
          setSelectedModelId(data.selections[industryProfile]);
        }
        
        // Load model history
        if (data.history) {
          setModelHistory(data.history);
        }

        // Load default model for this industry
        if (data.defaults && data.defaults[industryProfile]) {
          setDefaultModelId(data.defaults[industryProfile]);
        }
      }
    } catch (error) {
      console.warn('Failed to load model selection from localStorage:', error);
    }
  }, [industryProfile]);

  // Persist state changes
  const persistState = useCallback((modelId, profile, isDefault = false) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      let data = stored ? JSON.parse(stored) : { selections: {}, history: [], defaults: {} };
      
      // Update selection for this industry profile
      if (!data.selections) data.selections = {};
      data.selections[profile] = modelId;
      
      // Update default if specified
      if (isDefault) {
        if (!data.defaults) data.defaults = {};
        data.defaults[profile] = modelId;
      }
      
      // Update history (keep last 10 selections)
      if (!data.history) data.history = [];
      const historyEntry = {
        modelId,
        industryProfile: profile,
        timestamp: new Date().toISOString(),
        isDefault
      };
      
      // Remove duplicate entries for same model/industry combo
      data.history = data.history.filter(
        entry => !(entry.modelId === modelId && entry.industryProfile === profile)
      );
      
      // Add new entry and limit to 10 items
      data.history.unshift(historyEntry);
      data.history = data.history.slice(0, 10);
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to persist model selection to localStorage:', error);
    }
  }, []);

  // Handle model selection change
  const handleModelChange = useCallback((modelId) => {
    setSelectedModelId(modelId);
    persistState(modelId, industryProfile);
  }, [industryProfile, persistState]);

  // Set default model for current industry
  const setAsDefault = useCallback((modelId) => {
    setDefaultModelId(modelId);
    setSelectedModelId(modelId);
    persistState(modelId, industryProfile, true);
  }, [industryProfile, persistState]);

  // Use default model
  const useDefault = useCallback(() => {
    if (defaultModelId) {
      setSelectedModelId(defaultModelId);
      persistState(defaultModelId, industryProfile);
    }
  }, [defaultModelId, industryProfile, persistState]);

  // Auto-select recommended model as default
  const autoSelectDefault = useCallback((availableModels) => {
    if (!availableModels || availableModels.length === 0) return null;
    
    // First, try to find a recommended model for this industry
    const recommendedModel = availableModels.find(model => 
      model.is_recommended && 
      model.supported_industries.includes(industryProfile)
    );
    
    if (recommendedModel) {
      setAsDefault(recommendedModel.id);
      return recommendedModel.id;
    }
    
    // If no recommended model, use the first available model
    const firstModel = availableModels.find(model =>
      model.supported_industries?.includes(industryProfile)
    );
    
    if (firstModel) {
      setAsDefault(firstModel.id);
      return firstModel.id;
    }
    
    return null;
  }, [industryProfile, setAsDefault]);

  // Reset selection for current industry
  const resetSelection = useCallback(() => {
    setSelectedModelId('');
    persistState('', industryProfile);
  }, [industryProfile, persistState]);

  // Reset to default
  const resetToDefault = useCallback(() => {
    if (defaultModelId) {
      setSelectedModelId(defaultModelId);
      persistState(defaultModelId, industryProfile);
    } else {
      resetSelection();
    }
  }, [defaultModelId, industryProfile, persistState, resetSelection]);

  // Clear all selections and history
  const clearAllSelections = useCallback(() => {
    setSelectedModelId('');
    setModelHistory([]);
    setDefaultModelId('');
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear model selection from localStorage:', error);
    }
  }, []);

  // Get selection for a specific industry profile
  const getSelectionForIndustry = useCallback((profile) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        return data.selections?.[profile] || '';
      }
    } catch (error) {
      console.warn('Failed to get selection for industry:', error);
    }
    return '';
  }, []);

  // Get default for a specific industry profile
  const getDefaultForIndustry = useCallback((profile) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        return data.defaults?.[profile] || '';
      }
    } catch (error) {
      console.warn('Failed to get default for industry:', error);
    }
    return '';
  }, []);

  // Get recent selections for current industry
  const getRecentSelections = useCallback(() => {
    return modelHistory
      .filter(entry => entry.industryProfile === industryProfile)
      .slice(0, 5); // Last 5 selections for this industry
  }, [modelHistory, industryProfile]);

  // Validate model selection (check if model still exists and supports industry)
  const validateSelection = useCallback(async (availableModels) => {
    if (!selectedModelId || !availableModels) return true;
    
    const model = availableModels.find(m => m.id === selectedModelId);
    if (!model) {
      // Model no longer exists, try to use default or clear selection
      if (defaultModelId) {
        const defaultModel = availableModels.find(m => m.id === defaultModelId);
        if (defaultModel && defaultModel.supported_industries?.includes(industryProfile)) {
          setSelectedModelId(defaultModelId);
          return true;
        }
      }
      resetSelection();
      return false;
    }
    
    if (!model.supported_industries?.includes(industryProfile)) {
      // Model doesn't support current industry, try default or clear selection
      if (defaultModelId) {
        const defaultModel = availableModels.find(m => m.id === defaultModelId);
        if (defaultModel && defaultModel.supported_industries?.includes(industryProfile)) {
          setSelectedModelId(defaultModelId);
          return true;
        }
      }
      resetSelection();
      return false;
    }
    
    return true;
  }, [selectedModelId, defaultModelId, industryProfile, resetSelection]);

  // Check if current selection is the default
  const isUsingDefault = selectedModelId === defaultModelId;

  return {
    selectedModelId,
    modelHistory,
    defaultModelId,
    isUsingDefault,
    handleModelChange,
    setAsDefault,
    useDefault,
    autoSelectDefault,
    resetSelection,
    resetToDefault,
    clearAllSelections,
    getSelectionForIndustry,
    getDefaultForIndustry,
    getRecentSelections,
    validateSelection
  };
};

export default useModelSelection;
