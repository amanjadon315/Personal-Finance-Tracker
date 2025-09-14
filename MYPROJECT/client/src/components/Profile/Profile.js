import React, { useState, useEffect } from 'react';
import { useAuth } from '../../App';
import { authAPI } from '../../services/api';
import { User, Mail, Phone, Save, Edit3, Camera, Shield } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';

const Profile = ({ showNotification, onError }) => {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    preferences: {
      currency: user?.preferences?.currency || 'USD',
      dateFormat: user?.preferences?.dateFormat || 'MM/DD/YYYY',
      theme: user?.preferences?.theme || 'light'
    }
  });
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [errors, setErrors] = useState({});

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        preferences: {
          currency: user.preferences?.currency || 'USD',
          dateFormat: user.preferences?.dateFormat || 'MM/DD/YYYY',
          theme: user.preferences?.theme || 'light'
        }
      });
    }
  }, [user]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('preferences.')) {
      const prefKey = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          [prefKey]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Invalid phone number format';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const updateData = {
        name: formData.name.trim(),
        phone: formData.phone.replace(/\s/g, ''),
        preferences: formData.preferences
      };

      const response = await authAPI.updateProfile(updateData);
      
      // Update user in context
      updateUser(response.data.user);
      
      setEditing(false);
      showNotification('Profile updated successfully!', 'success');
      
    } catch (error) {
      console.error('Profile update error:', error);
      
      if (error.details) {
        showNotification(error.details, 'error');
      } else {
        showNotification('Failed to update profile. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel editing
  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        preferences: {
          currency: user.preferences?.currency || 'USD',
          dateFormat: user.preferences?.dateFormat || 'MM/DD/YYYY',
          theme: user.preferences?.theme || 'light'
        }
      });
    }
    setErrors({});
    setEditing(false);
  };

  // Get user initials for avatar
  const getUserInitials = (name) => {
    return name
      ?.split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-2">
            Manage your account information and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              {/* Avatar Section */}
              <div className="text-center mb-6">
                <div className="relative inline-block">
                  <div className="bg-indigo-600 text-white w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold">
                    {getUserInitials(user?.name)}
                  </div>
                  <button className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-md border hover:bg-gray-50 transition-colors">
                    <Camera size={16} className="text-gray-600" />
                  </button>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mt-4">
                  {user?.name}
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  {user?.email}
                </p>
                <div className="mt-4 flex items-center justify-center">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <Shield size={14} className="mr-1" />
                    Verified
                  </span>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Member since</span>
                  <span className="text-sm font-medium">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Last login</span>
                  <span className="text-sm font-medium">
                    {user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-600">Account status</span>
                  <span className="text-sm font-medium text-green-600">Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Account Information
                </h3>
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    <Edit3 size={16} />
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancel}
                      disabled={loading}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 text-gray-400" size={20} />
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        disabled={!editing || loading}
                        className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                          errors.name ? 'border-red-500' : 'border-gray-300'
                        } ${!editing ? 'bg-gray-50' : ''}`}
                        placeholder="Enter your full name"
                      />
                    </div>
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                    )}
                  </div>

                  {/* Email (Read-only) */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        disabled
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Email cannot be changed. Contact support if needed.
                    </p>
                  </div>

                  {/* Phone */}
                  <div className="md:col-span-2">
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 text-gray-400" size={20} />
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        disabled={!editing || loading}
                        className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                          errors.phone ? 'border-red-500' : 'border-gray-300'
                        } ${!editing ? 'bg-gray-50' : ''}`}
                        placeholder="Enter your phone number"
                      />
                    </div>
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                    )}
                  </div>
                </div>

                {/* Preferences */}
                <div className="pt-6 border-t border-gray-200">
                  <h4 className="text-md font-semibold text-gray-900 mb-4">Preferences</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Currency */}
                    <div>
                      <label htmlFor="preferences.currency" className="block text-sm font-medium text-gray-700 mb-2">
                        Currency
                      </label>
                      <select
                        id="preferences.currency"
                        name="preferences.currency"
                        value={formData.preferences.currency}
                        onChange={handleChange}
                        disabled={!editing || loading}
                        className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                          !editing ? 'bg-gray-50' : ''
                        }`}
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="JPY">JPY (¥)</option>
                        <option value="INR">INR (₹)</option>
                      </select>
                    </div>

                    {/* Date Format */}
                    <div>
                      <label htmlFor="preferences.dateFormat" className="block text-sm font-medium text-gray-700 mb-2">
                        Date Format
                      </label>
                      <select
                        id="preferences.dateFormat"
                        name="preferences.dateFormat"
                        value={formData.preferences.dateFormat}
                        onChange={handleChange}
                        disabled={!editing || loading}
                        className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                          !editing ? 'bg-gray-50' : ''
                        }`}
                      >
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </select>
                    </div>

                    {/* Theme */}
                    <div>
                      <label htmlFor="preferences.theme" className="block text-sm font-medium text-gray-700 mb-2">
                        Theme
                      </label>
                      <select
                        id="preferences.theme"
                        name="preferences.theme"
                        value={formData.preferences.theme}
                        onChange={handleChange}
                        disabled={!editing || loading}
                        className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                          !editing ? 'bg-gray-50' : ''
                        }`}
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                {editing && (
                  <div className="pt-6 border-t border-gray-200">
                    <button
                      type="submit"
                      disabled={loading}
                      className={`w-full sm:w-auto px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                        loading
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-indigo-600 hover:bg-indigo-700 transform hover:scale-105'
                      } text-white`}
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Saving Changes...
                        </>
                      ) : (
                        <>
                          <Save size={20} />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;