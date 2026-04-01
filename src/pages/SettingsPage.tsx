import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Paper,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import { ArrowBack, ContentCopy } from '@mui/icons-material';
import { useFamily } from '../contexts/FamilyContext';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { family, members, leaveFamily } = useFamily();
  const [copySuccess, setCopySuccess] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);

  if (!family) {
    navigate('/setup');
    return null;
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(family.family_code);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleLeaveFamily = async () => {
    await leaveFamily();
    setLeaveDialogOpen(false);
    navigate('/setup');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate('/dashboard')}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" component="div">
            Settings
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Family Information
          </Typography>
          <TextField
            fullWidth
            label="Family Name"
            value={family.name}
            margin="normal"
            InputProps={{ readOnly: true }}
          />
        </Paper>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Family Code
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Share this code with family members so they can join
          </Typography>
          {copySuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Code copied to clipboard!
            </Alert>
          )}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 2 }}>
            <TextField
              fullWidth
              value={family.family_code}
              InputProps={{ readOnly: true }}
              sx={{
                '& input': {
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  letterSpacing: 2,
                },
              }}
            />
            <Button
              variant="outlined"
              startIcon={<ContentCopy />}
              onClick={handleCopyCode}
            >
              Copy
            </Button>
          </Box>
        </Paper>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Family Members
          </Typography>
          <List>
            {members.map((member) => (
              <ListItem key={member.id}>
                <ListItemText
                  primary={member.name}
                  secondary={member.role}
                />
                <ListItemSecondaryAction>
                  <Typography variant="caption" color="text.secondary">
                    Joined {new Date(member.joined_at).toLocaleDateString()}
                  </Typography>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom color="error">
            Danger Zone
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Once you leave the family, you will lose access to all family data
          </Typography>
          <Button
            variant="outlined"
            color="error"
            sx={{ mt: 2 }}
            onClick={() => setLeaveDialogOpen(true)}
          >
            Leave Family
          </Button>
        </Paper>
      </Container>

      <Dialog open={leaveDialogOpen} onClose={() => setLeaveDialogOpen(false)}>
        <DialogTitle>Leave Family?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to leave this family? You will lose access to all family data.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLeaveDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleLeaveFamily} color="error" variant="contained">
            Leave Family
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
