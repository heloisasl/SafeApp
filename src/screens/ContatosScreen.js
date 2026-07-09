import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ContatosScreen({ navigation }) {
  const [contatos, setContatos] = useState([]);
  const [modalVisivel, setModalVisivel] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novoTelefone, setNovoTelefone] = useState('');
  const [novoNivel, setNovoNivel] = useState(1);

  // Carrega os contatos salvos quando a tela abre
  useEffect(() => {
    carregarContatos();
  }, []);

  async function carregarContatos() {
    try {
      const dados = await AsyncStorage.getItem('contatos');
      if (dados) {
        setContatos(JSON.parse(dados));
      }
    } catch (erro) {
      console.log('Erro ao carregar contatos:', erro);
    }
  }

  async function salvarContatos(listaAtualizada) {
    try {
      await AsyncStorage.setItem('contatos', JSON.stringify(listaAtualizada));
    } catch (erro) {
      console.log('Erro ao salvar contatos:', erro);
    }
  }

  function abrirModal() {
    setNovoNome('');
    setNovoTelefone('');
    setNovoNivel(1);
    setModalVisivel(true);
  }

  function adicionarContato() {
    if (!novoNome.trim() || !novoTelefone.trim()) {
      Alert.alert('Atenção', 'Preencha o nome e o telefone.');
      return;
    }

    const novoContato = {
      id: Date.now().toString(),
      nome: novoNome.trim(),
      telefone: novoTelefone.trim(),
      nivel: novoNivel,
    };

    const listaAtualizada = [...contatos, novoContato];
    setContatos(listaAtualizada);
    salvarContatos(listaAtualizada);
    setModalVisivel(false);
  }

  function removerContato(id) {
    Alert.alert(
      'Remover contato',
      'Tem certeza que deseja remover este contato?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => {
            const listaAtualizada = contatos.filter(c => c.id !== id);
            setContatos(listaAtualizada);
            salvarContatos(listaAtualizada);
          },
        },
      ]
    );
  }

  function corNivel(nivel) {
    if (nivel === 1) return '#4169E1';
    if (nivel === 2) return '#7B9FF5';
    return '#a0a0b0';
  }

  function textoNivel(nivel) {
    if (nivel === 1) return 'Nível 1 — Ligação + SMS';
    if (nivel === 2) return 'Nível 2 — SMS';
    return 'Nível 3 — Notificação';
  }

  function renderContato({ item }) {
    const iniciais = item.nome
      .split(' ')
      .map(p => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

    return (
      <View style={styles.contatoCard}>
        <View style={[styles.avatar, { backgroundColor: corNivel(item.nivel) + '33' }]}>
          <Text style={[styles.avatarTexto, { color: corNivel(item.nivel) }]}>
            {iniciais}
          </Text>
        </View>
        <View style={styles.contatoInfo}>
          <Text style={styles.contatoNome}>{item.nome}</Text>
          <Text style={styles.contatoTelefone}>{item.telefone}</Text>
          <Text style={[styles.contatoNivel, { color: corNivel(item.nivel) }]}>
            {textoNivel(item.nivel)}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.botaoRemover}
          onPress={() => removerContato(item.id)}
        >
          <Text style={styles.botaoRemoverTexto}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>

      {/* Cabeçalho */}
      <View style={styles.cabecalho}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.botaoVoltar}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.titulo}>Rede de proteção</Text>
        <TouchableOpacity onPress={abrirModal}>
          <Text style={styles.botaoAdicionar}>+ Adicionar</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitulo}>
        Estas pessoas serão avisadas quando o alarme for acionado
      </Text>

      {/* Lista de contatos */}
      {contatos.length === 0 ? (
        <View style={styles.vazio}>
          <Text style={styles.vazioIcone}>👥</Text>
          <Text style={styles.vazioTexto}>Nenhum contato cadastrado</Text>
          <Text style={styles.vazioSub}>
            Adicione pessoas de confiança para sua rede de proteção
          </Text>
          <TouchableOpacity style={styles.botaoVazio} onPress={abrirModal}>
            <Text style={styles.botaoVazioTexto}>Adicionar primeiro contato</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={contatos}
          keyExtractor={item => item.id}
          renderItem={renderContato}
          contentContainerStyle={styles.lista}
        />
      )}

      {/* Modal para adicionar contato */}
      <Modal
        visible={modalVisivel}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisivel(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitulo}>Novo contato</Text>

            <TextInput
              style={styles.input}
              placeholder="Nome completo"
              placeholderTextColor="#666680"
              value={novoNome}
              onChangeText={setNovoNome}
            />

            <TextInput
              style={styles.input}
              placeholder="Telefone (com DDD)"
              placeholderTextColor="#666680"
              value={novoTelefone}
              onChangeText={setNovoTelefone}
              keyboardType="phone-pad"
            />

            <Text style={styles.nivelTitulo}>Nível de alerta</Text>
            <View style={styles.niveisRow}>
              {[1, 2, 3].map(n => (
                <TouchableOpacity
                  key={n}
                  style={[
                    styles.nivelBotao,
                    novoNivel === n && { borderColor: '#4169E1', backgroundColor: '#4169E133' },
                  ]}
                  onPress={() => setNovoNivel(n)}
                >
                  <Text style={[
                    styles.nivelBotaoTexto,
                    novoNivel === n && { color: '#4169E1' },
                  ]}>
                    Nível {n}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.nivelDescricao}>{textoNivel(novoNivel)}</Text>

            <View style={styles.modalBotoes}>
              <TouchableOpacity
                style={styles.botaoCancelar}
                onPress={() => setModalVisivel(false)}
              >
                <Text style={styles.botaoCancelarTexto}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.botaoSalvar}
                onPress={adicionarContato}
              >
                <Text style={styles.botaoSalvarTexto}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  botaoVoltar: {
    color: '#4169E1',
    fontSize: 16,
  },
  titulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  botaoAdicionar: {
    color: '#4169E1',
    fontSize: 16,
    fontWeight: '600',
  },
  subtitulo: {
    fontSize: 13,
    color: '#666680',
    textAlign: 'center',
    paddingHorizontal: 32,
    paddingBottom: 16,
  },
  lista: {
    paddingHorizontal: 20,
    gap: 12,
  },
  contatoCard: {
    backgroundColor: '#252540',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTexto: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  contatoInfo: {
    flex: 1,
    gap: 2,
  },
  contatoNome: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  contatoTelefone: {
    fontSize: 13,
    color: '#a0a0b0',
  },
  contatoNivel: {
    fontSize: 12,
    marginTop: 2,
  },
  botaoRemover: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3d1f1f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoRemoverTexto: {
    color: '#ff6060',
    fontSize: 12,
    fontWeight: 'bold',
  },
  vazio: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  vazioIcone: {
    fontSize: 48,
  },
  vazioTexto: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
  vazioSub: {
    fontSize: 14,
    color: '#666680',
    textAlign: 'center',
    lineHeight: 22,
  },
  botaoVazio: {
    marginTop: 8,
    backgroundColor: '#4169E1',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  botaoVazioTexto: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#000000aa',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#1e1e38',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 12,
  },
  modalTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#252540',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#ffffff',
    borderWidth: 0.5,
    borderColor: '#333350',
  },
  nivelTitulo: {
    fontSize: 14,
    color: '#a0a0b0',
    marginTop: 4,
  },
  niveisRow: {
    flexDirection: 'row',
    gap: 8,
  },
  nivelBotao: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333350',
    alignItems: 'center',
  },
  nivelBotaoTexto: {
    color: '#a0a0b0',
    fontSize: 13,
    fontWeight: '500',
  },
  nivelDescricao: {
    fontSize: 12,
    color: '#4169E1',
    textAlign: 'center',
  },
  modalBotoes: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  botaoCancelar: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#252540',
    alignItems: 'center',
  },
  botaoCancelarTexto: {
    color: '#a0a0b0',
    fontSize: 15,
    fontWeight: '600',
  },
  botaoSalvar: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#4169E1',
    alignItems: 'center',
  },
  botaoSalvarTexto: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});