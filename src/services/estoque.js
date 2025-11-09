import { supabase } from "../lib/supabaseClient";

// Lista todos os itens de estoque
export const listarEstoque = async () => {
  const { data, error } = await supabase
    .from("estoque")
    .select("*")
    .order("id", { ascending: true });

  if (error) throw error;
  return data;
};

// Lista histórico de movimentações
export const listarHistoricoEstoque = async () => {
  const { data, error } = await supabase
    .from("historico_estoque")
    .select("*")
    .order("id", { ascending: true });

  if (error) throw error;
  return data;
};

// Cria novo item no estoque
export const criarItemEstoque = async (item) => {
  const { data, error } = await supabase
    .from("estoque")
    .insert([item])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Atualiza um item existente
export const atualizarItemEstoque = async (id, item) => {
  const { data, error } = await supabase
    .from("estoque")
    .update(item)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Deleta item do estoque
export const deletarItemEstoque = async (id) => {
  const { error } = await supabase
    .from("estoque")
    .delete()
    .eq("id", id);

  if (error) throw error;
};

// Registra movimentação no histórico
export const registrarMovimentacaoEstoque = async (movimento) => {
  const { data, error } = await supabase
    .from("historico_estoque")
    .insert([movimento])
    .select()
    .single();

  if (error) throw error;
  return data;
};
