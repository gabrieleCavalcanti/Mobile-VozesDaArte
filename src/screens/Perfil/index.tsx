import {
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../routes/types';
import Posts from '../Home/Posts';

type Props = NativeStackScreenProps<RootStackParamList, 'Perfil'>;

const NOTA = 3; // de 0 a 5

const fundo = require('../../assets/fundoPerfil.jpg');

export default function Perfil({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  const cabecalho = (
    <View>
      {/* Banner com a arte de fundo */}
      <ImageBackground
        source={fundo}
        resizeMode="cover"
        style={[styles.banner, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.bannerTopo}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
            <Ionicons name="close" size={30} color="#000" />
          </Pressable>
          <Pressable
            onPress={() => {
              // TODO: editar perfil
            }}
            hitSlop={12}
          >
            <Ionicons name="pencil" size={24} color="#000" />
          </Pressable>
        </View>

        <View style={styles.bannerInfo}>
          <View style={styles.avatar} />
          <View>
            <Text style={styles.nome}>Artista</Text>
            <Text style={styles.email}>usuario@gmail.com</Text>
            <View style={styles.estrelas}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Ionicons
                  key={n}
                  name="star"
                  size={16}
                  color={n <= NOTA ? '#000' : '#8a8a8a'}
                />
              ))}
            </View>
          </View>
        </View>

        <Pressable
          style={styles.botaoMais}
          onPress={() => {
            // TODO: criar novo post/evento
          }}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </Pressable>
      </ImageBackground>

      <Text style={styles.bio}>
        Biografia do artista aparece aqui, falando sobre o trabalho dele.
      </Text>
    </View>
  );

  return (
    <View style={styles.tela}>
      <Posts header={cabecalho} margemLateral={16} />
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#000' },
  banner: {
    paddingHorizontal: 16,
    paddingBottom: 24,
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
    marginTop: 8,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#555',
  },
  nome: { color: '#000', fontSize: 20, fontWeight: '800' },
  email: { color: '#000', fontSize: 12 },
  estrelas: { flexDirection: 'row', gap: 2, marginTop: 4 },
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
  bio: {
    color: '#bbb',
    fontSize: 11,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
});