import React, { useState } from 'react';
import Login from './Login';       
import Register from './Register';
const AuthPage = ({ defaultIsLogin = true }) => {
  const [isLoginView, setIsLoginView] = useState(defaultIsLogin);

  const toggleView = () => {
    setIsLoginView(!isLoginView);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 font-sans">
      {isLoginView ? (
        <Login onToggleView={toggleView} />
      ) : (
        <Register onToggleView={toggleView} />
      )}
    </div>
  );
};

export default AuthPage;
