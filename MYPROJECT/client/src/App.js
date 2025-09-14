import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { apiUtils } from './services/api';

// Import components
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import OTPVerification from './components/Auth/OTPVerification';
import Dashboard from './components/Dashboard/Dashboard';
import Header from './components/common/Header';
import ProtectedRoute from './components/common/ProtectedRoute';
import LoadingSpinner from './components/common/LoadingSpinner';
import ErrorBoundary from './components/common/ErrorBoundary';

// Create Auth Context
const AuthContext = createContext();

// Auth Context Provider
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  // Initialize auth state on app load
  useEffect(() => {
    const initAuth = () => {
      const storedToken = apiUtils.getToken();
      const storedUser = apiUtils.getUser();
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);
        apiUtils.setAuthToken(storedToken);
      }
      
      setLoading(false);
    };

    initAuth();
  }, []);

  // Login function
  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    apiUtils.setAuthToken(authToken);
    apiUtils.setUser(userData);
  };

  // Logout function
  const logout = () => {
    setUser(null);
    setToken(null);
    apiUtils.clearAuth();
  };

  // Update user function
  const updateUser = (userData) => {
    setUser(userData);
    apiUtils.setUser(userData);
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user && !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Main App Component
const App = () => {
  const [notification, setNotification] = useState(null);

  // Show notification
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // Global error handler
  const handleGlobalError = (error) => {
    console.error('Global error:', error);
    showNotification(
      apiUtils.handleError(error) || 'An unexpected error occurred',
      'error'
    );
  };

  return (
    <ErrorBoundary onError={handleGlobalError}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <AppContent 
              notification={notification}
              showNotification={showNotification}
              onError={handleGlobalError}
            />
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
};

// App Content Component
const AppContent = ({ notification, showNotification, onError }) => {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <>
      {/* Global Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md ${
          notification.type === 'error' 
            ? 'bg-red-500 text-white' 
            : notification.type === 'success'
            ? 'bg-green-500 text-white'
            : 'bg-blue-500 text-white'
        }`}>
          <div className="flex items-center justify-between">
            <p className="text-sm">{notification.message}</p>
            <button
              onClick={() => showNotification(null)}
              className="ml-4 text-white hover:text-gray-200"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Header - only show on protected routes */}
      {isAuthenticated && <Header />}

      {/* Routes */}
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={
            isAuthenticated ? 
            <Navigate to="/dashboard" /> : 
            <Login showNotification={showNotification} onError={onError} />
          } 
        />
        <Route 
          path="/signup" 
          element={
            isAuthenticated ? 
            <Navigate to="/dashboard" /> : 
            <Signup showNotification={showNotification} onError={onError} />
          } 
        />
        <Route 
          path="/verify-otp" 
          element={
            isAuthenticated ? 
            <Navigate to="/dashboard" /> : 
            <OTPVerification showNotification={showNotification} onError={onError} />
          } 
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard showNotification={showNotification} onError={onError} />
            </ProtectedRoute>
          }
        />

        {/* Redirect root to appropriate page */}
        <Route
          path="/"
          element={
            <Navigate to={isAuthenticated ? "/dashboard" : "/login"} />
          }
        />

        {/* 404 Route */}
        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
                <p className="text-gray-600 mb-4">Page not found</p>
                <button
                  onClick={() => window.history.back()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Go Back
                </button>
              </div>
            </div>
          }
        />
      </Routes>
    </>
  );
};

export default App;