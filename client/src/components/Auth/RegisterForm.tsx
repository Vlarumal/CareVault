import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { apiBaseUrl } from '../../constants';
import zxcvbn from 'zxcvbn';
import {
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  LinearProgress,
} from '@mui/material';
import authService from '../../services/auth';
import { isAxiosError } from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
}

const RegisterForm = () => {
  const [formData, setFormData] = useState<RegisterData>({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  });
  const [error, setError] = useState('');
  const [csrfToken, setCsrfToken] = useState('');
  const [passwordScore, setPasswordScore] = useState(0);
  const [passwordFeedback, setPasswordFeedback] = useState('');
  // const [showVerification, setShowVerification] = useState(false);

  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const response = await axios.get(`${apiBaseUrl}/auth/csrf-token`, {
          withCredentials: true
        });
        setCsrfToken(response.data.csrfToken);
      } catch (err) {
        console.error('Failed to fetch CSRF token:', err);
        setError('Failed to initialize security token. Please refresh the page.');
      }
    };
    
    if (!csrfToken) {
      fetchCsrfToken();
    }
  }, [csrfToken]);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    try {
      const { accessToken, refreshToken } = await authService.register({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        _csrf: csrfToken
      });
      login(accessToken, refreshToken);
      // setShowVerification(true);
      navigate('/');
    } catch (err) {
      if (isAxiosError(err)) {
        const errorData = err.response?.data;
        if (errorData?.code?.startsWith('PASSWORD_')) {
          // Handle password validation errors
          type PasswordErrorCode =
            'PASSWORD_TOO_SHORT' |
            'PASSWORD_MISSING_UPPERCASE' |
            'PASSWORD_MISSING_NUMBER' |
            'PASSWORD_MISSING_SPECIAL_CHAR' |
            'PASSWORD_TOO_WEAK' |
            'PASSWORD_TOO_COMMON';

          const passwordErrors: Record<PasswordErrorCode, string> = {
            'PASSWORD_TOO_SHORT': `Password must be at least ${errorData.details?.minLength || 8} characters`,
            'PASSWORD_MISSING_UPPERCASE': 'Password must contain an uppercase letter',
            'PASSWORD_MISSING_NUMBER': 'Password must contain a number',
            'PASSWORD_MISSING_SPECIAL_CHAR': 'Password must contain a special character',
            'PASSWORD_TOO_WEAK': 'Password is too weak. ' +
              (errorData.details?.suggestions?.join(' ') || 'Try adding more complexity'),
            'PASSWORD_TOO_COMMON': 'Password is too common. Please choose a more unique password'
          };
          
          const errorCode = errorData.code as PasswordErrorCode;
          setError(passwordErrors[errorCode] || 'Invalid password');
        } else {
          setError(errorData?.error || 'Registration failed');
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Registration failed. Please try again.');
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    if (name === 'password') {
      const result = zxcvbn(value);
      setPasswordScore(result.score);
      setPasswordFeedback(
        result.feedback.warning ||
        result.feedback.suggestions.join(' ') ||
        ''
      );
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
      <Typography variant="h5" gutterBottom>
        Register
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {/* {showVerification ? (
        <EmailVerification email={formData.email} />
      ) :  */}
      {/* ( */}
        <React.Fragment>
          <TextField
            margin="normal"
            required
            fullWidth
            label="Full Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            inputProps={{
              'aria-describedby': 'password-strength-text',
              'aria-live': 'polite'
            }}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            inputProps={{
              'aria-describedby': 'password-match-text',
              'aria-live': 'polite'
            }}
          />
          {formData.password && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" display="block" gutterBottom>
                Password must be at least 8 characters
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(passwordScore + 1) * 25}
                sx={{
                  height: 8,
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: passwordScore < 2 ? '#ff4444' :
                                   passwordScore < 3 ? '#ffbb33' : '#00C851'
                  }
                }}
                aria-hidden="true"
              />
              <Typography
                id="password-strength-text"
                variant="caption"
                color="text.secondary"
                role="status"
              >
                {passwordScore < 2 ? 'Weak' :
                 passwordScore < 3 ? 'Moderate' : 'Strong'} password
                {passwordFeedback && ` - ${passwordFeedback}`}
              </Typography>
            </Box>
          )}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={passwordScore < 3 || formData.password.length < 8 || formData.password !== formData.confirmPassword}
          >
            Register
          </Button>
        </React.Fragment>
      {/* ) */}
      {/* } */}
    </Box>
  );
};

export default RegisterForm;