import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
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
import { theme } from "@/theme";
import { useRequestPasswordReset } from "../hooks/useRequestPasswordReset";
import {
  ForgotPasswordSchema,
  type ForgotPasswordFormData,
  type ForgotPasswordFormValues,
} from "../types/AuthSchema";

export default function ForgotPasswordScreen() {
  const mutation = useRequestPasswordReset();
  const { control, handleSubmit } = useForm<ForgotPasswordFormValues, unknown, ForgotPasswordFormData>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: { email: "" },
  });
  const erro = mensagemErroApi(mutation.error);

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.eyebrow}>ACESSO À CONTA</Text>
          <Text style={styles.title}>Recuperar senha</Text>
          <Text style={styles.subtitle}>Informe o e-mail da sua conta. Se o envio estiver disponível, enviaremos as instruções de recuperação.</Text>

          {mutation.data ? <Text accessibilityRole="status" style={styles.successNotice}>{mutation.data}</Text> : null}
          {mutation.isError ? <Text accessibilityRole="alert" style={styles.errorNotice}>{erro ?? "Não foi possível solicitar a recuperação."}</Text> : null}

          <Controller control={control} name="email" render={({ field, fieldState }) => (
            <View style={styles.field}>
              <Text style={styles.label}>E-mail</Text>
              <TextInput accessibilityLabel="E-mail" autoCapitalize="none" autoCorrect={false} autoComplete="email" keyboardType="email-address" editable={!mutation.isPending} onBlur={field.onBlur} onChangeText={field.onChange} placeholder="voce@exemplo.com" placeholderTextColor={theme.colors.muted} value={field.value} style={[styles.input, fieldState.error && styles.inputError]} />
              {fieldState.error?.message ? <Text style={styles.fieldError}>{fieldState.error.message}</Text> : null}
            </View>
          )} />

          <TouchableOpacity accessibilityRole="button" disabled={mutation.isPending} onPress={() => void handleSubmit((values) => mutation.mutate(values))()} style={[styles.primaryButton, mutation.isPending && styles.disabled]} activeOpacity={0.82}>
            {mutation.isPending ? <ActivityIndicator color={theme.colors.surface} /> : <Text style={styles.primaryButtonText}>Solicitar recuperação</Text>}
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" onPress={() => router.replace("/(auth)/login")} style={styles.backButton}>
            <Text style={styles.backButtonText}>Voltar ao login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.canvas },
  scrollContent: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  card: { width: "100%", maxWidth: 520, gap: 16, padding: 26, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
  eyebrow: { color: theme.colors.accent, fontSize: 10, fontWeight: "800", letterSpacing: 2 },
  title: { color: theme.colors.ink, fontFamily: theme.fonts.serif, fontSize: 31, fontWeight: "400" },
  subtitle: { color: theme.colors.body, fontSize: 14, lineHeight: 21 },
  field: { gap: 6 },
  label: { color: theme.colors.ink, fontSize: 13, fontWeight: "600" },
  input: { minHeight: 46, borderWidth: 1, borderColor: theme.colors.borderStrong, borderRadius: 5, paddingHorizontal: 12, paddingVertical: 10, color: theme.colors.ink, backgroundColor: theme.colors.surface, fontSize: 15 },
  inputError: { borderColor: theme.colors.danger },
  fieldError: { color: theme.colors.danger, fontSize: 12 },
  primaryButton: { minHeight: 50, alignItems: "center", justifyContent: "center", borderRadius: 6, backgroundColor: theme.colors.accent, paddingHorizontal: 18, marginTop: 4 },
  disabled: { opacity: 0.55 },
  primaryButtonText: { color: theme.colors.surface, fontSize: 15, fontWeight: "700" },
  backButton: { alignSelf: "center", paddingVertical: 4 },
  backButtonText: { color: theme.colors.muted, fontSize: 12, fontWeight: "600" },
  successNotice: { color: theme.colors.success, backgroundColor: theme.colors.successSoft, borderRadius: 5, padding: 12, fontSize: 13, lineHeight: 19 },
  errorNotice: { color: theme.colors.danger, backgroundColor: theme.colors.dangerSoft, borderRadius: 5, padding: 12, fontSize: 13, lineHeight: 19 },
});
