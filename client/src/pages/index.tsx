import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import ARCarousel from "@/components/ARCarousel";

interface Dish {
  id: string;
  name: string;
  description: string;
  price: string;
  image?: string;
  glbModel?: string;
  usdzModel?: string;
}

export default function Home() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [customerName, setCustomerName] = useState("");

  useEffect(() => {
    const fetchDishes = async () => {
      const { data } = await supabase.from("dishes").select("*");
      if (data) setDishes(data);
    };
    fetchDishes();
  }, []);

  const placeOrder = async (dishId: string) => {
    if (!customerName) {
      alert("Please enter your name before ordering!");
      return;
    }
    await supabase.from("orders").insert([{ customer_name: customerName, dish_id: dishId, status: "pending" }]);
    alert("✅ Order placed successfully!");
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-center mb-4">🍴 AR Menu</h1>
      <input
        type="text"
        placeholder="Enter your name"
        className="border p-2 rounded w-full mb-4"
        value={customerName}
        onChange={(e) => setCustomerName(e.target.value)}
      />
      <ARCarousel dishes={dishes} onOrder={placeOrder} />
    </div>
  );
}
