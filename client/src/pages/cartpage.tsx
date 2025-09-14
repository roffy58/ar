import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

interface Dish {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export default function CartPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { restaurantId, cartItems } = location.state || {}; // 👈 MenuPage se data milega
  const [cart, setCart] = useState<Dish[]>(cartItems || []);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const updateQuantity = (id: string, change: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + change) }
          : item
      )
    );
  };

  const placeOrder = async () => {
    if (!restaurantId || cart.length === 0) {
      setMessage("❌ Cart is empty or restaurant not found!");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("orders").insert([
      {
        restaurant_id: restaurantId,
        items: cart,
        status: "pending",
        created_at: new Date(),
      },
    ]);

    setLoading(false);

    if (error) {
      console.error(error);
      setMessage("❌ Failed to place order, try again!");
    } else {
      setMessage("✅ Order placed successfully!");
      setTimeout(() => navigate("/"), 2000); // 2 sec baad LandingPage pe wapas
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6">
      <h1 className="text-2xl font-bold mb-4">Your Cart</h1>

      {cart.length === 0 ? (
        <p className="text-gray-600">Your cart is empty.</p>
      ) : (
        <div className="w-full max-w-md bg-white shadow-md rounded-xl p-4">
          {cart.map((item) => (
            <div
              key={item.id}
              className="flex justify-between items-center border-b py-3"
            >
              <div>
                <h2 className="text-lg font-semibold">{item.name}</h2>
                <p className="text-sm text-gray-500">
                  ₹{item.price} × {item.quantity}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => updateQuantity(item.id, -1)}
                  className="px-2 py-1 bg-gray-200 rounded"
                >
                  –
                </button>
                <span>{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, 1)}
                  className="px-2 py-1 bg-gray-200 rounded"
                >
                  +
                </button>
              </div>
            </div>
          ))}

          <div className="flex justify-between font-bold mt-4">
            <span>Total:</span>
            <span>
              ₹
              {cart.reduce(
                (sum, item) => sum + item.price * item.quantity,
                0
              )}
            </span>
          </div>

          <button
            onClick={placeOrder}
            disabled={loading}
            className="mt-6 w-full bg-green-600 text-white py-2 rounded-xl hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Placing..." : "Place Order"}
          </button>
        </div>
      )}

      {message && <p className="mt-4 text-center">{message}</p>}
    </div>
  );
}
