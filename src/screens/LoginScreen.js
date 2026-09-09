import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useFonts, Comfortaa_700Bold, Comfortaa_400Regular } from '@expo-google-fonts/comfortaa';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);

  const [fontsLoaded] = useFonts({
    Comfortaa_700Bold,
    Comfortaa_400Regular,
  });

  if (!fontsLoaded) return null;

  async function entrar() {
    if (!email.trim() || !senha) {
      Alert.alert('Atenção', 'Preencha email e senha.');
      return;
    }
    setCarregando(true);
    try {
      await signInWithEmailAndPassword(auth, email, senha);
    } catch (erro) {
      let mensagem = 'Erro ao entrar.';
      if (erro.code === 'auth/user-not-found') mensagem = 'Usuária não encontrada.';
      if (erro.code === 'auth/wrong-password') mensagem = 'Senha incorreta.';
      if (erro.code === 'auth/invalid-email') mensagem = 'Email inválido.';
      if (erro.code === 'auth/invalid-credential') mensagem = 'Email ou senha incorretos.';
      Alert.alert('Erro', mensagem);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Formulário */}
          <View style={styles.formulario}>
            <Text style={styles.titulo}>ENTRAR</Text>

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#6b7280"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="Senha"
              placeholderTextColor="#6b7280"
              value={senha}
              onChangeText={setSenha}
              secureTextEntry
            />

            <TouchableOpacity
              style={[styles.botao, carregando && styles.botaoDesabilitado]}
              onPress={entrar}
              disabled={carregando}
              activeOpacity={0.85}
            >
              <Text style={styles.botaoTexto}>
                {carregando ? 'ENTRANDO...' : 'ENTRAR'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Cadastro')}>
              <Text style={styles.linkTexto}>
                Não tem conta?{' '}
                <Text style={styles.link}>Criar Conta</Text>
              </Text>
            </TouchableOpacity>
          </View>

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
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  logo: {
    width: 250,
    height: 250,
    marginBottom: 12,
  },
  slogan: {
    fontFamily: 'Comfortaa_400Regular',
    fontSize: 12,
    color: '#8899aa',
    letterSpacing: 2,
  },
  formulario: {
    gap: 16,
  },
  titulo: {
    fontFamily: 'Comfortaa_700Bold',
    fontSize: 28,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 2,
  },
  input: {
    backgroundColor: '#252d4a',
    borderRadius: 12,
    padding: 18,
    fontSize: 15,
    color: '#ffffff',
    fontFamily: 'Comfortaa_400Regular',
  },
  botao: {
    backgroundColor: '#8B1A1A',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 4,
  },
  botaoDesabilitado: {
    opacity: 0.6,
  },
  botaoTexto: {
    fontFamily: 'Comfortaa_700Bold',
    color: '#ffffff',
    fontSize: 15,
    letterSpacing: 2,
  },
  linkTexto: {
    fontFamily: 'Comfortaa_400Regular',
    color: '#8899aa',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  link: {
    color: '#8B1A1A',
    fontFamily: 'Comfortaa_700Bold',
  },
});