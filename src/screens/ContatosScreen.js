import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts, Comfortaa_700Bold, Comfortaa_400Regular } from '@expo-google-fonts/comfortaa';

const NIVEIS = {
  1: { cor: '#8B1A1A', titulo: 'Nível 1', desc: 'Contato principal, avisado primeiro' },
  2: { cor: '#3b5bdb', titulo: 'Nível 2', desc: 'Avisado logo depois do nível 1' },
  3: { cor: '#0F6E56', titulo: 'Nível 3', desc: 'Avisado por último' },
};

function soDigitos(texto) {
  let d = texto.replace(/\D/g, '');
  // se vier com +55, remove (o PanicoScreen já adiciona o 55)
  if (d.length > 11 && d.startsWith('55')) d = d.slice(2);
  return d;
}

function formatarTelefone(digitos) {
  if (digitos.length === 11) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
  }
  if (digitos.length === 10) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  }
  return digitos;
}

function iniciais(nome) {
  const partes = nome.trim().split(' ').filter(Boolean);
  if (partes.length === 0) return '?';
  if (partes.length === 1) return partes[0][0].toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

export default function ContatosScreen({ navigation }) {
  const [contatos, setContatos] = useState([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [nivel, setNivel] = useState(1);

  const [fontsLoaded] = useFonts({ Comfortaa_700Bold, Comfortaa_400Regular });

  useEffect(() => {
    carregarContatos();
  }, []);

  if (!fontsLoaded) return null;

  async function carregarContatos() {
    try {
      const dados = await AsyncStorage.getItem('contatos');
      const lista = dados ? JSON.parse(dados) : [];
      lista.sort((a, b) => a.nivel - b.nivel);
      setContatos(lista);
    } catch (erro) {
      console.log('Erro ao carregar contatos:', erro);
    }
  }

  async function salvarLista(lista) {
    lista.sort((a, b) => a.nivel - b.nivel);
    setContatos(lista);
    await AsyncStorage.setItem('contatos', JSON.stringify(lista));
  }

  function abrirModal() {
    setNome('');
    setTelefone('');
    setNivel(contatos.some(c => c.nivel === 1) ? 2 : 1);
    setModalAberto(true);
  }

  async function adicionarContato() {
    const digitos = soDigitos(telefone);

    if (!nome.trim()) {
      Alert.alert('Atenção', 'Digite o nome do contato.');
      return;
    }
    if (digitos.length < 10 || digitos.length > 11) {
      Alert.alert('Atenção', 'Digite o telefone com DDD. Exemplo: (34) 99999-9999');
      return;
    }

    const novo = {
      id: Date.now().toString(),
      nome: nome.trim(),
      telefone: formatarTelefone(digitos),
      nivel,
    };

    await salvarLista([...contatos, novo]);
    setModalAberto(false);
  }

  function confirmarRemocao(contato) {
    Alert.alert(
      'Remover contato',
      `Deseja remover ${contato.nome} da sua rede de proteção?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => salvarLista(contatos.filter(c => c.id !== contato.id)),
        },
      ]
    );
  }

  function renderContato({ item }) {
    const info = NIVEIS[item.nivel] || NIVEIS[3];
    return (
      <View style={styles.card}>
        <View style={[styles.avatar, { backgroundColor: info.cor }]}>
          <Text style={styles.avatarTexto}>{iniciais(item.nome)}</Text>
        </View>

        <View style={styles.cardInfo}>
          <Text style={styles.cardNome} numberOfLines={1}>{item.nome}</Text>
          <Text style={styles.cardTel}>{item.telefone}</Text>
          <View style={[styles.badge, { borderColor: info.cor }]}>
            <Text style={[styles.badgeTexto, { color: info.cor === '#8B1A1A' ? '#e57373' : '#c5cae9' }]}>
              {info.titulo}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.botaoRemover} onPress={() => confirmarRemocao(item)}>
          <Text style={styles.botaoRemoverTexto}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.botaoVoltar}>
          <Text style={styles.botaoVoltarTexto}>‹</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.titulo}>Rede de proteção</Text>
          <Text style={styles.subtitulo}>Quem será avisado em uma emergência</Text>
        </View>
      </View>

      {/* Lista */}
      <FlatList
        data={contatos}
        keyExtractor={item => item.id}
        renderItem={renderContato}
        contentContainerStyle={styles.lista}
        ListEmptyComponent={
          <View style={styles.vazio}>
            <Text style={styles.vazioIcone}>👥</Text>
            <Text style={styles.vazioTitulo}>Nenhum contato cadastrado</Text>
            <Text style={styles.vazioTexto}>
              Adicione pessoas de confiança para que elas recebam o seu alerta com a localização.
            </Text>
          </View>
        }
      />

      {/* Botão adicionar */}
      <View style={styles.rodape}>
        <TouchableOpacity style={styles.botaoAdicionar} onPress={abrirModal} activeOpacity={0.85}>
          <Text style={styles.botaoAdicionarTexto}>+  ADICIONAR CONTATO</Text>
        </TouchableOpacity>
      </View>

      {/* Modal */}
      <Modal visible={modalAberto} transparent animationType="slide" onRequestClose={() => setModalAberto(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalFundo}
        >
          <View style={styles.modalCaixa}>
            <View style={styles.modalPuxador} />
            <Text style={styles.modalTitulo}>Novo contato</Text>

            <TextInput
              style={styles.input}
              placeholder="Nome"
              placeholderTextColor="#6b7280"
              value={nome}
              onChangeText={setNome}
              autoCapitalize="words"
            />

            <TextInput
              style={styles.input}
              placeholder="Telefone com DDD"
              placeholderTextColor="#6b7280"
              value={telefone}
              onChangeText={setTelefone}
              keyboardType="phone-pad"
            />

            <Text style={styles.nivelLabel}>Nível de alerta</Text>
            <View style={styles.niveisRow}>
              {[1, 2, 3].map(n => (
                <TouchableOpacity
                  key={n}
                  style={[
                    styles.nivelBotao,
                    nivel === n && { backgroundColor: NIVEIS[n].cor, borderColor: NIVEIS[n].cor },
                  ]}
                  onPress={() => setNivel(n)}
                >
                  <Text style={[styles.nivelBotaoTexto, nivel === n && { color: '#ffffff' }]}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.nivelDesc}>{NIVEIS[nivel].desc}</Text>

            <View style={styles.modalBotoes}>
              <TouchableOpacity style={styles.botaoCancelar} onPress={() => setModalAberto(false)}>
                <Text style={styles.botaoCancelarTexto}>CANCELAR</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.botaoSalvar} onPress={adicionarContato}>
                <Text style={styles.botaoSalvarTexto}>SALVAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1f3c',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  botaoVoltar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#252d4a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoVoltarTexto: {
    fontFamily: 'Comfortaa_700Bold',
    fontSize: 26,
    color: '#ffffff',
    marginTop: -3,
  },
  titulo: {
    fontFamily: 'Comfortaa_700Bold',
    fontSize: 20,
    color: '#ffffff',
  },
  subtitulo: {
    fontFamily: 'Comfortaa_400Regular',
    fontSize: 11,
    color: '#8899aa',
    marginTop: 2,
  },
  lista: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
    gap: 12,
    flexGrow: 1,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#252d4a',
    borderRadius: 16,
    padding: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTexto: {
    fontFamily: 'Comfortaa_700Bold',
    fontSize: 16,
    color: '#ffffff',
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  cardNome: {
    fontFamily: 'Comfortaa_700Bold',
    fontSize: 16,
    color: '#ffffff',
  },
  cardTel: {
    fontFamily: 'Comfortaa_400Regular',
    fontSize: 12,
    color: '#8899aa',
  },
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  badgeTexto: {
    fontFamily: 'Comfortaa_700Bold',
    fontSize: 10,
  },
  botaoRemover: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#1a1f3c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoRemoverTexto: {
    fontFamily: 'Comfortaa_700Bold',
    color: '#8899aa',
    fontSize: 14,
  },
  vazio: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    gap: 8,
  },
  vazioIcone: {
    fontSize: 48,
    marginBottom: 6,
  },
  vazioTitulo: {
    fontFamily: 'Comfortaa_700Bold',
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
  },
  vazioTexto: {
    fontFamily: 'Comfortaa_400Regular',
    fontSize: 12,
    color: '#8899aa',
    textAlign: 'center',
    lineHeight: 20,
  },
  rodape: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    paddingTop: 8,
  },
  botaoAdicionar: {
    backgroundColor: '#8B1A1A',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
  },
  botaoAdicionarTexto: {
    fontFamily: 'Comfortaa_700Bold',
    color: '#ffffff',
    fontSize: 14,
    letterSpacing: 1.5,
  },
  modalFundo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCaixa: {
    backgroundColor: '#1a1f3c',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 36,
    gap: 14,
  },
  modalPuxador: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3a4a7a',
    marginBottom: 6,
  },
  modalTitulo: {
    fontFamily: 'Comfortaa_700Bold',
    fontSize: 22,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#252d4a',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#ffffff',
    fontFamily: 'Comfortaa_400Regular',
  },
  nivelLabel: {
    fontFamily: 'Comfortaa_700Bold',
    fontSize: 12,
    color: '#8899aa',
    marginTop: 4,
  },
  niveisRow: {
    flexDirection: 'row',
    gap: 10,
  },
  nivelBotao: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3a4a7a',
    backgroundColor: '#252d4a',
    alignItems: 'center',
  },
  nivelBotaoTexto: {
    fontFamily: 'Comfortaa_700Bold',
    fontSize: 16,
    color: '#8899aa',
  },
  nivelDesc: {
    fontFamily: 'Comfortaa_400Regular',
    fontSize: 11,
    color: '#8899aa',
    textAlign: 'center',
  },
  modalBotoes: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  botaoCancelar: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#252d4a',
    alignItems: 'center',
  },
  botaoCancelarTexto: {
    fontFamily: 'Comfortaa_700Bold',
    color: '#8899aa',
    fontSize: 13,
    letterSpacing: 1,
  },
  botaoSalvar: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#8B1A1A',
    alignItems: 'center',
  },
  botaoSalvarTexto: {
    fontFamily: 'Comfortaa_700Bold',
    color: '#ffffff',
    fontSize: 13,
    letterSpacing: 1,
  },
});