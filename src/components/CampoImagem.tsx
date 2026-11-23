
import { Image, Pressable, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  uri: string | null;
  onChange: (uri: string) => void;
};

export default function CampoImagem({ uri, onChange }: Props) {
  async function escolher() {
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
      base64: false,
    });

    if (!resultado.canceled) {
      const arquivo = resultado.assets[0];

      console.log('IMAGEM:', {
        uri: arquivo.uri,
        mimeType: arquivo.mimeType,
        fileName: arquivo.fileName,
      });

      onChange(arquivo.uri);
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
  imagem: {
    width: '100%',
    height: '100%',
  },
});
