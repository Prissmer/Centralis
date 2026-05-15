import { supabase } from "../lib/supabase";

export const getUserRole = async (id) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;

  return data.role;
};