import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ImageBackground,
  Platform,
} from 'react-native';
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

// SubCategory Card Component with Image
const SubCategoryCard = React.memo(({ 
  title, 
  imageUri, 
  onPress,
  isComingSoon = false
}) => {
  return (
    <TouchableOpacity
      style={styles.subCategoryCard}
      onPress={onPress}
      activeOpacity={isComingSoon ? 1 : 0.8}
      disabled={isComingSoon}
    >
      <ImageBackground
        source={{ uri: imageUri }}
        style={styles.subCategoryImage}
        imageStyle={styles.subCategoryImageStyle}
      >
        <View style={[
          styles.subCategoryOverlay,
          isComingSoon && styles.noOverlay
        ]}>
          {isComingSoon && (
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>COMING SOON</Text>
            </View>
          )}
          <View style={styles.subCategoryContent}>
            <Text style={styles.subCategoryTitle}>{title}</Text>
            {title && <View style={styles.titleUnderline} />}
          </View>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
});

const SubCategoryScreen = ({ navigation, route }) => {
  const { category } = route.params;

  const handleSubCategoryPress = useCallback((subCategory) => {
    if (subCategory === 'Bermuda') {
      // Navigate to tournament list for Bermuda
      navigation.navigate('TournamentList', { 
        category: 'Free Fire',
        subCategory: 'Bermuda'
      });
    } else if (subCategory === 'Clash Squad') {
      // Navigate to Clash Squad with mode toggle
      navigation.navigate('ClashSquad', {
        category: 'Free Fire',
        subCategory: 'Clash Squad'
      });
    }
  }, [navigation]);

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
        
        <Text style={styles.headerTitle}>{category}</Text>
        
        <View style={styles.headerPlaceholder} />
      </View>

      {/* SubCategories */}
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Select Mode</Text>
        
        <View style={styles.subCategoriesContainer}>
          <SubCategoryCard
            title=""
            imageUri="https://res.cloudinary.com/diwerulix/image/upload/v1763291740/br_soy6xq.jpg"
            onPress={() => handleSubCategoryPress('Bermuda')}
          />
          
          <SubCategoryCard
            title=""
            imageUri="https://res.cloudinary.com/diwerulix/image/upload/v1763291834/xs2_rnfmjc.jpg"
            onPress={() => handleSubCategoryPress('Clash Squad')}
          />
        </View>

        <View style={styles.subCategoriesContainer}>
          <SubCategoryCard
            title=""
            imageUri="https://res.cloudinary.com/diwerulix/image/upload/v1763291162/s1_unquom.jpg"
            isComingSoon={true}
          />
          
          <SubCategoryCard
            title=""
            imageUri="https://res.cloudinary.com/diwerulix/image/upload/v1763291432/s2_hvqpyi.jpg"
            isComingSoon={true}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: Platform.OS === 'android' ? 40 : 0,
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
  
  // Content
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 24,
  },
  subCategoriesContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  
  // SubCategory Card
  subCategoryCard: {
    flex: 1,
    height: 260,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 5,
  },
  subCategoryImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  subCategoryImageStyle: {
    borderRadius: 20,
    resizeMode: 'cover',
  },
  subCategoryOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
    padding: 18,
  },
  noOverlay: {
    backgroundColor: 'transparent',
  },
  comingSoonBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(18, 18, 18, 0.85)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  comingSoonText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.2,
  },
  subCategoryContent: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    width: '100%',
    alignItems: 'center',
  },
  subCategoryTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2.5,
    textAlign: 'center',
    textTransform: 'uppercase',
    textShadowColor: '#000000',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
    flexWrap: 'nowrap',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Black' : 'sans-serif-black',
    lineHeight: 32,
  },
  titleUnderline: {
    width: 60,
    height: 3,
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    borderRadius: 2,
  },
  subCategoryDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '600',
    letterSpacing: 0.5,
    display: 'none',
  },
});

export default SubCategoryScreen;