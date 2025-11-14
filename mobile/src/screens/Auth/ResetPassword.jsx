import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import axios from 'axios';

// const API_URL = 'http://192.168.50.193:5000';
const API_URL = 'https://terese-unconventional-luis.ngrok-free.dev';

const ResetPasswordScreen = ({ navigation }) => {
  const [step, setStep] = useState(1); 
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState(''); // 'success' or 'error'
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalAction, setModalAction] = useState(null);

  const showModal = (type, title, message, action = null) => {
    setModalType(type);
    setModalTitle(title);
    setModalMessage(message);
    setModalAction(() => action);
    setModalVisible(true);
  };

  const hideModal = () => {
    setModalVisible(false);
    if (modalAction) {
      modalAction();
    }
  };

  const handleSendOtp = async () => {
    if (!email) {
      showModal('error', 'Error', 'Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showModal('error', 'Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/auth/send-otp`, { email });
      
      if (response.data.success) {
        showModal('success', 'Success', 'OTP has been sent to your email', () => {
          setStep(2);
        });
      } else {
        showModal('error', 'Error', response.data.message || 'Failed to send OTP');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to send OTP. Please try again.';
      showModal('error', 'Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!otp || !newPassword || !confirmPassword) {
      showModal('error', 'Error', 'Please fill all fields');
      return;
    }

    if (newPassword.length < 6) {
      showModal('error', 'Error', 'Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      showModal('error', 'Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/auth/reset-password-otp`, {
        email,
        otp,
        newPassword,
      });

      if (response.data.success) {
        showModal(
          'success',
          'Success',
          'Password reset successfully! You can now login with your new password.',
          () => navigation.navigate('Login')
        );
      } else {
        showModal('error', 'Error', response.data.message || 'Failed to reset password');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to reset password. Please try again.';
      showModal('error', 'Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setStep(1);
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Reset Password</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Logo Section */}
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>ArenaX</Text>
            <Text style={styles.logoSubtext}>
              {step === 1 ? 'Recover your account' : 'Create new password'}
            </Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            {step === 1 ? (
              <>
                <Text style={styles.description}>
                  Enter your email address and we'll send you an OTP to reset your password.
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email Address</Text>
                  <View style={styles.inputWrapper}>
                    <Text style={styles.inputIcon}>✉️</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="player@arenax.com"
                      placeholderTextColor="#888888"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      editable={!loading}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
                  onPress={handleSendOtp}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Send OTP</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.description}>
                  Enter the OTP sent to {email} and your new password.
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>OTP Code</Text>
                  <View style={styles.inputWrapper}>
                    <Text style={styles.inputIcon}>🔢</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter 6-digit OTP"
                      placeholderTextColor="#888888"
                      value={otp}
                      onChangeText={setOtp}
                      keyboardType="number-pad"
                      maxLength={6}
                      editable={!loading}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>New Password</Text>
                  <View style={styles.inputWrapper}>
                    <Text style={styles.inputIcon}>🔒</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="••••••••"
                      placeholderTextColor="#888888"
                      value={newPassword}
                      onChangeText={setNewPassword}
                      secureTextEntry={!showNewPassword}
                      editable={!loading}
                    />
                    <TouchableOpacity
                      onPress={() => setShowNewPassword(!showNewPassword)}
                      style={styles.eyeButton}
                      disabled={loading}
                    >
                      <Text style={styles.eyeIcon}>
                        {showNewPassword ? '👁️' : '👁️‍🗨️'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Confirm Password</Text>
                  <View style={styles.inputWrapper}>
                    <Text style={styles.inputIcon}>🔒</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="••••••••"
                      placeholderTextColor="#888888"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showConfirmPassword}
                      editable={!loading}
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={styles.eyeButton}
                      disabled={loading}
                    >
                      <Text style={styles.eyeIcon}>
                        {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
                  onPress={handleResetPassword}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Reset Password</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handleBackToEmail}
                  disabled={loading}
                >
                  <Text style={styles.secondaryButtonText}>Change Email</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              style={styles.backToLoginLink}
              onPress={() => navigation.navigate('Login')}
              disabled={loading}
            >
              <Text style={styles.backToLoginText}>
                ← Back to Login
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Custom Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={hideModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Icon */}
            <View style={[
              styles.modalIconContainer,
              modalType === 'success' ? styles.modalIconSuccess : styles.modalIconError
            ]}>
              <Text style={styles.modalIcon}>
                {modalType === 'success' ? '✓' : '✕'}
              </Text>
            </View>

            {/* Modal Content */}
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{modalTitle}</Text>
              <Text style={styles.modalMessage}>{modalMessage}</Text>
            </View>

            {/* Modal Button */}
            <TouchableOpacity
              style={styles.modalButton}
              onPress={hideModal}
              activeOpacity={0.8}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 40,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 32,
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
    marginRight: 48,
  },
  headerSpacer: {
    width: 48,
  },

  // Logo Section
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 16,
  },
  logoText: {
    fontSize: 40,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  logoSubtext: {
    fontSize: 14,
    color: '#888888',
  },

  // Form Section
  formSection: {
    paddingHorizontal: 16,
  },
  description: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 24,
    lineHeight: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#E0E0E0',
    fontWeight: '500',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  eyeButton: {
    padding: 4,
    marginLeft: 8,
  },
  eyeIcon: {
    fontSize: 20,
  },

  // Primary Button
  primaryButton: {
    backgroundColor: '#00BFFF',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  primaryButtonDisabled: {
    backgroundColor: '#6B7280',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Secondary Button
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 15,
  },
  secondaryButtonText: {
    fontSize: 14,
    color: '#00BFFF',
    fontWeight: '700',
  },

  // Back to Login Link
  backToLoginLink: {
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 10,
  },
  backToLoginText: {
    fontSize: 14,
    color: '#888888',
    fontWeight: '500',
  },

  bottomSpacing: {
    height: 20,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalIconSuccess: {
    backgroundColor: 'rgba(0, 191, 255, 0.15)',
  },
  modalIconError: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  modalIcon: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalContent: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalButton: {
    backgroundColor: '#00BFFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 48,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default ResetPasswordScreen;