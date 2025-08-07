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

const Grocery = lazy(() => import("./components/Grocery"));
const About = lazy(() => import("./components/About"));

const AppLayout = () => {
  const [userName, setUserName] = useState(null);

  // Check for a logged-in user when the app first loads
  useEffect(() => {
    const verifyUser = async () => {
      const token = localStorage.getItem('userToken');
      if (token) {
        try {
          const response = await fetch('http://127.0.0.1:8000/api/user/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const result = await response.json();
          if (result.success) {
            setUserName(result.data.name);
          } else {
            localStorage.removeItem('userToken'); // Clean up invalid token
          }
        } catch (error) {
          console.error("Session verification failed:", error);
          localStorage.removeItem('userToken');
        }
      }
    };
    verifyUser();
  }, []);

  return (
    <Provider store={appStore}>
      <UserContext.Provider value={{ loggedInUser: userName, setUserName }}>
        <div className="app">
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
      { path: "/restaurants/:resId", element: <RestaurantMenu /> },
      { path: "/cart", element: <Cart /> },
      { path: "/login", element: <AuthPage defaultIsLogin={true} /> },
      { path: "/signup", element: <AuthPage defaultIsLogin={false} /> },
      { path: "/about", element: <Suspense fallback={<h1>Loading...</h1>}><About /></Suspense> },
      { path: "/grocery", element: <Suspense fallback={<h1>Loading...</h1>}><Grocery /></Suspense> },
      {
        path: "/", // Parent path for protected routes
        element: <ProtectedRoute />,
        children: [
          { path: "user-profile", element: <UserProfile /> }
        ]
      },
    ],
  },
]);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<RouterProvider router={appRouter} />);
