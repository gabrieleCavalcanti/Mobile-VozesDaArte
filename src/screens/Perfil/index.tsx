
import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  Linking,
  Modal,
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

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../routes/types";

import { useAuth } from "../../context/AuthContext";

import BASE_URL, {
  apiGet,
  apiPut,
  apiPutFormData,
} from "../../api/api";

import { File } from "expo-file-system";

import Abas from "../../components/Abas";
import Posts from "../Home/Posts";
import Eventos from "../Home/Eventos";

type Props = NativeStackScreenProps<
  RootStackParamList,
  "Perfil"
>;

type ArtistaAPI = {
  id_artista: number;
  id_usuario: number;
  url_foto_capa: string | null;
  biografia: string | null;
  contato_profissional: string | null;
};

type UsuarioAPI = {
  id_usuario: number;
  nome: string;
  username?: string;
  email: string;
  url_foto_perfil: string | null;
};

type EnderecoAPI = {
  id_endereco?: number;
  cep: string;
  rua: string;
  complemento?: string | null;
  uf: string;
  estado: string;
  cidade: string;
  bairro: string;
  numero: string;
  latitude?: number | null;
  longitude?: number | null;
};

type Aba = "eventos" | "posts" | "arquivados";

const OPCOES_VISITANTE: {
  valor: Aba;
  rotulo: string;
}[] = [
  {
    valor: "eventos",
    rotulo: "EVENTOS",
  },
  {
    valor: "posts",
    rotulo: "POSTS",
  },
];

const OPCOES_DONO: {
  valor: Aba;
  rotulo: string;
}[] = [
  {
    valor: "eventos",
    rotulo: "EVENTOS",
  },
  {
    valor: "posts",
    rotulo: "POSTS",
  },
  {
    valor: "arquivados",
    rotulo: "ARQUIVADOS",
  },
];

function montarImagem(
  nomeArquivo?: string | null,
): string | undefined {
  if (!nomeArquivo) return undefined;

  if (nomeArquivo.startsWith("http")) {
    return nomeArquivo;
  }

  return `${BASE_URL}/images/${nomeArquivo}`;
}

