import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  MenuItem,
  AppBar,
  Toolbar,
  IconButton,
  Alert,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useFamily } from '../contexts/FamilyContext';

export default function SendMoneyPage() {
  const navigate = useNavigate();
  const { members, currentMember, sendMoney } = useFamily();
  const [selectedMember, setSelectedMember] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const otherMembers = members.filter((m) => m.id !== currentMember?.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedMember || !amount) {
      setError('Please fill in all required fields');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);

    try {
      await sendMoney(selectedMember, amountNum, note);
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
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate('/dashboard')}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" component="div">
            Send Money
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom>
            Send Money to Family Member
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              select
              fullWidth
              label="Send To"
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              margin="normal"
              required
            >
              {otherMembers.map((member) => (
                <MenuItem key={member.id} value={member.id}>
                  {member.name} ({member.role})
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              label="Amount (₹)"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              margin="normal"
              required
              inputProps={{ min: 0, step: 0.01 }}
            />

            <TextField
              fullWidth
              label="Note (Optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              margin="normal"
              multiline
              rows={2}
              placeholder="e.g., Monthly allowance"
            />

            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 3 }}
            >
              {loading ? 'Sending...' : 'Send Money'}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
