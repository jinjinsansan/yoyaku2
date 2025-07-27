import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'confirm' | 'success';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = '確認',
  cancelText = 'キャンセル',
  type = 'confirm'
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="text-center">
        <div className="flex justify-center mb-4">
          {type === 'confirm' ? (
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
            </div>
          ) : (
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          )}
        </div>
        
        <p className="text-slate-600 mb-6 leading-relaxed">
          {message}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {type === 'confirm' && (
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1 sm:flex-none"
            >
              {cancelText}
            </Button>
          )}
          <Button 
            onClick={handleConfirm}
            className={`flex-1 sm:flex-none ${
              type === 'success' ? 'w-full' : ''
            }`}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}; 