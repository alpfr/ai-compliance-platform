/**
 * Executive Summary Component - High-level overview for C-suite
 */

import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Avatar,
  LinearProgress,
  Divider
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Assessment as AssessmentIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

function ExecutiveKPI({ title, current, previous, target, unit = '', trend }) {
  const trendDirection = current > previous ? 'up' : 'down';
  const trendColor = trend === 'positive' 
    ? (trendDirection === 'up' ? 'success' : 'error')
    : (trendDirection === 'up' ? 'error' : 'success');
  
  const progressValue = target ? (current / target) * 100 : 0;

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h6" color="text.secondary">
            {title}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {trendDirection === 'up' ? (
              <TrendingUpIcon sx={{ color: `${trendColor}.main`, fontSize: 20 }} />
            ) : (
              <TrendingDownIcon sx={{ color: `${trendColor}.main`, fontSize: 20 }} />
            )}
            <Typography variant="caption" sx={{ ml: 0.5, fontWeight: 'bold', color: `${trendColor}.main` }}>
              {Math.abs(((current - previous) / previous) * 100).toFixed(1)}%
            </Typography>
          </Box>
        </Box>
        
        <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
          {current}{unit}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Previous: {previous}{unit} | Target: {target}{unit}
        </Typography>
        
        {target && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption">Progress to Target</Typography>
              <Typography variant="caption">{progressValue.toFixed(0)}%</Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.min(progressValue, 100)}
              color={progressValue >= 100 ? 'success' : progressValue >= 75 ? 'warning' : 'error'}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

function RiskHeatmap({ risks }) {
  const getRiskLevel = (impact, probability) => {
    const score = impact * probability;
    if (score >= 16) return { level: 'Critical', color: 'error' };
    if (score >= 9) return { level: 'High', color: 'warning' };
    if (score >= 4) return { level: 'Medium', color: 'info' };
    return { level: 'Low', color: 'success' };
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Risk Heat Map
        </Typography>
        <Grid container spacing={1}>
          {risks.map((risk, index) => {
            const riskAssessment = getRiskLevel(risk.impact, risk.probability);
            return (
              <Grid item xs={6} key={index}>
                <Box sx={{ 
                  p: 2, 
                  border: 1, 
                  borderColor: `${riskAssessment.color}.main`,
                  borderRadius: 1,
                  bgcolor: `${riskAssessment.color}.light`,
                  opacity: 0.8
                }}>
                  <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                    {risk.category}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {riskAssessment.level}
                  </Typography>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </CardContent>
    </Card>
  );
}

export default function ExecutiveSummary({ data }) {
  const executiveKPIs = [
    {
      title: 'Compliance Score',
      current: data?.compliance_score || 87,
      previous: 82,
      target: 95,
      unit: '%',
      trend: 'positive'
    },
    {
      title: 'Risk Incidents',
      current: data?.risk_incidents || 3,
      previous: 7,
      target: 0,
      unit: '',
      trend: 'negative'
    },
    {
      title: 'Assessment Coverage',
      current: data?.assessment_coverage || 94,
      previous: 89,
      target: 100,
      unit: '%',
      trend: 'positive'
    },
    {
      title: 'Response Time',
      current: data?.avg_response_time || 2.1,
      previous: 3.2,
      target: 1.5,
      unit: 'h',
      trend: 'negative'
    }
  ];

  const riskData = [
    { category: 'Data Privacy', impact: 4, probability: 2 },
    { category: 'AI Bias', impact: 3, probability: 3 },
    { category: 'Regulatory', impact: 5, probability: 2 },
    { category: 'Operational', impact: 2, probability: 4 }
  ];

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
        Executive Summary
      </Typography>
      
      <Grid container spacing={3}>
        {/* Executive KPIs */}
        {executiveKPIs.map((kpi, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <ExecutiveKPI {...kpi} />
          </Grid>
        ))}
        
        {/* Risk Heatmap */}
        <Grid item xs={12} md={6}>
          <RiskHeatmap risks={riskData} />
        </Grid>
        
        {/* Strategic Initiatives */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Strategic Initiatives
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: 'success.main', width: 32, height: 32, mr: 2 }}>
                      <CheckCircleIcon fontSize="small" />
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        EU AI Act Compliance
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Implementation phase
                      </Typography>
                    </Box>
                  </Box>
                  <Chip label="85%" color="success" size="small" />
                </Box>
                
                <Divider />
                
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: 'warning.main', width: 32, height: 32, mr: 2 }}>
                      <SpeedIcon fontSize="small" />
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        Bias Detection Enhancement
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Development phase
                      </Typography>
                    </Box>
                  </Box>
                  <Chip label="62%" color="warning" size="small" />
                </Box>
                
                <Divider />
                
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: 'info.main', width: 32, height: 32, mr: 2 }}>
                      <SecurityIcon fontSize="small" />
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        Zero Trust Architecture
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Planning phase
                      </Typography>
                    </Box>
                  </Box>
                  <Chip label="23%" color="info" size="small" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
