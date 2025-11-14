import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  Trash2,
  Edit2,
  Check,
  X,
  Search,
  Users,
  Calendar,
  Trophy,
  Shield,
  User,
  Loader2
} from 'lucide-react';
import { tournamentAPI, messageAPI } from '../services/api';
import socketService from '../services/socketService';
import { Tournament, Message } from '../types';
import { useAuth } from '../context/AuthContext';

const Messages: React.FC = () => {
  const { admin } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isSocketListenerSet = useRef(false);

  useEffect(() => {
    fetchTournaments();
    initializeSocket();

    return () => {
      if (selectedTournament) {
        socketService.leaveTournamentChat(selectedTournament._id);
      }
      socketService.offNewMessage();
      socketService.offMessageUpdated();
      socketService.offMessageDeleted();
      isSocketListenerSet.current = false;
    };
  }, []);

  useEffect(() => {
    if (selectedTournament) {
      fetchMessages(selectedTournament._id);
      socketService.joinTournamentChat(selectedTournament._id);
    }
  }, [selectedTournament]);

  const initializeSocket = async () => {
    if (isSocketListenerSet.current) return;
    
    try {
      await socketService.connect();

      socketService.onNewMessage((newMessage: Message) => {
        setMessages((prev) => {
          const exists = prev.some(msg => msg._id === newMessage._id);
          if (exists) {
            return prev;
          }
          return [...prev, newMessage];
        });
        scrollToBottom();
      });

      socketService.onMessageUpdated((updatedMessage: Message) => {
        setMessages((prev) =>
          prev.map((msg) => (msg._id === updatedMessage._id ? updatedMessage : msg))
        );
      });

      socketService.onMessageDeleted(({ messageId }: { messageId: string }) => {
        setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
      });

      isSocketListenerSet.current = true;
    } catch (error) {
      console.error('Socket initialization error:', error);
    }
  };

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const response = await tournamentAPI.getAll();
      setTournaments(response.data.tournaments || []);
    } catch (error) {
      console.error('Fetch tournaments error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (tournamentId: string) => {
    try {
      const response = await messageAPI.getTournamentMessages(tournamentId);
      setMessages(response.data.messages || []);
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Fetch messages error:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedTournament || sending) return;

    const messageText = inputMessage.trim();
    setInputMessage('');
    setSending(true);

    try {
      await messageAPI.sendMessage(selectedTournament._id, messageText);
      scrollToBottom();
    } catch (error: any) {
      console.error('Send message error:', error);
      setInputMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  const handleUpdateMessage = async (messageId: string) => {
    if (!editingText.trim()) return;

    try {
      await messageAPI.updateMessage(messageId, editingText.trim());
      setEditingMessageId(null);
      setEditingText('');
    } catch (error) {
      console.error('Update message error:', error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;

    try {
      await messageAPI.deleteMessage(messageId);
    } catch (error) {
      console.error('Delete message error:', error);
    }
  };

  const startEditing = (message: Message) => {
    setEditingMessageId(message._id);
    setEditingText(message.message);
  };

  const cancelEditing = () => {
    setEditingMessageId(null);
    setEditingText('');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const filteredTournaments = tournaments.filter((tournament) =>
    tournament.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tournament.gameType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#121212' }}>
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2" style={{ borderColor: '#00BFFF' }}></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ background: '#121212' }}>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Tournament Messages</h1>
        <p className="text-gray-400">Manage tournament chat conversations</p>
      </div>

      <div className="flex gap-6 h-[calc(100vh-200px)]">
        <div
          className="w-96 rounded-xl overflow-hidden flex flex-col"
          style={{
            background: 'rgba(30, 30, 30, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
          }}
        >
          <div className="p-6" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg" style={{ background: 'rgba(0, 191, 255, 0.2)' }}>
                <MessageSquare className="text-cyan-400" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Tournament Chats</h2>
                <p className="text-sm text-gray-400">Select a tournament</p>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="text"
                placeholder="Search tournaments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg text-white placeholder-gray-400 focus:outline-none transition-all"
                style={{
                  background: 'rgba(20, 20, 20, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {filteredTournaments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Trophy className="text-gray-600 mb-4" size={48} />
                <p className="text-gray-400">No tournaments found</p>
              </div>
            ) : (
              filteredTournaments.map((tournament) => (
                <button
                  key={tournament._id}
                  onClick={() => {
                    if (selectedTournament?._id !== tournament._id) {
                      if (selectedTournament) {
                        socketService.leaveTournamentChat(selectedTournament._id);
                      }
                      setSelectedTournament(tournament);
                    }
                  }}
                  className={`w-full text-left p-4 rounded-lg transition-all ${
                    selectedTournament?._id === tournament._id
                      ? 'bg-cyan-500/20'
                      : 'bg-gray-800/30 hover:bg-gray-800/50'
                  }`}
                  style={{
                    border: selectedTournament?._id === tournament._id 
                      ? '1px solid rgba(0, 191, 255, 0.4)' 
                      : '1px solid rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-white line-clamp-1">{tournament.title}</h3>
                    <span
                      className={`px-2 py-1 rounded-lg text-xs font-bold ${
                        tournament.status === 'live'
                          ? 'bg-green-500/20 text-green-400'
                          : tournament.status === 'approved'
                          ? 'bg-cyan-500/20 text-cyan-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}
                      style={{
                        border: tournament.status === 'live'
                          ? '1px solid rgba(16, 185, 129, 0.3)'
                          : tournament.status === 'approved'
                          ? '1px solid rgba(0, 191, 255, 0.3)'
                          : '1px solid rgba(156, 163, 175, 0.3)'
                      }}
                    >
                      {tournament.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                      <Users size={14} />
                      <span>{tournament.currentParticipants}/{tournament.maxParticipants}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Trophy size={14} />
                      <span>{tournament.gameType}</span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div
          className="flex-1 rounded-xl overflow-hidden flex flex-col"
          style={{
            background: 'rgba(30, 30, 30, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
          }}
        >
          {selectedTournament ? (
            <>
              <div className="p-6" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">{selectedTournament.title}</h2>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-2">
                        <Trophy size={16} className="text-cyan-400" />
                        <span>{selectedTournament.gameType}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-purple-400" />
                        <span>{selectedTournament.currentParticipants} Participants</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-green-400" />
                        <span>{new Date(selectedTournament.scheduledDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-6 space-y-4"
                style={{
                  background: 'rgba(20, 20, 20, 0.5)',
                }}
              >
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <MessageSquare className="text-gray-600 mb-4" size={64} />
                    <p className="text-gray-400 text-lg font-semibold">No messages yet</p>
                    <p className="text-gray-500 text-sm">Be the first to start the conversation!</p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isOwnMessage = message.userId === admin?._id;
                    const isMessageFromAdmin = message.senderRole === 'admin';
                    const isEditing = editingMessageId === message._id;

                    return (
                      <div
                        key={message._id}
                        className={`flex ${isMessageFromAdmin ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] ${isMessageFromAdmin ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                          <div className="flex items-center gap-2">
                            {!isMessageFromAdmin && (
                              <>
                                <span className="text-sm font-bold text-gray-300">{message.username}</span>
                                <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-cyan-500/20" style={{ border: '1px solid rgba(0, 191, 255, 0.3)' }}>
                                  <User size={10} className="text-cyan-400" />
                                  <span className="text-xs font-bold text-cyan-400">PLAYER</span>
                                </div>
                              </>
                            )}
                            {isMessageFromAdmin && (
                              <>
                                <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-yellow-500/20" style={{ border: '1px solid rgba(251, 191, 36, 0.3)' }}>
                                  <Shield size={12} className="text-yellow-400" />
                                  <span className="text-xs font-bold text-yellow-400">ADMIN</span>
                                </div>
                                <span className="text-sm font-bold text-gray-300">{isOwnMessage ? 'You' : message.username}</span>
                              </>
                            )}
                          </div>

                          <div
                            className={`rounded-lg px-4 py-3 ${
                              isMessageFromAdmin
                                ? 'bg-cyan-500/20'
                                : 'bg-gray-700/50'
                            }`}
                            style={{ 
                              border: isMessageFromAdmin 
                                ? '1px solid rgba(0, 191, 255, 0.3)' 
                                : '1px solid rgba(107, 114, 128, 0.3)' 
                            }}
                          >
                            {isEditing ? (
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  value={editingText}
                                  onChange={(e) => setEditingText(e.target.value)}
                                  className="w-full bg-gray-800/50 text-white px-3 py-2 rounded-lg focus:outline-none"
                                  style={{ border: '1px solid rgba(107, 114, 128, 0.5)' }}
                                  autoFocus
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleUpdateMessage(message._id)}
                                    className="p-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 transition-all"
                                    style={{ border: '1px solid rgba(16, 185, 129, 0.3)' }}
                                  >
                                    <Check size={16} className="text-green-400" />
                                  </button>
                                  <button
                                    onClick={cancelEditing}
                                    className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-all"
                                    style={{ border: '1px solid rgba(239, 68, 68, 0.3)' }}
                                  >
                                    <X size={16} className="text-red-400" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <p className="text-white text-sm leading-relaxed">{message.message}</p>
                                <div className="flex items-center justify-between mt-2">
                                  <span className="text-xs text-gray-400">{formatTime(message.createdAt)}</span>
                                  <div className="flex gap-2">
                                    {isOwnMessage && (
                                      <button
                                        onClick={() => startEditing(message)}
                                        className="p-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 transition-all"
                                        style={{ border: '1px solid rgba(59, 130, 246, 0.3)' }}
                                        title="Edit message"
                                      >
                                        <Edit2 size={12} className="text-blue-400" />
                                      </button>
                                    )}
                                    {admin?.role === 'admin' && (
                                      <button
                                        onClick={() => handleDeleteMessage(message._id)}
                                        className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-all"
                                        style={{ border: '1px solid rgba(239, 68, 68, 0.3)' }}
                                        title="Delete message"
                                      >
                                        <Trash2 size={12} className="text-red-400" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-6" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Type your message as admin..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="flex-1 px-6 py-4 rounded-lg text-white placeholder-gray-400 focus:outline-none transition-all"
                    style={{
                      background: 'rgba(20, 20, 20, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                    maxLength={1000}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || sending}
                    className={`px-6 py-4 rounded-lg font-bold transition-all flex items-center gap-2 ${
                      !inputMessage.trim() || sending
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-cyan-500 text-white hover:opacity-90'
                    }`}
                  >
                    {sending ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <Send size={20} />
                    )}
                    <span>Send</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <MessageSquare className="text-gray-600 mb-4" size={80} />
              <h3 className="text-2xl font-bold text-gray-400 mb-2">No Tournament Selected</h3>
              <p className="text-gray-500">Select a tournament from the left to view and send messages</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;