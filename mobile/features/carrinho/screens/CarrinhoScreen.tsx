import { theme } from "@/theme";
import axios from "axios";
import { router, type Href } from "expo-router";
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRef, useState } from "react";
import { authApiConfigurada, useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { mensagemErroApi } from "@/services/apiError";
import { useCarrinho } from "../context/CarrinhoProvider";
import { useFinalizarPedido } from "../hooks/useFinalizarPedido";
import type { PedidoConfirmado } from "../types/Pedido";
import { montarPayloadCheckout } from "../utils/checkout";

export default function CarrinhoScreen() {
  const {
    carrinho,
    restaurado,
    itens,
    totalCentavos,
    alterarQuantidade,
    removerLivro,
    limparCarrinho,
  } = useCarrinho();
  const usuarioAtual = useCurrentUser();
  const checkout = useFinalizarPedido();
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);
  const [checkoutEmAndamento, setCheckoutEmAndamento] = useState(false);
  const checkoutBloqueado = useRef(false);
  const [pedidoConfirmado, setPedidoConfirmado] = useState<PedidoConfirmado | null>(null);

  if (!restaurado) {
    return (
      <View style={styles.state}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
        <Text style={styles.stateText}>Restaurando seu carrinho…</Text>
      </View>
    );
  }

  if (itens.length === 0) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
        <View style={styles.content}>
          <Text style={styles.eyebrow}>TRAÇA · SEBO ONLINE</Text>
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>♡</Text>
            <Text style={styles.title}>Seu carrinho está vazio</Text>
            <Text style={styles.bodyText}>
              Encontre uma história para levar com você. Os livros adicionados aparecerão aqui.
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => router.replace("/" as Href)}
              style={styles.primaryButton}
              activeOpacity={0.82}
            >
              <Text style={styles.primaryButtonText}>Voltar ao catálogo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  const quantidadeTotal = itens.reduce((total, item) => total + item.quantidade, 0);

  async function finalizarCompra() {
    if (checkoutBloqueado.current || !restaurado || carrinho.itens.length === 0) return;
    if (!authApiConfigurada) {
      setMensagemErro("A conexão com a API é necessária para finalizar a compra.");
      return;
    }

    checkoutBloqueado.current = true;
    setCheckoutEmAndamento(true);
    setMensagemErro(null);

    try {
      let usuario = usuarioAtual.data;
      if (usuario === undefined || usuarioAtual.isError) {
        const sessao = await usuarioAtual.refetch();
        if (sessao.isError) {
          throw new Error("Não foi possível confirmar sua sessão. Tente novamente.");
        }
        usuario = sessao.data;
      }

      if (!usuario) {
        router.push({
          pathname: "/(auth)/login",
          params: { returnTo: "/carrinho" },
        } as Href);
        return;
      }

      const pedido = await checkout.mutateAsync(montarPayloadCheckout(carrinho.itens));
      limparCarrinho();
      setPedidoConfirmado(pedido);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        router.push({
          pathname: "/(auth)/login",
          params: { returnTo: "/carrinho" },
        } as Href);
      } else {
        const detalhe = mensagemErroApi(error);
        setMensagemErro(
          detalhe
            ? /estoque|quantidade|indispon[ií]vel|dispon[ií]vel/i.test(detalhe)
              ? `Não foi possível concluir o pedido: ${detalhe}`
              : detalhe
            : "Não foi possível finalizar a compra. Seus itens continuam no carrinho.",
        );
      }
    } finally {
      checkoutBloqueado.current = false;
      setCheckoutEmAndamento(false);
    }
  }

  function mudarQuantidade(livroId: number, quantidade: number) {
    const resultado = alterarQuantidade(livroId, quantidade);
    setMensagemErro(
      resultado.sucesso
        ? null
        : resultado.erro === "quantidade_acima_estoque"
          ? "A quantidade não pode ultrapassar o estoque disponível."
          : "Não foi possível atualizar a quantidade deste livro.",
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>TRAÇA · SEBO ONLINE</Text>
        <View style={styles.heading}>
          <View>
            <Text style={styles.title}>Seu carrinho</Text>
            <Text style={styles.bodyText}>
              {quantidadeTotal} {quantidadeTotal === 1 ? "livro" : "livros"} na sua seleção
            </Text>
          </View>
          <TouchableOpacity
            accessibilityRole="link"
            onPress={() => router.push("/" as Href)}
            style={styles.continueLink}
          >
            <Text style={styles.continueLinkText}>Continuar explorando</Text>
          </TouchableOpacity>
        </View>

        {mensagemErro ? (
          <Text accessibilityRole="alert" style={styles.errorMessage}>
            {mensagemErro}
          </Text>
        ) : null}

        <View style={styles.layout}>
          <View style={styles.itemsList}>
            {itens.map((item) => (
              <View key={item.livroId} style={styles.bookCard}>
                {item.foto ? (
                  <Image
                    source={{ uri: item.foto }}
                    style={styles.cover}
                    resizeMode="cover"
                    accessibilityLabel={`Capa de ${item.titulo}`}
                  />
                ) : (
                  <View style={[styles.cover, styles.coverPlaceholder]}>
                    <Text style={styles.placeholderTitle} numberOfLines={4}>
                      {item.titulo}
                    </Text>
                    <Text style={styles.placeholderMark}>TRAÇA · SEBO</Text>
                  </View>
                )}

                <View style={styles.bookInfo}>
                  <Text style={styles.bookTitle}>{item.titulo}</Text>
                  <Text style={styles.seller}>
                    Vendedor: {item.vendedor?.name ?? "Não informado"}
                  </Text>
                  <Text style={styles.unitPrice}>
                    {formatarMoeda(item.precoCentavos)} por unidade
                  </Text>

                  <View style={styles.itemFooter}>
                    <View style={styles.quantityControls}>
                      <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel={`Diminuir quantidade de ${item.titulo}`}
                        disabled={item.quantidade <= 1}
                        onPress={() => mudarQuantidade(item.livroId, item.quantidade - 1)}
                        style={[
                          styles.quantityButton,
                          item.quantidade <= 1 && styles.disabledControl,
                        ]}
                      >
                        <Text style={styles.quantityButtonText}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.quantityValue}>{item.quantidade}</Text>
                      <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel={`Aumentar quantidade de ${item.titulo}`}
                        disabled={item.quantidade >= item.estoque}
                        onPress={() => mudarQuantidade(item.livroId, item.quantidade + 1)}
                        style={[
                          styles.quantityButton,
                          item.quantidade >= item.estoque && styles.disabledControl,
                        ]}
                      >
                        <Text style={styles.quantityButtonText}>＋</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.subtotalBlock}>
                      <Text style={styles.subtotalLabel}>Subtotal</Text>
                      <Text style={styles.subtotal}>
                        {formatarMoeda(item.subtotalCentavos)}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    accessibilityRole="button"
                    onPress={() => {
                      removerLivro(item.livroId);
                      setMensagemErro(null);
                    }}
                    style={styles.removeButton}
                  >
                    <Text style={styles.removeButtonText}>Remover</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Resumo do pedido</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Itens ({quantidadeTotal})</Text>
              <Text style={styles.summaryValue}>{formatarMoeda(totalCentavos)}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatarMoeda(totalCentavos)}</Text>
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityState={{ disabled: checkoutEmAndamento || usuarioAtual.isFetching }}
              disabled={checkoutEmAndamento || usuarioAtual.isFetching}
              onPress={() => void finalizarCompra()}
              style={[
                styles.primaryButton,
                (checkoutEmAndamento || usuarioAtual.isFetching) && styles.checkoutDisabled,
              ]}
            >
              {checkoutEmAndamento ? (
                <ActivityIndicator size="small" color={theme.colors.surface} />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {usuarioAtual.isFetching ? "Verificando sessão…" : "Finalizar compra"}
                </Text>
              )}
            </TouchableOpacity>
            <Text style={styles.comingSoon}>Compra simulada, sem pagamento online.</Text>
          </View>
        </View>
      </View>
      <Modal
        visible={Boolean(pedidoConfirmado)}
        transparent
        animationType="fade"
        onRequestClose={() => setPedidoConfirmado(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.confirmationCard}>
            <Text style={styles.confirmationEyebrow}>COMPRA SIMULADA CONCLUÍDA</Text>
            <Text style={styles.confirmationTitle}>Pedido confirmado</Text>
            <Text style={styles.confirmationInfo}>Pedido nº {pedidoConfirmado?.id}</Text>
            {pedidoConfirmado?.created_at ? (
              <Text style={styles.confirmationInfo}>
                {formatarData(pedidoConfirmado.created_at)}
              </Text>
            ) : null}
            <View style={styles.confirmationTotalRow}>
              <Text style={styles.confirmationTotalLabel}>Total confirmado</Text>
              <Text style={styles.confirmationTotal}>
                {formatarValorServidor(pedidoConfirmado?.total)}
              </Text>
            </View>
            <Text style={styles.confirmationNote}>
              O pedido foi registrado sem cobrança de pagamento.
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => setPedidoConfirmado(null)}
              style={styles.primaryButton}
              activeOpacity={0.82}
            >
              <Text style={styles.primaryButtonText}>Continuar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function formatarMoeda(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarValorServidor(valor?: string): string {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return "—";
  return numero.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarData(valor: string): string {
  const data = new Date(valor);
  return Number.isNaN(data.getTime())
    ? valor
    : data.toLocaleString("pt-BR", { dateStyle: "medium", timeStyle: "short" });
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.canvas },
  container: { alignItems: "center", padding: 20, paddingBottom: 44 },
  content: { width: "100%", maxWidth: 1040 },
  eyebrow: { color: theme.colors.accent, fontSize: 10, fontWeight: "800", letterSpacing: 1.5 },
  heading: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    marginTop: 9,
    marginBottom: 22,
  },
  title: { color: theme.colors.ink, fontFamily: theme.fonts.serif, fontSize: 31, fontWeight: "400" },
  bodyText: { marginTop: 5, color: theme.colors.body, fontSize: 14, lineHeight: 21 },
  continueLink: { paddingVertical: 8 },
  continueLinkText: { color: theme.colors.accent, fontSize: 13, fontWeight: "700", textDecorationLine: "underline" },
  layout: { flexDirection: "row", flexWrap: "wrap", alignItems: "flex-start", gap: 18 },
  itemsList: { flex: 1, minWidth: 260, gap: 13 },
  bookCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 5,
    backgroundColor: theme.colors.surface,
  },
  cover: { width: 82, height: 114, borderRadius: 5, backgroundColor: theme.colors.surfaceSoft },
  coverPlaceholder: { alignItems: "center", justifyContent: "center", padding: 8, backgroundColor: theme.colors.accent },
  placeholderTitle: { color: theme.colors.surface, fontSize: 11, fontWeight: "800", textAlign: "center" },
  placeholderMark: { marginTop: 7, color: theme.colors.accentSoft, fontSize: 6, fontWeight: "700", letterSpacing: 0.4 },
  bookInfo: { flex: 1, minWidth: 0 },
  bookTitle: { color: theme.colors.ink, fontSize: 16, lineHeight: 21, fontWeight: "700" },
  seller: { marginTop: 4, color: theme.colors.muted, fontSize: 12 },
  unitPrice: { marginTop: 6, color: theme.colors.accent, fontSize: 13, fontWeight: "600" },
  itemFooter: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 12 },
  quantityControls: { flexDirection: "row", alignItems: "center", gap: 9 },
  quantityButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    borderRadius: 7,
  },
  quantityButtonText: { color: theme.colors.accent, fontSize: 19, fontWeight: "700" },
  quantityValue: { minWidth: 18, color: theme.colors.ink, fontSize: 14, fontWeight: "700", textAlign: "center" },
  subtotalBlock: { alignItems: "flex-end" },
  subtotalLabel: { color: theme.colors.muted, fontSize: 10 },
  subtotal: { marginTop: 2, color: theme.colors.ink, fontSize: 15, fontWeight: "800" },
  removeButton: { alignSelf: "flex-start", marginTop: 9, paddingVertical: 3 },
  removeButtonText: { color: theme.colors.danger, fontSize: 12, fontWeight: "700", textDecorationLine: "underline" },
  disabledControl: { opacity: 0.4 },
  summaryCard: {
    width: 285,
    maxWidth: "100%",
    padding: 19,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 5,
    backgroundColor: theme.colors.surface,
  },
  summaryTitle: { marginBottom: 16, color: theme.colors.ink, fontSize: 17, fontWeight: "700" },
  summaryRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  summaryLabel: { color: theme.colors.body, fontSize: 13 },
  summaryValue: { color: theme.colors.ink, fontSize: 13, fontWeight: "600" },
  summaryDivider: { height: 1, marginVertical: 14, backgroundColor: theme.colors.border },
  totalLabel: { color: theme.colors.ink, fontSize: 15, fontWeight: "700" },
  totalValue: { color: theme.colors.accent, fontSize: 19, fontWeight: "800" },
  primaryButton: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 19,
    paddingHorizontal: 16,
    borderRadius: 5,
    backgroundColor: theme.colors.accent,
  },
  primaryButtonText: { color: theme.colors.surface, fontSize: 13, fontWeight: "700", textAlign: "center" },
  checkoutDisabled: { backgroundColor: theme.colors.muted },
  comingSoon: { marginTop: 9, color: theme.colors.muted, fontSize: 11, lineHeight: 16, textAlign: "center" },
  errorMessage: { marginBottom: 13, color: theme.colors.danger, fontSize: 13, lineHeight: 19 },
  modalBackdrop: { flex: 1, alignItems: "center", justifyContent: "center", padding: 22, backgroundColor: "rgba(40,32,23,0.55)" },
  confirmationCard: { width: "100%", maxWidth: 440, padding: 25, borderRadius: 8, backgroundColor: theme.colors.surface },
  confirmationEyebrow: { color: theme.colors.accent, fontSize: 10, fontWeight: "800", letterSpacing: 1.2 },
  confirmationTitle: { marginTop: 8, color: theme.colors.ink, fontFamily: theme.fonts.serif, fontSize: 27, fontWeight: "400" },
  confirmationInfo: { marginTop: 8, color: theme.colors.body, fontSize: 14 },
  confirmationTotalRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 20, paddingTop: 15, borderTopWidth: 1, borderTopColor: theme.colors.border },
  confirmationTotalLabel: { color: theme.colors.ink, fontSize: 14, fontWeight: "700" },
  confirmationTotal: { color: theme.colors.accent, fontSize: 21, fontWeight: "800" },
  confirmationNote: { marginTop: 12, color: theme.colors.muted, fontSize: 12, lineHeight: 18 },
  emptyCard: {
    alignItems: "center",
    gap: 12,
    marginTop: 25,
    padding: 34,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
  },
  emptyIcon: { color: theme.colors.accent, fontSize: 35 },
  state: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24, backgroundColor: theme.colors.canvas },
  stateText: { color: theme.colors.body, fontSize: 14, textAlign: "center" },
});
