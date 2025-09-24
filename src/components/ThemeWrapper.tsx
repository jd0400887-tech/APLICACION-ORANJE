import React, { useMemo } from 'react';
import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import LoginPage from './LoginPage';
import Register from '../pages/Register';
import CandidateSubmissionForm from '../pages/CandidateSubmissionForm';
import CandidateOnboarding from '../pages/CandidateOnboarding';
import AuthenticatedAppContent from './AuthenticatedAppContent';
import { useAuth } from '../context/AuthContext';
import { useThemeContext } from '../context/ThemeContext';
import getAppTheme from '../theme';

const ThemeWrapper: React.FC = () => {
  const { currentUser } = useAuth();
  const { mode } = useThemeContext();
  const theme = useMemo(() => getAppTheme(mode), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/candidate-submission" element={<CandidateSubmissionForm />} />
          

          {currentUser ? (
            <>
              <Route path="/candidate-onboarding" element={<CandidateOnboarding />} />
              <Route path="/*" element={<AuthenticatedAppContent />} />
            </>
          ) : (
            <Route path="/*" element={<Navigate to="/login" replace />} />
          )}
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default ThemeWrapper;
