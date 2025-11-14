import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tournamentAPI, messageAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { CustomJoinAlert } from './CustomJoinAlert';
import { SuccessModal } from './SuccessModal';
import { ErrorModal } from './ErrorModal';
import socketService from '../../services/socketService';

const { width } = Dimensions.get('window');

const TournamentDetailScreen = ({ route, navigation }) => {
  const { tournamentId } = route.params;
  const { user } = useAuth();
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showJoinAlert, setShowJoinAlert] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorInfo, setErrorInfo] = useState({ title: '', message: '' });
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchTournamentDetails();
    if (hasUserJoined()) {
      fetchUnreadCount();
    }
  }, [tournamentId]);

  useEffect(() => {
    // Listen for new messages to update unread count
    const handleNewMessage = (message) => {
      if (message.tournamentId === tournamentId && message.userId !== user._id) {
        setUnreadCount(prev => prev + 1);
      }
    };

    socketService.connect().then(() => {
      socketService.onNewMessage(handleNewMessage);
    });

    return () => {
      socketService.offNewMessage();
    };
  }, [tournamentId, user._id]);

  const showError = (title, message) => {
    setErrorInfo({ title, message });
    setShowErrorModal(true);
  };

  const fetchTournamentDetails = async () => {
    try {
      const response = await tournamentAPI.getById(tournamentId);
      setTournament(response.data.tournament);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      showError('Failed to Load', 'Unable to fetch tournament details. Please try again later.');
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const lastReadKey = `lastRead_${tournamentId}`;
      const lastReadTime = await AsyncStorage.getItem(lastReadKey);
      
      const response = await messageAPI.getTournamentMessages(tournamentId);
      const messages = response.data.messages || [];
      
      if (lastReadTime) {
        const unread = messages.filter(msg => 
          new Date(msg.createdAt) > new Date(lastReadTime) && msg.userId !== user._id
        ).length;
        setUnreadCount(unread);
      } else {
        // First time - count all messages not from user
        const unread = messages.filter(msg => msg.userId !== user._id).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Fetch unread count error:', error);
    }
  };

  const hasUserJoined = () => {
    if (!user || !tournament || !tournament.participants) return false;
    return tournament.participants.some(
      (participant) => participant.userId === user._id || participant.userId?._id === user._id
    );
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return { date: 'TBA', time: 'TBA', day: 'TBA', month: 'TBA' };
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    return { date: dateStr, time: timeStr, day, month };
  };

  const handleOpenLiveStream = async () => {
    if (!tournament?.streaming?.enabled) {
      Alert.alert('No Stream', 'Live streaming is not available for this tournament.');
      return;
    }

    if (!tournament.streaming.streamUrl) {
      Alert.alert('Error', 'Stream link not available.');
      return;
    }

    if (tournament.streaming.streamStatus !== 'live') {
      Alert.alert('Stream Not Live', 'The stream is not currently live.');
      return;
    }

    try {
      const supported = await Linking.canOpenURL(tournament.streaming.streamUrl);
      if (supported) {
        await Linking.openURL(tournament.streaming.streamUrl);
      } else {
        Alert.alert('Error', 'Cannot open stream URL');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open stream link');
    }
  };

  const renderParticipantGrid = () => {
    const totalSlots = tournament.maxParticipants || 0;
    const slots = [];

    for (let i = 0; i < totalSlots; i++) {
      const participant = tournament.participants && tournament.participants[i];
      const isJoined = !!participant;

      slots.push(
        <View
          key={i}
          style={[
            styles.participantSlot,
            isJoined && styles.participantSlotFilled,
          ]}
        >
          {isJoined ? (
            <>
              <View style={styles.participantAvatar}>
                <Text style={styles.participantAvatarText}>
                  {participant.username ? participant.username.charAt(0).toUpperCase() : i + 1}
                </Text>
              </View>
              {participant.username && (
                <Text style={styles.participantName} numberOfLines={1}>
                  {participant.username}
                </Text>
              )}
            </>
          ) : (
            <>
              <View style={styles.participantAvatarEmpty}>
                <Text style={styles.participantAvatarEmptyText}>{i + 1}</Text>
              </View>
              <Text style={styles.participantNameEmpty}>Empty Slot</Text>
            </>
          )}
        </View>
      );
    }

    return slots;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00BFFF" />
        </View>
      </View>
    );
  }

  if (!tournament) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Tournament not found</Text>
        </View>
      </View>
    );
  }

  const handleJoinTournament = async () => {
    if (userJoined) {
      showError('Already Joined', 'You have already joined this tournament!');
      return;
    }

    // Check if user has enough balance
    if (user.coinBalance < tournament.entryFee) {
      showError(
        'Insufficient Balance', 
        `You need ${tournament.entryFee} coins to join this tournament. Your current balance is ${user.coinBalance} coins.`
      );
      return;
    }

    // Check if tournament is full
    const currentParticipants = tournament.currentParticipants || tournament.participants?.length || 0;
    if (currentParticipants >= tournament.maxParticipants) {
      showError('Tournament Full', 'This tournament has reached maximum participants. Please try another tournament.');
      return;
    }

    // Show custom join alert
    setShowJoinAlert(true);
  };

  const confirmJoinTournament = async () => {
    try {
      setLoading(true);
      setShowJoinAlert(false);
      await tournamentAPI.join(tournamentId);
      
      // Refresh tournament details to show updated data
      await fetchTournamentDetails();
      
      // Show success modal
      setShowSuccessModal(true);
      
      // Start fetching unread count after joining
      await fetchUnreadCount();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to join tournament. Please try again.';
      showError('Join Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChatPress = async () => {
    // Mark messages as read
    const lastReadKey = `lastRead_${tournamentId}`;
    await AsyncStorage.setItem(lastReadKey, new Date().toISOString());
    setUnreadCount(0);
    
    navigation.navigate('Chat', { 
      tournamentId: tournamentId,
      tournamentTitle: tournament.title 
    });
  };

  const userJoined = hasUserJoined();
  const { date, time, day, month } = formatDateTime(tournament.scheduledDate);

  // Check if streaming is live
  const isStreamingLive = tournament?.streaming?.enabled && 
                          tournament?.streaming?.streamStatus === 'live' &&
                          tournament?.streaming?.streamUrl;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tournament Details</Text>
        <View style={styles.headerRight}>
          {tournament?.rules && (
            <TouchableOpacity
              style={styles.rulesButton}
              onPress={() => showError('Tournament Rules', tournament.rules)}
            >
              <Text style={styles.rulesButtonIcon}>📋</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Section - Title & Game Type */}
        <View style={styles.heroSection}>
          <View style={styles.dateCalendar}>
            <Text style={styles.calendarMonth}>{month}</Text>
            <Text style={styles.calendarDay}>{day}</Text>
          </View>

          <View style={styles.heroText}>
            {/* Clickable Live Badge */}
            <TouchableOpacity
              style={[
                styles.statusBadge,
                isStreamingLive && styles.statusBadgeLive
              ]}
              onPress={isStreamingLive ? handleOpenLiveStream : null}
              activeOpacity={isStreamingLive ? 0.7 : 1}
              disabled={!isStreamingLive}
            >
              <View style={[
                styles.statusDot,
                isStreamingLive && styles.statusDotPulse
              ]} />
              <Text style={styles.statusText}>LIVE</Text>
              {isStreamingLive && (
                <Ionicons name="play-circle" size={16} color="#EF4444" style={styles.playIcon} />
              )}
            </TouchableOpacity>

            <Text style={styles.tournamentTitle}>{tournament.title}</Text>
            {tournament.description && (
              <Text style={styles.description}>{tournament.description}</Text>
            )}
          </View>
        </View>

        {/* Game Type Badge */}
        <View style={styles.gameTypeBadgeContainer}>
          <Text style={styles.gameTypeBadge}>{tournament.gameType}</Text>
        </View>

        {/* Stats Bar - Entry, Prize, Slots */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Entry Fee</Text>
            <View style={styles.statValueRow}>
              <Text style={styles.coinIcon}>🪙</Text>
              <Text style={styles.statValue}>{tournament.entryFee}</Text>
            </View>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Prize Pool</Text>
            <View style={styles.statValueRow}>
              <Text style={styles.prizeIcon}>🏆</Text>
              <Text style={[styles.statValue, styles.prizeValue]}>{tournament.prizePool}</Text>
            </View>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Players</Text>
            <Text style={styles.statValue}>
              {tournament.currentParticipants || tournament.participants?.length || 0}/{tournament.maxParticipants}
            </Text>
          </View>
        </View>

        {/* Time Section */}
        <View style={styles.timeSection}>
          <View style={styles.timeIcon}>
            <Text style={styles.timeEmoji}>⏰</Text>
          </View>
          <View style={styles.timeInfo}>
            <Text style={styles.timeLabel}>Tournament Starts</Text>
            <Text style={styles.timeValue}>{date} • {time}</Text>
          </View>
        </View>

        {/* Participants Section */}
        <View style={styles.participantsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Players Registered</Text>
            <View style={styles.participantCountBadge}>
              <Text style={styles.participantCountText}>
                {tournament.currentParticipants || tournament.participants?.length || 0}/{tournament.maxParticipants}
              </Text>
            </View>
          </View>

          <View style={styles.participantGrid}>
            {renderParticipantGrid()}
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Floating Join Button */}
      <View style={styles.floatingButtonContainer}>
        <TouchableOpacity
          style={[styles.joinButton, userJoined && styles.joinButtonJoined]}
          onPress={handleJoinTournament}
          activeOpacity={0.9}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Text style={styles.joinButtonText}>
                {userJoined ? '✓ Already Joined' : 'Join Tournament'}
              </Text>
              {!userJoined && (
                <Text style={styles.joinButtonSubtext}>{tournament.entryFee} Coins</Text>
              )}
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Floating Chat Button - Show only if user has joined */}
      {userJoined && (
        <TouchableOpacity
          style={styles.floatingChatButton}
          onPress={handleChatPress}
          activeOpacity={0.9}
        >
          <Ionicons name="chatbubbles" size={28} color="#fff" />
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      )}

      {/* Custom Join Alert Modal */}
      <CustomJoinAlert
        visible={showJoinAlert}
        onClose={() => setShowJoinAlert(false)}
        onConfirm={confirmJoinTournament}
        entryFee={tournament?.entryFee || 0}
        loading={loading}
      />

      {/* Success Modal */}
      <SuccessModal
        visible={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        tournamentTitle={tournament?.title || ''}
      />

      {/* Error Modal */}
      <ErrorModal
        visible={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title={errorInfo.title}
        message={errorInfo.message}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#888888',
    fontWeight: '600',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  backButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 48,
    alignItems: 'flex-end',
  },
  rulesButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E1E1E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rulesButtonIcon: {
    fontSize: 20,
  },

  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },

  // Hero Section
  heroSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    gap: 16,
  },
  dateCalendar: {
    width: 70,
    height: 80,
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#00BFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarMonth: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00BFFF',
    letterSpacing: 1,
  },
  calendarDay: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  heroText: {
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 12,
    gap: 6,
    marginBottom: 12,
  },
  statusBadgeLive: {
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  statusDotPulse: {
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
    letterSpacing: 0.5,
  },
  playIcon: {
    marginLeft: 2,
  },
  tournamentTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 30,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#888888',
    lineHeight: 20,
    marginTop: 4,
  },

  // Game Type Badge
  gameTypeBadgeContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  gameTypeBadge: {
    alignSelf: 'flex-start',
    fontSize: 12,
    fontWeight: '700',
    color: '#00FF7F',
    backgroundColor: 'rgba(0, 255, 127, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // Stats Bar
  statsBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#888888',
    marginBottom: 8,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  coinIcon: {
    fontSize: 18,
  },
  prizeIcon: {
    fontSize: 18,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  prizeValue: {
    color: '#00FF7F',
  },

  // Time Section
  timeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    gap: 16,
  },
  timeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 191, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeEmoji: {
    fontSize: 24,
  },
  timeInfo: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#888888',
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E0E0E0',
  },

  // Participants Section
  participantsSection: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  participantCountBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
  },
  participantCountText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00BFFF',
  },
  participantGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  participantSlot: {
    width: (width - 32 - 36) / 4,
    alignItems: 'center',
    paddingVertical: 8,
  },
  participantSlotFilled: {
    // Additional styles for filled slots if needed
  },
  participantAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#00BFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  participantAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  participantName: {
    fontSize: 11,
    fontWeight: '500',
    color: '#E0E0E0',
    textAlign: 'center',
  },
  participantAvatarEmpty: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1E1E1E',
    borderWidth: 2,
    borderColor: '#2A2A2A',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  participantAvatarEmptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  participantNameEmpty: {
    fontSize: 10,
    fontWeight: '500',
    color: '#4B5563',
    textAlign: 'center',
  },

  // Floating Button
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#121212',
    borderTopWidth: 1,
    borderTopColor: '#1E1E1E',
  },
  joinButton: {
    backgroundColor: '#00BFFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
  },
  joinButtonJoined: {
    backgroundColor: '#00FF7F',
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  joinButtonSubtext: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 2,
    opacity: 0.9,
  },

  // Floating Chat Button
  floatingChatButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#8A2BE2',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#121212',
  },
  unreadBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  bottomSpacing: {
    height: 20,
  },
});

export default TournamentDetailScreen;