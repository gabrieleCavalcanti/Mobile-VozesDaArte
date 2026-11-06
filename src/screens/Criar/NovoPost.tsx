import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import CampoImagem from '../../components/CampoImagem';
import BotaoPublicar from '../../components/BotaoPublicar';

const LIMITE = 50;

type Props = {
  onPublicado: () => void;
};

export default function NovoPost({ onPublicado }: Props) {
  const [imagem, setImagem] = useState<string | null>(null);
  const [legenda, setLegenda] = useState('');

  const podePublicar = imagem !== null && legenda.trim().length > 0;

  function publicar() {
    // TODO: enviar { imagem, legenda } para o backend
    onPublicado();
  }

  return (
    <View>
      <CampoImagem uri={imagem} onChange={setImagem} />

      <View style={styles.campo}>
        <TextInput
          style={styles.input}
          value={legenda}
          onChangeText={setLegenda}
          maxLength={LIMITE}
          placeholder="Escreva o que está pensando aqui."
          placeholderTextColor="#999"
        />
        <Text style={styles.contador}>
          {legenda.length}/{LIMITE}
        </Text>
      </View>

      <BotaoPublicar onPress={publicar} desabilitado={!podePublicar} />
    </View>
  );
}

const styles = StyleSheet.create({
  campo: {
    backgroundColor: '#181818',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 22,
    marginBottom: 16,
  },
  input: { color: '#fff', fontSize: 14 },
  contador: {
    position: 'absolute',
    right: 14,
    bottom: 6,
    color: '#bbb',
    fontSize: 9,
  },
});