import { Image, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

type Props = {
  uri: string | null;
  onChange: (uri: string) => void;
};

export default function CampoImagem({ uri, onChange }: Props) {
  async function escolher() {
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!resultado.canceled) {
      onChange(resultado.assets[0].uri);
    }
  }

  return (
    <Pressable style={styles.caixa} onPress={escolher}>
      {uri ? (
        <Image source={{ uri }} style={styles.imagem} resizeMode="cover" />
      ) : (
        <Ionicons name="image-outline" size={90} color="#ff7a00" />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  caixa: {
    height: 220,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#181818',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 16,
  },
  imagem: { width: '100%', height: '100%' },
});