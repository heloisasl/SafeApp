import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  ScrollView,
  Switch,
} from 'react-native';



export default function ConfiguracoesScreen({ navigation }) {
  const [codigoAtual, setCodigoAtual] = useState('1234');
  const [novoCodigoInput, setNovoCodigoInput] = useState('');
  const [palavraCodigo, setPalavraCodigo] = useState('');
  const [palavraInput, setPalavraInput] = useState('');
  const [vibracaoAtiva, setVibracaoAtiva] = useState(true);
  const [editandoCodigo, setEditandoCodigo] = useState(false);
  const [editandoPalavra, setEditandoPalavra] = useState(false);

  useEffect(() => {
    carregarConfiguracoes();
    marcarConfiguracaoCompleta();
  }, []);

async function marcarConfiguracaoCompleta() {
    await AsyncStorage.setItem('configuracao_completa', 'true');
  }

  async function carregarConfiguracoes() {
    try {
      const codigo = await AsyncStorage.getItem('codigo_secreto');
      const palavra = await AsyncStorage.getItem('palavra_codigo');
      const vibracao = await AsyncStorage.getItem('vibracao');

      if (codigo) setCodigoAtual(codigo);
      if (palavra) setPalavraCodigo(palavra);
      if (vibracao !== null) setVibracaoAtiva(vibracao === 'true');
    } catch (erro) {
      console.log('Erro ao carregar configurações:', erro);
    }
  }

  async function salvarCodigo() {
    if (novoCodigoInput.length < 4) {
      Alert.alert('Atenção', 'O código deve ter pelo menos 4 caracteres.');
      return;
    }

    try {
      await AsyncStorage.setItem('codigo_secreto', novoCodigoInput);
      setCodigoAtual(novoCodigoInput);
      setNovoCodigoInput('');
      setEditandoCodigo(false);
      Alert.alert('✅ Código atualizado', `Novo código: ${novoCodigoInput}`);
    } catch (erro) {
      console.log('Erro ao salvar código:', erro);
    }
  }

  async function salvarPalavra() {
    if (palavraInput.trim().length < 2) {
      Alert.alert('Atenção', 'A palavra deve ter pelo menos 2 caracteres.');
      return;
    }

    try {
      await AsyncStorage.setItem('palavra_codigo', palavraInput.trim());
      setPalavraCodigo(palavraInput.trim());
      setPalavraInput('');
      setEditandoPalavra(false);
      Alert.alert('✅ Palavra salva', `Palavra-código: "${palavraInput.trim()}"`);
    } catch (erro) {
      console.log('Erro ao salvar palavra:', erro);
    }
  }

  async function toggleVibracao(valor) {
    setVibracaoAtiva(valor);
    await AsyncStorage.setItem('vibracao', String(valor));
  }

  function confirmarResetApp() {
    Alert.alert(
      'Resetar app',
      'Isso vai apagar todos os contatos e configurações. Tem certeza?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Resetar',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            setCodigoAtual('1234');
            setPalavraCodigo('');
            setVibracaoAtiva(true);
            Alert.alert('App resetado', 'Todas as configurações foram apagadas.');
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.container}>

      {/* Cabeçalho */}
      <View style={styles.cabecalho}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.botaoVoltar}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.titulo}>Configurações</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Seção: Segurança */}
        <Text style={styles.secaoTitulo}>SEGURANÇA</Text>

        <View style={styles.card}>
          <View style={styles.itemRow}>
            <View>
              <Text style={styles.itemTitulo}>Código secreto</Text>
              <Text style={styles.itemSub}>
                Atual: {codigoAtual.split('').map(() => '●').join('')}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setEditandoCodigo(!editandoCodigo)}>
              <Text style={styles.botaoEditar}>
                {editandoCodigo ? 'Cancelar' : 'Alterar'}
              </Text>
            </TouchableOpacity>
          </View>

          {editandoCodigo && (
            <View style={styles.editarContainer}>
              <TextInput
                style={styles.input}
                placeholder="Novo código (mín. 4 caracteres)"
                placeholderTextColor="#666680"
                value={novoCodigoInput}
                onChangeText={setNovoCodigoInput}
                secureTextEntry
                keyboardType="number-pad"
              />
              <TouchableOpacity style={styles.botaoSalvar} onPress={salvarCodigo}>
                <Text style={styles.botaoSalvarTexto}>Salvar código</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.itemRow}>
            <View>
              <Text style={styles.itemTitulo}>Palavra-código de voz</Text>
              <Text style={styles.itemSub}>
                {palavraCodigo ? `"${palavraCodigo}"` : 'Não definida'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setEditandoPalavra(!editandoPalavra)}>
              <Text style={styles.botaoEditar}>
                {editandoPalavra ? 'Cancelar' : palavraCodigo ? 'Alterar' : 'Definir'}
              </Text>
            </TouchableOpacity>
          </View>

          {editandoPalavra && (
            <View style={styles.editarContainer}>
              <TextInput
                style={styles.input}
                placeholder='Ex: "socorro", "ajuda"'
                placeholderTextColor="#666680"
                value={palavraInput}
                onChangeText={setPalavraInput}
                autoCapitalize="none"
              />
              <TouchableOpacity style={styles.botaoSalvar} onPress={salvarPalavra}>
                <Text style={styles.botaoSalvarTexto}>Salvar palavra</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Seção: Preferências */}
        <Text style={styles.secaoTitulo}>PREFERÊNCIAS</Text>

        <View style={styles.card}>
          <View style={styles.itemRow}>
            <View>
              <Text style={styles.itemTitulo}>Vibração ao acionar</Text>
              <Text style={styles.itemSub}>Vibra quando o alarme é ativado</Text>
            </View>
            <Switch
              value={vibracaoAtiva}
              onValueChange={toggleVibracao}
              trackColor={{ false: '#333350', true: '#4169E1' }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* Seção: Sobre */}
        <Text style={styles.secaoTitulo}>SOBRE</Text>

        <View style={styles.card}>
          <View style={styles.itemRow}>
            <Text style={styles.itemTitulo}>SafeApp</Text>
            <Text style={styles.itemSub}>Versão 1.0.0</Text>
          </View>
          <View style={[styles.itemRow, { borderTopWidth: 0.5, borderTopColor: '#333350', paddingTop: 12, marginTop: 4 }]}>
            <Text style={styles.itemTitulo}>Desenvolvido por</Text>
            <Text style={styles.itemSub}>TCC — Ciência da Computação</Text>
          </View>
        </View>

        {/* Zona de perigo */}
        <Text style={styles.secaoTitulo}>ZONA DE PERIGO</Text>

        <TouchableOpacity style={styles.botaoReset} onPress={confirmarResetApp}>
          <Text style={styles.botaoResetTexto}>🗑️ Resetar todas as configurações</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>

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
    width: 60,
  },
  titulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  secaoTitulo: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666680',
    letterSpacing: 1,
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#252540',
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
    gap: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemTitulo: {
    fontSize: 15,
    fontWeight: '500',
    color: '#ffffff',
  },
  itemSub: {
    fontSize: 12,
    color: '#666680',
    marginTop: 2,
  },
  botaoEditar: {
    color: '#4169E1',
    fontSize: 14,
    fontWeight: '600',
  },
  editarContainer: {
    gap: 10,
  },
  input: {
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#ffffff',
    borderWidth: 0.5,
    borderColor: '#333350',
  },
  botaoSalvar: {
    backgroundColor: '#4169E1',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  botaoSalvarTexto: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  botaoReset: {
    backgroundColor: '#2d1f1f',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#5d2020',
  },
  botaoResetTexto: {
    color: '#ff6060',
    fontSize: 15,
    fontWeight: '500',
  },
});