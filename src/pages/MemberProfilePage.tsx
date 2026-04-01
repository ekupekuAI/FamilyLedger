import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Box,
  Paper,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Avatar,
  Chip,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useFamily } from '../contexts/FamilyContext';
import { format } from 'date-fns';

const COLORS = ['#16a34a', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6b7280'];

function transactionInvolvesUser(
  uid: string,
  t: { type: string; from_user_id: string | null; to_user_id: string | null }
): boolean {
  if (t.type === 'expense') return t.from_user_id === uid;
  if (t.type === 'money_sent')
    return t.from_user_id === uid || t.to_user_id === uid;
  if (t.type === 'settlement')
    return t.from_user_id === uid || t.to_user_id === uid;
  return false;
}

export default function MemberProfilePage() {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const { members, transactions, getBalanceForMember } = useFamily();

  const member = members.find((m) => m.id === memberId);

  if (!member) {
    navigate('/dashboard');
    return null;
  }

  const balance = getBalanceForMember(member.id);

  const memberTransactions = transactions.filter((t) =>
    transactionInvolvesUser(member.user_id, t)
  );

  const expensesByCategory = useMemo(() => {
    const expenses = memberTransactions.filter((t) => t.type === 'expense');
    const categoryMap: Record<string, number> = {};

    expenses.forEach((exp) => {
      const category = exp.category || 'Other';
      categoryMap[category] = (categoryMap[category] || 0) + Number(exp.amount);
    });

    return Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
  }, [memberTransactions]);

  const moneyReceivedVsSpent = useMemo(() => {
    const received = memberTransactions
      .filter((t) => t.type === 'money_sent' && t.to_user_id === member.user_id)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const spent = memberTransactions
      .filter((t) => t.type === 'expense' && t.from_user_id === member.user_id)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return [
      { name: 'Money Received', value: received },
      { name: 'Expenses Logged', value: spent },
    ];
  }, [memberTransactions, member.user_id]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate('/dashboard')}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" component="div">
            Member Profile
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper sx={{ p: 4, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Avatar
              sx={{
                bgcolor: 'primary.main',
                width: 80,
                height: 80,
                fontSize: '2rem',
              }}
            >
              {member.name.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h4">{member.name}</Typography>
              <Chip label={member.role} sx={{ mt: 1 }} />
            </Box>
          </Box>
        </Paper>

        <Paper sx={{ p: 3, mb: 3, bgcolor: balance >= 0 ? 'success.main' : 'error.main', color: 'white' }}>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            Net balance
          </Typography>
          <Typography variant="h2" sx={{ fontWeight: 700 }}>
            ₹{balance.toFixed(2)}
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.85 }}>
            Received − sent − expenses ± settlements
          </Typography>
        </Paper>

        {expensesByCategory.length > 0 && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Spending by Category
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expensesByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {expensesByCategory.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        )}

        {moneyReceivedVsSpent.some((d) => d.value > 0) && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Money Received vs Expenses Logged
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={moneyReceivedVsSpent}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#16a34a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        )}

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Transaction History
          </Typography>
          {memberTransactions.length === 0 ? (
            <Typography color="text.secondary">No transactions yet</Typography>
          ) : (
            <Box>
              {memberTransactions.map((transaction) => {
                const fromMember = members.find((m) => m.user_id === transaction.from_user_id);
                const toMember = members.find((m) => m.user_id === transaction.to_user_id);

                return (
                  <Box
                    key={transaction.id}
                    sx={{
                      py: 2,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      '&:last-child': { borderBottom: 0 },
                    }}
                  >
                    {transaction.type === 'money_sent' && transaction.to_user_id === member.user_id && (
                      <>
                        <Typography variant="body1" fontWeight={500}>
                          Received from {fromMember?.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {transaction.note}
                        </Typography>
                        <Typography variant="h6" color="success.main">
                          +₹{Number(transaction.amount).toFixed(2)}
                        </Typography>
                      </>
                    )}
                    {transaction.type === 'money_sent' && transaction.from_user_id === member.user_id && (
                      <>
                        <Typography variant="body1" fontWeight={500}>
                          Sent to {toMember?.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {transaction.note}
                        </Typography>
                        <Typography variant="h6" color="error.main">
                          −₹{Number(transaction.amount).toFixed(2)}
                        </Typography>
                      </>
                    )}
                    {transaction.type === 'expense' && transaction.from_user_id === member.user_id && (
                      <>
                        <Typography variant="body1" fontWeight={500}>
                          {transaction.description}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {transaction.category}
                        </Typography>
                        <Typography variant="h6" color="error.main">
                          −₹{Number(transaction.amount).toFixed(2)}
                        </Typography>
                      </>
                    )}
                    {transaction.type === 'settlement' && (
                      <>
                        <Typography variant="body1" fontWeight={500}>
                          {transaction.from_user_id === member.user_id
                            ? `Settled with ${toMember?.name}`
                            : `Received settlement from ${fromMember?.name}`}
                        </Typography>
                        <Typography variant="h6" color="primary.main">
                          ₹{Number(transaction.amount).toFixed(2)}
                        </Typography>
                      </>
                    )}
                    <Typography variant="caption" color="text.secondary">
                      {format(new Date(transaction.created_at), 'MMM d, yyyy h:mm a')}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
