import { supabase } from "../lib/supabaseClient";

export const listarEquipamentos = async () => {
  const { data, error } = await supabase
    .from("equipamentos")
    .select("*")
    .order("id", { ascending: true });

  if (error) throw error;
  return data;
};

export const criarEquipamento = async (equip) => {
  const { data, error } = await supabase
    .from("equipamentos")
    .insert([equip])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const atualizarEquipamento = async (id, equip) => {
  const { data, error } = await supabase
    .from("equipamentos")
    .update(equip)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deletarEquipamento = async (id) => {
  const { error } = await supabase
    .from("equipamentos")
    .delete()
    .eq("id", id);

  if (error) throw error;
};
