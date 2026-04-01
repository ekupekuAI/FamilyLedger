import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Paper,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  TextField,
  MenuItem,
  Chip,
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
import { format } from 'date-fns';

const CATEGORY_ICONS: Record<string, React.ReactElement> = {
  Food: <Restaurant />,
  Transport: <DirectionsBus />,
  Education: <School />,
  Shopping: <ShoppingBag />,
  Medical: <LocalHospital />,
  Entertainment: <Movie />,
  Other: <MoreHoriz />,
};

export default function ExpensesPage() {
  const navigate = useNavigate();
  const { members, transactions } = useFamily();
  const [memberFilter, setMemberFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const expenses = transactions.filter((t) => t.type === 'expense');

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const m = members.find((x) => x.id === memberFilter);
      const memberMatch =
        memberFilter === 'all' || (m && expense.from_user_id === m.user_id);
      const categoryMatch = categoryFilter === 'all' || expense.category === categoryFilter;
      return memberMatch && categoryMatch;
    });
  }, [expenses, memberFilter, categoryFilter, members]);

  const totalExpense = filteredExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

  const categories = Array.from(
    new Set(expenses.map((e) => e.category).filter((c): c is string => c !== null))
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate('/dashboard')}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" component="div">
            Expenses
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              select
              label="Filter by Member"
              value={memberFilter}
              onChange={(e) => setMemberFilter(e.target.value)}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="all">All Members</MenuItem>
              {members.map((member) => (
                <MenuItem key={member.id} value={member.id}>
                  {member.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Filter by Category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="all">All Categories</MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </Paper>

        <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.main', color: 'white' }}>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            Total Expenses {memberFilter !== 'all' || categoryFilter !== 'all' ? '(Filtered)' : ''}
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 700 }}>
            ₹{totalExpense.toFixed(2)}
          </Typography>
        </Paper>

        {filteredExpenses.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">No expenses found</Typography>
          </Paper>
        ) : (
          <Paper>
            {filteredExpenses.map((expense) => {
              const member = members.find((m) => m.user_id === expense.from_user_id);
              return (
                <Box
                  key={expense.id}
                  sx={{
                    p: 2,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    '&:last-child': { borderBottom: 0 },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        bgcolor: 'primary.light',
                        color: 'white',
                      }}
                    >
                      {CATEGORY_ICONS[expense.category || 'Other']}
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body1" fontWeight={500}>
                        {expense.description}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                        <Chip label={member?.name} size="small" />
                        <Chip label={expense.category} size="small" variant="outlined" />
                        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 2 }}>
                          {format(new Date(expense.date), 'MMM d, yyyy')}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="h6" fontWeight={700} color="error.main">
                      ₹{Number(expense.amount).toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Paper>
        )}
      </Container>
    </Box>
  );
}
