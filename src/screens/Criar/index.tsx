import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../routes/types';
import Abas from '../../components/Abas';
import NovoPost from './NovoPost';
import NovoEvento from './NovoEvento';

type Props = NativeStackScreenProps<RootStackParamList, 'Criar'>;

type Aba = 'eventos' | 'posts';

const OPCOES: { valor: Aba; rotulo: string }[] = [
  { valor: 'eventos', rotulo: 'EVENTOS' },
  { valor: 'posts', rotulo: 'POSTS' },
];

export default function Criar({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [aba, setAba] = useState<Aba>('posts');

  function fechar() {
    navigation.goBack();
  }

  return (
    <View style={[styles.tela, { paddingTop: insets.top + 8 }]}>
      <View style={styles.painel}>
        <Abas opcoes={OPCOES} atual={aba} onChange={setAba} />

        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {aba === 'posts' ? (
            <NovoPost onPublicado={fechar} />
          ) : (
            <NovoEvento onPublicado={fechar} />
          )}
        </ScrollView>
      </View>

      <Pressable
        style={[styles.fechar, { paddingBottom: insets.bottom + 16 }]}
        onPress={fechar}
      >
        <Text style={styles.fecharTexto}>FECHAR</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#000' },
  painel: {
    flex: 1,
    backgroundColor: '#1f1f1f',
    borderRadius: 36,
    paddingTop: 20,
    paddingHorizontal: 16,
    marginHorizontal: 8,
  },
  fechar: { alignItems: 'center', paddingTop: 16 },
  fecharTexto: { color: '#ff3d0a', fontSize: 12, fontWeight: '800' },
});