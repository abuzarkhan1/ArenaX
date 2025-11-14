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

export const CustomJoinAlert = ({ visible, onClose, onConfirm, entryFee, loading }) => {
  const [scaleAnim] = useState(new Animated.Value(0));

  React.useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    } else {
      scaleAnim.setValue(0);
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
            {/* Icon */}
            <View style={styles.iconContainer}>
              <Text style={styles.iconText}>🎮</Text>
            </View>

            {/* Title */}
            <Text style={styles.alertTitle}>Join Tournament</Text>

            {/* Message */}
            <View style={styles.messageContainer}>
              <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>Entry Fee</Text>
                <View style={styles.feeValueContainer}>
                  <Text style={styles.feeValue}>{entryFee}</Text>
                  <Text style={styles.feeCurrency}>Coins</Text>
                </View>
              </View>

              <Text style={styles.alertMessage}>
                Are you sure you want to join this tournament?
              </Text>
            </View>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.joinButton}
                onPress={onConfirm}
                activeOpacity={0.8}
                disabled={loading}
              >
                <Text style={styles.joinButtonText}>
                  {loading ? 'Joining...' : 'Join Now'}
                </Text>
              </TouchableOpacity>
            </View>
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
    padding: 28,
  },

  // Icon
  iconContainer: {
    alignSelf: 'center',
    marginBottom: 20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 191, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 40,
  },

  // Title
  alertTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
  },

  // Message
  messageContainer: {
    marginBottom: 28,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#121212',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  feeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#888888',
  },
  feeValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  feeValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#00BFFF',
  },
  feeCurrency: {
    fontSize: 14,
    fontWeight: '500',
    color: '#00BFFF',
  },
  alertMessage: {
    fontSize: 14,
    color: '#E0E0E0',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Buttons
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#121212',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#888888',
  },
  joinButton: {
    flex: 1,
    backgroundColor: '#00BFFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});