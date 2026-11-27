
import { useEffect, useRef, useState } from 'react';
import type { ReactElement } from 'react';

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CardPublicacao, {
  type Publicacao,
} from '../../components/CardPublicacao';

import BASE_URL, {
  apiGet,
  apiPost,
  apiPatch,
  apiPut,
} from '../../api/api';

type PostAPI = {
  id_post: number;
  id_categoria?: number;
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
  destaque?: boolean | number | string;
  arquivado?: boolean | number | string;
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
  ehDono?: boolean;
  visualizandoArquivados?: boolean;
};

function valorBooleano(
  valor?: boolean | number | string | null,
): boolean {
  return (
    valor === true ||
    valor === 'true' ||
    valor === '1' ||
    Number(valor) === 1
  );
}

function montarImagem(
  nomeArquivo?: string | null,
): string | undefined {
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
    artista:
      nomeArtista ||
      post.nome_artista ||
      'Artista',
    legenda: post.descricao || '',
    titulo: post.titulo || '',
    imagem: montarImagem(post.url_img),
    avatar:
      avatarArtista ||
      montarImagem(post.url_foto_perfil),
    categoria: post.nome_categoria,
    data: post.data_cadastro,
    cidade: post.endereco_cidade,
    estado: post.endereco_estado,
    curtido: false,
    favorito: false,
    destacado: valorBooleano(post.destaque),
  };
}

