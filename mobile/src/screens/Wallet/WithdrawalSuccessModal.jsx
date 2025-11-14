import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

export const WithdrawalSuccessModal = ({ 
  visible, 
  onClose, 
  amount, 
  paymentMethod, 
  accountNumber 
}) => {
  const [scaleAnim] = useState(new Animated.Value(0));
  const [checkAnim] = useState(new Animated.Value(0));

  React.useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.spring(checkAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      checkAnim.setValue(0);
    }
  }, [visible]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />

        <Animated.View
          style={[
            styles.alertContainer,
            { transform: [{ scale: scaleAnim }] }
          ]}
        >
          <View style={styles.alertContent}>
            {/* Success Icon with Animation */}
            <Animated.View
              style={[
                styles.iconContainer,
                { transform: [{ scale: checkAnim }] }
              ]}
            >
              <Text style={styles.iconText}>✓</Text>
            </Animated.View>

            {/* Title */}
            <Text style={styles.alertTitle}>Request Submitted!</Text>

            {/* Message */}
            <View style={styles.messageContainer}>
              <Text style={styles.alertMessage}>
                Your withdrawal request has been submitted successfully. Our admin team will review and process it soon.
              </Text>
            </View>

            {/* Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.closeButtonText}>Got it!</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertContainer: {
    width: width - 60,
    maxWidth: 400,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#1E1E1E',
  },
  alertContent: {
    padding: 32,
  },

  // Icon
  iconContainer: {
    alignSelf: 'center',
    marginBottom: 24,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(0, 255, 127, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 60,
    fontWeight: '900',
    color: '#00FF7F',
  },

  // Title
  alertTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },

  // Message
  messageContainer: {
    marginBottom: 28,
    alignItems: 'center',
  },
  alertMessage: {
    fontSize: 14,
    color: '#E0E0E0',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Button
  closeButton: {
    backgroundColor: '#00FF7F',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
});

export default WithdrawalSuccessModal;