const withRestaurantBadges = (WrappedComponent) => {
  return function Wrapper(props) {
    const { resData } = props;
    const info = resData?.info;
    const badges = [];

    if (info?.avgRating >= 4.5) {
      badges.push({ text: "Top Rated 🟢", color: "bg-green-700" });
    }

    if (info?.avgRating < 4.0 && info?.avgRating > 0) {
      badges.push({ text: "Low Rating 🟡", color: "bg-yellow-600" });
    }

    if (info?.sla?.deliveryTime <= 25) {
      badges.push({ text: "Fast Delivery ⚡", color: "bg-blue-600" });
    }

    try {
      if (info?.totalRatingsString) {
        const ratings = parseInt(info.totalRatingsString.replace(/\D/g, ""));
        if (
          (info.totalRatingsString.includes("K") && ratings >= 10) ||
          (!info.totalRatingsString.includes("K") && ratings > 10000)
        ) {
          badges.push({ text: "Popular 🔥", color: "bg-red-600" });
        }
      }
    } catch (error) {
      console.error("Failed to parse totalRatingsString", error);
    }

    return (
      <div className="relative">
        {badges.length > 0 && (
          <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
            {badges.map((badge) => (
              <span
                key={badge.text}
                className={`text-white text-xs font-bold px-2 py-1 rounded shadow ${badge.color}`}
              >
                {badge.text}
              </span>
            ))}
          </div>
        )}

        <WrappedComponent {...props} />
      </div>
    );
  };
};

export default withRestaurantBadges;
