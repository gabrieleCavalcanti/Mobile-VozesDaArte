import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type Publicacao = {
  id: string;
  artista: string;
  legenda: string;
  curtido: boolean;
  favorito: boolean;
  data?: string; // só os eventos têm
};

type Props = {
  item: Publicacao;
  onCurtir: () => void;
  onFavoritar: () => void;
};

export default function CardPublicacao({ item, onCurtir, onFavoritar }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.cardTopo}>
        <View style={styles.avatarPequeno} />
        <Text style={styles.nome}>{item.artista}</Text>
        <Pressable style={styles.estrela} onPress={onFavoritar}>
          <Ionicons
            name={item.favorito ? 'star' : 'star-outline'}
            size={28}
            color={item.favorito ? '#ffb800' : '#8a2a2a'}
          />
        </Pressable>
      </View>

      {/* Troque por <Image source={{ uri: ... }} /> quando tiver as artes */}
      <View style={styles.imagemPost}>
        <Ionicons name="image-outline" size={48} color="#fff" />
      </View>

      <View style={styles.acoes}>
        <Pressable onPress={onCurtir}>
          <Ionicons
            name={item.curtido ? 'heart' : 'heart-outline'}
            size={24}
            color="#d8212f"
          />
        </Pressable>
        {item.data && <Text style={styles.data}>{item.data}</Text>}
      </View>

      <View style={styles.legendaLinha}>
        <View style={styles.bolinha} />
        <Text style={styles.legenda}>{item.legenda}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    padding: 12,
    marginBottom: 16,
  },
  cardTopo: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatarPequeno: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#555',
    marginRight: 12,
  },
  nome: { color: '#fff', fontWeight: '700', fontSize: 14, flex: 1 },
  estrela: { position: 'absolute', right: 0, top: -4 },
  imagemPost: {
    height: 220,
    backgroundColor: '#ff6a00',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acoes: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  data: { color: '#bbb', fontSize: 11 },
  legendaLinha: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  bolinha: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#555',
    marginRight: 10,
  },
  legenda: { color: '#bbb', fontSize: 11, flex: 1 },
});