// ===== TELA DO DESENVOLVEDOR (ADMIN) =====
const SENHA = "1"; // simples, só para o projeto (não é segurança real)
let dados = {}; 
let novaImagem = ""; // imagem do produto que está sendo cadastrado

// ----- Inicializa carregando os dados da nuvem primeiro -----
async function iniciarPainel() {
  dados = await carregarDados();
  mostrarConfig();
  preencherCategorias();
  document.getElementById("novaPreview").src = imagemDoProduto({});
  mostrarTabela();
  await mostrarPedidos();
  
  // Atualiza os pedidos da nuvem automaticamente a cada 5 segundos
  setInterval(async () => {
    await mostrarPedidos();
  }, 5000);

  window.addEventListener("storage", mostrarPedidos);
  atualizarContagens();
  setInterval(atualizarContagens, 1000);
}

// ----- Preenche os campos de configuração -----
function mostrarConfig() {
  if (!dados || !dados.pizzaria) return;
  document.getElementById("cfgNome").value = dados.pizzaria.nome || "";
  document.getElementById("cfgPixChave").value = dados.pizzaria.pixChave || "";
  document.getElementById("cfgPixNome").value = dados.pizzaria.pixNome || dados.pizzaria.nome || "";
  document.getElementById("cfgPixCidade").value = dados.pizzaria.pixCidade || "";
  document.getElementById("cfgTaxa").value = dados.taxaEntrega || 0;
  document.getElementById("cfgPrazoPix").value = dados.prazoPixMinutos || 10;
  
  const bannerAtivo = document.getElementById("cfgBannerAtivo");
  if (bannerAtivo) bannerAtivo.checked = dados.banner ? dados.banner.ativo : false;
  
  const bannerTexto = document.getElementById("cfgBannerTexto");
  if (bannerTexto) bannerTexto.value = dados.banner ? dados.banner.texto : "";
}

// ----- Preenche o select de categorias do novo produto -----
function preencherCategorias() {
  const select = document.getElementById("novoCat");
  if (!select || !dados.categorias) return;
  select.innerHTML = ""; // Limpa para evitar duplicação ou dados antigos
  dados.categorias.forEach(c => {
    select.innerHTML += `<option value="${c}">${c}</option>`;
  });
}

// ----- Monta a tabela de produtos -----
function mostrarTabela() {
  const corpo = document.getElementById("corpoTabela");
  if (!corpo || !dados.produtos) return;
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
  if (!dados.pizzaria) dados.pizzaria = {};
  if (!dados.banner) dados.banner = {};

  dados.pizzaria.nome = document.getElementById("cfgNome").value;
  dados.pizzaria.pixChave = document.getElementById("cfgPixChave").value.trim();
  dados.pizzaria.pixNome = document.getElementById("cfgPixNome").value;
  dados.pizzaria.pixCidade = document.getElementById("cfgPixCidade").value;
  dados.taxaEntrega = Number(document.getElementById("cfgTaxa").value);
  dados.prazoPixMinutos = Number(document.getElementById("cfgPrazoPix").value) || 10;
  dados.banner.ativo = document.getElementById("cfgBannerAtivo").checked;
  dados.banner.texto = document.getElementById("cfgBannerTexto").value;

  dados.produtos.forEach(function (p) {
    const nomeEl = document.getElementById("nome-" + p.id);
    const descEl = document.getElementById("desc-" + p.id);
    const catEl = document.getElementById("cat-" + p.id);
    const precoEl = document.getElementById("preco-" + p.id);
    const promoEl = document.getElementById("promo-" + p.id);
    const dispEl = document.getElementById("disp-" + p.id);

    if (nomeEl) p.nome = nomeEl.value;
    if (descEl) p.descricao = descEl.value;
    if (catEl) p.categoria = catEl.value;
    if (precoEl) p.preco = Number(precoEl.value);
    if (promoEl) p.desconto = Number(promoEl.value);
    if (dispEl) p.disponivel = dispEl.checked;
  });
}

// ----- Ações dos botões -----
async function salvarAlteracoes() {
  lerCampos(); // Lê todos os campos do painel para o objeto "dados"

  // Salva tudo na nuvem Supabase (produtos, taxas, banners e configurações do Pix)
  const sucesso = await salvarDados(dados);

  if (sucesso) {
    alert("✅ Alterações salvas com sucesso na nuvem Supabase!");
  } else {
    alert("❌ Erro ao salvar na nuvem.");
  }
}

// Exportar mantido caso necessário para backup em código
function exportarDados() {
  lerCampos();
  const codigoExportado = `const DADOS_PADRAO = ${JSON.stringify(dados, null, 2)};`;
  navigator.clipboard.writeText(codigoExportado).then(() => {
    alert("✅ Código exportado para a área de transferência!");
  }).catch(err => {
    console.error("Erro ao copiar: ", err);
  });
}

