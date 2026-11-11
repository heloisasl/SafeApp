import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, TouchableOpacity, View } from 'react-native';

// Botão redondo flutuante que abre o assistente de ajuda.
// Tem um brilho que pulsa de leve para chamar a atenção sem atrapalhar.
export default function BotaoAssistente({ onPress, style }) {
  const pulso = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animacao = Animated.loop(
      Animated.timing(pulso, {
        toValue: 1,
        duration: 2200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      })
    );
    animacao.start();
    return () => animacao.stop();
  }, [pulso]);

  const escala = pulso.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] });
  const opacidade = pulso.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] });

  return (
    <View style={[styles.area, style]} pointerEvents="box-none">
      <Animated.View
        pointerEvents="none"
        style={[styles.anel, { opacity: opacidade, transform: [{ scale: escala }] }]}
      />
      <TouchableOpacity
        style={styles.botao}
        onPress={onPress}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Assistente de ajuda"
      >
        <Image source={require('../../assets/escudo.png')} style={styles.escudo} resizeMode="contain" />
      </TouchableOpacity>
    </View>
  );
}

const TAMANHO = 58;

const styles = StyleSheet.create({
  area: {
    position: 'absolute',
    width: TAMANHO,
    height: TAMANHO,
    alignItems: 'center',
    justifyContent: 'center',
  },
  anel: {
    position: 'absolute',
    width: TAMANHO,
    height: TAMANHO,
    borderRadius: TAMANHO / 2,
    backgroundColor: '#c0392b',
  },
  botao: {
    width: TAMANHO,
    height: TAMANHO,
    borderRadius: TAMANHO / 2,
    backgroundColor: '#2d3560',
    borderWidth: 2,
    borderColor: '#8B1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#e57373',
    shadowOpacity: 0.7,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  escudo: {
    width: 32,
    height: 34,
  },
});
