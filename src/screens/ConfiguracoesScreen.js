import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts, Comfortaa_700Bold, Comfortaa_400Regular } from '@expo-google-fonts/comfortaa';
import { biometriaDisponivel, autenticar } from '../biometria';

export default function ConfiguracoesScreen({ navigation }) {
  const [novoCodigo, setNovoCodigo] = useState('');
  const [mostrarCodigo, setMostrarCodigo] = useState(false);
  const [palavra, setPalavra] = useState('');
  const [vibracao, setVibracao] = useState(true);
  const [biometria, setBiometria] = useState(false);

  const [fontsLoaded] = useFonts({ Comfortaa_700Bold, Comfortaa_400Regular });

  useEffect(() => {
    carregarConfiguracoes();
    marcarConfiguracaoCompleta();
  }, []);

  if (!fontsLoaded) return null;

  async function marcarConfiguracaoCompleta() {
    await AsyncStorage.setItem('configuracao_completa', 'true');
  }

  async function carregarConfiguracoes() {
    try {
      const p = await AsyncStorage.getItem('palavra_codigo');
      const v = await AsyncStorage.getItem('vibracao');
      setPalavra(p || '');
      setVibracao(v === null ? true : v === 'true');
      const b = await AsyncStorage.getItem('biometria_ativa');
      setBiometria(b === 'true');
    } catch (erro) {
      console.log('Erro ao carregar configurações:', erro);
    }
  }

  async function salvarCodigo() {
    const codigo = novoCodigo.replace(/\D/g, '');
    if (codigo.length < 4) {
      Alert.alert('Atenção', 'O código precisa ter pelo menos 4 números.');
      return;
    }
    await AsyncStorage.setItem('codigo_secreto', codigo);
    setNovoCodigo('');
    Alert.alert('Pronto', 'Código secreto atualizado. Use o novo código na calculadora, seguido de "=".');
  }

  async function salvarPalavra() {
    await AsyncStorage.setItem('palavra_codigo', palavra.trim());
    Alert.alert('Pronto', 'Palavra-código salva.');
  }

  async function alternarVibracao(valor) {
    setVibracao(valor);
    await AsyncStorage.setItem('vibracao', String(valor));
  }

  async function alternarBiometria(valor) {
    if (valor) {
      const disponivel = await biometriaDisponivel();
      if (!disponivel) {
        Alert.alert(
          'Biometria indisponível',
          'Este aparelho não tem digital ou Face ID cadastrado. Cadastre nas configurações do celular e tente de novo.'
        );
        return;
      }
      const confirmou = await autenticar('Confirme para ativar a biometria');
      if (!confirmou) return;
    }
    setBiometria(valor);
    await AsyncStorage.setItem('biometria_ativa', String(valor));
  }

  function confirmarReset() {
    Alert.alert(
      'Resetar aplicativo',
      'Isso apaga seus contatos, o histórico de alarmes, o código secreto e todas as configurações deste aparelho. Essa ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Resetar tudo',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            setPalavra('');
            setNovoCodigo('');
            setVibracao(true);
            setBiometria(false);
            Alert.alert('Pronto', 'O aplicativo foi resetado. O código secreto voltou ao padrão (1234).');
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.botaoVoltar}>
            <Text style={styles.botaoVoltarTexto}>‹</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.titulo}>Configurações</Text>
            <Text style={styles.subtitulo}>Ajuste o app do seu jeito</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* SEGURANÇA */}
          <Text style={styles.secao}>SEGURANÇA</Text>

          <View style={styles.card}>
            <Text style={styles.cardTitulo}>Código secreto</Text>
            <Text style={styles.cardDesc}>
              Digite este código na calculadora e aperte "=" para abrir o app. Use só números, no mínimo 4.
            </Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Novo código"
                placeholderTextColor="#6b7280"
                value={novoCodigo}
                onChangeText={setNovoCodigo}
                keyboardType="number-pad"
                secureTextEntry={!mostrarCodigo}
                maxLength={10}
              />
              <TouchableOpacity style={styles.botaoOlho} onPress={() => setMostrarCodigo(!mostrarCodigo)}>
                <Text style={styles.olhoTexto}>{mostrarCodigo ? '🙈' : '👁'}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.botaoPrimario} onPress={salvarCodigo} activeOpacity={0.85}>
              <Text style={styles.botaoPrimarioTexto}>SALVAR CÓDIGO</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitulo}>Palavra-código de voz</Text>
            <Text style={styles.cardDesc}>
              Uma palavra que você poderá usar no futuro para acionar o alarme sem tocar na tela.
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Ex.: girassol"
              placeholderTextColor="#6b7280"
              value={palavra}
              onChangeText={setPalavra}
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.botaoSecundario} onPress={salvarPalavra} activeOpacity={0.85}>
              <Text style={styles.botaoSecundarioTexto}>SALVAR PALAVRA</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.card, styles.cardLinha]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitulo}>Biometria</Text>
              <Text style={styles.cardDesc}>Pedir digital ou Face ID depois do código secreto</Text>
            </View>
            <Switch
              value={biometria}
              onValueChange={alternarBiometria}
              trackColor={{ false: '#3a4a7a', true: '#8B1A1A' }}
              thumbColor="#ffffff"
            />
          </View>

          {/* PREFERÊNCIAS */}
          <Text style={styles.secao}>PREFERÊNCIAS</Text>

          <View style={[styles.card, styles.cardLinha]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitulo}>Vibração</Text>
              <Text style={styles.cardDesc}>Vibrar ao acionar o alarme</Text>
            </View>
            <Switch
              value={vibracao}
              onValueChange={alternarVibracao}
              trackColor={{ false: '#3a4a7a', true: '#8B1A1A' }}
              thumbColor="#ffffff"
            />
          </View>

          {/* REGISTROS */}
          <Text style={styles.secao}>REGISTROS</Text>

          <TouchableOpacity
            style={[styles.card, styles.cardLinha]}
            onPress={() => navigation.navigate('Historico')}
            activeOpacity={0.85}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitulo}>Histórico de alarmes</Text>
              <Text style={styles.cardDesc}>Veja todos os alarmes que você já acionou</Text>
            </View>
            <Text style={styles.cardSeta}>›</Text>
          </TouchableOpacity>

          {/* SOBRE */}
          <Text style={styles.secao}>SOBRE</Text>

          <View style={styles.card}>
            <View style={styles.sobreLinha}>
              <Text style={styles.sobreLabel}>Aplicativo</Text>
              <Text style={styles.sobreValor}>SafeApp</Text>
            </View>
            <View style={styles.sobreLinha}>
              <Text style={styles.sobreLabel}>Versão</Text>
              <Text style={styles.sobreValor}>1.0.0</Text>
            </View>
            <View style={styles.sobreLinha}>
              <Text style={styles.sobreLabel}>Slogan</Text>
              <Text style={styles.sobreValor}>Você nunca estará só</Text>
            </View>
          </View>

          {/* ZONA DE PERIGO */}
          <Text style={[styles.secao, { color: '#e57373' }]}>ZONA DE PERIGO</Text>

          <TouchableOpacity style={styles.botaoPerigo} onPress={confirmarReset} activeOpacity={0.85}>
            <Text style={styles.botaoPerigoTexto}>RESETAR APLICATIVO</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
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
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
  secao: {
    fontFamily: 'Comfortaa_700Bold',
    fontSize: 11,
    color: '#8899aa',
    letterSpacing: 2,
    marginTop: 14,
    marginBottom: 2,
  },
  card: {
    backgroundColor: '#252d4a',
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  cardLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardTitulo: {
    fontFamily: 'Comfortaa_700Bold',
    fontSize: 15,
    color: '#ffffff',
  },
  cardSeta: {
    fontFamily: 'Comfortaa_700Bold',
    fontSize: 24,
    color: '#8899aa',
  },
  cardDesc: {
    fontFamily: 'Comfortaa_400Regular',
    fontSize: 11,
    color: '#8899aa',
    lineHeight: 18,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  input: {
    backgroundColor: '#1a1f3c',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#ffffff',
    fontFamily: 'Comfortaa_400Regular',
  },
  botaoOlho: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#1a1f3c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  olhoTexto: {
    fontSize: 20,
  },
  botaoPrimario: {
    backgroundColor: '#8B1A1A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  botaoPrimarioTexto: {
    fontFamily: 'Comfortaa_700Bold',
    color: '#ffffff',
    fontSize: 13,
    letterSpacing: 1.5,
  },
  botaoSecundario: {
    borderWidth: 1,
    borderColor: '#8B1A1A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  botaoSecundarioTexto: {
    fontFamily: 'Comfortaa_700Bold',
    color: '#e57373',
    fontSize: 13,
    letterSpacing: 1.5,
  },
  sobreLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sobreLabel: {
    fontFamily: 'Comfortaa_400Regular',
    fontSize: 12,
    color: '#8899aa',
  },
  sobreValor: {
    fontFamily: 'Comfortaa_700Bold',
    fontSize: 12,
    color: '#ffffff',
  },
  botaoPerigo: {
    borderWidth: 1,
    borderColor: '#8B1A1A',
    backgroundColor: '#2a1a24',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
  },
  botaoPerigoTexto: {
    fontFamily: 'Comfortaa_700Bold',
    color: '#e57373',
    fontSize: 13,
    letterSpacing: 1.5,
  },
});