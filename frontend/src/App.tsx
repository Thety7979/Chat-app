import React, { useState } from 'react';
import './App.css';
import AnimatedSignUpPage from './components/AnimatedSignUpPage';
import ChatUI from './components/ChatUI';

function App() {
  const [currentPage, setCurrentPage] = useState<'signup' | 'chat'>('chat');

  return (
    <div className="App">
      {currentPage === 'signup' ? (
        <div>
          <AnimatedSignUpPage />
          <button 
            onClick={() => setCurrentPage('chat')}
            className="fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors z-50"
          >
            Chuyển sang Chat
          </button>
        </div>
      ) : (
        <div>
          <ChatUI />
          <button 
            onClick={() => setCurrentPage('signup')}
            className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors z-50"
          >
            Chuyển sang Sign Up
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
