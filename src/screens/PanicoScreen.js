import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Vibration,
  Alert,
  Linking,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { database } from '../firebase';
import { ref, set, onDisconnect } from 'firebase/database';

export default function PanicoScreen({ navigation }) {

  // ===== ESTADOS =====
  const [segurando, setSegurando] = useState(false);
  const [acionado, setAcionado] = useState(false);
  const [contatoPrincipal, setContatoPrincipal] = useState(null);
  const [localizacao, setLocalizacao] = useState(null);
  const [linkMapa, setLinkMapa] = useState(null);

  // ===== REFS =====
  const progresso = useRef(new Animated.Value(0)).current;
  const animacaoRef = useRef(null);
  const timerRef = useRef(null);
  const locationInterval = useRef(null);
  const sessaoId = useRef(Date.now().toString());

  // ===== INICIALIZAÇÃO =====
  useEffect(() => {
    carregarContatoPrincipal();
    pedirPermissaoGPS();
  }, []);

  async function pedirPermissaoGPS() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'GPS necessário',
        'O SafeApp precisa de acesso à localização para funcionar corretamente.'
      );
    }
  }

  async function carregarContatoPrincipal() {
    try {
      const dados = await AsyncStorage.getItem('contatos');
      if (dados) {
        const lista = JSON.parse(dados);
        const nivel1 = lista.find(c => c.nivel === 1);
        setContatoPrincipal(nivel1 || null);
      }
    } catch (erro) {
      console.log('Erro ao carregar contato:', erro);
    }
  }

  // ===== BOTÃO DE PÂNICO =====
  function iniciarPressao() {
    setSegurando(true);
    Vibration.vibrate(50);

    animacaoRef.current = Animated.timing(progresso, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: false,
    });

    animacaoRef.current.start();

    timerRef.current = setTimeout(() => {
      acionarAlarme();
    }, 2000);
  }

  function cancelarPressao() {
    setSegurando(false);

    if (animacaoRef.current) animacaoRef.current.stop();
    if (timerRef.current) clearTimeout(timerRef.current);

    Animated.timing(progresso, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }

  // ===== LOCALIZAÇÃO =====
  async function enviarLocalizacao() {
    try {
      // Verifica permissão
      const { status } = await Location.getForegroundPermissionsAsync();
      console.log('GPS permissão:', status);
      if (status !== 'granted') {
        console.log('Sem permissão de GPS!');
        return null;
      }

      // Tenta pegar localização com timeout
      console.log('Buscando localização...');
      const pos = await Promise.race([
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout GPS')), 10000)
        ),
      ]);

      console.log('GPS ok:', pos.coords.latitude, pos.coords.longitude);

      const { latitude, longitude } = pos.coords;
      setLocalizacao({ latitude, longitude });

      // Busca contatos
      const dados = await AsyncStorage.getItem('contatos');
      const listaContatos = dados ? JSON.parse(dados) : [];
      const numeros = listaContatos.map(c => c.telefone);

      // Salva no Firebase
      const locRef = ref(database, `alarmes/${sessaoId.current}`);
      await set(locRef, {
        latitude,
        longitude,
        timestamp: Date.now(),
        ativo: true,
        contatos: numeros,
      });

      console.log('Firebase ok!');

      const link = `https://safeapp-c925b.web.app?id=${sessaoId.current}`;
      setLinkMapa(link);
      onDisconnect(locRef).remove();

      return { link, latitude, longitude };

    } catch (erro) {
      console.log('Erro GPS:', erro.message);

      // Fallback — tenta pegar última posição conhecida
      try {
        console.log('Tentando última posição conhecida...');
        const ultimaPos = await Location.getLastKnownPositionAsync();
        if (ultimaPos) {
          const { latitude, longitude } = ultimaPos.coords;
          console.log('Última posição:', latitude, longitude);
          setLocalizacao({ latitude, longitude });

          const locRef = ref(database, `alarmes/${sessaoId.current}`);
          await set(locRef, {
            latitude,
            longitude,
            timestamp: Date.now(),
            ativo: true,
            contatos: [],
          });

          const link = `https://safeapp-c925b.web.app?id=${sessaoId.current}`;
          setLinkMapa(link);
          onDisconnect(locRef).remove();

          return { link, latitude, longitude };
        }
      } catch (e) {
        console.log('Última posição também falhou:', e.message);
      }

      return null;
    }
  }

  // ===== ACIONAR ALARME =====
  async function acionarAlarme() {
    setSegurando(false);
    setAcionado(true);
    Vibration.vibrate([0, 200, 100, 200]);

    // Envia localização e pega o resultado
    const resultado = await enviarLocalizacao();
    const link = resultado?.link;
    const lat = resultado?.latitude;
    const lng = resultado?.longitude;

    // Busca todos os contatos
    const dados = await AsyncStorage.getItem('contatos');
    const listaContatos = dados ? JSON.parse(dados) : [];

    if (listaContatos.length === 0) {
      Alert.alert(
        '🚨 Alarme Acionado',
        'Nenhum contato cadastrado. Adicione contatos de proteção!',
        [
          { text: 'Adicionar contato', onPress: () => navigation.navigate('Contatos') },
          { text: 'OK' },
        ]
      );
      return;
    }

    // Separa por nível
    const contatosNivel1 = listaContatos.filter(c => c.nivel === 1);
    const contatosNivel2 = listaContatos.filter(c => c.nivel === 2);
    const contatosNivel3 = listaContatos.filter(c => c.nivel === 3);

    // Monta o link final
    const linkFinal = link
      || (lat && lng ? `https://www.google.com/maps?q=${lat},${lng}` : 'Localização indisponível');

    const mensagem = encodeURIComponent(
      `🚨 ALERTA SAFEAPP\nEu acionei o alarme de emergência. Por favor me ajude!\n\nMinha localização em tempo real:\n${linkFinal}`
    );

    // Envia para nível 1
    contatosNivel1.forEach((contato, index) => {
      const numero = '55' + contato.telefone.replace(/\D/g, '');
      setTimeout(() => {
        Linking.openURL(`whatsapp://send?phone=${numero}&text=${mensagem}`);
      }, 1000 + (index * 2000));
    });

    // Envia para nível 2
    contatosNivel2.forEach((contato, index) => {
      const numero = '55' + contato.telefone.replace(/\D/g, '');
      setTimeout(() => {
        Linking.openURL(`whatsapp://send?phone=${numero}&text=${mensagem}`);
      }, 1000 + (contatosNivel1.length * 2000) + (index * 2000));
    });

    // Envia para nível 3
    contatosNivel3.forEach((contato, index) => {
      const numero = '55' + contato.telefone.replace(/\D/g, '');
      setTimeout(() => {
        Linking.openURL(`whatsapp://send?phone=${numero}&text=${mensagem}`);
      }, 1000 + ((contatosNivel1.length + contatosNivel2.length) * 2000) + (index * 2000));
    });
  }

  // ===== ENCERRAR ALARME =====
  async function encerrarAlarme() {
    setAcionado(false);
    setLinkMapa(null);
    setLocalizacao(null);
    progresso.setValue(0);

    if (locationInterval.current) {
      clearInterval(locationInterval.current);
      locationInterval.current = null;
    }

    try {
      const locRef = ref(database, `alarmes/${sessaoId.current}`);
      await set(locRef, null);
    } catch (erro) {
      console.log('Erro ao encerrar:', erro);
    }

    sessaoId.current = Date.now().toString();
    carregarContatoPrincipal();
  }

  // ===== ANIMAÇÃO =====
  const larguraBarra = progresso.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // ===== INTERFACE =====
  return (
    <SafeAreaView style={styles.container}>

      {/* Cabeçalho */}
      <View style={styles.cabecalho}>
        <Text style={styles.titulo}>SafeApp</Text>
        <Text style={styles.subtitulo}>
          {acionado ? '🔴 Alarme ativo' : 'Você não está só'}
        </Text>
      </View>

      {/* Aviso sem contato */}
      {!contatoPrincipal && !acionado && (
        <TouchableOpacity
          style={styles.avisoContainer}
          onPress={() => navigation.navigate('Contatos')}
        >
          <Text style={styles.avisoTexto}>⚠️ Nenhum contato de nível 1 cadastrado</Text>
          <Text style={styles.avisoSub}>Toque para adicionar →</Text>
        </TouchableOpacity>
      )}

      {/* Preview do contato principal */}
      {contatoPrincipal && !acionado && (
        <View style={styles.contatoPreview}>
          <Text style={styles.contatoPreviewLabel}>Ao acionar, avisará:</Text>
          <Text style={styles.contatoPreviewNome}>📞 {contatoPrincipal.nome}</Text>
          <Text style={styles.contatoPreviewTel}>{contatoPrincipal.telefone}</Text>
        </View>
      )}

      {/* Status */}
      <View style={styles.statusContainer}>
        {acionado ? (
          <View style={styles.statusAtivo}>
            <Text style={styles.statusAtivoTexto}>
              Contatos notificados via WhatsApp ✓{'\n'}
              Localização sendo compartilhada ✓{'\n'}
              Alarme ativo ✓
            </Text>

            {linkMapa && (
              <TouchableOpacity
                style={styles.botaoMapa}
                onPress={() => Linking.openURL(linkMapa)}
              >
                <Text style={styles.botaoMapaTexto}>🗺️ Ver no mapa</Text>
              </TouchableOpacity>
            )}

            {localizacao && (
              <Text style={styles.coordenadas}>
                📍 {localizacao.latitude.toFixed(6)}, {localizacao.longitude.toFixed(6)}
              </Text>
            )}
          </View>
        ) : (
          <Text style={styles.instrucao}>
            Segure o botão por 2 segundos{'\n'}para acionar o alarme silencioso
          </Text>
        )}
      </View>

      {/* Botão de pânico */}
      <View style={styles.botaoContainer}>
        <View style={styles.progressoContainer}>
          <Animated.View style={[styles.progressoBarra, { width: larguraBarra }]} />
        </View>

        <TouchableOpacity
          style={[
            styles.botaoPanico,
            segurando && styles.botaoPanicoSegurando,
            acionado && styles.botaoPanicoAtivo,
          ]}
          onPressIn={!acionado ? iniciarPressao : null}
          onPressOut={!acionado ? cancelarPressao : null}
          activeOpacity={0.8}
        >
          <Image
            source={require('../../assets/icon.png')}
            style={styles.botaoIcone}
          />
          <Text style={styles.botaoTexto}>
            {acionado ? 'ATIVO' : segurando ? 'SEGURE...' : 'ACIONAR'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Rodapé */}
      <View style={styles.rodape}>
        {acionado && (
          <TouchableOpacity style={styles.botaoEncerrar} onPress={encerrarAlarme}>
            <Text style={styles.botaoEncerrarTexto}>Encerrar alarme</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.botaoNav}
          onPress={() => navigation.navigate('Contatos')}
        >
          <Text style={styles.botaoNavTexto}>👥 Contatos de proteção</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.botaoNav}
          onPress={() => navigation.navigate('Configuracoes')}
        >
          <Text style={styles.botaoNavTexto}>⚙️ Configurações</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  cabecalho: {
    paddingTop: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  subtitulo: {
    fontSize: 16,
    color: '#a0a0b0',
    marginTop: 4,
  },
  avisoContainer: {
    marginHorizontal: 24,
    marginTop: 16,
    backgroundColor: '#2d2000',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#8B6000',
    alignItems: 'center',
    gap: 4,
  },
  avisoTexto: {
    color: '#FFB800',
    fontSize: 14,
    fontWeight: '600',
  },
  avisoSub: {
    color: '#997000',
    fontSize: 12,
  },
  contatoPreview: {
    marginHorizontal: 24,
    marginTop: 16,
    backgroundColor: '#1f1f3d',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#4169E1',
    alignItems: 'center',
    gap: 4,
  },
  contatoPreviewLabel: {
    color: '#666680',
    fontSize: 12,
  },
  contatoPreviewNome: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  contatoPreviewTel: {
    color: '#4169E1',
    fontSize: 13,
  },
  statusContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  instrucao: {
    fontSize: 16,
    color: '#a0a0b0',
    textAlign: 'center',
    lineHeight: 26,
  },
  statusAtivo: {
    backgroundColor: '#1f1f3d',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#4169E1',
    width: '100%',
    gap: 12,
  },
  statusAtivoTexto: {
    fontSize: 14,
    color: '#8099f0',
    lineHeight: 26,
  },
  botaoMapa: {
    backgroundColor: '#4169E1',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  botaoMapaTexto: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  coordenadas: {
    fontSize: 11,
    color: '#666680',
    textAlign: 'center',
  },
  botaoContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 16,
  },
  progressoContainer: {
    width: 220,
    height: 4,
    backgroundColor: '#333350',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressoBarra: {
    height: '100%',
    backgroundColor: '#B03A10',
    borderRadius: 2,
  },
  botaoPanico: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#2a2a4a',
    borderWidth: 3,
    borderColor: '#B03A10',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  botaoPanicoSegurando: {
    backgroundColor: '#1f1f3d',
    borderColor: '#D04010',
  },
  botaoPanicoAtivo: {
    backgroundColor: '#B03A10',
    borderColor: '#D04010',
  },
  botaoIcone: {
    width: 90,
    height: 90,
    resizeMode: 'contain',
  },
  botaoTexto: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 2,
  },
  rodape: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 12,
  },
  botaoEncerrar: {
    backgroundColor: '#1f1f3d',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#B03A10',
  },
  botaoEncerrarTexto: {
    color: '#ff9980',
    fontSize: 16,
    fontWeight: '600',
  },
  botaoNav: {
    backgroundColor: '#252540',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  botaoNavTexto: {
    color: '#a0a0b0',
    fontSize: 15,
  },
});