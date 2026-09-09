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
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../firebase';
import { useFonts, Comfortaa_700Bold, Comfortaa_400Regular } from '@expo-google-fonts/comfortaa';

export default function CadastroScreen({ navigation }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [carregando, setCarregando] = useState(false);

  const [fontsLoaded] = useFonts({
    Comfortaa_700Bold,
    Comfortaa_400Regular,
  });

  if (!fontsLoaded) return null;

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
            <Text style={styles.titulo}>Criar conta</Text>

            <TextInput
              style={styles.input}
              placeholder="Seu nome"
              placeholderTextColor="#6b7280"
              value={nome}
              onChangeText={setNome}
              autoCapitalize="words"
            />

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

            <TextInput
              style={styles.input}
              placeholder="Confirmar senha"
              placeholderTextColor="#6b7280"
              value={confirmarSenha}
              onChangeText={setConfirmarSenha}
              secureTextEntry
            />

            <TouchableOpacity
              style={[styles.botao, carregando && styles.botaoDesabilitado]}
              onPress={cadastrar}
              disabled={carregando}
              activeOpacity={0.85}
            >
              <Text style={styles.botaoTexto}>
                {carregando ? 'CRIANDO...' : 'CRIAR CONTA'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.linkTexto}>
                Já tem conta?{' '}
                <Text style={styles.link}>Entrar</Text>
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
    paddingBottom: 32,
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
    gap: 14,
  },
  titulo: {
    fontFamily: 'Comfortaa_700Bold',
    fontSize: 28,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
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