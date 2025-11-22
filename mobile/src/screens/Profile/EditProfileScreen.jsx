import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Platform,
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { authAPI, getImageUrl } from '../../services/api';

const EditProfileScreen = () => {
  const { user, updateUserProfile } = useAuth();
  const navigation = useNavigation();

  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    phoneNumber: user?.phoneNumber || '',
    username: user?.username || '',
  });

  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Custom modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: '',
    message: '',
    type: 'info', // 'success', 'error', 'info', 'warning'
    buttons: [],
  });

  // Custom Alert Modal
  const showCustomAlert = (title, message, type = 'info', buttons = [{ text: 'OK' }]) => {
    setModalConfig({
      title,
      message,
      type,
      buttons: buttons.map(btn => ({
        ...btn,
        onPress: () => {
          setModalVisible(false);
          if (btn.onPress) btn.onPress();
        }
      }))
    });
    setModalVisible(true);
  };

  const getCurrentProfileImage = () => {
    if (profileImage) {
      return { uri: profileImage.uri };
    }
    if (user?.profileImage) {
      return { uri: getImageUrl(user.profileImage) };
    }
    return null;
  };

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showCustomAlert(
          'Permission Required',
          'We need camera roll permissions to upload profile pictures.',
          'warning'
        );
        return false;
      }
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProfileImage(result.assets[0]);
        console.log('✅ Image selected:', result.assets[0].uri);
      }
    } catch (error) {
      console.error('❌ Error picking image:', error);
      showCustomAlert('Error', 'Failed to pick image. Please try again.', 'error');
    }
  };

  const handleUpdateProfile = async () => {
    if (!formData.fullName.trim()) {
      showCustomAlert('Validation Error', 'Full name is required.', 'warning');
      return;
    }

    if (!formData.username.trim()) {
      showCustomAlert('Validation Error', 'Username is required.', 'warning');
      return;
    }

    if (formData.phoneNumber && !/^\+?[\d\s-()]+$/.test(formData.phoneNumber)) {
      showCustomAlert('Validation Error', 'Please enter a valid phone number.', 'warning');
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();
      
      formDataToSend.append('fullName', formData.fullName.trim());
      formDataToSend.append('username', formData.username.trim());
      formDataToSend.append('phoneNumber', formData.phoneNumber.trim());

      if (profileImage) {
        const imageUri = profileImage.uri;
        const filename = imageUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formDataToSend.append('profileImage', {
          uri: Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri,
          name: filename,
          type: type,
        });

        console.log('📸 Image added to form data:', {
          uri: imageUri,
          name: filename,
          type: type
        });
      }

      console.log('📤 Sending profile update...');
      const response = await authAPI.updateProfile(formDataToSend);
      const data = response.data;

      console.log('✅ Profile update response:', data);

      if (data.success) {
        await updateUserProfile(data.user);

        showCustomAlert(
          'Success',
          'Profile updated successfully!',
          'success',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        showCustomAlert('Error', data.message || 'Failed to update profile.', 'error');
      }
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update profile. Please try again.';
      showCustomAlert('Error', errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Get icon and color based on modal type
  const getModalStyle = () => {
    switch (modalConfig.type) {
      case 'success':
        return {
          iconBg: 'rgba(34, 197, 94, 0.15)',
          icon: '✓',
          iconColor: '#22C55E',
        };
      case 'error':
        return {
          iconBg: 'rgba(239, 68, 68, 0.15)',
          icon: '✕',
          iconColor: '#EF4444',
        };
      case 'warning':
        return {
          iconBg: 'rgba(251, 191, 36, 0.15)',
          icon: '!',
          iconColor: '#FBBF24',
        };
      default:
        return {
          iconBg: 'rgba(0, 191, 255, 0.15)',
          icon: 'i',
          iconColor: '#00BFFF',
        };
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <View style={styles.backIconContainer}>
              <Text style={styles.backIcon}>‹</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Profile Image Section */}
        <View style={styles.profileImageSection}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={pickImage}
            activeOpacity={0.8}
          >
            {getCurrentProfileImage() ? (
              <Image
                source={getCurrentProfileImage()}
                style={styles.avatarImage}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {formData.username?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            <View style={styles.cameraIconOverlay}>
              <View style={styles.cameraIcon}>
                <View style={styles.cameraLens} />
              </View>
            </View>
          </TouchableOpacity>
          <Text style={styles.changePhotoText}>Tap to change photo</Text>
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          {/* Full Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputContainer}>
              <View style={styles.inputIconWrapper}>
                <Text style={styles.inputIconText}>U</Text>
              </View>
              <TextInput
                style={styles.input}
                value={formData.fullName}
                onChangeText={(text) =>
                  setFormData({ ...formData, fullName: text })
                }
                placeholder="Enter your full name"
                placeholderTextColor="#505050"
              />
            </View>
          </View>

          {/* Username */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username</Text>
            <View style={styles.inputContainer}>
              <View style={styles.inputIconWrapper}>
                <Text style={styles.inputIconText}>G</Text>
              </View>
              <TextInput
                style={styles.input}
                value={formData.username}
                onChangeText={(text) =>
                  setFormData({ ...formData, username: text })
                }
                placeholder="Enter your username"
                placeholderTextColor="#505050"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Phone Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.inputContainer}>
              <View style={styles.inputIconWrapper}>
                <Text style={styles.inputIconText}>☎</Text>
              </View>
              <TextInput
                style={styles.input}
                value={formData.phoneNumber}
                onChangeText={(text) =>
                  setFormData({ ...formData, phoneNumber: text })
                }
                placeholder="Enter your phone number"
                placeholderTextColor="#505050"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Email (Read-only) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={[styles.inputContainer, styles.disabledInput]}>
              <View style={[styles.inputIconWrapper, styles.disabledIconWrapper]}>
                <Text style={styles.inputIconText}>@</Text>
              </View>
              <TextInput
                style={[styles.input, styles.disabledText]}
                value={user?.email}
                editable={false}
                placeholder="Email address"
                placeholderTextColor="#505050"
              />
            </View>
            <Text style={styles.helperText}>Email cannot be changed</Text>
          </View>
        </View>

        {/* Save Button */}
        <View style={styles.buttonSection}>
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleUpdateProfile}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Custom Alert Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Icon */}
            <View style={[
              styles.modalIconContainer,
              { backgroundColor: getModalStyle().iconBg }
            ]}>
              <Text style={[
                styles.modalIconText,
                { color: getModalStyle().iconColor }
              ]}>
                {getModalStyle().icon}
              </Text>
            </View>

            {/* Title */}
            <Text style={styles.modalTitle}>{modalConfig.title}</Text>

            {/* Message */}
            <Text style={styles.modalMessage}>{modalConfig.message}</Text>

            {/* Buttons */}
            <View style={styles.modalButtons}>
              {modalConfig.buttons.map((button, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.modalButton,
                    modalConfig.buttons.length === 1 && styles.modalButtonFull,
                    button.style === 'cancel' && styles.modalButtonCancel,
                  ]}
                  onPress={button.onPress}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.modalButtonText,
                    button.style === 'cancel' && styles.modalButtonTextCancel,
                  ]}>
                    {button.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#0A0A0A',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
    marginRight: 40,
    letterSpacing: 0.3,
  },
  headerSpacer: {
    width: 40,
  },

  // Profile Image Section
  profileImageSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: '#0A0A0A',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#1A1A1A',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#00BFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#1A1A1A',
  },
  avatarText: {
    fontSize: 50,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cameraIconOverlay: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#00BFFF',
    borderWidth: 3,
    borderColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: {
    width: 18,
    height: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    position: 'relative',
  },
  cameraLens: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#00BFFF',
    top: 4.5,
    left: 5.5,
  },
  changePhotoText: {
    fontSize: 14,
    color: '#707070',
    marginTop: 8,
    letterSpacing: 0.2,
  },

  // Form Section
  formSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#707070',
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141414',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: '#1F1F1F',
  },
  inputIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 191, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  inputIconText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00BFFF',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '400',
    letterSpacing: 0.2,
  },
  disabledInput: {
    backgroundColor: '#0F0F0F',
    opacity: 0.7,
  },
  disabledIconWrapper: {
    backgroundColor: 'rgba(112, 112, 112, 0.15)',
  },
  disabledText: {
    color: '#707070',
  },
  helperText: {
    fontSize: 12,
    color: '#505050',
    marginTop: 8,
    marginLeft: 4,
    letterSpacing: 0.2,
  },

  // Buttons
  buttonSection: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  saveButton: {
    backgroundColor: '#00BFFF',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    marginBottom: 12,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  cancelButton: {
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  bottomSpacing: {
    height: 20,
  },

  // Custom Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    backgroundColor: '#141414',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1F1F1F',
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  modalIconText: {
    fontSize: 32,
    fontWeight: '700',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  modalMessage: {
    fontSize: 15,
    color: '#707070',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
    letterSpacing: 0.2,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    backgroundColor: '#00BFFF',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonFull: {
    flex: 1,
  },
  modalButtonCancel: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  modalButtonTextCancel: {
    color: '#FFFFFF',
  },
});

export default EditProfileScreen;