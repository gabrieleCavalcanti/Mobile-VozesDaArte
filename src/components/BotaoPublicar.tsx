import { Pressable, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  onPress: () => void;
  desabilitado?: boolean;
};

export default function BotaoPublicar({ onPress, desabilitado }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={desabilitado}
      style={[styles.botao, desabilitado && styles.desabilitado]}
    >
      <LinearGradient
        colors={['#ff7a00', '#ff9a00']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.degrade}
      >
        <Ionicons name="document-text-outline" size={20} color="#fff" />
        <Text style={styles.texto}>PUBLICAR</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  botao: { borderRadius: 22, overflow: 'hidden', alignSelf: 'flex-start' },
  desabilitado: { opacity: 0.4 },
  degrade: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 40,
  },
  texto: { color: '#fff', fontWeight: '800', fontSize: 13 },
});
