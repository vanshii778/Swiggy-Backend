import { LOGO_URL } from "../utils/constants";
import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import useOnlineStatus from "../utils/useOnlineStatus";
import UserContext from "../utils/UserContext";
import { useSelector } from "react-redux";

export const Header = () => {
  const [btnNameReact, setbtnNameReact] = useState("Login");
  const onlineStatus = useOnlineStatus();
  const { loggedInUser } = useContext(UserContext);
  const cartItems = useSelector((store) => store.cart.items);
    const navigate = useNavigate();
    const handleAuthClick = () => {
    if (loggedInUser) {
      setUserName(null); 
      navigate("/"); 
    } else {
      navigate("/auth");
    }
  };
  return (
    <div className="flex justify-between items-center px-6 py-4 bg-white shadow-md border-b">
      <div className="logo-container">
        <img className="w-20 sm:w-24" src={LOGO_URL} alt="logo" />
      </div>

      <div className="flex items-center">
        <ul className="flex flex-wrap items-center gap-4 text-base font-medium">
          <li className="text-gray-700">
            Online:{" "}
            <span className="font-bold">{onlineStatus ? "✅" : "🔴"}</span>
          </li>

          <li>
            <Link
              to="/"
              className="hover:text-blue-600 transition-colors duration-200"
            >
              Home
            </Link>
          </li>

          <li>
            <Link
              to="/about"
              className="hover:text-blue-600 transition-colors duration-200"
            >
              About Us
            </Link>
          </li>

          <li>
            <Link
              to="/grocery"
              className="hover:text-blue-600 transition-colors duration-200"
            >
              Grocery
            </Link>
          </li>

          <li>
            <Link
              to="/contact"
              className="hover:text-blue-600 transition-colors duration-200"
            >
              Contact Us
            </Link>
          </li>

          <li>
            <Link
              to="/cart"
              className="text-white bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded transition-colors duration-200"
            >
              Cart - ({cartItems.length} items)
            </Link>
          </li>

          <li>
            <Link
              to="/login"
              className="bg-purple-500 text-white px-4 py-1 rounded hover:bg-purple-600 transition-colors duration-200"
            >
              Login
            </Link>
          </li>
          <li>
            <Link
              to="/signup"
              className="bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600 transition-colors duration-200"
            >
              Sign Up
            </Link>
          </li>
          </ul>
      </div>
    </div>
  );
};

export default Header;