export default function Posts({
  header,
  margemLateral = 0,
  onAbrirPerfil,
  idArtista,
  nomeArtista,
  avatarArtista,
  ehDono = false,
  visualizandoArquivados = false,
}: Props) {
  const insets = useSafeAreaInsets();

  const [posts, setPosts] = useState<Publicacao[]>([]);
  const [pagina, setPagina] = useState(1);
  const [temMais, setTemMais] = useState(false);

  const [carregando, setCarregando] = useState(true);
  const [carregandoMais, setCarregandoMais] =
    useState(false);
  const [atualizando, setAtualizando] =
    useState(false);
  const [erro, setErro] = useState('');

  const categoriasPorPost = useRef<
    Record<string, number | undefined>
  >({});

  const [modalEdicao, setModalEdicao] = useState(false);
  const [postEditando, setPostEditando] =
    useState<Publicacao | null>(null);

  const [tituloEdicao, setTituloEdicao] = useState('');
  const [descricaoEdicao, setDescricaoEdicao] =
    useState('');

  const [salvandoEdicao, setSalvandoEdicao] =
    useState(false);

  // =====================================================
  // CARREGAR CURTIDAS E FAVORITOS
  // =====================================================

  async function carregarEstados(
    postsCarregados: Publicacao[],
  ) {
    const postsComEstados = await Promise.all(
      postsCarregados.map(async (post) => {
        try {
          const [
            respostaLike,
            respostaFavorito,
          ] = await Promise.all([
            apiGet<RespostaCurtida>(
              `/likes/verificar/${post.id}`,
            ),
            apiGet<RespostaFavorito>(
              `/favoritos/verificar/${post.id_artista}`,
            ),
          ]);

          return {
            ...post,
            curtido: respostaLike.curtido,
            favorito: respostaFavorito.favoritado,
          };
        } catch {
          return post;
        }
      }),
    );

    return postsComEstados;
  }

  // =====================================================
  // BUSCAR PUBLICAÇÕES
  // =====================================================

  async function buscarPosts(
    paginaSolicitada: number,
    substituir = false,
  ) {
    if (paginaSolicitada === 1) {
      setCarregando(true);
    } else if (paginaSolicitada > 1) {
      setCarregandoMais(true);
    }

    setErro('');

    try {
      let novosPosts: Publicacao[];

      // PERFIL DO ARTISTA

      if (idArtista !== undefined) {
        const rota = visualizandoArquivados
          ? '/posts/arquivados'
          : `/posts/artista/${idArtista}`;

        const resposta =
          await apiGet<PostAPI[]>(rota);

        resposta.forEach((post) => {
          categoriasPorPost.current[
            String(post.id_post)
          ] = post.id_categoria;
        });

        novosPosts = resposta
          .filter((post) => {
            const arquivado =
              valorBooleano(post.arquivado);

            if (visualizandoArquivados) {
              return (
                post.arquivado === undefined ||
                post.arquivado === null ||
                arquivado
              );
            }

            return !arquivado;
          })
          .sort(
            (a, b) =>
              Number(valorBooleano(b.destaque)) -
              Number(valorBooleano(a.destaque)),
          )
          .map((post) =>
            converterPost(
              post,
              nomeArtista,
              avatarArtista,
            ),
          );

        setPagina(1);
        setTemMais(false);
      } else {
        // FEED

        const resposta =
          await apiGet<RespostaFeed>(
            `/posts/feed?pagina=${paginaSolicitada}`,
          );

        resposta.dados.forEach((post) => {
          categoriasPorPost.current[
            String(post.id_post)
          ] = post.id_categoria;
        });

        novosPosts = [...resposta.dados]
          .filter(
            (post) =>
              !valorBooleano(post.arquivado),
          )
          .sort(
            (a, b) =>
              Number(valorBooleano(b.destaque)) -
              Number(valorBooleano(a.destaque)),
          )
          .map((post) => converterPost(post));

        setPagina(resposta.pagina);
        setTemMais(resposta.temMais);
      }

      // CARREGAR CURTIDAS E FAVORITOS

      const postsComEstados =
        await carregarEstados(novosPosts);

      setPosts((atuais) => {
        if (
          substituir ||
          idArtista !== undefined ||
          paginaSolicitada === 1
        ) {
          return postsComEstados;
        }

        return [...atuais, ...postsComEstados];
      });
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

  // =====================================================
  // EFEITO INICIAL / MUDANÇA DE ABA
  // =====================================================

  useEffect(() => {
    setPosts([]);
    setPagina(1);
    setTemMais(false);
    setErro('');
    setCarregando(true);

    buscarPosts(1, true);
  }, [
    idArtista,
    nomeArtista,
    avatarArtista,
    visualizandoArquivados,
  ]);

  // =====================================================
  // PAGINAÇÃO DO FEED
  // =====================================================

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

  // =====================================================
  // ATUALIZAR
  // =====================================================

  function atualizar() {
    setAtualizando(true);
    buscarPosts(1, true);
  }

  // =====================================================
  // CURTIR
  // =====================================================

  async function alternarCurtida(
    post: Publicacao,
  ) {
    if (visualizandoArquivados) return;

    try {
      await apiPost(
        `/likes/alternar/${post.id}`,
        {},
      );

      setPosts((atuais) =>
        atuais.map((item) =>
          item.id === post.id
            ? {
                ...item,
                curtido: !item.curtido,
              }
            : item,
        ),
      );
    } catch (error) {
      Alert.alert(
        'Não foi possível curtir',
        error instanceof Error
          ? error.message
          : 'Tente novamente.',
      );
    }
  }

  // =====================================================
  // FAVORITAR ARTISTA
  // =====================================================

  async function alternarFavorito(
    post: Publicacao,
  ) {
    if (visualizandoArquivados) return;

    const favoritoAnterior = post.favorito;

    setPosts((atuais) =>
      atuais.map((item) =>
        item.id_artista === post.id_artista
          ? {
              ...item,
              favorito: !favoritoAnterior,
            }
          : item,
      ),
    );

    try {
      await apiPost(
        `/favoritos/alternar/${post.id_artista}`,
        {},
      );
    } catch (error) {
      setPosts((atuais) =>
        atuais.map((item) =>
          item.id_artista === post.id_artista
            ? {
                ...item,
                favorito: favoritoAnterior,
              }
            : item,
        ),
      );

      Alert.alert(
        'Não foi possível favoritar',
        error instanceof Error
          ? error.message
          : 'Tente novamente.',
      );
    }
  }

  // =====================================================
  // ABRIR EDIÇÃO
  // =====================================================

  function editarPost(post: Publicacao) {
    if (visualizandoArquivados) return;

    setPostEditando(post);
    setTituloEdicao(post.titulo || '');
    setDescricaoEdicao(post.legenda || '');
    setModalEdicao(true);
  }

  // =====================================================
  // SALVAR EDIÇÃO
  // =====================================================

  async function salvarEdicao() {
    if (!postEditando) return;

    if (
      !tituloEdicao.trim() ||
      !descricaoEdicao.trim()
    ) {
      Alert.alert(
        'Campos obrigatórios',
        'Preencha o título e a descrição.',
      );
      return;
    }

    const idCategoria =
      categoriasPorPost.current[postEditando.id];

    if (!idCategoria) {
      Alert.alert(
        'Não foi possível editar',
        'A publicação não possui categoria carregada.',
      );
      return;
    }

    setSalvandoEdicao(true);

    try {
      await apiPut(
        `/posts/${postEditando.id}`,
        {
          id_categoria: idCategoria,
          titulo: tituloEdicao.trim(),
          descricao: descricaoEdicao.trim(),
        },
      );

      setModalEdicao(false);
      setPostEditando(null);

      Alert.alert(
        'Sucesso',
        'Publicação atualizada!',
      );

      await buscarPosts(1, true);
    } catch (error) {
      Alert.alert(
        'Erro ao editar',
        error instanceof Error
          ? error.message
          : 'Não foi possível atualizar a publicação.',
      );
    } finally {
      setSalvandoEdicao(false);
    }
  }

  // =====================================================
  // ARQUIVAR
  // =====================================================

  function arquivarPost(post: Publicacao) {
    if (visualizandoArquivados) return;

    Alert.alert(
      'Arquivar publicação',
      `Deseja arquivar "${post.titulo || 'esta publicação'}"?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Arquivar',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiPatch(
                `/posts/${post.id}/arquivar`,
              );

              setPosts((atuais) =>
                atuais.filter(
                  (item) => item.id !== post.id,
                ),
              );

              Alert.alert(
                'Sucesso',
                'Publicação arquivada!',
              );
            } catch (error) {
              Alert.alert(
                'Erro',
                error instanceof Error
                  ? error.message
                  : 'Não foi possível arquivar.',
              );
            }
          },
        },
      ],
    );
  }

  // =====================================================
  // RESTAURAR
  // =====================================================

  function desarquivarPost(
    post: Publicacao,
  ) {
    if (!visualizandoArquivados) return;

    Alert.alert(
      'Restaurar publicação',
      'Deseja devolver esta publicação para o perfil?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Restaurar',
          onPress: async () => {
            try {
              await apiPatch(
                `/posts/${post.id}/desarquivar`,
              );

              setPosts((atuais) =>
                atuais.filter(
                  (item) => item.id !== post.id,
                ),
              );

              Alert.alert(
                'Sucesso',
                'Publicação restaurada!',
              );
            } catch (error) {
              Alert.alert(
                'Erro',
                error instanceof Error
                  ? error.message
                  : 'Não foi possível restaurar.',
              );
            }
          },
        },
      ],
    );
  }

  // =====================================================
  // DESTAQUE
  // =====================================================

  async function destacarPost(
    post: Publicacao,
  ) {
    if (visualizandoArquivados) return;

    const rota = post.destacado
      ? `/posts/${post.id}/remover-destaque`
      : `/posts/${post.id}/destacar`;

    try {
      await apiPatch(rota);

      setPosts((atuais) =>
        atuais
          .map((item) =>
            item.id === post.id
              ? {
                  ...item,
                  destacado: !post.destacado,
                }
              : item,
          )
          .sort(
            (a, b) =>
              Number(Boolean(b.destacado)) -
              Number(Boolean(a.destacado)),
          ),
      );
    } catch (error) {
      Alert.alert(
        'Erro',
        error instanceof Error
          ? error.message
          : 'Não foi possível alterar o destaque.',
      );
    }
  }

  // =====================================================
  // CARREGAMENTO
  // =====================================================

  if (
    carregando &&
    posts.length === 0 &&
    !atualizando
  ) {
    return (
      <View style={styles.centralizado}>
        <ActivityIndicator
          size="large"
          color="#E30613"
        />

        <Text style={styles.textoAuxiliar}>
          {visualizandoArquivados
            ? 'Carregando arquivados...'
            : 'Carregando publicações...'}
        </Text>
      </View>
    );
  }

  // =====================================================
  // TELA
  // =====================================================

  return (
    <>
      <FlatList
        data={posts}
        keyExtractor={(post) => post.id}

        ListHeaderComponent={header}

        scrollEnabled={idArtista === undefined}

        contentContainerStyle={{
          paddingBottom: insets.bottom + 24,
          flexGrow:
            posts.length === 0 ? 1 : 0,
        }}

        showsVerticalScrollIndicator={false}

        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={atualizar}
            tintColor="#E30613"
            colors={['#E30613']}
          />
        }

        onEndReached={
          idArtista === undefined
            ? carregarMais
            : undefined
        }

        onEndReachedThreshold={0.4}

        renderItem={({ item }) => (
          <View
            style={{
              paddingHorizontal: margemLateral,
            }}
          >
            <CardPublicacao
              item={item}

              onCurtir={() =>
                alternarCurtida(item)
              }

              onFavoritar={() =>
                alternarFavorito(item)
              }

              onAbrirPerfil={(id) =>
                onAbrirPerfil?.(id)
              }

              mostrarGerenciamento={ehDono}

              mostrarFavorito={
                !ehDono && !visualizandoArquivados
              }

              mostrarCurtida={
                !visualizandoArquivados
              }

              arquivado={visualizandoArquivados}

              onEditar={
                visualizandoArquivados
                  ? undefined
                  : () => editarPost(item)
              }

              onArquivar={
                visualizandoArquivados
                  ? undefined
                  : () => arquivarPost(item)
              }

              onDesarquivar={
                visualizandoArquivados
                  ? () => desarquivarPost(item)
                  : undefined
              }

              mostrarDestacar={
                ehDono &&
                !visualizandoArquivados
              }

              onDestacar={
                visualizandoArquivados
                  ? undefined
                  : () => destacarPost(item)
              }
            />
          </View>
        )}

        ListEmptyComponent={
          <View style={styles.centralizado}>
            <Ionicons
              name={
                visualizandoArquivados
                  ? 'archive-outline'
                  : 'images-outline'
              }
              size={42}
              color="#777"
            />

            <Text style={styles.textoAuxiliar}>
              {erro ||
                (visualizandoArquivados
                  ? 'Nenhuma publicação arquivada.'
                  : 'Nenhuma publicação por aqui ainda.')}
            </Text>
          </View>
        }

        ListFooterComponent={
          carregandoMais ? (
            <View style={styles.footer}>
              <ActivityIndicator
                color="#E30613"
                size="small"
              />
            </View>
          ) : erro && posts.length > 0 ? (
            <Text style={styles.erro}>
              {erro}
            </Text>
          ) : undefined
        }
      />

      {/* MODAL DE EDIÇÃO */}

      <Modal
        visible={modalEdicao}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setModalEdicao(false)
        }
      >
        <View style={styles.modalFundo}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitulo}>
              Editar publicação
            </Text>

            <Text style={styles.label}>
              Título
            </Text>

            <TextInput
              value={tituloEdicao}
              onChangeText={setTituloEdicao}
              placeholder="Título da publicação"
              placeholderTextColor="#999"
              style={styles.input}
            />

            <Text style={styles.label}>
              Descrição
            </Text>

            <TextInput
              value={descricaoEdicao}
              onChangeText={setDescricaoEdicao}
              placeholder="Descrição da publicação"
              placeholderTextColor="#999"
              style={[
                styles.input,
                styles.inputMultiline,
              ]}
              multiline
            />

            <Text style={styles.modalAviso}>
              A categoria e a imagem atuais serão mantidas.
            </Text>

            <View style={styles.modalBotoes}>
              <Pressable
                style={styles.botaoCancelar}
                onPress={() =>
                  setModalEdicao(false)
                }
                disabled={salvandoEdicao}
              >
                <Text
                  style={styles.textoBotaoCancelar}
                >
                  Cancelar
                </Text>
              </Pressable>

              <Pressable
                style={styles.botaoSalvar}
                onPress={salvarEdicao}
                disabled={salvandoEdicao}
              >
                {salvandoEdicao ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text
                    style={styles.textoBotaoSalvar}
                  >
                    Salvar
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

// =====================================================
// ESTILOS
// =====================================================

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
    fontSize: 13,
  },

  footer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  erro: {
    color: '#ff7777',
    textAlign: 'center',
    padding: 16,
  },

  modalFundo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    padding: 20,
  },

  modalContainer: {
    backgroundColor: '#222',
    borderRadius: 18,
    padding: 20,
    maxHeight: '90%',
  },

  modalTitulo: {
    color: '#fff',
    fontSize: 21,
    fontWeight: 'bold',
    marginBottom: 18,
  },

  label: {
    color: '#ddd',
    fontSize: 14,
    marginBottom: 6,
    marginTop: 10,
  },

  input: {
    backgroundColor: '#333',
    color: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
  },

  inputMultiline: {
    minHeight: 110,
    textAlignVertical: 'top',
  },

  modalAviso: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 12,
  },

  modalBotoes: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 22,
    gap: 10,
  },

  botaoCancelar: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: '#444',
  },

  textoBotaoCancelar: {
    color: '#fff',
    fontWeight: '600',
  },

  botaoSalvar: {
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 10,
    backgroundColor: '#E30613',
    minWidth: 100,
    alignItems: 'center',
  },

  textoBotaoSalvar: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
