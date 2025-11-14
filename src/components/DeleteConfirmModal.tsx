import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { Tournament } from '../types';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  tournament: Tournament | null;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  tournament,
  onClose,
  onConfirm,
}) => {
  if (!tournament) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="rounded-xl max-w-md w-full"
            style={{
              background: 'rgba(30, 30, 30, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
            }}
          >
            <div
              className="p-6 flex items-center justify-between"
              style={{
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div className="flex items-center space-x-3">
                <div
                  className="p-3 rounded-lg"
                  style={{
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                  }}
                >
                  <AlertTriangle size={24} style={{ color: '#EF4444' }} />
                </div>
                <h3 className="text-xl font-bold text-white">
                  Delete Tournament
                </h3>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div
                className="p-4 rounded-lg"
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                }}
              >
                <p className="text-gray-300 text-sm leading-relaxed">
                  Are you sure you want to delete this tournament? This action cannot be undone.
                </p>
              </div>

              <div
                className="p-4 rounded-lg space-y-2"
                style={{
                  background: 'rgba(18, 18, 18, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm font-medium">Tournament:</span>
                  <span className="text-white font-bold">{tournament.title}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm font-medium">Game Type:</span>
                  <span className="text-white font-bold">{tournament.gameType}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm font-medium">Participants:</span>
                  <span className="text-white font-bold">
                    {tournament.currentParticipants}/{tournament.maxParticipants}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm font-medium">Prize Pool:</span>
                  <span className="font-bold" style={{ color: '#10B981' }}>{tournament.prizePool} AX</span>
                </div>
              </div>

              {tournament.currentParticipants > 0 && (
                <div
                  className="p-4 rounded-lg flex items-start space-x-3"
                  style={{
                    background: 'rgba(251, 191, 36, 0.1)',
                    border: '1px solid rgba(251, 191, 36, 0.3)',
                  }}
                >
                  <AlertTriangle size={20} style={{ color: '#FBBF24', marginTop: '2px' }} />
                  <div>
                    <p className="text-yellow-400 font-bold text-sm mb-1">Warning</p>
                    <p className="text-gray-300 text-xs leading-relaxed">
                      This tournament has {tournament.currentParticipants} participant
                      {tournament.currentParticipants !== 1 ? 's' : ''}. Deleting it may affect their
                      experience and registered data.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  onClick={onClose}
                  className="px-6 py-3 rounded-lg font-medium transition-all"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#888888',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                  }}
                  className="px-6 py-3 rounded-lg font-medium transition-all"
                  style={{
                    background: '#EF4444',
                    color: '#fff',
                  }}
                >
                  Delete Tournament
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DeleteConfirmModal;