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
import NetInfo from '@react-native-community/netinfo';
import { useFonts, Comfortaa_700Bold, Comfortaa_400Regular } from '@expo-google-fonts/comfortaa';

export default function PanicoScreen({ navigation }) {

  const [segurando, setSegurando] = useState(false);
  const [acionado, setAcionado] = useState(false);
  const [contatoPrincipal, setContatoPrincipal] = useState(null);
  const [localizacao, setLocalizacao] = useState(null);
  const [linkMapa, setLinkMapa] = useState(null);
  const [modoOffline, setModoOffline] = useState(false);

  const progresso = useRef(new Animated.Value(0)).current;
  const animacaoRef = useRef(null);
  const timerRef = useRef(null);
  const locationInterval = useRef(null);
  const sessaoId = useRef(Date.now().toString());

  const [fontsLoaded] = useFonts({ Comfortaa_700Bold, Comfortaa_400Regular });

  useEffect(() => {
    carregarContatoPrincipal();
    pedirPermissaoGPS();
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(async (state) => {
      if (state.isConnected) sincronizarOffline();
    });
    return unsubscribe;
  }, []);

  if (!fontsLoaded) return null;

  async function pedirPermissaoGPS() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('GPS necessário', 'O SafeApp precisa de acesso à localização para funcionar corretamente.');
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

  async function sincronizarOffline() {
    try {
      const chaves = await AsyncStorage.getAllKeys();
      const chavesOffline = chaves.filter(k => k.startsWith('alarme_offline_'));
      if (chavesOffline.length === 0) return;
      for (const chave of chavesOffline) {
        const dados = await AsyncStorage.getItem(chave);
        if (dados) {
          const alarme = JSON.parse(dados);
          const id = chave.replace('alarme_offline_', '');
          const locRef = ref(database, `alarmes/${id}`);
          await set(locRef, alarme);
          await AsyncStorage.removeItem(chave);
        }
      }
    } catch (erro) {
      console.log('Erro ao sincronizar:', erro);
    }
  }

  async function pegarContatos() {
    try {
      const dados = await AsyncStorage.getItem('contatos');
      const lista = dados ? JSON.parse(dados) : [];
      return lista.map(c => c.telefone);
    } catch { return []; }
  }

  function iniciarPressao() {
    setSegurando(true);
    Vibration.vibrate(50);
    animacaoRef.current = Animated.timing(progresso, {
      toValue: 1, duration: 2000, useNativeDriver: false,
    });
    animacaoRef.current.start();
    timerRef.current = setTimeout(() => acionarAlarme(), 2000);
  }

  function cancelarPressao() {
    setSegurando(false);
    if (animacaoRef.current) animacaoRef.current.stop();
    if (timerRef.current) clearTimeout(timerRef.current);
    Animated.timing(progresso, { toValue: 0, duration: 300, useNativeDriver: false }).start();
  }

  async function enviarLocalizacao() {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') return null;
      const pos = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout GPS')), 10000)),
      ]);
      const { latitude, longitude } = pos.coords;
      setLocalizacao({ latitude, longitude });
      const conexao = await NetInfo.fetch();
      const dadosAlarme = { latitude, longitude, timestamp: Date.now(), ativo: true, contatos: await pegarContatos() };
      if (conexao.isConnected) {
        const locRef = ref(database, `alarmes/${sessaoId.current}`);
        await set(locRef, dadosAlarme);
        onDisconnect(locRef).remove();
        setModoOffline(false);
      } else {
        await AsyncStorage.setItem(`alarme_offline_${sessaoId.current}`, JSON.stringify(dadosAlarme));
        setModoOffline(true);
      }
      const link = `https://www.google.com/maps?q=${latitude},${longitude}`;
      setLinkMapa(link);
      return { link, latitude, longitude };
    } catch (erro) {
      console.log('Erro GPS:', erro.message);
      try {
        const ultimaPos = await Location.getLastKnownPositionAsync();
        if (ultimaPos) {
          const { latitude, longitude } = ultimaPos.coords;
          setLocalizacao({ latitude, longitude });
          const link = `https://www.google.com/maps?q=${latitude},${longitude}`;
          setLinkMapa(link);
          return { link, latitude, longitude };
        }
      } catch (e) { console.log('Última posição falhou:', e.message); }
      return null;
    }
  }

  async function acionarAlarme() {
    setSegurando(false);
    setAcionado(true);
    Vibration.vibrate([0, 200, 100, 200]);
    const resultado = await enviarLocalizacao();
    const link = resultado?.link;
    const lat = resultado?.latitude;
    const lng = resultado?.longitude;
    const dados = await AsyncStorage.getItem('contatos');
    const listaContatos = dados ? JSON.parse(dados) : [];
    if (listaContatos.length === 0) {
      Alert.alert('🚨 Alarme Acionado', 'Nenhum contato cadastrado. Adicione contatos de proteção!', [
        { text: 'Adicionar contato', onPress: () => navigation.navigate('Contatos') },
        { text: 'OK' },
      ]);
      return;
    }
    const contatosNivel1 = listaContatos.filter(c => c.nivel === 1);
    const contatosNivel2 = listaContatos.filter(c => c.nivel === 2);
    const contatosNivel3 = listaContatos.filter(c => c.nivel === 3);
    const linkFinal = link || (lat && lng ? `https://www.google.com/maps?q=${lat},${lng}` : '');
    const conexao = await NetInfo.fetch();
    if (conexao.isConnected) {
      const mensagem = encodeURIComponent(
        `🚨 ALERTA DE EMERGÊNCIA — SAFEAPP 🚨\n\nEu acionei o alarme de emergência e preciso de ajuda urgente!\n\n📍 MINHA LOCALIZAÇÃO NO GOOGLE MAPS:\n${linkFinal}\n\n⚠️ Por favor, me ligue ou vá até minha localização imediatamente!`
      );
      contatosNivel1.forEach((contato, index) => {
        const numero = '55' + contato.telefone.replace(/\D/g, '');
        setTimeout(() => Linking.openURL(`whatsapp://send?phone=${numero}&text=${mensagem}`), 1000 + (index * 2000));
      });
      contatosNivel2.forEach((contato, index) => {
        const numero = '55' + contato.telefone.replace(/\D/g, '');
        setTimeout(() => Linking.openURL(`whatsapp://send?phone=${numero}&text=${mensagem}`), 1000 + (contatosNivel1.length * 2000) + (index * 2000));
      });
      contatosNivel3.forEach((contato, index) => {
        const numero = '55' + contato.telefone.replace(/\D/g, '');
        setTimeout(() => Linking.openURL(`whatsapp://send?phone=${numero}&text=${mensagem}`), 1000 + ((contatosNivel1.length + contatosNivel2.length) * 2000) + (index * 2000));
      });
    } else {
      const linkMaps = lat && lng ? `https://www.google.com/maps?q=${lat},${lng}` : null;
      const mensagemSMS = encodeURIComponent(
        `🚨 ALERTA DE EMERGÊNCIA — SAFEAPP 🚨\n\nEu acionei o alarme de emergência e preciso de ajuda urgente!\n\n📍 MINHA LOCALIZAÇÃO:\n${linkMaps ? `Abra o link abaixo para ver onde estou:\n${linkMaps}` : 'Localização não disponível no momento.'}\n\n⚠️ Por favor, me ligue ou vá até minha localização imediatamente!`
      );
      const todosContatos = [...contatosNivel1, ...contatosNivel2, ...contatosNivel3];
      todosContatos.forEach((contato, index) => {
        const numero = contato.telefone.replace(/\D/g, '');
        setTimeout(() => Linking.openURL(`sms:+55${numero}&body=${mensagemSMS}`), 1000 + (index * 2000));
      });
    }
  }

  async function encerrarAlarme() {
    setAcionado(false);
    setLinkMapa(null);
    setLocalizacao(null);
    setModoOffline(false);
    progresso.setValue(0);
    if (locationInterval.current) { clearInterval(locationInterval.current); locationInterval.current = null; }
    try {
      const locRef = ref(database, `alarmes/${sessaoId.current}`);
      await set(locRef, null);
    } catch (erro) { console.log('Erro ao encerrar:', erro); }
    sessaoId.current = Date.now().toString();
    carregarContatoPrincipal();
  }

  const larguraBarra = progresso.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <SafeAreaView style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <Image source={require('../../assets/icon.png')} style={styles.headerLogo} resizeMode="contain"/>
        <View>
          <Text style={styles.headerTitulo}>Safe <Text style={styles.headerApp}>App</Text></Text>
          <Text style={styles.headerSlogan}>VOCÊ NUNCA ESTARÁ SÓ</Text>
        </View>
      </View>

      {/* Card contato principal */}
      {contatoPrincipal && !acionado && (
        <View style={styles.cardContato}>
          <Text style={styles.cardLabel}>Ao acionar, avisará:</Text>
          <View style={styles.cardRow}>
            <Text style={styles.cardIcone}>📞</Text>
            <Text style={styles.cardNome}>{contatoPrincipal.nome}</Text>
          </View>
          <Text style={styles.cardTel}>{contatoPrincipal.telefone}</Text>
        </View>
      )}

      {!contatoPrincipal && !acionado && (
        <TouchableOpacity style={styles.cardAviso} onPress={() => navigation.navigate('Contatos')}>
          <Text style={styles.avisoTexto}>⚠️ Nenhum contato de nível 1 cadastrado</Text>
          <Text style={styles.avisoSub}>Toque para adicionar →</Text>
        </TouchableOpacity>
      )}

      {/* Instrução */}
      <View style={styles.instrucaoContainer}>
        {!acionado ? (
          <Text style={styles.instrucao}>
            {segurando ? 'Segure...' : 'Apenas clique para acionar o\nbotão silencioso.'}
          </Text>
        ) : (
          <View style={styles.statusAtivo}>
            <Text style={styles.statusTexto}>
              {modoOffline ? 'Contatos notificados via SMS ✓' : 'Contatos notificados via WhatsApp ✓'}{'\n'}
              {modoOffline ? '⚠️ Sem internet — localização salva localmente' : 'Localização compartilhada ✓'}{'\n'}
              Alarme ativo ✓
            </Text>
            {linkMapa && !modoOffline && (
              <TouchableOpacity style={styles.botaoMapa} onPress={() => Linking.openURL(linkMapa)}>
                <Text style={styles.botaoMapaTexto}>🗺️ Ver no Google Maps</Text>
              </TouchableOpacity>
            )}
            {localizacao && (
              <Text style={styles.coordenadas}>
                📍 {localizacao.latitude.toFixed(6)}, {localizacao.longitude.toFixed(6)}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Barra de progresso */}
      {!acionado && (
        <View style={styles.progressoContainer}>
          <Animated.View style={[styles.progressoBarra, { width: larguraBarra }]} />
        </View>
      )}

      {/* Botão pânico */}
      <View style={styles.botaoContainer}>
        <TouchableOpacity
          style={[styles.botaoPanico, segurando && styles.botaoPanicoSegurando, acionado && styles.botaoPanicoAtivo]}
          onPressIn={!acionado ? iniciarPressao : null}
          onPressOut={!acionado ? cancelarPressao : null}
          activeOpacity={0.85}
        >
          <Image source={require('../../assets/icon.png')} style={styles.botaoIcone} resizeMode="contain"/>
          <Text style={styles.botaoTexto}>{acionado ? 'ATIVO' : segurando ? 'SEGURE...' : 'ACIONAR'}</Text>
        </TouchableOpacity>
      </View>

      {/* Rodapé */}
      <View style={styles.rodape}>
        {acionado && (
          <TouchableOpacity style={styles.botaoEncerrar} onPress={encerrarAlarme}>
            <Text style={styles.botaoEncerrarTexto}>Encerrar alarme</Text>
          </TouchableOpacity>
        )}
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate('Contatos')}>
            <Text style={styles.navIcone}>👥</Text>
            <Text style={styles.navTexto}>Contatos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate('Configuracoes')}>
            <Text style={styles.navIcone}>⚙️</Text>
            <Text style={styles.navTexto}>Configurações</Text>
          </TouchableOpacity>
        </View>
      </View>

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
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerLogo: {
    width: 44,
    height: 44,
  },
  headerTitulo: {
    fontFamily: 'Comfortaa_700Bold',
    fontSize: 22,
    color: '#ffffff',
  },
  headerApp: {
    color: '#8B1A1A',
  },
  headerSlogan: {
    fontFamily: 'Comfortaa_400Regular',
    fontSize: 9,
    color: '#8899aa',
    letterSpacing: 1.5,
  },
  cardContato: {
    marginHorizontal: 24,
    marginTop: 8,
    backgroundColor: '#252d4a',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#3a4a7a',
  },
  cardLabel: {
    fontFamily: 'Comfortaa_400Regular',
    fontSize: 11,
    color: '#8899aa',
    marginBottom: 6,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  cardIcone: {
    fontSize: 18,
  },
  cardNome: {
    fontFamily: 'Comfortaa_700Bold',
    fontSize: 18,
    color: '#ffffff',
  },
  cardTel: {
    fontFamily: 'Comfortaa_400Regular',
    fontSize: 12,
    color: '#6b7faa',
    marginTop: 2,
  },
  cardAviso: {
    marginHorizontal: 24,
    marginTop: 8,
    backgroundColor: '#2d2000',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#8B6000',
    alignItems: 'center',
  },
  avisoTexto: {
    fontFamily: 'Comfortaa_700Bold',
    fontSize: 13,
    color: '#FFB800',
  },
  avisoSub: {
    fontFamily: 'Comfortaa_400Regular',
    fontSize: 11,
    color: '#997000',
    marginTop: 2,
  },
  instrucaoContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  instrucao: {
    fontFamily: 'Comfortaa_400Regular',
    fontSize: 15,
    color: '#8899aa',
    textAlign: 'center',
    lineHeight: 24,
  },
  statusAtivo: {
    backgroundColor: '#252d4a',
    borderRadius: 14,
    padding: 18,
    gap: 10,
  },
  statusTexto: {
    fontFamily: 'Comfortaa_400Regular',
    fontSize: 13,
    color: '#8099f0',
    lineHeight: 22,
  },
  botaoMapa: {
    backgroundColor: '#8B1A1A',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  botaoMapaTexto: {
    fontFamily: 'Comfortaa_700Bold',
    color: '#ffffff',
    fontSize: 13,
  },
  coordenadas: {
    fontFamily: 'Comfortaa_400Regular',
    fontSize: 10,
    color: '#6b7faa',
    textAlign: 'center',
  },
  progressoContainer: {
    marginHorizontal: 60,
    height: 3,
    backgroundColor: '#252d4a',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressoBarra: {
    height: '100%',
    backgroundColor: '#8B1A1A',
    borderRadius: 2,
  },
  botaoContainer: {
    alignItems: 'center',
    paddingBottom: 24,
  },
  botaoPanico: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: '#252d4a',
    borderWidth: 3,
    borderColor: '#8B1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  botaoPanicoSegurando: {
    backgroundColor: '#1a1f3c',
    borderColor: '#c0392b',
  },
  botaoPanicoAtivo: {
    backgroundColor: '#8B1A1A',
    borderColor: '#c0392b',
  },
  botaoIcone: {
    width: 80,
    height: 80,
  },
  botaoTexto: {
    fontFamily: 'Comfortaa_700Bold',
    fontSize: 13,
    color: '#ffffff',
    letterSpacing: 2,
  },
  rodape: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 12,
  },
  botaoEncerrar: {
    backgroundColor: '#252d4a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#8B1A1A',
  },
  botaoEncerrarTexto: {
    fontFamily: 'Comfortaa_700Bold',
    color: '#ff9980',
    fontSize: 15,
  },
  navRow: {
    flexDirection: 'row',
    gap: 12,
  },
  navBtn: {
    flex: 1,
    backgroundColor: '#252d4a',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 4,
  },
  navIcone: {
    fontSize: 20,
  },
  navTexto: {
    fontFamily: 'Comfortaa_400Regular',
    fontSize: 12,
    color: '#8899aa',
  },
});