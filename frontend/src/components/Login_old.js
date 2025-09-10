import React, { useState, useContext } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import UserContext from "../utils/UserContext";
import apiService from '../utils/apiService';
import Button from './common/Button';
import Input from './common/Input';

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});

  const navigate = useNavigate();
  const { setUserName } = useContext(UserContext);
  const location = useLocation();

  // Check for success message from OTP verification
  React.useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      if (location.state.email) {
        setFormData(prev => ({ ...prev, email: location.state.email }));
      }
    }
  }, [location.state]);

  const validateField = (name, value) => {
    switch (name) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value) ? '' : 'Please enter a valid email address';
      case 'password':
        return value.length >= 6 ? '' : 'Password must be at least 6 characters';
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError("");
    
    if (touchedFields[name]) {
      const fieldError = validateField(name, value);
      setFieldErrors(prev => ({ ...prev, [name]: fieldError }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouchedFields(prev => ({ ...prev, [name]: true }));
    const fieldError = validateField(name, value);
    setFieldErrors(prev => ({ ...prev, [name]: fieldError }));
  };

  const validateForm = () => {
    if (!formData.email.trim() || !formData.password.trim()) {
      setError("Please fill in all fields");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const response = await apiService.login(formData);
      if (response.access) {
        localStorage.setItem("token", response.access);
        localStorage.setItem("refreshToken", response.refresh);
        
        // Get user profile to set name properly
        try {
          const profile = await apiService.getProfile();
          setUserName(profile.name || "User");
        } catch (profileErr) {
          setUserName("User");
        }
        
        navigate("/");
      } else {
        setError(response.detail || "Invalid email or password");
      }
    } catch (err) {
      if (err.message === "Failed to fetch") {
        setError("Unable to connect to server. Please check your internet connection.");
      } else {
        setError(err.message || "Invalid email or password");
      }
    } finally {
      setLoading(false);
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
            Welcome back
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please enter your details
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              id="email"
              name="email"
              type="email"
              label="Email address"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touchedFields.email ? fieldErrors.email : ""}
              placeholder="Enter your email"
              required
            />
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm font-semibold text-orange-600 hover:text-orange-500"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                name="password"
                type="password" autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touchedFields.password ? fieldErrors.password : ""}
                placeholder="Enter your password"
                required
            Email
          </label>
          <input
            id="email"
            type="email"
            name="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <div>
          {/* This section now includes a Link to the forgot password route */}
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="password" className="font-semibold text-gray-700">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-sm font-semibold text-orange-600 hover:text-orange-700"
            >
              Forgot Password?
            </Link>
          </div>
          <input
            id="password"
            type="password" autoComplete="current-password"
            name="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <div className="text-center">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-red-600 disabled:opacity-50 transition-all duration-300"
          >
            {isLoading ? "Logging In..." : "Login"}
          </button>
        </div>
        <div className="text-center mt-4 text-sm">
          <p className="text-gray-600">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={onToggleView}
              className="font-semibold text-orange-600 hover:text-orange-700"
            >
              Register
            </button>
          </p>
        </div>
      </form>
      {message && (
        <p className="mt-4 text-center text-sm text-red-600">{message}</p>
      )}
    </div>
  );
};

export default Login;
