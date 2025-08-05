import { useDispatch, useSelector } from "react-redux";
import ItemList from "./ItemList";
import { clearCart } from "../utils/cartSlice";

const Cart = () => {
  const cartItems = useSelector((store) => store.cart.items);
  const dispatch = useDispatch();

  const handleClearCart = () => {
    dispatch(clearCart());
  };

  return (
    <div className="p-6 text-center min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Your Cart</h1>

      <div className="w-full max-w-2xl mx-auto bg-white shadow-md rounded-xl p-6">
        {cartItems.length === 0 ? (
          <h2 className="text-lg text-gray-600 mb-4">
            🛒 Your cart is empty. Add items to the cart!
          </h2>
        ) : (
          <>
            <div className="flex justify-end mb-4">
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                onClick={handleClearCart}
              >
                Clear Cart
              </button>
            </div>

            {/* Cart Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left mb-6">
                <thead>
                  <tr className="border-b">
                    <th className="py-2">Item</th>
                    <th className="py-2">Price</th>
                    <th className="py-2">Quantity</th>
                    <th className="py-2">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {cartItems.map((item, idx) => (
                    <tr key={item.card.info.id + '-' + idx} className="border-b">
                      <td className="py-2 font-medium">{item.card.info.name}</td>
                      <td className="py-2">
                        ₹{item.card.info.price ? item.card.info.price / 100 : item.card.info.defaultPrice / 100}
                      </td>
                      <td className="py-2">{item.quantity}</td>
                      <td className="py-2">
                        ₹{((item.card.info.price ? item.card.info.price : item.card.info.defaultPrice) * item.quantity / 100).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total Price */}
            <div className="text-right text-xl font-bold text-gray-800 mb-2">
              Total: ₹{
                cartItems.reduce((sum, item) => sum + ((item.card.info.price ? item.card.info.price : item.card.info.defaultPrice) * item.quantity / 100), 0).toFixed(2)
              }
            </div>

            {/* Quantity controls still available below if needed */}
            <ItemList items={cartItems} />
          </>
        )}
      </div>
    </div>
  );
};

export default Cart;
