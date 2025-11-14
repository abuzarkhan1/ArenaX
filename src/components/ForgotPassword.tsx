import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, KeyRound, ArrowLeft } from 'lucide-react';
import axios from 'axios';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState<'email' | 'otp' | 'success'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:5000/api/auth/send-otp', { email });
      
      if (response.data.success) {
        setSuccessMessage('OTP sent to your email successfully!');
        setStep('otp');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/auth/reset-password-otp', {
        email,
        otp,
        newPassword
      });

      if (response.data.success) {
        setSuccessMessage('Password reset successfully!');
        setStep('success');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && step === 'email') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#121212' }}>
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2" style={{ borderColor: '#00BFFF' }}></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#121212' }}>
      <div className="w-full max-w-md">
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: 'rgba(30, 30, 30, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
          }}
        >
          <div className="p-8">
            {/* Back Button */}
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-colors mb-6"
            >
              <ArrowLeft size={20} />
              <span className="text-sm font-medium">Back to Login</span>
            </button>

            {/* Logo Section */}
            <div className="flex flex-col items-center mb-8">
              <h1 className="text-5xl font-bold text-white mb-2">ArenaX</h1>
              <p className="text-gray-400 text-sm">Reset Your Password</p>
            </div>

            {/* Error Message */}
            {error && (
              <div
                className="mb-6 p-4 rounded-xl"
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)'
                }}
              >
                <p className="text-red-400 text-sm text-center font-medium">
                  {error}
                </p>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div
                className="mb-6 p-4 rounded-xl"
                style={{
                  background: 'rgba(34, 197, 94, 0.1)',
                  border: '1px solid rgba(34, 197, 94, 0.3)'
                }}
              >
                <p className="text-green-400 text-sm text-center font-medium">
                  {successMessage}
                </p>
              </div>
            )}

            {/* Forms */}
            {step === 'email' && (
              <form onSubmit={handleSendOtp} className="space-y-5">
                <div>
                  <label className="block text-gray-300 text-sm font-bold mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500"
                      size={20}
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(''); }}
                      required
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl text-white placeholder-gray-500 focus:outline-none transition-all"
                      placeholder="admin@arenax.com"
                      style={{
                        background: 'rgba(20, 20, 20, 0.6)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(10px)'
                      }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    We'll send a 6-digit OTP to your email address
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  style={{
                    background: '#00BFFF',
                    boxShadow: '0 4px 12px rgba(0, 191, 255, 0.3)'
                  }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Sending OTP...
                    </span>
                  ) : (
                    'Send OTP'
                  )}
                </button>
              </form>
            )}

            {step === 'otp' && (
              <form onSubmit={handleResetPassword} className="space-y-5">
                <div>
                  <label className="block text-gray-300 text-sm font-bold mb-2">
                    OTP Code
                  </label>
                  <div className="relative">
                    <KeyRound
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500"
                      size={20}
                    />
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => { setOtp(e.target.value); setError(''); }}
                      required
                      maxLength={6}
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl text-white placeholder-gray-500 focus:outline-none transition-all"
                      placeholder="Enter 6-digit OTP"
                      style={{
                        background: 'rgba(20, 20, 20, 0.6)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(10px)'
                      }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Check your email for the verification code
                  </p>
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-bold mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500"
                      size={20}
                    />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                      required
                      minLength={6}
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl text-white placeholder-gray-500 focus:outline-none transition-all"
                      placeholder="••••••••"
                      style={{
                        background: 'rgba(20, 20, 20, 0.6)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(10px)'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-bold mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500"
                      size={20}
                    />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                      required
                      minLength={6}
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl text-white placeholder-gray-500 focus:outline-none transition-all"
                      placeholder="••••••••"
                      style={{
                        background: 'rgba(20, 20, 20, 0.6)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(10px)'
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  style={{
                    background: '#00BFFF',
                    boxShadow: '0 4px 12px rgba(0, 191, 255, 0.3)'
                  }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Resetting Password...
                    </span>
                  ) : (
                    'Reset Password'
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="w-full text-gray-400 hover:text-blue-400 text-sm font-medium transition-colors"
                >
                  Didn't receive OTP? Try again
                </button>
              </form>
            )}

            {step === 'success' && (
              <div className="text-center py-8">
                <div
                  className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
                  style={{
                    background: '#00BFFF',
                    boxShadow: '0 0 30px rgba(0, 191, 255, 0.5)'
                  }}
                >
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Password Reset Successful!</h3>
                <p className="text-gray-400">Redirecting to login page...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;