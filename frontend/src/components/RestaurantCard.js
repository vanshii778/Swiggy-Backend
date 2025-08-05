import { useContext } from "react";
import { CDN_URL } from "../utils/constants";
import UserContext from "../utils/UserContext";

const RestaurantCard = ({ resData }) => {
  const { loggedInUser } = useContext(UserContext);
  const { cloudinaryImageId, name, cuisines, avgRating, costForTwo, offers } =
    resData?.info;
  return (
    <div
      data-testid="resCard"
      className="m-4 p-4 w-[250px] bg-gradient-to-br from-white via-yellow-50 to-orange-50 rounded-2xl shadow-md hover:shadow-2xl hover:scale-105 hover:border-4 hover:border-yellow-300 transition-transform duration-300 relative overflow-visible"
    >
      {/* Unique Offer Ribbon */}
      {offers && (
        <div className="absolute -top-3 -left-3 z-10">
          <div className="transform -rotate-12 bg-gradient-to-r from-pink-400 via-yellow-300 to-orange-400 text-white text-xs font-bold px-4 py-1 rounded-lg shadow-lg flex items-center gap-1 border-2 border-white">
            <span role='img' aria-label='offer'>🏷️</span> {offers}
          </div>
        </div>
      )}
      <img
        className="rounded-lg w-full h-40 object-cover mb-2"
        alt="res-logo"
        src={CDN_URL + cloudinaryImageId}
      />
      <h3 className="font-bold py-2 text-lg text-gray-800">{name}</h3>
      <h4 className="text-sm text-gray-600 truncate">{cuisines.join(", ")}</h4>
      <h4 className="text-sm text-green-600 font-medium">{avgRating} ★</h4>
      <h4 className="text-sm text-gray-700">{costForTwo}</h4>
      <h4 className="mt-2 text-xs text-gray-500 italic">User: {loggedInUser}</h4>
    </div>
  );
};

export default RestaurantCard;
