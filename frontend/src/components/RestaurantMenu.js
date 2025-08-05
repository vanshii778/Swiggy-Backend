import Shimmer from "./Shimmer";
import { useParams } from "react-router-dom";
import useRestaurantMenu from "../utils/useRestaurantMenu";
import RestaurantCategory from "./RestaurantCategory";
import { useState } from "react";
import { useSelector } from "react-redux";

const RestaurantMenu = () => {
  const { resId } = useParams();
  const dummy = "Dummy Data";
  const resInfo = useRestaurantMenu(resId);
  const [showIndex, setShowIndex] = useState(0);
  const [filterType, setFilterType] = useState("all");
  const cartItems = useSelector((store) => store.cart.items);

  if (resInfo === null) return <Shimmer />;

  const { name, cuisines, costForTwoMessage } =
    resInfo?.cards[4]?.card?.card?.info || {};

  const { itemCards } =
    resInfo?.cards[4]?.groupedCard?.cardGroupMap?.REGULAR?.cards[2]?.card?.card;

  const categories =
    resInfo?.cards[4]?.groupedCard?.cardGroupMap?.REGULAR?.cards.filter(
      (c) =>
        c.card?.["card"]?.["@type"] ===
        "type.googleapis.com/swiggy.presentation.food.v2.ItemCategory"
    );
  const type =
    resInfo?.cards[4]?.groupedCard?.cardGroupMap?.REGULAR?.cards.filter(
      (c) =>
        c.card?.["card"]?.["@type"] ===
        "type.googleapis.com/swiggy.presentation.food.v2.Dish"
    );

  // Helper to merge cart quantities into menu items
  const mergeQuantities = (menuItems) => {
    return menuItems.map((item) => {
      const cartItem = cartItems.find((ci) => ci.card.info.id === item.card.info.id);
      return cartItem ? { ...item, quantity: cartItem.quantity } : item;
    });
  };

  return (
    <div className="text-center">
      <h1 className="font-bold my-6 text-2xl">{name}</h1>
      <p className="font-bold text-lg">
        {cuisines?.join(", ")} - {costForTwoMessage}
      </p>

      {/* Toggle button for veg nd non veg */}
      <div className=" flex justify-center mt-4">
        {/* Veg Toggle */}
        <div
          className="relative w-20 h-10 rounded-full border-2 cursor-pointer bg-white border-gray-300 transition-all duration-300"
          onClick={() => setFilterType(filterType === "veg" ? "all" : "veg")}
        >
          {/* Slider */}
          <div
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-15 rounded-2xl flex items-center px-1 transition-transform duration-300 ${
              filterType === "veg"
                ? "justify-end bg-green-100 border-green-600"
                : "justify-start"
            }`}
          >
            <div className="w-5 h-5 flex items-center justify-center border-2 border-green-600 rounded transition-all duration-300 bg-white">
              <div className="w-2 h-2 bg-green-600 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Non-Veg Toggle */}
        <div
          className="relative w-20 h-10 rounded-full border-2 cursor-pointer bg-white border-gray-300 transition-all duration-300"
          onClick={() =>
            setFilterType(filterType === "non-veg" ? "all" : "non-veg")
          }
        >
          {/* Slider */}
          <div
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-15 flex items-center rounded-2xl px-1 transition-transform duration-300 ${
              filterType === "non-veg"
                ? "justify-end bg-red-100 border-red-600"
                : "justify-start"
            }`}
          >
            <div className="w-5 h-5 flex items-center justify-center border-2 border-red-500 rounded transition-all duration-300 bg-white">
              {/* Red Triangle */}
              <div className="w-0 h-0 border-l-4 border-r-4 border-b-[6px] border-transparent border-b-red-500" />
            </div>
          </div>
        </div>
      </div>

      {/* categories accordians */}
      {categories.map((category, index) => (
        //controlled component
        <RestaurantCategory
          key={category?.card?.card.title}
          data={{ ...category?.card?.card, itemCards: mergeQuantities(category?.card?.card.itemCards) }}
          showItems={index === showIndex ? true : false}
          setShowIndex={() => setShowIndex(index)}
          dummy={dummy}
          filterType={filterType}
        />
      ))}
    </div>
  );
};

export default RestaurantMenu;