// ----- Adicionar Produto (Atualiza e salva na nuvem instantaneamente) -----
async function adicionarProduto() {
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

  // Salva imediatamente na nuvem Supabase
  await salvarDados(dados);
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
    if (produto) {
      produto.imagem = url;
      document.getElementById("img-" + id).src = url;
    }
  });
}

function removerImagem(id) {
  lerCampos(); 
  const produto = dados.produtos.find(p => p.id === id);
  if (produto) produto.imagem = "";
  mostrarTabela();
}

function escolherNovaImagem(input) {
  if (!input.files[0]) return;
  processarImagem(input.files[0], function (url) {
    novaImagem = url;
    document.getElementById("novaPreview").src = url;
  });
}

// ----- Excluir Produto (Atualiza e remove da nuvem instantaneamente) -----
async function removerProduto(id) {
  if (!confirm("Excluir este produto?")) return;
  lerCampos();
  dados.produtos = dados.produtos.filter(p => p.id !== id);
  mostrarTabela();
  
  // Salva imediatamente na nuvem Supabase
  await salvarDados(dados);
}

async function restaurarPadrao() {
  if (!confirm("Isso vai restaurar os dados padrão. Continuar?")) return;
  dados = JSON.parse(JSON.stringify(DADOS_PADRAO));
  await salvarDados(dados);
  preencherCategorias();
  mostrarConfig();
  mostrarTabela();
}

// ----- Pedidos na Nuvem -----
async function mostrarPedidos() {
  let pedidos = await carregarPedidosNuvem();
  
  // Verifica se algum pedido Pix expirou
  let mudou = false;
  pedidos.forEach(function (p) {
    if (p.pagamentoStatus === "Pendente" && p.expiraEm && Date.now() > p.expiraEm) {
      p.pagamentoStatus = "Expirado";
      p.status = "Cancelado";
      mudou = true;
    }
  });
  if (mudou) await salvarPedidosNuvem(pedidos);

  const corpo = document.getElementById("corpoPedidos");
  const semPedidos = document.getElementById("semPedidos");
  if (!corpo) return;
  
  corpo.innerHTML = "";
  if (semPedidos) semPedidos.style.display = pedidos.length ? "none" : "block";

  const qtdPendentes = pedidos.filter(p => p.pagamentoStatus === "Pendente" && p.status !== "Cancelado").length;
  const aviso = document.getElementById("resumoPendentes");
  if (aviso) {
    aviso.textContent = qtdPendentes > 0 ? `⏳ ${qtdPendentes} pedido(s) com pagamento Pix pendente` : "";
    aviso.style.display = qtdPendentes > 0 ? "block" : "none";
  }

  pedidos.slice().reverse().forEach(function (p) {
    let itens = p.itens ? p.itens.map(i => `${i.qtd}x ${i.nome}`).join("<br>") : "";
    const pendente = p.pagamentoStatus === "Pendente" && p.status !== "Cancelado";
    let pagHtml = p.pagamento || "";
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

async function mudarStatus(numero, novoStatus) {
  let pedidos = await carregarPedidosNuvem();
  const pedido = pedidos.find(p => p.numero === numero);
  const avancando = ["Em preparo", "Saiu para entrega", "Entregue"].includes(novoStatus);

  if (pedido && pedido.pagamentoStatus === "Pendente" && avancando) {
    if (!confirm("O pagamento Pix deste pedido ainda está PENDENTE. Deseja continuar mesmo assim?")) {
      await mostrarPedidos();
      return;
    }
  }
  if (pedido) pedido.status = novoStatus;
  await salvarPedidosNuvem(pedidos);
  await mostrarPedidos();
}

async function confirmarPagamento(numero) {
  if (!confirm("Confirma que o Pix do pedido #" + numero + " foi recebido?")) return;
  let pedidos = await carregarPedidosNuvem();
  const pedido = pedidos.find(p => p.numero === numero);
  if (pedido) {
    pedido.pagamentoStatus = "Pago";
    pedido.status = "Em preparo"; // Passa automaticamente para em preparo ao confirmar o Pix
  }
  await salvarPedidosNuvem(pedidos);
  await mostrarPedidos();
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

// ----- Execução ao carregar a página com verificação de senha -----
if (prompt("Senha do desenvolvedor:") === SENHA) {
  window.addEventListener("DOMContentLoaded", iniciarPainel);
} else {
  document.body.innerHTML = "<h2 style='padding:20px'>Acesso negado.</h2>";
}
