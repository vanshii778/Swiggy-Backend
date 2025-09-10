import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  const token = localStorage.getItem('token'); // Fixed: using correct token key

  console.log('ProtectedRoute - Token check:', token ? 'Found' : 'Not found');

  // If there's no token, redirect to the login page
  if (!token) {
    console.log('No token found, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  console.log('Token found, allowing access to protected route');
  // If there is a token, render the child component (e.g., UserProfile)
  return <Outlet />;
};

export default ProtectedRoute;
