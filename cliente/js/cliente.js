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

// ----- Finalizar pedido (Gera Pix na nuvem ou envia direto para o WhatsApp) -----
async function finalizarPedido() {
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

  // Se o pagamento for Pix, cria o pedido na nuvem e exibe a tela do QR Code
  if (formaPagamento.toLowerCase().includes("pix")) {
    const numeroPedido = Date.now().toString().slice(-6);
    const prazoMinutos = dados.prazoPixMinutos || 10;
    const expiraEm = Date.now() + (prazoMinutos * 60 * 1000);

    const novoPedido = {
      numero: Number(numeroPedido),
      data: new Date().toLocaleDateString("pt-BR") + " " + new Date().toLocaleTimeString("pt-BR", {hour: '2-digit', minute:'2-digit'}),
      cliente: nome,
      telefone: telefone,
      endereco: tipoEntrega === "retirada" ? "Retirada no Estabelecimento" : endereco,
      itens: carrinho.map(item => {
        const p = dados.produtos.find(prod => prod.id === item.id);
        return { id: item.id, nome: p ? p.nome : "Produto", qtd: item.qtd, preco: precoFinal(p) };
      }),
      subtotal: subtotal,
      taxaEntrega: taxaAtual,
      total: totalGeral,
      pagamento: "Pix",
      pagamentoStatus: "Pendente",
      status: "Aguardando Pagamento",
      expiraEm: expiraEm,
      observacao: observacao
    };

    // Salva o pedido diretamente na nuvem Supabase para aparecer no painel do administrador
    let listaPedidos = await carregarPedidosNuvem();
    listaPedidos.push(novoPedido);
    await salvarPedidosNuvem(listaPedidos);

    mostrarTelaPix(novoPedido);
    return;
  }

  // Demais formas de pagamento vão direto para o WhatsApp
  enviarParaWhatsApp(nome, telefone, endereco, tipoEntrega, formaPagamento, observacao, subtotal, taxaAtual, totalGeral);
}

// ----- Tela de Pagamento Pix com QR Code Real -----
function mostrarTelaPix(pedido) {
  const chave = dados.pizzaria && dados.pizzaria.pixChave ? dados.pizzaria.pixChave : "";
  const nome = dados.pizzaria && dados.pizzaria.pixNome ? dados.pizzaria.pixNome : "Estabelecimento";
  const cidade = dados.pizzaria && dados.pizzaria.pixCidade ? dados.pizzaria.pixCidade : "Recife";

  if (!chave) {
    alert("A chave Pix não está configurada pelo administrador!");
    return;
  }

  // Gera o código Pix Copia e Cola oficial usando o pix.js
  const codigoPixCopiaECola = gerarPix(chave, nome, cidade, pedido.total, String(pedido.numero));

  document.getElementById("areaPedido").style.display = "none";
  const areaConfirmacao = document.getElementById("areaConfirmacao");
  if (areaConfirmacao) {
    areaConfirmacao.style.display = "block";
    areaConfirmacao.innerHTML = `
      <div style="text-align: center; padding: 10px;">
        <h2>📱 Pagamento via Pix</h2>
        <p>Escaneie o QR Code abaixo ou utilize o código Copia e Cola para pagar <strong>${formatarPreco(pedido.total)}</strong></p>
        
        <div style="background: white; padding: 15px; display: inline-block; margin: 10px 0; border-radius: 8px;">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(codigoPixCopiaECola)}" alt="QR Code Pix">
        </div>

        <p style="font-size: 14px; margin-top: 10px;">Código Pix (Copia e Cola)</p>
        <textarea id="inputChavePix" readonly style="width: 100%; height: 70px; text-align: center; font-size: 12px; background: #f0f0f0; padding: 5px; resize: none;">${codigoPixCopiaECola}</textarea>
        <button class="btn" onclick="copiarChavePix()" style="margin-top: 5px; width: 100%;">Copiar Código Pix</button>

        <div style="margin-top: 20px; background: #fff3cd; padding: 10px; border-radius: 5px; color: #856404;">
          <p>⏳ Aguardando confirmação do pagamento...</p>
          <p style="font-size: 12px;">Assim que o pagamento for confirmado pelo estabelecimento no painel, o seu pedido será enviado automaticamente para o WhatsApp!</p>
        </div>

        <button class="btn-vermelho" onclick="cancelarPix(${pedido.numero})" style="margin-top: 15px; width: 100%;">Cancelar / Voltar</button>
      </div>
    `;
  }

  iniciarVerificacaoStatus(pedido.numero);
}

