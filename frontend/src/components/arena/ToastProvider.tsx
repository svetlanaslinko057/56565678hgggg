'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { Check, X, Trophy, AlertCircle, Bell, Zap } from 'lucide-react';

// ==================== TYPES ====================

export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'win' | 'loss';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  amount?: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  notifyWin: (title: string, amount: string, message?: string) => void;
  notifyLoss: (title: string, message?: string) => void;
  notifyResolved: (title: string, outcome: string) => void;
  notifyBetPlaced: (marketTitle: string, amount: string, outcome: string) => void;
}

// ==================== ANIMATIONS ====================

const slideIn = keyframes`
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

const slideOut = keyframes`
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
`;

// ==================== STYLES ====================

const ToastContainer = styled.div`
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 380px;
  
  @media (max-width: 640px) {
    right: 10px;
    left: 10px;
    max-width: none;
  }
`;

const ToastItem = styled.div<{ $type: ToastType; $isExiting?: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  animation: ${({ $isExiting }) => $isExiting ? css`${slideOut} 0.3s ease-out forwards` : css`${slideIn} 0.3s ease-out`};
  border-left: 4px solid;
  
  ${({ $type }) => {
    switch ($type) {
      case 'success':
      case 'win':
        return css`
          border-left-color: #10B981;
          background: linear-gradient(135deg, #ECFDF5 0%, #fff 100%);
        `;
      case 'error':
      case 'loss':
        return css`
          border-left-color: #EF4444;
          background: linear-gradient(135deg, #FEF2F2 0%, #fff 100%);
        `;
      case 'warning':
        return css`
          border-left-color: #F59E0B;
          background: linear-gradient(135deg, #FFFBEB 0%, #fff 100%);
        `;
      default:
        return css`
          border-left-color: #3B82F6;
          background: linear-gradient(135deg, #EFF6FF 0%, #fff 100%);
        `;
    }
  }}
`;

const IconWrapper = styled.div<{ $type: ToastType }>`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  ${({ $type }) => {
    switch ($type) {
      case 'success':
      case 'win':
        return css`
          background: #10B981;
          color: white;
          animation: ${pulse} 0.5s ease-out;
        `;
      case 'error':
      case 'loss':
        return css`
          background: #EF4444;
          color: white;
        `;
      case 'warning':
        return css`
          background: #F59E0B;
          color: white;
        `;
      default:
        return css`
          background: #3B82F6;
          color: white;
        `;
    }
  }}
`;

const ToastContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const ToastTitle = styled.div`
  font-weight: 600;
  font-size: 14px;
  color: #0f172a;
  margin-bottom: 4px;
`;

const ToastMessage = styled.div`
  font-size: 13px;
  color: #64748b;
  line-height: 1.4;
`;

const ToastAmount = styled.div<{ $type: ToastType }>`
  font-weight: 700;
  font-size: 18px;
  margin-top: 8px;
  
  ${({ $type }) => {
    switch ($type) {
      case 'win':
      case 'success':
        return css`color: #10B981;`;
      case 'loss':
      case 'error':
        return css`color: #EF4444;`;
      default:
        return css`color: #3B82F6;`;
    }
  }}
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: #94a3b8;
  transition: color 0.2s;
  
  &:hover {
    color: #64748b;
  }
`;

// ==================== CONTEXT ====================

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

// ==================== PROVIDER ====================

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [exitingIds, setExitingIds] = useState<Set<string>>(new Set());

  const removeToast = useCallback((id: string) => {
    setExitingIds(prev => new Set(prev).add(id));
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
      setExitingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 300);
  }, []);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast = { ...toast, id };
    
    setToasts(prev => [...prev, newToast]);

    // Auto remove after duration
    const duration = toast.duration || (toast.type === 'win' ? 6000 : 4000);
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  // Convenience methods
  const notifyWin = useCallback((title: string, amount: string, message?: string) => {
    addToast({
      type: 'win',
      title: '🎉 ' + title,
      message,
      amount: '+' + amount,
      duration: 6000,
    });
  }, [addToast]);

  const notifyLoss = useCallback((title: string, message?: string) => {
    addToast({
      type: 'loss',
      title,
      message,
      duration: 4000,
    });
  }, [addToast]);

  const notifyResolved = useCallback((title: string, outcome: string) => {
    addToast({
      type: 'info',
      title: 'Market Resolved',
      message: `"${title}" resolved: ${outcome}`,
      duration: 5000,
    });
  }, [addToast]);

  const notifyBetPlaced = useCallback((marketTitle: string, amount: string, outcome: string) => {
    addToast({
      type: 'success',
      title: 'Bet Placed',
      message: `${amount} on ${outcome} for "${marketTitle}"`,
      duration: 3000,
    });
  }, [addToast]);

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <Check size={20} />;
      case 'win':
        return <Trophy size={20} />;
      case 'error':
      case 'loss':
        return <X size={20} />;
      case 'warning':
        return <AlertCircle size={20} />;
      default:
        return <Bell size={20} />;
    }
  };

  return (
    <ToastContext.Provider value={{
      toasts,
      addToast,
      removeToast,
      notifyWin,
      notifyLoss,
      notifyResolved,
      notifyBetPlaced,
    }}>
      {children}
      
      <ToastContainer>
        {toasts.map(toast => (
          <ToastItem 
            key={toast.id} 
            $type={toast.type}
            $isExiting={exitingIds.has(toast.id)}
          >
            <IconWrapper $type={toast.type}>
              {getIcon(toast.type)}
            </IconWrapper>
            
            <ToastContent>
              <ToastTitle>{toast.title}</ToastTitle>
              {toast.message && <ToastMessage>{toast.message}</ToastMessage>}
              {toast.amount && <ToastAmount $type={toast.type}>{toast.amount}</ToastAmount>}
            </ToastContent>
            
            <CloseButton onClick={() => removeToast(toast.id)}>
              <X size={16} />
            </CloseButton>
          </ToastItem>
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
}
