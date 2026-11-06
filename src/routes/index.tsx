import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Login from '../screens/Login';
import Cadastro from '../screens/Cadastro';
import Home from '../screens/Home';
import type { RootStackParamList } from './types';
import Perfil from '../screens/Perfil';
import Criar from '../screens/Criar';



const Stack = createNativeStackNavigator<RootStackParamList>();

export default function Routes() {
  return (
    <Stack.Navigator
    initialRouteName="Login"
    screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: '#000' },
      animation: 'fade',
    }}
    >
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Cadastro" component={Cadastro} />
      <Stack.Screen name="Home" component={Home} />
      <Stack.Screen name="Perfil" component={Perfil} options={{ headerShown: false }} />
    <Stack.Screen name="Criar" component={Criar} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
