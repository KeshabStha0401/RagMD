import React, { createContext, useContext } from 'react';

// Local-only auth: a single implicit user, no remote calls.
const AuthContext = createContext(null);

const LOCAL_USER = {
  id: 'local-user',
  email: 'local@localhost',
  full_name: 'Local User',
  role: 'admin',
};

export const AuthProvider = ({ children }) => {
  const value = {
    user: LOCAL_USER,
    isAuthenticated: true,
    isLoadingAuth: false,
    isLoadingPublicSettings: false,
    authError: null,
    appPublicSettings: null,
    authChecked: true,
    logout: () => {},
    navigateToLogin: () => {},
    checkUserAuth: async () => LOCAL_USER,
    checkAppState: async () => {},
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
