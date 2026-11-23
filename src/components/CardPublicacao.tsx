
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

export type Publicacao = {
  id: string;
  id_artista: number;
  artista: string;
  titulo?: string;
  legenda: string;
  imagem?: string;
  avatar?: string;
  categoria?: string;
  data?: string;
  valor?: string | number;
  cidade?: string | null;
  estado?: string | null;
  curtido: boolean;
  favorito: boolean;
};

type Props = {
  item: Publicacao;
  onCurtir?: () => void;
  onFavoritar: () => void;
  onAbrirPerfil: (id_artista: number) => void;
  mostrarCurtida?: boolean;
};

function formatarData(data?: string) {
  if (!data) return '';

  const dataConvertida = new Date(data);

  if (Number.isNaN(dataConvertida.getTime())) {
    return '';
  }

  return dataConvertida.toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function formatarValor(valor?: string | number) {
  if (valor === undefined || valor === null || valor === '') {
    return null;
  }

  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    return String(valor);
  }

  return numero.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export default function CardPublicacao({
  item,
  onCurtir,
  onFavoritar,
  onAbrirPerfil,
  mostrarCurtida = true,
}: Props) {
  const localizacao = [item.cidade, item.estado]
    .filter(Boolean)
    .join(' - ');

  const valorFormatado = formatarValor(item.valor);

  return (
    <View style={styles.card}>
      <View style={styles.cardTopo}>
        <Pressable
          style={styles.perfilArtista}
          onPress={() => onAbrirPerfil(item.id_artista)}
        >
          {item.avatar ? (
            <Image
              source={{ uri: item.avatar }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={22} color="#aaa" />
            </View>
          )}

          <View style={styles.identificacao}>
            <Text style={styles.nome} numberOfLines={1}>
              {item.artista}
            </Text>

            {!!item.categoria && (
              <Text style={styles.categoria}>
                {item.categoria}
              </Text>
            )}
          </View>
        </Pressable>

        <Pressable
          style={styles.estrela}
          onPress={onFavoritar}
          hitSlop={10}
        >
          <Ionicons
            name={item.favorito ? 'star' : 'star-outline'}
            size={27}
            color={item.favorito ? '#ffb800' : '#8a2a2a'}
          />
        </Pressable>
      </View>

      {!!item.titulo && (
        <Text style={styles.titulo}>
          {item.titulo}
        </Text>
      )}

      {item.imagem ? (
        <Image
          source={{ uri: item.imagem }}
          style={styles.imagemPost}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.imagemPlaceholder}>
          <Ionicons
            name="image-outline"
            size={48}
            color="#888"
          />
          <Text style={styles.semImagem}>
            Imagem não disponível
          </Text>
        </View>
      )}

      <View style={styles.acoes}>
        {mostrarCurtida && (
          <Pressable onPress={onCurtir} hitSlop={10}>
            <Ionicons
              name={item.curtido ? 'heart' : 'heart-outline'}
              size={26}
              color="#d8212f"
            />
          </Pressable>
        )}

        {!!item.data && (
          <Text style={styles.data}>
            {formatarData(item.data)}
          </Text>
        )}
      </View>

      {!!item.legenda && (
        <Text style={styles.legenda}>
          {item.legenda}
        </Text>
      )}

      {valorFormatado && (
        <Text style={styles.informacao}>
          <Ionicons name="cash-outline" size={15} />
          {' '}{valorFormatado}
        </Text>
      )}

      {!!localizacao && (
        <View style={styles.localizacao}>
          <Ionicons
            name="location-outline"
            size={16}
            color="#ff9a00"
          />
          <Text style={styles.textoLocalizacao}>
            {localizacao}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#292929',
    borderRadius: 16,
    marginBottom: 18,
    padding: 12,
    overflow: 'hidden',
  },

  cardTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  perfilArtista: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#444',
  },

  avatarPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#444',
    alignItems: 'center',
    justifyContent: 'center',
  },

  identificacao: {
    flex: 1,
    marginLeft: 10,
  },

  nome: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },

  categoria: {
    color: '#aaa',
    fontSize: 11,
    marginTop: 3,
  },

  estrela: {
    padding: 4,
  },

  titulo: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 10,
  },

  imagemPost: {
    width: '100%',
    height: 230,
    borderRadius: 10,
    backgroundColor: '#444',
  },

  imagemPlaceholder: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    backgroundColor: '#383838',
    alignItems: 'center',
    justifyContent: 'center',
  },

  semImagem: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 8,
  },

  acoes: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 10,
  },

  data: {
    color: '#aaa',
    fontSize: 12,
  },

  legenda: {
    color: '#eee',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 8,
  },

  informacao: {
    color: '#ACCCB1',
    fontSize: 13,
    marginTop: 4,
  },

  localizacao: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },

  textoLocalizacao: {
    color: '#aaa',
    fontSize: 12,
    marginLeft: 4,
  },
});
