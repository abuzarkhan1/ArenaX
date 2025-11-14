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
  Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

const LoginScreen = ({ navigation }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
    } catch (error) {
      Alert.alert('Login Failed', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Logo Section */}
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>ArenaX</Text>
              <Text style={styles.logoSubtext}>Welcome back, Champion!</Text>
            </View>

            {/* Form Card */}
            <View style={styles.formCard}>
              <View style={styles.formContent}>
                {/* Email Input */}
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

                {/* Password Input */}
                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>Password</Text>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('ResetPassword')}
                      disabled={loading}
                    >
                      <Text style={styles.forgotPassword}>Forgot?</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.inputWrapper}>
                    <Text style={styles.inputIcon}>🔒</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="••••••••"
                      placeholderTextColor="#888888"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      editable={!loading}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeButton}
                      disabled={loading}
                    >
                      <Text style={styles.eyeIcon}>
                        {showPassword ? '👁️' : '👁️‍🗨️'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Login Button */}
                <TouchableOpacity
                  style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                  onPress={handleLogin}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.loginText}>Sign In</Text>
                  )}
                </TouchableOpacity>

                {/* Register Link */}
                <TouchableOpacity
                  style={styles.registerLink}
                  onPress={() => navigation.navigate('Register')}
                  disabled={loading}
                >
                  <Text style={styles.registerText}>
                    Don't have an account? <Text style={styles.registerTextBold}>Register</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },

  // Logo Section
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -1,
    marginBottom: 8,
  },
  logoSubtext: {
    fontSize: 14,
    color: '#888888',
    fontWeight: '500',
  },

  // Form Card
  formCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    overflow: 'hidden',
  },
  formContent: {
    padding: 24,
  },

  // Input Group
  inputGroup: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    color: '#E0E0E0',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  forgotPassword: {
    color: '#00BFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    borderRadius: 12,
    paddingHorizontal: 16,
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
    paddingVertical: 14,
  },
  eyeButton: {
    padding: 4,
    marginLeft: 8,
  },
  eyeIcon: {
    fontSize: 20,
  },

  // Login Button
  loginButton: {
    backgroundColor: '#00BFFF',
    marginTop: 10,
    marginBottom: 20,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonDisabled: {
    backgroundColor: '#2A2A2A',
    opacity: 0.5,
  },
  loginText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  // Register Link
  registerLink: {
    alignItems: 'center',
  },
  registerText: {
    color: '#888888',
    fontSize: 14,
    fontWeight: '500',
  },
  registerTextBold: {
    color: '#00BFFF',
    fontWeight: '700',
  },
});

export default LoginScreen;