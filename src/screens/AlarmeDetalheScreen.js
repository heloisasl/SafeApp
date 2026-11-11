import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Linking,
} from 'react-native';
import { useFonts, Comfortaa_700Bold, Comfortaa_400Regular } from '@expo-google-fonts/comfortaa';
import { formatarData, formatarHora, formatarDuracao } from '../historico';

const CORES_NIVEL = { 1: '#8B1A1A', 2: '#3b5bdb', 3: '#0F6E56' };

function iniciais(nome) {
  const partes = String(nome || '?').trim().split(/\s+/);
  return ((partes[0]?.[0] || '?') + (partes[1]?.[0] || '')).toUpperCase();
}

export default function AlarmeDetalheScreen({ navigation, route }) {
  const alarme = route.params?.alarme;
  const [fontsLoaded] = useFonts({ Comfortaa_700Bold, Comfortaa_400Regular });

  if (!fontsLoaded || !alarme) return null;

  const sms = alarme.via === 'sms';
  const temLocal = alarme.latitude !== null && alarme.longitude !== null;
  const duracao = formatarDuracao(alarme.inicio, alarme.fim);
  const link = temLocal ? `https://www.google.com/maps?q=${alarme.latitude},${alarme.longitude}` : null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.botaoVoltar}>
          <Text style={styles.botaoVoltarTexto}>‹</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.titulo}>Detalhes do alarme</Text>
          <Text style={styles.subtitulo}>{formatarData(alarme.inicio)}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.cardTitulo}>
            {alarme.fim ? `Alarme encerrado às ${formatarHora(alarme.fim)}` : 'Alarme em andamento'}
          </Text>
          {duracao ? <Text style={styles.cardSub}>Duração: {duracao}</Text> : null}
          <Text style={styles.status}>
            Contatos notificados via {sms ? 'SMS' : 'WhatsApp'} ✓
          </Text>
          <Text style={styles.status}>
            {temLocal ? 'Localização compartilhada ✓' : 'Localização indisponível'}
          </Text>
          {sms ? <Text style={styles.status}>Alarme feito sem internet ✓</Text> : null}
        </View>

        <Text style={styles.secao}>CONTATOS AVISADOS</Text>
        {(alarme.contatos || []).length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardSub}>Nenhum contato registrado neste alarme.</Text>
          </View>
        ) : (
          alarme.contatos.map((c, i) => (
            <View key={i} style={styles.contato}>
              <View style={[styles.avatar, { backgroundColor: CORES_NIVEL[c.nivel] || '#8B1A1A' }]}>
                <Text style={styles.avatarTexto}>{iniciais(c.nome)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.contatoNome}>{c.nome}</Text>
                <Text style={styles.contatoNivel}>Nível {c.nivel}</Text>
              </View>
              <Text style={styles.enviado}>Enviado ✓</Text>
            </View>
          ))
        )}

        <Text style={styles.secao}>LOCALIZAÇÃO</Text>
        <View style={[styles.card, styles.localLinha]}>
          <View style={styles.localPin}>
            <Text style={{ fontSize: 18 }}>📍</Text>
          </View>
          <Text style={styles.coordenadas}>
            {temLocal
              ? `${alarme.latitude.toFixed(6)}, ${alarme.longitude.toFixed(6)}`
              : 'Não foi possível obter o GPS'}
          </Text>
        </View>

        {link ? (
          <TouchableOpacity style={styles.botaoMapa} onPress={() => Linking.openURL(link)} activeOpacity={0.85}>
            <Text style={styles.botaoMapaTexto}>VER NO GOOGLE MAPS</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1f3c' },
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
  titulo: { fontFamily: 'Comfortaa_700Bold', fontSize: 20, color: '#ffffff' },
  subtitulo: { fontFamily: 'Comfortaa_400Regular', fontSize: 11, color: '#8899aa', marginTop: 2 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40, gap: 12 },
  card: { backgroundColor: '#252d4a', borderRadius: 14, padding: 18, gap: 8 },
  cardTitulo: { fontFamily: 'Comfortaa_700Bold', fontSize: 15, color: '#ffffff' },
  cardSub: { fontFamily: 'Comfortaa_400Regular', fontSize: 12, color: '#8899aa' },
  status: { fontFamily: 'Comfortaa_400Regular', fontSize: 13, color: '#8099f0', lineHeight: 20 },
  secao: {
    fontFamily: 'Comfortaa_700Bold',
    fontSize: 11,
    color: '#8899aa',
    letterSpacing: 2,
    marginTop: 8,
  },
  contato: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#252d4a',
    borderRadius: 14,
    padding: 12,
  },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarTexto: { fontFamily: 'Comfortaa_700Bold', fontSize: 13, color: '#ffffff' },
  contatoNome: { fontFamily: 'Comfortaa_700Bold', fontSize: 14, color: '#ffffff' },
  contatoNivel: { fontFamily: 'Comfortaa_400Regular', fontSize: 11, color: '#e57373', marginTop: 2 },
  enviado: { fontFamily: 'Comfortaa_400Regular', fontSize: 12, color: '#8099f0' },
  localLinha: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  localPin: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b5bdb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coordenadas: { fontFamily: 'Comfortaa_700Bold', fontSize: 13, color: '#ffffff', flexShrink: 1 },
  botaoMapa: {
    backgroundColor: '#8B1A1A',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  botaoMapaTexto: {
    fontFamily: 'Comfortaa_700Bold',
    color: '#ffffff',
    fontSize: 14,
    letterSpacing: 1.5,
  },
});
