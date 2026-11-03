// ===== TELA DO DESENVOLVEDOR (ADMIN) =====
import { 
  carregarDados, 
  salvarDados, 
  resetarDados, 
  carregarPedidosNuvem, 
  salvarPedidosNuvem, 
  formatarPreco, 
  precoFinal, 
  imagemDoProduto 
} from "../../compartilhado/js/dados.js";

const SENHA = "admin123";

// 🔐 BLOQUEIO DE SENHA IMEDIATO
const senhaDigitada = prompt("Digite a senha do desenvolvedor:");

if (senhaDigitada !== SENHA) {
  document.body.innerHTML = "<h2 style='padding:40px; font-family:sans-serif; color:red;'>❌ Acesso negado. Senha incorreta ou cancelada.</h2>";
  throw new Error("Acesso negado");
}

let dados = {
  pizzaria: { nome: "", pixChave: "", pixNome: "", pixCidade: "" },
  taxaEntrega: 0,
  prazoPixMinutos: 10,
  banner: { ativo: false, texto: "" },
  categorias: [],
  produtos: []
};

let pedidosGlobal = [];
let novaImagem = "";

const STATUS_PEDIDO = ["Recebido", "Em preparo", "Saiu para entrega", "Entregue", "Cancelado"];

// ----- Configurações -----
function mostrarConfig() {
  if (!dados || !dados.pizzaria) return;
  if (document.getElementById("cfgNome")) document.getElementById("cfgNome").value = dados.pizzaria.nome || "";
  if (document.getElementById("cfgPixChave")) document.getElementById("cfgPixChave").value = dados.pizzaria.pixChave || "";
  if (document.getElementById("cfgPixNome")) document.getElementById("cfgPixNome").value = dados.pizzaria.pixNome || dados.pizzaria.nome || "";
  if (document.getElementById("cfgPixCidade")) document.getElementById("cfgPixCidade").value = dados.pizzaria.pixCidade || "";
  if (document.getElementById("cfgTaxa")) document.getElementById("cfgTaxa").value = dados.taxaEntrega || 0;
  if (document.getElementById("cfgPrazoPix")) document.getElementById("cfgPrazoPix").value = dados.prazoPixMinutos || 10;
  if (document.getElementById("cfgBannerAtivo")) document.getElementById("cfgBannerAtivo").checked = dados.banner ? dados.banner.ativo : false;
  if (document.getElementById("cfgBannerTexto")) document.getElementById("cfgBannerTexto").value = dados.banner ? dados.banner.texto : "";
}

function preencherCategorias() {
  const select = document.getElementById("novoCat");
  if (!select || !dados || !dados.categorias) return;
  select.innerHTML = "";
  dados.categorias.forEach(c => {
    select.innerHTML += `<option value="${c}">${c}</option>`;
  });
}

function mostrarTabela() {
  const corpo = document.getElementById("corpoTabela");
  if (!corpo || !dados || !dados.produtos) return;
  corpo.innerHTML = "";

  dados.produtos.forEach(function (p) {
    let opcoes = "";
    if (dados.categorias) {
      dados.categorias.forEach(function (c) {
        opcoes += `<option ${c === p.categoria ? "selected" : ""}>${c}</option>`;
      });
    }

    corpo.innerHTML += `
      <tr>
        <td class="col-imagem" data-label="Imagem">
          <img id="img-${p.id}" class="miniatura" src="${imagemDoProduto(p)}" alt="">
          <label class="btn-arquivo">Trocar
            <input type="file" accept="image/*" hidden onchange="trocarImagem(${p.id}, this)">
          </label>
          <button class="btn-pequeno" onclick="removerImagem(${p.id})">Remover</button>
        </td>
        <td data-label="Nome"><input type="text" id="nome-${p.id}" value="${p.nome || ""}"></td>
        <td data-label="Descrição"><input type="text" id="desc-${p.id}" value="${p.descricao || ""}"></td>
        <td data-label="Categoria"><select id="cat-${p.id}">${opcoes}</select></td>
        <td data-label="Preço (R$)"><input type="number" step="0.01" min="0" id="preco-${p.id}" value="${p.preco || 0}"></td>
        <td data-label="Desconto (%)"><input type="number" min="0" max="100" id="promo-${p.id}" value="${p.desconto || 0}"></td>
        <td data-label="Disponível"><input type="checkbox" id="disp-${p.id}" ${p.disponivel ? "checked" : ""}></td>
        <td data-label=""><button class="btn-vermelho" onclick="removerProduto(${p.id})">Excluir</button></td>
      </tr>`;
  });
}

