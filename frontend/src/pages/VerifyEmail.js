import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiCheckCircle, FiXCircle, FiLoader } from 'react-icons/fi';

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');
  
  const { verifyEmail } = useAuth();

  useEffect(() => {
    const verify = async () => {
      try {
        const result = await verifyEmail(token);
        if (result.success) {
          setStatus('success');
          setMessage('Email verified successfully! You can now log in.');
        }
      } catch (error) {
        setStatus('error');
        setMessage('Email verification failed. The link may be expired or invalid.');
      }
    };

    verify();
  }, [token, verifyEmail]);

  const getIcon = () => {
    switch (status) {
      case 'verifying':
        return <FiLoader className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />;
      case 'success':
        return <FiCheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />;
      case 'error':
        return <FiXCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />;
      default:
        return null;
    }
  };

  const getTitle = () => {
    switch (status) {
      case 'verifying':
        return 'Verifying Email...';
      case 'success':
        return 'Email Verified!';
      case 'error':
        return 'Verification Failed';
      default:
        return '';
    }
  };

  const getButtonText = () => {
    switch (status) {
      case 'success':
        return 'Go to Login';
      case 'error':
        return 'Try Again';
      default:
        return '';
    }
  };

  const handleButtonClick = () => {
    if (status === 'success') {
      navigate('/login');
    } else if (status === 'error') {
      navigate('/register');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            {getTitle()}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {message}
          </p>
        </div>
        
        <div className="text-center">
          {getIcon()}
          
          {(status === 'success' || status === 'error') && (
            <button
              onClick={handleButtonClick}
              className="btn btn-primary"
            >
              {getButtonText()}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
