import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../routes/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Cadastro'>;

// Aplica máscara DD/MM/AAAA enquanto a pessoa digita
function mascaraData(valor: string) {
  const n = valor.replace(/\D/g, '').slice(0, 8);
  if (n.length <= 2) return n;
  if (n.length <= 4) return `${n.slice(0, 2)}/${n.slice(2)}`;
  return `${n.slice(0, 2)}/${n.slice(2, 4)}/${n.slice(4)}`;
}

export default function Cadastro({ navigation }: Props) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [nascimento, setNascimento] = useState('');
  const [profissional, setProfissional] = useState(false);

  function cadastrar() {
    // TODO: validar campos e enviar para a API
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

        <TextInput
          style={styles.input}
          placeholder="Insira seu nome"
          placeholderTextColor="#9a9a9a"
          value={nome}
          onChangeText={setNome}
        />
        <TextInput
          style={styles.input}
          placeholder="Insira seu e-mail"
          placeholderTextColor="#9a9a9a"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
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
        <TextInput
          style={styles.input}
          placeholder="Confirme sua senha"
          placeholderTextColor="#9a9a9a"
          secureTextEntry
          value={confirmarSenha}
          onChangeText={setConfirmarSenha}
        />
        <TextInput
          style={styles.input}
          placeholder="Selecione sua data de nascimento"
          placeholderTextColor="#9a9a9a"
          keyboardType="number-pad"
          maxLength={10}
          value={nascimento}
          onChangeText={(t) => setNascimento(mascaraData(t))}
        />

        <View style={styles.perfil}>
          <Text style={styles.perfilTexto}>Perfil profissional?</Text>
          <Switch
            value={profissional}
            onValueChange={setProfissional}
            trackColor={{ false: '#3a3a3a', true: '#ff3d0a' }}
            thumbColor="#fff"
          />
        </View>

        <Pressable style={styles.botao} onPress={cadastrar}>
          <Text style={styles.botaoTexto}>Cadastrar</Text>
        </Pressable>

        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.voltar}>Já tenho conta</Text>
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
    paddingHorizontal: 32,
    paddingTop: 56,
    paddingBottom: 40,
  },
  logo: { width: 150, height: 150, marginBottom: 16 },
  input: {
    width: '100%',
    height: 44,
    backgroundColor: '#2a2a2a',
    borderRadius: 22,
    paddingHorizontal: 20,
    color: '#fff',
    fontSize: 13,
    marginBottom: 16,
  },
  perfil: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 20,
  },
  perfilTexto: { color: '#fff', fontSize: 13 },
  botao: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ff3d0a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  botaoTexto: { color: '#fff', fontSize: 15, fontWeight: '700' },
  voltar: { color: '#fff', fontSize: 14 },
});
