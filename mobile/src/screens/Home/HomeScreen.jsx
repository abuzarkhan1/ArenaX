import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Linking,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { tournamentAPI, notificationAPI } from '../../services/api';
import Svg, { Path } from 'react-native-svg';

const { width } = Dimensions.get('window');

// Bell Icon Component
const BellIcon = ({ size = 24, color = '#FFFFFF' }) => (
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

// WhatsApp Icon Component
const WhatsAppIcon = ({ size = 35, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
      fill={color}
    />
  </Svg>
);

// Memoized FilterButton Component
const FilterButton = React.memo(({ label, value, isActive, onPress }) => {
  return (
    <TouchableOpacity
      style={[styles.filterButton, isActive && styles.filterButtonActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
});

// Normalize image URL function
const normalizeImageUrl = (url) => {
  if (!url) return null;
  const trimmedUrl = url.trim();
  if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
    return null;
  }
  return trimmedUrl;
};

// Memoized TournamentCard Component
const TournamentCard = React.memo(({ 
  tournament, 
  onPress,
  imageError,
  imageLoading,
  onImageError,
  onImageLoadStart,
  onImageLoadEnd
}) => {
  const imageUri = useMemo(() => normalizeImageUrl(tournament.bannerImage), [tournament.bannerImage]);

  return (
    <TouchableOpacity
      style={styles.tournamentCard}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.bannerContainer}>
        <View style={styles.fallbackBackground}>
          <View style={styles.patternOverlay}>
            <Text style={styles.patternIcon}>🏆</Text>
          </View>

          {imageUri && !imageError && (
            <>
              <Image
                source={{ 
                  uri: imageUri,
                  headers: {
                    'Accept': 'image/*',
                  }
                }}
                style={styles.imageOverlay}
                resizeMode="cover"
                onLoadStart={onImageLoadStart}
                onLoadEnd={onImageLoadEnd}
                onError={onImageError}
              />
              {imageLoading && (
                <View style={styles.imageLoadingOverlay}>
                  <ActivityIndicator size="small" color="#00BFFF" />
                </View>
              )}
            </>
          )}

          <View style={styles.bannerOverlay} />

          <View style={styles.titleContainer}>
            <Text style={styles.tournamentTitle} numberOfLines={2}>
              {tournament.title}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.tournament._id === nextProps.tournament._id &&
    prevProps.tournament.bannerImage === nextProps.tournament.bannerImage &&
    prevProps.tournament.title === nextProps.tournament.title &&
    prevProps.imageError === nextProps.imageError &&
    prevProps.imageLoading === nextProps.imageLoading
  );
});

const HomeScreen = ({ navigation }) => {
  const { user, updateUser } = useAuth();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [imageErrors, setImageErrors] = useState({});
  const [imageLoading, setImageLoading] = useState({});
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread notification count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await notificationAPI.getUnreadCount();
      if (response.data.success) {
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, []);

  const fetchTournaments = useCallback(async () => {
    try {
      const params = {};
      if (filter !== 'all') {
        params.status = filter;
      }
      const response = await tournamentAPI.getAll(params);
      setTournaments(response.data.tournaments);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch tournaments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchTournaments();
    fetchUnreadCount();
  }, [fetchTournaments, fetchUnreadCount]);

  // Poll for unread count every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchTournaments(), updateUser(), fetchUnreadCount()]);
  }, [fetchTournaments, updateUser, fetchUnreadCount]);

  const handleFilterChange = useCallback((value) => {
    setFilter(value);
  }, []);

  const handleImageError = useCallback((tournamentId) => {
    setImageErrors(prev => ({ ...prev, [tournamentId]: true }));
    setImageLoading(prev => ({ ...prev, [tournamentId]: false }));
  }, []);

  const handleImageLoadStart = useCallback((tournamentId) => {
    setImageLoading(prev => ({ ...prev, [tournamentId]: true }));
  }, []);

  const handleImageLoadEnd = useCallback((tournamentId) => {
    setImageLoading(prev => ({ ...prev, [tournamentId]: false }));
  }, []);

  const handleNavigateToTournament = useCallback((tournamentId) => {
    navigation.navigate('TournamentDetail', { tournamentId });
  }, [navigation]);

  const handleNavigateToNotifications = useCallback(() => {
    navigation.navigate('Notifications');
    // Refresh unread count when returning
    setTimeout(() => fetchUnreadCount(), 500);
  }, [navigation, fetchUnreadCount]);

  const handleWhatsAppPress = useCallback(async () => {
    const phoneNumber = '923367135319';
    const message = 'Hello, I need support!';
    const whatsappUrl = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
    const webUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    
    try {
      const supported = await Linking.canOpenURL(whatsappUrl);
      if (supported) {
        await Linking.openURL(whatsappUrl);
      } else {
        await Linking.openURL(webUrl);
      }
    } catch (error) {
      try {
        await Linking.openURL(webUrl);
      } catch (webError) {
        Alert.alert('Error', 'Failed to open WhatsApp');
      }
    }
  }, []);

  const sectionTitle = useMemo(() => {
    switch (filter) {
      case 'live':
        return 'Live Now';
      case 'approved':
        return 'Upcoming';
      case 'completed':
        return 'Completed';
      default:
        return 'All Tournaments';
    }
  }, [filter]);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor="#00BFFF"
            colors={["#00BFFF"]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.username}>{user?.username}</Text>
          </View>
          
          <View style={styles.headerRight}>
            {/* Notification Bell */}
            <TouchableOpacity 
              style={styles.notificationButton}
              onPress={handleNavigateToNotifications}
              activeOpacity={0.7}
            >
              <BellIcon size={24} color="#FFFFFF" />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Coin Badge */}
            <View style={styles.coinBadge}>
              <Text style={styles.coinIcon}>🪙</Text>
              <Text style={styles.coinAmount}>{user?.coinBalance || 0}</Text>
            </View>
          </View>
        </View>

        {/* Filter Buttons */}
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <FilterButton 
              label="All" 
              value="all" 
              isActive={filter === 'all'}
              onPress={() => handleFilterChange('all')}
            />
            <FilterButton 
              label="Live" 
              value="live" 
              isActive={filter === 'live'}
              onPress={() => handleFilterChange('live')}
            />
            <FilterButton 
              label="Upcoming" 
              value="approved" 
              isActive={filter === 'approved'}
              onPress={() => handleFilterChange('approved')}
            />
            <FilterButton 
              label="Completed" 
              value="completed" 
              isActive={filter === 'completed'}
              onPress={() => handleFilterChange('completed')}
            />
          </ScrollView>
        </View>

        {/* Tournaments Section */}
        <View style={styles.tournamentsSection}>
          <Text style={styles.sectionTitle}>{sectionTitle}</Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#00BFFF" />
            </View>
          ) : tournaments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🏆</Text>
              <Text style={styles.emptyText}>No tournaments found</Text>
              <Text style={styles.emptySubtext}>
                Check back later for new tournaments
              </Text>
            </View>
          ) : (
            tournaments.map((tournament) => (
              <TournamentCard 
                key={tournament._id} 
                tournament={tournament}
                onPress={() => handleNavigateToTournament(tournament._id)}
                imageError={imageErrors[tournament._id]}
                imageLoading={imageLoading[tournament._id]}
                onImageError={(error) => handleImageError(tournament._id)}
                onImageLoadStart={() => handleImageLoadStart(tournament._id)}
                onImageLoadEnd={() => handleImageLoadEnd(tournament._id)}
              />
            ))
          )}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Floating WhatsApp Button */}
      <TouchableOpacity
        style={styles.whatsappButton}
        onPress={handleWhatsAppPress}
        activeOpacity={0.8}
      >
        <WhatsAppIcon size={35} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 14,
    color: '#888888',
    fontWeight: '500',
    marginBottom: 4,
  },
  username: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E1E1E',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF3B30',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#121212',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  coinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  coinIcon: {
    fontSize: 20,
    marginRight: 6,
  },
  coinAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Filter Container
  filterContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  filterButton: {
    marginRight: 12,
    borderRadius: 12,
    backgroundColor: '#1E1E1E',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  filterButtonActive: {
    backgroundColor: '#00BFFF',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888888',
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Tournaments Section
  tournamentsSection: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },

  // Loading & Empty States
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E0E0E0',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
  },

  // Tournament Card
  tournamentCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  bannerContainer: {
    width: '100%',
    height: 180,
    overflow: 'hidden',
  },
  fallbackBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
    position: 'relative',
    backgroundColor: '#2A2A2A',
  },
  patternOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.1,
  },
  patternIcon: {
    fontSize: 100,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  imageLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  bannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  titleContainer: {
    padding: 16,
    zIndex: 10,
  },
  tournamentTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },

  // WhatsApp Floating Button
  whatsappButton: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    zIndex: 999,
  },

  bottomSpacing: {
    height: 20,
  },
});

export default HomeScreen;