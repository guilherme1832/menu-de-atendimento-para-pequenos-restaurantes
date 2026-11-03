// ===== TELA DO CLIENTE =====
import { 
  carregarDados, 
  carregarPedidosNuvem, 
  salvarPedidosNuvem, 
  formatarPreco, 
  precoFinal, 
  imagemDoProduto 
} from "../../compartilhado/js/dados.js";

let dados = null;
let carrinho = [];

// ----- Cardápio -----
function mostrarCardapio() {
  document.getElementById("nomePizzaria").textContent = dados.pizzaria.nome;

  const banner = document.getElementById("banner");
  if (banner && dados.banner.ativo && dados.banner.texto) {
    banner.textContent = dados.banner.texto;
    banner.style.display = "block";
  } else if (banner) {
    banner.style.display = "none";
  }

  const area = document.getElementById("cardapio");
  if (!area) return;
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
window.adicionar = function(id) {
  const item = carrinho.find(i => i.id === id);
  if (item) item.qtd++;
  else carrinho.push({ id: id, qtd: 1 });
  mostrarCarrinho();
};

window.alterarQtd = function(id, mudanca) {
  const item = carrinho.find(i => i.id === id);
  if (!item) return;
  item.qtd += mudanca;
  if (item.qtd <= 0) carrinho = carrinho.filter(i => i.id !== id);
  mostrarCarrinho();
};

function calcularSubtotal() {
  let total = 0;
  carrinho.forEach(function (item) {
    const p = dados.produtos.find(prod => prod.id === item.id);
    if (p) total += precoFinal(p) * item.qtd;
  });
  return total;
}

function obterTaxaEntrega() {
  const tipoSelect = document.getElementById("tipoEntrega");
  if (tipoSelect && tipoSelect.value === "retirada") {
    return 0;
  }
  return dados.taxaEntrega || 0;
}

window.atualizarTipoEntrega = function() {
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
};

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
  if (!lista) return;
  lista.innerHTML = "";

  const totaisEl = document.getElementById("totais");

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

// ----- Finalizar Pedido -----
window.finalizarPedido = async function() {
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
  
  const pedidos = await carregarPedidosNuvem();
  
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
  await salvarPedidosNuvem(pedidos);

  carrinho = [];
  atualizarBarra();
  mostrarConfirmacao(pedido);
};

function mostrarConfirmacao(pedido) {
  let html = `<h2>✅ Pedido realizado com sucesso!</h2>
    <p>Número do pedido: <strong>#${pedido.numero}</strong></p>
    <p>Tipo: <strong>${pedido.tipoEntrega || 'Entrega'}</strong></p>
    <ul class="resumo">`;
  
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
      <div id="blocoPix" class="pix" style="margin-top: 15px; padding: 15px; background: #f9f9f9; border-radius: 8px;">
        <p><strong>Pague com Pix para concluir</strong></p>
        <p class="aviso-pix">⏳ Escaneie o QR Code ou copie o código abaixo no app do seu banco.</p>
        <p>Valor: <strong>${formatarPreco(pedido.total)}</strong></p>
        <p class="tempo">Tempo para pagar: <strong id="contador"></strong></p>
        <div id="qrcode" style="display: flex; justify-content: center; margin: 10px 0;"></div>
        <textarea id="codigoPix" rows="3" readonly style="width: 100%; margin-bottom: 10px;"></textarea>
        <button class="btn" onclick="copiarPix()">Copiar código Pix</button>
      </div>`;
  }

  html += `
    <div style="margin-top: 20px;">
      <button class="btn" style="background-color: #25D366; color: white;" onclick="enviarWhatsApp(${pedido.numero})">
        💬 Enviar Pedido no WhatsApp
      </button>
    </div>
    <br>
    <button class="btn" onclick="novoPedido()">Fazer novo pedido</button>`;

  const areaPedido = document.getElementById("areaPedido");
  if (areaPedido) areaPedido.style.display = "none";
  
  const conf = document.getElementById("areaConfirmacao");
  if (conf) {
    conf.innerHTML = html;
    conf.style.display = "block";
  }

  if (usaPix) {
    mostrarPix(pedido);
    iniciarContador(pedido);
  }
}

// ----- Disparar WhatsApp -----
window.enviarWhatsApp = async function(numeroPedido) {
  const pedidos = await carregarPedidosNuvem();
  const pedido = pedidos.find(p => p.numero === numeroPedido);
  if (!pedido) return;

  const numeroZap = dados.pizzaria.whatsapp || "5581999999999";
  let textoZap = `*Olá! Acabei de fazer o Pedido #${pedido.numero}* %0A`;
  textoZap += `*Cliente:* ${pedido.cliente} %0A`;
  textoZap += `*Telefone:* ${pedido.telefone} %0A`;
  textoZap += `*Endereço:* ${pedido.endereco} %0A`;
  textoZap += `*Tipo:* ${pedido.tipoEntrega} %0A`;
  textoZap += `*Pagamento:* ${pedido.pagamento} %0A%0A*Itens:*%0A`;
  
  pedido.itens.forEach(i => {
    textoZap += `- ${i.qtd}x ${i.nome} (${formatarPreco(i.subtotal)}) %0A`;
  });
  
  textoZap += `%0A*Taxa:* ${formatarPreco(pedido.entrega)}`;
  textoZap += `%0A*Total:* ${formatarPreco(pedido.total)}`;

  window.open(`https://wa.me/${numeroZap}?text=${textoZap}`, "_blank");
};

// ----- Contagem Pix -----
let timerPix = null;

function iniciarContador(pedido) {
  if (!document.getElementById("contador")) return;

  async function atualizar() {
    const pedidos = await carregarPedidosNuvem();
    const salvo = pedidos.find(p => p.numero === pedido.numero);
    const bloco = document.getElementById("blocoPix");
    const restante = pedido.expiraEm - Date.now();

    if (!salvo) return;

    if (salvo.pagamentoStatus === "Pago") {
      clearInterval(timerPix);
      if (bloco) bloco.innerHTML = "<p>✅ Pagamento confirmado! Já podes enviar o pedido no WhatsApp abaixo.</p>";
    } else if (restante <= 0 || salvo.pagamentoStatus === "Expirado") {
      clearInterval(timerPix);
      if (bloco) bloco.innerHTML = "<p>⌛ Tempo esgotado! O pedido foi cancelado.</p>";
    } else {
      const contadorEl = document.getElementById("contador");
      if (contadorEl) contadorEl.textContent = formatarTempo(restante);
    }
  }

  atualizar();
  timerPix = setInterval(atualizar, 1000);
}

function formatarTempo(ms) {
  const segundos = Math.max(0, Math.floor(ms / 1000));
  const min = Math.floor(segundos / 60);
  const seg = segundos % 60;
  return `${min}:${seg < 10 ? "0" : ""}${seg}`;
}

// ----- Pix QR Code -----
function mostrarPix(pedido) {
  const p = dados.pizzaria;
  if (!p.pixChave) {
    const blocoPix = document.getElementById("blocoPix");
    if (blocoPix) blocoPix.innerHTML = "<p>⚠️ O restaurante ainda não configurou a chave Pix.</p>";
    return;
  }
  if (typeof gerarPix === "function") {
    const codigo = gerarPix(p.pixChave, p.pixNome || p.nome, p.pixCidade || "Brasil", pedido.total, "PEDIDO" + pedido.numero);
    const codigoPixEl = document.getElementById("codigoPix");
    if (codigoPixEl) codigoPixEl.value = codigo;
    
    const qrcodeEl = document.getElementById("qrcode");
    if (qrcodeEl && typeof QRCode !== "undefined") {
      qrcodeEl.innerHTML = "";
      new QRCode(qrcodeEl, { text: codigo, width: 200, height: 200 });
    }
  }
}

window.copiarPix = function() {
  const campo = document.getElementById("codigoPix");
  if (!campo) return;
  campo.select();
  document.execCommand("copy");
  alert("Código Pix copiado!");
};

window.novoPedido = function() {
  clearInterval(timerPix);
  const conf = document.getElementById("areaConfirmacao");
  const areaPedido = document.getElementById("areaPedido");
  if (conf) conf.style.display = "none";
  if (areaPedido) areaPedido.style.display = "flex";
  mostrarCarrinho();
};

// ----- Inicialização e Sincronização Automática -----
async function iniciarCliente() {
  dados = await carregarDados();
  mostrarCardapio();
  mostrarCarrinho();
}

iniciarCliente();

// Verifica atualizações na nuvem a cada 5 segundos para refletir o painel em tempo real
setInterval(async () => {
  const novosDados = await carregarDados();
  if (JSON.stringify(novosDados) !== JSON.stringify(dados)) {
    dados = novosDados;
    mostrarCardapio();
  }
}, 5000);