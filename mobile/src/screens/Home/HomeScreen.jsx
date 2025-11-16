import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
  Linking,
  ImageBackground,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { notificationAPI } from "../../services/api";
import Svg, { Path } from "react-native-svg";

const { width } = Dimensions.get("window");

// Bell Icon Component
const BellIcon = ({ size = 24, color = "#FFFFFF" }) => (
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
const WhatsAppIcon = ({ size = 35, color = "#FFFFFF" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
      fill={color}
    />
  </Svg>
);

// Category Card Component with Image
const CategoryCard = React.memo(
  ({ title, imageUri, onPress, comingSoon = false }) => {
    return (
      <TouchableOpacity
        style={styles.categoryCard}
        onPress={onPress}
        activeOpacity={0.8}
        disabled={comingSoon}
      >
        <ImageBackground
          source={{ uri: imageUri }}
          style={styles.categoryImage}
          imageStyle={styles.categoryImageStyle}
        >
          <View style={styles.categoryOverlay}>
            {comingSoon && (
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>Coming Soon</Text>
              </View>
            )}
            <View style={styles.categoryTitleContainer}>
              <Text style={styles.categoryTitle}>{title}</Text>
            </View>
          </View>
        </ImageBackground>
      </TouchableOpacity>
    );
  }
);

const HomeScreen = ({ navigation }) => {
  const { user, updateUser } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread notification count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await notificationAPI.getUnreadCount();
      if (response.data.success) {
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Poll for unread count every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([updateUser(), fetchUnreadCount()]);
    setRefreshing(false);
  }, [updateUser, fetchUnreadCount]);

  const handleNavigateToNotifications = useCallback(() => {
    navigation.navigate("Notifications");
    setTimeout(() => fetchUnreadCount(), 500);
  }, [navigation, fetchUnreadCount]);

  const handleWhatsAppPress = useCallback(async () => {
    const phoneNumber = "923367135319";
    const message = "Hello, I need support!";
    const whatsappUrl = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(
      message
    )}`;
    const webUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
      message
    )}`;

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
        Alert.alert("Error", "Failed to open WhatsApp");
      }
    }
  }, []);

  const handleCategoryPress = useCallback(
    (category) => {
      if (category === "Free Fire") {
        navigation
          .getParent()
          ?.navigate("SubCategory", { category: "Free Fire" });
      } else if (category === "PUBG") {
        Alert.alert("Coming Soon", "PUBG tournaments will be available soon!");
      }
    },
    [navigation]
  );

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
                    {unreadCount > 99 ? "99+" : unreadCount}
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

        {/* Categories Section */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Select Game</Text>

          <View style={styles.categoriesGrid}>
            <CategoryCard
              title=""
              imageUri="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTzxd5f6owtc5TnHEQFm04eg1ZMeozaHey9NbeGFW4Ilga6diS49GVi64LkfY0lK8awlObi&s=10"
              onPress={() => handleCategoryPress("Free Fire")}
            />

            <CategoryCard
              title=""
              imageUri="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRoba1RPe-dSwqIDw4O5Wskz03p8vJNVn2LZA&s"
              onPress={() => handleCategoryPress("PUBG")}
              comingSoon={true}
            />
          </View>
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
    backgroundColor: "#121212",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 14,
    color: "#888888",
    fontWeight: "500",
    marginBottom: 4,
  },
  username: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#1E1E1E",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#FF3B30",
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: "#121212",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  coinBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E1E1E",
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
    fontWeight: "700",
    color: "#FFFFFF",
  },

  // Categories Section
  categoriesSection: {
    paddingHorizontal: 16,
    marginTop: 40,
    flex: 1,
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 16,
  },
  categoriesGrid: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
  },
  categoryCard: {
    flex: 1,
    height: 240,
    borderRadius: 20,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 5,
  },
  categoryImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  categoryImageStyle: {
    borderRadius: 20,
    resizeMode: "cover",
  },
  categoryOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "flex-end",
    padding: 18,
  },
  comingSoonBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "rgba(255, 59, 48, 0.9)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  comingSoonText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  categoryTitleContainer: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignSelf: "center",
    width: "100%",
  },
  categoryTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: 1.8,
    textShadowColor: "rgba(0, 0, 0, 0.95)",
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 8,
  },

  // WhatsApp Floating Button
  whatsappButton: {
    position: "absolute",
    right: 20,
    bottom: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#25D366",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
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