// client/src/components/ProtectedRoute.jsx

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Show nothing while checking localStorage
  if (loading) {
    return (
      <div style={{
        minHeight:      '100vh',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        background:     '#0a0b0f',
        color:          '#667eea',
        fontSize:       '1rem',
        fontFamily:     'Plus Jakarta Sans, sans-serif',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width:        '36px',
            height:       '36px',
            border:       '3px solid #1c1f29',
            borderTop:    '3px solid #4f6ef7',
            borderRadius: '50%',
            animation:    'spin 0.8s linear infinite',
            margin:       '0 auto 12px',
          }} />
          Loading...
        </div>
      </div>
    );
  }

  // Not logged in — redirect to login, remember where they came from
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;