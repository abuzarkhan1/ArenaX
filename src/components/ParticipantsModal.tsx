import React, { useState } from 'react';
import { X, UserMinus, AlertTriangle, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ParticipantsModal = ({ isOpen, tournament, onClose, onRemoveParticipant }) => {
  const [removing, setRemoving] = useState(null);
  const [confirmRemove, setConfirmRemove] = useState(null);

  const handleRemove = async (participantId) => {
    if (!tournament) return;
    
    setRemoving(participantId);
    try {
      await onRemoveParticipant(tournament._id, participantId);
      setConfirmRemove(null);
    } catch (error) {
      console.error('Error removing participant:', error);
    } finally {
      setRemoving(null);
    }
  };

  if (!isOpen || !tournament) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 flex items-center justify-center z-50 p-4"
        style={{
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(10px)'
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          style={{
            background: 'rgba(30, 30, 30, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
          }}
        >
          {/* Header */}
          <div
            className="p-6 flex items-center justify-between"
            style={{
              background: 'rgba(30, 30, 30, 0.95)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <Users size={32} style={{ color: '#00BFFF' }} />
                <h3 className="text-2xl font-bold text-white">
                  Tournament Participants
                </h3>
              </div>
              <p className="text-gray-400 text-sm font-medium">
                {tournament.title}
              </p>
              <div className="flex items-center space-x-2 mt-2">
                <span className="text-white font-bold text-lg">
                  {tournament.currentParticipants}/{tournament.maxParticipants}
                </span>
                <span className="text-gray-500">participants</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg"
              style={{
                background: 'rgba(255, 255, 255, 0.05)'
              }}
            >
              <X size={24} />
            </button>
          </div>

          {/* Participants List */}
          <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
            {tournament.participants && tournament.participants.length > 0 ? (
              <div className="p-6 space-y-3">
                {tournament.participants.map((participant, index) => (
                  <motion.div
                    key={participant._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 rounded-lg flex items-center justify-between hover:bg-opacity-80 transition-all"
                    style={{
                      background: 'rgba(18, 18, 18, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg"
                        style={{
                          background: '#00BFFF',
                          color: 'white'
                        }}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-white font-bold text-lg">
                          {participant.username || participant.userId?.username || 'Unknown User'}
                        </p>
                        <div className="flex items-center space-x-3 text-sm mt-1">
                          <span className="text-gray-400">
                            Kills: <span style={{ color: '#00BFFF' }} className="font-bold">{participant.kills || 0}</span>
                          </span>
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-400">
                            Rank: <span style={{ color: '#10B981' }} className="font-bold">#{participant.finalRank || '-'}</span>
                          </span>
                          <span className="text-gray-400">•</span>
                          <span
                            className="px-2 py-1 rounded text-xs font-bold"
                            style={{
                              background: participant.status === 'verified' 
                                ? 'rgba(16, 185, 129, 0.2)' 
                                : 'rgba(251, 191, 36, 0.2)',
                              color: participant.status === 'verified' ? '#10B981' : '#FBBF24',
                              border: `1px solid ${participant.status === 'verified' ? '#10B981' : '#FBBF24'}40`
                            }}
                          >
                            {participant.status || 'pending'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      {confirmRemove === participant._id ? (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setConfirmRemove(null)}
                            className="px-3 py-2 rounded-lg text-sm font-medium transition-all"
                            style={{
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              color: '#888888'
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleRemove(participant._id)}
                            disabled={removing === participant._id}
                            className="px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-1 transition-all disabled:opacity-50"
                            style={{
                              background: 'rgba(239, 68, 68, 0.2)',
                              color: '#EF4444',
                              border: '1px solid rgba(239, 68, 68, 0.4)'
                            }}
                          >
                            <AlertTriangle size={16} />
                            <span>{removing === participant._id ? 'Removing...' : 'Confirm'}</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmRemove(participant._id)}
                          className="p-2 rounded-lg flex items-center space-x-2 transition-all"
                          style={{
                            background: 'rgba(239, 68, 68, 0.2)',
                            color: '#EF4444',
                            border: '1px solid rgba(239, 68, 68, 0.4)'
                          }}
                          title="Remove Participant"
                        >
                          <UserMinus size={18} />
                          <span className="text-sm font-medium">Remove</span>
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.6 }}
                >
                  <Users size={64} className="mx-auto text-gray-600 mb-4" />
                </motion.div>
                <div className="text-gray-400 space-y-2">
                  <p className="text-2xl font-bold">No participants yet</p>
                  <p className="text-sm">Waiting for players to join this tournament</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            className="p-4 flex justify-between items-center"
            style={{
              background: 'rgba(30, 30, 30, 0.95)',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <p className="text-gray-400 text-sm font-medium">
              Click remove to delete a participant from the tournament
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-lg font-medium transition-all"
              style={{
                background: '#00BFFF',
                color: 'white'
              }}
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>

      <style>{`
        ::-webkit-scrollbar {
          width: 10px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(18, 18, 18, 0.5);
        }

        ::-webkit-scrollbar-thumb {
          background: #00BFFF;
          border-radius: 5px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #00A8E8;
        }
      `}</style>
    </AnimatePresence>
  );
};

export default ParticipantsModal;