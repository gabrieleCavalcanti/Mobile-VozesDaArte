import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type Opcao<T> = {
  valor: T;
  rotulo: string;
};

type Props<T extends string> = {
  opcoes: Opcao<T>[];
  atual: T;
  onChange: (valor: T) => void;
  variante?: 'padrao' | 'perfil';
};

export default function Abas<T extends string>({
  opcoes,
  atual,
  onChange,
  variante = 'padrao',
}: Props<T>) {
  const perfil = variante === 'perfil';

  return (
    <View
      style={[
        styles.container,
        perfil && styles.containerPerfil,
      ]}
    >
      <View
        style={[
          styles.abas,
          perfil && styles.abasPerfil,
        ]}
      >
        {opcoes.map((opcao) => {
          const ativa = atual === opcao.valor;

          return (
            <Pressable
              key={opcao.valor}
              style={[
                styles.aba,
                perfil && styles.abaPerfil,
                ativa && styles.abaAtiva,
              ]}
              onPress={() => onChange(opcao.valor)}
            >
              <Text
                style={[
                  styles.texto,
                  perfil && styles.textoPerfil,
                  ativa && styles.textoAtivo,
                ]}
              >
                {opcao.rotulo}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },

  abas: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: '#111',
    borderRadius: 20,
    overflow: 'hidden',
  },

  aba: {
    paddingVertical: 8,
    paddingHorizontal: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  abaAtiva: {
    backgroundColor: '#E30613',
    borderRadius: 20,
  },

  texto: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },

  textoAtivo: {
    color: '#fff',
  },

  // ESTILOS EXCLUSIVOS DO PERFIL
  containerPerfil: {
    width: '100%',
    marginBottom: 12,
    alignSelf: 'stretch',
    paddingHorizontal: 0,
  },

  abasPerfil: {
    width: '100%',
    backgroundColor: '#1B1B1B',
    padding: 4,
    borderRadius: 14,
  },

  abaPerfil: {
    flex: 1,
    paddingVertical: 11,
    paddingHorizontal: 4,
    borderRadius: 11,
  },

  textoPerfil: {
    fontSize: 11,
    letterSpacing: 0.4,
    color: '#999',
  },
});