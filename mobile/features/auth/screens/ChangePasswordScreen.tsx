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
import { useChangePassword } from "../hooks/useChangePassword";
import {
  ChangePasswordSchema,
  type ChangePasswordFormData,
  type ChangePasswordFormValues,
} from "../types/AuthSchema";

const valoresIniciais: ChangePasswordFormValues = {
  current_password: "",
  password: "",
  password_confirmation: "",
};

export default function ChangePasswordScreen() {
  const mutation = useChangePassword();
  const { control, handleSubmit, reset } = useForm<
    ChangePasswordFormValues,
    unknown,
    ChangePasswordFormData
  >({ resolver: zodResolver(ChangePasswordSchema), defaultValues: valoresIniciais });

  function onSubmit(values: ChangePasswordFormData) {
    mutation.mutate(values, { onSuccess: () => reset(valoresIniciais) });
  }

  const erro = mensagemErroApi(mutation.error);

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.eyebrow}>SUA CONTA</Text>
          <Text style={styles.title}>Alterar senha</Text>
          <Text style={styles.subtitle}>Confirme sua senha atual e escolha uma nova senha.</Text>

          {mutation.data ? <Text accessibilityRole="status" style={styles.successNotice}>{mutation.data}</Text> : null}
          {mutation.isError ? <Text accessibilityRole="alert" style={styles.errorNotice}>{erro ?? "Não foi possível alterar a senha."}</Text> : null}

          <PasswordField control={control} name="current_password" label="Senha atual" editable={!mutation.isPending} autoComplete="current-password" />
          <PasswordField control={control} name="password" label="Nova senha" editable={!mutation.isPending} autoComplete="new-password" />
          <PasswordField control={control} name="password_confirmation" label="Confirme a nova senha" editable={!mutation.isPending} autoComplete="new-password" />

          <TouchableOpacity accessibilityRole="button" disabled={mutation.isPending} onPress={() => void handleSubmit(onSubmit)()} style={[styles.primaryButton, mutation.isPending && styles.disabled]} activeOpacity={0.82}>
            {mutation.isPending ? <ActivityIndicator color={theme.colors.surface} /> : <Text style={styles.primaryButtonText}>Salvar nova senha</Text>}
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Voltar ao perfil</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function PasswordField({ control, name, label, editable, autoComplete }: {
  control: ReturnType<typeof useForm<ChangePasswordFormValues, unknown, ChangePasswordFormData>>["control"];
  name: "current_password" | "password" | "password_confirmation";
  label: string;
  editable: boolean;
  autoComplete: "current-password" | "new-password";
}) {
  return (
    <Controller control={control} name={name} render={({ field, fieldState }) => (
      <View style={styles.field}>
        <Text style={styles.label}>{label}</Text>
        <TextInput accessibilityLabel={label} autoCapitalize="none" autoCorrect={false} autoComplete={autoComplete} editable={editable} onBlur={field.onBlur} onChangeText={field.onChange} secureTextEntry value={field.value} style={[styles.input, fieldState.error && styles.inputError]} />
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
