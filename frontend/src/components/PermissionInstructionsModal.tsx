import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PermissionInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'camera' | 'microphone' | 'both';
}

const PermissionInstructionsModal: React.FC<PermissionInstructionsModalProps> = ({
  isOpen,
  onClose,
  type
}) => {
  if (!isOpen) return null;

  const getTitle = () => {
    switch (type) {
      case 'camera':
        return 'Cấp quyền truy cập Camera';
      case 'microphone':
        return 'Cấp quyền truy cập Microphone';
      case 'both':
        return 'Cấp quyền truy cập Camera và Microphone';
      default:
        return 'Cấp quyền truy cập';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'camera':
        return 'fas fa-video';
      case 'microphone':
        return 'fas fa-microphone';
      case 'both':
        return 'fas fa-video';
      default:
        return 'fas fa-cog';
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black bg-opacity-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
        
        {/* Modal */}
        <motion.div
          className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white text-center">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full mx-auto mb-4 flex items-center justify-center">
              <i className={`${getIcon()} text-2xl`}></i>
            </div>
            <h2 className="text-xl font-semibold mb-2">{getTitle()}</h2>
            <p className="text-blue-100 text-sm">
              Để sử dụng tính năng gọi video, bạn cần cấp quyền truy cập
            </p>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-semibold text-sm">1</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Nhấn vào biểu tượng khóa</h3>
                  <p className="text-gray-600 text-sm">
                    Tìm biểu tượng khóa hoặc camera trên thanh địa chỉ trình duyệt
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-semibold text-sm">2</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Chọn "Cho phép"</h3>
                  <p className="text-gray-600 text-sm">
                    Chọn "Cho phép" cho microphone và camera khi được hỏi
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-semibold text-sm">3</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Làm mới trang</h3>
                  <p className="text-gray-600 text-sm">
                    Nhấn F5 hoặc Ctrl+R để làm mới trang web
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-semibold text-sm">4</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Thử lại</h3>
                  <p className="text-gray-600 text-sm">
                    Thử gọi video lại sau khi đã cấp quyền
                  </p>
                </div>
              </div>
            </div>

            {/* Troubleshooting */}
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h4 className="font-semibold text-yellow-800 mb-2">
                <i className="fas fa-exclamation-triangle mr-2"></i>
                Nếu vẫn không hoạt động:
              </h4>
              <ul className="text-yellow-700 text-sm space-y-1">
                <li>• Kiểm tra xem camera có đang được sử dụng bởi ứng dụng khác không</li>
                <li>• Thử đóng các tab khác đang sử dụng camera</li>
                <li>• Khởi động lại trình duyệt</li>
                <li>• Kiểm tra cài đặt quyền riêng tư của trình duyệt</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-end space-x-3">
              <motion.button
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                onClick={onClose}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Đóng
              </motion.button>
              <motion.button
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                onClick={() => {
                  window.location.reload();
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Làm mới trang
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PermissionInstructionsModal;
