import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Button,
  Paper,
  Chip,
  IconButton,
  AppBar,
  Toolbar,
} from '@mui/material';
import {
  AccountBalanceWallet,
  Logout,
  Notifications,
  Settings,
} from '@mui/icons-material';
import { useFamily } from '../contexts/FamilyContext';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { family, members, transactions, getBalanceForMember, notifications } = useFamily();
  const { signOut } = useAuth();

  if (!family) {
    navigate('/setup');
    return null;
  }

  const totalPool = members.reduce((sum, member) => sum + getBalanceForMember(member.id), 0);

  const recentTransactions = transactions.slice(0, 10);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getTransactionText = (transaction: (typeof transactions)[0]) => {
    const fromMember = members.find((m) => m.user_id === transaction.from_user_id);
    const toMember = members.find((m) => m.user_id === transaction.to_user_id);

    if (transaction.type === 'money_sent') {
      return `${fromMember?.name ?? 'Someone'} sent ₹${transaction.amount} to ${toMember?.name ?? 'someone'}`;
    }
    if (transaction.type === 'expense') {
      const spender = members.find((m) => m.user_id === transaction.from_user_id);
      return `${spender?.name ?? 'Someone'} spent ₹${transaction.amount} on ${transaction.category ?? 'expense'}`;
    }
    if (transaction.type === 'settlement') {
      return `${fromMember?.name ?? 'Someone'} settled ₹${transaction.amount} with ${toMember?.name ?? 'someone'}`;
    }
    return '';
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {family.name}
          </Typography>
          <IconButton color="inherit" onClick={() => navigate('/notifications')}>
            <Notifications />
            {unreadCount > 0 && (
              <Chip
                label={unreadCount}
                size="small"
                color="error"
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  height: 18,
                  minWidth: 18,
                  fontSize: '0.75rem',
                }}
              />
            )}
          </IconButton>
          <IconButton color="inherit" onClick={() => navigate('/settings')}>
            <Settings />
          </IconButton>
          <IconButton color="inherit" onClick={handleSignOut}>
            <Logout />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.main', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <AccountBalanceWallet sx={{ fontSize: 48 }} />
            <Box>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Total Family Pool
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 700 }}>
                ₹{totalPool.toFixed(2)}
              </Typography>
            </Box>
          </Box>
        </Paper>

        <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
          Family Members
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
            },
            gap: 2,
            mb: 4,
          }}
        >
          {members.map((member) => {
            const balance = getBalanceForMember(member.id);
            return (
              <Card
                key={member.id}
                onClick={() => navigate(`/member/${member.id}`)}
                sx={{
                  cursor: 'pointer',
                  '&:hover': { boxShadow: 4 },
                  transition: 'box-shadow 0.2s',
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: 'primary.main',
                        width: 56,
                        height: 56,
                        fontSize: '1.5rem',
                      }}
                    >
                      {member.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6">{member.name}</Typography>
                      <Chip label={member.role} size="small" />
                    </Box>
                  </Box>
                  <Typography
                    variant="h5"
                    sx={{
                      color: balance >= 0 ? 'success.main' : 'error.main',
                      fontWeight: 700,
                    }}
                  >
                    ₹{balance.toFixed(2)}
                  </Typography>
                </CardContent>
              </Card>
            );
          })}
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/send-money')}
          >
            Send Money
          </Button>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/log-expense')}
          >
            Log Expense
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate('/settlements')}
          >
            Settle Up
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate('/expenses')}
          >
            View All Expenses
          </Button>
        </Box>

        <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
          Recent Transactions
        </Typography>

        {recentTransactions.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">No transactions yet</Typography>
          </Paper>
        ) : (
          <Paper>
            {recentTransactions.map((transaction) => (
              <Box
                key={transaction.id}
                sx={{
                  p: 2,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  '&:last-child': { borderBottom: 0 },
                }}
              >
                <Typography variant="body1">{getTransactionText(transaction)}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {format(new Date(transaction.created_at), 'MMM d, yyyy h:mm a')}
                </Typography>
              </Box>
            ))}
          </Paper>
        )}
      </Container>
    </Box>
  );
}
