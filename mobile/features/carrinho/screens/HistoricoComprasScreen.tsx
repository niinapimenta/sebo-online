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
        <ActivityIndicator size="large" color="#536b51" />
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
  screen: { flex: 1, backgroundColor: "#f5f1e8" },
  container: { alignItems: "center", padding: 20, paddingBottom: 40 },
  content: { width: "100%", maxWidth: 760 },
  eyebrow: { color: "#9a684c", fontSize: 10, fontWeight: "800", letterSpacing: 1.7 },
  title: { marginTop: 8, color: "#493b2a", fontSize: 27, fontWeight: "800" },
  subtitle: { marginTop: 7, color: "#78664f", fontSize: 14, lineHeight: 21 },
  list: { gap: 12, marginTop: 22 },
  orderCard: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e7dfd2",
    borderRadius: 13,
    backgroundColor: "#fffdf8",
  },
  orderInfo: { flex: 1, minWidth: 160 },
  orderNumber: { color: "#493b2a", fontSize: 16, fontWeight: "700" },
  orderDate: { marginTop: 6, color: "#897b68", fontSize: 12 },
  orderTotalBlock: { alignItems: "flex-end" },
  totalLabel: { color: "#897b68", fontSize: 11 },
  orderTotal: { marginTop: 4, color: "#536b51", fontSize: 17, fontWeight: "800" },
  emptyCard: {
    alignItems: "center",
    gap: 9,
    marginTop: 22,
    padding: 25,
    borderWidth: 1,
    borderColor: "#e7dfd2",
    borderRadius: 14,
    backgroundColor: "#fffdf8",
  },
  emptyTitle: { color: "#493b2a", fontSize: 17, fontWeight: "700", textAlign: "center" },
  emptyText: { color: "#78664f", fontSize: 13, lineHeight: 19, textAlign: "center" },
  primaryButton: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    paddingHorizontal: 16,
    borderRadius: 9,
    backgroundColor: "#536b51",
  },
  primaryButtonText: { color: "#fffdf8", fontSize: 13, fontWeight: "700" },
  backButton: { alignSelf: "center", marginTop: 20, padding: 9 },
  backButtonText: { color: "#536b51", fontSize: 13, fontWeight: "700" },
  state: { flex: 1, alignItems: "center", justifyContent: "center", gap: 13, padding: 24, backgroundColor: "#f5f1e8" },
  stateText: { maxWidth: 500, color: "#78664f", fontSize: 14, lineHeight: 21, textAlign: "center" },
});
