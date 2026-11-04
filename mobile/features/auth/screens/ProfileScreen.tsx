import { zodResolver } from "@hookform/resolvers/zod";
import { router, type Href } from "expo-router";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { mensagemErroApi } from "@/services/apiError";
import { useCurrentUser, authApiConfigurada } from "../hooks/useCurrentUser";
import { useUpdateProfile } from "../hooks/useUpdateProfile";
import {
  ProfileUpdateSchema,
  type ProfileUpdateData,
  type ProfileUpdateFormValues,
} from "../types/AuthSchema";

export default function ProfileScreen() {
  const usuarioAtual = useCurrentUser();
  const atualizacao = useUpdateProfile();
  const [salvo, setSalvo] = useState(false);
  const { control, handleSubmit, reset } = useForm<
    ProfileUpdateFormValues,
    unknown,
    ProfileUpdateData
  >({
    resolver: zodResolver(ProfileUpdateSchema),
    defaultValues: { name: "", email: "" },
  });

  useEffect(() => {
    if (!usuarioAtual.data) return;

    reset({
      name: usuarioAtual.data.name,
      email: usuarioAtual.data.email,
    });
  }, [reset, usuarioAtual.data]);

  function salvarPerfil(values: ProfileUpdateData) {
    setSalvo(false);
    atualizacao.mutate(values, {
      onSuccess: () => setSalvo(true),
    });
  }

  if (!authApiConfigurada) {
    return (
      <Estado mensagem="A edição do perfil depende da conexão com o backend Laravel. A API não está configurada neste aplicativo." />
    );
  }

  if (usuarioAtual.isPending || usuarioAtual.isFetching) {
    return (
      <View style={styles.state}>
        <ActivityIndicator size="large" color="#536b51" />
        <Text style={styles.stateText}>Carregando seu perfil…</Text>
      </View>
    );
  }

  if (usuarioAtual.isError || !usuarioAtual.data) {
    return (
      <View style={styles.state}>
        <Text style={styles.stateTitle}>Perfil indisponível</Text>
        <Text style={styles.stateText} accessibilityRole="alert">
          Não foi possível carregar seus dados. Tente novamente.
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => void usuarioAtual.refetch()}
          style={styles.secondaryButton}
          activeOpacity={0.82}
        >
          <Text style={styles.secondaryButtonText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const erroAtualizacao = mensagemErroApi(atualizacao.error);

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.eyebrow}>SUA CONTA</Text>
          <Text style={styles.title}>Editar perfil</Text>
          <Text style={styles.subtitle}>
            Atualize seu nome e e-mail de acesso.
          </Text>

          <TouchableOpacity
            accessibilityRole="link"
            onPress={() => router.push("/meus-anuncios" as Href)}
            style={styles.historyLink}
            activeOpacity={0.75}
          >
            <Text style={styles.historyLinkText}>Meus anúncios</Text>
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityRole="link"
            onPress={() => router.push("/historico-compras" as Href)}
            style={styles.historyLink}
            activeOpacity={0.75}
          >
            <Text style={styles.historyLinkText}>Consultar histórico de compras</Text>
          </TouchableOpacity>

          {salvo ? (
            <Text accessibilityRole="status" style={styles.successNotice}>
              Perfil atualizado com sucesso.
            </Text>
          ) : null}
          {atualizacao.isError ? (
            <Text accessibilityRole="alert" style={styles.errorNotice}>
              {erroAtualizacao ?? "Não foi possível atualizar seu perfil. Tente novamente."}
            </Text>
          ) : null}

          <Controller
            control={control}
            name="name"
            render={({ field, fieldState }) => (
              <View style={styles.field}>
                <Text style={styles.label}>Nome</Text>
                <TextInput
                  accessibilityLabel="Nome"
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!atualizacao.isPending}
                  onBlur={field.onBlur}
                  onChangeText={field.onChange}
                  placeholder="Seu nome"
                  placeholderTextColor="#a39887"
                  style={[styles.input, fieldState.error && styles.inputError]}
                  value={field.value}
                />
                {fieldState.error?.message ? (
                  <Text style={styles.fieldError}>{fieldState.error.message}</Text>
                ) : null}
              </View>
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field, fieldState }) => (
              <View style={styles.field}>
                <Text style={styles.label}>E-mail</Text>
                <TextInput
                  accessibilityLabel="E-mail"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!atualizacao.isPending}
                  keyboardType="email-address"
                  onBlur={field.onBlur}
                  onChangeText={field.onChange}
                  placeholder="voce@exemplo.com"
                  placeholderTextColor="#a39887"
                  style={[styles.input, fieldState.error && styles.inputError]}
                  value={field.value}
                />
                {fieldState.error?.message ? (
                  <Text style={styles.fieldError}>{fieldState.error.message}</Text>
                ) : null}
              </View>
            )}
          />

          <TouchableOpacity
            accessibilityRole="button"
            disabled={atualizacao.isPending}
            onPress={() => void handleSubmit(salvarPerfil)()}
            style={[
              styles.primaryButton,
              atualizacao.isPending && styles.disabledButton,
            ]}
            activeOpacity={0.82}
          >
            {atualizacao.isPending ? (
              <ActivityIndicator color="#fffdf8" />
            ) : (
              <Text style={styles.primaryButtonText}>Salvar alterações</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.82}
          >
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Estado({ mensagem }: { mensagem: string }) {
  return (
    <View style={styles.state}>
      <Text style={styles.stateTitle}>Perfil indisponível</Text>
      <Text style={styles.stateText}>{mensagem}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f5f1e8" },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 520,
    gap: 16,
    padding: 26,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e7dfd2",
    backgroundColor: "#fffdf8",
  },
  eyebrow: { color: "#9a684c", fontSize: 10, fontWeight: "800", letterSpacing: 2 },
  title: { color: "#493b2a", fontSize: 27, fontWeight: "800" },
  subtitle: { color: "#78664f", fontSize: 14, lineHeight: 21 },
  historyLink: { alignSelf: "flex-start", paddingVertical: 3 },
  historyLinkText: { color: "#536b51", fontSize: 13, fontWeight: "700", textDecorationLine: "underline" },
  field: { gap: 6 },
  label: { color: "#5d4e3d", fontSize: 13, fontWeight: "600" },
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
  inputError: { borderColor: "#b34e3e" },
  fieldError: { color: "#a13e32", fontSize: 12 },
  primaryButton: {
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: "#536b51",
    paddingHorizontal: 18,
    marginTop: 4,
  },
  disabledButton: { opacity: 0.55 },
  primaryButtonText: { color: "#fffdf8", fontSize: 15, fontWeight: "700" },
  backButton: { alignSelf: "center", paddingVertical: 4 },
  backButtonText: { color: "#897b68", fontSize: 12, fontWeight: "600" },
  secondaryButton: {
    minHeight: 42,
    justifyContent: "center",
    marginTop: 4,
    paddingHorizontal: 16,
    borderRadius: 9,
    backgroundColor: "#536b51",
  },
  secondaryButtonText: { color: "#fffdf8", fontSize: 13, fontWeight: "700" },
  successNotice: {
    color: "#436243",
    backgroundColor: "#e7efe3",
    borderRadius: 9,
    padding: 12,
    fontSize: 13,
    lineHeight: 19,
  },
  errorNotice: {
    color: "#8b3329",
    backgroundColor: "#f5e4df",
    borderRadius: 9,
    padding: 12,
    fontSize: 13,
    lineHeight: 19,
  },
  state: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "#f5f1e8",
    padding: 24,
  },
  stateTitle: { color: "#493b2a", fontSize: 19, fontWeight: "700", textAlign: "center" },
  stateText: { color: "#78664f", fontSize: 14, lineHeight: 21, textAlign: "center" },
});
