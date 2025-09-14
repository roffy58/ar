import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

interface Order {
  id: string;
  restaurant_id: string;
  items: any[];
  status: string;
  created_at: string;
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // 👇 Ye baad me QR ya login se aayega
  const restaurantId = "demo-restaurant-123";

  useEffect(() => {
    fetchOrders();

    // Realtime subscription for new orders
    const channel = supabase
      .channel("orders-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          const newOrder = payload.new as Order;
          if (newOrder.restaurant_id === restaurantId) {
            setOrders((prev) => [newOrder, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching orders:", error);
    } else if (data) {
      setOrders(data as Order[]);
    }
    setLoading(false);
  };

  const markAsCompleted = async (id: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: "completed" })
      .eq("id", id);

    if (!error) {
      setOrders((prev) =>
        prev.map((order) =>
          order.id === id ? { ...order, status: "completed" } : order
        )
      );
    }
  };

  if (loading) {
    return <p className="p-6">Loading orders...</p>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      {orders.length === 0 ? (
        <p>No orders yet...</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white p-4 shadow rounded-lg border"
            >
              <p className="font-semibold">Order ID: {order.id}</p>
              <p className="text-sm text-gray-500">
                {new Date(order.created_at).toLocaleString()}
              </p>

              <div className="mt-2">
                {order.items.map((item: any, idx: number) => (
                  <p key={idx}>
                    🍽 {item.name} × {item.quantity}
                  </p>
                ))}
              </div>

              <p className="mt-2">
                Status:{" "}
                <span
                  className={`font-bold ${
                    order.status === "completed"
                      ? "text-green-600"
                      : "text-yellow-600"
                  }`}
                >
                  {order.status}
                </span>
              </p>

              {order.status !== "completed" && (
                <button
                  onClick={() => markAsCompleted(order.id)}
                  className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg"
                >
                  Mark as Completed
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
