
import { useState } from "react";

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
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { apiGet, apiPut } from "../api/api";

type EnderecoAPI = {
  cep: string;
  rua: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  uf: string;
  latitude?: number | null;
  longitude?: number | null;
};

const enderecoVazio: EnderecoAPI = {
  cep: "",
  rua: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
  uf: "",
  latitude: null,
  longitude: null,
};

export default function Endereco() {
  const [modalAberto, setModalAberto] = useState(false);

  const [endereco, setEndereco] =
    useState<EnderecoAPI>({ ...enderecoVazio });

  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);

  // ATUALIZAR CAMPO
  function atualizar(
    campo: keyof EnderecoAPI,
    valor: string,
  ) {
    setEndereco((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  // ABRIR MODAL
  async function abrirEndereco() {
    setModalAberto(true);

    setEndereco({ ...enderecoVazio });
    setCarregando(true);

    try {
      const resposta = await apiGet<any>("/enderecos/me");

      const recebido =
        resposta?.endereco ??
        resposta?.data ??
        resposta;

      if (
        recebido &&
        typeof recebido === "object" &&
        !Array.isArray(recebido)
      ) {
        setEndereco({
          cep: recebido.cep ?? "",
          rua: recebido.rua ?? "",
          numero: recebido.numero ?? "",
          complemento: recebido.complemento ?? "",
          bairro: recebido.bairro ?? "",
          cidade: recebido.cidade ?? "",
          estado: recebido.estado ?? "",
          uf: recebido.uf ?? "",
          latitude: recebido.latitude ?? null,
          longitude: recebido.longitude ?? null,
        });
      }
    } catch (error) {
      console.log("Erro ao carregar endereço:", error);

      setEndereco({ ...enderecoVazio });
    } finally {
      setCarregando(false);
    }
  }

  // BUSCAR CEP
  async function buscarCep() {
    const cep = endereco.cep.replace(/\D/g, "");

    if (cep.length !== 8) {
      Alert.alert(
        "CEP inválido",
        "Digite um CEP com 8 números.",
      );
      return;
    }

    try {
      setBuscandoCep(true);

      const resposta = await fetch(
        `https://viacep.com.br/ws/${cep}/json/`,
      );

      const dados = await resposta.json();

      if (dados.erro) {
        Alert.alert(
          "CEP não encontrado",
          "Confira o CEP digitado.",
        );
        return;
      }

      setEndereco((atual) => ({
        ...atual,
        rua: dados.logradouro || atual.rua,
        bairro: dados.bairro || atual.bairro,
        cidade: dados.localidade || atual.cidade,
        estado: dados.estado || atual.estado,
        uf: dados.uf || atual.uf,
      }));
    } catch (error) {
      console.log("Erro ao buscar CEP:", error);

      Alert.alert(
        "Erro",
        "Não foi possível consultar o CEP.",
      );
    } finally {
      setBuscandoCep(false);
    }
  }

  // SALVAR ENDEREÇO
  async function salvarEndereco() {
    const cep = endereco.cep.replace(/\D/g, "");
    const uf = endereco.uf.trim().toUpperCase();

    if (cep.length !== 8) {
      Alert.alert(
        "Atenção",
        "Digite um CEP válido com 8 números.",
      );
      return;
    }

    if (
      !endereco.rua.trim() ||
      !endereco.numero.trim() ||
      !endereco.cidade.trim() ||
      uf.length !== 2
    ) {
      Alert.alert(
        "Atenção",
        "Preencha rua, número, cidade e UF.",
      );
      return;
    }

    try {
      setSalvando(true);

      await apiPut("/enderecos/me", {
        cep,
        rua: endereco.rua.trim(),
        numero: endereco.numero.trim(),
        complemento: endereco.complemento.trim(),
        bairro: endereco.bairro.trim(),
        cidade: endereco.cidade.trim(),
        estado: endereco.estado.trim(),
        uf,
        latitude: endereco.latitude ?? null,
        longitude: endereco.longitude ?? null,
      });

      setModalAberto(false);

      Alert.alert(
        "Sucesso",
        "Endereço salvo com sucesso!",
      );
    } catch (error) {
      console.log("Erro ao salvar endereço:", error);

      Alert.alert(
        "Erro",
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o endereço.",
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
      {/* ITEM DO MENU */}
      <Pressable
        style={styles.item}
        onPress={abrirEndereco}
      >
        <View style={styles.icone}>
          <Ionicons
            name="location-outline"
            size={22}
            color="#ff7a00"
          />
        </View>

        <View style={styles.dadosItem}>
          <Text style={styles.tituloItem}>
            Meu endereço
          </Text>

          <Text style={styles.descricaoItem}>
            Gerenciar meu endereço
          </Text>
        </View>

        <Ionicons
          name="chevron-forward"
          size={20}
          color="#777"
        />
      </Pressable>

      {/* MODAL NATIVO */}
      <Modal
        visible={modalAberto}
        transparent={true}
        animationType="slide"
        statusBarTranslucent={true}
        onRequestClose={() => setModalAberto(false)}
      >
        <View style={styles.fundoModal}>
          <View style={styles.modal}>
            {/* CABEÇALHO */}
            <View style={styles.topoModal}>
              <Text style={styles.tituloModal}>
                Meu endereço
              </Text>

              <Pressable
                onPress={() => setModalAberto(false)}
                style={styles.botaoFechar}
              >
                <Ionicons
                  name="close"
                  size={28}
                  color="#fff"
                />
              </Pressable>
            </View>

            {/* CARREGAMENTO */}
            {carregando && (
              <View style={styles.avisoCarregamento}>
                <ActivityIndicator
                  color="#ff7a00"
                  size="small"
                />

                <Text style={styles.auxiliar}>
                  Verificando endereço cadastrado...
                </Text>
              </View>
            )}

            {/* FORMULÁRIO */}
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.conteudoScroll}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
            >
              {/* CEP */}
              <Text style={styles.label}>CEP</Text>

              <View style={styles.linhaCep}>
                <TextInput
                  style={[styles.input, styles.inputCep]}
                  value={endereco.cep}
                  onChangeText={(valor) =>
                    atualizar(
                      "cep",
                      valor.replace(/\D/g, "").slice(0, 8),
                    )
                  }
                  onEndEditing={() => {
                    if (endereco.cep.length === 8) {
                      buscarCep();
                    }
                  }}
                  placeholder="00000000"
                  placeholderTextColor="#888"
                  keyboardType="numeric"
                  maxLength={8}
                />

                <Pressable
                  style={styles.botaoCep}
                  onPress={buscarCep}
                  disabled={buscandoCep}
                >
                  {buscandoCep ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.textoBotaoCep}>
                      Buscar
                    </Text>
                  )}
                </Pressable>
              </View>

              {/* RUA */}
              <Text style={styles.label}>Rua</Text>

              <TextInput
                style={styles.input}
                value={endereco.rua}
                onChangeText={(valor) =>
                  atualizar("rua", valor)
                }
                placeholder="Nome da rua"
                placeholderTextColor="#888"
                maxLength={150}
              />

              {/* NÚMERO */}
              <Text style={styles.label}>Número</Text>

              <TextInput
                style={styles.input}
                value={endereco.numero}
                onChangeText={(valor) =>
                  atualizar("numero", valor)
                }
                placeholder="Número"
                placeholderTextColor="#888"
                maxLength={20}
              />

              {/* COMPLEMENTO */}
              <Text style={styles.label}>Complemento</Text>

              <TextInput
                style={styles.input}
                value={endereco.complemento}
                onChangeText={(valor) =>
                  atualizar("complemento", valor)
                }
                placeholder="Apartamento, casa, bloco..."
                placeholderTextColor="#888"
                maxLength={100}
              />

              {/* BAIRRO */}
              <Text style={styles.label}>Bairro</Text>

              <TextInput
                style={styles.input}
                value={endereco.bairro}
                onChangeText={(valor) =>
                  atualizar("bairro", valor)
                }
                placeholder="Bairro"
                placeholderTextColor="#888"
                maxLength={100}
              />

              {/* CIDADE */}
              <Text style={styles.label}>Cidade</Text>

              <TextInput
                style={styles.input}
                value={endereco.cidade}
                onChangeText={(valor) =>
                  atualizar("cidade", valor)
                }
                placeholder="Cidade"
                placeholderTextColor="#888"
                maxLength={100}
              />

              {/* ESTADO */}
              <Text style={styles.label}>Estado</Text>

              <TextInput
                style={styles.input}
                value={endereco.estado}
                onChangeText={(valor) =>
                  atualizar("estado", valor)
                }
                placeholder="Estado"
                placeholderTextColor="#888"
                maxLength={100}
              />

              {/* UF */}
              <Text style={styles.label}>UF</Text>

              <TextInput
                style={styles.input}
                value={endereco.uf}
                onChangeText={(valor) =>
                  atualizar(
                    "uf",
                    valor.toUpperCase().slice(0, 2),
                  )
                }
                placeholder="SP"
                placeholderTextColor="#888"
                autoCapitalize="characters"
                maxLength={2}
              />

              {/* SALVAR */}
              <Pressable
                style={styles.botaoSalvar}
                onPress={salvarEndereco}
                disabled={salvando}
              >
                {salvando ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.textoSalvar}>
                    Salvar endereço
                  </Text>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // ITEM DO MENU
  item: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#191919",
    padding: 14,
    borderRadius: 15,
    marginBottom: 10,
  },

  icone: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#292929",
    alignItems: "center",
    justifyContent: "center",
  },

  dadosItem: {
    flex: 1,
    marginLeft: 12,
  },

  tituloItem: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },

  descricaoItem: {
    color: "#999",
    fontSize: 13,
    marginTop: 4,
  },

  // FUNDO DO MODAL
  fundoModal: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 5,
  },

  // MODAL - OCUPA QUASE A TELA INTEIRA
  modal: {
    backgroundColor: "#1f1f1f",
    borderRadius: 20,
    width: "100%",
    height: "100%",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },

  // CABEÇALHO
  topoModal: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
    minHeight: 45,
  },

  tituloModal: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
    flex: 1,
  },

  botaoFechar: {
    padding: 5,
    alignItems: "center",
    justifyContent: "center",
  },

  // CARREGAMENTO
  avisoCarregamento: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    gap: 8,
  },

  auxiliar: {
    color: "#aaa",
    fontSize: 13,
  },

  // SCROLL
  scroll: {
    flex: 1,
  },

  conteudoScroll: {
    paddingBottom: 40,
  },

  // LABELS
  label: {
    color: "#ddd",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
    marginTop: 18,
  },

  // INPUTS
  input: {
    backgroundColor: "#333",
    color: "#fff",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 15,
    fontSize: 16,
    minHeight: 55,
  },

  // CEP
  linhaCep: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  inputCep: {
    flex: 1,
  },

  botaoCep: {
    backgroundColor: "#555",
    paddingHorizontal: 18,
    paddingVertical: 15,
    borderRadius: 12,
    minWidth: 90,
    minHeight: 55,
    alignItems: "center",
    justifyContent: "center",
  },

  textoBotaoCep: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },

  // SALVAR
  botaoSalvar: {
    backgroundColor: "#ff7a00",
    borderRadius: 14,
    padding: 17,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 30,
    marginBottom: 15,
    minHeight: 58,
  },

  textoSalvar: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
  },
});
