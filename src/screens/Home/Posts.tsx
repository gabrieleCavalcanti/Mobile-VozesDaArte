
import { useEffect, useState } from 'react';
import type { ReactElement } from 'react';

import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CardPublicacao, {
  type Publicacao,
} from '../../components/CardPublicacao';

import BASE_URL, { apiGet, apiPost } from '../../api/api';

type PostAPI = {
  id_post: number;
  titulo: string;
  descricao: string;
  url_img: string | null;
  data_cadastro: string;
  id_artista: number;
  nome_artista?: string;
  url_foto_perfil?: string | null;
  nome_categoria?: string;
  endereco_cidade?: string | null;
  endereco_estado?: string | null;
  destaque?: boolean | number;
};

type RespostaFeed = {
  dados: PostAPI[];
  pagina: number;
  limite: number;
  total: number;
  temMais: boolean;
};

type RespostaCurtida = {
  curtido: boolean;
};

type RespostaFavorito = {
  favoritado: boolean;
};

type Props = {
  header?: ReactElement;
  margemLateral?: number;
  onAbrirPerfil?: (id_artista: number) => void;
  idArtista?: number;
  nomeArtista?: string;
  avatarArtista?: string;
};

function montarImagem(nomeArquivo?: string | null): string | undefined {
  if (!nomeArquivo) return undefined;

  if (nomeArquivo.startsWith('http')) {
    return nomeArquivo;
  }

  return `${BASE_URL}/images/${nomeArquivo}`;
}

function converterPost(
  post: PostAPI,
  nomeArtista?: string,
  avatarArtista?: string,
): Publicacao {
  return {
    id: String(post.id_post),
    id_artista: post.id_artista,
    artista: nomeArtista || post.nome_artista || 'Artista',
    legenda: post.descricao || '',
    titulo: post.titulo || '',
    imagem: montarImagem(post.url_img),
    avatar: avatarArtista || montarImagem(post.url_foto_perfil),
    categoria: post.nome_categoria,
    data: post.data_cadastro,
    cidade: post.endereco_cidade,
    estado: post.endereco_estado,
    curtido: false,
    favorito: false,
  };
}

