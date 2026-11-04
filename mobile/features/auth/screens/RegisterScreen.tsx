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
} from "react-native";
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
        <View style={styles.card}>
          <Text style={styles.brand}>traça</Text>
          <Text style={styles.eyebrow}>SEBO ONLINE</Text>
          <Text style={styles.title}>Abra sua estante por aqui.</Text>
          <Text style={styles.subtitle}>
            Crie sua conta de vendedor e prepare seus livros para circular.
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
                  placeholder="Mínimo de 8 caracteres"
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
    gap: 15,
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
  successNotice: {
    color: "#38543a",
    backgroundColor: "#e7efe2",
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
