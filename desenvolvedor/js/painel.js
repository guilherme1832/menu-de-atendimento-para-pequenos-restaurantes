// ===== TELA DO DESENVOLVEDOR (ADMIN) =====
const SENHA = "admin123"; // simples, só para o projeto (não é segurança real)
let dados = carregarDados();
let novaImagem = ""; // imagem do produto que está sendo cadastrado

// ----- Preenche os campos de configuração -----
function mostrarConfig() {
  document.getElementById("cfgNome").value = dados.pizzaria.nome;
  document.getElementById("cfgPixChave").value = dados.pizzaria.pixChave || "";
  document.getElementById("cfgPixNome").value = dados.pizzaria.pixNome || dados.pizzaria.nome;
  document.getElementById("cfgPixCidade").value = dados.pizzaria.pixCidade || "";
  document.getElementById("cfgTaxa").value = dados.taxaEntrega;
  document.getElementById("cfgPrazoPix").value = dados.prazoPixMinutos || 10;
  document.getElementById("cfgBannerAtivo").checked = dados.banner.ativo;
  document.getElementById("cfgBannerTexto").value = dados.banner.texto;
}

// ----- Preenche o select de categorias do novo produto -----
function preencherCategorias() {
  const select = document.getElementById("novoCat");
  select.innerHTML = ""; // Limpa para evitar duplicação ou dados antigos
  dados.categorias.forEach(c => {
    select.innerHTML += `<option value="${c}">${c}</option>`;
  });
}

// ----- Monta a tabela de produtos -----
function mostrarTabela() {
  const corpo = document.getElementById("corpoTabela");
  corpo.innerHTML = "";

  dados.produtos.forEach(function (p) {
    let opcoes = "";
    dados.categorias.forEach(function (c) {
      opcoes += `<option ${c === p.categoria ? "selected" : ""}>${c}</option>`;
    });

    corpo.innerHTML += `
      <tr>
        <td class="col-imagem" data-label="Imagem">
          <img id="img-${p.id}" class="miniatura" src="${imagemDoProduto(p)}" alt="">
          <label class="btn-arquivo">Trocar
            <input type="file" accept="image/*" hidden onchange="trocarImagem(${p.id}, this)">
          </label>
          <button class="btn-pequeno" onclick="removerImagem(${p.id})">Remover</button>
        </td>
        <td data-label="Nome"><input type="text" id="nome-${p.id}" value="${p.nome}"></td>
        <td data-label="Descrição"><input type="text" id="desc-${p.id}" value="${p.descricao}"></td>
        <td data-label="Categoria"><select id="cat-${p.id}">${opcoes}</select></td>
        <td data-label="Preço (R$)"><input type="number" step="0.01" min="0" id="preco-${p.id}" value="${p.preco}"></td>
        <td data-label="Desconto (%)"><input type="number" min="0" max="100" id="promo-${p.id}" value="${p.desconto}"></td>
        <td data-label="Disponível"><input type="checkbox" id="disp-${p.id}" ${p.disponivel ? "checked" : ""}></td>
        <td data-label=""><button class="btn-vermelho" onclick="removerProduto(${p.id})">Excluir</button></td>
      </tr>`;
  });
}

// ----- Lê o que foi digitado e atualiza o objeto "dados" -----
function lerCampos() {
  dados.pizzaria.nome = document.getElementById("cfgNome").value;
  dados.pizzaria.pixChave = document.getElementById("cfgPixChave").value.trim();
  dados.pizzaria.pixNome = document.getElementById("cfgPixNome").value;
  dados.pizzaria.pixCidade = document.getElementById("cfgPixCidade").value;
  dados.taxaEntrega = Number(document.getElementById("cfgTaxa").value);
  dados.prazoPixMinutos = Number(document.getElementById("cfgPrazoPix").value) || 10;
  dados.banner.ativo = document.getElementById("cfgBannerAtivo").checked;
  dados.banner.texto = document.getElementById("cfgBannerTexto").value;

  dados.produtos.forEach(function (p) {
    p.nome = document.getElementById("nome-" + p.id).value;
    p.descricao = document.getElementById("desc-" + p.id).value;
    p.categoria = document.getElementById("cat-" + p.id).value;
    p.preco = Number(document.getElementById("preco-" + p.id).value);
    p.desconto = Number(document.getElementById("promo-" + p.id).value);
    p.disponivel = document.getElementById("disp-" + p.id).checked;
  });
}

// ----- Ações dos botões -----
function salvarAlteracoes() {
  lerCampos();
  if (salvarDados(dados)) {
    alert("Alterações salvas! Abra o cardápio do cliente para ver.");
  }
}

function adicionarProduto() {
  lerCampos(); // não perde o que já foi editado
  const nome = document.getElementById("novoNome").value.trim();
  const preco = Number(document.getElementById("novoPreco").value);
  if (nome === "" || preco <= 0) { alert("Informe nome e preço válidos."); return; }

  dados.produtos.push({
    id: Date.now(), // número único
    nome: nome,
    descricao: document.getElementById("novoDesc").value,
    categoria: document.getElementById("novoCat").value,
    preco: preco,
    desconto: 0,
    disponivel: true,
    imagem: novaImagem
  });
  novaImagem = "";
  document.getElementById("novaPreview").src = imagemDoProduto({});

  document.getElementById("novoNome").value = "";
  document.getElementById("novoDesc").value = "";
  document.getElementById("novoPreco").value = "";
  mostrarTabela();
}