function lerCampos() {
  if (!dados) return;
  if (!dados.pizzaria) dados.pizzaria = {};
  if (!dados.banner) dados.banner = {};

  const cfgNome = document.getElementById("cfgNome");
  if (cfgNome) dados.pizzaria.nome = cfgNome.value;

  const cfgPixChave = document.getElementById("cfgPixChave");
  if (cfgPixChave) dados.pizzaria.pixChave = cfgPixChave.value.trim();

  const cfgPixNome = document.getElementById("cfgPixNome");
  if (cfgPixNome) dados.pizzaria.pixNome = cfgPixNome.value;

  const cfgPixCidade = document.getElementById("cfgPixCidade");
  if (cfgPixCidade) dados.pizzaria.pixCidade = cfgPixCidade.value;

  const cfgTaxa = document.getElementById("cfgTaxa");
  if (cfgTaxa) dados.taxaEntrega = Number(cfgTaxa.value);

  const cfgPrazoPix = document.getElementById("cfgPrazoPix");
  if (cfgPrazoPix) dados.prazoPixMinutos = Number(cfgPrazoPix.value) || 10;

  const cfgBannerAtivo = document.getElementById("cfgBannerAtivo");
  if (cfgBannerAtivo) dados.banner.ativo = cfgBannerAtivo.checked;

  const cfgBannerTexto = document.getElementById("cfgBannerTexto");
  if (cfgBannerTexto) dados.banner.texto = cfgBannerTexto.value;

  if (dados.produtos) {
    dados.produtos.forEach(function (p) {
      const nomeInput = document.getElementById("nome-" + p.id);
      if (nomeInput) {
        p.nome = nomeInput.value;
        const descInput = document.getElementById("desc-" + p.id);
        if (descInput) p.descricao = descInput.value;
        const catInput = document.getElementById("cat-" + p.id);
        if (catInput) p.categoria = catInput.value;
        const precoInput = document.getElementById("preco-" + p.id);
        if (precoInput) p.preco = Number(precoInput.value);
        const promoInput = document.getElementById("promo-" + p.id);
        if (promoInput) p.desconto = Number(promoInput.value);
        const dispInput = document.getElementById("disp-" + p.id);
        if (dispInput) p.disponivel = dispInput.checked;
      }
    });
  }
}

window.salvarAlteracoes = async function() {
  if (!dados) { alert("Os dados ainda estão a carregar. Aguarde um momento."); return; }
  lerCampos();
  const sucesso = await salvarDados(dados);
  if (sucesso) {
    alert("Alterações salvas na nuvem!");
  }
};

window.adicionarProduto = function() {
  if (!dados) { alert("Os dados ainda estão a carregar. Aguarde um momento."); return; }
  lerCampos();
  const inputNome = document.getElementById("novoNome");
  const inputPreco = document.getElementById("novoPreco");
  const inputDesc = document.getElementById("novoDesc");
  const inputCat = document.getElementById("novoCat");

  if (!inputNome || !inputPreco) return;

  const nome = inputNome.value.trim();
  const preco = Number(inputPreco.value);

  if (nome === "" || preco <= 0) { 
    alert("Informe nome e preço válidos."); 
    return; 
  }

  if (!dados.produtos) dados.produtos = [];

  dados.produtos.push({
    id: Date.now(),
    nome: nome,
    descricao: inputDesc ? inputDesc.value : "",
    categoria: inputCat ? inputCat.value : "",
    preco: preco,
    desconto: 0,
    disponivel: true,
    imagem: novaImagem
  });

  novaImagem = "";
  const preview = document.getElementById("novaPreview");
  if (preview) preview.src = imagemDoProduto({});
  
  inputNome.value = "";
  if (inputDesc) inputDesc.value = "";
  inputPreco.value = "";
  
  mostrarTabela();
};

