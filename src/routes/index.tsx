import { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  View,
} from 'react-native';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Login from '../screens/Login';
import Cadastro from '../screens/Cadastro';
import Home from '../screens/Home';
import Perfil from '../screens/Perfil';
import PerfilUsuario from '../screens/Perfil/PerfilUsuario';
import Criar from '../screens/Criar';

import type { RootStackParamList } from './types';

import {
  AuthProvider,
  useAuth,
  type UsuarioAutenticado,
} from '../context/AuthContext';

import {
  apiGet,
  limparTokens,
} from '../api/api';

const Stack = createNativeStackNavigator<RootStackParamList>();

interface MeResponse {
  message: string;
  user: UsuarioAutenticado;
}

function Navegacao() {
  const {
    autenticado,
    setAutenticado,
    setUsuario,
  } = useAuth();

  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    async function verificarSessao() {
      try {
        const resposta = await apiGet<MeResponse>('/auth/me');

        if (
          resposta.user &&
          resposta.user.tipo &&
          resposta.user.username
        ) {
          setUsuario(resposta.user);
          setAutenticado(true);
        } else {
          await limparTokens();
          setUsuario(null);
          setAutenticado(false);
        }
      } catch {
        await limparTokens();
        setUsuario(null);
        setAutenticado(false);
      } finally {
        setVerificando(false);
      }
    }

    verificarSessao();
  }, [setAutenticado, setUsuario]);

  if (verificando) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#000',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator
          size="large"
          color="#ff3d0a"
        />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: '#000',
        },
        animation: 'fade',
      }}
    >
      {!autenticado ? (
        <>
          <Stack.Screen
            name="Login"
            component={Login}
          />

          <Stack.Screen
            name="Cadastro"
            component={Cadastro}
          />
        </>
      ) : (
        <>
          <Stack.Screen
            name="Home"
            component={Home}
          />

          <Stack.Screen
            name="Perfil"
            component={Perfil}
          />

          {/* PERFIL DO USUÁRIO NORMAL */}
          <Stack.Screen name="PerfilUsuario">
            {({ navigation }) => (
              <PerfilUsuario
                onAbrirPerfil={(id_artista) => {
                  navigation.navigate('Perfil', {
                    id_artista: id_artista,
                  });
                }}
              />
            )}
          </Stack.Screen>

          <Stack.Screen
            name="Criar"
            component={Criar}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function Routes() {
  return (
    <AuthProvider>
      <Navegacao />
    </AuthProvider>
  );
}