import { supabase } from "../lib/supabaseClient";

export const listarChamados = async () => {
  const { data, error } = await supabase
    .from("chamados")
    .select("*")
    .order("id", { ascending: true });

  if (error) throw error;
  return data;
};

export const criarChamado = async (chamado) => {
  const { data, error } = await supabase
    .from("chamados")
    .insert([chamado])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const atualizarChamado = async (id, chamado) => {
  const { data, error } = await supabase
    .from("chamados")
    .update(chamado)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deletarChamado = async (id) => {
  const { error } = await supabase
    .from("chamados")
    .delete()
    .eq("id", id);

  if (error) throw error;
};
