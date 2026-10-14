import { useState, useMemo } from 'react';
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
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useFamily } from '../contexts/FamilyContext';
import { format } from 'date-fns';
import { toPaise } from '../lib/money';

interface Settlement {
  from: string;
  to: string;
  amount: number;
}

export default function SettlementsPage() {
  const navigate = useNavigate();
  const { members, getBalanceForMember, settleUp, transactions } = useFamily();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Balance = received − sent − expenses. A member with a positive balance holds family
  // money; a negative one has paid out of pocket. A settlement is recorded as a transfer
  // from → to, so it must go from the holder to the out-of-pocket member to move both
  // toward zero. (It used to go the other way, so every "Settle" doubled the gap.)
  // Matching is done in integer paise so amounts always reach exactly zero.
  const settlements: Settlement[] = useMemo(() => {
    const holders: { id: string; amount: number }[] = [];
    const outOfPocket: { id: string; amount: number }[] = [];

    members.forEach((member) => {
      const balance = toPaise(getBalanceForMember(member.id));
      if (balance > 0) {
        holders.push({ id: member.id, amount: balance });
      } else if (balance < 0) {
        outOfPocket.push({ id: member.id, amount: -balance });
      }
    });

    const result: Settlement[] = [];

    let i = 0;
    let j = 0;

    while (i < holders.length && j < outOfPocket.length) {
      const holder = holders[i];
      const payee = outOfPocket[j];

      const settleAmount = Math.min(holder.amount, payee.amount);

      result.push({
        from: holder.id,
        to: payee.id,
        amount: settleAmount / 100,
      });

      holder.amount -= settleAmount;
      payee.amount -= settleAmount;

      if (holder.amount === 0) i++;
      if (payee.amount === 0) j++;
    }

    return result;
  }, [members, getBalanceForMember]);

  const handleSettle = async (settlement: Settlement) => {
    setLoading(true);
    setError('');
    try {
      await settleUp(settlement.from, settlement.to, settlement.amount);
    } catch (err) {
      console.error('Error settling:', err);
      setError(err instanceof Error ? err.message : 'Could not record the settlement');
    } finally {
      setLoading(false);
    }
  };

  const settlementHistory = transactions.filter((t) => t.type === 'settlement');

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate('/dashboard')}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" component="div">
            Settlements
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h5" gutterBottom>
          Calculated Settlements
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Suggested payments that bring balances back toward zero. Tap Settle once the money has
          been handed over.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {settlements.length === 0 ? (
          <Alert severity="success" sx={{ mb: 4 }}>
            All settled! No outstanding balances.
          </Alert>
        ) : (
          <Paper sx={{ mb: 4 }}>
            {settlements.map((settlement, index) => {
              const fromMember = members.find((m) => m.id === settlement.from);
              const toMember = members.find((m) => m.id === settlement.to);

              return (
                <Box
                  key={index}
                  sx={{
                    p: 3,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    '&:last-child': { borderBottom: 0 },
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 2,
                  }}
                >
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6">
                      {fromMember?.name} pays {toMember?.name}
                    </Typography>
                    <Typography variant="h4" color="error.main" fontWeight={700}>
                      ₹{settlement.amount.toFixed(2)}
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    onClick={() => handleSettle(settlement)}
                    disabled={loading}
                  >
                    Settle
                  </Button>
                </Box>
              );
            })}
          </Paper>
        )}

        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          Settlement History
        </Typography>

        {settlementHistory.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">No settlement history</Typography>
          </Paper>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>From</TableCell>
                  <TableCell>To</TableCell>
                  <TableCell align="right">Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {settlementHistory.map((settlement) => {
                  const fromMember = members.find((m) => m.user_id === settlement.from_user_id);
                  const toMember = members.find((m) => m.user_id === settlement.to_user_id);

                  return (
                    <TableRow key={settlement.id}>
                      <TableCell>
                        {format(new Date(settlement.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>{fromMember?.name}</TableCell>
                      <TableCell>{toMember?.name}</TableCell>
                      <TableCell align="right">₹{Number(settlement.amount).toFixed(2)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Container>
    </Box>
  );
}
