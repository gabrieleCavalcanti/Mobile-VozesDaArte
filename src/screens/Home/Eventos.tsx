import { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CardPublicacao, { Publicacao } from '../../components/CardPublicacao';

const EVENTOS_INICIAIS: Publicacao[] = [
  {
    id: '1',
    artista: 'NomeArtista',
    legenda: 'Descrição do evento aparece aqui.',
    curtido: true,
    favorito: true,
    data: '30 DE SETEMBRO DE 2026',
  },
  {
    id: '2',
    artista: 'NomeArtista',
    legenda: 'Outro evento de exemplo.',
    curtido: false,
    favorito: true,
    data: '15 DE OUTUBRO DE 2026',
  },
];

export default function Eventos() {
  const insets = useSafeAreaInsets();
  const [eventos, setEventos] = useState(EVENTOS_INICIAIS);

  function alternar(id: string, campo: 'curtido' | 'favorito') {
    setEventos((atual) =>
      atual.map((e) => (e.id === id ? { ...e, [campo]: !e[campo] } : e)),
    );
  }

  if (eventos.length === 0) {
    return (
      <View style={styles.vazio}>
        <Text style={styles.vazioTexto}>Nenhum evento por aqui ainda.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={eventos}
      keyExtractor={(e) => e.id}
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => (
        <CardPublicacao
          item={item}
          onCurtir={() => alternar(item.id, 'curtido')}
          onFavoritar={() => alternar(item.id, 'favorito')}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  vazio: { flex: 1, alignItems: 'center', paddingTop: 40 },
  vazioTexto: { color: '#888' },
});