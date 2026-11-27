
import { useEffect, useState } from 'react';

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

type EventoAPI = {
  id_evento: number;
  titulo: string;
  descricao: string;
  data_hora: string;
  valor: string | number;
  url_img: string | null;
  id_artista: number;
  nome_artista?: string;
  url_foto_perfil?: string | null;
  endereco_cidade: string | null;
  endereco_estado: string | null;
  destaque?: boolean | number | string;
  arquivado?: boolean | number | string;
};

type RespostaFeed = {
  dados: EventoAPI[];
  pagina: number;
  limite: number;
  total: number;
  temMais: boolean;
};

type RespostaFavorito = {
  favoritado: boolean;
};

type Props = {
  onAbrirPerfil?: (id_artista: number) => void;
  idArtista?: number;
  nomeArtista?: string;
  avatarArtista?: string;
  ehDono?: boolean;
  margemLateral?: number;
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

function converterEvento(
  evento: EventoAPI,
  nomeArtista?: string,
  avatarArtista?: string,
): Publicacao {
  return {
    id: String(evento.id_evento),
    id_artista: evento.id_artista,
    artista:
      nomeArtista ||
      evento.nome_artista ||
      'Artista',
    titulo: evento.titulo || '',
    legenda: evento.descricao || '',
    imagem: montarImagem(evento.url_img),
    avatar:
      avatarArtista ||
      montarImagem(evento.url_foto_perfil),
    data: evento.data_hora,
    valor: evento.valor,
    cidade: evento.endereco_cidade,
    estado: evento.endereco_estado,
    curtido: false,
    favorito: false,
    destacado: valorBooleano(evento.destaque),
  };
}

export default function Eventos({
  onAbrirPerfil,
  idArtista,
  nomeArtista,
  avatarArtista,
  ehDono = false,
  margemLateral = 0,
  visualizandoArquivados = false,
}: Props) {
  const insets = useSafeAreaInsets();

  const [eventos, setEventos] =
    useState<Publicacao[]>([]);

  const [pagina, setPagina] = useState(1);
  const [temMais, setTemMais] = useState(false);

  const [carregando, setCarregando] =
    useState(true);
  const [carregandoMais, setCarregandoMais] =
    useState(false);
  const [atualizando, setAtualizando] =
    useState(false);
  const [erro, setErro] = useState('');

  const [modalEdicao, setModalEdicao] =
    useState(false);

  const [eventoEditando, setEventoEditando] =
    useState<Publicacao | null>(null);

  const [tituloEdicao, setTituloEdicao] =
    useState('');
  const [descricaoEdicao, setDescricaoEdicao] =
    useState('');
  const [dataEdicao, setDataEdicao] =
    useState('');
  const [valorEdicao, setValorEdicao] =
    useState('');

  const [salvandoEdicao, setSalvandoEdicao] =
    useState(false);

  // =====================================================
  // CARREGAR FAVORITOS
  // =====================================================

  async function carregarEstadosFavoritos(
    eventosCarregados: Publicacao[],
  ) {
    const artistas = [
      ...new Set(
        eventosCarregados.map(
          (evento) => evento.id_artista,
        ),
      ),
    ];

    const estados = await Promise.all(
      artistas.map(async (id_artista) => {
        try {
          const resposta =
            await apiGet<RespostaFavorito>(
              `/favoritos/verificar/${id_artista}`,
            );

          return {
            id_artista,
            favorito: resposta.favoritado,
          };
        } catch {
          return {
            id_artista,
            favorito: false,
          };
        }
      }),
    );

    return eventosCarregados.map((evento) => ({
      ...evento,
      favorito:
        estados.find(
          (estado) =>
            estado.id_artista === evento.id_artista,
        )?.favorito ?? false,
    }));
  }

  // =====================================================
  // BUSCAR EVENTOS
  // =====================================================

  async function buscarEventos(
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
      let novosEventos: Publicacao[];

      // PERFIL DO ARTISTA

      if (idArtista !== undefined) {
        const rota =
          visualizandoArquivados
            ? '/eventos/arquivados'
            : `/eventos/artista/${idArtista}`;

        const resposta =
          await apiGet<EventoAPI[]>(rota);

        novosEventos = [...resposta]
          .filter((evento) => {
            const arquivado =
              valorBooleano(evento.arquivado);

            if (visualizandoArquivados) {
              return (
                evento.arquivado === undefined ||
                evento.arquivado === null ||
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
          .map((evento) =>
            converterEvento(
              evento,
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
            `/eventos/feed?pagina=${paginaSolicitada}`,
          );

        novosEventos = [...resposta.dados]
          .filter(
            (evento) =>
              !valorBooleano(evento.arquivado),
          )
          .sort(
            (a, b) =>
              Number(valorBooleano(b.destaque)) -
              Number(valorBooleano(a.destaque)),
          )
          .map((evento) =>
            converterEvento(evento),
          );

        setPagina(resposta.pagina);
        setTemMais(resposta.temMais);
      }

      // CARREGAR FAVORITOS

      const eventosComFavoritos =
        await carregarEstadosFavoritos(
          novosEventos,
        );

      setEventos((atuais) =>
        substituir ||
        idArtista !== undefined ||
        paginaSolicitada === 1
          ? eventosComFavoritos
          : [...atuais, ...eventosComFavoritos],
      );
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar os eventos.',
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
    setEventos([]);
    setPagina(1);
    setTemMais(false);
    setErro('');
    setCarregando(true);

    buscarEventos(1, true);
  }, [
    idArtista,
    nomeArtista,
    avatarArtista,
    visualizandoArquivados,
  ]);

  // =====================================================
  // PAGINAÇÃO
  // =====================================================

  function carregarMais() {
    if (
      idArtista === undefined &&
      !carregando &&
      !carregandoMais &&
      temMais
    ) {
      buscarEventos(pagina + 1);
    }
  }

  // =====================================================
  // ATUALIZAR
  // =====================================================

  function atualizar() {
    setAtualizando(true);
    buscarEventos(1, true);
  }

  // =====================================================
  // FAVORITAR
  // =====================================================

  async function alternarFavorito(
    evento: Publicacao,
  ) {
    if (visualizandoArquivados) return;

    const favoritoAnterior = evento.favorito;

    setEventos((atuais) =>
      atuais.map((item) =>
        item.id_artista === evento.id_artista
          ? {
                ...item,
                favorito: !favoritoAnterior,
              }
          : item,
      ),
    );

    try {
      await apiPost(
        `/favoritos/alternar/${evento.id_artista}`,
        {},
      );
    } catch (error) {
      setEventos((atuais) =>
        atuais.map((item) =>
          item.id_artista === evento.id_artista
            ? {
                ...item,
                favorito: favoritoAnterior,
              }
            : item,
        ),
      );

      Alert.alert(
        'Erro',
        error instanceof Error
          ? error.message
          : 'Não foi possível atualizar os favoritos.',
      );
    }
  }

  // =====================================================
  // ABRIR EDIÇÃO
  // =====================================================

  function editarEvento(evento: Publicacao) {
    if (visualizandoArquivados) return;

    setEventoEditando(evento);
    setTituloEdicao(evento.titulo || '');
    setDescricaoEdicao(evento.legenda || '');
    setDataEdicao(evento.data || '');
    setValorEdicao(String(evento.valor ?? ''));
    setModalEdicao(true);
  }

  // =====================================================
  // SALVAR EDIÇÃO
  // =====================================================

  async function salvarEdicao() {
    if (!eventoEditando) return;

    if (
      !tituloEdicao.trim() ||
      !descricaoEdicao.trim() ||
      !dataEdicao.trim() ||
      !valorEdicao.trim()
    ) {
      Alert.alert(
        'Campos obrigatórios',
        'Preencha o título, descrição, data e valor.',
      );
      return;
    }

    const valorNumerico = Number(
      valorEdicao.replace(',', '.'),
    );

    if (Number.isNaN(valorNumerico)) {
      Alert.alert(
        'Valor inválido',
        'Digite um valor numérico válido.',
      );
      return;
    }

    setSalvandoEdicao(true);

    try {
      await apiPut(
        `/eventos/${eventoEditando.id}`,
        {
          titulo: tituloEdicao.trim(),
          descricao: descricaoEdicao.trim(),
          data_hora: dataEdicao.trim(),
          valor: valorNumerico,
        },
      );

      setModalEdicao(false);
      setEventoEditando(null);

      Alert.alert(
        'Sucesso',
        'Evento atualizado com sucesso!',
      );

      await buscarEventos(1, true);
    } catch (error) {
      Alert.alert(
        'Erro ao editar',
        error instanceof Error
          ? error.message
          : 'Não foi possível atualizar o evento.',
      );
    } finally {
      setSalvandoEdicao(false);
    }
  }

  // =====================================================
  // ARQUIVAR
  // =====================================================

  function arquivarEvento(evento: Publicacao) {
    if (visualizandoArquivados) return;

    Alert.alert(
      'Arquivar evento',
      `Deseja arquivar "${evento.titulo || 'este evento'}"?`,
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
                `/eventos/${evento.id}/arquivar`,
              );

              setEventos((atuais) =>
                atuais.filter(
                  (item) => item.id !== evento.id,
                ),
              );

              Alert.alert(
                'Sucesso',
                'Evento arquivado com sucesso!',
              );
            } catch (error) {
              Alert.alert(
                'Erro',
                error instanceof Error
                  ? error.message
                  : 'Não foi possível arquivar o evento.',
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

  function desarquivarEvento(evento: Publicacao) {
    if (!visualizandoArquivados) return;

    Alert.alert(
      'Restaurar evento',
      'Deseja devolver este evento ao perfil?',
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
                `/eventos/${evento.id}/desarquivar`,
              );

              setEventos((atuais) =>
                atuais.filter(
                  (item) => item.id !== evento.id,
                ),
              );

              Alert.alert(
                'Sucesso',
                'Evento restaurado!',
              );
            } catch (error) {
              Alert.alert(
                'Erro',
                error instanceof Error
                  ? error.message
                  : 'Não foi possível restaurar o evento.',
              );
            }
          },
        },
      ],
    );
  }

  // =====================================================
  // DESTAQUE / REMOVER DESTAQUE
  // =====================================================

  async function destacarEvento(
    evento: Publicacao,
  ) {
    if (visualizandoArquivados) return;

    const rota = evento.destacado
      ? `/eventos/${evento.id}/retirar-destaque`
      : `/eventos/${evento.id}/destacar`;

    try {
      await apiPatch(rota);

      setEventos((atuais) =>
        atuais
          .map((item) =>
            item.id === evento.id
              ? {
                  ...item,
                  destacado: !evento.destacado,
                }
              : item,
          )
          .sort(
            (a, b) =>
              Number(Boolean(b.destacado)) -
              Number(Boolean(a.destacado)),
          ),
      );

      Alert.alert(
        'Sucesso',
        evento.destacado
          ? 'O destaque foi removido.'
          : 'Evento destacado com sucesso!',
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

  if (carregando && eventos.length === 0) {
    return (
      <View style={styles.centralizado}>
        <ActivityIndicator
          size="large"
          color="#ff7a00"
        />

        <Text style={styles.textoAuxiliar}>
          {visualizandoArquivados
            ? 'Carregando eventos arquivados...'
            : 'Carregando eventos...'}
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
        data={eventos}
        keyExtractor={(evento) => evento.id}

        scrollEnabled={idArtista === undefined}

        contentContainerStyle={{
          paddingBottom: insets.bottom + 24,
          flexGrow: eventos.length === 0 ? 1 : 0,
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

              mostrarCurtida={false}

              mostrarFavorito={
                !ehDono && !visualizandoArquivados
              }

              onFavoritar={() =>
                alternarFavorito(item)
              }

              onAbrirPerfil={(id_artista) =>
                onAbrirPerfil?.(id_artista)
              }

              mostrarGerenciamento={ehDono}

              arquivado={visualizandoArquivados}

              onEditar={
                visualizandoArquivados
                  ? undefined
                  : () => editarEvento(item)
              }

              onArquivar={
                visualizandoArquivados
                  ? undefined
                  : () => arquivarEvento(item)
              }

              onDesarquivar={
                visualizandoArquivados
                  ? () => desarquivarEvento(item)
                  : undefined
              }

              mostrarDestacar={
                ehDono && !visualizandoArquivados
              }

              onDestacar={
                visualizandoArquivados
                  ? undefined
                  : () => destacarEvento(item)
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
                  : 'calendar-outline'
              }
              size={38}
              color="#777"
            />

            <Text style={styles.textoAuxiliar}>
              {erro ||
                (visualizandoArquivados
                  ? 'Nenhum evento arquivado.'
                  : 'Nenhum evento por aqui ainda.')}
            </Text>
          </View>
        }

        ListFooterComponent={
          carregandoMais ? (
            <ActivityIndicator
              style={styles.carregandoMais}
              color="#ff7a00"
            />
          ) : erro && eventos.length > 0 ? (
            <Text style={styles.erro}>{erro}</Text>
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
              Editar evento
            </Text>

            <Text style={styles.label}>
              Título
            </Text>

            <TextInput
              value={tituloEdicao}
              onChangeText={setTituloEdicao}
              placeholder="Título do evento"
              placeholderTextColor="#999"
              style={styles.input}
            />

            <Text style={styles.label}>
              Descrição
            </Text>

            <TextInput
              value={descricaoEdicao}
              onChangeText={setDescricaoEdicao}
              placeholder="Descrição do evento"
              placeholderTextColor="#999"
              style={[
                styles.input,
                styles.inputMultiline,
              ]}
              multiline
            />

            <Text style={styles.label}>
              Data e horário
            </Text>

            <TextInput
              value={dataEdicao}
              onChangeText={setDataEdicao}
              placeholder="AAAA-MM-DD HH:mm:ss"
              placeholderTextColor="#999"
              style={styles.input}
            />

            <Text style={styles.label}>
              Valor
            </Text>

            <TextInput
              value={valorEdicao}
              onChangeText={setValorEdicao}
              placeholder="0.00"
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
              style={styles.input}
            />

            <Text style={styles.modalAviso}>
              A imagem atual será mantida.
            </Text>

            <View style={styles.modalBotoes}>
              <Pressable
                style={styles.botaoCancelar}
                onPress={() =>
                  setModalEdicao(false)
                }
                disabled={salvandoEdicao}
              >
                <Text style={styles.textoBotaoCancelar}>
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
                  <Text style={styles.textoBotaoSalvar}>
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
  },

  carregandoMais: {
    marginVertical: 20,
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
    minHeight: 90,
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
    backgroundColor: '#ff7a00',
    minWidth: 100,
    alignItems: 'center',
  },

  textoBotaoSalvar: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
