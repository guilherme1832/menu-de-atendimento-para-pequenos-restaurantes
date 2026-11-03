// ===== SUPABASE CONFIGURAÇÃO =====
const SUPABASE_URL = "https://amzfsqstroggrvgmhtxb.supabase.co";
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
      console.warn("A usar cache local/padrão devido a dados vazios.");
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
