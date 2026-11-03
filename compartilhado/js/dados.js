// ===== SUPABASE CONFIGURAÇÃO (URL CORRIGIDA COM O SEU LINK REAL) =====
const SUPABASE_URL = "https://amzfsqstrogqrvgmhtxb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_z5plbE-ChWuz-lh1Kxzo4g_IaA34-Fk";

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
    const response = await fetch(`${SUPABASE_URL}/rest/v1/configuracoes?id=eq.1&select=dados`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const result = await response.json();
    const data = result[0];

    if (!data || !data.dados) {
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
    const response = await fetch(`${SUPABASE_URL}/rest/v1/configuracoes?id=eq.1`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ dados: dadosAtualizados })
    });

    if (!response.ok) {
      const errText = await response.text();
      alert("Erro ao guardar na nuvem: " + errText);
      return false;
    }

    localStorage.setItem(CHAVE_LOCAL, JSON.stringify(dadosAtualizados));
    return true;
  } catch (err) {
    console.error("Erro ao guardar:", err);
    return false;
  }
}

// ----- Salvar Configurações do Pix na Nuvem -----
async function salvarConfiguracoesPix(chavePix, pixNome, pixCidade) {
  if (!dados || !dados.pizzaria) {
    dados = await carregarDados();
  }

  dados.pizzaria.pixChave = chavePix;
  dados.pizzaria.pixNome = pixNome;
  dados.pizzaria.pixCidade = pixCidade;

  const sucesso = await salvarDados(dados);
  return sucesso;
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

// ===== PEDIDOS NA NUVEM (SUPABASE) =====
const CHAVE_PEDIDOS = "pizzariaPedidos";
const STATUS_PEDIDO = ["Recebido", "Em preparo", "Saiu para entrega", "Entregue", "Cancelado"];

// Carrega os pedidos da nuvem Supabase (com fallback para localStorage)
async function carregarPedidosNuvem() {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/configuracoes?id=eq.1&select=pedidos`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) return carregarPedidosLocal();

    const result = await response.json();
    const data = result[0];

    if (!data || !data.pedidos) return carregarPedidosLocal();

    return data.pedidos;
  } catch (err) {
    console.error("Erro ao carregar pedidos da nuvem:", err);
    return carregarPedidosLocal();
  }
}

// Salva os pedidos diretamente na nuvem Supabase e no localStorage
async function salvarPedidosNuvem(listaPedidos) {
  localStorage.setItem(CHAVE_PEDIDOS, JSON.stringify(listaPedidos));

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/configuracoes?id=eq.1`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ pedidos: listaPedidos })
    });

    return response.ok;
  } catch (err) {
    console.error("Erro ao salvar pedidos na nuvem:", err);
    return false;
  }
}

// Métodos de compatibilidade local antigos caso necessários
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
