import axios from "axios";
import { router, useLocalSearchParams, type Href } from "expo-router";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { useLogin } from "../hooks/useLogin";
import {
  LoginSchema,
  type LoginFormData,
  type LoginFormValues,
} from "../types/AuthSchema";

function mensagemDoErro(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string; errors?: Record<string, string[]> }
      | undefined;
    const primeiroErro = data?.errors
      ? Object.values(data.errors).flat()[0]
      : undefined;

    if (primeiroErro) return primeiroErro;
    if (data?.message) return data.message;
    if (error.request) {
      return "Não foi possível conectar ao servidor. Verifique sua conexão.";
    }
  }

  return error instanceof Error
    ? error.message
    : "Não foi possível entrar. Tente novamente.";
}

export default function LoginScreen() {
  const loginMutation = useLogin();
  const params = useLocalSearchParams<{ returnTo?: string | string[] }>();
  const returnTo = Array.isArray(params.returnTo)
    ? params.returnTo[0]
    : params.returnTo;
  const destinoAposLogin: Href =
    returnTo === "/carrinho" ||
    returnTo === "/historico-compras" ||
    returnTo === "/meus-anuncios"
      ? returnTo
      : "/";
  const { control, handleSubmit } = useForm<
    LoginFormValues,
    unknown,
    LoginFormData
  >({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "" },
  });

  function onSubmit(values: LoginFormData) {
    loginMutation.mutate(values, {
      onSuccess: () => router.replace(destinoAposLogin),
    });
  }

  const submitting = loginMutation.isPending;

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
          <Text style={styles.brand}>traça</Text>
          <Text style={styles.eyebrow}>SEBO ONLINE</Text>
          <Text style={styles.title}>Que bom ter você de volta.</Text>
          <Text style={styles.subtitle}>
            Entre na sua conta para continuar cuidando dos seus livros.
          </Text>

          {loginMutation.isError ? (
            <Text accessibilityRole="alert" style={styles.errorNotice}>
              {mensagemDoErro(loginMutation.error)}
            </Text>
          ) : null}

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
                  keyboardType="email-address"
                  editable={!submitting}
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

          <Controller
            control={control}
            name="password"
            render={({ field, fieldState }) => (
              <View style={styles.field}>
                <Text style={styles.label}>Senha</Text>
                <TextInput
                  accessibilityLabel="Senha"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!submitting}
                  onBlur={field.onBlur}
                  onChangeText={field.onChange}
                  placeholder="Digite sua senha"
                  placeholderTextColor="#a39887"
                  secureTextEntry
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
            disabled={submitting}
            onPress={() => void handleSubmit(onSubmit)()}
            style={[styles.primaryButton, submitting && styles.disabledButton]}
            activeOpacity={0.82}
          >
            {submitting ? (
              <ActivityIndicator color="#fffdf8" />
            ) : (
              <Text style={styles.primaryButtonText}>Entrar</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.switchText}>
            Ainda não tem conta?{" "}
            <Text
              accessibilityRole="link"
              onPress={() => router.push("/(auth)/cadastro" as Href)}
              style={styles.link}
            >
              Criar conta
            </Text>
          </Text>

          <TouchableOpacity
            accessibilityRole="button"
            disabled={submitting}
            onPress={() => router.replace("/")}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>Voltar ao acervo</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    maxWidth: 480,
    gap: 16,
    padding: 26,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e7dfd2",
    backgroundColor: "#fffdf8",
  },
  brand: { color: "#493b2a", fontSize: 29, fontWeight: "800", letterSpacing: -1.5 },
  eyebrow: { color: "#9a684c", fontSize: 10, fontWeight: "800", letterSpacing: 2 },
  title: { color: "#493b2a", fontSize: 27, lineHeight: 33, fontWeight: "800" },
  subtitle: { color: "#78664f", fontSize: 14, lineHeight: 21 },
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
  errorNotice: {
    color: "#8b3329",
    backgroundColor: "#f5e4df",
    borderRadius: 9,
    padding: 12,
    fontSize: 13,
    lineHeight: 19,
  },
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
  switchText: { color: "#78664f", fontSize: 13, textAlign: "center" },
  link: { color: "#536b51", fontWeight: "800" },
  backButton: { alignSelf: "center", paddingVertical: 4 },
  backButtonText: { color: "#897b68", fontSize: 12, fontWeight: "600" },
});
