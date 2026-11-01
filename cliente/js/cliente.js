// ===== TELA DO CLIENTE =====
const dados = carregarDados();
let carrinho = []; // lista de { id, qtd }

// ----- Cardápio -----
function mostrarCardapio() {
  document.getElementById("nomePizzaria").textContent = dados.pizzaria.nome;

  const banner = document.getElementById("banner");
  if (dados.banner.ativo && dados.banner.texto) {
    banner.textContent = dados.banner.texto;
  } else {
    banner.style.display = "none";
  }

  const area = document.getElementById("cardapio");
  area.innerHTML = "";

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
  item.qtd += mudanca;
  if (item.qtd <= 0) carrinho = carrinho.filter(i => i.id !== id);
  mostrarCarrinho();
}

function calcularSubtotal() {
  let total = 0;
  carrinho.forEach(function (item) {
    const p = dados.produtos.find(prod => prod.id === item.id);
    total += precoFinal(p) * item.qtd;
  });
  return total;
}

// Retorna o valor da taxa de entrega atual (0 se for retirada)
function obterTaxaEntrega() {
  const tipoSelect = document.getElementById("tipoEntrega");
  if (tipoSelect && tipoSelect.value === "retirada") {
    return 0;
  }
  return dados.taxaEntrega;
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
  lista.innerHTML = "";

  if (carrinho.length === 0) {
    lista.innerHTML = "<p>Seu carrinho está vazio.</p>";
    document.getElementById("totais").style.display = "none";
    return;
  }

  carrinho.forEach(function (item) {
    const p = dados.produtos.find(prod => prod.id === item.id);
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

  document.getElementById("totais").style.display = "block";
  document.getElementById("subtotal").textContent = formatarPreco(subtotal);
  document.getElementById("entrega").textContent = formatarPreco(taxa);
  document.getElementById("total").textContent = formatarPreco(subtotal + taxa);
}

// ----- Finalizar pedido (tudo pelo site) -----
function finalizarPedido() {
  const nome = document.getElementById("nomeCliente").value.trim();
  const telefone = document.getElementById("telefoneCliente").value.trim();
  const endereco = document.getElementById("enderecoCliente").value.trim();
  const tipoEntrega = document.getElementById("tipoEntrega") ? document.getElementById("tipoEntrega").value : "entrega";

  if (carrinho.length === 0) { alert("Adicione itens ao carrinho!"); return; }
  
  if (nome === "" || telefone === "" || (tipoEntrega === "entrega" && endereco === "")) {
    alert("Preencha nome, telefone e endereço.");
    return;
  }

  const itens = carrinho.map(function (item) {
    const p = dados.produtos.find(prod => prod.id === item.id);
    return { nome: p.nome, qtd: item.qtd, subtotal: precoFinal(p) * item.qtd };
  });

  const subtotal = calcularSubtotal();
  const taxaAtual = obterTaxaEntrega();
  const ehPix = document.getElementById("pagamento").value.startsWith("Pix");
  const prazo = dados.prazoPixMinutos || 10;
  const pedidos = carregarPedidos();
  
  const pedido = {
    numero: pedidos.length + 1,
    data: new Date().toLocaleString("pt-BR"),
    cliente: nome,
    telefone: telefone,
    endereco: endereco,
    tipoEntrega: tipoEntrega === "retirada" ? "Retirada no Balcão" : "Entrega em Domicílio",
    pagamento: document.getElementById("pagamento").value,
    observacao: document.getElementById("obsCliente").value.trim(),
    itens: itens,
    subtotal: subtotal,
    entrega: taxaAtual,
    total: subtotal + taxaAtual,
    status: "Recebido",
    pagamentoStatus: ehPix ? "Pendente" : "Na entrega",
    expiraEm: ehPix ? Date.now() + prazo * 60 * 1000 : null
  };

  pedidos.push(pedido);
  salvarPedidos(pedidos);
  carrinho = [];
  atualizarBarra();
  mostrarConfirmacao(pedido);
}

function mostrarConfirmacao(pedido) {
  let html = `<h2>✅ Pedido confirmado!</h2>
    <p>Número do pedido: <strong>#${pedido.numero}</strong></p>
    <p>Tipo: <strong>${pedido.tipoEntrega || 'Entrega'}</strong></p>
    <p>Guarde esse número para acompanhar.</p><ul class="resumo">`;
  
  pedido.itens.forEach(function (i) {
    html += `<li>${i.qtd}x ${i.nome} - ${formatarPreco(i.subtotal)}</li>`;
  });
  
  html += `</ul>
    <p>Entrega/Taxa: ${formatarPreco(pedido.entrega)}</p>
    <p><strong>Total: ${formatarPreco(pedido.total)}</strong></p>
    <p>Pagamento: ${pedido.pagamento}</p>`;

  const usaPix = pedido.pagamento.startsWith("Pix");
  if (usaPix) {
    html += `
      <div id="blocoPix" class="pix">
        <p><strong>Pague com Pix</strong></p>
        <p class="aviso-pix">⏳ Pagamento pendente. Pague dentro do prazo, senão o pedido será cancelado.</p>
        <p>Valor: ${formatarPreco(pedido.total)}</p>
        <p class="tempo">Tempo para pagar: <strong id="contador"></strong></p>
        <div id="qrcode"></div>
        <textarea id="codigoPix" rows="3" readonly></textarea>
        <button class="btn" onclick="copiarPix()">Copiar código Pix</button>
      </div>`;
  }
  html += `<button class="btn" onclick="novoPedido()">Fazer novo pedido</button>`;

  document.getElementById("areaPedido").style.display = "none";
  const conf = document.getElementById("areaConfirmacao");
  conf.innerHTML = html;
  conf.style.display = "block";

  if (usaPix) {
    mostrarPix(pedido);
    iniciarContador(pedido);
  }
}

// ----- Contagem regressiva do Pix -----
let timerPix = null;

function iniciarContador(pedido) {
  if (!document.getElementById("contador")) return;

  function atualizar() {
    const salvo = carregarPedidos().find(p => p.numero === pedido.numero);
    const bloco = document.getElementById("blocoPix");
    const restante = pedido.expiraEm - Date.now();

    if (!salvo) return;

    if (salvo.pagamentoStatus === "Pago") {
      clearInterval(timerPix);
      bloco.innerHTML = "<p>✅ Pagamento confirmado! Seu pedido já vai para o preparo.</p>";
    } else if (restante <= 0 || salvo.pagamentoStatus === "Expirado") {
      clearInterval(timerPix);
      verificarExpirados();
      bloco.innerHTML = "<p>⌛ Tempo esgotado! O pedido foi cancelado. Faça um novo pedido.</p>";
    } else {
      document.getElementById("contador").textContent = formatarTempo(restante);
    }
  }

  atualizar();
  timerPix = setInterval(atualizar, 1000);
}

// ----- Pix -----
function mostrarPix(pedido) {
  const p = dados.pizzaria;
  if (!p.pixChave) {
    document.getElementById("blocoPix").innerHTML = "<p>⚠️ O restaurante ainda não configurou a chave Pix.</p>";
    return;
  }
  const codigo = gerarPix(p.pixChave, p.pixNome || p.nome, p.pixCidade || "Brasil", pedido.total, "PEDIDO" + pedido.numero);
  document.getElementById("codigoPix").value = codigo;
  new QRCode(document.getElementById("qrcode"), { text: codigo, width: 200, height: 200 });
}

function copiarPix() {
  document.getElementById("codigoPix").select();
  document.execCommand("copy");
  alert("Código Pix copiado! Cole no app do seu banco.");
}

function novoPedido() {
  clearInterval(timerPix);
  document.getElementById("areaConfirmacao").style.display = "none";
  document.getElementById("areaPedido").style.display = "flex";
  mostrarCarrinho();
}

// ----- Acompanhar pedido -----
function consultarPedido() {
  verificarExpirados();
  const numero = Number(document.getElementById("numConsulta").value);
  const pedido = carregarPedidos().find(p => p.numero === numero);
  const resultado = document.getElementById("resultadoConsulta");

  if (pedido) {
    let texto = `Pedido #${pedido.numero} (${pedido.cliente}): ${pedido.status}`;
    if (pedido.pagamentoStatus === "Expirado") {
      texto += " | ⌛ Prazo de pagamento esgotado";
    } else if (pedido.pagamentoStatus === "Pendente" && pedido.status !== "Cancelado") {
      texto += " | ⏳ Pagamento pendente";
    } else if (pedido.pagamentoStatus === "Pago") {
      texto += " | ✅ Pagamento confirmado";
    }
    resultado.textContent = texto;
  } else {
    resultado.textContent = "Pedido não encontrado.";
  }
}

// ----- Início -----
mostrarCardapio();
mostrarCarrinho();