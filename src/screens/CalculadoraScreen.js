import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CalculadoraScreen({ navigation }) {
  const [display, setDisplay] = useState('0');
  const [expressao, setExpressao] = useState('');
  const [codigoSecreto, setCodigoSecreto] = useState('1234');

  // Carrega o código secreto salvo nas configurações
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      carregarCodigo();
    });
    return unsubscribe;
  }, [navigation]);

  async function carregarCodigo() {
    try {
      const codigo = await AsyncStorage.getItem('codigo_secreto');
      if (codigo) setCodigoSecreto(codigo);
    } catch (erro) {
      console.log('Erro ao carregar código:', erro);
    }
  }

  function apertouBotao(valor) {
    // Verifica se o código secreto foi digitado
    if (expressao + valor === codigoSecreto + '=') {
      navigation.navigate('Panico');
      setDisplay('0');
      setExpressao('');
      return;
    }

    if (valor === '=') {
      try {
        const resultado = eval(expressao);
        setDisplay(String(resultado));
        setExpressao('');
      } catch {
        setDisplay('Erro');
        setExpressao('');
      }
      return;
    }

    if (valor === 'AC') {
      setDisplay('0');
      setExpressao('');
      return;
    }

    if (valor === '+/-') {
      if (display !== '0') {
        const novo = display.startsWith('-') ? display.slice(1) : '-' + display;
        setDisplay(novo);
        setExpressao(novo);
      }
      return;
    }

    if (valor === '%') {
      const resultado = parseFloat(expressao || display) / 100;
      setDisplay(String(resultado));
      setExpressao(String(resultado));
      return;
    }

    const novaExpressao = expressao + valor;
    setExpressao(novaExpressao);
    setDisplay(novaExpressao);
  }

  function renderBotao(label, tipo = 'normal') {
    return (
      <TouchableOpacity
        style={[styles.botao, styles['botao_' + tipo]]}
        onPress={() => apertouBotao(label)}
      >
        <Text style={[styles.botaoTexto, styles['botaoTexto_' + tipo]]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.displayContainer}>
        <Text style={styles.displayTexto} numberOfLines={1} adjustsFontSizeToFit>
          {display}
        </Text>
      </View>

      <View style={styles.botoesContainer}>
        <View style={styles.linha}>
          {renderBotao('AC', 'cinza')}
          {renderBotao('+/-', 'cinza')}
          {renderBotao('%', 'cinza')}
          {renderBotao('÷', 'laranja')}
        </View>
        <View style={styles.linha}>
          {renderBotao('7')}
          {renderBotao('8')}
          {renderBotao('9')}
          {renderBotao('×', 'laranja')}
        </View>
        <View style={styles.linha}>
          {renderBotao('4')}
          {renderBotao('5')}
          {renderBotao('6')}
          {renderBotao('-', 'laranja')}
        </View>
        <View style={styles.linha}>
          {renderBotao('1')}
          {renderBotao('2')}
          {renderBotao('3')}
          {renderBotao('+', 'laranja')}
        </View>
        <View style={styles.linha}>
          {renderBotao('0', 'zero')}
          {renderBotao('.')}
          {renderBotao('=', 'laranja')}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'flex-end',
  },
  displayContainer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    alignItems: 'flex-end',
  },
  displayTexto: {
    fontSize: 72,
    color: '#ffffff',
    fontWeight: '200',
  },
  botoesContainer: {
    paddingHorizontal: 12,
    paddingBottom: 24,
    gap: 12,
  },
  linha: {
    flexDirection: 'row',
    gap: 12,
  },
  botao: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 999,
    backgroundColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botao_cinza: {
    backgroundColor: '#a5a5a5',
  },
  botao_laranja: {
    backgroundColor: '#4169E1',
  },
  botao_zero: {
    flex: 2,
    aspectRatio: undefined,
    paddingLeft: 28,
    alignItems: 'flex-start',
    borderRadius: 999,
  },
  botao_normal: {},
  botaoTexto: {
    fontSize: 28,
    color: '#ffffff',
    fontWeight: '400',
  },
  botaoTexto_cinza: {
    color: '#000000',
  },
  botaoTexto_laranja: {
    color: '#ffffff',
  },
  botaoTexto_zero: {},
  botaoTexto_normal: {},
});