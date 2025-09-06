import React, { useRef, useEffect } from 'react';

interface MessagePopupMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onRecall?: () => void;
  onForward?: () => void;
  onReply?: () => void;
  onReact?: () => void;
  isOutgoing?: boolean;
  position?: 'left' | 'right';
}

const MessagePopupMenu: React.FC<MessagePopupMenuProps> = ({
  isOpen,
  onClose,
  onRecall,
  onForward,
  onReply,
  onReact,
  isOutgoing = false,
  position = 'left'
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = () => {
      onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Add click listener with delay to prevent immediate closing
      const timeoutId = setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 200);
      
      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('keydown', handleEscape);
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className={`absolute bottom-full mb-2 bg-white rounded-lg shadow-lg border z-50 min-w-[140px] ${
        position === 'right' ? 'right-0' : 'left-0'
      }`}
      style={{
        // Ensure the popup doesn't cause horizontal scroll
        maxWidth: '200px',
        wordWrap: 'break-word'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="py-1">
        {onReply && (
          <button
            onClick={onReply}
            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
          >
            <i className="fas fa-reply text-xs w-4"></i>
            <span>Trả lời</span>
          </button>
        )}
        
        {onReact && (
          <button
            onClick={onReact}
            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
          >
            <i className="fas fa-smile text-xs w-4"></i>
            <span>Cảm xúc</span>
          </button>
        )}
        
        {isOutgoing && onRecall && (
          <button
            onClick={onRecall}
            className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
          >
            <i className="fas fa-undo text-xs w-4"></i>
            <span>Thu hồi</span>
          </button>
        )}
        
        {onForward && (
          <button
            onClick={onForward}
            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
          >
            <i className="fas fa-share text-xs w-4"></i>
            <span>Chuyển tiếp</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default MessagePopupMenu;
