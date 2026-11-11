import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Alert,
} from 'react-native';
import { useFonts, Comfortaa_700Bold, Comfortaa_400Regular } from '@expo-google-fonts/comfortaa';
import { listarHistorico, limparHistorico, formatarData } from '../historico';

export default function HistoricoScreen({ navigation }) {
  const [alarmes, setAlarmes] = useState([]);
  const [fontsLoaded] = useFonts({ Comfortaa_700Bold, Comfortaa_400Regular });

  useEffect(() => {
    carregar();
    const unsubscribe = navigation.addListener('focus', carregar);
    return unsubscribe;
  }, [navigation]);

  if (!fontsLoaded) return null;

  async function carregar() {
    setAlarmes(await listarHistorico());
  }

  function confirmarLimpeza() {
    Alert.alert(
      'Limpar histórico',
      'Isso apaga o registro de todos os alarmes deste aparelho. Seus contatos continuam salvos.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar',
          style: 'destructive',
          onPress: async () => {
            await limparHistorico();
            setAlarmes([]);
          },
        },
      ]
    );
  }

  const totalOffline = alarmes.filter(a => a.via === 'sms').length;

  function renderItem({ item }) {
    const sms = item.via === 'sms';
    const qtd = (item.contatos || []).length;
    return (
      <TouchableOpacity
        style={styles.item}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('AlarmeDetalhe', { alarme: item })}
      >
        <View style={[styles.pin, sms && styles.pinSms]}>
          <Text style={styles.pinIcone}>📍</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.itemData}>{formatarData(item.inicio)}</Text>
          <Text style={styles.itemLocal} numberOfLines={1}>
            {item.latitude !== null && item.longitude !== null
              ? `${item.latitude.toFixed(5)}, ${item.longitude.toFixed(5)}`
              : 'Localização indisponível'}
          </Text>
          <View style={styles.itemRodape}>
            <View style={[styles.badge, !sms && styles.badgeAzul]}>
              <Text style={[styles.badgeTexto, !sms && styles.badgeTextoAzul]}>
                {sms ? 'SMS offline' : 'WhatsApp'}
              </Text>
            </View>
            <Text style={styles.itemQtd}>
              {qtd} {qtd === 1 ? 'contato avisado' : 'contatos avisados'}
              {!item.fim ? ' · em andamento' : ''}
            </Text>
          </View>
        </View>
        <Text style={styles.seta}>›</Text>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.botaoVoltar}>
          <Text style={styles.botaoVoltarTexto}>‹</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.titulo}>Histórico de alarmes</Text>
          <Text style={styles.subtitulo}>Seus acionamentos anteriores</Text>
        </View>
      </View>

      <FlatList
        data={alarmes}
        keyExtractor={item => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.lista}
        ListHeaderComponent={
          <View>
            <View style={styles.resumo}>
              <View style={styles.resumoCard}>
                <Text style={styles.resumoNumero}>{alarmes.length}</Text>
                <Text style={styles.resumoLabel}>alarmes acionados</Text>
              </View>
              <View style={styles.resumoCard}>
                <Text style={[styles.resumoNumero, { color: '#e57373' }]}>{totalOffline}</Text>
                <Text style={styles.resumoLabel}>enviados offline (SMS)</Text>
              </View>
            </View>
            <Text style={styles.secao}>RECENTES</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.vazio}>
            <Text style={styles.vazioTexto}>
              Nenhum alarme ainda. Quando você acionar o botão de pânico, o registro aparece aqui.
            </Text>
          </View>
        }
        ListFooterComponent={
          <View style={{ gap: 12, marginTop: 6 }}>
            <Text style={styles.aviso}>Os registros ficam salvos só neste aparelho.</Text>
            {alarmes.length > 0 ? (
              <TouchableOpacity style={styles.botaoLimpar} onPress={confirmarLimpeza} activeOpacity={0.85}>
                <Text style={styles.botaoLimparTexto}>LIMPAR HISTÓRICO</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        }
      />
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
  lista: { paddingHorizontal: 20, paddingBottom: 40, gap: 12 },
  resumo: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  resumoCard: { flex: 1, backgroundColor: '#252d4a', borderRadius: 16, padding: 16, gap: 4 },
  resumoNumero: { fontFamily: 'Comfortaa_700Bold', fontSize: 26, color: '#ffffff' },
  resumoLabel: { fontFamily: 'Comfortaa_400Regular', fontSize: 11, color: '#8899aa' },
  secao: {
    fontFamily: 'Comfortaa_700Bold',
    fontSize: 11,
    color: '#8899aa',
    letterSpacing: 2,
    marginBottom: 2,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#252d4a',
    borderRadius: 16,
    padding: 14,
  },
  pin: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8B1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinSms: { backgroundColor: '#3b5bdb' },
  pinIcone: { fontSize: 18 },
  itemData: { fontFamily: 'Comfortaa_700Bold', fontSize: 15, color: '#ffffff' },
  itemLocal: { fontFamily: 'Comfortaa_400Regular', fontSize: 11, color: '#8899aa', marginTop: 3 },
  itemRodape: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  badge: {
    borderWidth: 1,
    borderColor: '#8B1A1A',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeAzul: { borderColor: '#3b5bdb' },
  badgeTexto: { fontFamily: 'Comfortaa_700Bold', fontSize: 10, color: '#e57373' },
  badgeTextoAzul: { color: '#8099f0' },
  itemQtd: { fontFamily: 'Comfortaa_400Regular', fontSize: 10, color: '#8899aa', flexShrink: 1 },
  seta: { fontFamily: 'Comfortaa_700Bold', fontSize: 24, color: '#8899aa' },
  vazio: { backgroundColor: '#252d4a', borderRadius: 16, padding: 20 },
  vazioTexto: {
    fontFamily: 'Comfortaa_400Regular',
    fontSize: 13,
    color: '#8899aa',
    textAlign: 'center',
    lineHeight: 20,
  },
  aviso: {
    fontFamily: 'Comfortaa_400Regular',
    fontSize: 10,
    color: '#8899aa',
    textAlign: 'center',
  },
  botaoLimpar: {
    borderWidth: 1,
    borderColor: '#8B1A1A',
    backgroundColor: '#2a1a24',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  botaoLimparTexto: {
    fontFamily: 'Comfortaa_700Bold',
    color: '#e57373',
    fontSize: 13,
    letterSpacing: 1.5,
  },
});
