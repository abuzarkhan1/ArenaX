import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Video, ExternalLink } from 'lucide-react';
import { Tournament, StreamingConfig } from '../types';

interface CreateTournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Tournament) => Promise<void>;
}

const CreateTournamentModal: React.FC<CreateTournamentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Tournament>({
    title: '',
    description: '',
    gameType: 'Free Fire',
    entryFee: 0,
    prizePool: 0,
    maxParticipants: 0,
    prizeDistribution: [],
    scheduledDate: '',
    rules: '',
    bannerImage: '',
    streaming: {
      enabled: false,
      platform: 'None',
      streamUrl: '',
      streamTitle: '',
      streamStatus: 'not_started'
    }
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'entryFee' || name === 'prizePool' || name === 'maxParticipants'
        ? Number(value)
        : value,
    }));
  };

  const handleStreamingChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const actualValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setFormData((prev) => ({
      ...prev,
      streaming: {
        ...prev.streaming!,
        [name]: actualValue
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
      setFormData({
        title: '',
        description: '',
        gameType: 'Free Fire',
        entryFee: 0,
        prizePool: 0,
        maxParticipants: 0,
        prizeDistribution: [],
        scheduledDate: '',
        rules: '',
        bannerImage: '',
        streaming: {
          enabled: false,
          platform: 'None',
          streamUrl: '',
          streamTitle: '',
          streamStatus: 'not_started'
        }
      });
    } catch (error) {
      console.error('Error creating tournament:', error);
    } finally {
      setLoading(false);
    }
  };

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
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            style={{
              background: 'rgba(30, 30, 30, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div
              className="sticky top-0 p-6 flex items-center justify-between z-10"
              style={{
                background: 'rgba(30, 30, 30, 0.95)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <h3 className="text-2xl font-bold text-white">
                Create Tournament
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                }}
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-gray-400 text-sm font-medium mb-2 block">Title</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg text-white focus:outline-none transition-all"
                    style={{
                      background: 'rgba(18, 18, 18, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  />
                </div>

                <div>
                  <label className="text-gray-400 text-sm font-medium mb-2 block">Game Type</label>
                  <select
                    name="gameType"
                    value={formData.gameType}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg text-white focus:outline-none transition-all"
                    style={{
                      background: 'rgba(18, 18, 18, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <option value="Free Fire">Free Fire</option>
                    <option value="PUBG Mobile">PUBG Mobile</option>
                    <option value="Call of Duty Mobile">Call of Duty Mobile</option>
                    <option value="Valorant">Valorant</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-gray-400 text-sm font-medium mb-2 block">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg text-white focus:outline-none transition-all resize-none"
                  style={{
                    background: 'rgba(18, 18, 18, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-gray-400 text-sm font-medium mb-2 block">Entry Fee (AX)</label>
                  <input
                    type="number"
                    name="entryFee"
                    value={formData.entryFee}
                    onChange={handleChange}
                    required
                    min="0"
                    className="w-full px-4 py-3 rounded-lg text-white focus:outline-none transition-all"
                    style={{
                      background: 'rgba(18, 18, 18, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  />
                </div>

                <div>
                  <label className="text-gray-400 text-sm font-medium mb-2 block">Prize Pool (AX)</label>
                  <input
                    type="number"
                    name="prizePool"
                    value={formData.prizePool}
                    onChange={handleChange}
                    required
                    min="0"
                    className="w-full px-4 py-3 rounded-lg text-white focus:outline-none transition-all"
                    style={{
                      background: 'rgba(18, 18, 18, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  />
                </div>

                <div>
                  <label className="text-gray-400 text-sm font-medium mb-2 block">Max Participants</label>
                  <input
                    type="number"
                    name="maxParticipants"
                    value={formData.maxParticipants}
                    onChange={handleChange}
                    required
                    min="2"
                    className="w-full px-4 py-3 rounded-lg text-white focus:outline-none transition-all"
                    style={{
                      background: 'rgba(18, 18, 18, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-400 text-sm font-medium mb-2 block">Scheduled Date & Time</label>
                <input
                  type="datetime-local"
                  name="scheduledDate"
                  value={formData.scheduledDate}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg text-white focus:outline-none transition-all"
                  style={{
                    background: 'rgba(18, 18, 18, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                />
              </div>

              <div>
                <label className="text-gray-400 text-sm font-medium mb-2 block">Rules</label>
                <textarea
                  name="rules"
                  value={formData.rules}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg text-white focus:outline-none transition-all resize-none"
                  style={{
                    background: 'rgba(18, 18, 18, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                />
              </div>

              <div>
                <label className="text-gray-400 text-sm font-medium mb-2 block">Banner Image URL (Optional)</label>
                <input
                  type="url"
                  name="bannerImage"
                  value={formData.bannerImage}
                  onChange={handleChange}
                  placeholder="https://example.com/banner.jpg"
                  className="w-full px-4 py-3 rounded-lg text-white focus:outline-none transition-all"
                  style={{
                    background: 'rgba(18, 18, 18, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                />
                {formData.bannerImage && (
                  <div className="mt-3 rounded-lg overflow-hidden">
                    <img 
                      src={formData.bannerImage} 
                      alt="Banner preview" 
                      className="w-full h-48 object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Live Streaming Section */}
              <div
                className="p-6 rounded-lg space-y-4"
                style={{
                  background: 'rgba(138, 43, 226, 0.1)',
                  border: '1px solid rgba(138, 43, 226, 0.3)',
                }}
              >
                <div className="flex items-center space-x-3">
                  <Video size={24} className="text-purple-400" />
                  <h4 className="text-xl font-bold text-white">Live Streaming Configuration</h4>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="enabled"
                    checked={formData.streaming?.enabled}
                    onChange={handleStreamingChange}
                    className="w-5 h-5 rounded"
                    style={{
                      accentColor: '#8A2BE2'
                    }}
                  />
                  <label className="text-gray-300 font-medium">
                    Enable live streaming for this tournament
                  </label>
                </div>

                {formData.streaming?.enabled && (
                  <div className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-gray-400 text-sm font-medium mb-2 block">
                          Streaming Platform
                        </label>
                        <select
                          name="platform"
                          value={formData.streaming.platform}
                          onChange={handleStreamingChange}
                          className="w-full px-4 py-3 rounded-lg text-white focus:outline-none transition-all"
                          style={{
                            background: 'rgba(18, 18, 18, 0.8)',
                            border: '1px solid rgba(138, 43, 226, 0.4)',
                          }}
                        >
                          <option value="None">Select Platform</option>
                          <option value="YouTube">YouTube</option>
                          <option value="Twitch">Twitch</option>
                          <option value="Facebook">Facebook Live</option>
                          <option value="Custom">Custom Platform</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-gray-400 text-sm font-medium mb-2 block">
                          Stream Title (Optional)
                        </label>
                        <input
                          type="text"
                          name="streamTitle"
                          value={formData.streaming.streamTitle || ''}
                          onChange={handleStreamingChange}
                          placeholder="e.g., Grand Finals Live"
                          className="w-full px-4 py-3 rounded-lg text-white focus:outline-none transition-all"
                          style={{
                            background: 'rgba(18, 18, 18, 0.8)',
                            border: '1px solid rgba(138, 43, 226, 0.4)',
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-gray-400 text-sm font-medium mb-2 block flex items-center space-x-2">
                        <span>Stream URL *</span>
                        <ExternalLink size={16} />
                      </label>
                      <input
                        type="url"
                        name="streamUrl"
                        value={formData.streaming.streamUrl}
                        onChange={handleStreamingChange}
                        required={formData.streaming.enabled}
                        placeholder="https://youtube.com/watch?v=..."
                        className="w-full px-4 py-3 rounded-lg text-white focus:outline-none transition-all"
                        style={{
                          background: 'rgba(18, 18, 18, 0.8)',
                          border: '1px solid rgba(138, 43, 226, 0.4)',
                        }}
                      />
                      <p className="text-gray-500 text-xs mt-2">
                        Enter the complete URL where users can watch the stream (YouTube, Twitch, etc.)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 rounded-lg font-medium transition-all hover:bg-opacity-80"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#888888',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-3 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: loading ? 'rgba(156, 163, 175, 0.5)' : '#00BFFF',
                    color: 'white',
                  }}
                >
                  {loading ? 'Creating...' : 'Create Tournament'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CreateTournamentModal;