// ===== TELA DO CLIENTE =====
let dados = {}; // Começa vazio para ser preenchido pela nuvem
let carrinho = []; // lista de { id, qtd }

// ----- Inicialização assíncrona -----
async function iniciarCliente() {
  dados = await carregarDados(); // Aguarda os dados chegarem do Supabase
  mostrarCardapio();
  mostrarCarrinho();
}

// ----- Cardápio -----
function mostrarCardapio() {
  if (!dados || !dados.pizzaria) return;
  document.getElementById("nomePizzaria").textContent = dados.pizzaria.nome;

  const banner = document.getElementById("banner");
  if (dados.banner && dados.banner.ativo && dados.banner.texto) {
    banner.textContent = dados.banner.texto;
    banner.style.display = "block";
  } else if (banner) {
    banner.style.display = "none";
  }

  const area = document.getElementById("cardapio");
  if (!area) return;
  area.innerHTML = "";

  if (!dados.categorias || !dados.produtos) return;

  dados.categorias.forEach(function (cat) {
    const itens = dados.produtos.filter(p => p.categoria === cat && p.disponivel);
    if (itens.length === 0) return;

    let html = `<h2>${cat}</h2><div class="grade">`;
    itens.forEach(function (p) {
      let preco = `<span class="preco">${formatarPreco(p.preco)}</span>`;
      let selo = "";
      if (p.desconto > 0) {
        preco = `<span class="preco-antigo">${formatarPreco(p.preco)}</span>
                 <span class="preco">${formatarPreco(precoFinal(p))}</span>`;
        selo = `<span class="selo">-${p.desconto}%</span>`;
      }
      html += `
        <div class="card">
          ${selo}
          <img class="foto" src="${imagemDoProduto(p)}" alt="${p.nome}">
          <h3>${p.nome}</h3>
          <p>${p.descricao}</p>
          <div>${preco}</div>
          <button class="btn" onclick="adicionar(${p.id})">Adicionar</button>
        </div>`;
    });
    html += "</div>";
    area.innerHTML += html;
  });
}

// ----- Carrinho -----
function adicionar(id) {
  const item = carrinho.find(i => i.id === id);
  if (item) item.qtd++;
  else carrinho.push({ id: id, qtd: 1 });
  mostrarCarrinho();
}

function alterarQtd(id, mudanca) {
  const item = carrinho.find(i => i.id === id);
  if (!item) return;
  item.qtd += mudanca;
  if (item.qtd <= 0) carrinho = carrinho.filter(i => i.id !== id);
  mostrarCarrinho();
}

function calcularSubtotal() {
  let total = 0;
  carrinho.forEach(function (item) {
    const p = dados.produtos.find(prod => prod.id === item.id);
    if (p) total += precoFinal(p) * item.qtd;
  });
  return total;
}

// Retorna o valor da taxa de entrega atual (0 se for retirada)
function obterTaxaEntrega() {
  const tipoSelect = document.getElementById("tipoEntrega");
  if (tipoSelect && tipoSelect.value === "retirada") {
    return 0;
  }
  return dados.taxaEntrega || 0;
}

// Controla o comportamento ao mudar entre Entrega e Retirada
function atualizarTipoEntrega() {
  const tipo = document.getElementById("tipoEntrega").value;
  const campoEndereco = document.getElementById("enderecoCliente");

  if (tipo === "retirada") {
    campoEndereco.value = "Retirada no Estabelecimento";
    campoEndereco.disabled = true;
  } else {
    campoEndereco.value = "";
    campoEndereco.disabled = false;
  }
  mostrarCarrinho();
}

// Barra fixa no rodapé (só aparece no celular, via CSS)
function atualizarBarra() {
  const barra = document.getElementById("barraCarrinho");
  if (!barra) return;
  let qtd = 0;
  carrinho.forEach(item => qtd += item.qtd);

  if (qtd === 0) {
    barra.classList.remove("visivel");
    return;
  }
  document.getElementById("barraQtd").textContent = qtd + (qtd === 1 ? " item" : " itens");
  
  const subtotal = calcularSubtotal();
  const taxa = obterTaxaEntrega();
  document.getElementById("barraTotal").textContent = formatarPreco(subtotal + taxa);
  barra.classList.add("visivel");
}

