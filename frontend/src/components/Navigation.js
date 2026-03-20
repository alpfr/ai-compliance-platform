/**
 * Navigation Component for AI Compliance Platform
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Chip
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Assessment as AssessmentIcon,
  Security as SecurityIcon,
  Business as BusinessIcon,
  History as HistoryIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const drawerWidth = 240;

export default function Navigation() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Assessments', icon: <AssessmentIcon />, path: '/assessments' },
    { text: 'Guardrails', icon: <SecurityIcon />, path: '/guardrails' },
    ...(user?.role === 'regulatory_inspector' ? [
      { text: 'Organizations', icon: <BusinessIcon />, path: '/organizations' }
    ] : []),
    { text: 'Audit Trail', icon: <HistoryIcon />, path: '/audit-trail' }
  ];

  const getRoleColor = (role) => {
    switch (role) {
      case 'regulatory_inspector':
        return 'error';
      case 'organization_admin':
        return 'primary';
      default:
        return 'default';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'regulatory_inspector':
        return 'Regulatory Inspector';
      case 'organization_admin':
        return 'Organization Admin';
      default:
        return role;
    }
  };

  return (
    <>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            AI Compliance Platform
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip
              label={getRoleLabel(user?.role)}
              color={getRoleColor(user?.role)}
              size="small"
            />
            <Typography variant="body2">
              {user?.username}
            </Typography>
            <Button color="inherit" onClick={handleLogout} startIcon={<LogoutIcon />}>
              Logout
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => navigate(item.path)}
                >
                  <ListItemIcon>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
    </>
  );
}