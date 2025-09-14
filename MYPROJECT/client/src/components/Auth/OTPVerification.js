import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, RefreshCw } from 'lucide-react';
import { authAPI } from '../../services/api';
import { useAuth } from '../../App';

const OTPVerification = ({ showNotification, onError }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const inputRefs = useRef([]);
  
  // Get email and type from navigation state
  const email = location.state?.email;
  const type = location.state?.type || 'verify';
  const fromSignup = location.state?.fromSignup;
  const fromLogin = location.state?.fromLogin;

  // Redirect if no email provided
  useEffect(() => {
    if (!email) {
      navigate('/login');
      return;
    }
  }, [email, navigate]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  // Auto-focus first input
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Handle OTP input change
  const handleChange = (index, value) => {
    if (value.length > 1) {
      // Handle paste
      const pastedOtp = value.slice(0, 6).split('');
      const newOtp = [...otp];
      pastedOtp.forEach((char, i) => {
        if (index + i < 6 && /^\d$/.test(char)) {
          newOtp[index + i] = char;
        }
      });
      setOtp(newOtp);
      
      // Focus on next empty input or last input
      const nextIndex = Math.min(index + pastedOtp.length, 5);
      if (inputRefs.current[nextIndex]) {
        inputRefs.current[nextIndex].focus();
      }
    } else if (/^\d*$/.test(value)) {
      // Handle single digit input
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      
      // Auto-focus next input
      if (value && index < 5 && inputRefs.current[index + 1]) {
        inputRefs.current[index + 1].focus();
      }
    }
    
    // Clear error when user types
    if (error) {
      setError('');
    }
  };

  // Handle backspace
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      // Focus previous input on backspace
      inputRefs.current[index - 1].focus();
    }
  };

  // Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      let response;
      
      if (fromLogin) {
        // Login OTP verification
        response = await authAPI.verifyLoginOTP({ email, otp: otpString });
        
        // Login successful
        login(response.data.user, response.data.token);
        showNotification('Login successful!', 'success');
        navigate('/dashboard');
        
      } else {
        // Account verification OTP
        response = await authAPI.verifyOTP({ email, otp: otpString });
        
        if (fromSignup) {
          // Account verified, auto-login after signup
          login(response.data.user, response.data.token);
          showNotification('Account verified successfully! Welcome to Finance Tracker!', 'success');
          navigate('/dashboard');
        } else {
          // Just verification, redirect to login
          showNotification('Account verified successfully! Please log in.', 'success');
          navigate('/login');
        }
      }
      
    } catch (error) {
      console.error('OTP verification error:', error);
      
      if (error.status === 400) {
        if (error.message.includes('expired')) {
          setError('OTP has expired. Please request a new one.');
        } else if (error.message.includes('attempts')) {
          setError('Too many attempts. Please request a new OTP.');
        } else {
          setError('Invalid OTP. Please check and try again.');
        }
      } else {
        setError('Verification failed. Please try again.');
      }
      
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    setResending(true);
    setError('');
    
    try {
      await authAPI.resendOTP(email);
      showNotification('New OTP sent to your email!', 'success');
      setTimeLeft(600); // Reset timer
      setOtp(['', '', '', '', '', '']); // Clear current OTP
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setResending(false);
    }
  };

  // Format time
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Get page title and description based on type
  const getPageContent = () => {
    if (fromLogin) {
      return {
        title: 'Login Verification',
        description: `Enter the 6-digit code sent to ${email}`,
        bgColor: 'from-blue-50 to-indigo-100',
        iconBg: 'bg-blue-600'
      };
    } else {
      return {
        title: 'Verify Your Account',
        description: `Enter the 6-digit code sent to ${email}`,
        bgColor: 'from-purple-50 to-pink-100',
        iconBg: 'bg-purple-600'
      };
    }
  };

  const pageContent = getPageContent();

  if (!email) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${pageContent.bgColor} flex items-center justify-center p-4`}>
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className={`${pageContent.iconBg} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4`}>
            <Lock className="text-white text-2xl" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">{pageContent.title}</h1>
          <p className="text-gray-600 mt-2">{pageContent.description}</p>
          
          {/* Timer */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              Code expires in: <span className="font-mono font-bold text-red-600">{formatTime(timeLeft)}</span>
            </p>
          </div>
        </div>
        
        {/* OTP Form */}
        <form onSubmit={handleVerifyOTP} className="space-y-6">
          {/* OTP Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
              Enter 6-Digit Verification Code
            </label>
            <div className="flex justify-center space-x-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-lg focus:ring-2 focus:border-transparent transition-colors ${
                    error 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-indigo-500'
                  }`}
                  disabled={loading || timeLeft === 0}
                  autoComplete="off"
                />
              ))}
            </div>
            
            {error && (
              <p className="mt-3 text-sm text-red-600 text-center">{error}</p>
            )}
            
            {timeLeft === 0 && (
              <p className="mt-3 text-sm text-red-600 text-center">
                Code has expired. Please request a new one.
              </p>
            )}
          </div>
          
          {/* Verify Button */}
          <button
            type="submit"
            disabled={loading || timeLeft === 0 || otp.join('').length !== 6}
            className={`w-full py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
              loading || timeLeft === 0 || otp.join('').length !== 6
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 transform hover:scale-105'
            } text-white`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Verifying...
              </>
            ) : (
              'Verify Code'
            )}
          </button>
        </form>
        
        {/* Resend OTP */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm mb-3">
            Didn't receive the code?
          </p>
          <button
            onClick={handleResendOTP}
            disabled={resending || timeLeft > 540} // Can resend after 1 minute
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              resending || timeLeft > 540
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {resending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
                Sending...
              </>
            ) : (
              <>
                <RefreshCw size={16} />
                Resend Code
                {timeLeft > 540 && ` (${Math.ceil((timeLeft - 540) / 60)}m)`}
              </>
            )}
          </button>
        </div>
        
        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            Check your email inbox and spam folder for the verification code
          </p>
          <button
            onClick={() => navigate('/login')}
            className="mt-2 text-sm text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;