import React from 'react';
import Registration from './Registration';
import AdminDashboard from './AdminDashboard';

import { ThemeProvider } from './ThemeContext';

export default function App() {
  const path = window.location.pathname;

  let Content;
  if (path === '/admin') {
    Content = <AdminDashboard />;
  } else {
    // Default route (/)
    Content = <Registration />;
  }

  return (
    <ThemeProvider>
      {Content}
    </ThemeProvider>
  );
}
