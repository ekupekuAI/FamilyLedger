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

interface Settlement {
  from: string;
  to: string;
  amount: number;
}

export default function SettlementsPage() {
  const navigate = useNavigate();
  const { members, getBalanceForMember, settleUp, transactions } = useFamily();
  const [loading, setLoading] = useState(false);

  const settlements: Settlement[] = useMemo(() => {
    const creditors: { id: string; name: string; amount: number }[] = [];
    const debtors: { id: string; name: string; amount: number }[] = [];

    members.forEach((member) => {
      const balance = getBalanceForMember(member.id);
      if (balance > 0) {
        creditors.push({ id: member.id, name: member.name, amount: balance });
      } else if (balance < 0) {
        debtors.push({ id: member.id, name: member.name, amount: Math.abs(balance) });
      }
    });

    const result: Settlement[] = [];

    let i = 0;
    let j = 0;

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];

      const settleAmount = Math.min(debtor.amount, creditor.amount);

      result.push({
        from: debtor.id,
        to: creditor.id,
        amount: settleAmount,
      });

      debtor.amount -= settleAmount;
      creditor.amount -= settleAmount;

      if (debtor.amount === 0) i++;
      if (creditor.amount === 0) j++;
    }

    return result;
  }, [members, getBalanceForMember, transactions]);

  const handleSettle = async (settlement: Settlement) => {
    setLoading(true);
    try {
      await settleUp(settlement.from, settlement.to, settlement.amount);
    } catch (error) {
      console.error('Error settling:', error);
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
                      {fromMember?.name} owes {toMember?.name}
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
