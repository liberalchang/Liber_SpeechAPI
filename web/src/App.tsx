import { useState, useMemo, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import { ThemeProvider, CssBaseline, AppBar, Toolbar, Typography, Button, Box, IconButton, Container, useMediaQuery } from '@mui/material'
import { Brightness4, Brightness7, Mic, VolumeUp, Description, Settings } from '@mui/icons-material'
import TtsPage from './pages/TtsPage'
import AsrPage from './pages/AsrPage'
import DocsPage from './pages/DocsPage'
import SettingsPage from './pages/SettingsPage'
import { lightTheme, darkTheme } from './theme'
import './App.css'

function Navigation() {
  const location = useLocation();
  
  const navItems = [
    { path: '/tts', label: '文字转语音', icon: <VolumeUp sx={{ mr: 1 }} /> },
    { path: '/asr', label: '语音转文字', icon: <Mic sx={{ mr: 1 }} /> },
    { path: '/docs', label: '文档', icon: <Description sx={{ mr: 1 }} /> },
    { path: '/settings', label: '设置', icon: <Settings sx={{ mr: 1 }} /> },
  ];

  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      {navItems.map((item) => (
        <Button
          key={item.path}
          component={Link}
          to={item.path}
          color={location.pathname === item.path ? 'primary' : 'inherit'}
          variant={location.pathname === item.path ? 'contained' : 'text'}
          sx={{
            borderRadius: 2,
            px: 2,
            opacity: location.pathname === item.path ? 1 : 0.8,
            '&:hover': {
              opacity: 1,
            }
          }}
        >
          {item.icon}
          {item.label}
        </Button>
      ))}
    </Box>
  );
}

function App() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [mode, setMode] = useState<'light' | 'dark'>(() => {
    const savedMode = localStorage.getItem('themeMode');
    return (savedMode as 'light' | 'dark') || (prefersDarkMode ? 'dark' : 'light');
  });

  const theme = useMemo(() => (mode === 'light' ? lightTheme : darkTheme), [mode]);

  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  const toggleColorMode = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
          <AppBar position="sticky" color="inherit" elevation={1} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Toolbar sx={{ justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography 
                  variant="h6" 
                  component={Link} 
                  to="/"
                  sx={{ 
                    textDecoration: 'none', 
                    color: 'primary.main',
                    fontWeight: 'bold',
                    mr: 4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <Box 
                    sx={{ 
                      width: 32, 
                      height: 32, 
                      borderRadius: 1, 
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: 20
                    }}
                  >
                    L
                  </Box>
                  Liber Speech
                </Typography>
                
                <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                  <Navigation />
                </Box>
              </Box>

              <IconButton sx={{ ml: 1 }} onClick={toggleColorMode} color="inherit">
                {theme.palette.mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
              </IconButton>
            </Toolbar>
            
            {/* Mobile Navigation */}
            <Box sx={{ display: { xs: 'block', md: 'none' }, borderTop: 1, borderColor: 'divider', p: 1, overflowX: 'auto' }}>
              <Navigation />
            </Box>
          </AppBar>

          <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 4 } }}>
            <Container maxWidth="xl">
              <Routes>
                <Route path="/tts" element={<TtsPage />} />
                <Route path="/asr" element={<AsrPage />} />
                <Route path="/docs" element={<DocsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/" element={
                  <Box sx={{ textAlign: 'center', py: 10 }}>
                    <Typography variant="h2" gutterBottom color="primary.main" fontWeight="bold">
                      Liber Speech API
                    </Typography>
                    <Typography variant="h5" color="text.secondary" sx={{ mb: 6 }}>
                      强大的语音识别与合成服务
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, flexWrap: 'wrap' }}>
                      <Button component={Link} to="/tts" variant="contained" size="large" startIcon={<VolumeUp />} sx={{ px: 4, py: 1.5, borderRadius: 3 }}>
                        文字转语音
                      </Button>
                      <Button component={Link} to="/asr" variant="outlined" size="large" startIcon={<Mic />} sx={{ px: 4, py: 1.5, borderRadius: 3 }}>
                        语音转文字
                      </Button>
                    </Box>
                  </Box>
                } />
              </Routes>
            </Container>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  )
}

export default App
