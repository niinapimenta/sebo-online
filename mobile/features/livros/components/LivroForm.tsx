import { zodResolver } from "@hookform/resolvers/zod";
import {
  Controller,
  useForm,
  type Control,
  type FieldPath,
} from "react-hook-form";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  LivroSchema,
  type LivroCreateData,
  type LivroFormValues,
} from "../types/LivroSchema";
import FotoLivroCamera, { type FotoLivroArquivo } from "./FotoLivroCamera";

type LivroFormProps = {
  onSubmit: (data: LivroCreateData, foto?: FotoLivroArquivo) => void;
  isSubmitting: boolean;
  apiConfigurada: boolean;
  initialData?: LivroFormValues;
  erroEnvio?: string;
  submitLabel?: string;
  connectionMessage?: string;
};

type CampoProps = {
  control: Control<LivroFormValues, unknown, LivroCreateData>;
  name: FieldPath<LivroFormValues>;
  label: string;
  placeholder: string;
  keyboardType?: "default" | "decimal-pad" | "numeric";
  multiline?: boolean;
};

function CampoTexto({
  control,
  name,
  label,
  placeholder,
  keyboardType = "default",
  multiline = false,
}: CampoProps) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onBlur, onChange, value }, fieldState }) => (
        <View style={styles.field}>
          <Text style={styles.label}>{label}</Text>
          <TextInput
            accessibilityLabel={label}
            style={[
              styles.input,
              multiline && styles.multilineInput,
              fieldState.error && styles.inputError,
            ]}
            placeholder={placeholder}
            placeholderTextColor="#a39887"
            value={typeof value === "string" ? value : ""}
            onBlur={onBlur}
            onChangeText={onChange}
            keyboardType={keyboardType}
            multiline={multiline}
            textAlignVertical={multiline ? "top" : "center"}
            autoCapitalize={name === "data_publicacao" ? "none" : "sentences"}
          />
          {fieldState.error?.message ? (
            <Text style={styles.errorText}>{fieldState.error.message}</Text>
          ) : null}
        </View>
      )}
    />
  );
}

