import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Button
} from '@mui/material';
import {
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  History as HistoryIcon,
  OpenInNew as OpenInNewIcon
} from '@mui/icons-material';
import { usePromptGuard } from '../hooks/usePromptGuard';

const PopupSummary: React.FC = () => {
  const { 
    totalDetected, 
    currentlyDismissed, 
    activeIssues, 
    allIssues, 
    isLoading 
  } = usePromptGuard();

  const recentDetections = allIssues
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5);

  const formatTimestamp = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days > 0) {
      return `${days}d ago`;
    } else if (hours > 0) {
      return `${hours}h ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return 'Just now';
    }
  };

  const openChatGPT = () => {
    chrome.tabs.create({ url: 'https://chatgpt.com' });
  };

  return (
    <Box sx={{ width: 350, p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <WarningIcon color="primary" sx={{ mr: 1 }} />
        <Typography variant="h6" component="h1">
          Prompt Guard
        </Typography>
      </Box>

      {isLoading ? (
        <Card>
          <CardContent>
            <Typography color="text.secondary">Loading...</Typography>
          </CardContent>
        </Card>
      ) : (
        <>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Card sx={{ flex: 1 }}>
              <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                <Typography variant="h4" color="error">
                  {totalDetected}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Detected
                </Typography>
              </CardContent>
            </Card>
            
            <Card sx={{ flex: 1 }}>
              <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                <Typography variant="h4" color="success.main">
                  {currentlyDismissed}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Currently Dismissed
                </Typography>
              </CardContent>
            </Card>
          </Box>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <HistoryIcon sx={{ mr: 1, fontSize: 20 }} />
                <Typography variant="subtitle1">
                  Recent Detections
                </Typography>
              </Box>
              
              {recentDetections.length > 0 ? (
                <List dense sx={{ py: 0 }}>
                  {recentDetections.map((detection, index) => (
                    <React.Fragment key={`${detection.email}-${detection.timestamp}`}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemText 
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                {detection.email}
                              </Typography>
                              {activeIssues.some(active => active.email === detection.email) ? (
                                <Chip 
                                  label="Active" 
                                  size="small" 
                                  color="error" 
                                  variant="outlined"
                                />
                              ) : (
                                <CheckCircleIcon 
                                  sx={{ fontSize: 16, color: 'success.main' }} 
                                />
                              )}
                            </Box>
                          }
                          secondary={formatTimestamp(detection.timestamp)}
                        />
                      </ListItem>
                      {index < recentDetections.length - 1 && (
                        <Divider sx={{ my: 0.5 }} />
                      )}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                  No email addresses detected yet.
                </Typography>
              )}
            </CardContent>
          </Card>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<OpenInNewIcon />}
            onClick={openChatGPT}
            sx={{ mt: 2 }}
          >
            Open ChatGPT
          </Button>
          <Typography 
            variant="caption" 
            color="text.secondary" 
            sx={{ display: 'block', textAlign: 'center', mt: 1 }}
          >
            Emails are dismissed for 24 hours
          </Typography>
        </>
      )}
    </Box>
  );
};

export default PopupSummary;