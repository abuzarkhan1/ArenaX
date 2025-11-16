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
            <Text style={styles.patternIcon}>🏆</Text>
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
        </View>
      </View>
    </TouchableOpacity>
  );
});

const TournamentListScreen = ({ navigation, route }) => {
  const { category, subCategory, mode } = route.params;
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchTournaments = useCallback(async () => {
    try {
      const params = {
        category,
        ...(subCategory && { subCategory }),
        ...(mode && { mode }),
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
  }, [category, subCategory, mode, statusFilter]);

  useEffect(() => {
    fetchTournaments();
  }, [fetchTournaments]);

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

  const screenTitle = useMemo(() => {
    if (mode) return `${subCategory} ${mode}`;
    if (subCategory) return subCategory;
    return category;
  }, [category, subCategory, mode]);

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
        
        <Text style={styles.headerTitle}>{screenTitle}</Text>
        
        <View style={styles.headerPlaceholder} />
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
  
  // Filters
  filtersContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  filterChip: {
    marginRight: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#1E1E1E',
  },
  filterChipActive: {
    backgroundColor: '#00BFFF',
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
    paddingTop: 16,
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
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  bannerContainer: {
    width: '100%',
    height: 180,
    overflow: 'hidden',
  },
  fallbackBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
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
    opacity: 0.15,
  },
  patternIcon: {
    fontSize: 80,
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
  
  bottomSpacing: {
    height: 20,
  },
});

export default TournamentListScreen;