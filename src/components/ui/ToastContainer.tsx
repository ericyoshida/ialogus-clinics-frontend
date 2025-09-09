import React, { createContext, useCallback, useContext, useState } from 'react';
import { CustomToast } from './CustomToast';

interface ToastData {
  id: string;
  message: string;
  type?: 'error' | 'success' | 'warning' | 'info';
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: 'error' | 'success' | 'warning' | 'info', duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showSuccess: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast deve ser usado dentro de um CustomToastProvider');
  }
  return context;
};

interface CustomToastProviderProps {
  children: React.ReactNode;
}

export const CustomToastProvider: React.FC<CustomToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const showToast = useCallback((
    message: string, 
    type: 'error' | 'success' | 'warning' | 'info' = 'info', 
    duration: number = 5000
  ) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastData = { id, message, type, duration };
    
    setToasts(prev => [...prev, newToast]);
  }, []);

  const showError = useCallback((message: string, duration: number = 5000) => {
    showToast(message, 'error', duration);
  }, [showToast]);

  const showSuccess = useCallback((message: string, duration: number = 5000) => {
    showToast(message, 'success', duration);
  }, [showToast]);

  const showWarning = useCallback((message: string, duration: number = 5000) => {
    showToast(message, 'warning', duration);
  }, [showToast]);

  const showInfo = useCallback((message: string, duration: number = 5000) => {
    showToast(message, 'info', duration);
  }, [showToast]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const contextValue: ToastContextType = {
    showToast,
    showError,
    showSuccess,
    showWarning,
    showInfo
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] space-y-2">
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            style={{
              transform: `translateY(${index * 10}px)`,
              zIndex: 9999 - index
            }}
          >
            <CustomToast
              message={toast.message}
              type={toast.type}
              duration={toast.duration}
              onClose={() => removeToast(toast.id)}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}; 