export default function Perfil({
  navigation,
  route,
}: Props) {
  const insets = useSafeAreaInsets();
  const { usuario } = useAuth();

  const { id_artista } = route.params;

  const [artista, setArtista] = useState<ArtistaAPI | null>(null);
  const [dadosUsuario, setDadosUsuario] = useState<UsuarioAPI | null>(null);

  const [endereco, setEndereco] = useState<EnderecoAPI | null>(null);
  const [carregandoEndereco, setCarregandoEndereco] = useState(false);

  const [aba, setAba] = useState<Aba>("posts");

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [enviandoCapa, setEnviandoCapa] = useState(false);
  const [enviandoFotoPerfil, setEnviandoFotoPerfil] = useState(false);

  const [modalEdicao, setModalEdicao] = useState(false);

  const [biografiaEditada, setBiografiaEditada] = useState("");
  const [contatoEditado, setContatoEditado] = useState("");

  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  const [nomeEditado, setNomeEditado] = useState("");
  const [emailEditado, setEmailEditado] = useState("");
  const [usernameEditado, setUsernameEditado] = useState("");

  const ehDono =
    !!artista &&
    !!usuario?.id_usuario &&
    artista.id_usuario === usuario.id_usuario;

  const opcoesAbas = ehDono
    ? OPCOES_DONO
    : OPCOES_VISITANTE;

  // CARREGAR PERFIL E ENDEREÇO
  useEffect(() => {
    let ativo = true;

    async function carregarPerfil() {
      try {
        setCarregando(true);
        setErro("");

        setArtista(null);
        setDadosUsuario(null);
        setEndereco(null);

        const dadosArtista =
          await apiGet<ArtistaAPI>(
            `/artistas/${id_artista}`,
          );

        const dadosUsuario =
          await apiGet<UsuarioAPI>(
            `/usuarios/${dadosArtista.id_usuario}`,
          );

        if (!ativo) return;

        setArtista(dadosArtista);
        setDadosUsuario(dadosUsuario);

        // BUSCAR ENDEREÇO DO ARTISTA
        try {
          setCarregandoEndereco(true);

          const resposta =
            await apiGet<
              | EnderecoAPI
              | {
                  mensagem?: string;
                  endereco: EnderecoAPI | null;
                }
            >(
              `/enderecos/usuario/${dadosArtista.id_usuario}`,
            );

          const enderecoEncontrado =
            "endereco" in resposta
              ? resposta.endereco
              : resposta;

          if (ativo) {
            setEndereco(enderecoEncontrado || null);
          }
        } catch (error) {
          console.log(
            "Não foi possível carregar o endereço:",
            error,
          );

          if (ativo) {
            setEndereco(null);
          }
        } finally {
          if (ativo) {
            setCarregandoEndereco(false);
          }
        }
      } catch (error) {
        if (ativo) {
          setErro(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar o perfil.",
          );
        }
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    carregarPerfil();

    return () => {
      ativo = false;
    };
  }, [id_artista]);

  // ABRIR LOCALIZAÇÃO NO MAPS
  async function abrirLocalizacao() {
    if (!endereco) return;

    const latitude = Number(endereco.latitude);
    const longitude = Number(endereco.longitude);

    let destino = "";

    if (
      endereco.latitude != null &&
      endereco.longitude != null &&
      !isNaN(latitude) &&
      !isNaN(longitude)
    ) {
      destino = `${latitude},${longitude}`;
    } else {
      destino = [
        endereco.rua,
        endereco.numero,
        endereco.bairro,
        endereco.cidade,
        endereco.uf || endereco.estado,
        endereco.cep,
      ]
        .filter(Boolean)
        .join(", ");
    }

    if (!destino.trim()) {
      Alert.alert(
        "Localização indisponível",
        "Este endereço ainda não possui uma localização válida.",
      );
      return;
    }

    const url =
      `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destino)}`;

    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(
        "Erro",
        "Não foi possível abrir o mapa.",
      );
    }
  }

  // ESCOLHER E ENVIAR FOTO DE CAPA
  async function selecionarFotoCapa(
    origem: "galeria" | "camera",
  ) {
    try {
      let resultado: ImagePicker.ImagePickerResult;

      if (origem === "galeria") {
        const permissao =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permissao.granted) {
          Alert.alert(
            "Permissão necessária",
            "Precisamos de acesso à galeria para escolher uma foto.",
          );
          return;
        }

        resultado =
          await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
          });
      } else {
        const permissao =
          await ImagePicker.requestCameraPermissionsAsync();

        if (!permissao.granted) {
          Alert.alert(
            "Permissão necessária",
            "Precisamos de acesso à câmera para tirar uma foto.",
          );
          return;
        }

        resultado =
          await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
          });
      }

      if (
        resultado.canceled ||
        !resultado.assets.length
      ) {
        return;
      }

      const foto = resultado.assets[0];

      const extensao =
        foto.uri.split(".").pop()?.toLowerCase();

      const tipo =
        foto.mimeType ||
        (extensao === "png"
          ? "image/png"
          : "image/jpeg");

      if (
        !["image/png", "image/jpeg"].includes(tipo)
      ) {
        Alert.alert(
          "Formato inválido",
          "Escolha uma imagem PNG ou JPEG.",
        );
        return;
      }

      const formulario = new FormData();
      const arquivo = new File(foto.uri);

      formulario.append(
        "image",
        arquivo,
        foto.fileName ||
          `capa.${extensao === "png" ? "png" : "jpg"}`,
      );

      setEnviandoCapa(true);

      const resposta =
        await apiPutFormData<{
          message: string;
          foto: string;
        }>("/artistas/fotoCapa", formulario);

      setArtista((atual) =>
        atual
          ? {
              ...atual,
              url_foto_capa: resposta.foto,
            }
          : atual,
      );

      Alert.alert(
        "Sucesso",
        "Foto de capa atualizada!",
      );
    } catch (error) {
      Alert.alert(
        "Erro",
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar a foto de capa.",
      );
    } finally {
      setEnviandoCapa(false);
    }
  }

  // ESCOLHER E ENVIAR FOTO DE PERFIL
  async function selecionarFotoPerfil(
    origem: "galeria" | "camera",
  ) {
    try {
      let resultado: ImagePicker.ImagePickerResult;

      if (origem === "galeria") {
        const permissao =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permissao.granted) {
          Alert.alert(
            "Permissão necessária",
            "Precisamos de acesso à galeria para escolher uma foto.",
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
        const permissao =
          await ImagePicker.requestCameraPermissionsAsync();

        if (!permissao.granted) {
          Alert.alert(
            "Permissão necessária",
            "Precisamos de acesso à câmera para tirar uma foto.",
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

      if (
        resultado.canceled ||
        !resultado.assets.length
      ) {
        return;
      }

      const foto = resultado.assets[0];

      const extensao =
        foto.uri.split(".").pop()?.toLowerCase();

      const tipo =
        foto.mimeType ||
        (extensao === "png"
          ? "image/png"
          : "image/jpeg");

      if (
        !["image/png", "image/jpeg"].includes(tipo)
      ) {
        Alert.alert(
          "Formato inválido",
          "Escolha uma imagem PNG ou JPEG.",
        );
        return;
      }

      const formulario = new FormData();
      const arquivo = new File(foto.uri);

      formulario.append(
        "image",
        arquivo,
        foto.fileName ||
          `perfil.${extensao === "png" ? "png" : "jpg"}`,
      );

      setEnviandoFotoPerfil(true);

      const resposta =
        await apiPutFormData<{
          message: string;
          foto: string;
        }>("/usuarios/fotoPerfil", formulario);

      setDadosUsuario((atual) =>
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
      Alert.alert(
        "Erro",
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar a foto de perfil.",
      );
    } finally {
      setEnviandoFotoPerfil(false);
    }
  }

  // OPÇÕES DA FOTO DE CAPA
  function abrirOpcoesFotoCapa() {
    Alert.alert(
      "Foto de capa",
      "Como deseja escolher sua foto?",
      [
        {
          text: "Escolher da galeria",
          onPress: () =>
            selecionarFotoCapa("galeria"),
        },
        {
          text: "Tirar uma foto",
          onPress: () =>
            selecionarFotoCapa("camera"),
        },
        {
          text: "Cancelar",
          style: "cancel",
        },
      ],
    );
  }

  // OPÇÕES DA FOTO DE PERFIL
  function abrirOpcoesFotoPerfil() {
    Alert.alert(
      "Foto de perfil",
      "Como deseja escolher sua foto?",
      [
        {
          text: "Escolher da galeria",
          onPress: () =>
            selecionarFotoPerfil("galeria"),
        },
        {
          text: "Tirar uma foto",
          onPress: () =>
            selecionarFotoPerfil("camera"),
        },
        {
          text: "Cancelar",
          style: "cancel",
        },
      ],
    );
  }

  // ABRIR EDIÇÃO
  function abrirEdicaoPerfil() {
    if (!dadosUsuario || !artista) return;

    setNomeEditado(dadosUsuario.nome);
    setEmailEditado(dadosUsuario.email);
    setUsernameEditado(dadosUsuario.username || "");

    setBiografiaEditada(artista.biografia || "");
    setContatoEditado(
      artista.contato_profissional || "",
    );

    setModalEdicao(true);
  }

  // SALVAR EDIÇÃO
  async function salvarEdicaoPerfil() {
    if (!dadosUsuario || !artista) return;

    if (
      !nomeEditado.trim() ||
      !emailEditado.trim() ||
      !usernameEditado.trim()
    ) {
      Alert.alert(
        "Atenção",
        "Preencha nome, e-mail e username.",
      );
      return;
    }

    try {
      setSalvandoEdicao(true);

      await apiPut(
        "/usuarios/" + dadosUsuario.id_usuario,
        {
          nome: nomeEditado.trim(),
          email: emailEditado.trim().toLowerCase(),
          username: usernameEditado.trim(),
        },
      );

      await apiPut(
        "/artistas/" + artista.id_artista,
        {
          biografia:
            biografiaEditada.trim() || null,
          contato_profissional:
            contatoEditado.trim() || null,
        },
      );

      // ATUALIZAR OS DADOS NA TELA
      setDadosUsuario((atual) =>
        atual
          ? {
              ...atual,
              nome: nomeEditado.trim(),
              email: emailEditado.trim().toLowerCase(),
              username: usernameEditado.trim(),
            }
          : atual,
      );

      setArtista((atual) =>
        atual
          ? {
              ...atual,
              biografia:
                biografiaEditada.trim() || null,
              contato_profissional:
                contatoEditado.trim() || null,
            }
          : atual,
      );

      Alert.alert(
        "Sucesso",
        "Perfil atualizado!",
      );

      setModalEdicao(false);
    } catch (error) {
      console.log("ERRO AO SALVAR:", error);

      Alert.alert(
        "Erro",
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o perfil.",
      );
    } finally {
      setSalvandoEdicao(false);
    }
  }

  // CARREGAMENTO
  if (carregando) {
    return (
      <View style={styles.centralizado}>
        <ActivityIndicator
          size="large"
          color="#E30613"
        />

        <Text style={styles.textoAuxiliar}>
          Carregando perfil...
        </Text>
      </View>
    );
  }

  // ERRO
  if (!artista || !dadosUsuario) {
    return (
      <View style={styles.centralizado}>
        <Text style={styles.erro}>
          {erro ||
            "Não foi possível encontrar este artista."}
        </Text>

        <Pressable
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.voltar}>
            Voltar
          </Text>
        </Pressable>
      </View>
    );
  }

  const imagemCapa = montarImagem(
    artista.url_foto_capa,
  );

  const imagemPerfil = montarImagem(
    dadosUsuario.url_foto_perfil,
  );

  const nomeExibido =
    dadosUsuario.nome?.trim() ||
    dadosUsuario.username ||
    "Artista";

  // FORMATAÇÃO DO ENDEREÇO
  const enderecoFormatado = endereco
    ? [
        endereco.rua
          ? `${endereco.rua}${endereco.numero ? `, ${endereco.numero}` : ""}`
          : endereco.numero,
        endereco.complemento,
        endereco.bairro,
        endereco.cidade,
        endereco.uf || endereco.estado,
        endereco.cep ? `CEP: ${endereco.cep}` : null,
      ]
        .filter(Boolean)
        .join("\n")
    : "";

  return (
    <View style={styles.tela}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 24,
        }}
      >
        {/* CAPA */}
        <ImageBackground
          source={
            imagemCapa
              ? { uri: imagemCapa }
              : require("../../assets/fundoPerfil.jpg")
          }
          resizeMode="cover"
          style={[
            styles.banner,
            {
              paddingTop: insets.top + 8,
            },
          ]}
        >
          <View style={styles.bannerTopo}>
            <Pressable
              onPress={() => navigation.goBack()}
              hitSlop={12}
            >
              <Ionicons
                name="close"
                size={28}
                color="#fff"
              />
            </Pressable>

            {ehDono && (
              <Pressable
                onPress={abrirEdicaoPerfil}
                disabled={enviandoCapa}
                hitSlop={12}
              >
                {enviandoCapa ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Ionicons
                    name="pencil"
                    size={23}
                    color="#fff"
                  />
                )}
              </Pressable>
            )}
          </View>

          <View style={styles.bannerInfo}>
            <View style={styles.avatarContainer}>
              {imagemPerfil ? (
                <Image
                  source={{ uri: imagemPerfil }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarVazio}>
                  <Ionicons
                    name="person"
                    size={42}
                    color="#fff"
                  />
                </View>
              )}

              {ehDono && (
                <Pressable
                  style={styles.botaoEditarAvatar}
                  onPress={abrirOpcoesFotoPerfil}
                  disabled={enviandoFotoPerfil}
                  hitSlop={8}
                >
                  {enviandoFotoPerfil ? (
                    <ActivityIndicator
                      size="small"
                      color="#fff"
                    />
                  ) : (
                    <Ionicons
                      name="camera"
                      size={16}
                      color="#fff"
                    />
                  )}
                </Pressable>
              )}
            </View>

            <View style={styles.dados}>
              <Text
                style={styles.nome}
                numberOfLines={2}
              >
                {nomeExibido}
              </Text>

              <Text
                style={styles.email}
                numberOfLines={1}
              >
                {dadosUsuario.email}
              </Text>
            </View>
          </View>

          {ehDono && (
            <Pressable
              style={styles.botaoMais}
              onPress={() =>
                navigation.navigate("Criar")
              }
            >
              <Ionicons
                name="add"
                size={26}
                color="#fff"
              />
            </Pressable>
          )}
        </ImageBackground>

        {/* BIOGRAFIA E CONTATO */}
        {(!!artista.biografia ||
          !!artista.contato_profissional) && (
          <View style={styles.bioContainer}>
            {!!artista.biografia && (
              <Text style={styles.bio}>
                {artista.biografia}
              </Text>
            )}

            {!!artista.contato_profissional && (
              <Pressable
                onPress={() => {
                  let link =
                    artista.contato_profissional!.trim();

                  if (!/^https?:\/\//i.test(link)) {
                    link = `https://${link}`;
                  }

                  Linking.openURL(link).catch(() =>
                    Alert.alert(
                      "Erro",
                      "Não foi possível abrir o link.",
                    ),
                  );
                }}
                style={styles.contatoContainer}
              >
                <Ionicons
                  name="link-outline"
                  size={17}
                  color="#ff7a00"
                />

                <Text style={styles.contato}>
                  {artista.contato_profissional}
                </Text>
              </Pressable>
            )}
          </View>
        )}

        {/* ENDEREÇO DO ARTISTA */}
        {carregandoEndereco && (
          <View style={styles.enderecoContainer}>
            <ActivityIndicator
              size="small"
              color="#ff7a00"
            />

            <Text style={styles.enderecoCarregando}>
              Carregando endereço...
            </Text>
          </View>
        )}

        {!!endereco && !carregandoEndereco && (
          <View style={styles.enderecoContainer}>
            <View style={styles.enderecoTitulo}>
              <Ionicons
                name="location"
                size={22}
                color="#ff7a00"
              />

              <Text style={styles.enderecoTituloTexto}>
                Localização
              </Text>
            </View>

            <Text style={styles.enderecoTexto}>
              {enderecoFormatado}
            </Text>

            <Pressable
              style={styles.botaoLocalizacao}
              onPress={abrirLocalizacao}
            >
              <Ionicons
                name="navigate"
                size={18}
                color="#fff"
              />

              <Text style={styles.textoBotaoLocalizacao}>
                Ver rota no mapa
              </Text>
            </Pressable>
          </View>
        )}

        {/* CONTEÚDO DO PERFIL */}
        <View style={styles.painel}>
          <Abas
            opcoes={opcoesAbas}
            atual={aba}
            onChange={setAba}
            variante="perfil"
          />

          <View style={styles.conteudo}>
            {/* EVENTOS */}
            {aba === "eventos" && (
              <Eventos
                idArtista={id_artista}
                nomeArtista={nomeExibido}
                avatarArtista={imagemPerfil}
                margemLateral={0}
                ehDono={ehDono}
                visualizandoArquivados={false}
              />
            )}

            {/* POSTS */}
            {aba === "posts" && (
              <Posts
                idArtista={id_artista}
                nomeArtista={nomeExibido}
                avatarArtista={imagemPerfil}
                margemLateral={0}
                ehDono={ehDono}
                visualizandoArquivados={false}
              />
            )}

            {/* ARQUIVADOS */}
            {aba === "arquivados" && ehDono && (
              <View>
                <Posts
                  idArtista={id_artista}
                  nomeArtista={nomeExibido}
                  avatarArtista={imagemPerfil}
                  margemLateral={0}
                  ehDono={true}
                  visualizandoArquivados={true}
                />

                <Eventos
                  idArtista={id_artista}
                  nomeArtista={nomeExibido}
                  avatarArtista={imagemPerfil}
                  margemLateral={0}
                  ehDono={true}
                  visualizandoArquivados={true}
                />
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* MODAL DE EDIÇÃO */}
      <Modal
        visible={modalEdicao}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setModalEdicao(false)
        }
      >
        <View style={styles.fundoModal}>
          <View style={styles.conteudoModal}>
            <View style={styles.topoModal}>
              <Text style={styles.tituloModal}>
                Editar perfil
              </Text>

              <Pressable
                onPress={() =>
                  setModalEdicao(false)
                }
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
              <Text style={styles.labelModal}>
                Nome
              </Text>

              <TextInput
                style={styles.inputModal}
                value={nomeEditado}
                onChangeText={setNomeEditado}
                placeholder="Seu nome"
                placeholderTextColor="#888"
                maxLength={100}
              />

              <Text style={styles.labelModal}>
                E-mail
              </Text>

              <TextInput
                style={styles.inputModal}
                value={emailEditado}
                onChangeText={setEmailEditado}
                placeholder="Seu e-mail"
                placeholderTextColor="#888"
                keyboardType="email-address"
                autoCapitalize="none"
                maxLength={254}
              />

              <Text style={styles.labelModal}>
                Username
              </Text>

              <TextInput
                style={styles.inputModal}
                value={usernameEditado}
                onChangeText={setUsernameEditado}
                placeholder="Seu username"
                placeholderTextColor="#888"
                autoCapitalize="none"
                maxLength={30}
              />

              <Text style={styles.labelModal}>
                Biografia
              </Text>

              <TextInput
                style={[
                  styles.inputModal,
                  styles.inputBiografia,
                ]}
                value={biografiaEditada}
                onChangeText={setBiografiaEditada}
                placeholder="Conte um pouco sobre você e seu trabalho..."
                placeholderTextColor="#888"
                multiline
                maxLength={1000}
                textAlignVertical="top"
              />

              <Text style={styles.labelModal}>
                Contato profissional
              </Text>

              <TextInput
                style={styles.inputModal}
                value={contatoEditado}
                onChangeText={setContatoEditado}
                placeholder="Instagram, WhatsApp, portfólio..."
                placeholderTextColor="#888"
                autoCapitalize="none"
                keyboardType="url"
                maxLength={255}
              />

              <Text style={styles.labelModal}>
                Fotos
              </Text>

              <Pressable
                style={styles.botaoFotoModal}
                onPress={abrirOpcoesFotoPerfil}
                disabled={enviandoFotoPerfil}
              >
                <Ionicons
                  name="person-circle-outline"
                  size={21}
                  color="#fff"
                />

                <Text style={styles.textoBotaoFoto}>
                  Alterar foto de perfil
                </Text>
              </Pressable>

              <Pressable
                style={styles.botaoFotoModal}
                onPress={abrirOpcoesFotoCapa}
                disabled={enviandoCapa}
              >
                <Ionicons
                  name="image-outline"
                  size={21}
                  color="#fff"
                />

                <Text style={styles.textoBotaoFoto}>
                  Alterar foto de capa
                </Text>
              </Pressable>

              <Pressable
                style={styles.botaoSalvar}
                onPress={salvarEdicaoPerfil}
                disabled={salvandoEdicao}
              >
                {salvandoEdicao ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.textoBotaoSalvar}>
                    Salvar alterações
                  </Text>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

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
    padding: 24,
  },

  textoAuxiliar: {
    color: "#aaa",
    marginTop: 12,
  },

  erro: {
    color: "#ff7777",
    textAlign: "center",
  },

  voltar: {
    color: "#E30613",
    marginTop: 16,
  },

  // CAPA
  banner: {
    minHeight: 220,
    paddingHorizontal: 16,
    paddingBottom: 22,
    justifyContent: "space-between",
  },

  bannerTopo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  bannerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 24,
    paddingRight: 48,
  },

  avatarContainer: {
    width: 88,
    height: 88,
    position: "relative",
  },

  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#555",
    borderWidth: 2,
    borderColor: "#fff",
  },

  avatarVazio: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#555",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },

  botaoEditarAvatar: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#ff7a00",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },

  dados: {
    flex: 1,
  },

  nome: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
  },

  email: {
    color: "#eee",
    fontSize: 12,
    marginTop: 4,
  },

  botaoMais: {
    position: "absolute",
    right: 16,
    bottom: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E30613",
    alignItems: "center",
    justifyContent: "center",
  },

  // BIOGRAFIA
  bioContainer: {
    backgroundColor: "#000",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
  },

  bio: {
    color: "#bbb",
    fontSize: 13,
    lineHeight: 19,
  },

  contatoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 12,
  },

  contato: {
    color: "#ff7a00",
    fontSize: 13,
    textDecorationLine: "underline",
    flexShrink: 1,
  },

  // ENDEREÇO
  enderecoContainer: {
    backgroundColor: "#171717",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#333",
  },

  enderecoTitulo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },

  enderecoTituloTexto: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },

  enderecoTexto: {
    color: "#ccc",
    fontSize: 14,
    lineHeight: 22,
  },

  enderecoCarregando: {
    color: "#aaa",
    marginLeft: 10,
    fontSize: 13,
  },

  botaoLocalizacao: {
    backgroundColor: "#ff7a00",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    marginTop: 14,
  },

  textoBotaoLocalizacao: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
  },

  // CONTEÚDO
  painel: {
    flex: 1,
    minHeight: 400,
    backgroundColor: "transparent",
    paddingTop: 8,
    paddingHorizontal: 12,
  },

  conteudo: {
    flex: 1,
    paddingTop: 0,
  },

  // MODAL
  fundoModal: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    padding: 20,
  },

  conteudoModal: {
    backgroundColor: "#1f1f1f",
    borderRadius: 24,
    padding: 22,
    maxHeight: "85%",
  },

  topoModal: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },

  tituloModal: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
  },

  labelModal: {
    color: "#ddd",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
    marginTop: 14,
  },

  inputModal: {
    backgroundColor: "#333",
    color: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
  },

  inputBiografia: {
    minHeight: 110,
    paddingTop: 12,
  },

  botaoFotoModal: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#333",
    padding: 14,
    borderRadius: 12,
    marginTop: 10,
  },

  textoBotaoFoto: {
    color: "#fff",
    fontSize: 14,
  },

  botaoSalvar: {
    backgroundColor: "#ff7a00",
    borderRadius: 14,
    padding: 15,
    alignItems: "center",
    marginTop: 26,
    marginBottom: 8,
  },

  textoBotaoSalvar: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
});