export default function Posts({
  header,
  margemLateral = 0,
  onAbrirPerfil,
  idArtista,
  nomeArtista,
  avatarArtista,
}: Props) {
  const insets = useSafeAreaInsets();

  const [posts, setPosts] = useState<Publicacao[]>([]);
  const [pagina, setPagina] = useState(1);
  const [temMais, setTemMais] = useState(false);

  const [carregando, setCarregando] = useState(true);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState('');

  async function carregarEstados(postsCarregados: Publicacao[]) {
    const postsComEstados = await Promise.all(
      postsCarregados.map(async (post) => {
        try {
          const [respostaLike, respostaFavorito] = await Promise.all([
            apiGet<RespostaCurtida>(`/likes/verificar/${post.id}`),
            apiGet<RespostaFavorito>(
              `/favoritos/verificar/${post.id_artista}`,
            ),
          ]);

          return {
            ...post,
            curtido: respostaLike.curtido,
            favorito: respostaFavorito.favoritado,
          };
        } catch (error) {
          console.log(
            `Erro ao consultar estados do post ${post.id}:`,
            error,
          );

          return post;
        }
      }),
    );

    return postsComEstados;
  }

  async function buscarPosts(
    paginaSolicitada: number,
    substituir = false,
  ) {
    if (paginaSolicitada === 1 && !atualizando) {
      setCarregando(true);
    } else if (paginaSolicitada > 1) {
      setCarregandoMais(true);
    }

    setErro('');

    try {
      let novosPosts: Publicacao[];

      if (idArtista !== undefined) {
        // Perfil: busca somente os posts deste artista.
        const resposta = await apiGet<PostAPI[]>(
          `/posts/artista/${idArtista}`,
        );

        novosPosts = [...resposta]
          .sort(
            (a, b) =>
              Number(b.destaque) - Number(a.destaque),
          )
          .map((post) =>
            converterPost(post, nomeArtista, avatarArtista),
          );

        setPagina(1);
        setTemMais(false);
      } else {
        // Home: mantém o feed geral paginado.
        const resposta = await apiGet<RespostaFeed>(
          `/posts/feed?pagina=${paginaSolicitada}`,
        );

        novosPosts = resposta.dados.map((post) =>
          converterPost(post),
        );

        setPagina(resposta.pagina);
        setTemMais(resposta.temMais);
      }

      const postsComEstados = await carregarEstados(novosPosts);

      setPosts((atuais) =>
        substituir || idArtista !== undefined
          ? postsComEstados
          : [...atuais, ...postsComEstados],
      );
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar os posts.',
      );
    } finally {
      setCarregando(false);
      setCarregandoMais(false);
      setAtualizando(false);
    }
  }

  useEffect(() => {
    buscarPosts(1, true);
  }, [idArtista, nomeArtista, avatarArtista]);

  function carregarMais() {
    if (
      idArtista === undefined &&
      !carregando &&
      !carregandoMais &&
      temMais
    ) {
      buscarPosts(pagina + 1);
    }
  }

  function atualizar() {
    setAtualizando(true);
    buscarPosts(1, true);
  }

  async function alternarCurtida(post: Publicacao) {
    try {
      await apiPost(`/likes/alternar/${post.id}`, {});

      setPosts((atuais) =>
        atuais.map((item) =>
          item.id === post.id
            ? { ...item, curtido: !item.curtido }
            : item,
        ),
      );
    } catch (error) {
      Alert.alert(
        'Não foi possível curtir',
        error instanceof Error ? error.message : 'Tente novamente.',
      );
    }
  }

  async function alternarFavorito(post: Publicacao) {
    try {
      await apiPost(`/favoritos/alternar/${post.id_artista}`, {});

      setPosts((atuais) =>
        atuais.map((item) =>
          item.id_artista === post.id_artista
            ? { ...item, favorito: !item.favorito }
            : item,
        ),
      );
    } catch (error) {
      Alert.alert(
        'Não foi possível favoritar',
        error instanceof Error ? error.message : 'Tente novamente.',
      );
    }
  }

  if (carregando && posts.length === 0) {
    return (
      <View style={styles.centralizado}>
        <ActivityIndicator size="large" color="#ff7a00" />
        <Text style={styles.textoAuxiliar}>
          Carregando publicações...
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={posts}
      keyExtractor={(post) => post.id}
      ListHeaderComponent={header}
      scrollEnabled={idArtista === undefined}
      contentContainerStyle={{
        paddingBottom: insets.bottom + 24,
        flexGrow: posts.length === 0 ? 1 : 0,
      }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={atualizando}
          onRefresh={atualizar}
          tintColor="#ff7a00"
        />
      }
      onEndReached={
        idArtista === undefined ? carregarMais : undefined
      }
      onEndReachedThreshold={0.4}
      renderItem={({ item }) => (
        <View style={{ paddingHorizontal: margemLateral }}>
          <CardPublicacao
            item={item}
            onCurtir={() => alternarCurtida(item)}
            onFavoritar={() => alternarFavorito(item)}
            onAbrirPerfil={(id_artista) =>
              onAbrirPerfil?.(id_artista)
            }
          />
        </View>
      )}
      ListEmptyComponent={
        <View style={styles.centralizado}>
          <Text style={styles.textoAuxiliar}>
            {erro || 'Nenhuma publicação por aqui ainda.'}
          </Text>
        </View>
      }
      ListFooterComponent={() => {
        if (carregandoMais) {
          return (
            <ActivityIndicator
              style={styles.carregandoMais}
              color="#ff7a00"
            />
          );
        }

        if (erro && posts.length > 0) {
          return <Text style={styles.erro}>{erro}</Text>;
        }

        return null;
      }}
    />
  );
}

const styles = StyleSheet.create({
  centralizado: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  textoAuxiliar: {
    color: '#aaa',
    marginTop: 12,
    textAlign: 'center',
  },
  carregandoMais: {
    marginVertical: 20,
  },
  erro: {
    color: '#ff7777',
    textAlign: 'center',
    padding: 16,
  },
});
