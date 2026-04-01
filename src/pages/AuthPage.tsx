import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container,
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Link,
} from '@mui/material';
import { motion } from 'framer-motion';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useAuth } from '../contexts/AuthContext';

const MotionPaper = motion.create(Paper);

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'signin';
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (!name || !email || !password) {
          setError('Please fill in all fields');
          setLoading(false);
          return;
        }
        const result = await signUp(email, password, name);
        if (result.needsEmailConfirmation) {
          setInfo(
            'Check your email to confirm your account. After confirming, sign in here — then you can create or join a family.'
          );
          return;
        }
        navigate('/setup');
      } else {
        if (!email || !password) {
          setError('Please fill in all fields');
          setLoading(false);
          return;
        }
        await signIn(email, password);
        navigate('/dashboard');
      }
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
        }}
      >
        <MotionPaper
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          sx={{ p: 4, width: '100%', borderRadius: 3 }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <LockOutlinedIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          </Box>
          <Typography variant="h4" component="h1" gutterBottom textAlign="center" fontWeight={700}>
            {mode === 'signup' ? 'Sign Up' : 'Sign In'}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {info && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {info}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            {mode === 'signup' && (
              <TextField
                fullWidth
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                margin="normal"
                required
              />
            )}
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
            />
            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 3, mb: 2 }}
            >
              {loading ? 'Loading...' : mode === 'signup' ? 'Sign Up' : 'Sign In'}
            </Button>

            <Typography variant="body2" textAlign="center">
              {mode === 'signup' ? (
                <>
                  Already have an account?{' '}
                  <Link
                    component="button"
                    type="button"
                    onClick={() => navigate('/auth?mode=signin')}
                  >
                    Sign In
                  </Link>
                </>
              ) : (
                <>
                  Don't have an account?{' '}
                  <Link
                    component="button"
                    type="button"
                    onClick={() => navigate('/auth?mode=signup')}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </Typography>
          </Box>
        </MotionPaper>
      </Box>
    </Container>
  );
}
