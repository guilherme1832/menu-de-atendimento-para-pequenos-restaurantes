// ===== DADOS COMPARTILHADOS (lido pelo cliente e editado pelo painel do desenvolvedor) =====
const CHAVE = "pizzariaDados";

// Dados iniciais (Altere aqui as suas pizzas e produtos para aparecerem no telemóvel!)
const DADOS_PADRAO = {
  pizzaria: { nome: "Restaurante do Bode", pixChave: "", pixNome: "", pixCidade: "" },
  taxaEntrega: 6,
  prazoPixMinutos: 10,
  banner: { ativo: true, texto: "Bem-vindo ao nosso atendimento online!" },
  categorias: ["Pizzas", "Almoço", "Bebidas", "Sobremesas"], 
  produtos: [
    {
      id: 1,
      nome: "Pizza de Calabresa",
      descricao: "Molho de tomate, muçarela, calabresa fatiada e cebola.",
      preco: 35.00,
      desconto: 0,
      disponivel: true,
      categoria: "Pizzas",
      imagem: ""
    },
    {
      id: 2,
      nome: "Pizza Quatro Queijos",
      descricao: "Muçarela, gorgonzola, parmesão e provolone.",
      preco: 42.00,
      desconto: 0,
      disponivel: true,
      categoria: "Pizzas",
      imagem: ""
    }
  ]
};

function carregarDados() {
  const salvo = localStorage.getItem(CHAVE);
  if (salvo) {
    const dadosSalvos = JSON.parse(salvo);
    // Se o painel guardou dados mas a lista de produtos estiver vazia, usa o padrão
    if (!dadosSalvos.produtos || dadosSalvos.produtos.length === 0) {
      dadosSalvos.produtos = DADOS_PADRAO.produtos;
    }
    dadosSalvos.produtos.forEach(function (p) {
      if (p.imagem && p.imagem.startsWith("img/")) p.imagem = "../compartilhado/" + p.imagem;
      if (p.imagem === undefined) {
        const padrao = DADOS_PADRAO.produtos.find(x => x.id === p.id);
        p.imagem = padrao ? padrao.imagem : "";
      }
    });
    return dadosSalvos;
  }
  // Se não houver nada no localStorage (como no telemóvel), retorna os dados padrão com as pizzas!
  return JSON.parse(JSON.stringify(DADOS_PADRAO));
}

function salvarDados(dados) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(dados));
    return true;
  } catch (erro) {
    alert("Não foi possível salvar: o armazenamento do navegador está cheio.");
    return false;
  }
}

function resetarDados() {
  localStorage.removeItem(CHAVE);
}

// ===== PEDIDOS (guardados separados do cardápio) =====
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
