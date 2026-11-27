
import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";

import { useAuth } from "../../context/AuthContext";

import BASE_URL, {
  apiGet,
  apiPut,
  apiPutFormData,
  apiPost,
  apiDelete,
} from "../../api/api";

import { File } from "expo-file-system";

import Endereco from "../../components/Endereco";

// PROPS
type Props = {
  onAbrirPerfil?: (id_artista: number) => void;
};

type UsuarioAPI = {
  id_usuario: number;
  nome: string;
  username?: string;
  email: string;
  url_foto_perfil: string | null;
};

type CategoriaAPI = {
  id_categoria: number;
  nome_categoria: string;
};

type ArtistaFavorito = {
  id_artista: number;
  nome: string;
  username?: string;
  foto?: string | null;
};

function montarImagem(nomeArquivo?: string | null) {
  if (!nomeArquivo) return undefined;

  if (nomeArquivo.startsWith("http")) {
    return nomeArquivo;
  }

  return `${BASE_URL}/images/${nomeArquivo}`;
}

export default function PerfilUsuario({
  onAbrirPerfil,
}: Props) {
  const insets = useSafeAreaInsets();
  const { usuario } = useAuth();

  const [dados, setDados] = useState<UsuarioAPI | null>(null);
  const [carregando, setCarregando] = useState(true);

  const [modalEdicao, setModalEdicao] = useState(false);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");

  const [salvando, setSalvando] = useState(false);
  const [enviandoFoto, setEnviandoFoto] = useState(false);

  // CATEGORIAS
  const [categorias, setCategorias] = useState<CategoriaAPI[]>([]);
  const [interesses, setInteresses] = useState<number[]>([]);
  const [modalCategorias, setModalCategorias] = useState(false);
  const [carregandoCategorias, setCarregandoCategorias] =
    useState(false);
  const [alterandoCategoria, setAlterandoCategoria] =
    useState<number | null>(null);

  // FAVORITOS
  const [favoritos, setFavoritos] = useState<ArtistaFavorito[]>([]);
  const [modalFavoritos, setModalFavoritos] = useState(false);
  const [carregandoFavoritos, setCarregandoFavoritos] =
    useState(false);
  const [alterandoFavorito, setAlterandoFavorito] =
    useState<number | null>(null);

  useEffect(() => {
    carregarUsuario();
  }, []);

  // CARREGAR USUARIO
  async function carregarUsuario() {
    try {
      setCarregando(true);

      if (!usuario?.id_usuario) {
        throw new Error("Usuário não encontrado.");
      }

      const resposta = await apiGet<UsuarioAPI>(
        `/usuarios/${usuario.id_usuario}`,
      );

      setDados(resposta);
    } catch (error) {
      Alert.alert(
        "Erro",
        error instanceof Error
          ? error.message
          : "Não foi possível carregar o perfil.",
      );
    } finally {
      setCarregando(false);
    }
  }

  // EDITAR DADOS
  function abrirEdicao() {
    if (!dados) return;

    setNome(dados.nome || "");
    setEmail(dados.email || "");
    setUsername(dados.username || "");

    setModalEdicao(true);
  }

  async function salvarEdicao() {
    if (!dados) return;

    if (!nome.trim() || !email.trim() || !username.trim()) {
      Alert.alert("Atenção", "Preencha todos os campos.");
      return;
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      Alert.alert("Atenção", "Digite um e-mail válido.");
      return;
    }

    try {
      setSalvando(true);

      await apiPut(`/usuarios/${dados.id_usuario}`, {
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        username: username.trim(),
      });

      setDados((atual) =>
        atual
          ? {
              ...atual,
              nome: nome.trim(),
              email: email.trim().toLowerCase(),
              username: username.trim(),
            }
          : atual,
      );

      setModalEdicao(false);

      Alert.alert("Sucesso", "Seus dados foram atualizados!");
    } catch (error) {
      Alert.alert(
        "Erro",
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar seus dados.",
      );
    } finally {
      setSalvando(false);
    }
  }

  // FOTO DE PERFIL
  function selecionarFoto() {
    Alert.alert(
      "Foto de perfil",
      "Como deseja escolher sua foto?",
      [
        {
          text: "Galeria",
          onPress: () => escolherImagem("galeria"),
        },
        {
          text: "Câmera",
          onPress: () => escolherImagem("camera"),
        },
        {
          text: "Cancelar",
          style: "cancel",
        },
      ],
    );
  }

  async function escolherImagem(
    origem: "galeria" | "camera",
  ) {
    try {
      let resultado: ImagePicker.ImagePickerResult;

      // GALERIA
      if (origem === "galeria") {
        const permissao =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permissao.granted) {
          Alert.alert(
            "Permissão necessária",
            "Precisamos de acesso à galeria.",
          );
          return;
        }

        resultado =
          await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });
      } else {
        // CÂMERA
        const permissao =
          await ImagePicker.requestCameraPermissionsAsync();

        if (!permissao.granted) {
          Alert.alert(
            "Permissão necessária",
            "Precisamos de acesso à câmera.",
          );
          return;
        }

        resultado =
          await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });
      }

      // VERIFICAR CANCELAMENTO
      if (resultado.canceled || !resultado.assets.length) {
        return;
      }

      const foto = resultado.assets[0];

      const extensao = foto.uri
        .split(".")
        .pop()
        ?.toLowerCase();

      const tipo =
        foto.mimeType ||
        (extensao === "png"
          ? "image/png"
          : "image/jpeg");

      // VALIDAR FORMATO
      if (!["image/png", "image/jpeg"].includes(tipo)) {
        Alert.alert(
          "Formato inválido",
          "Use uma imagem PNG ou JPEG.",
        );
        return;
      }

      // PREPARAR FORMULÁRIO
      const formulario = new FormData();
      const arquivo = new File(foto.uri);

      formulario.append(
        "image",
        arquivo,
        foto.fileName ||
          `perfil.${extensao === "png" ? "png" : "jpg"}`,
      );

      setEnviandoFoto(true);

      // ENVIAR PARA O BACKEND
      const resposta = await apiPutFormData<{
        message: string;
        foto: string;
      }>("/usuarios/fotoPerfil", formulario);

      // ATUALIZAR FOTO
      setDados((atual) =>
        atual
          ? {
              ...atual,
              url_foto_perfil: resposta.foto,
            }
          : atual,
      );

      Alert.alert(
        "Sucesso",
        "Foto de perfil atualizada!",
      );
    } catch (error) {
      console.log("Erro ao enviar foto:", error);

      Alert.alert(
        "Erro",
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar a foto.",
      );
    } finally {
      setEnviandoFoto(false);
    }
  }

  // CATEGORIAS DE INTERESSE
  async function carregarCategorias() {
    if (!usuario?.id_usuario) return;

    try {
      setCarregandoCategorias(true);

      const respostaTodas =
        await apiGet<any>("/categorias");

      const respostaInteresses =
        await apiGet<any>(
          `/categorias/usuario/${usuario.id_usuario}`,
        );

      const todasCategorias: CategoriaAPI[] =
        Array.isArray(respostaTodas)
          ? respostaTodas
          : respostaTodas.categorias ??
            respostaTodas.resultado ??
            respostaTodas.data ??
            [];

      const categoriasUsuario: CategoriaAPI[] =
        Array.isArray(respostaInteresses)
          ? respostaInteresses
          : respostaInteresses.categorias ??
            respostaInteresses.interesses ??
            respostaInteresses.resultado ??
            respostaInteresses.data ??
            [];

      setCategorias(todasCategorias);

      setInteresses(
        categoriasUsuario.map(
          (categoria) => categoria.id_categoria,
        ),
      );
    } catch (error) {
      console.log("Erro ao carregar categorias:", error);

      Alert.alert(
        "Erro",
        "Não foi possível carregar suas categorias de interesse.",
      );
    } finally {
      setCarregandoCategorias(false);
    }
  }

  async function abrirCategorias() {
    setModalCategorias(true);
    await carregarCategorias();
  }

  async function alternarCategoria(
    id_categoria: number,
  ) {
    if (
      !usuario?.id_usuario ||
      alterandoCategoria !== null
    ) {
      return;
    }

    const jaSelecionada =
      interesses.includes(id_categoria);

    try {
      setAlterandoCategoria(id_categoria);

      if (jaSelecionada) {
        await apiDelete(
          `/categorias/usuario/${usuario.id_usuario}/${id_categoria}`,
        );

        setInteresses((atual) =>
          atual.filter((id) => id !== id_categoria),
        );
      } else {
        await apiPost(
          `/categorias/usuario/${usuario.id_usuario}/${id_categoria}`,
          {},
        );

        setInteresses((atual) => [
          ...atual,
          id_categoria,
        ]);
      }
    } catch (error) {
      console.log("Erro ao alternar categoria:", error);

      Alert.alert(
        "Erro",
        "Não foi possível atualizar sua categoria de interesse.",
      );
    } finally {
      setAlterandoCategoria(null);
    }
  }

  // FAVORITOS
  function extrairLista<T>(
    resposta: any,
    chaves: string[] = [],
  ): T[] {
    if (Array.isArray(resposta)) {
      return resposta as T[];
    }

    for (const chave of chaves) {
      if (Array.isArray(resposta?.[chave])) {
        return resposta[chave] as T[];
      }
    }

    return [];
  }

  function normalizarFavoritos(
    resposta: any,
  ): ArtistaFavorito[] {
    const lista = extrairLista<any>(resposta, [
      "favoritos",
      "data",
      "resultado",
    ]);

    return lista
      .map((item) => {
        const artista = item?.artista ?? item;

        const id = Number(
          artista?.id_artista ?? item?.id_artista,
        );

        return {
          id_artista: id,

          nome:
            artista?.nome_artista ??
            artista?.nome ??
            item?.nome_artista ??
            item?.nome ??
            "Artista",

          username:
            artista?.username ??
            item?.username,

          foto:
            artista?.url_foto_perfil ??
            artista?.foto_perfil ??
            artista?.avatar ??
            item?.url_foto_perfil ??
            item?.foto_perfil ??
            item?.avatar ??
            null,
        };
      })
      .filter(
        (item) =>
          Number.isInteger(item.id_artista) &&
          item.id_artista > 0,
      );
  }

  async function carregarFavoritos() {
    try {
      setCarregandoFavoritos(true);

      const resposta = await apiGet<any>("/favoritos/");

      setFavoritos(normalizarFavoritos(resposta));
    } catch (error) {
      console.log("Erro ao carregar favoritos:", error);

      Alert.alert(
        "Erro",
        "Não foi possível carregar seus artistas favoritos.",
      );
    } finally {
      setCarregandoFavoritos(false);
    }
  }

  async function abrirFavoritos() {
    setModalFavoritos(true);
    await carregarFavoritos();
  }

  // ABRIR PERFIL DO ARTISTA
  function abrirPerfilArtista(id_artista: number) {
    console.log("Artista selecionado:", id_artista);

    if (!onAbrirPerfil) {
      console.log(
        "onAbrirPerfil não foi passado pelo componente pai.",
      );

      Alert.alert(
        "Navegação não conectada",
        "O perfil do artista ainda não foi conectado à navegação.",
      );

      return;
    }

    setModalFavoritos(false);
    onAbrirPerfil(id_artista);
  }

  async function alternarFavorito(
    id_artista: number,
  ) {
    if (alterandoFavorito !== null) return;

    try {
      setAlterandoFavorito(id_artista);

      await apiPost(
        `/favoritos/alternar/${id_artista}`,
        {},
      );

      const resposta = await apiGet<any>("/favoritos/");

      setFavoritos(normalizarFavoritos(resposta));
    } catch (error) {
      console.log("Erro ao alternar favorito:", error);

      Alert.alert(
        "Erro",
        "Não foi possível atualizar seu favorito.",
      );
    } finally {
      setAlterandoFavorito(null);
    }
  }

  // CARREGAMENTO
  if (carregando) {
    return (
      <View style={styles.centralizado}>
        <ActivityIndicator
          size="large"
          color="#ff7a00"
        />

        <Text style={styles.textoAuxiliar}>
          Carregando perfil...
        </Text>
      </View>
    );
  }

  if (!dados) {
    return (
      <View style={styles.centralizado}>
        <Text style={styles.textoAuxiliar}>
          Não foi possível carregar seu perfil.
        </Text>

        <Pressable
          onPress={carregarUsuario}
          style={styles.botaoTentar}
        >
          <Text style={styles.textoBotao}>
            Tentar novamente
          </Text>
        </Pressable>
      </View>
    );
  }

  const imagem = montarImagem(
    dados.url_foto_perfil,
  );

  return (
    <View style={styles.tela}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 30,
        }}
      >
        {/* TOPO */}
        <View
          style={[
            styles.topo,
            { paddingTop: insets.top + 16 },
          ]}
        >
          <Text style={styles.titulo}>
            Meu perfil
          </Text>

          <Pressable
            style={styles.botaoEditar}
            onPress={abrirEdicao}
          >
            <Ionicons
              name="pencil"
              size={18}
              color="#ff7a00"
            />

            <Text style={styles.textoEditar}>
              Editar
            </Text>
          </Pressable>
        </View>

        {/* PERFIL */}
        <View style={styles.perfil}>
          <View style={styles.avatarContainer}>
            {imagem ? (
              <Image
                source={{ uri: imagem }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarVazio}>
                <Ionicons
                  name="person"
                  size={48}
                  color="#fff"
                />
              </View>
            )}

            <Pressable
              style={styles.botaoCamera}
              onPress={selecionarFoto}
              disabled={enviandoFoto}
            >
              {enviandoFoto ? (
                <ActivityIndicator
                  size="small"
                  color="#fff"
                />
              ) : (
                <Ionicons
                  name="camera"
                  size={17}
                  color="#fff"
                />
              )}
            </Pressable>
          </View>

          <Text style={styles.nome}>
            {dados.nome}
          </Text>

          <Text style={styles.username}>
            @{dados.username || "usuario"}
          </Text>

          <Text style={styles.email}>
            {dados.email}
          </Text>
        </View>

        {/* MINHA CONTA */}
        <View style={styles.secao}>
          <Text style={styles.tituloSecao}>
            Minha conta
          </Text>

          <Item
            icon="person-outline"
            titulo="Dados pessoais"
            descricao="Nome, e-mail e username"
            onPress={abrirEdicao}
          />

          {/* COMPONENTE DE ENDEREÇO REUTILIZÁVEL */}
          <Endereco />
        </View>

        {/* PERSONALIZAÇÃO */}
        <View style={styles.secao}>
          <Text style={styles.tituloSecao}>
            Personalização
          </Text>

          <Item
            icon="color-palette-outline"
            titulo="Categorias de interesse"
            descricao="Escolha o que deseja encontrar"
            onPress={abrirCategorias}
          />

          <Item
            icon="heart-outline"
            titulo="Artistas favoritos"
            descricao="Veja os artistas que você acompanha"
            onPress={abrirFavoritos}
          />
        </View>

        {/* INFORMAÇÕES */}
        <View style={styles.secao}>
          <Text style={styles.tituloSecao}>
            Informações
          </Text>

          <View style={styles.info}>
            <Ionicons
              name="information-circle-outline"
              size={21}
              color="#ff7a00"
            />

            <Text style={styles.textoInfo}>
              O Vozes da Arte conecta você a artistas,
              eventos e manifestações culturais.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* MODAL EDITAR */}
      {modalEdicao && (
        <View style={styles.fundoModal}>
          <View style={styles.modal}>
            <View style={styles.topoModal}>
              <Text style={styles.tituloModal}>
                Editar dados
              </Text>

              <Pressable
                onPress={() => setModalEdicao(false)}
              >
                <Ionicons
                  name="close"
                  size={26}
                  color="#fff"
                />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.label}>Nome</Text>

              <TextInput
                style={styles.input}
                value={nome}
                onChangeText={setNome}
                placeholder="Seu nome"
                placeholderTextColor="#888"
                maxLength={100}
              />

              <Text style={styles.label}>E-mail</Text>

              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Seu e-mail"
                placeholderTextColor="#888"
                keyboardType="email-address"
                autoCapitalize="none"
                maxLength={254}
              />

              <Text style={styles.label}>Username</Text>

              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Seu username"
                placeholderTextColor="#888"
                autoCapitalize="none"
                maxLength={30}
              />

              <Pressable
                style={styles.botaoSalvar}
                onPress={salvarEdicao}
                disabled={salvando}
              >
                {salvando ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.textoSalvar}>
                    Salvar alterações
                  </Text>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      )}

      {/* MODAL CATEGORIAS */}
      {modalCategorias && (
        <View style={styles.fundoModal}>
          <View style={styles.modal}>
            <View style={styles.topoModal}>
              <Text style={styles.tituloModal}>
                Categorias de interesse
              </Text>

              <Pressable
                onPress={() => setModalCategorias(false)}
              >
                <Ionicons
                  name="close"
                  size={26}
                  color="#fff"
                />
              </Pressable>
            </View>

            <Text style={styles.textoCategorias}>
              Selecione as categorias artísticas que
              deseja acompanhar.
            </Text>

            {carregandoCategorias ? (
              <View style={styles.carregandoCategorias}>
                <ActivityIndicator
                  color="#ff7a00"
                  size="large"
                />

                <Text style={styles.textoAuxiliar}>
                  Carregando categorias...
                </Text>
              </View>
            ) : categorias.length === 0 ? (
              <Text style={styles.textoAuxiliar}>
                Nenhuma categoria encontrada.
              </Text>
            ) : (
              <ScrollView
                style={styles.listaCategorias}
                showsVerticalScrollIndicator={false}
              >
                {categorias.map((categoria) => {
                  const selecionada = interesses.includes(
                    categoria.id_categoria,
                  );

                  const carregandoItem =
                    alterandoCategoria ===
                    categoria.id_categoria;

                  return (
                    <Pressable
                      key={categoria.id_categoria}
                      style={[
                        styles.categoriaItem,
                        selecionada &&
                          styles.categoriaSelecionada,
                      ]}
                      onPress={() =>
                        alternarCategoria(
                          categoria.id_categoria,
                        )
                      }
                      disabled={
                        alterandoCategoria !== null
                      }
                    >
                      <Text
                        style={[
                          styles.categoriaNome,
                          selecionada &&
                            styles.categoriaNomeSelecionada,
                        ]}
                      >
                        {categoria.nome_categoria}
                      </Text>

                      {carregandoItem ? (
                        <ActivityIndicator
                          size="small"
                          color="#ff7a00"
                        />
                      ) : (
                        <Ionicons
                          name={
                            selecionada
                              ? "checkmark-circle"
                              : "ellipse-outline"
                          }
                          size={23}
                          color={
                            selecionada
                              ? "#ff7a00"
                              : "#777"
                          }
                        />
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}

            <Pressable
              style={styles.botaoSalvar}
              onPress={() => setModalCategorias(false)}
            >
              <Text style={styles.textoSalvar}>
                Concluir
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* MODAL FAVORITOS */}
      {modalFavoritos && (
        <View style={styles.fundoModal}>
          <View style={styles.modal}>
            <View style={styles.topoModal}>
              <Text style={styles.tituloModal}>
                Artistas favoritos
              </Text>

              <Pressable
                onPress={() => setModalFavoritos(false)}
              >
                <Ionicons
                  name="close"
                  size={26}
                  color="#fff"
                />
              </Pressable>
            </View>

            {carregandoFavoritos ? (
              <View style={styles.carregandoCategorias}>
                <ActivityIndicator
                  color="#ff7a00"
                  size="large"
                />

                <Text style={styles.textoAuxiliar}>
                  Carregando favoritos...
                </Text>
              </View>
            ) : favoritos.length === 0 ? (
              <View style={styles.vazioFavoritos}>
                <Ionicons
                  name="heart-outline"
                  size={42}
                  color="#777"
                />

                <Text style={styles.textoAuxiliar}>
                  Você ainda não favoritou artistas.
                </Text>
              </View>
            ) : (
              <ScrollView
                style={styles.listaCategorias}
                showsVerticalScrollIndicator={false}
              >
                {favoritos.map((artista) => {
                  const foto = montarImagem(artista.foto);

                  const carregandoItem =
                    alterandoFavorito ===
                    artista.id_artista;

                  return (
                    <View
                      key={artista.id_artista}
                      style={styles.favoritoItem}
                    >
                      {/* ABRIR PERFIL */}
                      <Pressable
                        style={styles.favoritoPerfil}
                        onPress={() =>
                          abrirPerfilArtista(
                            artista.id_artista,
                          )
                        }
                      >
                        {foto ? (
                          <Image
                            source={{ uri: foto }}
                            style={styles.favoritoAvatar}
                          />
                        ) : (
                          <View
                            style={styles.favoritoAvatarVazio}
                          >
                            <Ionicons
                              name="person"
                              size={22}
                              color="#aaa"
                            />
                          </View>
                        )}

                        <View style={styles.favoritoDados}>
                          <Text
                            style={styles.favoritoNome}
                            numberOfLines={1}
                          >
                            {artista.nome}
                          </Text>

                          {!!artista.username && (
                            <Text
                              style={styles.favoritoUsername}
                              numberOfLines={1}
                            >
                              @{artista.username}
                            </Text>
                          )}
                        </View>

                        <Ionicons
                          name="chevron-forward"
                          size={18}
                          color="#777"
                        />
                      </Pressable>

                      {/* DESFAVORITAR */}
                      <Pressable
                        style={styles.botaoDesfavoritar}
                        onPress={() =>
                          alternarFavorito(
                            artista.id_artista,
                          )
                        }
                        disabled={
                          alterandoFavorito !== null
                        }
                      >
                        {carregandoItem ? (
                          <ActivityIndicator
                            size="small"
                            color="#ff7a00"
                          />
                        ) : (
                          <Ionicons
                            name="heart"
                            size={22}
                            color="#ff7a00"
                          />
                        )}
                      </Pressable>
                    </View>
                  );
                })}
              </ScrollView>
            )}

            <Pressable
              style={styles.botaoSalvar}
              onPress={() => setModalFavoritos(false)}
            >
              <Text style={styles.textoSalvar}>
                Concluir
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

// ITEM DO MENU
function Item({
  icon,
  titulo,
  descricao,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  titulo: string;
  descricao: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={styles.item}
      onPress={onPress}
    >
      <View style={styles.itemIcone}>
        <Ionicons
          name={icon}
          size={22}
          color="#ff7a00"
        />
      </View>

      <View style={styles.itemDados}>
        <Text style={styles.itemTitulo}>
          {titulo}
        </Text>

        <Text style={styles.itemDescricao}>
          {descricao}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={20}
        color="#777"
      />
    </Pressable>
  );
}

// ESTILOS
const styles = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: "#000",
  },

  centralizado: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },

  textoAuxiliar: {
    color: "#aaa",
    marginTop: 12,
  },

  botaoTentar: {
    marginTop: 20,
    backgroundColor: "#ff7a00",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },

  textoBotao: {
    color: "#fff",
    fontWeight: "bold",
  },

  topo: {
    paddingHorizontal: 22,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  titulo: {
    color: "#fff",
    fontSize: 27,
    fontWeight: "900",
  },

  botaoEditar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#ff7a00",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },

  textoEditar: {
    color: "#ff7a00",
    fontWeight: "700",
  },

  perfil: {
    alignItems: "center",
    paddingVertical: 28,
    paddingHorizontal: 20,
    backgroundColor: "#151515",
    marginHorizontal: 16,
    borderRadius: 24,
  },

  avatarContainer: {
    position: "relative",
    width: 110,
    height: 110,
    marginBottom: 15,
  },

  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: "#ff7a00",
  },

  avatarVazio: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#333",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#ff7a00",
  },

  botaoCamera: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 35,
    height: 35,
    borderRadius: 18,
    backgroundColor: "#ff7a00",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#151515",
  },

  nome: {
    color: "#fff",
    fontSize: 21,
    fontWeight: "800",
    textAlign: "center",
  },

  username: {
    color: "#ff7a00",
    fontSize: 14,
    marginTop: 5,
  },

  email: {
    color: "#aaa",
    fontSize: 13,
    marginTop: 8,
  },

  secao: {
    marginTop: 28,
    paddingHorizontal: 20,
  },

  tituloSecao: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 12,
  },

  item: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#191919",
    padding: 14,
    borderRadius: 15,
    marginBottom: 10,
  },

  itemIcone: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#292929",
    alignItems: "center",
    justifyContent: "center",
  },

  itemDados: {
    flex: 1,
    marginLeft: 12,
  },

  itemTitulo: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },

  itemDescricao: {
    color: "#999",
    fontSize: 12,
    marginTop: 4,
  },

  info: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#191919",
    padding: 15,
    borderRadius: 15,
  },

  textoInfo: {
    color: "#aaa",
    fontSize: 13,
    lineHeight: 19,
    flex: 1,
  },

  fundoModal: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    padding: 20,
  },

  modal: {
    backgroundColor: "#1f1f1f",
    borderRadius: 24,
    padding: 22,
    maxHeight: "85%",
  },

  topoModal: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  tituloModal: {
    color: "#fff",
    fontSize: 21,
    fontWeight: "800",
    flex: 1,
  },

  label: {
    color: "#ddd",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
    marginTop: 14,
  },

  input: {
    backgroundColor: "#333",
    color: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
  },

  botaoSalvar: {
    backgroundColor: "#ff7a00",
    borderRadius: 14,
    padding: 15,
    alignItems: "center",
    marginTop: 25,
    marginBottom: 8,
  },

  textoSalvar: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },

  // CATEGORIAS
  textoCategorias: {
    color: "#aaa",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
  },

  carregandoCategorias: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 30,
  },

  listaCategorias: {
    maxHeight: 400,
  },

  categoriaItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#333",
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 13,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#444",
  },

  categoriaSelecionada: {
    backgroundColor: "#382719",
    borderColor: "#ff7a00",
  },

  categoriaNome: {
    color: "#ddd",
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },

  categoriaNomeSelecionada: {
    color: "#ff7a00",
    fontWeight: "800",
  },

  // FAVORITOS
  vazioFavoritos: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 35,
  },

  favoritoItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#333",
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
  },

  favoritoPerfil: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  favoritoAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#ff7a00",
  },

  favoritoAvatarVazio: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#444",
    alignItems: "center",
    justifyContent: "center",
  },

  favoritoDados: {
    flex: 1,
    marginLeft: 12,
  },

  favoritoNome: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },

  favoritoUsername: {
    color: "#999",
    fontSize: 12,
    marginTop: 4,
  },

  botaoDesfavoritar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#45291b",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
});