export default function LivroForm({
  onSubmit,
  isSubmitting,
  apiConfigurada,
  initialData,
  erroEnvio,
  submitLabel = "Cadastrar livro",
  connectionMessage = "O cadastro depende da conexão com o backend Laravel. A API ainda não está configurada neste aplicativo.",
}: LivroFormProps) {
  const [cameraAberta, setCameraAberta] = useState(false);
  const [fotoSelecionada, setFotoSelecionada] =
    useState<FotoLivroArquivo | null>(null);
  const { control, handleSubmit } = useForm<
    LivroFormValues,
    unknown,
    LivroCreateData
  >({
    resolver: zodResolver(LivroSchema),
    defaultValues: initialData ?? {
      titulo: "",
      autor: "",
      editora: "",
      preco: "",
      estoque: "",
      ano_publicacao: "",
      data_publicacao: "",
      descricao: "",
    },
  });

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Informações do livro</Text>
        <Text style={styles.formHint}>Os campos marcados com * são obrigatórios.</Text>

        <CampoTexto
          control={control}
          name="titulo"
          label="Título *"
          placeholder="Ex.: A hora da estrela"
        />
        <CampoTexto
          control={control}
          name="autor"
          label="Autor *"
          placeholder="Nome do autor"
        />
        <CampoTexto
          control={control}
          name="editora"
          label="Editora"
          placeholder="Nome da editora (opcional)"
        />
        <View style={styles.row}>
          <View style={styles.halfField}>
            <CampoTexto
              control={control}
              name="preco"
              label="Preço (R$) *"
              placeholder="0,00"
              keyboardType="decimal-pad"
            />
          </View>
          <View style={styles.halfField}>
            <CampoTexto
              control={control}
              name="estoque"
              label="Estoque *"
              placeholder="0"
              keyboardType="numeric"
            />
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.halfField}>
            <CampoTexto
              control={control}
              name="ano_publicacao"
              label="Ano de publicação *"
              placeholder="AAAA"
              keyboardType="numeric"
            />
          </View>
          <View style={styles.halfField}>
            <CampoTexto
              control={control}
              name="data_publicacao"
              label="Data de publicação *"
              placeholder="AAAA-MM-DD"
            />
          </View>
        </View>
        <CampoTexto
          control={control}
          name="descricao"
          label="Descrição"
          placeholder="Conte um pouco sobre este exemplar (opcional)"
          multiline
        />

        <View style={styles.photoSection}>
          <Text style={styles.label}>Foto da capa (opcional)</Text>
          {cameraAberta ? (
            <FotoLivroCamera
              onConfirm={(foto) => {
                setFotoSelecionada(foto);
                setCameraAberta(false);
              }}
              onCancel={() => setCameraAberta(false)}
            />
          ) : (
            <>
              {fotoSelecionada ? (
                <Image
                  source={{ uri: fotoSelecionada.uri }}
                  style={styles.photoPreview}
                  resizeMode="cover"
                  accessibilityLabel="Prévia da foto selecionada para a capa"
                />
              ) : (
                <Text style={styles.photoHint}>Nenhuma foto selecionada.</Text>
              )}
              <View style={styles.photoActions}>
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={() => setCameraAberta(true)}
                  style={styles.photoButton}
                  activeOpacity={0.82}
                >
                  <Text style={styles.photoButtonText}>
                    {fotoSelecionada ? "Tirar outra foto" : "Tirar foto da capa"}
                  </Text>
                </TouchableOpacity>
                {fotoSelecionada ? (
                  <TouchableOpacity
                    accessibilityRole="button"
                    onPress={() => setFotoSelecionada(null)}
                    style={styles.removePhotoButton}
                    activeOpacity={0.82}
                  >
                    <Text style={styles.removePhotoButtonText}>Remover foto</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              {fotoSelecionada ? (
                <Text style={styles.photoHint}>
                  A foto será enviada junto com os dados do livro.
                </Text>
              ) : null}
            </>
          )}
        </View>

        {!apiConfigurada ? (
          <Text style={styles.connectionNotice}>{connectionMessage}</Text>
        ) : null}
        {erroEnvio ? (
          <Text accessibilityRole="alert" style={styles.submitError}>
            Não foi possível enviar os dados: {erroEnvio}
          </Text>
        ) : null}

        <TouchableOpacity
          accessibilityRole="button"
          style={[
            styles.submitButton,
            (isSubmitting || !apiConfigurada) && styles.submitButtonDisabled,
          ]}
          onPress={() => {
            void handleSubmit((data) =>
              onSubmit(data, fotoSelecionada ?? undefined),
            )();
          }}
          disabled={isSubmitting || !apiConfigurada}
          activeOpacity={0.82}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fffdf8" />
          ) : (
            <Text style={styles.submitButtonText}>{submitLabel}</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: "#f5f1e8",
  },
  container: {
    alignItems: "center",
    padding: 20,
    paddingBottom: 40,
  },
  formCard: {
    width: "100%",
    maxWidth: 680,
    gap: 16,
    padding: 22,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e7dfd2",
    backgroundColor: "#fffdf8",
  },
  formTitle: {
    color: "#493b2a",
    fontSize: 21,
    fontWeight: "700",
  },
  formHint: {
    color: "#897b68",
    fontSize: 12,
    marginTop: -10,
  },
  photoSection: {
    gap: 10,
  },
  photoPreview: {
    width: 180,
    height: 240,
    alignSelf: "center",
    borderRadius: 9,
    backgroundColor: "#e9e0d1",
  },
  photoHint: {
    color: "#897b68",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  photoActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  photoButton: {
    minHeight: 42,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    backgroundColor: "#536b51",
    paddingHorizontal: 14,
  },
  photoButtonText: {
    color: "#fffdf8",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  removePhotoButton: {
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e1c5bf",
    borderRadius: 9,
    paddingHorizontal: 14,
  },
  removePhotoButtonText: {
    color: "#9b463b",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  field: {
    flex: 1,
    gap: 6,
  },
  label: {
    color: "#5d4e3d",
    fontSize: 13,
    fontWeight: "600",
  },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: "#d9d0c2",
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#493b2a",
    backgroundColor: "#fffefa",
    fontSize: 15,
  },
  multilineInput: {
    minHeight: 100,
    paddingTop: 12,
  },
  inputError: {
    borderColor: "#b34e3e",
  },
  errorText: {
    color: "#a13e32",
    fontSize: 12,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  connectionNotice: {
    color: "#705b43",
    backgroundColor: "#f1e8d9",
    borderRadius: 9,
    fontSize: 13,
    lineHeight: 19,
    padding: 12,
  },
  submitError: {
    color: "#8b3329",
    backgroundColor: "#f5e4df",
    borderRadius: 9,
    fontSize: 13,
    lineHeight: 19,
    padding: 12,
  },
  submitButton: {
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: "#536b51",
    paddingHorizontal: 18,
    marginTop: 2,
  },
  submitButtonDisabled: {
    opacity: 0.55,
  },
  submitButtonText: {
    color: "#fffdf8",
    fontSize: 15,
    fontWeight: "700",
  },
});
