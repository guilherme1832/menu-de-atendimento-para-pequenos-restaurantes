// ===== MÓDULO DE DADOS NUVEM (Firebase Firestore Direto) =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ⚠️ COLOCA AQUI AS TUAS CREDENCIAIS DO FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyCwsLoNbmwTn1uTwt_9Z_sTWufbxLqUzdM",
  authDomain: "menudeatendimento.firebaseapp.com",
  projectId: "menudeatendimento",
  storageBucket: "menudeatendimento.firebasestorage.app",
  messagingSenderId: "852431378424",
  appId: "1:852431378424:web:eee5c5b964709509e0280d"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Referência para um único documento na nuvem que guarda todo o sistema
const docRef = doc(db, "sistema", "cardapio_geral");

const DADOS_PADRAO = {
  pizzaria: { 
    nome: "Minha Pizzaria", 
    pixChave: "", 
    pixNome: "", 
    pixCidade: "",
    whatsapp: "5581999999999"
  },
  taxaEntrega: 5.00,
  prazoPixMinutos: 10,
  banner: { ativo: false, texto: "" },
  categorias: ["Pizzas Salgadas", "Pizzas Doces", "Bebidas"],
  produtos: [
    {
      id: 1,
      nome: "Pizza Calabresa",
      descricao: "Molho, mussarela e calabresa",
      categoria: "Pizzas Salgadas",
      preco: 45.00,
      desconto: 0,
      disponivel: true,
      imagem: ""
    }
  ]
};

// Carrega os dados diretamente da nuvem (acessível por PC e telemóvel)
export async function carregarDados() {
  try {
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return snapshot.data();
    } else {
      // Se não existir na nuvem ainda, cria com os dados padrão
      await setDoc(docRef, DADOS_PADRAO);
      return DADOS_PADRAO;
    }
  } catch (erro) {
    console.error("Erro ao carregar da nuvem, a usar padrão local:", erro);
    return DADOS_PADRAO;
  }
}

// Salva as alterações diretamente na nuvem (atualiza o PC e o telemóvel na hora)
export async function salvarDados(dados) {
  try {
    await setDoc(docRef, dados);
    return true;
  } catch (erro) {
    console.error("Erro ao salvar na nuvem:", erro);
    alert("Erro ao salvar na nuvem. Verifica a tua conexão.");
    return false;
  }
}

// Restaura os dados para o padrão original na nuvem
export async function resetarDados() {
  try {
    await setDoc(docRef, DADOS_PADRAO);
    return DADOS_PADRAO;
  } catch (erro) {
    console.error("Erro ao resetar dados:", erro);
    return DADOS_PADRAO;
  }
}

// Gestão de Pedidos na Nuvem
const docPedidosRef = doc(db, "sistema", "pedidos_geral");

export async function carregarPedidosNuvem() {
  try {
    const snapshot = await getDoc(docPedidosRef);
    if (snapshot.exists()) {
      return snapshot.data().lista || [];
    }
    return [];
  } catch (erro) {
    console.error("Erro ao carregar pedidos:", erro);
    return [];
  }
}

export async function salvarPedidosNuvem(pedidos) {
  try {
    await setDoc(docPedidosRef, { lista: pedidos });
    return true;
  } catch (erro) {
    console.error("Erro ao salvar pedidos:", erro);
    return false;
  }
}

// Funções utilitárias
export function formatarPreco(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function precoFinal(produto) {
  const preco = Number(produto.preco || 0);
  const desconto = Number(produto.desconto || 0);
  if (desconto > 0) {
    return preco - (preco * desconto / 100);
  }
  return preco;
}

export function imagemDoProduto(produto) {
  if (produto && produto.imagem && produto.imagem.trim() !== "") {
    return produto.imagem;
  }
  return "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%23ccc' stroke-width='2'><rect width='18' height='18' x='3' y='3' rx='2' ry='2'/><circle cx='9' cy='9' r='2'/><path d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'/></svg>";
}