function mostrarCarrinho() {
  atualizarBarra();
  const lista = document.getElementById("itensCarrinho");
  const totaisEl = document.getElementById("totais");
  if (!lista) return;
  lista.innerHTML = "";

  if (carrinho.length === 0) {
    lista.innerHTML = "<p>Seu carrinho está vazio.</p>";
    if (totaisEl) totaisEl.style.display = "none";
    return;
  }

  carrinho.forEach(function (item) {
    const p = dados.produtos.find(prod => prod.id === item.id);
    if (!p) return;
    lista.innerHTML += `
      <div class="linha-carrinho">
        <span>${p.nome}</span>
        <span>
          <button onclick="alterarQtd(${p.id}, -1)">-</button>
          ${item.qtd}
          <button onclick="alterarQtd(${p.id}, 1)">+</button>
        </span>
        <span>${formatarPreco(precoFinal(p) * item.qtd)}</span>
      </div>`;
  });

  const subtotal = calcularSubtotal();
  const taxa = obterTaxaEntrega();

  if (totaisEl) totaisEl.style.display = "block";
  document.getElementById("subtotal").textContent = formatarPreco(subtotal);
  document.getElementById("entrega").textContent = formatarPreco(taxa);
  document.getElementById("total").textContent = formatarPreco(subtotal + taxa);
}

// ----- Finalizar pedido via WhatsApp -----
function finalizarPedido() {
  const nome = document.getElementById("nomeCliente").value.trim();
  const telefone = document.getElementById("telefoneCliente").value.trim();
  const endereco = document.getElementById("enderecoCliente").value.trim();
  const tipoEntrega = document.getElementById("tipoEntrega") ? document.getElementById("tipoEntrega").value : "entrega";
  const formaPagamento = document.getElementById("pagamento").value;
  const observacao = document.getElementById("obsCliente").value.trim();

  if (carrinho.length === 0) { alert("Adicione itens ao carrinho!"); return; }
  
  if (nome === "" || telefone === "" || (tipoEntrega === "entrega" && endereco === "")) {
    alert("Preencha nome, telefone e endereço.");
    return;
  }

  const subtotal = calcularSubtotal();
  const taxaAtual = obterTaxaEntrega();
  const totalGeral = subtotal + taxaAtual;

  let mensagem = `🍕 *NOVO PEDIDO* 🍕\n\n`;
  mensagem += `👤 *Cliente:* ${nome}\n`;
  mensagem += `📞 *Telefone:* ${telefone}\n`;
  mensagem += `📍 *Tipo:* ${tipoEntrega === "retirada" ? "Retirada no Balcão" : "Entrega em Domicílio"}\n`;
  if (tipoEntrega === "entrega") {
    mensagem += `🏠 *Endereço:* ${endereco}\n`;
  }
  mensagem += `💳 *Pagamento:* ${formaPagamento}\n`;
  if (observacao) {
    mensagem += `📝 *Obs:* ${observacao}\n`;
  }
  
  mensagem += `\n🛒 *ITENS DO PEDIDO:*\n`;
  carrinho.forEach(function (item) {
    const p = dados.produtos.find(prod => prod.id === item.id);
    if (!p) return;
    const totalItem = precoFinal(p) * item.qtd;
    mensagem += `• ${item.qtd}x ${p.nome} - ${formatarPreco(totalItem)}\n`;
  });

  mensagem += `\n📦 Subtotal: ${formatarPreco(subtotal)}\n`;
  mensagem += `🚚 Entrega: ${formatarPreco(taxaAtual)}\n`;
  mensagem += `💰 *TOTAL: ${formatarPreco(totalGeral)}*`;

  const numeroWhatsApp = dados.pizzaria && dados.pizzaria.whatsapp ? dados.pizzaria.whatsapp : "5511999999999"; 
  const urlWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensagem)}`;

  window.open(urlWhatsApp, "_blank");
}

// ----- Executa a inicialização ao carregar a página -----
window.addEventListener("DOMContentLoaded", iniciarCliente);
