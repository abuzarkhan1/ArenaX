import React, { useEffect, useState } from 'react';
import { Trophy, Search, Eye, CheckCircle, XCircle, Trash2, Plus, X, Edit, Users } from 'lucide-react';
import { tournamentAPI } from '../services/api';
import { Tournament } from '../types';
import CreateTournamentModal from '../components/CreateTournamentModal';
import EditTournamentModal from '../components/EditTournamentModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import ParticipantsModal from '../components/ParticipantsModal';

const Tournaments: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [tournamentToDelete, setTournamentToDelete] = useState<Tournament | null>(null);
  const [tournamentToEdit, setTournamentToEdit] = useState<Tournament | null>(null);
  const [participantsTournament, setParticipantsTournament] = useState<Tournament | null>(null);

  useEffect(() => {
    fetchTournaments();
  }, [statusFilter]);

  const fetchTournaments = async () => {
    try {
      const params: any = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (search) params.search = search;

      const response = await tournamentAPI.getAll(params);
      setTournaments(response.data.tournaments);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (tournamentId: string, status: string, rejectionReason?: string) => {
    try {
      await tournamentAPI.updateStatus(tournamentId, status, rejectionReason);
      fetchTournaments();
      setShowDetailsModal(false);
      setSelectedTournament(null);
    } catch (error) {
      console.error('Error updating tournament status:', error);
    }
  };

  const handleDelete = async () => {
    if (!tournamentToDelete) return;

    try {
      await tournamentAPI.delete(tournamentToDelete._id);
      fetchTournaments();
      setShowDeleteModal(false);
      setTournamentToDelete(null);
    } catch (error) {
      console.error('Error deleting tournament:', error);
    }
  };

  const handleCreateTournament = async (data: Tournament) => {
    try {
      await tournamentAPI.create(data);
      fetchTournaments();
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating tournament:', error);
      throw error;
    }
  };

  const handleUpdateTournament = async (id: string, data: Partial<Tournament>) => {
    try {
      await tournamentAPI.update(id, data);
      fetchTournaments();
      setShowEditModal(false);
      setTournamentToEdit(null);
    } catch (error) {
      console.error('Error updating tournament:', error);
      throw error;
    }
  };

  const handleRemoveParticipant = async (tournamentId: string, participantId: string) => {
    try {
      await tournamentAPI.removeParticipant(tournamentId, participantId);
      fetchTournaments();
      // Refresh the participants tournament data
      const response = await tournamentAPI.getAll({ _id: tournamentId });
      if (response.data.tournaments.length > 0) {
        setParticipantsTournament(response.data.tournaments[0]);
      }
    } catch (error) {
      console.error('Error removing participant:', error);
      throw error;
    }
  };

  const openDeleteModal = (tournament: Tournament) => {
    setTournamentToDelete(tournament);
    setShowDeleteModal(true);
  };

  const openEditModal = (tournament: Tournament) => {
    setTournamentToEdit(tournament);
    setShowEditModal(true);
  };

  const openParticipantsModal = (tournament: Tournament) => {
    setParticipantsTournament(tournament);
    setShowParticipantsModal(true);
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; glow: string }> = {
      pending: { bg: 'rgba(251, 191, 36, 0.2)', text: '#FBBF24', glow: 'rgba(251, 191, 36, 0.5)' },
      approved: { bg: 'rgba(16, 185, 129, 0.2)', text: '#10B981', glow: 'rgba(16, 185, 129, 0.5)' },
      live: { bg: 'rgba(59, 130, 246, 0.2)', text: '#3B82F6', glow: 'rgba(59, 130, 246, 0.5)' },
      completed: { bg: 'rgba(156, 163, 175, 0.2)', text: '#9CA3AF', glow: 'rgba(156, 163, 175, 0.5)' },
      cancelled: { bg: 'rgba(239, 68, 68, 0.2)', text: '#EF4444', glow: 'rgba(239, 68, 68, 0.5)' },
      rejected: { bg: 'rgba(239, 68, 68, 0.2)', text: '#EF4444', glow: 'rgba(239, 68, 68, 0.5)' },
    };

    const badge = badges[status] || badges.pending;
    return (
      <span
        className="px-3 py-1 rounded-full text-xs font-bold"
        style={{
          background: badge.bg,
          color: badge.text,
          border: `1px solid ${badge.text}40`,
          boxShadow: `0 0 10px ${badge.glow}`,
        }}
      >
        {status.toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#121212' }}>
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2" style={{ borderColor: '#00BFFF' }}></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ background: '#121212' }}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Tournament Management</h1>
            <p className="text-gray-400">Manage and approve tournaments</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 rounded-lg font-bold flex items-center space-x-2 transition-all hover:opacity-90"
            style={{
              background: '#00BFFF',
              color: '#FFFFFF',
            }}
          >
            <Plus size={20} />
            <span>Create Tournament</span>
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div
        className="rounded-xl p-6 mb-8"
        style={{
          background: 'rgba(30, 30, 30, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
            <input
              type="text"
              placeholder="Search tournaments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchTournaments()}
              className="w-full pl-10 pr-4 py-3 rounded-lg text-white placeholder-gray-400 focus:outline-none transition-all"
              style={{
                background: 'rgba(20, 20, 20, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 rounded-lg text-white focus:outline-none transition-all"
            style={{
              background: 'rgba(20, 20, 20, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="live">Live</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Tournament Table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: 'rgba(30, 30, 30, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <th className="text-left py-4 px-6 text-gray-400 font-bold text-sm">Tournament</th>
                <th className="text-left py-4 px-6 text-gray-400 font-bold text-sm">Entry Fee</th>
                <th className="text-left py-4 px-6 text-gray-400 font-bold text-sm">Prize Pool</th>
                <th className="text-left py-4 px-6 text-gray-400 font-bold text-sm">Participants</th>
                <th className="text-left py-4 px-6 text-gray-400 font-bold text-sm">Status</th>
                <th className="text-left py-4 px-6 text-gray-400 font-bold text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tournaments.map((tournament) => (
                <tr
                  key={tournament._id}
                  className="transition-all hover:bg-opacity-50"
                  style={{ 
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    background: 'transparent'
                  }}
                >
                  <td className="py-4 px-6">
                    <div>
                      <p className="text-white font-bold">{tournament.title}</p>
                      <p className="text-gray-400 text-sm font-medium">{tournament.gameType}</p>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <p className="text-cyan-400 font-black text-lg">{tournament.entryFee} AX</p>
                  </td>
                  <td className="py-4 px-6">
                    <p className="text-green-400 font-black text-lg">{tournament.prizePool} AX</p>
                  </td>
                  <td className="py-4 px-6">
                    <p className="text-white font-bold">{tournament.currentParticipants}/{tournament.maxParticipants}</p>
                  </td>
                  <td className="py-4 px-6">
                    {getStatusBadge(tournament.status)}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedTournament(tournament);
                          setShowDetailsModal(true);
                        }}
                        className="p-2 rounded-lg transition-all hover:opacity-80"
                        style={{
                          background: 'rgba(0, 191, 255, 0.2)',
                          color: '#00BFFF',
                          border: '1px solid rgba(0, 191, 255, 0.4)'
                        }}
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>

                      <button
                        onClick={() => openParticipantsModal(tournament)}
                        className="p-2 rounded-lg transition-all hover:opacity-80"
                        style={{
                          background: 'rgba(138, 43, 226, 0.2)',
                          color: '#8A2BE2',
                          border: '1px solid rgba(138, 43, 226, 0.4)'
                        }}
                        title="View Participants"
                      >
                        <Users size={18} />
                      </button>
                      
                      <button
                        onClick={() => openEditModal(tournament)}
                        className="p-2 rounded-lg transition-all hover:opacity-80"
                        style={{
                          background: 'rgba(255, 215, 0, 0.2)',
                          color: '#FFD700',
                          border: '1px solid rgba(255, 215, 0, 0.4)'
                        }}
                        title="Edit Tournament"
                      >
                        <Edit size={18} />
                      </button>

                      {tournament.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(tournament._id, 'approved')}
                            className="p-2 rounded-lg transition-all hover:opacity-80"
                            style={{
                              background: 'rgba(16, 185, 129, 0.2)',
                              color: '#10B981',
                              border: '1px solid rgba(16, 185, 129, 0.4)'
                            }}
                            title="Approve"
                          >
                            <CheckCircle size={18} />
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Enter rejection reason:');
                              if (reason) handleStatusUpdate(tournament._id, 'rejected', reason);
                            }}
                            className="p-2 rounded-lg transition-all hover:opacity-80"
                            style={{
                              background: 'rgba(239, 68, 68, 0.2)',
                              color: '#EF4444',
                              border: '1px solid rgba(239, 68, 68, 0.4)'
                            }}
                            title="Reject"
                          >
                            <XCircle size={18} />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => openDeleteModal(tournament)}
                        className="p-2 rounded-lg transition-all hover:opacity-80"
                        style={{
                          background: 'rgba(239, 68, 68, 0.2)',
                          color: '#EF4444',
                          border: '1px solid rgba(239, 68, 68, 0.4)'
                        }}
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedTournament && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(10px)'
          }}
          onClick={() => setShowDetailsModal(false)}
        >
          <div
            className="rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            style={{
              background: 'rgba(30, 30, 30, 0.98)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="sticky top-0 p-6 flex items-center justify-between z-10"
              style={{
                background: 'rgba(30, 30, 30, 0.98)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <h3 className="text-3xl font-black text-white">
                Tournament Details
              </h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)'
                }}
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div
                className="p-4 rounded-lg"
                style={{
                  background: 'rgba(20, 20, 20, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}
              >
                <p className="text-gray-400 text-sm font-medium mb-1">Title</p>
                <p className="text-white font-bold text-lg">{selectedTournament.title}</p>
              </div>

              <div
                className="p-4 rounded-lg"
                style={{
                  background: 'rgba(20, 20, 20, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}
              >
                <p className="text-gray-400 text-sm font-medium mb-1">Description</p>
                <p className="text-white">{selectedTournament.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div
                  className="p-4 rounded-lg"
                  style={{
                    background: 'rgba(20, 20, 20, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}
                >
                  <p className="text-gray-400 text-sm font-medium mb-1">Game Type</p>
                  <p className="text-white font-bold">{selectedTournament.gameType}</p>
                </div>

                <div
                  className="p-4 rounded-lg"
                  style={{
                    background: 'rgba(20, 20, 20, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}
                >
                  <p className="text-gray-400 text-sm font-medium mb-1">Status</p>
                  <div>{getStatusBadge(selectedTournament.status)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div
                  className="p-4 rounded-lg"
                  style={{
                    background: 'rgba(20, 20, 20, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}
                >
                  <p className="text-gray-400 text-sm font-medium mb-1">Entry Fee</p>
                  <p className="text-cyan-400 font-black text-xl">{selectedTournament.entryFee} AX</p>
                </div>

                <div
                  className="p-4 rounded-lg"
                  style={{
                    background: 'rgba(20, 20, 20, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}
                >
                  <p className="text-gray-400 text-sm font-medium mb-1">Prize Pool</p>
                  <p className="text-green-400 font-black text-xl">{selectedTournament.prizePool} AX</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div
                  className="p-4 rounded-lg"
                  style={{
                    background: 'rgba(20, 20, 20, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}
                >
                  <p className="text-gray-400 text-sm font-medium mb-1">Participants</p>
                  <p className="text-white font-bold text-lg">{selectedTournament.currentParticipants}/{selectedTournament.maxParticipants}</p>
                </div>

                <div
                  className="p-4 rounded-lg"
                  style={{
                    background: 'rgba(20, 20, 20, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}
                >
                  <p className="text-gray-400 text-sm font-medium mb-1">Scheduled Date</p>
                  <p className="text-white font-bold">{new Date(selectedTournament.scheduledDate).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateTournamentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateTournament}
      />

      <EditTournamentModal
        isOpen={showEditModal}
        tournament={tournamentToEdit}
        onClose={() => {
          setShowEditModal(false);
          setTournamentToEdit(null);
        }}
        onSubmit={handleUpdateTournament}
      />

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        tournament={tournamentToDelete}
        onClose={() => {
          setShowDeleteModal(false);
          setTournamentToDelete(null);
        }}
        onConfirm={handleDelete}
      />

      <ParticipantsModal
        isOpen={showParticipantsModal}
        tournament={participantsTournament}
        onClose={() => {
          setShowParticipantsModal(false);
          setParticipantsTournament(null);
        }}
        onRemoveParticipant={handleRemoveParticipant}
      />
    </div>
  );
};

export default Tournaments;