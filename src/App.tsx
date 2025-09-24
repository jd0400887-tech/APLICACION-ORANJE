import React from 'react';

import { useAuth } from './context/AuthContext';
import { ThemeContextProvider } from './context/ThemeContext';
import ThemeWrapper from './components/ThemeWrapper';

function App() {
  const { currentUser } = useAuth();

  return (
    <ThemeContextProvider>
      <ThemeWrapper />
    </ThemeContextProvider>
  );
}

export default App;