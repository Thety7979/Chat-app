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
  const { user, logout } = useAuth();

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
              <div>
                <ChatUI />
                <div className="fixed top-4 right-4 flex gap-2 z-50">
                  <div className="bg-white px-3 py-2 rounded-lg shadow-lg">
                    <span className="text-sm text-gray-600">Welcome, </span>
                    <span className="text-sm font-semibold text-primary">{user?.displayName || user?.username}</span>
                  </div>
                  <button 
                    onClick={logout}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
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
