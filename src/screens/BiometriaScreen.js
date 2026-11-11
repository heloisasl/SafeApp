import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Image } from 'react-native';
import { useFonts, Comfortaa_700Bold, Comfortaa_400Regular } from '@expo-google-fonts/comfortaa';
import { autenticar } from '../biometria';

// Tela mostrada depois que a pessoa digita o código secreto na calculadora,
// quando a biometria está ativada em Configurações.
export default function BiometriaScreen({ navigation }) {
  const [estado, setEstado] = useState('aguardando'); // aguardando | ok | falhou
  const tentando = useRef(false);
  const [fontsLoaded] = useFonts({ Comfortaa_700Bold, Comfortaa_400Regular });

  useEffect(() => {
    tentar();
  }, []);

  if (!fontsLoaded) return null;

  async function tentar() {
    if (tentando.current) return;
    tentando.current = true;
    setEstado('aguardando');
    const ok = await autenticar('Confirme sua identidade para abrir o SafeApp');
    tentando.current = false;
    if (ok) {
      setEstado('ok');
      setTimeout(() => navigation.replace('Panico'), 700);
    } else {
      setEstado('falhou');
    }
  }

  const titulo =
    estado === 'ok' ? 'Identidade confirmada' : estado === 'falhou' ? 'Não foi possível confirmar' : 'Confirme sua identidade';
  const descricao =
    estado === 'ok'
      ? 'Abrindo o SafeApp...'
      : estado === 'falhou'
      ? 'Tente de novo ou volte para a calculadora.'
      : 'Use sua digital ou o Face ID para abrir o SafeApp.';

  return (
    <SafeAreaView style={styles.container}>
      <Image source={require('../../assets/escudo.png')} style={styles.logo} resizeMode="contain" />

      <TouchableOpacity
        style={[styles.circulo, estado === 'ok' && styles.circuloOk]}
        onPress={tentar}
        disabled={estado === 'ok'}
        activeOpacity={0.85}
      >
        <Text style={styles.icone}>{estado === 'ok' ? '✓' : '🔐'}</Text>
      </TouchableOpacity>

      <Text style={styles.titulo}>{titulo}</Text>
      <Text style={styles.descricao}>{descricao}</Text>

      {estado === 'falhou' ? (
        <Text style={styles.toque}>Toque no ícone para tentar de novo</Text>
      ) : null}

      <View style={{ height: 36 }} />

      <TouchableOpacity style={styles.botaoVoltar} onPress={() => navigation.goBack()} activeOpacity={0.85}>
        <Text style={styles.botaoVoltarTexto}>VOLTAR PARA A CALCULADORA</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1f3c',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 14,
  },
  logo: { width: 64, height: 64, marginBottom: 14 },
  circulo: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#252d4a',
    borderWidth: 3,
    borderColor: '#8B1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  circuloOk: { borderColor: '#3fae7a' },
  icone: { fontSize: 64, color: '#3fae7a' },
  titulo: { fontFamily: 'Comfortaa_700Bold', fontSize: 22, color: '#ffffff', textAlign: 'center' },
  descricao: {
    fontFamily: 'Comfortaa_400Regular',
    fontSize: 13,
    color: '#8899aa',
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  },
  toque: { fontFamily: 'Comfortaa_400Regular', fontSize: 12, color: '#8099f0', textAlign: 'center' },
  botaoVoltar: {
    borderWidth: 1,
    borderColor: '#8B1A1A',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  botaoVoltarTexto: {
    fontFamily: 'Comfortaa_700Bold',
    color: '#e57373',
    fontSize: 13,
    letterSpacing: 1.5,
  },
});
