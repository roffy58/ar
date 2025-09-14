import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";

export default function ManageDishes() {
  const [dishes, setDishes] = useState<any[]>([]);
  const [newDish, setNewDish] = useState({ name: "", price: "", description: "" });

  useEffect(() => {
    fetchDishes();
  }, []);

  async function fetchDishes() {
    const { data, error } = await supabase.from("dishes").select("*");
    if (error) console.error(error);
    else setDishes(data);
  }

  async function addDish() {
    const { error } = await supabase.from("dishes").insert([newDish]);
    if (error) console.error(error);
    else {
      setNewDish({ name: "", price: "", description: "" });
      fetchDishes();
    }
  }

  async function deleteDish(id: string) {
    const { error } = await supabase.from("dishes").delete().eq("id", id);
    if (error) console.error(error);
    else fetchDishes();
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">🍽 Manage Dishes</h1>
      <div className="mb-6">
        <input
          className="border p-2 mr-2"
          placeholder="Dish Name"
          value={newDish.name}
          onChange={(e) => setNewDish({ ...newDish, name: e.target.value })}
        />
        <input
          className="border p-2 mr-2"
          placeholder="Price"
          value={newDish.price}
          onChange={(e) => setNewDish({ ...newDish, price: e.target.value })}
        />
        <input
          className="border p-2 mr-2"
          placeholder="Description"
          value={newDish.description}
          onChange={(e) => setNewDish({ ...newDish, description: e.target.value })}
        />
        <button onClick={addDish} className="px-4 py-2 bg-blue-500 text-white rounded">
          ➕ Add Dish
        </button>
      </div>
      <ul>
        {dishes.map((dish) => (
          <li key={dish.id} className="flex justify-between border-b py-2">
            {dish.name} - ₹{dish.price}
            <button
              onClick={() => deleteDish(dish.id)}
              className="px-3 py-1 bg-red-500 text-white rounded"
            >
              ❌ Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
