// client/src/App.jsx

import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import { AuthProvider }    from './context/AuthContext';
import ProtectedRoute      from './components/ProtectedRoute';
import LoginPage           from './pages/LoginPage';
import RegisterPage        from './pages/RegisterPage';
import InterviewPage       from './pages/InterviewPage';
import DashboardPage       from './pages/DashboardPage';   // ← NEW

import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

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

          {/* NEW */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          <Route path="/"  element={<Navigate to="/dashboard" replace />} />
          <Route path="*"  element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;