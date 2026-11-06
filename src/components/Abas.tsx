import { Pressable, StyleSheet, Text, View } from 'react-native';

type Opcao<T> = { valor: T; rotulo: string };

type Props<T extends string> = {
  opcoes: Opcao<T>[];
  atual: T;
  onChange: (valor: T) => void;
};

export default function Abas<T extends string>({
  opcoes,
  atual,
  onChange,
}: Props<T>) {
  return (
    <View style={styles.abas}>
      {opcoes.map((o) => (
        <Pressable
          key={o.valor}
          style={[styles.aba, atual === o.valor && styles.abaAtiva]}
          onPress={() => onChange(o.valor)}
        >
          <Text style={styles.texto}>{o.rotulo}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  abas: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: '#111',
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
  },
  aba: { paddingVertical: 8, paddingHorizontal: 36 },
  abaAtiva: { backgroundColor: '#e30613', borderRadius: 20 },
  texto: { color: '#fff', fontSize: 11, fontWeight: '700' },
});