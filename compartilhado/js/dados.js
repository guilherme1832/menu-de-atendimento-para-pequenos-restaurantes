// ===== MÓDULO DE DADOS NUVEM (Supabase Realtime) =====
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';

// Credenciais do Supabase configuradas
const SUPABASE_URL = 'https://amzfsqstrogqrvgmhtxb.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_z5plbE-ChWuz-lh1Kxzo4g_IaA34-Fk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const DADOS_PADRAO = {
  pizzaria: { 
    nome: "Minha Pizzaria", 
    pixChave: "", 
    pixNome: "", 
    pixCidade: "",
    whatsapp: "5581999999999"
  },
  taxaEntrega: 5.00,
  prazoPixMinutos: 10,
  banner: { ativo: false, texto: "" },
  categorias: ["Pizzas Salgadas", "Pizzas Doces", "Bebidas"],
  produtos: [
    {
      id: 1,
      nome: "Pizza Calabresa",
      descricao: "Molho, mussarela e calabresa",
      categoria: "Pizzas Salgadas",
      preco: 45.00,
      desconto: 0,
      disponivel: true,
      imagem: ""
    }
  ]
};

// Carrega os dados diretamente da nuvem
export async function carregarDados() {
  try {
    const { data, error } = await supabase
      .from('dados_pizzaria')
      .select('*')
      .eq('id', 'principal')
      .single();
    
    if (error || !data) {
      // Se não existir na nuvem ainda, cria com os dados padrão
      await salvarDados(DADOS_PADRAO);
      return DADOS_PADRAO;
    }
    return data.conteudo;
  } catch (erro) {
    console.error("Erro ao carregar da nuvem, a usar padrão local:", erro);
    return DADOS_PADRAO;
  }
}

// Salva as alterações diretamente na nuvem
export async function salvarDados(dados) {
  try {
    const { error } = await supabase
      .from('dados_pizzaria')
      .upsert({ id: 'principal', conteudo: dados, atualizado_em: new Date() });
    
    if (error) throw error;
    return true;
  } catch (erro) {
    console.error("Erro ao salvar na nuvem:", erro);
    alert("Erro ao salvar na nuvem. Verifica a tua conexão.");
    return false;
  }
}

// Restaura os dados para o padrão original na nuvem
export async function resetarDados() {
  try {
    await salvarDados(DADOS_PADRAO);
    return DADOS_PADRAO;
  } catch (erro) {
    console.error("Erro ao resetar dados:", erro);
    return DADOS_PADRAO;
  }
}

// Gestão de Pedidos na Nuvem
export async function carregarPedidosNuvem() {
  try {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .eq('id', 'pedidos_geral')
      .single();
    
    if (error || !data) {
      return [];
    }
    return data.conteudo.lista || [];
  } catch (erro) {
    console.error("Erro ao carregar pedidos:", erro);
    return [];
  }
}

export async function salvarPedidosNuvem(pedidos) {
  try {
    const { error } = await supabase
      .from('pedidos')
      .upsert({ id: 'pedidos_geral', conteudo: { lista: pedidos }, criado_em: new Date() });
    
    if (error) throw error;
    return true;
  } catch (erro) {
    console.error("Erro ao salvar pedidos:", erro);
    return false;
  }
}

// Opcional: Escutar novos pedidos em tempo real (caso queiras usar no painel)
export function escutarPedidosNuvem(callback) {
  return supabase
    .channel('public:pedidos')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, payload => {
      if (payload.new && payload.new.conteudo) {
        callback(payload.new.conteudo.lista || []);
      }
    })
    .subscribe();
}

// Funções utilitárias (mantidas idênticas ao original)
export function formatarPreco(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function precoFinal(produto) {
  const preco = Number(produto.preco || 0);
  const desconto = Number(produto.desconto || 0);
  if (desconto > 0) {
    return preco - (preco * desconto / 100);
  }
  return preco;
}

export function imagemDoProduto(produto) {
  if (produto && produto.imagem && produto.imagem.trim() !== "") {
    return produto.imagem;
  }
  return "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%23ccc' stroke-width='2'><rect width='18' height='18' x='3' y='3' rx='2' ry='2'/><circle cx='9' cy='9' r='2'/><path d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'/></svg>";
}