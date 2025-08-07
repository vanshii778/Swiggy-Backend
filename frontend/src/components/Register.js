import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import UserContext from '../utils/UserContext';

const Register = ({ onToggleView }) => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { setUserName } = useContext(UserContext);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);
    try {
      const backendUrl = 'http://127.0.0.1:8000/api/user/register';
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.detail || 'Registration failed.');
      }
      
      localStorage.setItem('userToken', result.data.token);
      setUserName(formData.name);
      navigate("/"); 

    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white shadow-2xl rounded-xl p-8 w-full max-w-md border border-gray-100">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Create Account</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block mb-2 font-semibold text-gray-700">Name</label>
          <input id="name" type="text" name="name" placeholder="Enter your name" value={formData.name} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"/>
        </div>
        <div>
          <label htmlFor="email" className="block mb-2 font-semibold text-gray-700">Email</label>
          <input id="email" type="email" name="email" placeholder="Enter your email" value={formData.email} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"/>
        </div>
        <div>
          <label htmlFor="password" className="block mb-2 font-semibold text-gray-700">Password</label>
          <input id="password" type="password" name="password" placeholder="Enter your password" value={formData.password} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"/>
        </div>
        <div className="text-center">
          <button type="submit" disabled={isLoading} className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-red-600 disabled:opacity-50">
            {isLoading ? 'Registering...' : 'Register'}
          </button>
        </div>
        <div className="text-center mt-4 text-sm">
          <p className="text-gray-600">
            Already have an account?{' '}
            <button type="button" onClick={onToggleView} className="font-semibold text-orange-600 hover:text-orange-700">
              Log In
            </button>
          </p>
        </div>
      </form>
      {message && <p className="mt-4 text-center text-sm text-red-600">{message}</p>}
    </div>
  );
};

export default Register;
