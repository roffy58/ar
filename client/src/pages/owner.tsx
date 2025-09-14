import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Order {
  id: number;
  customer_name: string;
  dish_id: string;
  status: string;
  dishes?: { name: string };
}

export default function OwnerDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);

  const fetchOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select("id, customer_name, status, dishes(name)")
      .eq("status", "pending");

    if (data) setOrders(data as Order[]);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const completeOrder = async (id: number) => {
    await supabase.from("orders").update({ status: "completed" }).eq("id", id);
    fetchOrders(); // refresh after update
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">📋 Owner Dashboard</h1>
      {orders.length === 0 ? (
        <p>No pending orders</p>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li key={order.id} className="p-4 bg-gray-100 rounded flex justify-between items-center">
              <div>
                <p><strong>Customer:</strong> {order.customer_name}</p>
                <p><strong>Dish:</strong> {order.dishes?.name}</p>
              </div>
              <button
                onClick={() => completeOrder(order.id)}
                className="px-4 py-2 bg-green-500 text-white rounded"
              >
                ✅ Complete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
