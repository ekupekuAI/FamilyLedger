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
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useFamily } from '../contexts/FamilyContext';
import { format } from 'date-fns';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { notifications, markAllNotificationsRead } = useFamily();

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate('/dashboard')}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Notifications
          </Typography>
          {unreadCount > 0 && (
            <Button color="inherit" onClick={handleMarkAllRead}>
              Mark All Read
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 4 }}>
        {notifications.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">No notifications</Typography>
          </Paper>
        ) : (
          <Paper>
            {notifications.map((notification) => (
              <Box
                key={notification.id}
                sx={{
                  p: 2,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  '&:last-child': { borderBottom: 0 },
                  bgcolor: notification.is_read ? 'transparent' : 'action.hover',
                }}
              >
                <Typography
                  variant="body1"
                  fontWeight={notification.is_read ? 400 : 600}
                >
                  {notification.message}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {format(new Date(notification.created_at), 'MMM d, yyyy h:mm a')}
                </Typography>
              </Box>
            ))}
          </Paper>
        )}
      </Container>
    </Box>
  );
}
