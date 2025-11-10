import { supabase } from "../lib/supabaseClient";

// Login: verifica email + senha na tabela usuarios
export const autenticarUsuario = async (email, senha) => {
  const { data, error } = await supabase
    .from("usuarios")
    .select("*")
    .eq("email", email)
    .eq("senha", senha)
    .single();

  if (error || !data) {
    return null;
  }

  // Só retorna se ativo
  if (data.ativo === false) return null;

  return data;
};

// Lista todos usuários (para área de configurações)
export const listarUsuarios = async () => {
  const { data, error } = await supabase
    .from("usuarios")
    .select("*")
    .order("nome", { ascending: true });

  if (error) {
    console.error("Erro ao listar usuários:", error);
    return [];
  }

  return data || [];
};

// Criar novo usuário
export const criarUsuario = async (usuario) => {
  const { data, error } = await supabase
    .from("usuarios")
    .insert([usuario])
    .select()
    .single();

  if (error) {
    console.error("Erro ao criar usuário:", error);
    throw error;
  }

  return data;
};

// Atualizar usuário (nome, email, senha, nivel, ativo, etc)
export const atualizarUsuario = async (id, updates) => {
  const { data, error } = await supabase
    .from("usuarios")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Erro ao atualizar usuário:", error);
    throw error;
  }

  return data;
};
