import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function entrar() {
    if (!email.trim() || !senha) {
      Alert.alert('Atenção', 'Preencha email e senha.');
      return;
    }

    setCarregando(true);

    try {
      await signInWithEmailAndPassword(auth, email, senha);
      // Navegação acontece automaticamente pelo App.js
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
        <ScrollView contentContainerStyle={styles.scroll}>

          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/icon.png')}
              style={styles.logo}
            />
            <Text style={styles.titulo}>SafeApp</Text>
            <Text style={styles.slogan}>Você não está só</Text>
          </View>

          {/* Formulário */}
          <View style={styles.formulario}>
            <Text style={styles.formTitulo}>Entrar</Text>

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#666680"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="Senha"
              placeholderTextColor="#666680"
              value={senha}
              onChangeText={setSenha}
              secureTextEntry
            />

            <TouchableOpacity
              style={[styles.botao, carregando && styles.botaoDesabilitado]}
              onPress={entrar}
              disabled={carregando}
            >
              <Text style={styles.botaoTexto}>
                {carregando ? 'Entrando...' : 'Entrar'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botaoSecundario}
              onPress={() => navigation.navigate('Cadastro')}
            >
              <Text style={styles.botaoSecundarioTexto}>
                Não tem conta? <Text style={styles.link}>Criar conta</Text>
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
    backgroundColor: '#1a1a2e',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 90,
    height: 90,
    resizeMode: 'contain',
    marginBottom: 12,
  },
  titulo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  slogan: {
    fontSize: 14,
    color: '#a0a0b0',
    marginTop: 4,
    letterSpacing: 1,
  },
  formulario: {
    gap: 12,
  },
  formTitulo: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#252540',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#ffffff',
    borderWidth: 0.5,
    borderColor: '#333350',
  },
  botao: {
    backgroundColor: '#B03A10',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  botaoDesabilitado: {
    opacity: 0.6,
  },
  botaoTexto: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  botaoSecundario: {
    alignItems: 'center',
    padding: 12,
  },
  botaoSecundarioTexto: {
    color: '#a0a0b0',
    fontSize: 14,
  },
  link: {
    color: '#B03A10',
    fontWeight: '600',
  },
});