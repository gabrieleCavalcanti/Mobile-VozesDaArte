
import { useEffect, useState } from 'react';

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
  destaque?: boolean | number;
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
};

function montarImagem(nomeArquivo?: string | null): string | undefined {
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
    artista: nomeArtista || evento.nome_artista || 'Artista',
    titulo: evento.titulo || '',
    legenda: evento.descricao || '',
    imagem: montarImagem(evento.url_img),
    avatar: avatarArtista || montarImagem(evento.url_foto_perfil),
    data: evento.data_hora,
    valor: evento.valor,
    cidade: evento.endereco_cidade,
    estado: evento.endereco_estado,
    curtido: false,
    favorito: false,
  };
}

export default function Eventos({
  onAbrirPerfil,
  idArtista,
  nomeArtista,
  avatarArtista,
}: Props) {
  const insets = useSafeAreaInsets();

  const [eventos, setEventos] = useState<Publicacao[]>([]);
  const [pagina, setPagina] = useState(1);
  const [temMais, setTemMais] = useState(false);

  const [carregando, setCarregando] = useState(true);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState('');

  async function carregarEstadosFavoritos(
    eventosCarregados: Publicacao[],
  ) {
    const artistas = [
      ...new Set(
        eventosCarregados.map((evento) => evento.id_artista),
      ),
    ];

    const estados = await Promise.all(
      artistas.map(async (id_artista) => {
        try {
          const resposta = await apiGet<RespostaFavorito>(
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
          (estado) => estado.id_artista === evento.id_artista,
        )?.favorito ?? false,
    }));
  }

  async function buscarEventos(
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
      let novosEventos: Publicacao[];

      if (idArtista !== undefined) {
        // Perfil: busca somente os eventos deste artista.
        const resposta = await apiGet<EventoAPI[]>(
          `/eventos/artista/${idArtista}`,
        );

        novosEventos = [...resposta]
          .sort(
            (a, b) =>
              Number(b.destaque) - Number(a.destaque),
          )
          .map((evento) =>
            converterEvento(evento, nomeArtista, avatarArtista),
          );

        setPagina(1);
        setTemMais(false);
      } else {
        // Home: mantém o feed geral paginado.
        const resposta = await apiGet<RespostaFeed>(
          `/eventos/feed?pagina=${paginaSolicitada}`,
        );

        novosEventos = resposta.dados.map((evento) =>
          converterEvento(evento),
        );

        setPagina(resposta.pagina);
        setTemMais(resposta.temMais);
      }

      const eventosComFavoritos =
        await carregarEstadosFavoritos(novosEventos);

      setEventos((atuais) =>
        substituir || idArtista !== undefined
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

  useEffect(() => {
    buscarEventos(1, true);
  }, [idArtista, nomeArtista, avatarArtista]);

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

  function atualizar() {
    setAtualizando(true);
    buscarEventos(1, true);
  }

  async function alternarFavorito(evento: Publicacao) {
    const favoritoAnterior = evento.favorito;

    setEventos((atuais) =>
      atuais.map((item) =>
        item.id_artista === evento.id_artista
          ? { ...item, favorito: !favoritoAnterior }
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
            ? { ...item, favorito: favoritoAnterior }
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

  if (carregando && eventos.length === 0) {
    return (
      <View style={styles.centralizado}>
        <ActivityIndicator size="large" color="#ff7a00" />
        <Text style={styles.textoAuxiliar}>
          Carregando eventos...
        </Text>
      </View>
    );
  }

  return (
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
        idArtista === undefined ? carregarMais : undefined
      }
      onEndReachedThreshold={0.4}
      renderItem={({ item }) => (
        <CardPublicacao
          item={item}
          mostrarCurtida={false}
          onFavoritar={() => alternarFavorito(item)}
          onAbrirPerfil={(id_artista) =>
            onAbrirPerfil?.(id_artista)
          }
        />
      )}
      ListEmptyComponent={
        <View style={styles.centralizado}>
          <Text style={styles.textoAuxiliar}>
            {erro || 'Nenhum evento por aqui ainda.'}
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
