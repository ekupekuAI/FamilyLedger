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
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import {
  ArrowBack,
  Restaurant,
  DirectionsBus,
  School,
  ShoppingBag,
  LocalHospital,
  Movie,
  MoreHoriz,
} from '@mui/icons-material';
import { useFamily } from '../contexts/FamilyContext';

const CATEGORIES = [
  { value: 'Food', label: 'Food', icon: <Restaurant /> },
  { value: 'Transport', label: 'Transport', icon: <DirectionsBus /> },
  { value: 'Education', label: 'Education', icon: <School /> },
  { value: 'Shopping', label: 'Shopping', icon: <ShoppingBag /> },
  { value: 'Medical', label: 'Medical', icon: <LocalHospital /> },
  { value: 'Entertainment', label: 'Entertainment', icon: <Movie /> },
  { value: 'Other', label: 'Other', icon: <MoreHoriz /> },
];

export default function LogExpensePage() {
  const navigate = useNavigate();
  const { members, logExpense } = useFamily();
  const [selectedMember, setSelectedMember] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedMember || !amount || !category || !description || !date) {
      setError('Please fill in all fields');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);

    try {
      await logExpense(selectedMember, amountNum, category, description, date);
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
            Log Expense
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom>
            Log an Expense
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
              label="Who Spent"
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              margin="normal"
              required
            >
              {members.map((member) => (
                <MenuItem key={member.id} value={member.id}>
                  {member.name}
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

            <Typography variant="body2" sx={{ mt: 2, mb: 1 }}>
              Category
            </Typography>
            <ToggleButtonGroup
              value={category}
              exclusive
              onChange={(_, value) => value && setCategory(value)}
              fullWidth
              sx={{ mb: 2, flexWrap: 'wrap' }}
            >
              {CATEGORIES.map((cat) => (
                <ToggleButton key={cat.value} value={cat.value} sx={{ flex: '1 1 auto' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                    {cat.icon}
                    <Typography variant="caption">{cat.label}</Typography>
                  </Box>
                </ToggleButton>
              ))}
            </ToggleButtonGroup>

            <TextField
              fullWidth
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              margin="normal"
              required
              multiline
              rows={2}
              placeholder="What was purchased?"
            />

            <TextField
              fullWidth
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              margin="normal"
              required
              InputLabelProps={{ shrink: true }}
            />

            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 3 }}
            >
              {loading ? 'Saving...' : 'Save Expense'}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
