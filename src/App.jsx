import { useState, useEffect } from 'react'
import { tools } from './data/tools'
import { getIconPath } from './data/icons'

// Material UI imports
import { 
  ThemeProvider, 
  createTheme, 
  CssBaseline, 
  AppBar, 
  Toolbar, 
  Typography, 
  Container, 
  Grid, 
  Paper, 
  Card, 
  CardContent, 
  CardMedia, 
  CardActionArea, 
  Chip, 
  Button, 
  Box, 
  Alert, 
  LinearProgress,
  Stack,
  Divider,
  IconButton
} from '@mui/material'

// Material UI Icons
import DownloadIcon from '@mui/icons-material/Download'
import DownloadDoneIcon from '@mui/icons-material/DownloadDone'
import SettingsIcon from '@mui/icons-material/Settings'
import CloseIcon from '@mui/icons-material/Close'

// Debug information
console.log('Electron API available:', !!window.electronAPI)

// Check if we're running in Electron with a more reliable method
const isElectron = window.electronAPI?.isElectron || false

// Log app info if available
if (isElectron && window.electronAPI.getAppInfo) {
  const appInfo = window.electronAPI.getAppInfo()
  console.log('Running in Electron:', appInfo)
}

// Create a Material UI theme with blue primary color
const theme = createTheme({
  palette: {
    primary: {
      main: '#2563eb',
    },
    secondary: {
      main: '#10b981',
    },
    error: {
      main: '#ef4444',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", sans-serif',
    h1: {
      fontSize: '2.2rem',
      fontWeight: 600,
      color: '#2563eb',
    },
    h2: {
      fontSize: '1.3rem',
      fontWeight: 600,
      color: '#2563eb',
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          },
        },
      },
    },
  },
})

// Group tools by category
const getToolsByCategory = () => {
  const categories = {};
  
  tools.forEach(tool => {
    if (!categories[tool.category]) {
      categories[tool.category] = [];
    }
    categories[tool.category].push(tool);
  });
  
  return categories;
};

// Calculate column distribution for a balanced 3-column layout
const distributeCategories = () => {
  const categories = getToolsByCategory();
  const categoryNames = Object.keys(categories);
  const columns = [[], [], []];
  
  let totalTools = tools.length;
  let toolsPerColumn = Math.ceil(totalTools / 3);
  
  let currentColumn = 0;
  let currentCount = 0;
  
  categoryNames.forEach(category => {
    if (currentCount + categories[category].length > toolsPerColumn && currentColumn < 2) {
      currentColumn++;
      currentCount = 0;
    }
    
    columns[currentColumn].push(category);
    currentCount += categories[category].length;
  });
  
  return columns;
};

