import RestaurantCard from "./RestaurantCard";
import { useState, useEffect, useContext } from "react";
import Shimmer from "./Shimmer";
import { Link } from "react-router-dom";
import useOnlineStatus from "../utils/useOnlineStatus";
import UserContext from "../utils/UserContext";
import withRestaurantBadges from "./HOC/withRestaurantBadges";

const Body = () => {
  const [listOfRestaurants, setListOfRestaurants] = useState([]);
  const [filteredRestaurant, setFilteredRestaurant] = useState([]);
  const [searchText, setSearchText] = useState("");

  const onlineStatus = useOnlineStatus();
  // Destructure what you need from the context
  const { loggedInUser, setUserName } = useContext(UserContext);

  const RestaurantCardWithBadges = withRestaurantBadges(RestaurantCard);
  
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const data = await fetch(
        "https://www.swiggy.com/dapi/restaurants/list/v5?lat=23.022505&lng=72.5713621&is-seo-homepage-enabled=true&page_type=DESKTOP_WEB_LISTING"
      );
      const json = await data.json();
      const restaurants = json?.data?.cards[4]?.card?.card?.gridElements?.infoWithStyle?.restaurants || [];
      setListOfRestaurants(restaurants);
      setFilteredRestaurant(restaurants);
    } catch (error) {
        console.error("Failed to fetch restaurant data:", error);
        // Set to empty arrays to prevent crashes
        setListOfRestaurants([]);
        setFilteredRestaurant([]);
    }
  };

  if (onlineStatus === false) {
    return (
      <h1 className="text-center text-red-600 text-xl mt-10">
        Looks like you're offline! Please check your internet connection.
      </h1>
    );
  }

  // Show shimmer UI while loading
  if (listOfRestaurants.length === 0) {
    return <Shimmer />;
  }

  return (
    <div className="px-6 py-4">
      {/* Filters Section */}
      <div className="filter flex flex-wrap gap-4 justify-between items-center mb-6 bg-gray-50 p-4 rounded-lg shadow-sm">
        {/* Search Box */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <input
            type="text"
            data-testid="searchInput"
            className="border border-gray-300 rounded px-3 py-1 outline-none focus:ring-2 focus:ring-blue-300"
            placeholder="Search restaurant..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <button
            className="px-4 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition"
            onClick={() => {
              const filtered = listOfRestaurants.filter((res) =>
                res.info.name.toLowerCase().includes(searchText.toLowerCase())
              );
              setFilteredRestaurant(filtered);
            }}
          >
            Search
          </button>
        </div>

        {/* Top Rated Filter */}
        <div>
          <button
            className="px-4 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500 transition"
            onClick={() => {
              const topRated = listOfRestaurants.filter(
                (res) => res.info.avgRating > 4.5
              );
              setFilteredRestaurant(topRated);
            }}
          >
            Top Rated Restaurants
          </button>
        </div>

        {/* Username Input */}
        <div className="flex items-center gap-2">
          <label className="font-medium">UserName:</label>
          <input
            className="border border-gray-300 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-purple-300"
            // --- THE FIX ---
            // Use `loggedInUser || ''` to prevent passing null to the value prop.
            value={loggedInUser || ''}
            onChange={(e) => setUserName(e.target.value)}
          />
        </div>
      </div>

      {/* Restaurant Cards Section */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredRestaurant.map((restaurant) => (
          <Link
            to={"/restaurants/" + restaurant.info.id}
            key={restaurant.info.id}
            className="hover:scale-105 transition-transform duration-200"
          >
            {/* Logic to show badge only if the restaurant is top-rated */}
            {restaurant.info.avgRating > 4.5 ? (
              <RestaurantCardWithBadges resData={restaurant} />
            ) : (
              <RestaurantCard resData={restaurant} />
            )}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Body;
