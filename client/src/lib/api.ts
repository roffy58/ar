import { supabase } from "./supabase";

export async function getDishesByRestaurant(restaurantId: string) {
  const { data, error } = await supabase
    .from("dishes")
    .select("id,name,price,description,image_url,model_url")
    .eq("restaurant_id", restaurantId)
    .order("ordinal", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
