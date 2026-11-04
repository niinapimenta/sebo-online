import { theme } from "@/theme";
import { Redirect, type Href } from "expo-router";
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  authApiConfigurada,
  useCurrentUser,
} from "../hooks/useCurrentUser";

export default function AuthGate({
  children,
  returnTo,
}: {
  children: ReactNode;
  returnTo?: "/carrinho" | "/historico-compras" | "/meus-anuncios";
}) {
  const currentUser = useCurrentUser();

  if (!authApiConfigurada) {
    return (
      <EstadoAcesso mensagem="A autenticação depende da conexão com a API Laravel. Configure a API para continuar." />
    );
  }

  if (currentUser.isPending && currentUser.data === undefined) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
        <Text style={styles.message}>Verificando sua sessão…</Text>
      </View>
    );
  }

  if (currentUser.isError) {
    return (
      <EstadoAcesso
        mensagem="Não foi possível confirmar sua sessão. Verifique sua conexão e tente novamente."
        onRetry={() => void currentUser.refetch()}
      />
    );
  }

  if (currentUser.data === null) {
    return (
      <Redirect
        href={
          returnTo
            ? ({ pathname: "/(auth)/login", params: { returnTo } } as Href)
            : ("/(auth)/login" as Href)
        }
      />
    );
  }

  if (currentUser.data === undefined) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
        <Text style={styles.message}>Verificando sua sessão…</Text>
      </View>
    );
  }

  return <>{children}</>;
}

function EstadoAcesso({
  mensagem,
  onRetry,
}: {
  mensagem: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.container}>
      <Text accessibilityRole="alert" style={styles.message}>
        {mensagem}
      </Text>
      {onRetry ? (
        <TouchableOpacity
          accessibilityRole="button"
          onPress={onRetry}
          style={styles.retryButton}
          activeOpacity={0.82}
        >
          <Text style={styles.retryText}>Tentar novamente</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    backgroundColor: theme.colors.canvas,
    padding: 24,
  },
  message: {
    maxWidth: 480,
    color: theme.colors.body,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  retryButton: {
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 5,
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 16,
  },
  retryText: { color: theme.colors.surface, fontSize: 14, fontWeight: "700" },
});
