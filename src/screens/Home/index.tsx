
import { useState } from 'react';

import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../routes/types';

import { apiLogout } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { apiGet } from '../../api/api';


import Abas from '../../components/Abas';
import Posts from './Posts';
import Eventos from './Eventos';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

type Aba = 'eventos' | 'posts';

const OPCOES: { valor: Aba; rotulo: string }[] = [
  { valor: 'eventos', rotulo: 'EVENTOS' },
  { valor: 'posts', rotulo: 'POSTS' },
];

const logo = require('../../assets/logo.jpg');

const fonteLogo = Image.resolveAssetSource(logo);
const logoW = fonteLogo?.width ?? 1;
const logoH = fonteLogo?.height ?? 1;

// Ajuste fino do topete
const TOPETE_LARGURA = 700;
const TOPETE_CORTE = 0.72;
const TOPETE_CENTRO_X = 65;
const TOPETE_TOPO = -100;
const TOPETE_CAIXA = 460;

const logoAltura = TOPETE_LARGURA * (logoH / logoW);

export default function Home({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  const [menuAberto, setMenuAberto] = useState(false);
  const [aba, setAba] = useState<Aba>('posts');

  const { usuario, setUsuario, setAutenticado } = useAuth();

  const ehArtista = usuario?.tipo === 'ARTISTA';

  function abrirPerfilArtista(id_artista: number) {
  navigation.navigate('Perfil', {
    id_artista,
  });
}

  const nomeExibido =
    usuario?.nome?.trim() || usuario?.username || 'Usuário';

  async function sair() {
    setMenuAberto(false);

    try {
      await apiLogout();
    } catch {
      // Mesmo se a requisição falhar, a sessão local será encerrada.
    } finally {
      setUsuario(null);
      setAutenticado(false);
    }
  }

  return (
    <View style={styles.tela}>
      {/* TOPETE */}
      <View style={styles.topete} pointerEvents="none">
        <Image
          source={logo}
          style={styles.topeteImagem}
          resizeMode="stretch"
        />
      </View>

      {/* CABEÇALHO */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        {ehArtista ? (
          <Pressable
            style={styles.botaoMais}
            onPress={() => navigation.navigate('Criar')}
          >
            <Ionicons name="add" size={26} color="#fff" />
          </Pressable>
        ) : (
          // Mantém o espaço do botão para não alterar o alinhamento.
          <View style={styles.espacoBotao} />
        )}

        <View style={styles.headerDireita}>
          <View style={styles.avatarGrande} />

          <Pressable
            onPress={() => setMenuAberto(true)}
            hitSlop={12}
          >
            <Ionicons name="menu" size={24} color="#fff" />
          </Pressable>
        </View>
      </View>

      {/* NOME DO USUÁRIO */}
      <View style={styles.tituloLinha}>
        <Text
          style={styles.titulo}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {nomeExibido}
        </Text>

        <Ionicons
          name="location-outline"
          size={28}
          color="#ff9a00"
        />
      </View>

      {/* PAINEL */}
      <View style={styles.painel}>
        <Abas
          opcoes={OPCOES}
          atual={aba}
          onChange={setAba}
        />

        {aba === 'posts' ? (
  <Posts onAbrirPerfil={abrirPerfilArtista} />
) : (
  <Eventos onAbrirPerfil={abrirPerfilArtista} />
)}
      </View>

      {/* MENU LATERAL */}
      <Modal
        visible={menuAberto}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setMenuAberto(false)}
      >
        <View style={styles.menuFundo}>
          <Pressable
            style={styles.menuFora}
            onPress={() => setMenuAberto(false)}
          />

          <View
            style={[
              styles.menuPainel,
              {
                paddingTop: insets.top + 12,
                paddingBottom: insets.bottom + 24,
              },
            ]}
          >
            <Pressable
              style={styles.menuFechar}
              onPress={() => setMenuAberto(false)}
              hitSlop={12}
            >
              <Ionicons name="close" size={32} color="#000" />
            </Pressable>

            <View style={styles.menuTopo}>
              <View style={styles.menuAvatar} />

              <Text style={styles.menuNome}>
                {nomeExibido}
              </Text>

              <Pressable
                style={styles.menuPerfil}
onPress={async () => {
  setMenuAberto(false);

  if (!usuario?.id_usuario) {
    return;
  }

  try {
    const artista = await apiGet<{ id_artista: number }>(
      `/artistas/usuario/${usuario.id_usuario}`,
    );

    navigation.navigate('Perfil', {
      id_artista: artista.id_artista,
    });
  } catch (error) {
    console.log('Erro ao buscar perfil do artista:', error);
  }
}}
              >
                <Text style={styles.menuPerfilTexto}>
                  PERFIL
                </Text>
              </Pressable>
            </View>

            <Pressable
              style={styles.menuSair}
              onPress={sair}
            >
              <Ionicons
                name="person-remove"
                size={22}
                color="#ff3d0a"
              />

              <Text style={styles.menuSairTexto}>
                Sair da conta
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: '#000',
  },

  topete: {
    position: 'absolute',
    top: TOPETE_TOPO,
    left: 0,
    width: TOPETE_CAIXA,
    height: logoAltura * TOPETE_CORTE,
    overflow: 'hidden',
  },

  topeteImagem: {
    position: 'absolute',
    top: 0,
    left: TOPETE_CENTRO_X - TOPETE_LARGURA / 2,
    width: TOPETE_LARGURA,
    height: logoAltura,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },

  botaoMais: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ff7a00',
    alignItems: 'center',
    justifyContent: 'center',
  },

  espacoBotao: {
    width: 44,
    height: 44,
  },

  headerDireita: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  avatarGrande: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#555',
  },

  tituloLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    paddingHorizontal: 20,
    marginTop: 40,
    marginBottom: 12,
  },

  titulo: {
    color: '#e30613',
    fontSize: 24,
    fontWeight: '800',
    flexShrink: 1,
  },

  painel: {
    flex: 1,
    backgroundColor: '#1f1f1f',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingTop: 20,
    paddingHorizontal: 16,
  },

  menuFundo: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },

  menuFora: {
    flex: 1,
  },

  menuPainel: {
    width: '55%',
    backgroundColor: '#3a3a3a',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },

  menuFechar: {
    alignSelf: 'flex-end',
  },

  menuTopo: {
    alignItems: 'center',
  },

  menuAvatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#555',
    marginBottom: 24,
  },

  menuNome: {
    color: '#ff3d0a',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
    textAlign: 'center',
  },

  menuPerfil: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#666',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 36,
  },

  menuPerfilTexto: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },

  menuSair: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  menuSairTexto: {
    color: '#ff3d0a',
    fontSize: 13,
    fontWeight: '600',
  },
});
