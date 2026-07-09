import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import CalculadoraScreen from './src/screens/CalculadoraScreen';
import PanicoScreen from './src/screens/PanicoScreen';
import ContatosScreen from './src/screens/ContatosScreen';
import ConfiguracoesScreen from './src/screens/ConfiguracoesScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Calculadora"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Calculadora" component={CalculadoraScreen} />
        <Stack.Screen name="Panico" component={PanicoScreen} />
        <Stack.Screen name="Contatos" component={ContatosScreen} />
        <Stack.Screen name="Configuracoes" component={ConfiguracoesScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}