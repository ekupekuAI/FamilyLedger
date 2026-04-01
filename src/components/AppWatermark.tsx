import { Box, Typography } from '@mui/material';

export default function AppWatermark() {
  return (
    <Box
      component="footer"
      sx={{
        position: 'fixed',
        bottom: 10,
        right: 14,
        zIndex: (t) => t.zIndex.tooltip + 1,
        pointerEvents: 'none',
        userSelect: 'none',
        opacity: 0.38,
      }}
    >
      <Typography
        variant="caption"
        sx={{
          fontWeight: 600,
          letterSpacing: '0.18em',
          color: 'text.secondary',
        }}
      >
        EKANSH
      </Typography>
    </Box>
  );
}
