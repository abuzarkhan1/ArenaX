import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Clipboard,
  Image,
  Animated,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

// Custom Success Modal Component
const SuccessModal = ({ visible, onClose }) => {
  const [scaleAnim] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(0));

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.successOverlay, { opacity: fadeAnim }]}>
        <Animated.View
          style={[
            styles.successContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Success Icon */}
          <View style={styles.successIconContainer}>
            <View style={styles.successIconCircle}>
              <Text style={styles.successIconText}>✓</Text>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.successTitle}>Deposit Submitted!</Text>

          {/* Message */}
          <Text style={styles.successMessage}>
            Your deposit request has been submitted successfully!
          </Text>

          {/* Info Box */}
          <View style={styles.successInfoBox}>
            <Text style={styles.successInfoIcon}>⏳</Text>
            <Text style={styles.successInfoText}>
              You will be notified once it's approved. This usually takes a few minutes to a few hours.
            </Text>
          </View>

          {/* Close Button */}
          <TouchableOpacity
            style={styles.successButton}
            onPress={handleClose}
            activeOpacity={0.8}
          >
            <Text style={styles.successButtonText}>Got it!</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const DepositModal = ({ visible, onClose, onSubmit }) => {
  const [selectedMethod, setSelectedMethod] = useState('Easypaisa');
  const [amount, setAmount] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const paymentMethods = [
    { id: 'easypaisa', label: 'Easypaisa', accountNumber: '0324-9090438' },
    { id: 'jazzcash', label: 'JazzCash', accountNumber: '03249090438' },
    { id: 'bank', label: 'Bank Account', accountNumber: 'will include' },
  ];

  const selectedPaymentMethod = paymentMethods.find(
    method => method.label === selectedMethod
  );

  const handleCopyAccount = () => {
    if (selectedPaymentMethod) {
      Clipboard.setString(selectedPaymentMethod.accountNumber);
      Alert.alert('Copied', 'Account number copied to clipboard');
    }
  };

  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Please allow access to your photo library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setScreenshot(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) < 50) {
      Alert.alert('Invalid Amount', 'Minimum deposit amount is 50 AX coins');
      return;
    }

    if (!screenshot) {
      Alert.alert('Screenshot Required', 'Please upload proof of payment');
      return;
    }

    setLoading(true);

    try {
      let screenshotData = screenshot.base64;
      
      if (!screenshotData.startsWith('data:image')) {
        screenshotData = `data:image/jpeg;base64,${screenshotData}`;
      }

      const depositData = {
        amount: parseFloat(amount),
        paymentMethod: selectedMethod,
        accountNumber: selectedPaymentMethod?.accountNumber,
        screenshot: screenshotData,
      };

      await onSubmit(depositData);
      
      // Reset form
      setAmount('');
      setScreenshot(null);
      setSelectedMethod('Easypaisa');
      
      // Show custom success modal
      setShowSuccessModal(true);
      
    } catch (error) {
      console.error('Deposit submission error:', error);
      Alert.alert('Error', error.message || 'Failed to submit deposit request');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setAmount('');
      setScreenshot(null);
      setSelectedMethod('Easypaisa');
      onClose();
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    onClose(); // Also close the main deposit modal
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleClose}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Deposit Funds</Text>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Payment Method Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Payment Method</Text>
              {paymentMethods.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.methodCard,
                    selectedMethod === method.label && styles.methodCardSelected
                  ]}
                  onPress={() => setSelectedMethod(method.label)}
                  disabled={loading}
                >
                  <View style={styles.methodContent}>
                    <Text style={styles.methodLabel}>{method.label}</Text>
                    {selectedMethod === method.label && (
                      <Text style={styles.checkIcon}>✓</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Account Number Display */}
            <View style={styles.section}>
              <Text style={styles.instructionText}>
                Send the desired amount to the account below.
              </Text>
              <View style={styles.accountCard}>
                <View style={styles.accountInfo}>
                  <Text style={styles.accountLabel}>Account Number</Text>
                  <Text style={styles.accountNumber}>
                    {selectedPaymentMethod?.accountNumber}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.copyButton}
                  onPress={handleCopyAccount}
                >
                  <Text style={styles.copyText}>Copy</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Screenshot Upload */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Proof of Payment</Text>
              <Text style={styles.instructionText}>
                Upload a screenshot of your transaction.
              </Text>

              <TouchableOpacity 
                style={styles.uploadArea}
                onPress={handlePickImage}
                disabled={loading}
              >
                {screenshot ? (
                  <View style={styles.imagePreviewContainer}>
                    <Image 
                      source={{ uri: screenshot.uri }} 
                      style={styles.imagePreview}
                    />
                    <Text style={styles.changeImageText}>Tap to change</Text>
                  </View>
                ) : (
                  <>
                    <Text style={styles.uploadIcon}>📷</Text>
                    <Text style={styles.uploadText}>Click to upload screenshot</Text>
                    <Text style={styles.uploadSubtext}>PNG, JPG or GIF (MAX. 5MB)</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Amount Input */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Enter Amount</Text>
              <Text style={styles.instructionText}>
                Minimum deposit amount is 50 AX Coins.
              </Text>
              <View style={styles.amountInputContainer}>
                <TextInput
                  style={styles.amountInput}
                  placeholder="50"
                  placeholderTextColor="#888888"
                  keyboardType="decimal-pad"
                  value={amount}
                  onChangeText={setAmount}
                  editable={!loading}
                />
                <Text style={styles.amountSuffix}>AX Coins</Text>
              </View>
            </View>
          </ScrollView>

          {/* Submit Button */}
          <View style={styles.footer}>
            <TouchableOpacity 
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000000" />
              ) : (
                <Text style={styles.submitButtonText}>Submit Request</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Custom Success Modal */}
      <SuccessModal 
        visible={showSuccessModal} 
        onClose={handleSuccessModalClose}
      />
    </>
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
    marginRight: 48,
  },
  headerSpacer: {
    width: 48,
  },

  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 12,
    lineHeight: 20,
  },

  // Payment Method Cards
  methodCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  methodCardSelected: {
    borderColor: '#00BFFF',
    backgroundColor: 'rgba(0, 191, 255, 0.1)',
  },
  methodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  methodLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#E0E0E0',
  },
  checkIcon: {
    fontSize: 20,
    color: '#00BFFF',
    fontWeight: 'bold',
  },

  // Account Card
  accountCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  accountInfo: {
    flex: 1,
  },
  accountLabel: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 4,
  },
  accountNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  copyButton: {
    backgroundColor: '#00BFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  copyText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Upload Area
  uploadArea: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#333333',
    borderStyle: 'dashed',
  },
  uploadIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#E0E0E0',
    marginBottom: 4,
  },
  uploadSubtext: {
    fontSize: 12,
    color: '#888888',
  },
  imagePreviewContainer: {
    alignItems: 'center',
  },
  imagePreview: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
  },
  changeImageText: {
    fontSize: 14,
    color: '#00BFFF',
    fontWeight: '600',
  },

  // Amount Input
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  amountInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    padding: 0,
  },
  amountSuffix: {
    fontSize: 16,
    fontWeight: '600',
    color: '#888888',
    marginLeft: 8,
  },

  // Footer
  footer: {
    padding: 16,
    paddingBottom: 32,
  },
  submitButton: {
    backgroundColor: '#00FF7F',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },

  // Success Modal Styles
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successContainer: {
    backgroundColor: '#1E1E1E',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 191, 255, 0.3)',
  },
  successIconContainer: {
    marginBottom: 24,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 255, 127, 0.15)',
    borderWidth: 3,
    borderColor: '#00FF7F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIconText: {
    fontSize: 40,
    color: '#00FF7F',
    fontWeight: 'bold',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: '#B0B0B0',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  successInfoBox: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  successInfoIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  successInfoText: {
    flex: 1,
    fontSize: 14,
    color: '#FCD34D',
    lineHeight: 20,
  },
  successButton: {
    backgroundColor: '#00FF7F',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 48,
    width: '100%',
    alignItems: 'center',
  },
  successButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
});

export default DepositModal;