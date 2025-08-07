import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  const token = localStorage.getItem('userToken');

  // If there's no token, redirect to the login page
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // If there is a token, render the child component (e.g., UserProfile)
  return <Outlet />;
};

export default ProtectedRoute;
