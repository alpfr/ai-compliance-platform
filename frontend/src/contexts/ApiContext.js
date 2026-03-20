/**
 * API Context for AI Compliance Platform
 */

import React, { createContext, useContext } from 'react';
import axios from 'axios';

const ApiContext = createContext();

export function useApi() {
  return useContext(ApiContext);
}

export function ApiProvider({ children }) {
  // Organizations API
  const getOrganizations = async () => {
    try {
      const response = await axios.get('/organizations');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to fetch organizations' };
    }
  };

  const createOrganization = async (orgData) => {
    try {
      const response = await axios.post('/organizations', orgData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to create organization' };
    }
  };

  // Assessments API
  const getAssessments = async () => {
    try {
      const response = await axios.get('/assessments');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to fetch assessments' };
    }
  };

  const createAssessment = async (assessmentData) => {
    try {
      const response = await axios.post('/assessments', assessmentData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to create assessment' };
    }
  };

  const updateAssessment = async (assessmentId, assessmentData) => {
    try {
      const response = await axios.put(`/assessments/${assessmentId}`, assessmentData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to update assessment' };
    }
  };

  // Guardrails API
  const getGuardrails = async () => {
    try {
      const response = await axios.get('/guardrails');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to fetch guardrails' };
    }
  };

  const createGuardrail = async (guardrailData) => {
    try {
      const response = await axios.post('/guardrails', guardrailData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to create guardrail' };
    }
  };

  const filterContent = async (content, context = {}, industryProfile = 'financial_services', jurisdiction = 'US') => {
    try {
      const response = await axios.post('/guardrails/filter', {
        content,
        context,
        industry_profile: industryProfile,
        jurisdiction
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to filter content' };
    }
  };

  // Dashboard API
  const getDashboardData = async () => {
    try {
      const response = await axios.get('/compliance/dashboard');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to fetch dashboard data' };
    }
  };

  // Audit Trail API
  const getAuditTrail = async (limit = 100) => {
    try {
      const response = await axios.get(`/audit-trail?limit=${limit}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to fetch audit trail' };
    }
  };

  const value = {
    // Organizations
    getOrganizations,
    createOrganization,
    
    // Assessments
    getAssessments,
    createAssessment,
    updateAssessment,
    
    // Guardrails
    getGuardrails,
    createGuardrail,
    filterContent,
    
    // Dashboard
    getDashboardData,
    
    // Audit Trail
    getAuditTrail
  };

  return (
    <ApiContext.Provider value={value}>
      {children}
    </ApiContext.Provider>
  );
}