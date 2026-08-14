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
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../firebase';

export default function CadastroScreen({ navigation }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function cadastrar() {
    if (!nome.trim() || !email.trim() || !senha || !confirmarSenha) {
      Alert.alert('Atenção', 'Preencha todos os campos.');
      return;
    }

    if (senha !== confirmarSenha) {
      Alert.alert('Atenção', 'As senhas não coincidem.');
      return;
    }

    if (senha.length < 6) {
      Alert.alert('Atenção', 'A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setCarregando(true);

    try {
      const resultado = await createUserWithEmailAndPassword(auth, email, senha);
      await updateProfile(resultado.user, { displayName: nome });
      // Navegação acontece automaticamente pelo App.js
    } catch (erro) {
      let mensagem = 'Erro ao criar conta.';
      if (erro.code === 'auth/email-already-in-use') mensagem = 'Este email já está em uso.';
      if (erro.code === 'auth/invalid-email') mensagem = 'Email inválido.';
      if (erro.code === 'auth/weak-password') mensagem = 'Senha muito fraca.';
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
            <Text style={styles.formTitulo}>Criar conta</Text>

            <TextInput
              style={styles.input}
              placeholder="Seu nome"
              placeholderTextColor="#666680"
              value={nome}
              onChangeText={setNome}
              autoCapitalize="words"
            />

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
              placeholder="Senha (mín. 6 caracteres)"
              placeholderTextColor="#666680"
              value={senha}
              onChangeText={setSenha}
              secureTextEntry
            />

            <TextInput
              style={styles.input}
              placeholder="Confirmar senha"
              placeholderTextColor="#666680"
              value={confirmarSenha}
              onChangeText={setConfirmarSenha}
              secureTextEntry
            />

            <TouchableOpacity
              style={[styles.botao, carregando && styles.botaoDesabilitado]}
              onPress={cadastrar}
              disabled={carregando}
            >
              <Text style={styles.botaoTexto}>
                {carregando ? 'Criando conta...' : 'Criar conta'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botaoSecundario}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.botaoSecundarioTexto}>
                Já tem conta? <Text style={styles.link}>Entrar</Text>
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