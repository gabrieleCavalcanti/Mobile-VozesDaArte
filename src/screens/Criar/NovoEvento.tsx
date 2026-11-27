
import { useRef, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  KeyboardTypeOptions,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';

import { File } from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

import CampoImagem from '../../components/CampoImagem';
import BotaoPublicar from '../../components/BotaoPublicar';
import { apiPostFormData } from '../../api/api';

const LIMITE_TITULO = 20;

function formatarData(data: Date) {
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const ano = data.getFullYear();

  return `${dia}/${mes}/${ano}`;
}

function formatarCep(cep: string) {
  if (cep.length > 5) {
    return `${cep.slice(0, 5)}-${cep.slice(5)}`;
  }

  return cep;
}

type Props = {
  onPublicado: () => void;
};

type CampoProps = {
  valor: string;
  placeholder: string;
  onChange: (texto: string) => void;
  teclado?: KeyboardTypeOptions;
  multiline?: boolean;
};

function CampoTexto({
  valor,
  placeholder,
  onChange,
  teclado = 'default',
  multiline = false,
}: CampoProps) {
  return (
    <TextInput
      style={[styles.input, multiline && styles.inputGrande]}
      value={valor}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor="#999"
      keyboardType={teclado}
      multiline={multiline}
      textAlignVertical={multiline ? 'top' : 'center'}
    />
  );
}

export default function NovoEvento({ onPublicado }: Props) {
  // IMAGEM
  const [imagem, setImagem] = useState<string | null>(null);

  // INFORMAÇÕES DO EVENTO
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');

  // ENDEREÇO
  const [cep, setCep] = useState('');
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [uf, setUf] = useState('');
  const [estado, setEstado] = useState('');
  const [cidade, setCidade] = useState('');
  const [bairro, setBairro] = useState('');

  const [enderecoVisivel, setEnderecoVisivel] = useState(false);
  const [consultandoCep, setConsultandoCep] = useState(false);
  const [erroCep, setErroCep] = useState('');

  const consultaAtual = useRef(0);

  // DATA
  const [data, setData] = useState<Date | null>(null);
  const [calendarioAberto, setCalendarioAberto] = useState(false);
  const [dataTemporaria, setDataTemporaria] = useState(new Date());

  const [publicando, setPublicando] = useState(false);

  const podePublicar =
    imagem !== null &&
    titulo.trim().length >= 2 &&
    descricao.trim().length > 0 &&
    valor.trim() !== '' &&
    Number.isFinite(Number(valor.replace(',', '.'))) &&
    Number(valor.replace(',', '.')) >= 0 &&
    data !== null &&
    cep.length === 8 &&
    rua.trim() !== '' &&
    numero.trim() !== '' &&
    uf.trim() !== '' &&
    estado.trim() !== '' &&
    cidade.trim() !== '' &&
    bairro.trim() !== '' &&
    !consultandoCep;

  // CONSULTAR VIACEP
  async function consultarCep(valorCep: string) {
    const cepLimpo = valorCep.replace(/\D/g, '');

    if (cepLimpo.length !== 8) return;

    const consulta = ++consultaAtual.current;

    setConsultandoCep(true);
    setErroCep('');
    setEnderecoVisivel(true);

    try {
      const resposta = await fetch(
        `https://viacep.com.br/ws/${cepLimpo}/json/`
      );

      if (!resposta.ok) {
        throw new Error('Não foi possível consultar o CEP.');
      }

      const resultado = await resposta.json();

      if (consulta !== consultaAtual.current) return;

      if (resultado.erro) {
        setErroCep(
          'CEP não encontrado. Preencha o endereço manualmente.'
        );

        setRua('');
        setBairro('');
        setCidade('');
        setEstado('');
        setUf('');

        return;
      }

      setRua(resultado.logradouro || '');
      setBairro(resultado.bairro || '');
      setCidade(resultado.localidade || '');
      setEstado(resultado.estado || '');
      setUf(resultado.uf || '');

      setErroCep('');
    } catch (erro) {
      if (consulta !== consultaAtual.current) return;

      console.error('ERRO AO CONSULTAR CEP:', erro);

      setErroCep(
        'Não foi possível consultar o CEP. Preencha o endereço manualmente.'
      );
    } finally {
      if (consulta === consultaAtual.current) {
        setConsultandoCep(false);
      }
    }
  }

  function alterarCep(texto: string) {
    const cepLimpo = texto.replace(/\D/g, '').slice(0, 8);

    setCep(cepLimpo);

    // Invalida consultas anteriores.
    consultaAtual.current++;

    setErroCep('');
    setConsultandoCep(false);

    if (cepLimpo.length < 8) {
      setEnderecoVisivel(false);

      setRua('');
      setBairro('');
      setCidade('');
      setEstado('');
      setUf('');

      return;
    }

    setEnderecoVisivel(true);
    consultarCep(cepLimpo);
  }

  // CALENDÁRIO
  function abrirCalendario() {
    setDataTemporaria(data ?? new Date());
    setCalendarioAberto(true);
  }

  function aoEscolherNoAndroid(
    evento: DateTimePickerEvent,
    escolhida?: Date,
  ) {
    setCalendarioAberto(false);

    if (evento.type === 'set' && escolhida) {
      setData(escolhida);
    }
  }

  function confirmarNoIos() {
    setData(dataTemporaria);
    setCalendarioAberto(false);
  }

  // PUBLICAR EVENTO
  async function publicar() {
    if (!podePublicar || !imagem || !data) return;

    try {
      setPublicando(true);

      const formData = new FormData();

      formData.append('titulo', titulo.trim());
      formData.append('descricao', descricao.trim());

      const valorNumerico = Number(valor.replace(',', '.'));

      formData.append('valor', String(valorNumerico));

      // Mantém a data local, sem alterar o dia por causa do fuso horário.
      const ano = data.getFullYear();
      const mes = String(data.getMonth() + 1).padStart(2, '0');
      const dia = String(data.getDate()).padStart(2, '0');

      formData.append(
        'data_hora',
        `${ano}-${mes}-${dia}T12:00:00`
      );

      // ENDEREÇO
      formData.append('cep', cep);
      formData.append('rua', rua.trim());
      formData.append('numero', numero.trim());
      formData.append('complemento', complemento.trim());
      formData.append('uf', uf.trim().toUpperCase());
      formData.append('estado', estado.trim());
      formData.append('cidade', cidade.trim());
      formData.append('bairro', bairro.trim());

      // CONVERTER IMAGEM PARA JPEG
      const imagemConvertida =
        await ImageManipulator.manipulateAsync(
          imagem,
          [],
          {
            compress: 0.8,
            format: ImageManipulator.SaveFormat.JPEG,
          }
        );

      const arquivo = new File(imagemConvertida.uri);

      formData.append('image', arquivo);

      // ENVIAR PARA A API
      await apiPostFormData('/eventos', formData);

      Alert.alert(
        'Sucesso!',
        'Evento publicado com sucesso.'
      );

      // LIMPAR CAMPOS
      setImagem(null);
      setTitulo('');
      setDescricao('');
      setValor('');
      setData(null);

      setCep('');
      setRua('');
      setNumero('');
      setComplemento('');
      setUf('');
      setEstado('');
      setCidade('');
      setBairro('');

      setEnderecoVisivel(false);
      setErroCep('');

      onPublicado();

    } catch (erro) {
      console.error('ERRO AO PUBLICAR EVENTO:', erro);

      Alert.alert(
        'Erro',
        erro instanceof Error
          ? erro.message
          : 'Não foi possível publicar o evento.'
      );
    } finally {
      setPublicando(false);
    }
  }

  return (
    <View>
      {/* IMAGEM */}
      <CampoImagem
        uri={imagem}
        onChange={setImagem}
      />

      {/* TÍTULO */}
      <View style={styles.campo}>
        <TextInput
          style={styles.input}
          value={titulo}
          onChangeText={setTitulo}
          maxLength={LIMITE_TITULO}
          placeholder="Insira um título."
          placeholderTextColor="#999"
        />

        <Text style={styles.contador}>
          {titulo.length}/{LIMITE_TITULO}
        </Text>
      </View>

      {/* DESCRIÇÃO */}
      <Text style={styles.label}>Descrição</Text>

      <View style={styles.campo}>
        <CampoTexto
          valor={descricao}
          onChange={setDescricao}
          placeholder="Descreva seu evento."
          multiline
        />
      </View>

      {/* VALOR */}
      <Text style={styles.label}>Valor do evento (R$)</Text>

      <View style={styles.campo}>
        <CampoTexto
          valor={valor}
          onChange={setValor}
          placeholder="Ex.: 25,00"
          teclado="decimal-pad"
        />
      </View>

      {/* DATA */}
      <Text style={styles.label}>Data do evento</Text>

      <View style={styles.linhaData}>
        <View style={styles.caixaData}>
          <Text style={data ? styles.dataTexto : styles.dataVazia}>
            {data ? formatarData(data) : 'DD/MM/AAAA'}
          </Text>
        </View>

        <Pressable onPress={abrirCalendario} hitSlop={12}>
          <Ionicons name="calendar" size={30} color="#fff" />
        </Pressable>
      </View>

      {/* CALENDÁRIO ANDROID */}
      {calendarioAberto && Platform.OS === 'android' && (
        <DateTimePicker
          value={data ?? new Date()}
          mode="date"
          minimumDate={new Date()}
          onChange={aoEscolherNoAndroid}
        />
      )}

      {/* CALENDÁRIO IOS */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={calendarioAberto}
          transparent
          animationType="fade"
          onRequestClose={() => setCalendarioAberto(false)}
        >
          <View style={styles.modalFundo}>
            <View style={styles.modalCartao}>
              <DateTimePicker
                value={dataTemporaria}
                mode="date"
                display="inline"
                themeVariant="light"
                minimumDate={new Date()}
                onChange={(_, escolhida) => {
                  if (escolhida) {
                    setDataTemporaria(escolhida);
                  }
                }}
              />

              <View style={styles.modalBotoes}>
                <Pressable
                  onPress={() => setCalendarioAberto(false)}
                >
                  <Text style={styles.modalCancelar}>
                    CANCELAR
                  </Text>
                </Pressable>

                <Pressable onPress={confirmarNoIos}>
                  <Text style={styles.modalOk}>OK</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* ENDEREÇO */}
      <Text style={styles.tituloSecao}>
        Endereço do evento
      </Text>

      {/* CEP */}
      <Text style={styles.label}>CEP</Text>

      <View style={styles.campo}>
        <TextInput
          style={styles.input}
          value={formatarCep(cep)}
          onChangeText={alterarCep}
          placeholder="Digite o CEP"
          placeholderTextColor="#999"
          keyboardType="numeric"
          maxLength={9}
        />
      </View>

      {/* CARREGAMENTO */}
      {consultandoCep && (
        <View style={styles.carregandoCep}>
          <ActivityIndicator color="#ff7a00" />

          <Text style={styles.textoCarregando}>
            Consultando CEP...
          </Text>
        </View>
      )}

      {/* ERRO */}
      {erroCep !== '' && (
        <Text style={styles.erroCep}>
          {erroCep}
        </Text>
      )}

      {/* CAMPOS DO ENDEREÇO */}
      {enderecoVisivel && (
        <View>
          <Text style={styles.label}>Rua</Text>

          <View style={styles.campo}>
            <CampoTexto
              valor={rua}
              onChange={setRua}
              placeholder="Rua"
            />
          </View>

          <Text style={styles.label}>Bairro</Text>

          <View style={styles.campo}>
            <CampoTexto
              valor={bairro}
              onChange={setBairro}
              placeholder="Bairro"
            />
          </View>

          <Text style={styles.label}>Cidade</Text>

          <View style={styles.campo}>
            <CampoTexto
              valor={cidade}
              onChange={setCidade}
              placeholder="Cidade"
            />
          </View>

          <View style={styles.linhaCampos}>
            <View style={styles.campoFlex}>
              <Text style={styles.label}>Estado</Text>

              <View style={styles.campo}>
                <CampoTexto
                  valor={estado}
                  onChange={setEstado}
                  placeholder="Estado"
                />
              </View>
            </View>

            <View style={styles.campoFlex}>
              <Text style={styles.label}>UF</Text>

              <View style={styles.campo}>
                <CampoTexto
                  valor={uf}
                  onChange={setUf}
                  placeholder="UF"
                />
              </View>
            </View>
          </View>

          <Text style={styles.label}>Número</Text>

          <View style={styles.campo}>
            <CampoTexto
              valor={numero}
              onChange={setNumero}
              placeholder="Número"
            />
          </View>

          <Text style={styles.label}>
            Complemento (opcional)
          </Text>

          <View style={styles.campo}>
            <CampoTexto
              valor={complemento}
              onChange={setComplemento}
              placeholder="Apartamento, bloco..."
            />
          </View>
        </View>
      )}

      {/* BOTÃO PUBLICAR */}
      <BotaoPublicar
        onPress={publicar}
        desabilitado={!podePublicar || publicando}
      />
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
    paddingVertical: 12,
    marginBottom: 12,
  },

  input: {
    color: '#fff',
    fontSize: 14,
    padding: 0,
  },

  inputGrande: {
    minHeight: 90,
  },

  contador: {
    position: 'absolute',
    right: 14,
    bottom: 4,
    color: '#bbb',
    fontSize: 9,
  },

  label: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 5,
  },

  tituloSecao: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 14,
  },

  linhaData: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },

  caixaData: {
    backgroundColor: '#181818',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 120,
  },

  dataTexto: {
    color: '#fff',
    fontSize: 12,
  },

  dataVazia: {
    color: '#777',
    fontSize: 12,
  },

  linhaCampos: {
    flexDirection: 'row',
    gap: 10,
  },

  campoFlex: {
    flex: 1,
  },

  carregandoCep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
    marginLeft: 5,
  },

  textoCarregando: {
    color: '#bbb',
    fontSize: 12,
  },

  erroCep: {
    color: '#ff7a7a',
    fontSize: 12,
    marginBottom: 12,
    marginLeft: 5,
  },

  modalFundo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },

  modalCartao: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 16,
    width: '100%',
  },

  modalBotoes: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 28,
    paddingTop: 8,
    paddingRight: 8,
  },

  modalCancelar: {
    color: '#777',
    fontWeight: '700',
    fontSize: 13,
  },

  modalOk: {
    color: '#ff7a00',
    fontWeight: '800',
    fontSize: 13,
  },
});
