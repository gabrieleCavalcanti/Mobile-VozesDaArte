
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
  Alert,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../routes/types';

import { apiPost } from '../../api/api';

type Props = NativeStackScreenProps<RootStackParamList, 'Cadastro'>;

interface CadastroResponse {
  message: string;
  id_usuario?: number;
  id_artista?: number;
}

export default function Cadastro({ navigation }: Props) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  const [profissional, setProfissional] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);

  async function cadastrar() {
    if (carregando) return;

    // VALIDAR CAMPOS OBRIGATÓRIOS
    if (
      !nome.trim() ||
      !email.trim() ||
      !usuario.trim() ||
      !senha ||
      !confirmarSenha
    ) {
      Alert.alert('Atenção', 'Preencha todos os campos obrigatórios.');
      return;
    }

    // VALIDAR NOME
    if (nome.trim().length < 2 || nome.trim().length > 100) {
      Alert.alert(
        'Atenção',
        'O nome deve possuir entre 2 e 100 caracteres.'
      );
      return;
    }

    // VALIDAR E-MAIL
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailValido.test(email.trim())) {
      Alert.alert('Atenção', 'Informe um e-mail válido.');
      return;
    }

    // VALIDAR USERNAME
    const usernameValido = /^[a-zA-Z0-9._-]{3,30}$/;

    if (!usernameValido.test(usuario.trim())) {
      Alert.alert(
        'Atenção',
        'O usuário deve possuir entre 3 e 30 caracteres e conter apenas letras, números, ponto, hífen ou underline.'
      );
      return;
    }

    // VALIDAR SENHA
    if (senha.length < 8 || senha.length > 72) {
      Alert.alert(
        'Atenção',
        'A senha deve possuir entre 8 e 72 caracteres.'
      );
      return;
    }

    // CONFIRMAR SENHA
    if (senha !== confirmarSenha) {
      Alert.alert('Atenção', 'As senhas não são iguais.');
      return;
    }

    // DEFINIR TIPO DE CADASTRO
    const tipo = profissional ? 'ARTISTA' : 'USUARIO';

    // MONTAR DADOS PARA O BACKEND
    const dados = {
      nome: nome.trim(),
      email: email.trim().toLowerCase(),
      tipo,
      username: usuario.trim(),
      password: senha,
    };

    try {
      setCarregando(true);

      const resposta = await apiPost<CadastroResponse>(
        '/usuarios',
        dados
      );

      Alert.alert(
        'Cadastro realizado!',
        resposta.message || 'Cadastro realizado com sucesso.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );

    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : 'Não foi possível realizar o cadastro.';

      Alert.alert('Erro no cadastro', mensagem);

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

        {/* NOME */}
        <View style={styles.campo}>
          <Text style={styles.label}>Nome *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex.: Mariana"
            placeholderTextColor="#9a9a9a"
            value={nome}
            onChangeText={setNome}
            autoCapitalize="words"
          />
        </View>

        {/* E-MAIL */}
        <View style={styles.campo}>
          <Text style={styles.label}>E-mail *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex.: mariana@email.com"
            placeholderTextColor="#9a9a9a"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        {/* USUÁRIO */}
        <View style={styles.campo}>
          <Text style={styles.label}>Usuário *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex.: mariana123"
            placeholderTextColor="#9a9a9a"
            autoCapitalize="none"
            value={usuario}
            onChangeText={setUsuario}
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

          <Text style={styles.orientacao}>
            A senha deve conter:
          </Text>
          <Text style={styles.dica}>• Mínimo de 8 caracteres.</Text>
          <Text style={styles.dica}>• Combine letras e números.</Text>
          <Text style={styles.dica}>
            • Utilize caracteres especiais, como @, # ou !.
          </Text>
        </View>

        {/* CONFIRMAR SENHA */}
        <View style={styles.campo}>
          <Text style={styles.label}>Confirme sua senha *</Text>

          <View style={styles.inputSenha}>
            <TextInput
              style={styles.inputSenhaTexto}
              placeholder="Digite sua senha novamente"
              placeholderTextColor="#9a9a9a"
              secureTextEntry={!mostrarConfirmarSenha}
              value={confirmarSenha}
              onChangeText={setConfirmarSenha}
            />

            <Pressable
              onPress={() =>
                setMostrarConfirmarSenha(!mostrarConfirmarSenha)
              }
              style={styles.iconeSenha}
            >
              <Ionicons
                name={
                  mostrarConfirmarSenha
                    ? 'eye-off-outline'
                    : 'eye-outline'
                }
                size={21}
                color="#aaa"
              />
            </Pressable>
          </View>
        </View>

        {/* PERFIL PROFISSIONAL */}
        <View style={styles.perfil}>
          <Text style={styles.perfilTexto}>
            Perfil profissional?
          </Text>

          <Switch
            value={profissional}
            onValueChange={setProfissional}
            trackColor={{
              false: '#3a3a3a',
              true: '#ff3d0a',
            }}
            thumbColor="#fff"
          />
        </View>

        {/* BOTÃO CADASTRAR */}
        <Pressable
          style={[
            styles.botao,
            carregando && styles.botaoDesabilitado,
          ]}
          onPress={cadastrar}
          disabled={carregando}
        >
          <Text style={styles.botaoTexto}>
            {carregando ? 'Cadastrando...' : 'Cadastrar'}
          </Text>
        </Pressable>

        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.voltar}>Já tenho conta</Text>
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
    paddingHorizontal: 32,
    paddingTop: 56,
    paddingBottom: 40,
  },

  logo: {
    width: 150,
    height: 150,
    marginBottom: 24,
  },

  campo: {
    width: '100%',
    marginBottom: 16,
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
    height: 46,
    backgroundColor: '#2a2a2a',
    borderRadius: 22,
    paddingHorizontal: 20,
    color: '#fff',
    fontSize: 13,
  },

  inputSenha: {
    width: '100%',
    height: 46,
    backgroundColor: '#2a2a2a',
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 20,
    paddingRight: 16,
  },

  inputSenhaTexto: {
    flex: 1,
    height: '100%',
    color: '#fff',
    fontSize: 13,
  },

  iconeSenha: {
    padding: 4,
  },

  orientacao: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 4,
    marginLeft: 4,
  },

  dica: {
    color: '#aaa',
    fontSize: 11,
    marginLeft: 4,
    marginTop: 3,
  },

  perfil: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 20,
  },

  perfilTexto: {
    color: '#fff',
    fontSize: 13,
  },

  botao: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ff3d0a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  botaoDesabilitado: {
    opacity: 0.6,
  },

  botaoTexto: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },

  voltar: {
    color: '#fff',
    fontSize: 14,
  },
});
