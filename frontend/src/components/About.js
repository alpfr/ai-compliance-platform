import React from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  Divider,
  Chip,
  Avatar,
  Button
} from '@mui/material';
import {
  Security as SecurityIcon,
  Psychology as PsychologyIcon,
  Dashboard as DashboardIcon,
  Timeline as TimelineIcon,
  BusinessCenter as BusinessIcon,
  Gavel as GavelIcon,
  CheckCircle as CheckCircleIcon,
  RocketLaunch as RocketIcon
} from '@mui/icons-material';

export default function About() {
  const valueProps = [
    {
      icon: <SecurityIcon />,
      title: "Real-Time Guardrails",
      description: "Actively intercept and block PII leaks and dangerous prompt injection before they reach the LLM layer."
    },
    {
      icon: <PsychologyIcon />,
      title: "LLM Model Registry",
      description: "Centrally manage approved AI capabilities and map them strictly to authorized industries."
    },
    {
      icon: <DashboardIcon />,
      title: "Executive Command Center",
      description: "Equip leadership with real-time visual KPIs, global risk heatmaps, and continuous compliance scoring."
    },
    {
      icon: <TimelineIcon />,
      title: "Immutable Audit Trails",
      description: "Produce regulatory-grade, cryptographically complete logs of every single generative AI interaction."
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      {/* Header Section */}
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 800, color: 'primary.main' }}>
          AI Compliance Platform
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: '800px', mx: 'auto' }}>
          Bridging the gap between internal AI builders pushing for velocity, and compliance bodies requiring total oversight.
        </Typography>
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Chip label="Version: 1.0.0-MVP" color="primary" variant="outlined" />
          <Button 
            variant="contained" 
            color="secondary" 
            href="mailto:demo@example.com?subject=Inquiry: AI Compliance Platform Demo"
            sx={{ borderRadius: 6, px: 3, fontWeight: 'bold' }}
          >
            Request a Live Demo
          </Button>
        </Box>
      </Box>

      {/* The Pitch Section */}
      <Paper elevation={3} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, mb: 6, background: 'linear-gradient(145deg, rgba(0,30,60,1) 0%, rgba(10,25,41,1) 100%)' }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ bgcolor: 'error.main', mr: 2 }}><GavelIcon /></Avatar>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>The Problem</Typography>
            </Box>
            <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
              Enterprise AI adoption is accelerating at breakneck speeds, but regulatory scrutiny is catching up even faster. Between the incoming EU AI Act, HIPAA, SOC 2, and strict financial regulations, organizations are deploying Large Language Models (LLMs) completely blind to the liabilities of data privacy leaks, biased inferences, and hallucinated regulatory violations.
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}><RocketIcon /></Avatar>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>The Solution</Typography>
            </Box>
            <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
              The AI Compliance Platform is a unified, dual-mode enterprise governance engine designed to continuously monitor, restrict, and audit generative AI operations. It gives enterprises the infrastructure to ship powerful generative AI at maximum velocity, with the cryptographic assurance that their data and reputation are structurally protected.
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Core Value Propositions */}
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 700 }}>Core Features</Typography>
      <Grid container spacing={3} sx={{ mb: 8 }}>
        {valueProps.map((prop, index) => (
          <Grid item xs={12} sm={6} key={index}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent>
                <Avatar sx={{ bgcolor: 'rgba(144, 202, 249, 0.1)', color: 'primary.main', width: 56, height: 56, mb: 2 }}>
                  {prop.icon}
                </Avatar>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  {prop.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {prop.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Usage Guide */}
      <Divider sx={{ mb: 6 }} />
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 4, fontWeight: 700 }}>MVP Usage Guide</Typography>
        
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 4, height: '100%', borderRadius: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <BusinessIcon sx={{ color: 'secondary.main', mr: 2, fontSize: 32 }} />
                <Typography variant="h5" sx={{ fontWeight: 600 }}>Organizations & Enterprises</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" paragraph>
                Conduct comprehensive self-assessments and actively control LLM traffic output.
              </Typography>
              <List dense>
                {['Create Assessments utilizing standardized AI risk frameworks.',
                  'Configure RegEx & Semantic Guardrails for real-time traffic interception.',
                  'Govern authorized AI Models strictly approved for enterprise usage.',
                  'Monitor automated compliance scoring through the primary dashboard.',
                  'Review Immutable Audit Trails for total historical event recreation.'].map((text, i) => (
                  <ListItem key={i} sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}><CheckCircleIcon color="primary" fontSize="small" /></ListItemIcon>
                    <ListItemText primary={text} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 4, height: '100%', borderRadius: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <GavelIcon sx={{ color: 'secondary.main', mr: 2, fontSize: 32 }} />
                <Typography variant="h5" sx={{ fontWeight: 600 }}>Regulatory Agencies</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" paragraph>
                Achieve a God's-eye view over interconnected corporate jurisdictions to audit systemic risk.
              </Typography>
              <List dense>
                {['Establish overarching compliance assessments across internal boundaries.',
                  'Actively monitor global compliance scoring across multiple organizations.',
                  'Audit system-wide guardrail violations via aggregated analytical ledgers.',
                  'Track Model Registry adoption natively through the Executive Command Center.',
                  'Export secure, read-only audit footprints for official regulatory review.'].map((text, i) => (
                  <ListItem key={i} sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}><CheckCircleIcon color="success" fontSize="small" /></ListItemIcon>
                    <ListItemText primary={text} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        </Grid>
      </Box>
      
      <Box sx={{ mt: 8, textAlign: 'center', pt: 4, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>Ready to Secure Your AI Infrastructure?</Typography>
        <Button 
            variant="contained" 
            color="primary" 
            size="large"
            href="mailto:demo@example.com?subject=Inquiry: AI Compliance Platform Demo"
            sx={{ borderRadius: 8, px: 6, py: 1.5, mb: 4, fontSize: '1.1rem', fontWeight: 'bold' }}
        >
            Contact Me for a Demo
        </Button>
        <Typography variant="body2" color="text.secondary">
          © 2026 AI Compliance Platform. Powered by deep agentic intelligence.
        </Typography>
      </Box>
    </Container>
  );
}
