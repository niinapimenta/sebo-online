import { theme } from "@/theme";
import { router } from "expo-router";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { mensagemErroApi } from "@/services/apiError";
import { useHistoricoCompras } from "../hooks/useHistoricoCompras";

export default function HistoricoComprasScreen() {
  const usuario = useCurrentUser();
  const historico = useHistoricoCompras(usuario.data?.id);

  if (usuario.isPending || usuario.isFetching || historico.isPending) {
    return (
      <View style={styles.state}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
        <Text style={styles.stateText}>Carregando seu histórico…</Text>
      </View>
    );
  }

  if (historico.isError) {
    return (
      <View style={styles.state}>
        <Text style={styles.title}>Histórico indisponível</Text>
        <Text style={styles.stateText} accessibilityRole="alert">
          {mensagemErroApi(historico.error) ??
            "Não foi possível carregar suas compras. Tente novamente."}
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => void historico.refetch()}
          style={styles.primaryButton}
          activeOpacity={0.82}
        >
          <Text style={styles.primaryButtonText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const pedidos = historico.data ?? [];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>SUA CONTA</Text>
        <Text style={styles.title}>Histórico de compras</Text>
        <Text style={styles.subtitle}>Pedidos realizados por você na Traça.</Text>

        {pedidos.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Você ainda não fez compras</Text>
            <Text style={styles.emptyText}>
              Quando concluir um pedido, ele aparecerá nesta lista.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {pedidos.map((pedido) => (
              <View key={pedido.id} style={styles.orderCard}>
                <View style={styles.orderInfo}>
                  <Text style={styles.orderNumber}>Pedido nº {pedido.id}</Text>
                  <Text style={styles.orderDate}>{formatarData(pedido.created_at)}</Text>
                </View>
                <View style={styles.orderTotalBlock}>
                  <Text style={styles.totalLabel}>Valor total</Text>
                  <Text style={styles.orderTotal}>{formatarMoeda(pedido.total)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

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
  );
}

function formatarData(valor: string): string {
  const data = new Date(valor);
  return Number.isNaN(data.getTime())
    ? valor
    : data.toLocaleString("pt-BR", { dateStyle: "medium", timeStyle: "short" });
}

function formatarMoeda(valor: string): string {
  const numero = Number(valor);
  return Number.isFinite(numero)
    ? numero.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : "Valor indisponível";
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.canvas },
  container: { alignItems: "center", padding: 20, paddingBottom: 40 },
  content: { width: "100%", maxWidth: 760 },
  eyebrow: { color: theme.colors.accent, fontSize: 10, fontWeight: "800", letterSpacing: 1.7 },
  title: { marginTop: 8, color: theme.colors.ink, fontFamily: theme.fonts.serif, fontSize: 31, fontWeight: "400" },
  subtitle: { marginTop: 7, color: theme.colors.body, fontSize: 14, lineHeight: 21 },
  list: { gap: 12, marginTop: 22 },
  orderCard: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
  },
  orderInfo: { flex: 1, minWidth: 160 },
  orderNumber: { color: theme.colors.ink, fontSize: 16, fontWeight: "700" },
  orderDate: { marginTop: 6, color: theme.colors.muted, fontSize: 12 },
  orderTotalBlock: { alignItems: "flex-end" },
  totalLabel: { color: theme.colors.muted, fontSize: 11 },
  orderTotal: { marginTop: 4, color: theme.colors.accent, fontSize: 17, fontWeight: "800" },
  emptyCard: {
    alignItems: "center",
    gap: 9,
    marginTop: 22,
    padding: 25,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 5,
    backgroundColor: theme.colors.surface,
  },
  emptyTitle: { color: theme.colors.ink, fontSize: 17, fontWeight: "700", textAlign: "center" },
  emptyText: { color: theme.colors.body, fontSize: 13, lineHeight: 19, textAlign: "center" },
  primaryButton: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    paddingHorizontal: 16,
    borderRadius: 5,
    backgroundColor: theme.colors.accent,
  },
  primaryButtonText: { color: theme.colors.surface, fontSize: 13, fontWeight: "700" },
  backButton: { alignSelf: "center", marginTop: 20, padding: 9 },
  backButtonText: { color: theme.colors.accent, fontSize: 13, fontWeight: "700" },
  state: { flex: 1, alignItems: "center", justifyContent: "center", gap: 13, padding: 24, backgroundColor: theme.colors.canvas },
  stateText: { maxWidth: 500, color: theme.colors.body, fontSize: 14, lineHeight: 21, textAlign: "center" },
});
