import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tabs,
  Tab,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Typography,
  IconButton,
  Divider
} from '@mui/material';
import {
  Close as CloseIcon,
  Warning as WarningIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { usePromptGuard } from '../hooks/usePromptGuard';
import type { DetectedEmail } from '../utils/storage';

interface PromptGuardModalProps {
  open: boolean;
  onClose: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`prompt-guard-tabpanel-${index}`}
      aria-labelledby={`prompt-guard-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
};

const PromptGuardModal: React.FC<PromptGuardModalProps> = ({ open, onClose }) => {
  const [tabValue, setTabValue] = useState(0);
  const { 
    activeIssues, 
    allIssues, 
    dismissedEmails,
    dismissEmail, 
    isLoading 
  } = usePromptGuard();

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleDismissEmail = async (email: string) => {
    await dismissEmail(email);
  };

  const isEmailDismissed = (email: string): boolean => {
    const now = Date.now();
    const dismissDuration = 24 * 60 * 60 * 1000;
    
    return dismissedEmails.some((dismissed) => 
      dismissed.email === email && (now - dismissed.dismissedAt) < dismissDuration
    );
  };

  const getDismissedUntilTime = (email: string): string => {
    const dismissedItem = dismissedEmails.find((d) => d.email === email);
    if (!dismissedItem) return '';
    
    const dismissedUntil = new Date(dismissedItem.dismissedAt + (24 * 60 * 60 * 1000));
    return dismissedUntil.toLocaleString();
  };

  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '400px',
          maxHeight: '80vh'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="warning" />
          <Typography variant="h6">Prompt Guard</Typography>
        </Box>
        <IconButton
          edge="end"
          color="inherit"
          onClick={onClose}
          aria-label="close"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="prompt guard tabs">
            <Tab 
              label={`Issues Found (${activeIssues.length})`} 
              icon={<WarningIcon />}
              iconPosition="start"
            />
            <Tab 
              label={`History (${allIssues.length})`} 
              icon={<HistoryIcon />}
              iconPosition="start"
            />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: 2 }}>
            {activeIssues.length > 0 ? (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Email addresses detected in your recent prompt:
                </Typography>
                <List>
                  {activeIssues.map((issue: DetectedEmail, index: number) => (
                    <React.Fragment key={issue.email}>
                      <ListItem>
                        <ListItemText 
                          primary={issue.email}
                          secondary={`Detected: ${formatTimestamp(issue.timestamp)}`}
                        />
                        <ListItemSecondaryAction>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleDismissEmail(issue.email)}
                            disabled={isLoading}
                          >
                            Dismiss (24h)
                          </Button>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < activeIssues.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">
                  No active email issues found.
                </Typography>
              </Box>
            )}
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 2 }}>
            {allIssues.length > 0 ? (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  All email addresses detected in your prompts:
                </Typography>
                <List>
                  {allIssues.map((issue: DetectedEmail, index: number) => {
                    const dismissed = isEmailDismissed(issue.email);
                    return (
                      <React.Fragment key={`${issue.email}-${issue.timestamp}`}>
                        <ListItem>
                          <ListItemText 
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography
                                  sx={{ 
                                    opacity: dismissed ? 0.6 : 1,
                                    textDecoration: dismissed ? 'line-through' : 'none'
                                  }}
                                >
                                  {issue.email}
                                </Typography>
                                {dismissed && (
                                  <Chip 
                                    label={`Dismissed until ${getDismissedUntilTime(issue.email)}`}
                                    size="small"
                                    color="secondary"
                                    variant="outlined"
                                  />
                                )}
                              </Box>
                            }
                            secondary={`Detected: ${formatTimestamp(issue.timestamp)}`}
                          />
                        </ListItem>
                        {index < allIssues.length - 1 && <Divider />}
                      </React.Fragment>
                    );
                  })}
                </List>
              </>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">
                  No email addresses detected yet.
                </Typography>
              </Box>
            )}
          </Box>
        </TabPanel>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PromptGuardModal;