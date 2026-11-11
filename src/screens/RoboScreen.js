import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { useFonts, Comfortaa_700Bold, Comfortaa_400Regular } from '@expo-google-fonts/comfortaa';

// Assistente de ajuda baseada em regras (palavras-chave). Não usa internet nem IA externa,
// então funciona offline e nenhuma conversa sai do aparelho.

const OPCOES_PRINCIPAIS = [
  'Estou com medo agora',
  'Como o app funciona?',
  'Quais são os meus direitos?',
  'Telefones de ajuda',
];

function normalizar(texto) {
  return texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

// Cada resposta é uma lista de blocos: texto, opcoes (botões de resposta rápida) ou sos (cartão de emergência)
function gerarResposta(texto) {
  const t = normalizar(texto);

  if (/nao,? preciso|preciso de ajuda|nao estou segura/.test(t)) {
    return [{ tipo: 'texto', texto: 'Se você estiver em perigo agora, escolha uma opção:' }, { tipo: 'sos' }];
  }
  if (/estou segura/.test(t)) {
    return [
      { tipo: 'texto', texto: 'Que bom. Quando se sentir pronta, posso te explicar como pedir ajuda ou o que fazer depois. O que prefere?' },
      { tipo: 'opcoes', itens: ['Quais são os meus direitos?', 'Telefones de ajuda', 'Como o app funciona?'] },
    ];
  }
  if (/medo|socorro|perigo|ameaca|ameac/.test(t)) {
    return [
      { tipo: 'texto', texto: 'Sinto muito que você esteja passando por isso. Você não está sozinha, e eu estou aqui com você.' },
      { tipo: 'texto', texto: 'Você está em um lugar seguro agora?' },
      { tipo: 'opcoes', itens: ['Sim, estou segura', 'Não, preciso de ajuda'] },
    ];
  }
  if (/funciona|aplicativo|\bapp\b|codigo|calculadora/.test(t)) {
    return [
      {
        tipo: 'texto',
        texto:
          'Para abrir o SafeApp, digite o seu código secreto na calculadora e toque em =. Na tela principal, um toque no botão avisa seus contatos com a sua localização no Google Maps. Sem internet, o aviso segue por SMS.',
      },
      { tipo: 'opcoes', itens: ['Telefones de ajuda', 'Quais são os meus direitos?'] },
    ];
  }
  if (/direito|\blei\b|medida|protetiva|denuncia/.test(t)) {
    return [
      {
        tipo: 'texto',
        texto:
          'Pela Lei Maria da Penha (Lei 11.340/2006), você pode pedir medidas protetivas de urgência, como o afastamento do agressor. O pedido pode ser feito em uma delegacia, inclusive na Delegacia da Mulher, ou pela Defensoria Pública.',
      },
      {
        tipo: 'texto',
        texto: 'Isso é uma orientação geral. Para o seu caso, procure a Defensoria Pública ou a rede de atendimento da sua cidade.',
      },
      { tipo: 'opcoes', itens: ['Telefones de ajuda'] },
    ];
  }
  if (/telefone|ligar|\b180\b|\b190\b|numero/.test(t)) {
    return [
      { tipo: 'texto', texto: 'Estes números são gratuitos e funcionam em todo o Brasil:' },
      { tipo: 'texto', texto: '190: Polícia Militar\n180: Central de Atendimento à Mulher, 24 horas\n192: SAMU' },
      { tipo: 'sos' },
    ];
  }
  return [
    { tipo: 'texto', texto: 'Entendi. Posso te ajudar com isso de algumas formas. Escolha uma opção ou escreva com suas palavras.' },
    { tipo: 'opcoes', itens: OPCOES_PRINCIPAIS },
  ];
}

export default function RoboScreen({ navigation }) {
  const [itens, setItens] = useState([]);
  const [digitando, setDigitando] = useState(false);
  const [texto, setTexto] = useState('');
  const contador = useRef(0);
  const scrollRef = useRef(null);
  const [fontsLoaded] = useFonts({ Comfortaa_700Bold, Comfortaa_400Regular });

  function novo(item) {
    contador.current += 1;
    return { ...item, id: contador.current };
  }

  useEffect(() => {
    setItens([
      novo({ tipo: 'texto', de: 'bot', texto: 'Oi. Eu sou a assistente do SafeApp. Estou aqui para te ouvir e te mostrar o que fazer em cada situação.' }),
      novo({ tipo: 'texto', de: 'bot', texto: 'Você pode me perguntar sobre o app, sobre os seus direitos ou pedir ajuda agora. O que você precisa?' }),
      novo({ tipo: 'opcoes', itens: OPCOES_PRINCIPAIS }),
    ]);
  }, []);

  if (!fontsLoaded) return null;

  function enviar(mensagem) {
    const limpa = mensagem.trim();
    if (!limpa || digitando) return;
    setTexto('');
    setItens(prev => [...prev.filter(i => i.tipo !== 'opcoes'), novo({ tipo: 'texto', de: 'eu', texto: limpa })]);
    setDigitando(true);
    setTimeout(() => {
      const blocos = gerarResposta(limpa).map(b => novo({ ...b, de: 'bot' }));
      setItens(prev => [...prev, ...blocos]);
      setDigitando(false);
    }, 650);
  }

  function acionarAlarme() {
    // Volta para a tela de pânico e pede para ela acionar o alarme
    if (navigation.popTo) navigation.popTo('Panico', { acionar: true });
    else navigation.navigate('Panico', { acionar: true });
  }

  function renderItem(item) {
    if (item.tipo === 'texto') {
      const meu = item.de === 'eu';
      return (
        <View key={item.id} style={[styles.bolha, meu ? styles.bolhaEu : styles.bolhaBot]}>
          <Text style={styles.bolhaTexto}>{item.texto}</Text>
        </View>
      );
    }
    if (item.tipo === 'opcoes') {
      return (
        <View key={item.id} style={styles.opcoes}>
          {item.itens.map(op => (
            <TouchableOpacity key={op} style={styles.opcao} onPress={() => enviar(op)} activeOpacity={0.8}>
              <Text style={styles.opcaoTexto}>{op}</Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    }
    if (item.tipo === 'sos') {
      return (
        <View key={item.id} style={styles.sos}>
          <TouchableOpacity style={styles.sosLinha} onPress={() => Linking.openURL('tel:190')} activeOpacity={0.85}>
            <View style={styles.sosIcone}><Text style={styles.sosEmoji}>📞</Text></View>
            <View>
              <Text style={styles.sosTitulo}>Ligar 190</Text>
              <Text style={styles.sosSub}>Polícia Militar</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sosLinha} onPress={() => Linking.openURL('tel:180')} activeOpacity={0.85}>
            <View style={[styles.sosIcone, { backgroundColor: '#3b5bdb' }]}><Text style={styles.sosEmoji}>📞</Text></View>
            <View>
              <Text style={styles.sosTitulo}>Ligar 180</Text>
              <Text style={styles.sosSub}>Central de Atendimento à Mulher</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sosAlarme} onPress={acionarAlarme} activeOpacity={0.85}>
            <Text style={styles.sosAlarmeTexto}>ACIONAR ALARME SAFEAPP</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.botaoVoltar}>
            <Text style={styles.botaoVoltarTexto}>‹</Text>
          </TouchableOpacity>
          <View style={styles.avatar}><Text style={{ fontSize: 20 }}>🤖</Text></View>
          <View>
            <Text style={styles.titulo}>Assistente SafeApp</Text>
            <Text style={styles.subtitulo}>Pronta para te ouvir</Text>
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.conversa}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
        >
          {itens.map(renderItem)}
          {digitando ? (
            <View style={[styles.bolha, styles.bolhaBot]}>
              <Text style={[styles.bolhaTexto, { color: '#8899aa' }]}>digitando...</Text>
            </View>
          ) : null}
        </ScrollView>

        <Text style={styles.aviso}>
          A assistente não substitui atendimento profissional. Em perigo imediato, ligue 190.
        </Text>

        <View style={styles.barra}>
          <TextInput
            style={styles.input}
            placeholder="Escreva sua mensagem..."
            placeholderTextColor="#6b7280"
            value={texto}
            onChangeText={setTexto}
            onSubmitEditing={() => enviar(texto)}
            returnKeyType="send"
          />
          <TouchableOpacity style={styles.enviar} onPress={() => enviar(texto)} activeOpacity={0.85}>
            <Text style={styles.enviarIcone}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: { fontFamily: 'Comfortaa_700Bold', fontSize: 17, color: '#ffffff' },
  subtitulo: { fontFamily: 'Comfortaa_400Regular', fontSize: 11, color: '#8899aa', marginTop: 2 },
  conversa: { paddingHorizontal: 20, paddingBottom: 12, gap: 12 },
  bolha: { maxWidth: '85%', padding: 14, borderRadius: 18 },
  bolhaBot: { alignSelf: 'flex-start', backgroundColor: '#252d4a', borderTopLeftRadius: 4 },
  bolhaEu: { alignSelf: 'flex-end', backgroundColor: '#8B1A1A', borderTopRightRadius: 4 },
  bolhaTexto: { fontFamily: 'Comfortaa_400Regular', fontSize: 13, color: '#ffffff', lineHeight: 20 },
  opcoes: { alignItems: 'flex-start', gap: 8 },
  opcao: {
    borderWidth: 1,
    borderColor: '#3b5bdb',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  opcaoTexto: { fontFamily: 'Comfortaa_400Regular', fontSize: 12, color: '#8099f0' },
  sos: {
    alignSelf: 'flex-start',
    width: '92%',
    backgroundColor: '#252d4a',
    borderWidth: 1,
    borderColor: '#8B1A1A',
    borderRadius: 18,
    padding: 12,
    gap: 10,
  },
  sosLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1a1f3c',
    borderRadius: 14,
    padding: 12,
  },
  sosIcone: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#8B1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosEmoji: { fontSize: 16 },
  sosTitulo: { fontFamily: 'Comfortaa_700Bold', fontSize: 14, color: '#ffffff' },
  sosSub: { fontFamily: 'Comfortaa_400Regular', fontSize: 11, color: '#8899aa', marginTop: 2 },
  sosAlarme: { backgroundColor: '#8B1A1A', borderRadius: 14, padding: 15, alignItems: 'center' },
  sosAlarmeTexto: {
    fontFamily: 'Comfortaa_700Bold',
    fontSize: 12,
    color: '#ffffff',
    letterSpacing: 1.2,
  },
  aviso: {
    fontFamily: 'Comfortaa_400Regular',
    fontSize: 10,
    color: '#8899aa',
    textAlign: 'center',
    paddingHorizontal: 24,
    marginVertical: 8,
  },
  barra: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingBottom: 16 },
  input: {
    flex: 1,
    backgroundColor: '#252d4a',
    borderRadius: 26,
    paddingVertical: 15,
    paddingHorizontal: 18,
    fontSize: 13,
    color: '#ffffff',
    fontFamily: 'Comfortaa_400Regular',
  },
  enviar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#8B1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  enviarIcone: { color: '#ffffff', fontSize: 18 },
});
