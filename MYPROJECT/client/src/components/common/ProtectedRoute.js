import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../App';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ children }) => {
  const { user, token, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  // Check if user is authenticated
  if (!user || !token) {
    // Redirect to login with current location
    return (
      <Navigate 
        to="/login" 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // Check if user account is verified
  if (!user.isVerified) {
    return (
      <Navigate 
        to="/verify-otp" 
        state={{ 
          email: user.email, 
          type: 'verify',
          from: location 
        }} 
        replace 
      />
    );
  }

  // User is authenticated and verified, render protected content
  return <>{children}</>;
};

export default ProtectedRoute;