import { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { LOGO_URL } from "../utils/constants";
import useOnlineStatus from "../utils/useOnlineStatus";
import UserContext from "../utils/UserContext";

export const Header = () => {
  const onlineStatus = useOnlineStatus();
  const { loggedInUser, setUserName } = useContext(UserContext);
  const cartItems = useSelector((store) => store.cart.items);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("userToken");
    setUserName(null);
    navigate("/");
  };

  return (
    <div className="flex justify-between items-center px-6 py-4 bg-white shadow-md border-b">
      <div className="logo-container">
        <Link to="/">
          <img className="w-20 sm:w-24" src={LOGO_URL} alt="logo" />
        </Link>
      </div>

      <nav className="flex items-center">
        <ul className="flex flex-wrap items-center gap-4 text-base font-medium">
          <li>Online: <span className="font-bold">{onlineStatus ? "✅" : "🔴"}</span></li>
          <li><Link to="/" className="hover:text-blue-600">Home</Link></li>
          <li><Link to="/about" className="hover:text-blue-600">About</Link></li>
          <li><Link to="/grocery" className="hover:text-blue-600">Grocery</Link></li>
          <li><Link to="/contact" className="hover:text-blue-600">Contact</Link></li>
          <li><Link to="/cart" className="text-white bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded">Cart ({cartItems.length})</Link></li>
          
          {loggedInUser ? (
            <>
              <li>
                <Link to="/user-profile" className="font-bold text-gray-800 hover:text-blue-600">
                  {loggedInUser}
                </Link>
              </li>
              <li>
                <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600">
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li><Link to="/login" className="bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600">Login</Link></li>
            </>
          )}
        </ul>
      </nav>
    </div>
  );
};

export default Header;
