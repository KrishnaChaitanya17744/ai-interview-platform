// client/src/App.jsx

import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute  from './components/ProtectedRoute';
import LoginPage       from './pages/LoginPage';
import RegisterPage    from './pages/RegisterPage';
import InterviewPage   from './pages/InterviewPage';

import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>

          {/* Public routes */}
          <Route path="/login"    element={<LoginPage />}    />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes */}
          <Route
            path="/interview"
            element={
              <ProtectedRoute>
                <div className="app-wrapper">
                  <InterviewPage />
                </div>
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route path="/"  element={<Navigate to="/interview" replace />} />
          <Route path="*"  element={<Navigate to="/interview" replace />} />

        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;