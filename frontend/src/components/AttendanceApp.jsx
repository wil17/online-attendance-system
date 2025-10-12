import EmployeeManagement from './EmployeeManagement';
import React, { useState, useEffect, createContext, useContext } from 'react';
import { 
  Clock, 
  Users, 
  Calendar, 
  TrendingUp,
  MapPin,
  Camera, 
  QrCode, 
  Bell, 
  Settings, 
  Sun, 
  Moon,
  CheckCircle,
  XCircle,
  Award,
  Download,
  Filter,
  Search,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  LogOut,
  AlertCircle,
  Loader
} from 'lucide-react';
import axios from 'axios';

// API Configuration
const API_BASE = 'http://localhost:5000/api';
const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

// Auth Context
const AuthContext = createContext();

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Provider
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('authToken'));

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const response = await api.get('/auth/profile');
          setUser(response.data.user);
        } catch (error) {
          console.error('Failed to get user profile:', error);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [token]);

  const login = async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      const { token: newToken, user: userData } = response.data;
      
      localStorage.setItem('authToken', newToken);
      localStorage.setItem('userData', JSON.stringify(userData));
      
      setToken(newToken);
      setUser(userData);
      
      return { success: true, data: response.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      const { token: newToken, user: newUser } = response.data;
      
      localStorage.setItem('authToken', newToken);
      localStorage.setItem('userData', JSON.stringify(newUser));
      
      setToken(newToken);
      setUser(newUser);
      
      return { success: true, data: response.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isHR: user?.role === 'hr',
    isManager: user?.role === 'manager',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Login Component
const LoginForm = ({ onToggleMode }) => {
  const [formData, setFormData] = useState({
    email: 'admin@attendancehub.com',
    password: 'password123'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(formData);
    
    if (!result.success) {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to AttendanceHub</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <Loader className="h-5 w-5 animate-spin" />
                <span>Signing in...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <LogIn className="h-5 w-5" />
                <span>Sign In</span>
              </div>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <button
              onClick={onToggleMode}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Sign up
            </button>
          </p>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Demo credentials: admin@attendancehub.com / password123
          </p>
        </div>
      </div>
    </div>
  );
};

// Register Component
const RegisterForm = ({ onToggleMode }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'employee'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    const result = await register({
      email: formData.email,
      password: formData.password,
      role: formData.role
    });
    
    if (!result.success) {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p className="text-gray-600">Join AttendanceHub today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="hr">HR</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Create a password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Confirm your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <Loader className="h-5 w-5 animate-spin" />
                <span>Creating account...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <UserPlus className="h-5 w-5" />
                <span>Create Account</span>
              </div>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <button
              onClick={onToggleMode}
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

// Complete Dashboard Component with ALL Features
const Dashboard = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [location, setLocation] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [currentAction, setCurrentAction] = useState('');
  const [locationInfo, setLocationInfo] = useState(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchTodayAttendance();
    getCurrentLocation();
  }, []);

  const fetchTodayAttendance = async () => {
    try {
      const response = await api.get('/attendance/today');
      setAttendance(response.data.attendance);
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          setLocation({
            latitude: -6.2088,
            longitude: 106.8456
          });
        }
      );
    }
  };

  // Calculate distance between two coordinates
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + 
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  };

  // Location Check Handler
  const handleLocationCheck = async () => {
    setLoading(true);
    setCurrentAction('location');
    setError('');

    if (!navigator.geolocation) {
      setError('Geolocation tidak didukung browser ini');
      setLoading(false);
      return;
    }

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const locationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
      };

      // Mock office location (Jakarta)
      const officeLocation = {
        lat: -6.2088,
        lng: 106.8456
      };

      const distance = calculateDistance(
        position.coords.latitude,
        position.coords.longitude,
        officeLocation.lat,
        officeLocation.lng
      );

      const isInOffice = distance <= 0.1; // 100 meters
      const distanceText = isInOffice 
        ? 'Anda berada di kantor' 
        : `Anda berada ${(distance * 1000).toFixed(0)}m dari kantor`;

      setLocationInfo({
        ...locationData,
        distance: distance,
        isInOffice: isInOffice,
        message: distanceText
      });

      alert(`Lokasi berhasil dicheck: ${distanceText}`);
    } catch (error) {
      setError('Tidak bisa mendapatkan lokasi. Periksa pengaturan GPS.');
      alert('Gagal mendapatkan lokasi: ' + error.message);
    } finally {
      setLoading(false);
      setCurrentAction('');
    }
  };

  const handleCheckIn = async () => {
    if (!location) {
      setError('Location not available. Please enable GPS.');
      return;
    }

    setLoading(true);
    setCurrentAction('checkin');
    setError('');

    try {
      const response = await api.post('/attendance/check-in', {
        latitude: location.latitude,
        longitude: location.longitude,
        location: 'Jakarta Office',
        method: 'manual',
        notes: 'Check in via web app'
      });

      setAttendance({
        id: response.data.attendanceId,
        check_in_time: response.data.checkInTime,
        check_out_time: null,
        status: response.data.status
      });

      alert(`Check in successful! Status: ${response.data.status}`);
    } catch (error) {
      const message = error.response?.data?.message || 'Check in failed';
      setError(message);
      alert(`Check in failed: ${message}`);
    }

    setLoading(false);
    setCurrentAction('');
  };

  const handleCheckOut = async () => {
    if (!location) {
      setError('Location not available. Please enable GPS.');
      return;
    }

    setLoading(true);
    setCurrentAction('checkout');
    setError('');

    try {
      const response = await api.post('/attendance/check-out', {
        latitude: location.latitude,
        longitude: location.longitude,
        location: 'Jakarta Office',
        method: 'manual',
        notes: 'Check out via web app'
      });

      setAttendance(prev => ({
        ...prev,
        check_out_time: response.data.checkOutTime,
        work_hours: response.data.workHours,
        overtime_hours: response.data.overtimeHours
      }));

      alert(`Check out successful! Work hours: ${response.data.workHours} hours`);
    } catch (error) {
      const message = error.response?.data?.message || 'Check out failed';
      setError(message);
      alert(`Check out failed: ${message}`);
    }

    setLoading(false);
    setCurrentAction('');
  };

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  const isCheckedIn = attendance && attendance.check_in_time && !attendance.check_out_time;
  const isCheckedOut = attendance && attendance.check_out_time;

  const stats = [
    { title: 'Total Karyawan', value: '248', change: '+12%', icon: Users, color: 'blue' },
    { title: 'Hadir Hari Ini', value: '186', change: '+5%', icon: CheckCircle, color: 'green' },
    { title: 'Tidak Hadir', value: '12', change: '-8%', icon: XCircle, color: 'red' },
    { title: 'Rata-rata Kehadiran', value: '94.2%', change: '+2.1%', icon: TrendingUp, color: 'purple' }
  ];

  const recentActivities = [
    { name: 'Ahmad Rizki', action: 'Check In', time: '08:15 AM', status: 'ontime' },
    { name: 'Sarah Dewi', action: 'Check Out', time: '05:30 PM', status: 'ontime' },
    { name: 'Budi Santoso', action: 'Check In', time: '08:45 AM', status: 'late' },
    { name: 'Maya Sari', action: 'Check In', time: '07:50 AM', status: 'early' }
  ];

  const getStatusColor = (status) => {
    switch(status) {
      case 'ontime': return 'text-green-500';
      case 'late': return 'text-red-500';
      case 'early': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  const getStatColor = (color) => {
    const colors = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      red: 'from-red-500 to-red-600',
      purple: 'from-purple-500 to-purple-600'
    };
    return colors[color];
  };

  return (
    <div className={`min-h-screen transition-all duration-300 ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b transition-colors duration-200`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  AttendanceHub
                </h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {currentTime.toLocaleString('id-ID', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </div>
              
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              
              <button className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}>
                <Bell className="h-5 w-5" />
              </button>

              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {user?.firstName?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
                </div>
                <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {user?.firstName || user?.email}
                </span>
              </div>
              
              <button
                onClick={logout}
                className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Menu - Only for Admin/HR */}
      {user && (user.role === 'admin' || user.role === 'hr') && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="flex space-x-4">
            <button
              onClick={() => setCurrentPage('dashboard')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentPage === 'dashboard'
                  ? 'bg-blue-500 text-white'
                  : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setCurrentPage('employees')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentPage === 'employees'
                  ? 'bg-blue-500 text-white'
                  : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Employee Management
            </button>
          </div>
        </div>
      )}

      {/* Conditional Page Rendering */}
      {currentPage === 'dashboard' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {/* Quick Actions */}
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button 
                onClick={isCheckedIn ? handleCheckOut : handleCheckIn}
                disabled={loading && (currentAction === 'checkin' || currentAction === 'checkout')}
                className={`p-6 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isCheckedIn 
                    ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700' 
                    : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                } text-white`}
              >
                {loading && (currentAction === 'checkin' || currentAction === 'checkout') ? (
                  <Loader className="h-8 w-8 mb-2 animate-spin" />
                ) : (
                  <Clock className="h-8 w-8 mb-2" />
                )}
                <h3 className="font-semibold text-lg">
                  {loading && (currentAction === 'checkin' || currentAction === 'checkout') 
                    ? 'Processing...' 
                    : (isCheckedIn ? 'Check Out' : 'Check In')
                  }
                </h3>
                <p className="text-sm opacity-90">
                  {isCheckedIn ? 'Akhiri hari kerja' : 'Mulai hari kerja'}
                </p>
              </button>

              <button className="p-6 rounded-xl shadow-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white transition-all duration-200 transform hover:scale-105">
                <QrCode className="h-8 w-8 mb-2" />
                <h3 className="font-semibold text-lg">QR Scan</h3>
                <p className="text-sm opacity-90">Scan kode QR</p>
              </button>

              <button className="p-6 rounded-xl shadow-lg bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white transition-all duration-200 transform hover:scale-105">
                <Camera className="h-8 w-8 mb-2" />
                <h3 className="font-semibold text-lg">Face Scan</h3>
                <p className="text-sm opacity-90">Verifikasi wajah</p>
              </button>

              <button 
                onClick={handleLocationCheck}
                disabled={loading && currentAction === 'location'}
                className="p-6 rounded-xl shadow-lg bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white transition-all duration-200 transform hover:scale-105 disabled:opacity-50"
              >
                {loading && currentAction === 'location' ? (
                  <Loader className="h-8 w-8 mb-2 animate-spin" />
                ) : (
                  <MapPin className="h-8 w-8 mb-2" />
                )}
                <h3 className="font-semibold text-lg">Location</h3>
                <p className="text-sm opacity-90">Check lokasi</p>
              </button>
            </div>
          </div>

          {/* Location Info Display */}
          {locationInfo && (
            <div className={`mb-8 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
              <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Informasi Lokasi
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Status</p>
                  <p className={`text-lg font-semibold ${locationInfo.isInOffice ? 'text-green-500' : 'text-orange-500'}`}>
                    {locationInfo.isInOffice ? 'Di Kantor' : 'Di Luar Kantor'}
                  </p>
                </div>
                <div>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Jarak</p>
                  <p className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {locationInfo.isInOffice ? '0m' : `${(locationInfo.distance * 1000).toFixed(0)}m`}
                  </p>
                </div>
                <div>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Akurasi</p>
                  <p className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {locationInfo.accuracy?.toFixed(0)}m
                  </p>
                </div>
                <div>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Pesan</p>
                  <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {locationInfo.message}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Leave Request Section - Employee Only */}
          {user.role === 'employee' && (
            <div className="mb-8">
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
                <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Quick Actions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button 
                    onClick={() => setShowLeaveModal(true)}
                    className="p-4 border-2 border-dashed border-purple-300 rounded-lg hover:bg-purple-50 transition-colors"
                  >
                    <Calendar className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                    <p className="text-purple-600 font-medium">Request Leave</p>
                  </button>
                  <button className="p-4 border-2 border-dashed border-blue-300 rounded-lg hover:bg-blue-50 transition-colors">
                    <Clock className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                    <p className="text-blue-600 font-medium">View History</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Manager Approval Section */}
          {(user.role === 'manager' || user.role === 'hr' || user.role === 'admin') && (
            <div className="mb-8">
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
                <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Management Tools
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <h4 className="font-medium text-yellow-800">Pending Approvals</h4>
                    <p className="text-2xl font-bold text-yellow-600">3</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-800">Approved Today</h4>
                    <p className="text-2xl font-bold text-green-600">5</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-800">Team Attendance</h4>
                    <p className="text-2xl font-bold text-blue-600">92%</p>
                  </div>
                </div>

                {/* Pending Approvals List */}
                <div className="space-y-3">
                  <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Pending Leave Requests
                  </h4>
                  <div className="space-y-2">
                    {[
                      { name: 'John Doe', type: 'Annual Leave', days: '3 days', date: 'Oct 5-7, 2024' },
                      { name: 'Jane Smith', type: 'Sick Leave', days: '1 day', date: 'Oct 8, 2024' },
                      { name: 'Mike Johnson', type: 'Personal Leave', days: '2 days', date: 'Oct 10-11, 2024' }
                    ].map((request, index) => (
                      <div key={index} className={`flex items-center justify-between p-3 border rounded-lg ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                        <div>
                          <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {request.name} - {request.type}
                          </p>
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {request.days} ({request.date})
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition-colors">
                            Approve
                          </button>
                          <button className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors">
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Attendance Status */}
          {attendance && (
            <div className={`mb-8 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
              <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Status Kehadiran Hari Ini
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Check In</p>
                  <p className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {attendance.check_in_time ? new Date(attendance.check_in_time).toLocaleTimeString() : '-'}
                  </p>
                </div>
                <div>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Check Out</p>
                  <p className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {attendance.check_out_time ? new Date(attendance.check_out_time).toLocaleTimeString() : '-'}
                  </p>
                </div>
                <div>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Work Hours</p>
                  <p className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {attendance.work_hours || '0'} hours
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6 transition-all duration-200 hover:shadow-xl`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {stat.title}
                      </p>
                      <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mt-1`}>
                        {stat.value}
                      </p>
                      <p className="text-sm text-green-500 mt-1">
                        {stat.change} dari bulan lalu
                      </p>
                    </div>
                    <div className={`p-3 rounded-lg bg-gradient-to-r ${getStatColor(stat.color)}`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activities */}
            <div className={`lg:col-span-2 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Aktivitas Terbaru
                </h2>
                <div className="flex space-x-2">
                  <button className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}>
                    <Filter className="h-4 w-4" />
                  </button>
                  <button className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}>
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div key={index} className={`flex items-center justify-between p-4 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {activity.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {activity.name}
                        </p>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {activity.action}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${getStatusColor(activity.status)}`}>
                        {activity.time}
                      </p>
                      <p className={`text-xs capitalize ${getStatusColor(activity.status)}`}>
                        {activity.status === 'ontime' ? 'Tepat Waktu' : 
                         activity.status === 'late' ? 'Terlambat' : 'Lebih Awal'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Info Panel */}
            <div className="space-y-6">
              {/* Calendar Widget */}
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
                <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Kalendar
                </h3>
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                    <div key={index} className={`text-center text-xs font-medium py-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 35 }, (_, i) => {
                    const day = i - 6;
                    const isToday = day === new Date().getDate();
                    return (
                      <button
                        key={i}
                        className={`text-center text-sm py-2 rounded transition-colors ${
                          day > 0 && day <= 30
                            ? isToday
                              ? 'bg-blue-500 text-white'
                              : darkMode
                              ? 'text-gray-300 hover:bg-gray-700'
                              : 'text-gray-700 hover:bg-gray-100'
                            : 'text-transparent'
                        }`}
                      >
                        {day > 0 && day <= 30 ? day : ''}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Achievement Badge */}
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg">
                    <Award className="h-5 w-5 text-white" />
                  </div>
                  <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Achievement
                  </h3>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Award className="h-8 w-8 text-white" />
                  </div>
                  <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Perfect Attendance
                  </h4>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    30 hari berturut-turut hadir tepat waktu!
                  </p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
                <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Status Hari Ini
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Jam Masuk
                    </span>
                    <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {attendance?.check_in_time ? new Date(attendance.check_in_time).toLocaleTimeString() : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Jam Keluar
                    </span>
                    <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {attendance?.check_out_time ? new Date(attendance.check_out_time).toLocaleTimeString() : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Total Jam
                    </span>
                    <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {attendance?.work_hours || '0'} hours
                    </span>
                  </div>
                  {locationInfo && (
                    <div className="flex justify-between">
                      <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Status Lokasi
                      </span>
                      <span className={`text-sm font-medium ${locationInfo.isInOffice ? 'text-green-500' : 'text-orange-500'}`}>
                        {locationInfo.isInOffice ? 'Di Kantor' : 'Di Luar'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Employee Management Page */}
      {currentPage === 'employees' && (
        <EmployeeManagement darkMode={darkMode} user={user} />
      )}

      {/* Leave Request Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl p-6 w-full max-w-md mx-4`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Request Leave
              </h3>
              <button
                onClick={() => setShowLeaveModal(false)}
                className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            
            <form className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Leave Type
                </label>
                <select className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                  <option value="">Select leave type</option>
                  <option value="annual">Annual Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="personal">Personal Leave</option>
                  <option value="emergency">Emergency Leave</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Start Date
                  </label>
                  <input 
                    type="date" 
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    End Date
                  </label>
                  <input 
                    type="date" 
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  />
                </div>
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Reason
                </label>
                <textarea 
                  rows="3"
                  placeholder="Please provide a reason for your leave request..."
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                  Submit Request
                </button>
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  className={`flex-1 py-2 px-4 rounded-lg transition-colors font-medium ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Main App Component
const AttendanceApp = () => {
  const [isLoginMode, setIsLoginMode] = useState(true);

  return (
    <AuthProvider>
      <AuthContent 
        isLoginMode={isLoginMode} 
        setIsLoginMode={setIsLoginMode} 
      />
    </AuthProvider>
  );
};

const AuthContent = ({ isLoginMode, setIsLoginMode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader className="h-8 w-8 animate-spin text-blue-500" />
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return isLoginMode ? (
      <LoginForm onToggleMode={() => setIsLoginMode(false)} />
    ) : (
      <RegisterForm onToggleMode={() => setIsLoginMode(true)} />
    );
  }

  return <Dashboard />;
};

export default AttendanceApp;