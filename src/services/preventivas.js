import { supabase } from "../lib/supabaseClient";

export const listarPreventivas = async () => {
  const { data, error } = await supabase
    .from("preventivas")
    .select("*")
    .order("id", { ascending: true });

  if (error) throw error;
  return data;
};

export const criarPreventiva = async (preventiva) => {
  const { data, error } = await supabase
    .from("preventivas")
    .insert([preventiva])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const atualizarPreventiva = async (id, preventiva) => {
  const { data, error } = await supabase
    .from("preventivas")
    .update(preventiva)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deletarPreventiva = async (id) => {
  const { error } = await supabase
    .from("preventivas")
    .delete()
    .eq("id", id);

  if (error) throw error;
};
