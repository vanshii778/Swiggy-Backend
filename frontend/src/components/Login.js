import React, { useState } from 'react';

const Login = ({ onToggleView }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);
    try {
      const backendUrl = 'http://127.0.0.1:8000/api/user/login';
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.detail || 'Login failed.');
      }
      setMessage(result.message);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white shadow-2xl rounded-xl p-8 w-full max-w-md">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Login</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block mb-2 font-medium text-gray-700">Email</label>
          <input id="email" type="email" name="email" placeholder="Enter your email" value={formData.email} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"/>
        </div>
        <div>
          <label htmlFor="password" className="block mb-2 font-medium text-gray-700">Password</label>
          <input id="password" type="password" name="password" placeholder="Enter your password" value={formData.password} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"/>
        </div>
        <div className="text-center">
          <button type="submit" disabled={isLoading} className="w-full px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-purple-300">
            {isLoading ? 'Logging In...' : 'Login'}
          </button>
        </div>
        <div className="text-center mt-4 text-sm">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <button type="button" onClick={onToggleView} className="font-medium text-purple-600 hover:text-purple-500 focus:outline-none">
              Register
            </button>
          </p>
        </div>
      </form>
      {message && <p className="mt-4 text-center text-sm text-gray-600">{message}</p>}
    </div>
  );
};



export default Login;

