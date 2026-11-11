import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Vibration,
  Alert,
  Linking,
  Image,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { database } from '../firebase';
import { ref, set, onDisconnect } from 'firebase/database';
import NetInfo from '@react-native-community/netinfo';
import { useFonts, Comfortaa_700Bold, Comfortaa_400Regular } from '@expo-google-fonts/comfortaa';
import { registrarAlarme, encerrarRegistro } from '../historico';
import BotaoAssistente from '../components/BotaoAssistente';

export default function PanicoScreen({ navigation, route }) {

  const [acionado, setAcionado] = useState(false);
  const [contatoPrincipal, setContatoPrincipal] = useState(null);
  const [localizacao, setLocalizacao] = useState(null);
  const [linkMapa, setLinkMapa] = useState(null);
  const [modoOffline, setModoOffline] = useState(false);
  const [menuPolicia, setMenuPolicia] = useState(false);

  const acionandoRef = useRef(false);
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

  // O robô de ajuda pode pedir para acionar o alarme (navigation.popTo('Panico', { acionar: true }))
  useEffect(() => {
    if (route?.params?.acionar) {
      navigation.setParams({ acionar: false });
      acionarAlarme();
    }
  }, [route?.params?.acionar]);

  if (!fontsLoaded) return null;

  // ---------- Botão POLÍCIA ----------
  // O celular não permite discar sozinho: o app abre o discador já com o número e a pessoa confirma.
  function ligar(numero) {
    setMenuPolicia(false);
    Linking.openURL(`tel:${numero}`).catch(() =>
      Alert.alert('Não foi possível ligar', `Disque ${numero} no seu telefone.`)
    );
  }

  async function abrirDelegacia() {
    setMenuPolicia(false);
    const conexao = await NetInfo.fetch();
    if (!conexao.isConnected) {
      Alert.alert('Sem internet', 'Não dá para abrir o mapa agora. Ligue 180 ou 190.');
      return;
    }
    Linking.openURL('https://www.google.com/maps/search/?api=1&query=Delegacia+da+Mulher+perto+de+mim');
  }

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
    } catch {
      return [];
    }
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
      const dadosAlarme = {
        latitude,
        longitude,
        timestamp: Date.now(),
        ativo: true,
        contatos: await pegarContatos(),
      };

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
      } catch (e) {
        console.log('Última posição falhou:', e.message);
      }
      return null;
    }
  }

  async function acionarAlarme() {
    // Evita disparar duas vezes se a pessoa tocar mais de uma vez seguida
    if (acionandoRef.current) return;
    acionandoRef.current = true;

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

    // Registra no histórico de alarmes (salvo só neste aparelho)
    await registrarAlarme({
      id: sessaoId.current,
      latitude: lat,
      longitude: lng,
      via: conexao.isConnected ? 'whatsapp' : 'sms',
      contatos: listaContatos.map(c => ({ nome: c.nome, nivel: c.nivel })),
    });

    if (conexao.isConnected) {
      const mensagem = encodeURIComponent(
        `🚨 ALERTA DE EMERGÊNCIA — SAFEAPP 🚨\n\nEu acionei o alarme de emergência e preciso de ajuda urgente!\n\n📍 MINHA LOCALIZAÇÃO NO GOOGLE MAPS:\n${linkFinal}\n\n⚠️ Por favor, me ligue ou vá até minha localização imediatamente!`
      );

      contatosNivel1.forEach((contato, index) => {
        const numero = '55' + contato.telefone.replace(/\D/g, '');
        setTimeout(() => Linking.openURL(`whatsapp://send?phone=${numero}&text=${mensagem}`), 1000 + index * 2000);
      });
      contatosNivel2.forEach((contato, index) => {
        const numero = '55' + contato.telefone.replace(/\D/g, '');
        setTimeout(() => Linking.openURL(`whatsapp://send?phone=${numero}&text=${mensagem}`), 1000 + contatosNivel1.length * 2000 + index * 2000);
      });
      contatosNivel3.forEach((contato, index) => {
        const numero = '55' + contato.telefone.replace(/\D/g, '');
        setTimeout(() => Linking.openURL(`whatsapp://send?phone=${numero}&text=${mensagem}`), 1000 + (contatosNivel1.length + contatosNivel2.length) * 2000 + index * 2000);
      });
    } else {
      const linkMaps = lat && lng ? `https://www.google.com/maps?q=${lat},${lng}` : null;
      const mensagemSMS = encodeURIComponent(
        `🚨 ALERTA DE EMERGÊNCIA — SAFEAPP 🚨\n\nEu acionei o alarme de emergência e preciso de ajuda urgente!\n\n📍 MINHA LOCALIZAÇÃO:\n${linkMaps ? `Abra o link abaixo para ver onde estou:\n${linkMaps}` : 'Localização não disponível no momento.'}\n\n⚠️ Por favor, me ligue ou vá até minha localização imediatamente!`
      );
      const todosContatos = [...contatosNivel1, ...contatosNivel2, ...contatosNivel3];
      todosContatos.forEach((contato, index) => {
        const numero = contato.telefone.replace(/\D/g, '');
        setTimeout(() => Linking.openURL(`sms:+55${numero}&body=${mensagemSMS}`), 1000 + index * 2000);
      });
    }
  }

  async function encerrarAlarme() {
    setAcionado(false);
    setLinkMapa(null);
    setLocalizacao(null);
    setModoOffline(false);
    acionandoRef.current = false;
    await encerrarRegistro(sessaoId.current);
    try {
      const locRef = ref(database, `alarmes/${sessaoId.current}`);
      await set(locRef, null);
    } catch (erro) {
      console.log('Erro ao encerrar:', erro);
    }
    sessaoId.current = Date.now().toString();
    carregarContatoPrincipal();
  }

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.header}>
        <BotaoAssistente style={{ top: 14, right: 18 }} onPress={() => navigation.navigate('Robo')} />
        <Image
          source={require('../../assets/escudo.png')}
          style={styles.headerLogo}
          resizeMode="contain"
        />
        <Text style={styles.headerTitulo}>
          Safe <Text style={styles.headerApp}>App</Text>
        </Text>
        <Text style={styles.headerSlogan}>VOCÊ NUNCA ESTARÁ SÓ</Text>
      </View>

      {contatoPrincipal && !acionado ? (
        <View style={styles.cardContato}>
          <Text style={styles.cardLabel}>Ao acionar, avisará:</Text>
          <View style={styles.cardRow}>
            <Text style={styles.cardIcone}>📞</Text>
            <Text style={styles.cardNome}>{contatoPrincipal.nome}</Text>
          </View>
          <Text style={styles.cardTel}>{contatoPrincipal.telefone}</Text>
        </View>
      ) : null}

      {!contatoPrincipal && !acionado ? (
        <TouchableOpacity style={styles.cardAviso} onPress={() => navigation.navigate('Contatos')}>
          <Text style={styles.avisoTexto}>⚠️ Nenhum contato de nível 1 cadastrado</Text>
          <Text style={styles.avisoSub}>Toque para adicionar →</Text>
        </TouchableOpacity>
      ) : null}

      <View style={styles.instrucaoContainer}>
        {!acionado ? (
          <Text style={styles.instrucao}>
            Toque em CONTATOS para avisar quem você cadastrou, ou em POLÍCIA para pedir ajuda oficial.
          </Text>
        ) : (
          <View style={styles.statusAtivo}>
            <Text style={styles.statusTexto}>
              {modoOffline ? 'Contatos notificados via SMS ✓' : 'Contatos notificados via WhatsApp ✓'}
            </Text>
            <Text style={styles.statusTexto}>
              {modoOffline ? '⚠️ Sem internet — localização salva localmente' : 'Localização compartilhada ✓'}
            </Text>
            <Text style={styles.statusTexto}>Alarme ativo ✓</Text>

            {linkMapa && !modoOffline ? (
              <TouchableOpacity style={styles.botaoMapa} onPress={() => Linking.openURL(linkMapa)}>
                <Text style={styles.botaoMapaTexto}>🗺️ Ver no Google Maps</Text>
              </TouchableOpacity>
            ) : null}

            {localizacao ? (
              <Text style={styles.coordenadas}>
                📍 {localizacao.latitude.toFixed(6)}, {localizacao.longitude.toFixed(6)}
              </Text>
            ) : null}
          </View>
        )}
      </View>

      <View style={styles.botaoContainer}>
        <TouchableOpacity
          style={[styles.botaoPanico, acionado && styles.botaoPanicoAtivo]}
          onPress={acionarAlarme}
          disabled={acionado}
          activeOpacity={0.85}
          accessibilityLabel="Avisar meus contatos"
        >
          <Image
            source={require('../../assets/escudo.png')}
            style={styles.botaoIcone}
            resizeMode="contain"
          />
          <Text style={styles.botaoTexto}>
            {acionado ? 'ATIVO' : 'CONTATOS'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.botaoPanico, styles.botaoPolicia]}
          onPress={() => setMenuPolicia(true)}
          activeOpacity={0.85}
          accessibilityLabel="Chamar a polícia ou a delegacia da mulher"
        >
          <Image
            source={require('../../assets/distintivo.png')}
            style={styles.botaoIcone}
            resizeMode="contain"
          />
          <Text style={styles.botaoTexto}>POLÍCIA</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.rodape}>
        {acionado ? (
          <TouchableOpacity style={styles.botaoEncerrar} onPress={encerrarAlarme}>
            <Text style={styles.botaoEncerrarTexto}>Encerrar alarme</Text>
          </TouchableOpacity>
        ) : null}

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

      <Modal
        visible={menuPolicia}
        transparent
        animationType="slide"
        onRequestClose={() => setMenuPolicia(false)}
      >
        <TouchableOpacity
          style={styles.modalFundo}
          activeOpacity={1}
          onPress={() => setMenuPolicia(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.modalCaixa}>
            <View style={styles.modalPuxador} />
            <Text style={styles.modalTitulo}>Pedir ajuda oficial</Text>
            <Text style={styles.modalSub}>O celular abre a ligação e você confirma.</Text>

            <TouchableOpacity style={styles.modalOpcao} onPress={() => ligar('190')} activeOpacity={0.85}>
              <View style={styles.modalIcone}><Text style={styles.modalEmoji}>📞</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalOpcaoTitulo}>Ligar 190</Text>
                <Text style={styles.modalOpcaoSub}>Polícia Militar</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalOpcao} onPress={() => ligar('180')} activeOpacity={0.85}>
              <View style={[styles.modalIcone, { backgroundColor: '#3b5bdb' }]}><Text style={styles.modalEmoji}>📞</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalOpcaoTitulo}>Ligar 180</Text>
                <Text style={styles.modalOpcaoSub}>Central de Atendimento à Mulher, 24 horas</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalOpcao} onPress={abrirDelegacia} activeOpacity={0.85}>
              <View style={[styles.modalIcone, { backgroundColor: '#0F6E56' }]}><Text style={styles.modalEmoji}>📍</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalOpcaoTitulo}>Delegacia da Mulher mais próxima</Text>
                <Text style={styles.modalOpcaoSub}>Abre o Google Maps com a busca</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalCancelar} onPress={() => setMenuPolicia(false)} activeOpacity={0.85}>
              <Text style={styles.modalCancelarTexto}>CANCELAR</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1f3c',
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerLogo: {
    width: 72,
    height: 72,
    marginBottom: 6,
  },
  headerTitulo: {
    fontFamily: 'Comfortaa_700Bold',
    fontSize: 28,
    color: '#ffffff',
    textAlign: 'center',
  },
  headerApp: {
    color: '#8B1A1A',
  },
  headerSlogan: {
    fontFamily: 'Comfortaa_400Regular',
    fontSize: 10,
    color: '#8899aa',
    letterSpacing: 2,
    textAlign: 'center',
    marginTop: 2,
  },
  cardContato: {
    marginHorizontal: 24,
    marginTop: 8,
    backgroundColor: '#252d4a',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#3a4a7a',
    alignItems: 'center',
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
    justifyContent: 'center',
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
    gap: 8,
  },
  statusTexto: {
    fontFamily: 'Comfortaa_400Regular',
    fontSize: 13,
    color: '#8099f0',
    lineHeight: 20,
  },
  botaoMapa: {
    backgroundColor: '#8B1A1A',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginTop: 4,
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
  botaoContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  botaoPanico: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#252d4a',
    borderWidth: 3,
    borderColor: '#8B1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  botaoPanicoAtivo: {
    backgroundColor: '#8B1A1A',
    borderColor: '#c0392b',
  },
  botaoPolicia: {
    borderColor: '#3b5bdb',
  },
  botaoIcone: {
    width: 72,
    height: 72,
  },
  modalFundo: {
    flex: 1,
    backgroundColor: 'rgba(5,7,20,0.65)',
    justifyContent: 'flex-end',
  },
  modalCaixa: {
    backgroundColor: '#1a1f3c',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderTopWidth: 1,
    borderTopColor: '#2f3860',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 34,
    gap: 12,
  },
  modalPuxador: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3a4468',
    alignSelf: 'center',
    marginBottom: 4,
  },
  modalTitulo: {
    fontFamily: 'Comfortaa_700Bold',
    fontSize: 22,
    color: '#ffffff',
    textAlign: 'center',
  },
  modalSub: {
    fontFamily: 'Comfortaa_400Regular',
    fontSize: 12,
    color: '#8899aa',
    textAlign: 'center',
    marginBottom: 4,
  },
  modalOpcao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#252d4a',
    borderRadius: 16,
    padding: 14,
  },
  modalIcone: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8B1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalEmoji: { fontSize: 20 },
  modalOpcaoTitulo: {
    fontFamily: 'Comfortaa_700Bold',
    fontSize: 15,
    color: '#ffffff',
  },
  modalOpcaoSub: {
    fontFamily: 'Comfortaa_400Regular',
    fontSize: 11,
    color: '#8899aa',
    marginTop: 2,
  },
  modalCancelar: {
    borderWidth: 1,
    borderColor: '#8B1A1A',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  modalCancelarTexto: {
    fontFamily: 'Comfortaa_700Bold',
    color: '#e57373',
    fontSize: 13,
    letterSpacing: 1.5,
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