function processarImagem(arquivo, aoTerminar) {
  if (!arquivo.type.startsWith("image/")) { alert("Escolha uma imagem válida."); return; }
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

window.trocarImagem = function(id, input) {
  if (!input.files[0]) return;
  processarImagem(input.files[0], function (url) {
    const produto = dados.produtos.find(p => p.id === id);
    if (produto) {
      produto.imagem = url;
      const imgElem = document.getElementById("img-" + id);
      if (imgElem) imgElem.src = url;
    }
  });
};

window.removerImagem = function(id) {
  lerCampos();
  const produto = dados.produtos.find(p => p.id === id);
  if (produto) produto.imagem = "";
  mostrarTabela();
};

window.escolherNovaImagem = function(input) {
  if (!input.files[0]) return;
  processarImagem(input.files[0], function (url) {
    novaImagem = url;
    const preview = document.getElementById("novaPreview");
    if (preview) preview.src = url;
  });
};

window.removerProduto = function(id) {
  if (!confirm("Excluir este produto?")) return;
  lerCampos();
  dados.produtos = dados.produtos.filter(p => p.id !== id);
  mostrarTabela();
};

window.restaurarPadrao = async function() {
  if (!confirm("Restaurar padrões na nuvem?")) return;
  await resetarDados();
  dados = await carregarDados();
  preencherCategorias();
  mostrarConfig();
  mostrarTabela();
};

// ----- Gestão de Pedidos na Nuvem -----
async function mostrarPedidos() {
  pedidosGlobal = await carregarPedidosNuvem();
  const corpo = document.getElementById("corpoPedidos");
  const semPedidos = document.getElementById("semPedidos");
  if (!corpo) return;

  corpo.innerHTML = "";
  if (semPedidos) semPedidos.style.display = pedidosGlobal.length ? "none" : "block";

  const qtdPendentes = pedidosGlobal.filter(p => p.pagamentoStatus === "Pendente" && p.status !== "Cancelado").length;
  const aviso = document.getElementById("resumoPendentes");
  if (aviso) {
    aviso.textContent = qtdPendentes > 0 ? `⏳ ${qtdPendentes} pedido(s) com pagamento Pix pendente` : "";
    aviso.style.display = qtdPendentes > 0 ? "block" : "none";
  }

  pedidosGlobal.slice().reverse().forEach(function (p) {
    let itens = p.itens ? p.itens.map(i => `${i.qtd}x ${i.nome}`).join("<br>") : "";
    const pendente = p.pagamentoStatus === "Pendente" && p.status !== "Cancelado";
    let pagHtml = p.pagamento || "";
    
    if (pendente) {
      pagHtml += `<br><span class="badge" style="background:#ffc107; color:#000; padding:2px 6px; border-radius:4px;">⏳ Pagamento pendente</span>
                  <br><button class="btn-pequeno" onclick="confirmarPagamento(${p.numero})" style="margin-top:4px;">Confirmar Pix</button>`;
    } else if (p.pagamentoStatus === "Pago") {
      pagHtml += `<br><span class="badge" style="background:#28a745; color:#fff; padding:2px 6px; border-radius:4px;">✅ Pago</span>`;
    }

    let opcoes = "";
    STATUS_PEDIDO.forEach(function (s) {
      opcoes += `<option ${s === p.status ? "selected" : ""}>${s}</option>`;
    });

    corpo.innerHTML += `
      <tr>
        <td data-label="Pedido">#${p.numero}</td>
        <td data-label="Data">${p.data}</td>
        <td data-label="Cliente">${p.cliente || ""}<br>${p.telefone || ""}<br>${p.endereco || ""}</td>
        <td data-label="Itens">${itens}${p.observacao ? "<br><em>Obs: " + p.observacao + "</em>" : ""}</td>
        <td data-label="Total">${formatarPreco(p.total || 0)}</td>
        <td data-label="Pagamento">${pagHtml}</td>
        <td data-label="Status"><select onchange="mudarStatus(${p.numero}, this.value)">${opcoes}</select></td>
      </tr>`;
  });
}

window.mudarStatus = async function(numero, novoStatus) {
  const pedido = pedidosGlobal.find(p => p.numero === numero);
  if (!pedido) return;
  pedido.status = novoStatus;
  await salvarPedidosNuvem(pedidosGlobal);
  mostrarPedidos();
};

window.confirmarPagamento = async function(numero) {
  if (!confirm("Confirma que o Pix do pedido #" + numero + " foi recebido?")) return;
  const pedido = pedidosGlobal.find(p => p.numero === numero);
  if (!pedido) return;
  pedido.pagamentoStatus = "Pago";
  await salvarPedidosNuvem(pedidosGlobal);
  mostrarPedidos();
};

// ----- Inicialização -----
async function iniciar() {
  dados = await carregarDados();
  preencherCategorias();
  const preview = document.getElementById("novaPreview");
  if (preview) preview.src = imagemDoProduto({});
  
  mostrarConfig();
  mostrarTabela();
  await mostrarPedidos();

  setInterval(mostrarPedidos, 10000);
}

iniciar();