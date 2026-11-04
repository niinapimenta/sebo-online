import axios from "axios";
import { router, type Href } from "expo-router";
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
  useWindowDimensions,
} from "react-native";
import AuthStoryPanel from "@/components/brand/AuthStoryPanel";
import { theme } from "@/theme";
import { useRegister } from "../hooks/useRegister";
import {
  RegisterSchema,
  type RegisterFormData,
  type RegisterFormValues,
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
    : "Não foi possível criar a conta. Tente novamente.";
}

export default function RegisterScreen() {
  const { width } = useWindowDimensions();
  const layoutAmplo = width >= 900;
  const registerMutation = useRegister();
  const { control, handleSubmit, reset } = useForm<
    RegisterFormValues,
    unknown,
    RegisterFormData
  >({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      password_confirmation: "",
    },
  });

  function onSubmit(values: RegisterFormData) {
    registerMutation.mutate(values, {
      onSuccess: () => reset(),
    });
  }

  const submitting = registerMutation.isPending;

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
          {layoutAmplo ? <AuthStoryPanel mode="register" /> : null}
          <View style={[styles.card, layoutAmplo && styles.cardWide]}>
          <View style={styles.tabs}>
            <View style={styles.activeTab}><Text style={styles.activeTabText}>Criar conta</Text></View>
            <TouchableOpacity accessibilityRole="link" onPress={() => router.push("/(auth)/login" as Href)} style={styles.inactiveTab}>
              <Text style={styles.inactiveTabText}>Entrar</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.eyebrow}>SUA PRÓXIMA HISTÓRIA COMEÇA AQUI</Text>
          <Text style={styles.title}>O próximo capítulo é seu.</Text>
          <Text style={styles.subtitle}>
            Um só lugar para descobrir, comprar e vender livros.
          </Text>

          {registerMutation.isSuccess ? (
            <Text accessibilityRole="status" style={styles.successNotice}>
              Conta criada. Agora entre com seu e-mail e sua senha.
            </Text>
          ) : null}
          {registerMutation.isError ? (
            <Text accessibilityRole="alert" style={styles.errorNotice}>
              {mensagemDoErro(registerMutation.error)}
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
                  editable={!submitting}
                  onBlur={field.onBlur}
                  onChangeText={field.onChange}
                  placeholder="Seu nome"
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
                  placeholder="Mínimo de 8 caracteres"
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

          <Controller
            control={control}
            name="password_confirmation"
            render={({ field, fieldState }) => (
              <View style={styles.field}>
                <Text style={styles.label}>Confirme sua senha</Text>
                <TextInput
                  accessibilityLabel="Confirme sua senha"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!submitting}
                  onBlur={field.onBlur}
                  onChangeText={field.onChange}
                  placeholder="Digite a senha novamente"
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
              <Text style={styles.primaryButtonText}>Criar conta</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.switchText}>
            Já tem uma conta?{" "}
            <Text
              accessibilityRole="link"
              onPress={() => router.push("/(auth)/login" as Href)}
              style={styles.link}
            >
              Entrar
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
    paddingVertical: 24,
  },
  authLayout: { width: "100%", maxWidth: 1020, alignSelf: "center", alignItems: "center" },
  authLayoutWide: { flexDirection: "row", alignItems: "stretch", justifyContent: "center", gap: 26 },
  card: {
    width: "100%",
    maxWidth: 480,
    gap: 14,
    padding: 30,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  cardWide: { flex: 1, maxWidth: 470, justifyContent: "center" },
  tabs: { flexDirection: "row", alignItems: "center", gap: 22, borderBottomWidth: 1, borderBottomColor: theme.colors.border, marginBottom: 6 },
  activeTab: { paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: theme.colors.accent },
  activeTabText: { color: theme.colors.ink, fontSize: 12, fontWeight: "600" },
  inactiveTab: { paddingBottom: 10 },
  inactiveTabText: { color: theme.colors.body, fontSize: 12 },
  eyebrow: { color: theme.colors.accent, fontSize: 9, fontWeight: "700", letterSpacing: 1.4 },
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
  successNotice: {
    color: theme.colors.success,
    backgroundColor: theme.colors.successSoft,
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
  link: { color: theme.colors.accent, fontWeight: "700" },
  backButton: { alignSelf: "center", paddingVertical: 4 },
  backButtonText: { color: theme.colors.muted, fontSize: 11, fontWeight: "600" },
});
