
import { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../routes/types';

import { useAuth } from '../../context/AuthContext';
import BASE_URL, { apiGet } from '../../api/api';

import Abas from '../../components/Abas';
import Posts from '../Home/Posts';
import Eventos from '../Home/Eventos';

type Props = NativeStackScreenProps<RootStackParamList, 'Perfil'>;

type ArtistaAPI = {
  id_artista: number;
  id_usuario: number;
  url_foto_capa: string | null;
  biografia: string | null;
};

type UsuarioAPI = {
  id_usuario: number;
  nome: string;
  username?: string;
  email: string;
  url_foto_perfil: string | null;
};

type Aba = 'eventos' | 'posts';

const OPCOES: { valor: Aba; rotulo: string }[] = [
  { valor: 'eventos', rotulo: 'EVENTOS' },
  { valor: 'posts', rotulo: 'POSTS' },
];

function montarImagem(nomeArquivo?: string | null): string | undefined {
  if (!nomeArquivo) return undefined;

  if (nomeArquivo.startsWith('http')) {
    return nomeArquivo;
  }

  return `${BASE_URL}/images/${nomeArquivo}`;
}

export default function Perfil({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { usuario } = useAuth();

  const { id_artista } = route.params;

  const [artista, setArtista] = useState<ArtistaAPI | null>(null);
  const [dadosUsuario, setDadosUsuario] = useState<UsuarioAPI | null>(null);

  const [aba, setAba] = useState<Aba>('posts');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const ehDono =
    !!artista &&
    !!usuario?.id_usuario &&
    artista.id_usuario === usuario.id_usuario;

  useEffect(() => {
    let ativo = true;

    async function carregarPerfil() {
      try {
        setCarregando(true);
        setErro('');

        setArtista(null);
        setDadosUsuario(null);

        const dadosArtista = await apiGet<ArtistaAPI>(
          `/artistas/${id_artista}`,
        );

        const dadosUsuario = await apiGet<UsuarioAPI>(
          `/usuarios/${dadosArtista.id_usuario}`,
        );

        if (ativo) {
          setArtista(dadosArtista);
          setDadosUsuario(dadosUsuario);
        }
      } catch (error) {
        if (ativo) {
          setErro(
            error instanceof Error
              ? error.message
              : 'Não foi possível carregar o perfil.',
          );
        }
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    carregarPerfil();

    return () => {
      ativo = false;
    };
  }, [id_artista]);

  if (carregando) {
    return (
      <View style={styles.centralizado}>
        <ActivityIndicator size="large" color="#ff7a00" />
        <Text style={styles.textoAuxiliar}>
          Carregando perfil...
        </Text>
      </View>
    );
  }

  if (!artista || !dadosUsuario) {
    return (
      <View style={styles.centralizado}>
        <Text style={styles.erro}>
          {erro || 'Não foi possível encontrar este artista.'}
        </Text>

        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.voltar}>Voltar</Text>
        </Pressable>
      </View>
    );
  }

  const imagemCapa = montarImagem(artista.url_foto_capa);
  const imagemPerfil = montarImagem(dadosUsuario.url_foto_perfil);

  const nomeExibido =
    dadosUsuario.nome?.trim() || dadosUsuario.username || 'Artista';

  return (
    <View style={styles.tela}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 24,
        }}
      >
        {/* CAPA */}
        <ImageBackground
          source={
            imagemCapa
              ? { uri: imagemCapa }
              : require('../../assets/fundoPerfil.jpg')
          }
          resizeMode="cover"
          style={[
            styles.banner,
            { paddingTop: insets.top + 8 },
          ]}
        >
          <View style={styles.bannerTopo}>
            <Pressable
              onPress={() => navigation.goBack()}
              hitSlop={12}
            >
              <Ionicons name="close" size={28} color="#fff" />
            </Pressable>

            {ehDono && (
              <Pressable
                onPress={() => {
                  // A tela de edição será conectada aqui.
                }}
                hitSlop={12}
              >
                <Ionicons name="pencil" size={23} color="#fff" />
              </Pressable>
            )}
          </View>

          <View style={styles.bannerInfo}>
            {imagemPerfil ? (
              <Image
                source={{ uri: imagemPerfil }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarVazio}>
                <Ionicons name="person" size={42} color="#fff" />
              </View>
            )}

            <View style={styles.dados}>
              <Text style={styles.nome} numberOfLines={2}>
                {nomeExibido}
              </Text>

              <Text style={styles.email} numberOfLines={1}>
                {dadosUsuario.email}
              </Text>
            </View>
          </View>

          {ehDono && (
            <Pressable
              style={styles.botaoMais}
              onPress={() => navigation.navigate('Criar')}
            >
              <Ionicons name="add" size={26} color="#fff" />
            </Pressable>
          )}
        </ImageBackground>

        {/* BIOGRAFIA */}
        {!!artista.biografia && (
          <View style={styles.bioContainer}>
            <Text style={styles.bio}>
              {artista.biografia}
            </Text>
          </View>
        )}

        {/* PAINEL DE CONTEÚDO */}
        <View style={styles.painel}>
          <Abas
            opcoes={OPCOES}
            atual={aba}
            onChange={setAba}
          />

          <View style={styles.conteudo}>
            {aba === 'posts' ? (
              <Posts
                idArtista={id_artista}
                nomeArtista={nomeExibido}
                avatarArtista={imagemPerfil}
                margemLateral={0}
              />
            ) : (
              <Eventos
                idArtista={id_artista}
                nomeArtista={nomeExibido}
                avatarArtista={imagemPerfil}
              />
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: '#000',
  },

  centralizado: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  textoAuxiliar: {
    color: '#aaa',
    marginTop: 12,
  },

  erro: {
    color: '#ff7777',
    textAlign: 'center',
  },

  voltar: {
    color: '#ff7a00',
    marginTop: 16,
  },

  banner: {
    minHeight: 220,
    paddingHorizontal: 16,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },

  bannerTopo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  bannerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 24,
    paddingRight: 48,
  },

  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#555',
    borderWidth: 2,
    borderColor: '#fff',
  },

  avatarVazio: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#555',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },

  dados: {
    flex: 1,
  },

  nome: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },

  email: {
    color: '#eee',
    fontSize: 12,
    marginTop: 4,
  },

  botaoMais: {
    position: 'absolute',
    right: 16,
    bottom: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ff7a00',
    alignItems: 'center',
    justifyContent: 'center',
  },

  bioContainer: {
    backgroundColor: '#000',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },

  bio: {
    color: '#bbb',
    fontSize: 13,
    lineHeight: 19,
  },

  painel: {
    flex: 1,
    minHeight: 400,
    backgroundColor: '#1f1f1f',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingTop: 20,
    paddingHorizontal: 16,
    overflow: 'hidden',
  },

  conteudo: {
    flex: 1,
    paddingTop: 8,
  },
});
