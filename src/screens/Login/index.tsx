import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../routes/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function Login({ navigation }: Props) {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');

  function entrar() {
    // TODO: validar credenciais na API
    navigation.replace('Home');
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

        <TextInput
          style={styles.input}
          placeholder="Insira seu usuário"
          placeholderTextColor="#9a9a9a"
          autoCapitalize="none"
          value={usuario}
          onChangeText={setUsuario}
        />

        <TextInput
          style={styles.input}
          placeholder="Insira sua senha"
          placeholderTextColor="#9a9a9a"
          secureTextEntry
          value={senha}
          onChangeText={setSenha}
        />

        <Pressable style={styles.esqueci} onPress={() => {}}>
          <Text style={styles.esqueciTexto}>Esqueci a senha</Text>
        </Pressable>

        <Pressable style={styles.botao} onPress={entrar}>
          <Text style={styles.botaoTexto}>Entrar</Text>
        </Pressable>

        <Pressable onPress={() => navigation.navigate('Cadastro')}>
          <Text style={styles.cadastre}>Cadastre - se</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#000' },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  logo: { width: 260, height: 260, marginBottom: 24 },
  titulo: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 48,
    backgroundColor: '#2a2a2a',
    borderRadius: 24,
    paddingHorizontal: 20,
    color: '#fff',
    fontSize: 14,
    marginBottom: 16,
  },
  esqueci: { alignSelf: 'flex-end', marginTop: -6, marginBottom: 20 },
  esqueciTexto: { color: '#ff2d2d', fontSize: 12 },
  botao: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ff3d0a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  botaoTexto: { color: '#fff', fontSize: 15, fontWeight: '700' },
  cadastre: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