function App() {
  const [selectedTools, setSelectedTools] = useState([])
  const [installing, setInstalling] = useState(false)
  const [progress, setProgress] = useState({})
  const [error, setError] = useState(null)
  const [columns] = useState(distributeCategories())

  useEffect(() => {
    // Only set up electron listeners if electronAPI is available
    if (isElectron) {
      try {
        // Using the improved listener with proper cleanup function
        const removeProgressListener = window.electronAPI.onProgress((data) => {
          setProgress(prev => ({
            ...prev,
            [data.tool]: { status: data.status, message: data.message }
          }))
        })
        
        return () => {
          // Clean up listener when component unmounts
          if (removeProgressListener) {
            removeProgressListener()
          } else {
            // Fallback to the old method if the new one isn't available
            window.electronAPI.removeAllListeners('installation-progress')
          }
        }
      } catch (err) {
        console.error('Error setting up Electron listeners:', err)
        setError('Failed to connect to Electron process')
      }
    }
  }, [isElectron])

  const handleToolSelect = (tool) => {
    setSelectedTools(prev => {
      if (prev.find(t => t.id === tool.id)) {
        return prev.filter(t => t.id !== tool.id)
      }
      return [...prev, tool]
    })
  }

  const handleInstall = () => {
    if (!isElectron) {
      setError('This application requires Electron to install tools.')
      return
    }
    
    try {
      setInstalling(true)
      window.electronAPI.sendMessage('install-tools', selectedTools)
    } catch (err) {
      console.error('Error sending install message:', err)
      setError('Failed to start installation process')
      setInstalling(false)
    }
  }

  const handleInstallAll = () => {
    if (!isElectron) {
      setError('This application requires Electron to install tools.')
      return
    }
    
    try {
      setSelectedTools(tools)
      setInstalling(true)
      window.electronAPI.sendMessage('install-tools', tools)
    } catch (err) {
      console.error('Error sending install all message:', err)
      setError('Failed to start installation process')
      setInstalling(false)
    }
  }

  // Helper function to render a tool card with Material UI
  const renderToolCard = (tool) => {
    const isSelected = selectedTools.find(t => t.id === tool.id);
    const toolProgress = progress[tool.name];
    
    // Calculate progress value for progress bar (0-100)
    let progressValue = 0;
    let progressColor = 'primary';
    
    if (toolProgress) {
      if (toolProgress.status === 'installing') {
        progressValue = -1; // For indeterminate progress
        progressColor = 'primary';
      } else if (toolProgress.status === 'success') {
        progressValue = 100;
        progressColor = 'success';
      } else if (toolProgress.status === 'error') {
        progressValue = 100;
        progressColor = 'error';
      }
    }
    
    return (
      <Card 
        key={tool.id}
        variant="outlined"
        sx={{
          mb: 1.5,
          borderColor: isSelected ? 'primary.main' : 'divider',
          bgcolor: isSelected ? 'primary.lighter' : 'background.paper',
          position: 'relative',
          overflow: 'visible',
        }}
      >
        {toolProgress && (
          <LinearProgress 
            variant={progressValue < 0 ? 'indeterminate' : 'determinate'}
            value={progressValue < 0 ? undefined : progressValue}
            color={progressColor}
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              borderTopLeftRadius: '8px',
              borderTopRightRadius: '8px',
            }}
          />
        )}
        
        <CardActionArea onClick={() => !installing && handleToolSelect(tool)} disabled={installing}>
          <Box sx={{ display: 'flex', p: 1.5, alignItems: 'center' }}>
            <CardMedia
              component="img"
              sx={{ width: 40, height: 40, objectFit: 'contain', mr: 2 }}
              image={getIconPath(tool.id)}
              alt={tool.name}
            />
            
            <CardContent sx={{ flex: '1 0 auto', p: 0 }}>
              <Typography variant="h6" component="div" noWrap>
                {tool.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {tool.category}
              </Typography>
            </CardContent>
            
            {toolProgress && (
              <Chip 
                label={toolProgress.status}
                color={toolProgress.status === 'success' ? 'success' : 
                       toolProgress.status === 'error' ? 'error' : 'primary'}
                size="small"
                sx={{ ml: 1 }}
                title={toolProgress.message}
              />
            )}
          </Box>
        </CardActionArea>
      </Card>
    );
  };
  
  // Get categories for the layout
  const categories = getToolsByCategory();
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      
      <AppBar position="static" color="primary" elevation={0}>
        <Toolbar>
          <SettingsIcon sx={{ mr: 2 }} />
          <Box sx={{ flexGrow: 1, p: 3, width: '100%', maxWidth: '100%' }}>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Gaston Developer Tools Installer
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth={false} disableGutters sx={{ mt: 4, mb: 4, px: 2, width: '100%' }}>
        {!isElectron && (
          <Alert 
            severity="warning" 
            sx={{ mb: 3 }}
          >
            Running in browser mode. Installation features require the Electron app.
          </Alert>
        )}
        
        {error && (
          <Alert 
            severity="error" 
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={() => setError(null)}
              >
                <CloseIcon fontSize="inherit" />
              </IconButton>
            }
            sx={{ mb: 3 }}
          >
            {error}
          </Alert>
        )}
        
        <Typography variant="h4" component="h1" align="center" gutterBottom>
          Gaston Developer Tools Installer
        </Typography>
        
        <Typography variant="subtitle1" color="text.secondary" align="center" gutterBottom sx={{ mb: 4 }}>
          Select the tools you want to install
        </Typography>
        
        <Grid container spacing={3} sx={{ width: '100%', ml: 0, mr: 0 }}>
          {columns.map((columnCategories, columnIndex) => (
            <Grid item xs={12} md={4} key={`column-${columnIndex}`} sx={{ width: '33.333%', px: 1 }}>
              {columnCategories.map(category => (
                <Paper 
                  key={category} 
                  elevation={0} 
                  variant="outlined" 
                  sx={{ p: 2, mb: 3 }}
                >
                  <Typography variant="h6" component="h2" color="primary" gutterBottom>
                    {category}
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Stack spacing={1}>
                    {categories[category].map(tool => renderToolCard(tool))}
                  </Stack>
                </Paper>
              ))}
            </Grid>
          ))}
        </Grid>
        
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: 2, 
            mt: 4,
            position: 'sticky',
            bottom: 16,
            zIndex: 10,
          }}
        >
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleInstall}
            disabled={installing || selectedTools.length === 0}
            color="primary"
            size="large"
          >
            Install Selected ({selectedTools.length})
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<DownloadDoneIcon />}
            onClick={handleInstallAll}
            disabled={installing}
            color="primary"
            size="large"
          >
            Install All
          </Button>
        </Box>
        
        {installing && (
          <Paper 
            elevation={3} 
            sx={{ 
              p: 3, 
              mt: 4, 
              textAlign: 'center',
              background: 'linear-gradient(to right, #e0f2fe, #eff6ff)',
              borderRadius: 2,
            }}
          >
            <Typography variant="h6" gutterBottom color="primary">
              Installation in progress...
            </Typography>
            
            <Typography variant="body2" paragraph>
              Please wait while the selected tools are being installed.
            </Typography>
            
            <Box sx={{ width: '100%', mt: 2 }}>
              <Typography variant="body2" align="center" gutterBottom>
                {Object.values(progress).filter(p => p.status === 'success').length} / {selectedTools.length} completed
              </Typography>
              
              <LinearProgress 
                variant="determinate" 
                value={(Object.values(progress).filter(p => p.status === 'success').length / selectedTools.length) * 100}
                sx={{ height: 10, borderRadius: 5 }}
              />
            </Box>
          </Paper>
        )}
      </Container>
    </ThemeProvider>
  )
}

export default App
