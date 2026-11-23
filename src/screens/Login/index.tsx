
import { useState } from 'react';

import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../routes/types';

import { apiPost } from '../../api/api';
import { useAuth } from '../../context/AuthContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

interface LoginResponse {
  message: string;
  accessToken: string;
  refreshToken: string;
  usuario: {
    id_usuario: number;
    id_autenticacao: number;
    nome: string;
    email: string;
    username: string;
    tipo: 'ARTISTA' | 'USUARIO';
  };
}

export default function Login({ navigation }: Props) {
  const [usuario, setUsuarioInput] = useState('');
  const [senha, setSenha] = useState('');

  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const { setAutenticado, setUsuario } = useAuth();

  async function entrar() {
    if (carregando) return;

    if (!usuario.trim() || !senha) {
      Alert.alert('Atenção', 'Informe seu usuário e sua senha.');
      return;
    }

    try {
      setCarregando(true);

      const resposta = await apiPost<LoginResponse>(
        '/auth/login',
        {
          username: usuario.trim(),
          password: senha,
        },
      );

      Alert.alert(
        'Login realizado!',
        resposta.message || 'Bem-vindo!',
        [
          {
            text: 'OK',
            onPress: () => {
              setUsuario(resposta.usuario);
              setAutenticado(true);
            },
          },
        ],
      );
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : 'Não foi possível realizar o login.';

      Alert.alert('Erro ao entrar', mensagem);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Image
          source={require('../../assets/logo.jpg')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.titulo}>Login</Text>

        {/* USUÁRIO */}
        <View style={styles.campo}>
          <Text style={styles.label}>Usuário *</Text>

          <TextInput
            style={styles.input}
            placeholder="Ex.: mariana123"
            placeholderTextColor="#9a9a9a"
            autoCapitalize="none"
            autoCorrect={false}
            value={usuario}
            onChangeText={setUsuarioInput}
          />
        </View>

        {/* SENHA */}
        <View style={styles.campo}>
          <Text style={styles.label}>Senha *</Text>

          <View style={styles.inputSenha}>
            <TextInput
              style={styles.inputSenhaTexto}
              placeholder="Digite sua senha"
              placeholderTextColor="#9a9a9a"
              secureTextEntry={!mostrarSenha}
              value={senha}
              onChangeText={setSenha}
            />

            <Pressable
              onPress={() => setMostrarSenha(!mostrarSenha)}
              style={styles.iconeSenha}
            >
              <Ionicons
                name={mostrarSenha ? 'eye-off-outline' : 'eye-outline'}
                size={21}
                color="#aaa"
              />
            </Pressable>
          </View>
        </View>

        {/* ESQUECI A SENHA */}
        <Pressable
          style={styles.esqueci}
          onPress={() =>
            Alert.alert(
              'Recuperação de senha',
              'A funcionalidade de recuperação de senha ainda não está disponível.',
            )
          }
        >
          <Text style={styles.esqueciTexto}>Esqueci a senha</Text>
        </Pressable>

        {/* ENTRAR */}
        <Pressable
          style={[
            styles.botao,
            carregando && styles.botaoDesabilitado,
          ]}
          onPress={entrar}
          disabled={carregando}
        >
          <Text style={styles.botaoTexto}>
            {carregando ? 'Entrando...' : 'Entrar'}
          </Text>
        </Pressable>

        {/* CADASTRO */}
        <Pressable
          onPress={() => navigation.navigate('Cadastro')}
        >
          <Text style={styles.cadastre}>
            Não tem uma conta? Cadastre-se
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#000',
  },

  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },

  logo: {
    width: 260,
    height: 260,
    marginBottom: 24,
  },

  titulo: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 28,
  },

  campo: {
    width: '100%',
    marginBottom: 18,
  },

  label: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 8,
  },

  input: {
    width: '100%',
    height: 48,
    backgroundColor: '#2a2a2a',
    borderRadius: 24,
    paddingHorizontal: 20,
    color: '#fff',
    fontSize: 14,
  },

  inputSenha: {
    width: '100%',
    height: 48,
    backgroundColor: '#2a2a2a',
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 20,
    paddingRight: 16,
  },

  inputSenhaTexto: {
    flex: 1,
    height: '100%',
    color: '#fff',
    fontSize: 14,
  },

  iconeSenha: {
    padding: 4,
  },

  esqueci: {
    alignSelf: 'flex-end',
    marginTop: -8,
    marginBottom: 24,
  },

  esqueciTexto: {
    color: '#ff3d0a',
    fontSize: 12,
  },

  botao: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ff3d0a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },

  botaoDesabilitado: {
    opacity: 0.6,
  },

  botaoTexto: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },

  cadastre: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
