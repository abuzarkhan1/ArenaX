import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { notificationAPI } from '../../services/api';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Icon Components
const BellIcon = ({ size = 24, color = '#888888' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const TrophyIcon = ({ size = 24, color = '#00BFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const GiftIcon = ({ size = 24, color = '#FFD700' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const InfoIcon = ({ size = 24, color = '#888888' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 16v-4M12 8h.01"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const WarningIcon = ({ size = 24, color = '#FF6B6B' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CloseIcon = ({ size = 24, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 6L6 18M6 6l12 12"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const NotificationIcon = ({ type, size = 24 }) => {
  switch (type) {
    case 'tournament':
      return <TrophyIcon size={size} />;
    case 'reward':
      return <GiftIcon size={size} />;
    case 'warning':
      return <WarningIcon size={size} />;
    case 'system':
      return <InfoIcon size={size} color="#00BFFF" />;
    default:
      return <BellIcon size={size} color="#00BFFF" />;
  }
};

const formatTimeAgo = (date) => {
  const now = new Date();
  const notificationDate = new Date(date);
  const diffInSeconds = Math.floor((now - notificationDate) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return notificationDate.toLocaleDateString();
};

const formatFullDate = (date) => {
  const notificationDate = new Date(date);
  return notificationDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Custom Modal Component for Notifications
const NotificationModal = ({ visible, notification, onClose, onNavigate }) => {
  if (!notification) return null;

  const getModalStyle = () => {
    switch (notification.type) {
      case 'tournament':
        return {
          headerColor: '#00BFFF',
          backgroundColor: '#0A1628',
          borderColor: '#00BFFF40',
        };
      case 'reward':
        return {
          headerColor: '#FFD700',
          backgroundColor: '#1A1506',
          borderColor: '#FFD70040',
        };
      case 'warning':
        return {
          headerColor: '#FF6B6B',
          backgroundColor: '#1A0A0A',
          borderColor: '#FF6B6B40',
        };
      case 'system':
        return {
          headerColor: '#00BFFF',
          backgroundColor: '#0A1628',
          borderColor: '#00BFFF40',
        };
      default:
        return {
          headerColor: '#00BFFF',
          backgroundColor: '#1E1E1E',
          borderColor: '#00BFFF40',
        };
    }
  };

  const modalStyle = getModalStyle();

  const handleActionButton = () => {
    if (notification.relatedTournament) {
      onNavigate('TournamentDetail', { 
        tournamentId: notification.relatedTournament._id 
      });
      onClose();
    } else if (notification.link) {
      // Handle custom link navigation
      onClose();
    } else {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { borderColor: modalStyle.borderColor }]}>
          {/* Header */}
          <View style={[styles.modalHeader, { backgroundColor: modalStyle.headerColor }]}>
            <View style={styles.modalHeaderContent}>
              <NotificationIcon type={notification.type} size={32} />
              <Text style={styles.modalHeaderTitle} numberOfLines={2}>
                {notification.title}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <CloseIcon size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView 
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.modalBody, { backgroundColor: modalStyle.backgroundColor }]}>
              {/* Timestamp */}
              <View style={styles.timestampContainer}>
                <InfoIcon size={16} color="#888888" />
                <Text style={styles.timestamp}>
                  {formatFullDate(notification.createdAt)}
                </Text>
              </View>

              {/* Message */}
              <Text style={styles.modalMessage}>{notification.message}</Text>

              {/* Additional Info for Tournament Notifications */}
              {notification.type === 'tournament' && notification.relatedTournament && (
                <View style={styles.tournamentInfo}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Tournament:</Text>
                    <Text style={styles.infoValue}>
                      {notification.relatedTournament.name}
                    </Text>
                  </View>
                  {notification.relatedTournament.prize && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Prize Pool:</Text>
                      <Text style={styles.infoValue}>
                        ${notification.relatedTournament.prize}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Additional Info for Reward Notifications */}
              {notification.type === 'reward' && notification.metadata && (
                <View style={styles.rewardInfo}>
                  {notification.metadata.rewardAmount && (
                    <View style={styles.rewardBadge}>
                      <GiftIcon size={20} />
                      <Text style={styles.rewardAmount}>
                        +{notification.metadata.rewardAmount} coins
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Additional Info for Warning Notifications */}
              {notification.type === 'warning' && (
                <View style={styles.warningBox}>
                  <WarningIcon size={20} />
                  <Text style={styles.warningText}>
                    Please review this notification carefully
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.modalFooter}>
            {notification.relatedTournament && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: modalStyle.headerColor }]}
                onPress={handleActionButton}
                activeOpacity={0.8}
              >
                <Text style={styles.actionButtonText}>View Tournament</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.dismissButton,
                !notification.relatedTournament && { flex: 1 }
              ]}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.dismissButtonText}>
                {notification.relatedTournament ? 'Dismiss' : 'Close'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const NotificationsScreen = () => {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchNotifications = useCallback(async (pageNum = 1, isRefresh = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await notificationAPI.getUserNotifications({ 
        page: pageNum, 
        limit: 20 
      });

      if (response.data.success) {
        if (isRefresh || pageNum === 1) {
          setNotifications(response.data.notifications);
        } else {
          setNotifications(prev => [...prev, ...response.data.notifications]);
        }
        
        setHasMore(response.data.pagination.page < response.data.pagination.pages);
        setPage(pageNum);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications(1, true);
  }, [fetchNotifications]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore && !loading) {
      fetchNotifications(page + 1);
    }
  }, [loadingMore, hasMore, loading, page, fetchNotifications]);

  const handleNotificationPress = async (notification) => {
    try {
      // Mark as read
      if (!notification.isRead) {
        await notificationAPI.markAsRead(notification._id);
        setNotifications(prev =>
          prev.map(n =>
            n._id === notification._id ? { ...n, isRead: true } : n
          )
        );
      }

      // Show modal
      setSelectedNotification(notification);
      setModalVisible(true);
    } catch (error) {
      console.error('Error handling notification press:', error);
    }
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setTimeout(() => {
      setSelectedNotification(null);
    }, 300);
  };

  const handleNavigate = (screen, params) => {
    navigation.navigate(screen, params);
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true }))
      );
      Alert.alert('Success', 'All notifications marked as read');
    } catch (error) {
      Alert.alert('Error', 'Failed to mark all as read');
    }
  };

  const renderNotification = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.notificationCard,
        !item.isRead && styles.notificationCardUnread
      ]}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.notificationIcon}>
        <NotificationIcon type={item.type} size={28} />
      </View>
      
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={styles.notificationTitle} numberOfLines={1}>
            {item.title}
          </Text>
          {!item.isRead && <View style={styles.unreadDot} />}
        </View>
        
        <Text style={styles.notificationMessage} numberOfLines={2}>
          {item.message}
        </Text>
        
        <Text style={styles.notificationTime}>
          {formatTimeAgo(item.createdAt)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <BellIcon size={64} color="#444444" />
      <Text style={styles.emptyText}>No notifications yet</Text>
      <Text style={styles.emptySubtext}>
        You'll see updates and announcements here
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#00BFFF" />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {notifications.some(n => !n.isRead) && (
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={styles.markAllRead}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Notifications List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00BFFF" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#00BFFF"
              colors={["#00BFFF"]}
            />
          }
        />
      )}

      {/* Notification Modal */}
      <NotificationModal
        visible={modalVisible}
        notification={selectedNotification}
        onClose={handleCloseModal}
        onNavigate={handleNavigate}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E1E',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  markAllRead: {
    fontSize: 14,
    color: '#00BFFF',
    fontWeight: '600',
  },
  listContent: {
    paddingVertical: 8,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  notificationCardUnread: {
    backgroundColor: '#1A1F2E',
    borderColor: '#00BFFF20',
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00BFFF',
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#AAAAAA',
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: '#666666',
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
    paddingTop: 120,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E0E0E0',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: SCREEN_WIDTH - 40,
    maxHeight: '80%',
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingRight: 16,
  },
  modalHeaderContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalHeaderTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  modalContent: {
    maxHeight: 400,
  },
  modalBody: {
    padding: 20,
    borderRadius: 12,
    margin: 16,
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  timestamp: {
    fontSize: 13,
    color: '#888888',
  },
  modalMessage: {
    fontSize: 16,
    color: '#E0E0E0',
    lineHeight: 24,
    marginBottom: 20,
  },
  tournamentInfo: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#00BFFF',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#888888',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  rewardInfo: {
    alignItems: 'center',
    marginTop: 12,
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  rewardAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFD700',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A1A1A',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#FF6B6B',
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dismissButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A2A2A',
  },
  dismissButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#AAAAAA',
  },
});

export default NotificationsScreen;