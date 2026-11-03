import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'

// Credenciais do Supabase configuradas
const SUPABASE_URL = 'https://amzfsqstrogqrvgmhtxb.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_z5plbE-ChWuz-lh1Kxzo4g_IaA34-Fk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Funções para gerir o cardápio e pedidos com sincronização em tempo real
export async function carregarDadosPizzaria() {
    const { data, error } = await supabase
        .from('dados_pizzaria')
        .select('*')
        .eq('id', 'principal')
        .single();
    
    if (error) {
        console.error('Erro ao carregar dados:', error);
        return null;
    }
    return data ? data.conteudo : null;
}

export async function salvarDadosPizzaria(conteudo) {
    const { error } = await supabase
        .from('dados_pizzaria')
        .upsert({ id: 'principal', conteudo, atualizado_em: new Date() });
    
    if (error) console.error('Erro ao salvar dados:', error);
}

export async function enviarPedido(pedido) {
    const { error } = await supabase
        .from('pedidos')
        .upsert({ id: pedido.id || String(Date.now()), conteudo: pedido, criado_em: new Date() });
    
    if (error) console.error('Erro ao enviar pedido:', error);
}

export function escutarPedidos(callback) {
    return supabase
        .channel('public:pedidos')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, payload => {
            callback(payload.new.conteudo);
        })
        .subscribe();
}