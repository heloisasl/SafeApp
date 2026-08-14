import { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './src/firebase';

import CalculadoraScreen from './src/screens/CalculadoraScreen';
import PanicoScreen from './src/screens/PanicoScreen';
import ContatosScreen from './src/screens/ContatosScreen';
import ConfiguracoesScreen from './src/screens/ConfiguracoesScreen';
import LoginScreen from './src/screens/LoginScreen';
import CadastroScreen from './src/screens/CadastroScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUsuario(user);
      setCarregando(false);
    });
    return unsub;
  }, []);

  if (carregando) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName="Calculadora"
      >
        {/* Calculadora é sempre a primeira tela */}
        <Stack.Screen name="Calculadora" component={CalculadoraScreen} />

        {usuario ? (
          // Logada — acesso ao app completo
          <>
            <Stack.Screen name="Panico" component={PanicoScreen} />
            <Stack.Screen name="Contatos" component={ContatosScreen} />
            <Stack.Screen name="Configuracoes" component={ConfiguracoesScreen} />
          </>
        ) : (
          // Não logada — acesso ao cadastro/login
          <>
            <Stack.Screen name="Cadastro" component={CadastroScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}