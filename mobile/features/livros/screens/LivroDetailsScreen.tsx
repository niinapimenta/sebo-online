import axios from "axios";
import { router, type Href } from "expo-router";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useEffect, useRef, useState } from "react";
import { useCarrinho } from "@/features/carrinho/context/CarrinhoProvider";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { mensagemErroApi } from "@/services/apiError";
import { useLivro } from "../hooks/useLivro";
import { podeComprarDoVendedor } from "../utils/compraLivro";

const apiConfigurada = Boolean(process.env.EXPO_PUBLIC_API_URL?.trim());

export default function LivroDetailsScreen({ id }: { id: string }) {
  const livroQuery = useLivro(id);
  const usuarioQuery = useCurrentUser();
  const { carrinho, restaurado, adicionarLivro } = useCarrinho();
  const [quantidadeSelecionada, setQuantidadeSelecionada] = useState(1);
  const [adicionando, setAdicionando] = useState(false);
  const [mensagemCarrinho, setMensagemCarrinho] = useState<{
    texto: string;
    sucesso: boolean;
  } | null>(null);
  const bloqueioAdicao = useRef(false);
  const timerDesbloqueio = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerDesbloqueio.current) clearTimeout(timerDesbloqueio.current);
    },
    [],
  );

  if (!apiConfigurada) {
    return (
      <Estado
        titulo="Detalhes indisponíveis"
        mensagem="A consulta depende da conexão com o backend Laravel. A API não está configurada neste aplicativo."
      />
    );
  }

  if (!/^\d+$/.test(id)) {
    return (
      <Estado
        titulo="Livro não encontrado"
        mensagem="O identificador deste livro é inválido."
        onBack={voltar}
      />
    );
  }

  if (livroQuery.isPending) {
    return (
      <View style={styles.state}>
        <ActivityIndicator size="large" color="#536b51" />
        <Text style={styles.stateMessage}>Carregando detalhes do livro…</Text>
      </View>
    );
  }

  if (livroQuery.isError || !livroQuery.data) {
    const naoEncontrado =
      axios.isAxiosError(livroQuery.error) &&
      livroQuery.error.response?.status === 404;

    return (
      <Estado
        titulo={naoEncontrado ? "Livro não encontrado" : "Não foi possível carregar o livro"}
        mensagem={
          naoEncontrado
            ? "Este livro não está disponível ou foi removido."
            : mensagemErroApi(livroQuery.error) ??
              "Verifique sua conexão e tente novamente."
        }
        onRetry={naoEncontrado ? undefined : () => void livroQuery.refetch()}
        onBack={voltar}
      />
    );
  }

  const livro = livroQuery.data;
  const idLivroValido = Number.isSafeInteger(livro.id) && livro.id > 0;
  const proprioAnuncio = !podeComprarDoVendedor(livro.vendedor?.id ?? null, usuarioQuery.data?.id ?? null);
  const verificandoUsuario = usuarioQuery.isPending;
  const quantidadeNoCarrinho =
    carrinho.itens.find((item) => item.livroId === livro.id)?.quantidade ?? 0;
  const estoqueRestante = Math.max(0, livro.estoque - quantidadeNoCarrinho);
  const quantidadeParaAdicionar =
    estoqueRestante > 0 ? Math.min(quantidadeSelecionada, estoqueRestante) : 0;

  function alterarQuantidadeSelecionada(delta: number) {
    setMensagemCarrinho(null);
    setQuantidadeSelecionada((atual) =>
      Math.min(estoqueRestante, Math.max(1, atual + delta)),
    );
  }

  function adicionarAoCarrinho() {
    if (
      bloqueioAdicao.current ||
      !restaurado ||
      !idLivroValido ||
      estoqueRestante <= 0 ||
      quantidadeParaAdicionar < 1
    ) {
      return;
    }

    bloqueioAdicao.current = true;
    setAdicionando(true);
    setMensagemCarrinho(null);

    let adicionadas = 0;
    for (let indice = 0; indice < quantidadeParaAdicionar; indice += 1) {
      const resultado = adicionarLivro({
        id: livro.id,
        titulo: livro.titulo,
        preco: livro.preco,
        estoque: livro.estoque,
        foto: livro.foto,
        vendedor: livro.vendedor,
      });
      if (!resultado.sucesso) {
        setMensagemCarrinho({
          texto: mensagemErroCarrinho(resultado.erro),
          sucesso: false,
        });
        break;
      }
      adicionadas += 1;
    }

    if (adicionadas > 0) {
      setMensagemCarrinho({
        texto: `${adicionadas} ${adicionadas === 1 ? "unidade adicionada" : "unidades adicionadas"} ao carrinho.`,
        sucesso: true,
      });
      setQuantidadeSelecionada(1);
    }

    timerDesbloqueio.current = setTimeout(() => {
      bloqueioAdicao.current = false;
      timerDesbloqueio.current = null;
      setAdicionando(false);
    }, 450);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={voltar}
          style={styles.backButton}
          activeOpacity={0.8}
        >
          <Text style={styles.backButtonText}>‹ Voltar</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          {livro.foto ? (
            <Image
              source={{ uri: livro.foto }}
              style={styles.cover}
              resizeMode="cover"
              accessibilityLabel={`Capa de ${livro.titulo}`}
            />
          ) : (
            <View style={[styles.cover, styles.coverPlaceholder]}>
              <Text style={styles.placeholderTitle} numberOfLines={5}>
                {livro.titulo}
              </Text>
              <Text style={styles.placeholderMark}>TRAÇA · SEBO</Text>
            </View>
          )}

          <View style={styles.details}>
            <Text style={styles.eyebrow}>DETALHES DO LIVRO</Text>
            <Text style={styles.title}>{livro.titulo}</Text>
            <Text style={styles.author}>por {livro.autor}</Text>

            <View style={styles.pricePanel}>
              <Text style={styles.price}>
                {livro.preco.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </Text>
              <Text
                style={[
                  styles.stock,
                  livro.estoque <= 0 && styles.stockUnavailable,
                ]}
              >
                {livro.estoque > 0
                  ? `Disponível · ${livro.estoque} ${livro.estoque === 1 ? "unidade" : "unidades"}`
                  : "Indisponível no momento"}
              </Text>
            </View>

            <View style={styles.cartSection}>
              <Text style={styles.cartLabel}>Quantidade</Text>
              <View style={styles.cartControls}>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Diminuir quantidade"
                  disabled={quantidadeParaAdicionar <= 1 || adicionando}
                  onPress={() => alterarQuantidadeSelecionada(-1)}
                  style={[
                    styles.quantityButton,
                    (quantidadeParaAdicionar <= 1 || adicionando) && styles.controlDisabled,
                  ]}
                >
                  <Text style={styles.quantityButtonText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.quantityValue}>{quantidadeParaAdicionar}</Text>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Aumentar quantidade"
                  disabled={quantidadeParaAdicionar >= estoqueRestante || adicionando}
                  onPress={() => alterarQuantidadeSelecionada(1)}
                  style={[
                    styles.quantityButton,
                    (quantidadeParaAdicionar >= estoqueRestante || adicionando) &&
                      styles.controlDisabled,
                  ]}
                >
                  <Text style={styles.quantityButtonText}>＋</Text>
                </TouchableOpacity>
                <Text style={styles.remainingStock}>
                  {estoqueRestante > 0
                    ? `${estoqueRestante} disponível(is) para adicionar`
                    : quantidadeNoCarrinho > 0
                      ? "Estoque disponível já está no carrinho"
                      : "Sem estoque disponível"}
                </Text>
              </View>
              <TouchableOpacity
                accessibilityRole="button"
                disabled={
                  !restaurado ||
                  !idLivroValido ||
                  proprioAnuncio ||
                  verificandoUsuario ||
                  estoqueRestante <= 0 ||
                  adicionando
                }
                onPress={adicionarAoCarrinho}
                style={[
                  styles.addCartButton,
                  ((!restaurado || !idLivroValido || proprioAnuncio || verificandoUsuario || estoqueRestante <= 0 || adicionando) &&
                    styles.controlDisabled),
                ]}
                activeOpacity={0.82}
              >
                {adicionando ? (
                  <ActivityIndicator size="small" color="#fffdf8" />
                ) : (
                  <Text style={styles.addCartButtonText}>
                    {proprioAnuncio
                      ? "Seu próprio anúncio"
                      : verificandoUsuario
                        ? "Verificando conta…"
                        : restaurado
                          ? "Adicionar ao carrinho"
                          : "Carregando carrinho…"}
                  </Text>
                )}
              </TouchableOpacity>
              {proprioAnuncio ? (
                <Text style={styles.cartMessage} accessibilityRole="alert">
                  Você não pode comprar o próprio anúncio.
                </Text>
              ) : null}
              {mensagemCarrinho ? (
                <Text
                  accessibilityRole="alert"
                  style={[
                    styles.cartMessage,
                    mensagemCarrinho.sucesso
                      ? styles.cartMessageSuccess
                      : styles.cartMessageError,
                  ]}
                >
                  {mensagemCarrinho.texto}
                </Text>
              ) : null}
            </View>

            <View style={styles.infoList}>
              <Informacao label="Editora" valor={livro.editora ?? "Não informada"} />
              <Informacao label="Ano" valor={String(livro.ano_publicacao)} />
              <Informacao label="Data de publicação" valor={livro.data_publicacao} />
              {livro.vendedor ? (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Vendedor</Text>
                  <Text style={styles.infoValue}>
                    <Text
                      accessibilityRole="link"
                      onPress={() =>
                        router.push(`/vendedores/${livro.vendedor!.id}` as Href)
                      }
                      style={styles.sellerLink}
                    >
                      {livro.vendedor.name}
                    </Text>
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={styles.descriptionSection}>
              <Text style={styles.descriptionTitle}>Sobre este exemplar</Text>
              <Text style={styles.description}>
                {livro.descricao?.trim() || "O vendedor não adicionou uma descrição."}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function mensagemErroCarrinho(erro: string): string {
  switch (erro) {
    case "estoque_indisponivel":
      return "Este livro está sem estoque disponível.";
    case "quantidade_acima_estoque":
      return "A quantidade solicitada ultrapassa o estoque disponível.";
    case "quantidade_invalida":
      return "Escolha uma quantidade válida para adicionar.";
    default:
      return "Não foi possível adicionar este livro ao carrinho.";
  }
}

function Informacao({ label, valor }: { label: string; valor: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{valor}</Text>
    </View>
  );
}

function Estado({
  titulo,
  mensagem,
  onRetry,
  onBack,
}: {
  titulo: string;
  mensagem: string;
  onRetry?: () => void;
  onBack?: () => void;
}) {
  return (
    <View style={styles.state}>
      <Text style={styles.stateTitle}>{titulo}</Text>
      <Text style={styles.stateMessage} accessibilityRole="alert">
        {mensagem}
      </Text>
      {onRetry ? (
        <TouchableOpacity
          accessibilityRole="button"
          onPress={onRetry}
          style={styles.primaryButton}
          activeOpacity={0.82}
        >
          <Text style={styles.primaryButtonText}>Tentar novamente</Text>
        </TouchableOpacity>
      ) : null}
      {onBack ? (
        <TouchableOpacity
          accessibilityRole="button"
          onPress={onBack}
          style={styles.backButton}
          activeOpacity={0.82}
        >
          <Text style={styles.backButtonText}>Voltar ao acervo</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function voltar() {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace("/" as Href);
  }
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f5f1e8" },
  container: { alignItems: "center", padding: 20, paddingBottom: 40 },
  content: { width: "100%", maxWidth: 900 },
  backButton: { alignSelf: "flex-start", paddingVertical: 8, paddingHorizontal: 2 },
  backButtonText: { color: "#536b51", fontSize: 14, fontWeight: "700" },
  card: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: "#e7dfd2",
    borderRadius: 16,
    backgroundColor: "#fffdf8",
  },
  cover: {
    width: 240,
    height: 340,
    borderRadius: 7,
    backgroundColor: "#e9e0d1",
  },
  coverPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    padding: 22,
    backgroundColor: "#536b51",
  },
  placeholderTitle: {
    color: "#fff8eb",
    fontSize: 23,
    fontWeight: "800",
    textAlign: "center",
  },
  placeholderMark: {
    marginTop: 18,
    color: "#f4e8d4",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  details: { flex: 1, minWidth: 260, gap: 12 },
  eyebrow: { color: "#9a684c", fontSize: 10, fontWeight: "800", letterSpacing: 1.7 },
  title: { color: "#493b2a", fontSize: 30, lineHeight: 37, fontWeight: "800" },
  author: { color: "#817561", fontSize: 16 },
  pricePanel: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "baseline",
    gap: 12,
    marginTop: 5,
    padding: 15,
    borderRadius: 10,
    backgroundColor: "#f1e8d9",
  },
  price: { color: "#536b51", fontSize: 23, fontWeight: "800" },
  cartSection: { gap: 10, marginTop: 2 },
  cartLabel: { color: "#493b2a", fontSize: 13, fontWeight: "700" },
  cartControls: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  quantityButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#c9d2c3",
    borderRadius: 8,
    backgroundColor: "#fffdf8",
  },
  quantityButtonText: { color: "#536b51", fontSize: 20, fontWeight: "700" },
  quantityValue: { minWidth: 20, color: "#493b2a", fontSize: 15, fontWeight: "700", textAlign: "center" },
  remainingStock: { color: "#897b68", fontSize: 11, flexShrink: 1 },
  addCartButton: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    borderRadius: 9,
    backgroundColor: "#536b51",
  },
  addCartButtonText: { color: "#fffdf8", fontSize: 14, fontWeight: "700" },
  cartMessage: { fontSize: 12, lineHeight: 18 },
  cartMessageSuccess: { color: "#536b51" },
  cartMessageError: { color: "#9b463b" },
  controlDisabled: { opacity: 0.45 },
  stock: { color: "#536b51", fontSize: 12, fontWeight: "700" },
  stockUnavailable: { color: "#9b463b" },
  infoList: { gap: 9, marginTop: 5 },
  infoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee7dc",
  },
  infoLabel: { color: "#897b68", fontSize: 13 },
  infoValue: { color: "#493b2a", fontSize: 13, fontWeight: "600" },
  sellerLink: { color: "#536b51", textDecorationLine: "underline" },
  descriptionSection: { gap: 7, marginTop: 5 },
  descriptionTitle: { color: "#493b2a", fontSize: 16, fontWeight: "700" },
  description: { color: "#78664f", fontSize: 14, lineHeight: 21 },
  state: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 13,
    padding: 24,
    backgroundColor: "#f5f1e8",
  },
  stateTitle: { color: "#493b2a", fontSize: 20, fontWeight: "700", textAlign: "center" },
  stateMessage: {
    maxWidth: 520,
    color: "#78664f",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  primaryButton: {
    minHeight: 42,
    justifyContent: "center",
    marginTop: 4,
    paddingHorizontal: 16,
    borderRadius: 9,
    backgroundColor: "#536b51",
  },
  primaryButtonText: { color: "#fffdf8", fontSize: 13, fontWeight: "700" },
});
