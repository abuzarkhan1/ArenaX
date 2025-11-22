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
  SafeAreaView,
  Image,
} from 'react-native';
import { tournamentAPI } from '../../services/api';
import Svg, { Path } from 'react-native-svg';

// Back Icon Component
const BackIcon = ({ size = 24, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 12H5M12 19l-7-7 7-7"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Mode Toggle Component
const ModeToggle = React.memo(({ selectedMode, onModeChange }) => (
  <View style={styles.modeToggleContainer}>
    <TouchableOpacity
      style={[styles.modeToggleButton, selectedMode === 'solo' && styles.modeToggleButtonActive]}
      onPress={() => onModeChange('solo')}
      activeOpacity={0.7}
    >
      <Text style={[styles.modeToggleText, selectedMode === 'solo' && styles.modeToggleTextActive]}>
        Solo
      </Text>
    </TouchableOpacity>
    
    <TouchableOpacity
      style={[styles.modeToggleButton, selectedMode === 'duo' && styles.modeToggleButtonActive]}
      onPress={() => onModeChange('duo')}
      activeOpacity={0.7}
    >
      <Text style={[styles.modeToggleText, selectedMode === 'duo' && styles.modeToggleTextActive]}>
        Duo
      </Text>
    </TouchableOpacity>
    
    <TouchableOpacity
      style={[styles.modeToggleButton, selectedMode === 'squad' && styles.modeToggleButtonActive]}
      onPress={() => onModeChange('squad')}
      activeOpacity={0.7}
    >
      <Text style={[styles.modeToggleText, selectedMode === 'squad' && styles.modeToggleTextActive]}>
        Squad
      </Text>
    </TouchableOpacity>
  </View>
));

// Filter Chip Component
const FilterChip = React.memo(({ label, isActive, onPress }) => (
  <TouchableOpacity
    style={[styles.filterChip, isActive && styles.filterChipActive]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
      {label}
    </Text>
  </TouchableOpacity>
));

// Tournament Card Component
const TournamentCard = React.memo(({ tournament, onPress }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const normalizeImageUrl = (url) => {
    if (!url) return null;
    const trimmedUrl = url.trim();
    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      return null;
    }
    return trimmedUrl;
  };

  const imageUri = normalizeImageUrl(tournament.bannerImage);

  return (
    <TouchableOpacity
      style={styles.tournamentCard}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.bannerContainer}>
        <View style={styles.fallbackBackground}>
          <View style={styles.patternOverlay}>
            <Text style={styles.patternIcon}>⚔️</Text>
          </View>

          {imageUri && !imageError && (
            <>
              <Image
                source={{ 
                  uri: imageUri,
                  headers: { 'Accept': 'image/*' }
                }}
                style={styles.imageOverlay}
                resizeMode="cover"
                onLoadStart={() => setImageLoading(true)}
                onLoadEnd={() => setImageLoading(false)}
                onError={() => {
                  setImageError(true);
                  setImageLoading(false);
                }}
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
            <View style={styles.modeBadge}>
              <Text style={styles.modeBadgeText}>{tournament.mode}</Text>
            </View>
            <Text style={styles.tournamentTitle} numberOfLines={2}>
              {tournament.title}
            </Text>
            <View style={styles.tournamentMetaRow}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Entry</Text>
                <Text style={styles.metaValue}>{tournament.entryFee} AX</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Prize</Text>
                <Text style={styles.metaValueGreen}>{tournament.prizePool} AX</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Slots</Text>
                <Text style={styles.metaValue}>
                  {tournament.currentParticipants}/{tournament.maxParticipants}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const ClashSquadScreen = ({ navigation, route }) => {
  const { category, subCategory } = route.params;
  const [selectedMode, setSelectedMode] = useState('solo');
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchTournaments = useCallback(async () => {
    try {
      const params = {
        category,
        subCategory,
        mode: selectedMode,
      };

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const response = await tournamentAPI.getAll(params);
      setTournaments(response.data.tournaments);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch tournaments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [category, subCategory, selectedMode, statusFilter]);

  useEffect(() => {
    setLoading(true);
    fetchTournaments();
  }, [selectedMode, statusFilter]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTournaments();
  }, [fetchTournaments]);

  const handleTournamentPress = useCallback((tournamentId) => {
    navigation.navigate('TournamentDetail', { tournamentId });
  }, [navigation]);

  const handleFilterChange = useCallback((filter) => {
    setStatusFilter(filter);
  }, []);

  const handleModeChange = useCallback((mode) => {
    setSelectedMode(mode);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <BackIcon size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Clash Squad</Text>
        
        <View style={styles.headerPlaceholder} />
      </View>

      {/* Mode Toggle */}
      <View style={styles.modeToggleSection}>
        <ModeToggle selectedMode={selectedMode} onModeChange={handleModeChange} />
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <FilterChip 
            label="All" 
            isActive={statusFilter === 'all'}
            onPress={() => handleFilterChange('all')}
          />
          <FilterChip 
            label="Live" 
            isActive={statusFilter === 'live'}
            onPress={() => handleFilterChange('live')}
          />
          <FilterChip 
            label="Upcoming" 
            isActive={statusFilter === 'approved'}
            onPress={() => handleFilterChange('approved')}
          />
          <FilterChip 
            label="Completed" 
            isActive={statusFilter === 'completed'}
            onPress={() => handleFilterChange('completed')}
          />
        </ScrollView>
      </View>

      {/* Tournaments List */}
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
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00BFFF" />
          </View>
        ) : tournaments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>⚔️</Text>
            <Text style={styles.emptyText}>No {selectedMode} tournaments found</Text>
            <Text style={styles.emptySubtext}>
              Check back later for new tournaments
            </Text>
          </View>
        ) : (
          tournaments.map((tournament) => (
            <TournamentCard
              key={tournament._id}
              tournament={tournament}
              onPress={() => handleTournamentPress(tournament._id)}
            />
          ))
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E1E1E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerPlaceholder: {
    width: 40,
  },
  
  // Mode Toggle Section
  modeToggleSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  modeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 4,
  },
  modeToggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  modeToggleButtonActive: {
    backgroundColor: '#00BFFF',
  },
  modeToggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#888888',
  },
  modeToggleTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  
  // Filters
  filtersContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  filterChip: {
    marginRight: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#1E1E1E',
  },
  filterChipActive: {
    backgroundColor: '#FA709A',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888888',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  
  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
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
    height: 200,
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
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  titleContainer: {
    padding: 16,
    zIndex: 10,
  },
  modeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(250, 112, 154, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  modeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tournamentTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tournamentMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaItem: {
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 4,
    fontWeight: '500',
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00BFFF',
  },
  metaValueGreen: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
  },
  
  bottomSpacing: {
    height: 20,
  },
});

export default ClashSquadScreen;