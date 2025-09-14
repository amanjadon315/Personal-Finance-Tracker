import React from 'react';

const LoadingSpinner = ({ 
  size = 'medium', 
  color = 'indigo', 
  text = '',
  className = '' 
}) => {
  // Size configurations
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12',
    xlarge: 'h-16 w-16'
  };

  // Color configurations
  const colorClasses = {
    indigo: 'border-indigo-600',
    blue: 'border-blue-600',
    green: 'border-green-600',
    red: 'border-red-600',
    purple: 'border-purple-600',
    gray: 'border-gray-600',
    white: 'border-white'
  };

  // Text size based on spinner size
  const textSizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
    xlarge: 'text-xl'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {/* Spinner */}
      <div
        className={`animate-spin rounded-full border-4 border-gray-200 ${colorClasses[color]} border-t-transparent ${sizeClasses[size]}`}
        role="status"
        aria-label="Loading"
      >
        <span className="sr-only">Loading...</span>
      </div>
      
      {/* Loading text */}
      {text && (
        <p className={`mt-3 text-gray-600 ${textSizeClasses[size]} animate-pulse`}>
          {text}
        </p>
      )}
    </div>
  );
};

// Different loading spinner variants
export const SpinnerDots = ({ className = '', color = 'indigo' }) => {
  const colorClasses = {
    indigo: 'bg-indigo-600',
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    red: 'bg-red-600',
    purple: 'bg-purple-600',
    gray: 'bg-gray-600'
  };

  return (
    <div className={`flex space-x-1 ${className}`}>
      <div className={`h-2 w-2 rounded-full ${colorClasses[color]} animate-bounce`} style={{ animationDelay: '0ms' }}></div>
      <div className={`h-2 w-2 rounded-full ${colorClasses[color]} animate-bounce`} style={{ animationDelay: '150ms' }}></div>
      <div className={`h-2 w-2 rounded-full ${colorClasses[color]} animate-bounce`} style={{ animationDelay: '300ms' }}></div>
    </div>
  );
};

// Pulse loading animation
export const SpinnerPulse = ({ className = '', size = 'medium' }) => {
  const sizeClasses = {
    small: 'h-8 w-8',
    medium: 'h-12 w-12',
    large: 'h-16 w-16'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`rounded-full bg-indigo-400 opacity-75 animate-ping ${sizeClasses[size]}`}></div>
      <div className={`absolute rounded-full bg-indigo-600 ${sizeClasses[size]}`} style={{ transform: 'scale(0.7)' }}></div>
    </div>
  );
};

// Skeleton loader for content
export const SkeletonLoader = ({ lines = 3, className = '' }) => {
  return (
    <div className={`animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div key={index} className="flex space-x-4 mb-4">
          <div className="rounded-full bg-gray-300 h-10 w-10"></div>
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Full page loading overlay
export const LoadingOverlay = ({ show, text = 'Loading...' }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 shadow-xl">
        <LoadingSpinner size="large" text={text} />
      </div>
    </div>
  );
};

export default LoadingSpinner;