import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import UserContext from '../utils/UserContext';
import apiService from '../utils/apiService';
import Button from './common/Button';
import Input from './common/Input';

const OTPVerify = () => {
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { setUserName } = useContext(UserContext);

  useEffect(() => {
    // Get email from navigation state or localStorage
    const emailFromState = location.state?.email;
    const emailFromStorage = localStorage.getItem('pendingVerificationEmail');
    const messageFromState = location.state?.message;
    
    if (emailFromState) {
      setEmail(emailFromState);
    } else if (emailFromStorage) {
      setEmail(emailFromStorage);
    } else {
      // No email found, redirect to register
      navigate('/register');
      return;
    }

    if (messageFromState) {
      setSuccessMessage(messageFromState);
    }
  }, [location, navigate]);

  const handleChange = (e) => {
    setOtp(e.target.value);
    setError('');
  };

  const validateOTP = () => {
    if (!otp.trim()) {
      setError('Please enter the OTP');
      return false;
    }
    if (otp.length !== 6) {
      setError('OTP must be 6 digits');
      return false;
    }
    if (!/^\d{6}$/.test(otp)) {
      setError('OTP must contain only numbers');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!validateOTP()) {
      return;
    }

    setLoading(true);
    
    try {
      const result = await apiService.verifyOTP({ email, otp });
      
      // Clear pending verification data
      localStorage.removeItem('pendingVerificationEmail');
      
      setSuccessMessage('Email verified successfully! Redirecting to dashboard...');
      
      // Set user name if provided in response
      if (result.user?.name) {
        setUserName(result.user.name);
      }
      
      // Redirect to login page with success message
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Registration completed! Please login with your credentials.',
            email: email
          }
        });
      }, 2000);

    } catch (err) {
      if (err.message === "Failed to fetch") {
        setError("Unable to connect to server. Please check your internet connection.");
      } else {
        setError(err.message || "Invalid OTP. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError('');
    setSuccessMessage('');
    setResending(true);

    try {
      await apiService.resendOTP({ email });
      setSuccessMessage('OTP resent successfully! Please check your email.');
    } catch (err) {
      setError(err.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
        <div>
          <img
            className="mx-auto h-16 w-auto"
            src="https://logosandtypes.com/wp-content/uploads/2021/01/swiggy.svg"
            alt="Swiggy"
          />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Verify Your Email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            We've sent a 6-digit code to
          </p>
          <p className="text-center text-sm font-medium text-gray-900">
            {email}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <Input
              id="otp"
              name="otp"
              type="text"
              label="Enter OTP"
              value={otp}
              onChange={handleChange}
              placeholder="000000"
              maxLength="6"
              required
              className="text-center text-2xl tracking-widest"
            />
          </div>

          {successMessage && (
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">{successMessage}</p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            fullWidth
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying...
              </div>
            ) : (
              'Verify OTP'
            )}
          </Button>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Didn't receive the code?
            </span>
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={resending}
              className="font-medium text-orange-600 hover:text-orange-500 disabled:opacity-50"
            >
              {resending ? 'Resending...' : 'Resend OTP'}
            </button>
          </div>

          <div className="flex items-center justify-center">
            <Link
              to="/register"
              className="font-medium text-orange-600 hover:text-orange-500"
            >
              ← Back to Registration
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OTPVerify;