function copiarChavePix() {
  const input = document.getElementById("inputChavePix");
  input.select();
  navigator.clipboard.writeText(input.value);
  alert("✅ Código Pix Copia e Cola copiado para a área de transferência!");
}

async function cancelarPix(numeroPedido) {
  let listaPedidos = await carregarPedidosNuvem();
  listaPedidos = listaPedidos.map(p => {
    if (p.numero === numeroPedido) p.status = "Cancelado";
    return p;
  });
  await salvarPedidosNuvem(listaPedidos);

  const areaConfirmacao = document.getElementById("areaConfirmacao");
  if (areaConfirmacao) areaConfirmacao.style.display = "none";
  document.getElementById("areaPedido").style.display = "block";
}

function iniciarVerificacaoStatus(numeroPedido) {
  const intervalo = setInterval(async () => {
    const listaPedidos = await carregarPedidosNuvem();
    const pedido = listaPedidos.find(p => p.numero === numeroPedido);

    if (!pedido || pedido.status === "Cancelado") {
      clearInterval(intervalo);
      return;
    }

    if (pedido.pagamentoStatus === "Pago" || pedido.status !== "Aguardando Pagamento") {
      clearInterval(intervalo);
      
      // Limpa o carrinho
      carrinho = [];
      
      // Chama a função que cria o botão na tela em vez de redirecionar automaticamente
      mostrarBotaoWhatsApp(pedido);
    }
  }, 3000);
}

// Nova função que muda a tela do QR Code para a tela de Sucesso com o botão
function mostrarBotaoWhatsApp(pedido) {
  const areaConfirmacao = document.getElementById("areaConfirmacao");
  if (!areaConfirmacao) return;

  // Atualiza o HTML da área de pagamento para mostrar o botão
  areaConfirmacao.innerHTML = `
    <div style="text-align: center; padding: 20px;">
      <h2 style="color: #28a745;">✅ Pagamento Confirmado!</h2>
      <p>O seu Pix foi recebido com sucesso pelo estabelecimento.</p>
      <p style="margin-top: 15px; font-weight: bold;">Clique no botão abaixo para nos enviar o comprovante e o seu pedido para o WhatsApp:</p>
      
      <button id="btnZapFinal" class="btn" style="margin-top: 20px; width: 100%; background-color: #25D366; color: white; font-size: 18px; padding: 15px; border-radius: 8px; border: none; cursor: pointer;">
        📱 Enviar pedido para o WhatsApp
      </button>
    </div>
  `;

  // Quando o cliente clicar no botão, dispara a mensagem e recarrega a página
  document.getElementById("btnZapFinal").addEventListener("click", () => {
     dispararWhatsAppFinal(pedido);
  });
}

function dispararWhatsAppFinal(pedido) {
  let mensagem = `🍕 *PEDIDO PAGO E CONFIRMADO* 🍕\n\n`;
  mensagem += `👤 *Cliente:* ${pedido.cliente}\n`;
  mensagem += `📞 *Telefone:* ${pedido.telefone}\n`;
  mensagem += `📍 *Endereço:* ${pedido.endereco}\n`;
  mensagem += `💳 *Pagamento:* Pix (Confirmado)\n`;
  if (pedido.observacao) mensagem += `📝 *Obs:* ${pedido.observacao}\n`;
  
  mensagem += `\n🛒 *ITENS DO PEDIDO:*\n`;
  pedido.itens.forEach(item => {
    mensagem += `• ${item.qtd}x ${item.nome} - ${formatarPreco(item.preco * item.qtd)}\n`;
  });

  mensagem += `\n📦 Subtotal: ${formatarPreco(pedido.subtotal)}\n`;
  mensagem += `🚚 Entrega: ${formatarPreco(pedido.taxaEntrega)}\n`;
  mensagem += `💰 *TOTAL PAGO: ${formatarPreco(pedido.total)}*`;

  const numeroWhatsApp = dados.pizzaria && dados.pizzaria.whatsapp ? dados.pizzaria.whatsapp : "5581986379426"; 
  const urlWhatsApp = `https://wa.me/${5581986379426}?text=${encodeURIComponent(mensagem)}`;

  window.open(urlWhatsApp, "_blank");
  location.reload(); // Recarrega a página para limpar o sistema do cliente
}

// ----- Executa a inicialização ao carregar a página -----
window.addEventListener("DOMContentLoaded", iniciarCliente);
