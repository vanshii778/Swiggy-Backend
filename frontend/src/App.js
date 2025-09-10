import React, { lazy, Suspense, useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import { Provider } from "react-redux";
import UserContext from "./utils/UserContext";
import appStore from "./utils/appStore";

import Header from "./components/Header";
import Body from "./components/Body";
import Contact from "./components/Contact";
import Error from "./components/Error";
import RestaurantMenu from "./components/RestaurantMenu";
import Cart from "./components/Cart";
import AuthPage from "./components/AuthPage";
import UserProfile from "./components/UserProfile";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./components/Login";
import Register from "./components/Register";
import OTPVerify from "./components/OTPVerify";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import AdminDashboard from "./components/AdminDashboard";
import AdminRoute from "./components/AdminRoute";
const Grocery = lazy(() => import("./components/Grocery"));
const About = lazy(() => import("./components/About"));

const AppLayout = () => {
  const [userName, setUserName] = useState(null);

  useEffect(() => {
    const verifyUser = async () => {
      const token = localStorage.getItem("token");
      console.log("Checking for token:", token ? "Found" : "Not found");
      
      if (token) {
        try {
          console.log("Verifying user with token...");
          const response = await fetch(
            "http://127.0.0.1:8000/api/auth/profile/",
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          
          if (response.ok) {
            const result = await response.json();
            console.log("Profile verification success:", result);
            // Backend returns profile data directly
            const name = result.name || result.first_name || "User";
            setUserName(name);
            console.log("User authenticated:", name);
          } else {
            console.log("Profile verification failed with status:", response.status);
            localStorage.removeItem("token");
            localStorage.removeItem("refreshToken");
            setUserName(null);
          }
        } catch (error) {
          console.error("Session verification error:", error);
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          setUserName(null);
        }
      } else {
        console.log("No token found, user not logged in");
        setUserName(null);
      }
    };
    verifyUser();
  }, []);

  return (
    <Provider store={appStore}>
      <UserContext.Provider value={{ loggedInUser: userName, setUserName }}>
        <div className="app">
          {/* Debug info - remove in production */}
          {process.env.NODE_ENV === 'development' && (
            <div style={{ 
              position: 'fixed', 
              top: '10px', 
              right: '10px', 
              background: 'rgba(0,0,0,0.8)', 
              color: 'white', 
              padding: '10px', 
              borderRadius: '5px', 
              fontSize: '12px',
              zIndex: 9999
            }}>
              Debug: User = {userName || "Not logged in"}
              <br />Token = {localStorage.getItem("token") ? "Present" : "None"}
            </div>
          )}
          <Header />
          <Outlet />
        </div>
      </UserContext.Provider>
    </Provider>
  );
};

const appRouter = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    errorElement: <Error />,
    children: [
      { path: "/", element: <Body /> },
      { path: "/contact", element: <Contact /> },
      { path: "/login", element: <Login /> },
      { path: "/register", element: <Register /> },
      { path: "/verify-otp", element: <OTPVerify /> },
      { path: "/forgot-password", element: <ForgotPassword /> },
      { path: "/reset-password", element: <ResetPassword /> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: "/restaurants/:resId", element: <RestaurantMenu /> },
          { path: "/cart", element: <Cart /> },
          { path: "/profile", element: <UserProfile /> },
          { 
            path: "/admin", 
            element: (
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            )
          },
          {
            path: "/about",
            element: (
              <Suspense fallback={
                <div className="min-h-screen flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
                </div>
              }>
                <About />
              </Suspense>
            ),
          },
          {
            path: "/grocery",
            element: (
              <Suspense fallback={
                <div className="min-h-screen flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
                </div>
              }>
                <Grocery />
              </Suspense>
            ),
          },
        ],
      },
    ],
  },
]);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<RouterProvider router={appRouter} />);
