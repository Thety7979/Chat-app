import React from 'react';

// Simplified background component for better performance
const ThreeDBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10 bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Simple animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-100/20 to-transparent animate-pulse"></div>
      
      {/* Floating dots */}
      <div className="absolute top-20 left-20 w-2 h-2 bg-blue-400 rounded-full opacity-60 animate-bounce"></div>
      <div className="absolute top-40 right-32 w-3 h-3 bg-purple-400 rounded-full opacity-60 animate-bounce" style={{ animationDelay: '1s' }}></div>
      <div className="absolute bottom-32 left-1/3 w-2 h-2 bg-pink-400 rounded-full opacity-60 animate-bounce" style={{ animationDelay: '2s' }}></div>
      <div className="absolute bottom-20 right-20 w-3 h-3 bg-teal-400 rounded-full opacity-60 animate-bounce" style={{ animationDelay: '0.5s' }}></div>
    </div>
  );
};

export default ThreeDBackground;
