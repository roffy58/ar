import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import ar-veiwer.tsx from "../components/ar-viewer.tsx";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

interface Dish {
  id: string;
  name: string;
  price: number;
  image_url: string;
}

export default function MenuPage() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDishes = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("dishes")
        .select("*")
        .eq("restaurant_id", restaurantId);

      if (error) {
        console.error("Error fetching dishes:", error);
      } else {
        setDishes(data as Dish[]);
      }
      setLoading(false);
    };

    fetchDishes();
  }, [restaurantId]);

  const addToCart = (dish: Dish) => {
    setCart((prev) => {
      const existing = prev.find((item: any) => item.id === dish.id);
      if (existing) {
        return prev.map((item: any) =>
          item.id === dish.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...dish, quantity: 1 }];
    });
  };

  const goToCart = () => {
    navigate("/cart", { state: { restaurantId, cartItems: cart } });
  };

  if (loading) {
    return <p className="p-6">Loading menu...</p>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold mb-6">Menu</h1>

      {dishes.length === 0 ? (
        <p>No dishes found for this restaurant.</p>
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {dishes.map((dish) => (
            <div
              key={dish.id}
              className="bg-white shadow rounded-xl overflow-hidden"
            >
              {dish.image_url && (
                <img
                  src={dish.image_url}
                  alt={dish.name}
                  className="h-40 w-full object-cover"
                />
              )}
              <div className="p-4">
                <h2 className="text-lg font-semibold">{dish.name}</h2>
                <p className="text-gray-600">₹{dish.price}</p>
                <button
                  onClick={() => addToCart(dish)}
                  className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {cart.length > 0 && (
        <div className="fixed bottom-6 left-0 right-0 flex justify-center">
          <button
            onClick={goToCart}
            className="px-6 py-3 bg-green-600 text-white rounded-xl shadow-lg hover:bg-green-700"
          >
            Go to Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)})
          </button>
        </div>
      )}
    </div>
  );
}
