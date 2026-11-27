
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
  destacado?: boolean;
};

type Props = {
  item: Publicacao;
  onCurtir?: () => void;
  onFavoritar: () => void;
  onAbrirPerfil: (id_artista: number) => void;
  mostrarCurtida?: boolean;
  mostrarFavorito?: boolean;
  mostrarGerenciamento?: boolean;
  arquivado?: boolean;
  onEditar?: () => void;
  onArquivar?: () => void;
  onDesarquivar?: () => void;
  mostrarDestacar?: boolean;
  onDestacar?: () => void;
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
  if (
    valor === undefined ||
    valor === null ||
    valor === ''
  ) {
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
  mostrarFavorito = true,
  mostrarGerenciamento = false,
  arquivado = false,
  onEditar,
  onArquivar,
  onDesarquivar,
  mostrarDestacar = false,
  onDestacar,
}: Props) {
  const localizacao = [item.cidade, item.estado]
    .filter(Boolean)
    .join(' - ');

  const valorFormatado = formatarValor(item.valor);

  const ehDono = mostrarGerenciamento;

  return (
    <View
      style={[
        styles.card,
        arquivado && styles.cardArquivado,
      ]}
    >
      {/* STATUS DE ARQUIVAMENTO */}
      {ehDono && arquivado && (
        <View style={styles.faixaArquivada}>
          <View style={styles.statusArquivado}>
            <Ionicons
              name="archive"
              size={14}
              color="#FF7777"
            />

            <Text style={styles.textoArquivado}>
              ARQUIVADA
            </Text>
          </View>

          <Text style={styles.textoStatus}>
            Visível somente para você
          </Text>
        </View>
      )}

      {/* CABEÇALHO */}
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
              <Ionicons
                name="person"
                size={22}
                color="#aaa"
              />
            </View>
          )}

          <View style={styles.identificacao}>
            <Text
              style={styles.nome}
              numberOfLines={1}
            >
              {item.artista}
            </Text>

            {!!item.categoria && (
              <Text style={styles.categoria}>
                {item.categoria}
              </Text>
            )}
          </View>
        </Pressable>

        {/* AÇÕES */}
        <View style={styles.acoesTopo}>
          {/* FAVORITAR */}
          {mostrarFavorito && !ehDono && (
            <Pressable
              style={styles.botaoAcao}
              onPress={onFavoritar}
              hitSlop={6}
              accessibilityLabel={
                item.favorito
                  ? 'Remover dos favoritos'
                  : 'Favoritar artista'
              }
            >
              <Ionicons
                name={
                  item.favorito
                    ? 'star'
                    : 'star-outline'
                }
                size={19}
                color={
                  item.favorito
                    ? '#FFB800'
                    : '#BDBDBD'
                }
              />
            </Pressable>
          )}

          {/* GERENCIAMENTO DO DONO */}
          {ehDono && !arquivado && (
            <>
              {mostrarDestacar && (
                <Pressable
                  style={[
                    styles.botaoAcao,
                    item.destacado &&
                      styles.botaoDestaqueAtivo,
                  ]}
                  onPress={onDestacar}
                  hitSlop={6}
                  accessibilityLabel={
                    item.destacado
                      ? 'Remover destaque'
                      : 'Destacar publicação'
                  }
                >
                  <Ionicons
                    name={
                      item.destacado
                        ? 'star'
                        : 'star-outline'
                    }
                    size={19}
                    color={
                      item.destacado
                        ? '#FFB800'
                        : '#BDBDBD'
                    }
                  />
                </Pressable>
              )}

              <Pressable
                style={styles.botaoAcao}
                onPress={onEditar}
                hitSlop={6}
                accessibilityLabel="Editar publicação"
              >
                <Ionicons
                  name="create-outline"
                  size={19}
                  color="#E30613"
                />
              </Pressable>

              <Pressable
                style={[
                  styles.botaoAcao,
                  styles.botaoArquivar,
                ]}
                onPress={onArquivar}
                hitSlop={6}
                accessibilityLabel="Arquivar publicação"
              >
                <Ionicons
                  name="archive-outline"
                  size={19}
                  color="#FF7777"
                />
              </Pressable>
            </>
          )}

          {/* RESTAURAR */}
          {ehDono && arquivado && (
            <Pressable
              style={styles.botaoRestaurar}
              onPress={onDesarquivar}
              hitSlop={6}
              accessibilityLabel="Restaurar publicação"
            >
              <Ionicons
                name="arrow-undo"
                size={18}
                color="#fff"
              />

              <Text style={styles.textoRestaurar}>
                Restaurar
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* DESTAQUE */}
      {item.destacado && !arquivado && (
        <View style={styles.indicadorDestaque}>
          <Ionicons
            name="star"
            size={13}
            color="#FFB800"
          />

          <Text style={styles.textoDestaque}>
            Em destaque
          </Text>
        </View>
      )}

      {/* TÍTULO */}
      {!!item.titulo && (
        <Text style={styles.titulo}>
          {item.titulo}
        </Text>
      )}

      {/* IMAGEM */}
      {item.imagem ? (
        <Image
          source={{ uri: item.imagem }}
          style={[
            styles.imagemPost,
            arquivado && styles.imagemArquivada,
          ]}
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

      {/* CURTIDA E DATA */}
      <View style={styles.acoes}>
        {mostrarCurtida && !arquivado ? (
          <Pressable
            onPress={onCurtir}
            hitSlop={10}
            accessibilityLabel={
              item.curtido ? 'Descurtir' : 'Curtir'
            }
          >
            <Ionicons
              name={
                item.curtido
                  ? 'heart'
                  : 'heart-outline'
              }
              size={25}
              color="#E30613"
            />
          </Pressable>
        ) : (
          <View />
        )}

        {!!item.data && (
          <Text style={styles.data}>
            {formatarData(item.data)}
          </Text>
        )}
      </View>

      {/* LEGENDA */}
      {!!item.legenda && (
        <Text style={styles.legenda}>
          {item.legenda}
        </Text>
      )}

      {/* VALOR */}
      {valorFormatado && (
        <View style={styles.informacaoContainer}>
          <Ionicons
            name="cash-outline"
            size={16}
            color="#ACCCB1"
          />

          <Text style={styles.informacao}>
            {valorFormatado}
          </Text>
        </View>
      )}

      {/* LOCALIZAÇÃO */}
      {!!localizacao && (
        <View style={styles.localizacao}>
          <Ionicons
            name="location-outline"
            size={16}
            color="#E30613"
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
    borderWidth: 1,
    borderColor: 'transparent',
  },

  cardArquivado: {
    backgroundColor: '#242424',
    borderColor: '#633333',
  },

  faixaArquivada: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#493030',
  },

  statusArquivado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#3B2525',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 7,
  },

  textoArquivado: {
    color: '#FF7777',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },

  textoStatus: {
    color: '#888',
    fontSize: 10,
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
    minWidth: 0,
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#444',
  },

  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#444',
    alignItems: 'center',
    justifyContent: 'center',
  },

  identificacao: {
    flex: 1,
    marginLeft: 9,
    minWidth: 0,
  },

  nome: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },

  categoria: {
    color: '#aaa',
    fontSize: 11,
    marginTop: 3,
  },

  acoesTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginLeft: 5,
  },

  botaoAcao: {
    width: 31,
    height: 31,
    borderRadius: 9,
    backgroundColor: '#353535',
    alignItems: 'center',
    justifyContent: 'center',
  },

  botaoDestaqueAtivo: {
    backgroundColor: '#453B27',
    borderWidth: 1,
    borderColor: '#927222',
  },

  botaoArquivar: {
    backgroundColor: '#3A2929',
  },

  botaoRestaurar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 11,
    height: 33,
    borderRadius: 9,
    backgroundColor: '#247A45',
  },

  textoRestaurar: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },

  indicadorDestaque: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 8,
  },

  textoDestaque: {
    color: '#FFB800',
    fontSize: 12,
    fontWeight: '600',
  },

  titulo: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },

  imagemPost: {
    width: '100%',
    height: 230,
    borderRadius: 10,
    backgroundColor: '#444',
  },

  imagemArquivada: {
    borderWidth: 1,
    borderColor: '#493030',
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
    fontSize: 11,
  },

  legenda: {
    color: '#eee',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 8,
  },

  informacaoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 5,
  },

  informacao: {
    color: '#ACCCB1',
    fontSize: 13,
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
