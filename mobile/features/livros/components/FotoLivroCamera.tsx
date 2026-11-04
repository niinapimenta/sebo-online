import {
  CameraView,
  useCameraPermissions,
  type CameraCapturedPicture,
} from "expo-camera";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export type FotoLivroArquivo = {
  uri: string;
  name: string;
  type: "image/jpeg" | "image/png";
  width: number;
  height: number;
};

type FotoLivroCameraProps = {
  onConfirm: (foto: FotoLivroArquivo) => void;
  onCancel: () => void;
};

type FotoCapturada = Pick<
  CameraCapturedPicture,
  "uri" | "width" | "height" | "format"
>;

export default function FotoLivroCamera({
  onConfirm,
  onCancel,
}: FotoLivroCameraProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [fotoCapturada, setFotoCapturada] = useState<FotoCapturada | null>(null);
  const [erroCamera, setErroCamera] = useState<string | null>(null);

  if (Platform.OS === "web") {
    return (
      <View style={styles.stateCard}>
        <Text style={styles.title}>Fotografe pelo aplicativo</Text>
        <Text style={styles.message}>
          Para enviar uma foto como arquivo, abra o Traça no aplicativo em um
          celular.
        </Text>
        <BotaoSecundario label="Voltar" onPress={onCancel} />
      </View>
    );
  }

  if (!permission) {
    return (
      <View style={styles.stateCard}>
        <ActivityIndicator size="large" color="#536b51" />
        <Text style={styles.message}>Verificando permissão da câmera…</Text>
        <BotaoSecundario label="Voltar" onPress={onCancel} />
      </View>
    );
  }

  if (!permission.granted) {
    const permissaoNegada = permission.status === "denied";

    return (
      <View style={styles.stateCard}>
        <Text style={styles.title}>
          {permissaoNegada ? "Acesso à câmera negado" : "Permita o acesso à câmera"}
        </Text>
        <Text style={styles.message}>
          O Traça precisa da câmera para fotografar a capa do livro. Você pode
          permitir o acesso nas configurações do celular.
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => {
            if (permission.canAskAgain) {
              void requestPermission();
            } else {
              void Linking.openSettings();
            }
          }}
          style={styles.primaryButton}
          activeOpacity={0.82}
        >
          <Text style={styles.primaryButtonText}>
            {permission.canAskAgain ? "Permitir acesso à câmera" : "Abrir configurações"}
          </Text>
        </TouchableOpacity>
        <BotaoSecundario label="Voltar" onPress={onCancel} />
      </View>
    );
  }

  async function capturarFoto() {
    if (!cameraRef.current || capturing || !cameraReady) return;

    setCapturing(true);
    setErroCamera(null);

    try {
      const foto = await cameraRef.current.takePictureAsync({ quality: 0.85 });

      setFotoCapturada({
        uri: foto.uri,
        width: foto.width,
        height: foto.height,
        format: foto.format,
      });
    } catch {
      setErroCamera("Não foi possível tirar a foto. Tente novamente.");
    } finally {
      setCapturing(false);
    }
  }

  function confirmarFoto() {
    if (!fotoCapturada) return;

    const extensao = fotoCapturada.format === "png" ? "png" : "jpg";

    onConfirm({
      uri: fotoCapturada.uri,
      name: `capa-livro-${Date.now()}.${extensao}`,
      type: extensao === "png" ? "image/png" : "image/jpeg",
      width: fotoCapturada.width,
      height: fotoCapturada.height,
    });
  }

  function tirarOutraFoto() {
    setFotoCapturada(null);
    setCameraReady(false);
    setErroCamera(null);
  }

  return (
    <View style={styles.card}>
      <View style={styles.heading}>
        <Text style={styles.title}>
          {fotoCapturada ? "Confira a capa" : "Fotografe a capa do livro"}
        </Text>
        <Text style={styles.message}>
          {fotoCapturada
            ? "Se a imagem estiver boa, confirme para continuar."
            : "Posicione a capa dentro da imagem e tire a foto."}
        </Text>
      </View>

      <View style={styles.imageFrame}>
        {fotoCapturada ? (
          <Image
            source={{ uri: fotoCapturada.uri }}
            style={styles.image}
            resizeMode="cover"
            accessibilityLabel="Prévia da foto da capa do livro"
          />
        ) : (
          <CameraView
            ref={cameraRef}
            style={styles.image}
            facing="back"
            mode="picture"
            onCameraReady={() => setCameraReady(true)}
          />
        )}
      </View>

      {erroCamera ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {erroCamera}
        </Text>
      ) : null}

      {!fotoCapturada && !cameraReady ? (
        <View style={styles.loading}>
          <ActivityIndicator size="small" color="#536b51" />
          <Text style={styles.message}>Preparando a câmera…</Text>
        </View>
      ) : null}

      {fotoCapturada ? (
        <View style={styles.actions}>
          <BotaoSecundario label="Tirar outra foto" onPress={tirarOutraFoto} />
          <TouchableOpacity
            accessibilityRole="button"
            onPress={confirmarFoto}
            style={styles.primaryButton}
            activeOpacity={0.82}
          >
            <Text style={styles.primaryButtonText}>Usar esta foto</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Fotografar capa do livro"
          onPress={() => void capturarFoto()}
          style={[
            styles.primaryButton,
            (!cameraReady || capturing) && styles.buttonDisabled,
          ]}
          disabled={!cameraReady || capturing}
          activeOpacity={0.82}
        >
          {capturing ? (
            <ActivityIndicator color="#fffdf8" />
          ) : (
            <Text style={styles.primaryButtonText}>Tirar foto</Text>
          )}
        </TouchableOpacity>
      )}

      <BotaoSecundario label="Voltar" onPress={onCancel} />
    </View>
  );
}

function BotaoSecundario({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      onPress={onPress}
      style={styles.secondaryButton}
      activeOpacity={0.82}
    >
      <Text style={styles.secondaryButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    maxWidth: 680,
    alignSelf: "center",
    gap: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e7dfd2",
    backgroundColor: "#fffdf8",
  },
  stateCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    backgroundColor: "#f5f1e8",
    padding: 24,
  },
  heading: {
    gap: 6,
  },
  title: {
    color: "#493b2a",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  message: {
    color: "#78664f",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  imageFrame: {
    width: "100%",
    aspectRatio: 3 / 4,
    overflow: "hidden",
    borderRadius: 12,
    backgroundColor: "#e9e0d1",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  loading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  actions: {
    gap: 10,
  },
  primaryButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    backgroundColor: "#536b51",
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    color: "#fffdf8",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  secondaryButton: {
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#c9d2c3",
    borderRadius: 9,
    paddingHorizontal: 14,
  },
  secondaryButtonText: {
    color: "#536b51",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  error: {
    color: "#8b3329",
    backgroundColor: "#f5e4df",
    borderRadius: 9,
    fontSize: 13,
    lineHeight: 19,
    padding: 12,
  },
});
