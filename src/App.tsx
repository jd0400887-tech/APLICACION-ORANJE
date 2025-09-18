import React from 'react';

import { useAuth } from './context/AuthContext';
import { ThemeContextProvider } from './context/ThemeContext';
import ThemeWrapper from './components/ThemeWrapper';

function App() {
  const { currentUser } = useAuth();
  {import.meta.env.DEV && console.log('App: currentUser value:', currentUser)};

  return (
    <ThemeContextProvider>
      <ThemeWrapper />
    </ThemeContextProvider>
  );
}

export default App;