import axios from "axios";
import { router, useLocalSearchParams, type Href } from "expo-router";
import { zodResolver } from "@hookform/resolvers/zod";
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
  useWindowDimensions,
} from "react-native";
import AuthStoryPanel from "@/components/brand/AuthStoryPanel";
import { theme } from "@/theme";
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
  const { width } = useWindowDimensions();
  const [hydrated, setHydrated] = useState(Platform.OS !== "web");
  const layoutAmplo = hydrated && width >= 900;

  useEffect(() => {
    if (Platform.OS === "web") setHydrated(true);
  }, []);

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
        <View style={[styles.authLayout, layoutAmplo && styles.authLayoutWide]}>
          {layoutAmplo ? <AuthStoryPanel mode="login" /> : null}
          <View style={[styles.card, layoutAmplo && styles.cardWide]}>
          <Text style={styles.eyebrow}>BEM-VINDA DE VOLTA</Text>
          <Text style={styles.title}>Que bom ter você por aqui.</Text>
          <Text style={styles.subtitle}>
            Entre na sua conta e continue sua próxima história.
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
                  placeholderTextColor={theme.colors.muted}
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
                  placeholderTextColor={theme.colors.muted}
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
              <ActivityIndicator color={theme.colors.surface} />
            ) : (
              <Text style={styles.primaryButtonText}>Entrar</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityRole="link"
            disabled={submitting}
            onPress={() => router.push("/(auth)/esqueci-senha" as Href)}
            style={styles.forgotPasswordButton}
            activeOpacity={0.75}
          >
            <Text style={styles.link}>Esqueci minha senha</Text>
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
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.canvas },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "stretch",
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
  authLayout: { width: "100%", maxWidth: 1020, alignSelf: "center", alignItems: "center" },
  authLayoutWide: { flexDirection: "row", alignItems: "stretch", justifyContent: "center", gap: 26 },
  card: {
    width: "100%",
    maxWidth: 480,
    gap: 18,
    padding: 30,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  cardWide: { flex: 1, maxWidth: 470, justifyContent: "center" },
  eyebrow: { color: theme.colors.accent, fontSize: 9, fontWeight: "700", letterSpacing: 1.8 },
  title: { color: theme.colors.ink, fontFamily: theme.fonts.serif, fontSize: 31, lineHeight: 37, fontWeight: "400" },
  subtitle: { color: theme.colors.body, fontSize: 13, lineHeight: 20 },
  field: { gap: 6 },
  label: { color: theme.colors.ink, fontSize: 11, fontWeight: "600" },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: theme.colors.ink,
    backgroundColor: theme.colors.surface,
    fontSize: 13,
  },
  inputError: { borderColor: theme.colors.danger },
  fieldError: { color: theme.colors.danger, fontSize: 11 },
  errorNotice: {
    color: theme.colors.danger,
    backgroundColor: theme.colors.dangerSoft,
    borderRadius: 5,
    padding: 11,
    fontSize: 12,
    lineHeight: 18,
  },
  primaryButton: {
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 5,
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 18,
    marginTop: 4,
  },
  disabledButton: { opacity: 0.55 },
  primaryButtonText: { color: theme.colors.white, fontSize: 13, fontWeight: "700" },
  switchText: { color: theme.colors.body, fontSize: 12, textAlign: "center" },
  forgotPasswordButton: { alignSelf: "center", paddingVertical: 2 },
  link: { color: theme.colors.accent, fontWeight: "700" },
  backButton: { alignSelf: "center", paddingVertical: 4 },
  backButtonText: { color: theme.colors.muted, fontSize: 11, fontWeight: "600" },
});
