import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import WithdrawalSuccessModal from './WithdrawalSuccessModal';

const PAYMENT_METHODS = [
  {
    id: 'easypaisa',
    name: 'Easypaisa',
    icon: '💳',
    placeholder: '03XXXXXXXXX'
  },
  {
    id: 'jazzcash',
    name: 'JazzCash',
    icon: '📱',
    placeholder: '03XXXXXXXXX'
  },
  {
    id: 'bank',
    name: 'Bank Transfer',
    icon: '🏦',
    placeholder: 'PKXX XXXX XXXX XXXX XXXX'
  }
];

const WithdrawalModal = ({ visible, onClose, onSubmit, currentBalance }) => {
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState(PAYMENT_METHODS[0]);
  const [accountNumber, setAccountNumber] = useState('');
  const [loading, setLoading] = useState(false);

  // Password confirmation state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);

  // State for success modal
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState({});

  const resetForm = () => {
    setAmount('');
    setSelectedMethod(PAYMENT_METHODS[0]);
    setAccountNumber('');
    setPassword('');
    setPasswordVisible(false);
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  const handleMethodSelect = (method) => {
    setSelectedMethod(method);
    setAccountNumber('');
  };

  const handleSubmit = async () => {
    const withdrawalAmount = parseFloat(amount);

    // Validations
    if (!amount || withdrawalAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    if (withdrawalAmount < 100) {
      Alert.alert('Invalid Amount', 'Minimum withdrawal amount is 100 AX coins');
      return;
    }

    if (withdrawalAmount > currentBalance) {
      Alert.alert('Insufficient Balance', `You have ${currentBalance} AX coins available`);
      return;
    }

    if (!selectedMethod) {
      Alert.alert('Payment Method Required', 'Please select a payment method');
      return;
    }

    if (!accountNumber.trim()) {
      Alert.alert('Account Number Required', 'Please enter your account number');
      return;
    }

    // Validate account number based on payment method
    if (selectedMethod.id === 'easypaisa' || selectedMethod.id === 'jazzcash') {
      const phoneRegex = /^03\d{9}$/;
      if (!phoneRegex.test(accountNumber.replace(/\s/g, ''))) {
        Alert.alert('Invalid Account', 'Please enter a valid Pakistani mobile number (03XXXXXXXXX)');
        return;
      }
    }

    // All validations passed, show password confirmation modal
    setShowPasswordModal(true);
  };

  const handlePasswordSubmit = async () => {
    if (!password.trim()) {
      Alert.alert('Password Required', 'Please enter your password to confirm withdrawal');
      return;
    }

    setLoading(true);
    try {
      const withdrawalAmount = parseFloat(amount);
      
      await onSubmit({
        amount: withdrawalAmount,
        paymentMethod: selectedMethod.name,
        accountNumber: accountNumber.trim(),
        password: password.trim()  // Include password in the request
      });

      // Store data for success modal
      setSuccessData({
        amount: amount,
        paymentMethod: selectedMethod.name,
        accountNumber: accountNumber.trim()
      });

      // Close modals and show success
      setShowPasswordModal(false);
      resetForm();
      onClose();
      setShowSuccessModal(true);

    } catch (error) {
      console.error('Withdrawal submission error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to submit withdrawal request';
      
      // If password is incorrect, keep password modal open
      if (errorMessage.toLowerCase().includes('password')) {
        Alert.alert('Invalid Password', errorMessage);
        setPassword(''); // Clear password field
      } else {
        Alert.alert('Error', errorMessage);
        setShowPasswordModal(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordModalClose = () => {
    if (!loading) {
      setPassword('');
      setPasswordVisible(false);
      setShowPasswordModal(false);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    setSuccessData({});
  };

  return (
    <>
      {/* Main Withdrawal Modal */}
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
            <Text style={styles.headerTitle}>Withdraw Funds</Text>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Balance Display */}
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Available Balance</Text>
              <View style={styles.balanceRow}>
                <Text style={styles.coinIcon}>🪙</Text>
                <Text style={styles.balanceAmount}>{currentBalance} Coins</Text>
              </View>
              <Text style={styles.balanceSubtext}>Minimum withdrawal: 100 AX Coins</Text>
            </View>

            {/* Payment Method Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Payment Method</Text>
              {PAYMENT_METHODS.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.methodCard,
                    selectedMethod?.id === method.id && styles.methodCardSelected
                  ]}
                  onPress={() => handleMethodSelect(method)}
                  disabled={loading}
                >
                  <View style={styles.methodContent}>
                    <View style={styles.methodLeft}>
                      <Text style={styles.methodIcon}>{method.icon}</Text>
                      <Text style={styles.methodLabel}>{method.name}</Text>
                    </View>
                    {selectedMethod?.id === method.id && (
                      <Text style={styles.checkIcon}>✓</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Account Number Input */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Account Details</Text>
              <Text style={styles.instructionText}>
                Enter your {selectedMethod?.name} account number.
              </Text>
              
              <View style={styles.accountInputContainer}>
                <Text style={styles.accountIcon}>{selectedMethod?.icon}</Text>
                <TextInput
                  style={styles.accountInput}
                  placeholder={selectedMethod?.placeholder}
                  placeholderTextColor="#888888"
                  keyboardType={selectedMethod?.id === 'bank' ? 'default' : 'phone-pad'}
                  value={accountNumber}
                  onChangeText={setAccountNumber}
                  maxLength={selectedMethod?.id === 'bank' ? 30 : 11}
                  editable={!loading}
                />
              </View>
            </View>

            {/* Amount Input */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Withdrawal Amount</Text>
              <Text style={styles.instructionText}>
                Enter the amount you want to withdraw (Min: 100 AX Coins).
              </Text>

              <View style={styles.amountInputContainer}>
                <TextInput
                  style={styles.amountInput}
                  placeholder="100"
                  placeholderTextColor="#888888"
                  keyboardType="decimal-pad"
                  value={amount}
                  onChangeText={setAmount}
                  editable={!loading}
                />
                <Text style={styles.amountSuffix}>AX Coins</Text>
              </View>
            </View>

            {/* Process Info */}
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>📋 What happens next?</Text>
              <Text style={styles.infoStep}>
                • You'll be asked to confirm with your password
              </Text>
              <Text style={styles.infoStep}>
                • Your request will be reviewed by our admin team
              </Text>
              <Text style={styles.infoStep}>
                • Once approved, money will be sent to your account
              </Text>
              <Text style={styles.infoStep}>
                • You'll receive an email confirmation
              </Text>
            </View>
          </ScrollView>

          {/* Submit Button */}
          <View style={styles.footer}>
            <TouchableOpacity 
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Password Confirmation Modal */}
      <Modal
        visible={showPasswordModal}
        animationType="fade"
        transparent={true}
        onRequestClose={handlePasswordModalClose}
      >
        <View style={styles.passwordModalOverlay}>
          <View style={styles.passwordModalContainer}>
            <View style={styles.passwordModalHeader}>
              <Text style={styles.passwordModalTitle}>🔒 Confirm Withdrawal</Text>
              <TouchableOpacity 
                onPress={handlePasswordModalClose}
                disabled={loading}
                style={styles.passwordModalClose}
              >
                <Text style={styles.passwordModalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.passwordModalDescription}>
              For your security, please enter your account password to confirm this withdrawal request.
            </Text>

            <View style={styles.passwordSummary}>
              <Text style={styles.passwordSummaryLabel}>Amount:</Text>
              <Text style={styles.passwordSummaryValue}>{amount} AX Coins</Text>
            </View>

            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Enter your password"
                placeholderTextColor="#888888"
                secureTextEntry={!passwordVisible}
                value={password}
                onChangeText={setPassword}
                editable={!loading}
                autoFocus={true}
              />
              <TouchableOpacity 
                onPress={() => setPasswordVisible(!passwordVisible)}
                style={styles.passwordToggle}
                disabled={loading}
              >
                <Text style={styles.passwordToggleText}>
                  {passwordVisible ? '👁️' : '👁️‍🗨️'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.passwordModalButtons}>
              <TouchableOpacity 
                style={styles.passwordCancelButton}
                onPress={handlePasswordModalClose}
                disabled={loading}
              >
                <Text style={styles.passwordCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.passwordConfirmButton, loading && styles.passwordConfirmButtonDisabled]}
                onPress={handlePasswordSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.passwordConfirmText}>Confirm</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <WithdrawalSuccessModal
        visible={showSuccessModal}
        onClose={handleSuccessModalClose}
        amount={successData.amount}
        paymentMethod={successData.paymentMethod}
        accountNumber={successData.accountNumber}
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

  // Balance Card
  balanceCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 8,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  coinIcon: {
    fontSize: 32,
    marginRight: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  balanceSubtext: {
    fontSize: 12,
    color: '#888888',
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
  methodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  methodIcon: {
    fontSize: 24,
    marginRight: 12,
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

  // Account Input
  accountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  accountIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  accountInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    padding: 0,
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

  // Info Box
  infoBox: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E0E0E0',
    marginBottom: 12,
  },
  infoStep: {
    fontSize: 14,
    color: '#888888',
    lineHeight: 22,
  },

  // Footer
  footer: {
    padding: 16,
    paddingBottom: 32,
  },
  submitButton: {
    backgroundColor: '#00BFFF',
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
    color: '#FFFFFF',
  },

  // Password Modal
  passwordModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  passwordModalContainer: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#00BFFF',
  },
  passwordModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  passwordModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  passwordModalClose: {
    padding: 4,
  },
  passwordModalCloseText: {
    fontSize: 24,
    color: '#888888',
    fontWeight: '300',
  },
  passwordModalDescription: {
    fontSize: 14,
    color: '#888888',
    lineHeight: 20,
    marginBottom: 20,
  },
  passwordSummary: {
    backgroundColor: '#121212',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  passwordSummaryLabel: {
    fontSize: 14,
    color: '#888888',
  },
  passwordSummaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00BFFF',
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#333333',
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    padding: 0,
  },
  passwordToggle: {
    padding: 4,
  },
  passwordToggleText: {
    fontSize: 20,
  },
  passwordModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  passwordCancelButton: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  passwordCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#888888',
  },
  passwordConfirmButton: {
    flex: 1,
    backgroundColor: '#00BFFF',
    borderRadius: 8,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  passwordConfirmButtonDisabled: {
    opacity: 0.5,
  },
  passwordConfirmText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default WithdrawalModal;