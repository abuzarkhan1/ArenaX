import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Mail, User, Phone } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [registerData, setRegisterData] = useState({
    username: "",
    email: "",
    password: "",
    fullName: "",
    phoneNumber: "",
  });
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isRegister) {
        await register({
          username: registerData.username,
          email: registerData.email,
          password: registerData.password,
          fullName: registerData.fullName,
          phoneNumber: registerData.phoneNumber,
        });
        navigate("/dashboard");
      } else {
        await login(formData.email, formData.password);
        navigate("/dashboard");
      }
    } catch (err: any) {
      setError(err);
      setLoading(false);
    }
  };

  if (loading) {
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
            {/* Logo Section */}
            <div className="flex flex-col items-center mb-8">
              <h1 className="text-5xl font-bold text-white mb-2">ArenaX</h1>
              <p className="text-gray-400 text-sm">Admin Panel Login</p>
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

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {isRegister ? (
                <div className="space-y-5">
                  {/* Username */}
                  <div>
                    <label className="block text-gray-300 text-sm font-bold mb-2">
                      Username
                    </label>
                    <div className="relative">
                      <User
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500"
                        size={20}
                      />
                      <input
                        type="text"
                        name="username"
                        value={registerData.username}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            username: e.target.value,
                          })
                        }
                        required
                        className="w-full pl-12 pr-4 py-3.5 rounded-xl text-white placeholder-gray-500 focus:outline-none transition-all"
                        placeholder="adminuser"
                        style={{
                          background: 'rgba(20, 20, 20, 0.6)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          backdropFilter: 'blur(10px)'
                        }}
                      />
                    </div>
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="block text-gray-300 text-sm font-bold mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <User
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500"
                        size={20}
                      />
                      <input
                        type="text"
                        name="fullName"
                        value={registerData.fullName}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            fullName: e.target.value,
                          })
                        }
                        required
                        className="w-full pl-12 pr-4 py-3.5 rounded-xl text-white placeholder-gray-500 focus:outline-none transition-all"
                        placeholder="John Doe"
                        style={{
                          background: 'rgba(20, 20, 20, 0.6)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          backdropFilter: 'blur(10px)'
                        }}
                      />
                    </div>
                  </div>

                  {/* Email */}
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
                        name="email"
                        value={registerData.email}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            email: e.target.value,
                          })
                        }
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
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-gray-300 text-sm font-bold mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500"
                        size={20}
                      />
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={registerData.phoneNumber}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            phoneNumber: e.target.value,
                          })
                        }
                        required
                        className="w-full pl-12 pr-4 py-3.5 rounded-xl text-white placeholder-gray-500 focus:outline-none transition-all"
                        placeholder="+92 300 1234567"
                        style={{
                          background: 'rgba(20, 20, 20, 0.6)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          backdropFilter: 'blur(10px)'
                        }}
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-gray-300 text-sm font-bold mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Lock
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500"
                        size={20}
                      />
                      <input
                        type="password"
                        name="password"
                        value={registerData.password}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            password: e.target.value,
                          })
                        }
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
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Email */}
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
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
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
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-gray-300 text-sm font-bold mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Lock
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500"
                        size={20}
                      />
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
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
                </div>
              )}

              <div className="flex justify-end">
                <Link
                  to="/reset-password-otp"
                  className="text-sm text-gray-400 hover:text-blue-400 transition-colors font-medium"
                >
                  Forgot Password?
                </Link>
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
                    <svg
                      className="animate-spin h-5 w-5 mr-3"
                      viewBox="0 0 24 24"
                    >
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
                    {isRegister ? "Creating account..." : "Authenticating..."}
                  </span>
                ) : isRegister ? (
                  "Create Account"
                ) : (
                  "Sign In"
                )}
              </button>

              {/* Toggle Button */}
              <button
                type="button"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError("");
                }}
                className="w-full text-gray-400 hover:text-blue-400 text-sm font-medium transition-colors"
              >
                {isRegister
                  ? "Have an account? Sign in"
                  : "Don't have an account? Register"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;