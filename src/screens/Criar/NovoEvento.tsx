import { useState } from 'react';
import {
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
import CampoImagem from '../../components/CampoImagem';
import BotaoPublicar from '../../components/BotaoPublicar';

const LIMITE_TITULO = 20;

// Transforma um Date em "31/12/2026"
function formatarData(data: Date) {
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const ano = data.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

type Props = {
  onPublicado: () => void;
};

export default function NovoEvento({ onPublicado }: Props) {
  const [imagem, setImagem] = useState<string | null>(null);
  const [titulo, setTitulo] = useState('');
  const [data, setData] = useState<Date | null>(null);
  const [calendarioAberto, setCalendarioAberto] = useState(false);
  const [dataTemporaria, setDataTemporaria] = useState(new Date());

  const podePublicar =
    imagem !== null && titulo.trim().length > 0 && data !== null;

  function abrirCalendario() {
    setDataTemporaria(data ?? new Date());
    setCalendarioAberto(true);
  }

  // Android: o calendário nativo fecha sozinho ao escolher
  function aoEscolherNoAndroid(evento: DateTimePickerEvent, escolhida?: Date) {
    setCalendarioAberto(false);
    if (evento.type === 'set' && escolhida) {
      setData(escolhida);
    }
  }

  // iPhone: confirma pelo botão OK
  function confirmarNoIos() {
    setData(dataTemporaria);
    setCalendarioAberto(false);
  }

  function publicar() {
    // TODO: enviar { imagem, titulo, data } para o backend
    onPublicado();
  }

  return (
    <View>
      <CampoImagem uri={imagem} onChange={setImagem} />

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

      {/* A caixa só mostra a data. Quem abre o calendário é o ícone */}
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

      {/* Android */}
      {calendarioAberto && Platform.OS === 'android' && (
        <DateTimePicker
          value={data ?? new Date()}
          mode="date"
          minimumDate={new Date()}
          onChange={aoEscolherNoAndroid}
        />
      )}

      {/* iPhone */}
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
                  if (escolhida) setDataTemporaria(escolhida);
                }}
              />

              <View style={styles.modalBotoes}>
                <Pressable onPress={() => setCalendarioAberto(false)}>
                  <Text style={styles.modalCancelar}>CANCELAR</Text>
                </Pressable>
                <Pressable onPress={confirmarNoIos}>
                  <Text style={styles.modalOk}>OK</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}

      <BotaoPublicar onPress={publicar} desabilitado={!podePublicar} />
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
  input: { color: '#fff', fontSize: 14 },
  contador: {
    position: 'absolute',
    right: 14,
    bottom: 4,
    color: '#bbb',
    fontSize: 9,
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
  dataTexto: { color: '#fff', fontSize: 12 },
  dataVazia: { color: '#777', fontSize: 12 },
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
  modalCancelar: { color: '#777', fontWeight: '700', fontSize: 13 },
  modalOk: { color: '#ff7a00', fontWeight: '800', fontSize: 13 },
});