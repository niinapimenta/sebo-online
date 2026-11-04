import { zodResolver } from "@hookform/resolvers/zod";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
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
import { useResetPassword } from "../hooks/useResetPassword";
import {
  ResetPasswordSchema,
  type ResetPasswordFormData,
  type ResetPasswordFormValues,
} from "../types/AuthSchema";

function firstParam(value?: string | string[]): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ token?: string | string[]; email?: string | string[] }>();
  const mutation = useResetPassword();
  const { control, handleSubmit, reset } = useForm<ResetPasswordFormValues, unknown, ResetPasswordFormData>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: { email: firstParam(params.email), token: firstParam(params.token), password: "", password_confirmation: "" },
  });

  useEffect(() => {
    reset((current) => ({ ...current, email: firstParam(params.email), token: firstParam(params.token) }));
  }, [params.email, params.token, reset]);

  function onSubmit(values: ResetPasswordFormData) {
    mutation.mutate(values, {
      onSuccess: () => {
        reset({ email: firstParam(params.email), token: firstParam(params.token), password: "", password_confirmation: "" });
      },
    });
  }

  const erro = mensagemErroApi(mutation.error);

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.eyebrow}>ACESSO À CONTA</Text>
          <Text style={styles.title}>Criar nova senha</Text>
          <Text style={styles.subtitle}>Use os dados recebidos no link de recuperação e confirme a nova senha.</Text>

          {mutation.data ? <Text accessibilityRole="status" style={styles.successNotice}>{mutation.data}</Text> : null}
          {mutation.isError ? <Text accessibilityRole="alert" style={styles.errorNotice}>{erro ?? "Não foi possível redefinir a senha."}</Text> : null}

          <TextField control={control} name="email" label="E-mail" editable={!mutation.isPending} autoCapitalize="none" keyboardType="email-address" />
          <TextField control={control} name="token" label="Token de recuperação" editable={!mutation.isPending} autoCapitalize="none" />
          <TextField control={control} name="password" label="Nova senha" editable={!mutation.isPending} secureTextEntry />
          <TextField control={control} name="password_confirmation" label="Confirme a nova senha" editable={!mutation.isPending} secureTextEntry />

          <TouchableOpacity accessibilityRole="button" disabled={mutation.isPending} onPress={() => void handleSubmit(onSubmit)()} style={[styles.primaryButton, mutation.isPending && styles.disabled]} activeOpacity={0.82}>
            {mutation.isPending ? <ActivityIndicator color={theme.colors.surface} /> : <Text style={styles.primaryButtonText}>Redefinir senha</Text>}
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" onPress={() => router.replace("/(auth)/login")} style={styles.backButton}>
            <Text style={styles.backButtonText}>Voltar ao login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function TextField({ control, name, label, editable, secureTextEntry, autoCapitalize = "none", keyboardType = "default" }: {
  control: ReturnType<typeof useForm<ResetPasswordFormValues, unknown, ResetPasswordFormData>>["control"];
  name: "email" | "token" | "password" | "password_confirmation";
  label: string;
  editable: boolean;
  secureTextEntry?: boolean;
  autoCapitalize?: "none";
  keyboardType?: "default" | "email-address";
}) {
  return (
    <Controller control={control} name={name} render={({ field, fieldState }) => (
      <View style={styles.field}>
        <Text style={styles.label}>{label}</Text>
        <TextInput accessibilityLabel={label} autoCapitalize={autoCapitalize} autoCorrect={false} editable={editable} keyboardType={keyboardType} onBlur={field.onBlur} onChangeText={field.onChange} secureTextEntry={secureTextEntry} value={field.value} style={[styles.input, fieldState.error && styles.inputError]} />
        {fieldState.error?.message ? <Text style={styles.fieldError}>{fieldState.error.message}</Text> : null}
      </View>
    )} />
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
