import { ReactElement, useState } from 'react';
import { FlatList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CardPublicacao, { Publicacao } from '../../components/CardPublicacao';

const POSTS_INICIAIS: Publicacao[] = [
  {
    id: '1',
    artista: 'NomeArtista',
    legenda: 'Legenda do post aparece aqui, falando sobre a obra.',
    curtido: true,
    favorito: true,
  },
  {
    id: '2',
    artista: 'NomeArtista',
    legenda: 'Outra legenda de exemplo para o segundo post.',
    curtido: false,
    favorito: false,
  },
];

type Props = {
  header?: ReactElement; // usado no perfil (banner no topo da lista)
  margemLateral?: number; // na Home o painel já tem margem, no perfil não
};

export default function Posts({ header, margemLateral = 0 }: Props) {
  const insets = useSafeAreaInsets();
  const [posts, setPosts] = useState(POSTS_INICIAIS);

  function alternar(id: string, campo: 'curtido' | 'favorito') {
    setPosts((atual) =>
      atual.map((p) => (p.id === id ? { ...p, [campo]: !p[campo] } : p)),
    );
  }

  return (
    <FlatList
      data={posts}
      keyExtractor={(p) => p.id}
      ListHeaderComponent={header}
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => (
        <View style={{ paddingHorizontal: margemLateral }}>
          <CardPublicacao
            item={item}
            onCurtir={() => alternar(item.id, 'curtido')}
            onFavoritar={() => alternar(item.id, 'favorito')}
          />
        </View>
      )}
    />
  );
}