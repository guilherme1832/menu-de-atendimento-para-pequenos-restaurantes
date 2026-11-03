// ===== SUPABASE CONFIGURAÇÃO =====
const SUPABASE_URL = "https://amzfsqstroggrvgmhtxb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_z5plbE-ChWuz-lh1Kxzo4g_IaA34-Fk";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const CHAVE_LOCAL = "pizzariaDados";

const DADOS_PADRAO = {
  "pizzaria": {
    "nome": "Minha Pizzaria",
    "pixChave": "",
    "pixNome": "",
    "pixCidade": "",
    "whatsapp": "5581999999999"
  },
  "taxaEntrega": 5.00,
  "prazoPixMinutos": 10,
  "banner": { "ativo": false, "texto": "" },
  "categorias": ["Pizzas Salgadas", "Pizzas Doces", "Bebidas"],
  "produtos": []
};

// Carrega os dados diretamente da nuvem Supabase
async function carregarDados() {
  try {
    const { data, error } = await supabaseClient
      .from('configuracoes')
      .select('dados')
      .eq('id', 1)
      .single();

    if (error || !data || !data.dados) {
      console.warn("A usar cache local/padrão devido a erro no Supabase:", error);
      const local = localStorage.getItem(CHAVE_LOCAL);
      return local ? JSON.parse(local) : DADOS_PADRAO;
    }

    localStorage.setItem(CHAVE_LOCAL, JSON.stringify(data.dados));
    return data.dados;
  } catch (err) {
    console.error("Erro na ligação ao Supabase:", err);
    const local = localStorage.getItem(CHAVE_LOCAL);
    return local ? JSON.parse(local) : DADOS_PADRAO;
  }
}

// Salva as alterações instantaneamente na nuvem
async function salvarDados(dadosAtualizados) {
  try {
    const { error } = await supabaseClient
      .from('configuracoes')
      .update({ dados: dadosAtualizados })
      .eq('id', 1);

    if (error) {
      alert("Erro ao guardar na nuvem: " + error.message);
      return false;
    }

    localStorage.setItem(CHAVE_LOCAL, JSON.stringify(dadosAtualizados));
    return true;
  } catch (err) {
    console.error("Erro ao guardar:", err);
    return false;
  }
}

// Funções utilitárias
function precoFinal(produto) {
  return produto.preco * (1 - (produto.desconto || 0) / 100);
}

function imagemDoProduto(produto) {
  if (produto.imagem) return produto.imagem;
  const svg = "<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200'><rect width='100%' height='100%' fill='#eee'/><text x='50%' y='50%' font-size='60' text-anchor='middle' dominant-baseline='middle'>🍕</text></svg>";
  return "data:image/svg+xml," + encodeURIComponent(svg);
}

function formatarPreco(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// ===== PEDIDOS LOCAL =====
const CHAVE_PEDIDOS = "pizzariaPedidos";
const STATUS_PEDIDO = ["Recebido", "Em preparo", "Saiu para entrega", "Entregue", "Cancelado"];

function carregarPedidos() {
  const salvo = localStorage.getItem(CHAVE_PEDIDOS);
  return salvo ? JSON.parse(salvo) : [];
}

function salvarPedidos(lista) {
  localStorage.setItem(CHAVE_PEDIDOS, JSON.stringify(lista));
}

function verificarExpirados() {
  const pedidos = carregarPedidos();
  let mudou = false;
  pedidos.forEach(function (p) {
    if (p.pagamentoStatus === "Pendente" && p.expiraEm && Date.now() > p.expiraEm) {
      p.pagamentoStatus = "Expirado";
      p.status = "Cancelado";
      mudou = true;
    }
  });
  if (mudou) salvarPedidos(pedidos);
  return mudou;
}

function formatarTempo(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const min = String(Math.floor(total / 60)).padStart(2, "0");
  const seg = String(total % 60).padStart(2, "0");
  return min + ":" + seg;
}
