import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { zxcvbn } from 'zxcvbn-typescript';
import {
  TextField,
  Button,
  Box,
  Typography,
  Link,
  Alert,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import SessionTimer from '../SessionTimer';
import authService from '../../services/auth';
import { useAuth } from '../../context/AuthContext';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loggedIn, setLoggedIn] = useState(false);
  const [csrfToken, setCsrfToken] = useState('');

  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const token = await authService.getCsrfToken();
        setCsrfToken(token);
      } catch (err) {
        console.error('Failed to fetch CSRF token:', err);
        setError('Failed to initialize security token. Please refresh the page.');
      }
    };
    
    if (!csrfToken) {
      fetchCsrfToken();
    }
  }, [csrfToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { accessToken, refreshToken } = await authService.login({
        email,
        password,
        _csrf: csrfToken
      });
      login(accessToken, refreshToken);
      setFailedAttempts(0);
      setLoggedIn(true);
      navigate('/');
    } catch (err) {
      const attempts = failedAttempts + 1;
      setFailedAttempts(attempts);
      
      let errorMessage = 'Invalid email or password';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
      <Typography variant="h5" gutterBottom>
        Login
      </Typography>
      {error && (
        <>
          <Alert
            severity="error"
            role="alert"
            aria-describedby="error-message"
          >
            <span id="error-message">{error}</span>
          </Alert>
          {failedAttempts >= 3 && (
            <Alert severity="warning" sx={{ color: '#d32f2f', mt: 1 }}>
              Too many failed attempts. Your account will be locked for 15 minutes after {5 - failedAttempts} more attempts.
            </Alert>
          )}
        </>
      )}
      <TextField
        margin="normal"
        required
        fullWidth
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <TextField
        margin="normal"
        required
        fullWidth
        label="Password"
        type={showPassword ? 'text' : 'password'}
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          setPasswordStrength(zxcvbn(e.target.value).score);
        }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => setShowPassword(!showPassword)}
                edge="end"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          )
        }}
      />
      <Box sx={{
        width: '100%',
        height: 4,
        backgroundColor: '#e0e0e0',
        borderRadius: 2,
        mt: 1,
        mb: 1
      }}>
        <Box sx={{
          width: `${(passwordStrength + 1) * 25}%`,
          height: '100%',
          borderRadius: 2,
          backgroundColor:
            passwordStrength < 2 ? '#ff5252' :
            passwordStrength < 4 ? '#ffc107' :
            '#4caf50'
        }} />
      </Box>
      <Typography variant="caption" sx={{
        display: 'block',
        textAlign: 'right',
        color:
          passwordStrength < 2 ? '#ff5252' :
          passwordStrength < 4 ? '#ffc107' :
          '#4caf50'
      }}>
        {password ? (
          passwordStrength < 2 ? 'Weak' :
          passwordStrength < 4 ? 'Moderate' :
          'Strong'
        ) : null}
      </Typography>
      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{ mt: 3, mb: 2 }}
      >
        Sign In
      </Button>
      {loggedIn && <SessionTimer />}
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Link href="/reset-password" variant="body2">
          Forgot password?
        </Link>
        <Link href="/register" variant="body2">
          Create account
        </Link>
      </Box>
    </Box>
  );
};

export default LoginForm;