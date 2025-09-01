import React, { useState, useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ 
  message, 
  type = 'info', 
  duration = 3000, 
  onClose 
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onClose();
      }, 300); // Wait for fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const getToastStyles = () => {
    const baseStyles = "min-w-[300px] max-w-[400px] p-4 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out font-sans";
    const visibilityStyles = isVisible ? "translate-x-0" : "translate-x-full opacity-0";
    
    const typeStyles = {
      success: "bg-green-50 border-l-4 border-green-500 text-green-800",
      error: "bg-red-50 border-l-4 border-red-500 text-red-800",
      warning: "bg-yellow-50 border-l-4 border-yellow-500 text-yellow-800",
      info: "bg-blue-50 border-l-4 border-blue-500 text-blue-800"
    };

    return `${baseStyles} ${visibilityStyles} ${typeStyles[type]}`;
  };

  const getIcon = () => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return 'ℹ️';
    }
  };

  return (
    <div className={getToastStyles()}>
      <div className="flex items-center gap-3">
        <div className="text-xl flex-shrink-0">
          {getIcon()}
        </div>
        <div className="flex-1 text-sm leading-relaxed">
          {message}
        </div>
        <button
          onClick={handleClose}
          className="bg-transparent border-none text-lg cursor-pointer text-gray-500 p-0 w-5 h-5 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors duration-200"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default Toast;