// ----- Imagens -----
function processarImagem(arquivo, aoTerminar) {
  if (!arquivo.type.startsWith("image/")) {
    alert("Escolha um arquivo de imagem (jpg, png...).");
    return;
  }
  const leitor = new FileReader();
  leitor.onload = function (e) {
    const img = new Image();
    img.onload = function () {
      const escala = Math.min(1, 500 / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = img.width * escala;
      canvas.height = img.height * escala;
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      aoTerminar(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.src = e.target.result;
  };
  leitor.readAsDataURL(arquivo);
}

function trocarImagem(id, input) {
  if (!input.files[0]) return;
  processarImagem(input.files[0], function (url) {
    const produto = dados.produtos.find(p => p.id === id);
    produto.imagem = url;
    document.getElementById("img-" + id).src = url;
  });
}

function removerImagem(id) {
  lerCampos(); // não perde o que já foi editado
  dados.produtos.find(p => p.id === id).imagem = "";
  mostrarTabela();
}

function escolherNovaImagem(input) {
  if (!input.files[0]) return;
  processarImagem(input.files[0], function (url) {
    novaImagem = url;
    document.getElementById("novaPreview").src = url;
  });
}

function removerProduto(id) {
  if (!confirm("Excluir este produto?")) return;
  lerCampos();
  dados.produtos = dados.produtos.filter(p => p.id !== id);
  mostrarTabela();
}

function restaurarPadrao() {
  if (!confirm("Isso apaga todas as alterações. Continuar?")) return;
  resetarDados();
  dados = carregarDados();
  preencherCategorias();
  mostrarConfig();
  mostrarTabela();
}

// ----- Pedidos -----
function mostrarPedidos() {
  verificarExpirados(); // cancela Pix com prazo vencido
  const pedidos = carregarPedidos();
  const corpo = document.getElementById("corpoPedidos");
  corpo.innerHTML = "";
  document.getElementById("semPedidos").style.display = pedidos.length ? "none" : "block";

  const qtdPendentes = pedidos.filter(p => p.pagamentoStatus === "Pendente" && p.status !== "Cancelado").length;
  const aviso = document.getElementById("resumoPendentes");
  aviso.textContent = qtdPendentes > 0 ? `⏳ ${qtdPendentes} pedido(s) com pagamento Pix pendente` : "";
  aviso.style.display = qtdPendentes > 0 ? "block" : "none";

  pedidos.slice().reverse().forEach(function (p) {
    let itens = p.itens.map(i => `${i.qtd}x ${i.nome}`).join("<br>");
    const pendente = p.pagamentoStatus === "Pendente" && p.status !== "Cancelado";
    let pagHtml = p.pagamento;
    if (pendente) {
      pagHtml += `<br><span class="badge badge-pendente">⏳ Pagamento pendente<span class="contagem" data-expira="${p.expiraEm || ""}"></span></span>
                  <br><button class="btn-pequeno btn-confirmar" onclick="confirmarPagamento(${p.numero})">Confirmar pagamento</button>`;
    } else if (p.pagamentoStatus === "Expirado") {
      pagHtml += `<br><span class="badge badge-expirado">⌛ Prazo esgotado</span>`;
    } else if (p.pagamentoStatus === "Pago") {
      pagHtml += `<br><span class="badge badge-pago">✅ Pago</span>`;
    }

    let opcoes = "";
    STATUS_PEDIDO.forEach(function (s) {
      opcoes += `<option ${s === p.status ? "selected" : ""}>${s}</option>`;
    });

    corpo.innerHTML += `
      <tr class="${pendente ? "pendente" : ""}">
        <td data-label="Pedido">#${p.numero}</td>
        <td data-label="Data">${p.data}</td>
        <td data-label="Cliente">${p.cliente}<br>${p.telefone}<br>${p.endereco}</td>
        <td data-label="Itens">${itens}${p.observacao ? "<br><em>Obs: " + p.observacao + "</em>" : ""}</td>
        <td data-label="Total">${formatarPreco(p.total)}</td>
        <td data-label="Pagamento">${pagHtml}</td>
        <td data-label="Status"><select onchange="mudarStatus(${p.numero}, this.value)">${opcoes}</select></td>
      </tr>`;
  });
}

function mudarStatus(numero, novoStatus) {
  const pedidos = carregarPedidos();
  const pedido = pedidos.find(p => p.numero === numero);
  const avancando = ["Em preparo", "Saiu para entrega", "Entregue"].includes(novoStatus);

  if (pedido.pagamentoStatus === "Pendente" && avancando) {
    if (!confirm("O pagamento Pix deste pedido ainda está PENDENTE. Deseja continuar mesmo assim?")) {
      mostrarPedidos();
      return;
    }
  }
  pedido.status = novoStatus;
  salvarPedidos(pedidos);
  mostrarPedidos();
}

function confirmarPagamento(numero) {
  if (!confirm("Confirma que o Pix do pedido #" + numero + " foi recebido?")) return;
  const pedidos = carregarPedidos();
  pedidos.find(p => p.numero === numero).pagamentoStatus = "Pago";
  salvarPedidos(pedidos);
  mostrarPedidos();
}

function atualizarContagens() {
  if (verificarExpirados()) {
    mostrarPedidos();
    return;
  }
  document.querySelectorAll(".contagem").forEach(function (span) {
    const expira = Number(span.dataset.expira);
    if (expira) span.textContent = " (" + formatarTempo(expira - Date.now()) + ")";
  });
}

// ----- Início (pede a senha) -----
function iniciar() {
  preencherCategorias();
  document.getElementById("novaPreview").src = imagemDoProduto({});
  mostrarConfig();
  mostrarTabela();
  mostrarPedidos();
  window.addEventListener("storage", mostrarPedidos);
  atualizarContagens();
  setInterval(atualizarContagens, 1000);
}

if (prompt("Senha do desenvolvedor:") === SENHA) {
  iniciar();
} else {
  document.body.innerHTML = "<h2 style='padding:20px'>Acesso negado.</h2>";
}