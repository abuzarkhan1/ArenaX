import React, { useState, useEffect } from 'react';
import { X, Save, Video, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tournament } from '../types';

interface EditTournamentModalProps {
  isOpen: boolean;
  tournament: Tournament | null;
  onClose: () => void;
  onSubmit: (id: string, data: Partial<Tournament>) => Promise<void>;
}

const EditTournamentModal: React.FC<EditTournamentModalProps> = ({
  isOpen,
  tournament,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    gameType: '',
    entryFee: 0,
    prizePool: 0,
    maxParticipants: 0,
    scheduledDate: '',
    rules: '',
    bannerImage: '',
    streaming: {
      enabled: false,
      platform: 'None' as 'YouTube' | 'Twitch' | 'Facebook' | 'Custom' | 'None',
      streamUrl: '',
      streamTitle: '',
      streamStatus: 'not_started' as 'not_started' | 'live' | 'ended' | 'cancelled'
    }
  });
  const [imagePreview, setImagePreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (tournament) {
      setFormData({
        title: tournament.title || '',
        description: tournament.description || '',
        gameType: tournament.gameType || '',
        entryFee: tournament.entryFee || 0,
        prizePool: tournament.prizePool || 0,
        maxParticipants: tournament.maxParticipants || 0,
        scheduledDate: tournament.scheduledDate 
          ? new Date(tournament.scheduledDate).toISOString().slice(0, 16) 
          : '',
        rules: tournament.rules || '',
        bannerImage: tournament.bannerImage || '',
        streaming: tournament.streaming || {
          enabled: false,
          platform: 'None',
          streamUrl: '',
          streamTitle: '',
          streamStatus: 'not_started'
        }
      });
      setImagePreview(tournament.bannerImage || '');
    }
  }, [tournament]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['entryFee', 'prizePool', 'maxParticipants'].includes(name) 
        ? Number(value) 
        : value
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
        ...prev.streaming,
        [name]: actualValue
      }
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        setFormData(prev => ({
          ...prev,
          bannerImage: base64String
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await onSubmit(tournament!._id, formData);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update tournament');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !tournament) return null;

  const hasParticipants = tournament.currentParticipants > 0;

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
          className="rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
          style={{
            background: 'rgba(30, 30, 30, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
          }}
        >
          {/* Header */}
          <div
            className="sticky top-0 p-6 flex items-center justify-between z-10"
            style={{
              background: 'rgba(30, 30, 30, 0.95)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <h3 className="text-2xl font-bold text-white">
              Edit Tournament
            </h3>
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

          {/* Form */}
          <div className="p-6 space-y-6">
            {error && (
              <div
                className="p-4 rounded-lg text-red-400 text-sm"
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)'
                }}
              >
                {error}
              </div>
            )}

            {hasParticipants && (
              <div
                className="p-4 rounded-lg text-yellow-400 text-sm"
                style={{
                  background: 'rgba(251, 191, 36, 0.1)',
                  border: '1px solid rgba(251, 191, 36, 0.3)'
                }}
              >
                ⚠️ Note: Entry fee and max participants cannot be changed after users have joined.
              </div>
            )}

            {/* Banner Image URL */}
            <div>
              <label className="block text-gray-400 text-sm font-medium mb-2">
                Banner Image URL
              </label>
              <input
                type="url"
                name="bannerImage"
                value={formData.bannerImage}
                onChange={(e) => {
                  handleChange(e);
                  setImagePreview(e.target.value);
                }}
                placeholder="https://example.com/banner.jpg"
                className="w-full px-4 py-3 rounded-lg text-white focus:outline-none transition-all"
                style={{
                  background: 'rgba(18, 18, 18, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              />
              {imagePreview && (
                <div className="mt-3 rounded-lg overflow-hidden">
                  <img 
                    src={imagePreview} 
                    alt="Banner preview" 
                    className="w-full h-48 object-cover"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Title */}
              <div className="md:col-span-2">
                <label className="block text-gray-400 text-sm font-medium mb-2">
                  Tournament Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg text-white focus:outline-none transition-all"
                  style={{
                    background: 'rgba(18, 18, 18, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-gray-400 text-sm font-medium mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg text-white focus:outline-none transition-all resize-none"
                  style={{
                    background: 'rgba(18, 18, 18, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                />
              </div>

              {/* Game Type */}
              <div>
                <label className="block text-gray-400 text-sm font-medium mb-2">
                  Game Type *
                </label>
                <select
                  name="gameType"
                  value={formData.gameType}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg text-white focus:outline-none transition-all"
                  style={{
                    background: 'rgba(18, 18, 18, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <option value="">Select Game</option>
                  <option value="BGMI">BGMI</option>
                  <option value="Free Fire">Free Fire</option>
                  <option value="COD Mobile">COD Mobile</option>
                  <option value="Valorant">Valorant</option>
                </select>
              </div>

              {/* Scheduled Date */}
              <div>
                <label className="block text-gray-400 text-sm font-medium mb-2">
                  Scheduled Date *
                </label>
                <input
                  type="datetime-local"
                  name="scheduledDate"
                  value={formData.scheduledDate}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg text-white focus:outline-none transition-all"
                  style={{
                    background: 'rgba(18, 18, 18, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                />
              </div>

              {/* Entry Fee */}
              <div>
                <label className="block text-gray-400 text-sm font-medium mb-2">
                  Entry Fee (AX) *
                </label>
                <input
                  type="number"
                  name="entryFee"
                  value={formData.entryFee}
                  onChange={handleChange}
                  required
                  min="0"
                  disabled={hasParticipants}
                  className="w-full px-4 py-3 rounded-lg text-white focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: 'rgba(18, 18, 18, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                />
              </div>

              {/* Prize Pool */}
              <div>
                <label className="block text-gray-400 text-sm font-medium mb-2">
                  Prize Pool (AX) *
                </label>
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
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                />
              </div>

              {/* Max Participants */}
              <div className="md:col-span-2">
                <label className="block text-gray-400 text-sm font-medium mb-2">
                  Max Participants *
                </label>
                <input
                  type="number"
                  name="maxParticipants"
                  value={formData.maxParticipants}
                  onChange={handleChange}
                  required
                  min="2"
                  disabled={hasParticipants}
                  className="w-full px-4 py-3 rounded-lg text-white focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: 'rgba(18, 18, 18, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                />
              </div>

              {/* Rules */}
              <div className="md:col-span-2">
                <label className="block text-gray-400 text-sm font-medium mb-2">
                  Rules
                </label>
                <textarea
                  name="rules"
                  value={formData.rules}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg text-white focus:outline-none transition-all resize-none"
                  style={{
                    background: 'rgba(18, 18, 18, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                />
              </div>
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
                  checked={formData.streaming.enabled}
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

              {formData.streaming.enabled && (
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
                        Stream Status
                      </label>
                      <select
                        name="streamStatus"
                        value={formData.streaming.streamStatus}
                        onChange={handleStreamingChange}
                        className="w-full px-4 py-3 rounded-lg text-white focus:outline-none transition-all"
                        style={{
                          background: 'rgba(18, 18, 18, 0.8)',
                          border: '1px solid rgba(138, 43, 226, 0.4)',
                        }}
                      >
                        <option value="not_started">Not Started</option>
                        <option value="live">Live</option>
                        <option value="ended">Ended</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
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

            {/* Submit Button */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-lg font-medium transition-all hover:bg-opacity-80"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#888888'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-3 rounded-lg font-medium flex items-center space-x-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: '#00BFFF',
                  color: 'white'
                }}
              >
                <Save size={20} />
                <span>{loading ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EditTournamentModal;