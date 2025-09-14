import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";

export default function ManageOrders() {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    const { data, error } = await supabase.from("orders").select("*");
    if (error) console.error(error);
    else setOrders(data);
  }

  async function markComplete(id: string) {
    const { error } = await supabase.from("orders").update({ status: "completed" }).eq("id", id);
    if (error) console.error(error);
    else fetchOrders();
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">📦 Manage Orders</h1>
      <ul>
        {orders.map((order) => (
          <li key={order.id} className="flex justify-between border-b py-2">
            {order.customer_name} - {order.status}
            {order.status !== "completed" && (
              <button
                onClick={() => markComplete(order.id)}
                className="px-3 py-1 bg-green-500 text-white rounded"
              >
                ✅ Complete
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
