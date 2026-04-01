import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  Alert,
} from '@mui/material';
import { useFamily } from '../contexts/FamilyContext';

export default function SetupPage() {
  const navigate = useNavigate();
  const { createFamily, joinFamily } = useFamily();
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [familyName, setFamilyName] = useState('');
  const [familyCode, setFamilyCode] = useState('');
  const [memberName, setMemberName] = useState('');
  const [role, setRole] = useState('child');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdCode, setCreatedCode] = useState('');

  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!familyName) {
        setError('Please enter a family name');
        setLoading(false);
        return;
      }
      const code = await createFamily(familyName);
      setCreatedCode(code);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleJoinFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!familyCode || !memberName) {
        setError('Please fill in all fields');
        setLoading(false);
        return;
      }
      await joinFamily(familyCode, memberName, role);
      navigate('/dashboard');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Paper sx={{ p: 4, width: '100%' }}>
          <Typography variant="h4" component="h1" gutterBottom textAlign="center">
            Family Setup
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {createdCode && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Family created! Your code is: <strong>{createdCode}</strong>
              <br />
              Share this code with family members so they can join.
            </Alert>
          )}

          <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={(_, value) => value && setMode(value)}
            fullWidth
            sx={{ my: 3 }}
          >
            <ToggleButton value="create">Create Family</ToggleButton>
            <ToggleButton value="join">Join Family</ToggleButton>
          </ToggleButtonGroup>

          {mode === 'create' ? (
            <Box component="form" onSubmit={handleCreateFamily}>
              <TextField
                fullWidth
                label="Family Name"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                margin="normal"
                required
              />
              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={loading || !!createdCode}
                sx={{ mt: 3 }}
              >
                {loading ? 'Creating...' : 'Create Family'}
              </Button>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleJoinFamily}>
              <TextField
                fullWidth
                label="Family Code"
                placeholder="FAM-XXXX"
                value={familyCode}
                onChange={(e) => setFamilyCode(e.target.value.toUpperCase())}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Your Name"
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                margin="normal"
                required
              />
              <Typography variant="body2" sx={{ mt: 2, mb: 1 }}>
                Your Role
              </Typography>
              <ToggleButtonGroup
                value={role}
                exclusive
                onChange={(_, value) => value && setRole(value)}
                fullWidth
              >
                <ToggleButton value="parent">Parent</ToggleButton>
                <ToggleButton value="child">Child</ToggleButton>
                <ToggleButton value="member">Member</ToggleButton>
              </ToggleButtonGroup>
              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mt: 3 }}
              >
                {loading ? 'Joining...' : 'Join Family'}
              </Button>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
}
