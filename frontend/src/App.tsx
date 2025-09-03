import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import AnimatedSignUpPage from './components/AnimatedSignUpPage';
import ChatUI from './components/ChatUI';
import ToastContainer from './components/ToastContainer';
import OAuth2Callback from './components/OAuth2Callback';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Main app content
const AppContent: React.FC = () => {

  return (
    <div className="App">
      <ToastContainer />
      <Routes>
        {/* OAuth2 Callback Route */}
        <Route path="/oauth2/callback" element={<OAuth2Callback />} />
        
        {/* Login Route */}
        <Route path="/login" element={<AnimatedSignUpPage />} />
        
        {/* Protected Chat Route */}
        <Route 
          path="/chat" 
          element={
            <ProtectedRoute>
              <ChatUI />
            </ProtectedRoute>
          } 
        />
        
        {/* Default Route - Redirect to login or chat */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Navigate to="/chat" replace />
            </ProtectedRoute>
          } 
        />
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

// Main App component with AuthProvider and Router
function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
