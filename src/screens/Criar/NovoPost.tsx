
import { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { File } from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

import CampoImagem from '../../components/CampoImagem';
import BotaoPublicar from '../../components/BotaoPublicar';
import { apiGet, apiPostFormData } from '../../api/api';

const LIMITE_TITULO = 150;
const LIMITE_DESCRICAO = 3000;

type Props = {
  onPublicado: () => void;
};

type Categoria = {
  id_categoria: number;
  nome_categoria: string;
};

type RespostaPost = {
  message?: string;
  mensagem?: string;
  id_post?: number;
};

export default function NovoPost({ onPublicado }: Props) {
  const [imagem, setImagem] = useState<string | null>(null);

  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaSelecionada, setCategoriaSelecionada] =
    useState<Categoria | null>(null);

  const [modalCategorias, setModalCategorias] = useState(false);
  const [carregandoCategorias, setCarregandoCategorias] = useState(true);
  const [publicando, setPublicando] = useState(false);

  // Buscar categorias
  useEffect(() => {
    async function carregarCategorias() {
      try {
        const resultado = await apiGet<Categoria[]>('/categorias');
        setCategorias(resultado);
      } catch (error) {
        Alert.alert(
          'Erro',
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar as categorias.'
        );
      } finally {
        setCarregandoCategorias(false);
      }
    }

    carregarCategorias();
  }, []);

  // Selecionar imagem
  function selecionarImagem(uri: string) {
    setImagem(uri);
  }

  const podePublicar =
    imagem !== null &&
    titulo.trim().length >= 2 &&
    descricao.trim().length > 0 &&
    categoriaSelecionada !== null &&
    !publicando;

  // Publicar post
  async function publicar() {
    if (!podePublicar || !imagem || !categoriaSelecionada) {
      return;
    }

    try {
      setPublicando(true);

      // Converter a imagem selecionada para JPEG
      const imagemConvertida = await ImageManipulator.manipulateAsync(
        imagem,
        [],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      // Criar arquivo JPEG
      const arquivo = new File(imagemConvertida.uri);

      const formData = new FormData();

      formData.append(
        'id_categoria',
        String(categoriaSelecionada.id_categoria)
      );

      formData.append('titulo', titulo.trim());
      formData.append('descricao', descricao.trim());

      // O campo precisa ter o mesmo nome esperado pelo Multer: image
      formData.append('image', arquivo);

      const resposta = await apiPostFormData<RespostaPost>(
        '/posts',
        formData
      );

      Alert.alert(
        'Sucesso!',
        resposta.message ||
          resposta.mensagem ||
          'Post publicado com sucesso!'
      );

      onPublicado();
    } catch (error) {
      Alert.alert(
        'Erro ao publicar',
        error instanceof Error
          ? error.message
          : 'Não foi possível publicar o post.'
      );
    } finally {
      setPublicando(false);
    }
  }

  return (
    <View>
      <CampoImagem uri={imagem} onChange={selecionarImagem} />

      {/* TÍTULO */}
      <View style={styles.campo}>
        <TextInput
          style={styles.input}
          value={titulo}
          onChangeText={setTitulo}
          maxLength={LIMITE_TITULO}
          placeholder="Título da publicação"
          placeholderTextColor="#999"
        />

        <Text style={styles.contador}>
          {titulo.length}/{LIMITE_TITULO}
        </Text>
      </View>

      {/* DESCRIÇÃO */}
      <View style={styles.campoDescricao}>
        <TextInput
          style={styles.inputDescricao}
          value={descricao}
          onChangeText={setDescricao}
          maxLength={LIMITE_DESCRICAO}
          multiline
          textAlignVertical="top"
          placeholder="Escreva sobre sua publicação..."
          placeholderTextColor="#999"
        />

        <Text style={styles.contador}>
          {descricao.length}/{LIMITE_DESCRICAO}
        </Text>
      </View>

      {/* SELEÇÃO DE CATEGORIA */}
      <View style={styles.areaCategorias}>
        <Text style={styles.label}>Categoria da publicação</Text>

        <Pressable
          style={styles.seletor}
          onPress={() => setModalCategorias(true)}
          disabled={carregandoCategorias || categorias.length === 0}
        >
          <Text
            style={[
              styles.textoSeletor,
              !categoriaSelecionada && styles.placeholder,
            ]}
          >
            {carregandoCategorias
              ? 'Carregando categorias...'
              : categoriaSelecionada?.nome_categoria ||
                'Selecione uma categoria'}
          </Text>

          <Text style={styles.seta}>⌄</Text>
        </Pressable>

        {carregandoCategorias && (
          <ActivityIndicator
            color="#ff7a00"
            style={styles.carregandoCategorias}
          />
        )}

        {!carregandoCategorias && categorias.length === 0 && (
          <Text style={styles.aviso}>
            Nenhuma categoria encontrada.
          </Text>
        )}
      </View>

      {/* MODAL DE CATEGORIAS */}
      <Modal
        visible={modalCategorias}
        transparent
        animationType="fade"
        onRequestClose={() => setModalCategorias(false)}
      >
        <Pressable
          style={styles.fundoModal}
          onPress={() => setModalCategorias(false)}
        >
          <Pressable
            style={styles.conteudoModal}
            onPress={() => {}}
          >
            <Text style={styles.tituloModal}>
              Escolha uma categoria
            </Text>

            <ScrollView style={styles.listaModal}>
              {categorias.map((categoria) => {
                const selecionada =
                  categoriaSelecionada?.id_categoria ===
                  categoria.id_categoria;

                return (
                  <Pressable
                    key={categoria.id_categoria}
                    style={[
                      styles.itemCategoria,
                      selecionada && styles.itemSelecionado,
                    ]}
                    onPress={() => {
                      setCategoriaSelecionada(categoria);
                      setModalCategorias(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.textoItem,
                        selecionada && styles.textoItemSelecionado,
                      ]}
                    >
                      {categoria.nome_categoria}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Pressable
              style={styles.botaoFechar}
              onPress={() => setModalCategorias(false)}
            >
              <Text style={styles.textoFechar}>FECHAR</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* BOTÃO PUBLICAR */}
      <View style={styles.areaBotao}>
        <BotaoPublicar
          onPress={publicar}
          desabilitado={!podePublicar}
        />

        {publicando && (
          <ActivityIndicator
            color="#ff7a00"
            style={styles.carregando}
          />
        )}
      </View>
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

  input: {
    color: '#fff',
    fontSize: 14,
  },

  campoDescricao: {
    backgroundColor: '#181818',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 28,
    minHeight: 120,
    marginBottom: 16,
  },

  inputDescricao: {
    color: '#fff',
    fontSize: 14,
    minHeight: 80,
  },

  contador: {
    position: 'absolute',
    right: 14,
    bottom: 6,
    color: '#bbb',
    fontSize: 9,
  },

  areaCategorias: {
    marginBottom: 20,
  },

  label: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },

  seletor: {
    backgroundColor: '#181818',
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  textoSeletor: {
    color: '#fff',
    fontSize: 13,
  },

  placeholder: {
    color: '#999',
  },

  seta: {
    color: '#ff7a00',
    fontSize: 22,
  },

  carregandoCategorias: {
    marginTop: 10,
  },

  aviso: {
    color: '#bbb',
    fontSize: 12,
    marginTop: 8,
  },

  fundoModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    padding: 24,
  },

  conteudoModal: {
    backgroundColor: '#181818',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#444',
    padding: 20,
    maxHeight: '75%',
  },

  tituloModal: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 16,
  },

  listaModal: {
    flexGrow: 0,
  },

  itemCategoria: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    borderRadius: 10,
  },

  itemSelecionado: {
    backgroundColor: '#392313',
  },

  textoItem: {
    color: '#ddd',
    fontSize: 14,
  },

  textoItemSelecionado: {
    color: '#ff9a00',
    fontWeight: '700',
  },

  botaoFechar: {
    alignSelf: 'flex-end',
    marginTop: 16,
    padding: 8,
  },

  textoFechar: {
    color: '#ff9a00',
    fontWeight: '700',
  },

  areaBotao: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  carregando: {
    marginLeft: 12,
  },
});
