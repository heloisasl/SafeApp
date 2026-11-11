import AsyncStorage from '@react-native-async-storage/async-storage';

// Histórico de alarmes salvo só neste aparelho (AsyncStorage).
// Cada registro: { id, inicio, fim, latitude, longitude, via, contatos }
//   via: 'whatsapp' (com internet) ou 'sms' (sem internet)
//   contatos: [{ nome, nivel }]
const CHAVE = 'historico_alarmes';
const LIMITE = 50;

export async function listarHistorico() {
  try {
    const dados = await AsyncStorage.getItem(CHAVE);
    return dados ? JSON.parse(dados) : [];
  } catch (erro) {
    console.log('Erro ao ler histórico:', erro);
    return [];
  }
}

async function salvar(lista) {
  await AsyncStorage.setItem(CHAVE, JSON.stringify(lista.slice(0, LIMITE)));
}

export async function registrarAlarme({ id, latitude, longitude, via, contatos }) {
  try {
    const lista = await listarHistorico();
    if (lista.some(a => a.id === id)) return;
    lista.unshift({
      id,
      inicio: Date.now(),
      fim: null,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      via,
      contatos: contatos || [],
    });
    await salvar(lista);
  } catch (erro) {
    console.log('Erro ao registrar alarme:', erro);
  }
}

export async function encerrarRegistro(id) {
  try {
    const lista = await listarHistorico();
    const alvo = lista.find(a => a.id === id);
    if (!alvo || alvo.fim) return;
    alvo.fim = Date.now();
    await salvar(lista);
  } catch (erro) {
    console.log('Erro ao encerrar registro:', erro);
  }
}

export async function limparHistorico() {
  await AsyncStorage.removeItem(CHAVE);
}

function doisDigitos(n) {
  return String(n).padStart(2, '0');
}

export function formatarData(timestamp) {
  const d = new Date(timestamp);
  const hoje = new Date();
  const ontem = new Date();
  ontem.setDate(hoje.getDate() - 1);
  const hora = `${doisDigitos(d.getHours())}:${doisDigitos(d.getMinutes())}`;
  if (d.toDateString() === hoje.toDateString()) return `Hoje, ${hora}`;
  if (d.toDateString() === ontem.toDateString()) return `Ontem, ${hora}`;
  return `${doisDigitos(d.getDate())}/${doisDigitos(d.getMonth() + 1)}, ${hora}`;
}

export function formatarHora(timestamp) {
  const d = new Date(timestamp);
  return `${doisDigitos(d.getHours())}:${doisDigitos(d.getMinutes())}`;
}

export function formatarDuracao(inicio, fim) {
  if (!fim) return null;
  const minutos = Math.round((fim - inicio) / 60000);
  if (minutos < 1) return 'menos de 1 minuto';
  return minutos === 1 ? '1 minuto' : `${minutos} minutos`;
}
