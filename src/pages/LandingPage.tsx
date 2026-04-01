import { useNavigate } from 'react-router-dom';
import { Container, Box, Typography, Button, Paper, Stack } from '@mui/material';
import { motion } from 'framer-motion';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import GroupsIcon from '@mui/icons-material/Groups';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';

const MotionBox = motion.create(Box);
const MotionPaper = motion.create(Paper);

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <MotionPaper
          elevation={0}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          sx={{
            p: { xs: 5, sm: 6 },
            textAlign: 'center',
            width: '100%',
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            background:
              'linear-gradient(145deg, rgba(22,163,74,0.06) 0%, rgba(255,255,255,1) 45%, rgba(14,165,233,0.05) 100%)',
          }}
        >
          <MotionBox
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.45 }}
            sx={{ mb: 2 }}
          >
            <AccountBalanceWalletIcon
              sx={{
                fontSize: 56,
                color: 'primary.main',
                filter: 'drop-shadow(0 4px 12px rgba(22,163,74,0.35))',
              }}
            />
          </MotionBox>

          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 800,
              letterSpacing: '-0.02em',
              background: 'linear-gradient(90deg, #15803d, #0ea5e9)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1,
            }}
          >
            FamilyLedger
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 4, fontWeight: 500 }}>
            Track family money together — in real time
          </Typography>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="center"
            sx={{ mb: 5 }}
          >
            {[
              { icon: <GroupsIcon />, label: 'Shared family space' },
              { icon: <NotificationsActiveIcon />, label: 'Instant notifications' },
            ].map((item, i) => (
              <MotionBox
                key={item.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.08 }}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  bgcolor: 'action.hover',
                }}
              >
                <Box sx={{ color: 'primary.main', display: 'flex' }}>{item.icon}</Box>
                <Typography variant="body2" fontWeight={600}>
                  {item.label}
                </Typography>
              </MotionBox>
            ))}
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <MotionBox whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/auth?mode=signup')}
                sx={{ minWidth: 200, py: 1.25, boxShadow: 3 }}
              >
                Create Family
              </Button>
            </MotionBox>
            <MotionBox whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/auth?mode=signin')}
                sx={{ minWidth: 200, py: 1.25 }}
              >
                Join Family
              </Button>
            </MotionBox>
          </Stack>
        </MotionPaper>
      </Box>
    </Container>
  );
}
