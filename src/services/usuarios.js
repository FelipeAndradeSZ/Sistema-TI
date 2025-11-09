import { supabase } from "../lib/supabaseClient";

export const listarUsuarios = async () => {
  const { data, error } = await supabase
    .from("usuarios")
    .select("*")
    .order("id", { ascending: true });

  if (error) throw error;
  return data;
};

export const autenticarUsuario = async (email, senha) => {
  const { data, error } = await supabase
    .from("usuarios")
    .select("*")
    .eq("email", email)
    .eq("senha", senha)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const criarUsuario = async (usuario) => {
  const { data, error } = await supabase
    .from("usuarios")
    .insert([usuario])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const atualizarUsuario = async (id, usuario) => {
  const { data, error } = await supabase
    .from("usuarios")
    .update(usuario)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};
