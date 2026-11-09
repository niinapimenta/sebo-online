import { theme } from "@/theme";
import { router, type Href } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { livrosTemporarios } from "../data/livrosTemporarios";
import { useCurrentUser, authApiConfigurada } from "@/features/auth/hooks/useCurrentUser";
import { useDeleteLivro } from "../hooks/useDeleteLivro";
import { useLivros } from "../hooks/useLivros";

const apiConfigurada = Boolean(process.env.EXPO_PUBLIC_API_URL?.trim());

export default function LivrosScreen() {
  const { width } = useWindowDimensions();
  const [hydrated, setHydrated] = useState(Platform.OS !== "web");
  const larguraLayout = hydrated ? width : 0;
  const { data: livrosApi, error, isError, isFetching } = useLivros();
  const usuarioAtual = useCurrentUser();
  const exclusao = useDeleteLivro();
  const exclusaoEmAndamento = useRef(false);
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null);
  const [cadastroLivroPendente, setCadastroLivroPendente] = useState(false);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    if (Platform.OS === "web") setHydrated(true);
  }, []);

  const verificandoCadastroLivro =
    cadastroLivroPendente && (usuarioAtual.isPending || usuarioAtual.isFetching);
  const usandoDemonstracao = !livrosApi;
  const verificandoSessao = authApiConfigurada &&
    (usuarioAtual.isPending || usuarioAtual.isFetching);
  const erroVerificacaoSessao = authApiConfigurada && usuarioAtual.isError;
  const usuarioAutenticado = Boolean(usuarioAtual.data) && !usuarioAtual.isError;

  useEffect(() => {
    if (!cadastroLivroPendente || !authApiConfigurada) return;
    if (
      usuarioAtual.isPending ||
      usuarioAtual.isFetching ||
      usuarioAtual.isError
    ) {
      return;
    }

    if (usuarioAtual.data) {
      setCadastroLivroPendente(false);
      router.push("/livros/novo" as Href);
      return;
    }

    if (usuarioAtual.data === null) {
      setCadastroLivroPendente(false);
      router.push("/(auth)/login");
    }
  }, [
    cadastroLivroPendente,
    usuarioAtual.data,
    usuarioAtual.isError,
    usuarioAtual.isFetching,
    usuarioAtual.isPending,
  ]);
  const livrosExibidos = usandoDemonstracao
    ? livrosTemporarios.map((livro) => ({
        ...livro,
        foto: null,
      vendedor: null,
        temporario: true,
      }))
    : livrosApi.map((livro) => ({
        id: String(livro.id),
        titulo: livro.titulo,
        autor: livro.autor,
        preco: livro.preco,
        foto: livro.foto,
        vendedor: livro.vendedor,
        corCapa: undefined,
        selo: undefined,
        temporario: false,
      }));
  const termoBusca = busca.trim().toLocaleLowerCase("pt-BR");
  const livrosFiltrados = termoBusca
    ? livrosExibidos.filter((livro) =>
        `${livro.titulo} ${livro.autor}`.toLocaleLowerCase("pt-BR").includes(termoBusca),
      )
    : livrosExibidos;
  const alturaCapa = larguraLayout < 450 ? 190 : larguraLayout < 760 ? 205 : 220;
  const larguraCard = larguraLayout < 450 ? "100%" : larguraLayout < 760 ? "48%" : "31.6%";

  function abrirRotaDeEscrita(href: Href) {
    if (!authApiConfigurada) {
      router.push(href);
      return;
    }

    if (verificandoSessao || erroVerificacaoSessao) return;

    if (!usuarioAtual.data) {
      router.push("/(auth)/login");
      return;
    }

    router.push(href);
  }

  function solicitarCadastroLivro() {
    if (!authApiConfigurada || verificandoCadastroLivro) return;

    if (!cadastroLivroPendente) setCadastroLivroPendente(true);

    if (usuarioAtual.isError) {
      void usuarioAtual.refetch();
    }
  }

  async function confirmarExclusao(id: string, titulo: string) {
    if (!apiConfigurada || exclusaoEmAndamento.current) return;
    if (verificandoSessao || erroVerificacaoSessao) return;
    if (!usuarioAtual.data) {
      router.push("/(auth)/login");
      return;
    }

    exclusaoEmAndamento.current = true;
    setConfirmandoId(id);

    try {
      const confirmada =
        Platform.OS === "web"
          ? window.confirm(
              `Deseja excluir “${titulo}”? Esta ação não pode ser desfeita.`,
            )
          : await new Promise<boolean>((resolve) => {
              Alert.alert(
                "Excluir livro",
                `Deseja excluir “${titulo}”? Esta ação não pode ser desfeita.`,
                [
                  {
                    text: "Cancelar",
                    style: "cancel",
                    onPress: () => resolve(false),
                  },
                  {
                    text: "Excluir",
                    style: "destructive",
                    onPress: () => resolve(true),
                  },
                ],
                {
                  cancelable: true,
                  onDismiss: () => resolve(false),
                },
              );
            });

      if (confirmada) await exclusao.mutateAsync(id);
    } catch {
      // A falha fica em exclusao.error e é exibida acima da lista.
    } finally {
      exclusaoEmAndamento.current = false;
      setConfirmandoId(null);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <View style={styles.intro}>
          <View style={styles.introCopy}>
            <Text style={styles.kicker}>ENTRE ESTANTES E ENCONTROS</Text>
            <Text style={styles.title}>Qual vai ser sua próxima história?</Text>
            <Text style={styles.subtitle}>Livros que já foram amados. Prontos para novos capítulos.</Text>
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            style={[
              styles.createButton,
              (!authApiConfigurada || verificandoCadastroLivro) &&
                styles.actionDisabled,
            ]}
            onPress={solicitarCadastroLivro}
            disabled={!authApiConfigurada || verificandoCadastroLivro}
            activeOpacity={0.82}
          >
            {verificandoCadastroLivro ? (
              <View style={styles.createButtonContent}>
                <ActivityIndicator size="small" color={theme.colors.surface} />
                <Text style={styles.createButtonText}>
                  Aguardando verificação…
                </Text>
              </View>
            ) : cadastroLivroPendente && usuarioAtual.isError ? (
              <Text style={styles.createButtonText}>
                Falha ao verificar. Tentar novamente
              </Text>
            ) : (
              <Text style={styles.createButtonText}>
                {!authApiConfigurada
                  ? "API indisponível"
                  : usuarioAtual.isError
                    ? "Tentar novamente para continuar"
                    : !verificandoSessao && !usuarioAutenticado
                      ? "Entrar para cadastrar livro"
                : "＋ Vender um livro  ›"}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.searchBox}>
          <View style={styles.searchIcon} accessible={false}>
            <View style={styles.searchLens} />
            <View style={styles.searchHandle} />
          </View>
          <TextInput
            accessibilityLabel="Buscar por título ou autor"
            value={busca}
            onChangeText={setBusca}
            placeholder="Busque por título ou autor..."
            placeholderTextColor={theme.colors.muted}
            returnKeyType="search"
            style={styles.searchInput}
          />
          {busca.length > 0 ? (
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Limpar busca" onPress={() => setBusca("")} style={styles.clearSearch}>
              <Text style={styles.clearSearchText}>×</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.shelfHeader}>
          <View>
            <Text style={styles.sectionEyebrow}>ESCOLHAS DA ESTANTE</Text>
            <Text style={styles.sectionTitle}>Livros para descobrir</Text>
            <Text style={styles.resultCount}>{livrosFiltrados.length} {livrosFiltrados.length === 1 ? "livro" : "livros"} na estante</Text>
          </View>
          <View style={styles.demoBadge}>
            <View style={styles.demoDot} />
            <Text style={styles.demoBadgeText}>
              {usandoDemonstracao ? "ACERVO DE DEMONSTRAÇÃO" : "API LARAVEL"}
            </Text>
          </View>
        </View>

        {isFetching && (
          <Text style={styles.apiMessage}>Consultando o acervo da API…</Text>
        )}
        {isError && (
          <Text style={styles.apiError}>
            Não foi possível carregar os livros da API. Exibindo dados
            temporários. ({error.message})
          </Text>
        )}

        {erroVerificacaoSessao ? (
          <View style={styles.authError}>
            <Text accessibilityRole="alert" style={styles.authErrorText}>
              Não foi possível confirmar sua sessão. Os controles de vendedor
              estão pausados; sua sessão não foi encerrada.
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => void usuarioAtual.refetch()}
              style={styles.retryButton}
            >
              <Text style={styles.retryButtonText}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        ) : null}
{!apiConfigurada ? (
          <Text style={styles.apiMessage}>
            A API Laravel não está configurada. O acervo temporário é apenas
            demonstrativo; cadastro, edição e exclusão dependem do backend.
          </Text>
        ) : null}
        {exclusao.isError ? (
          <Text accessibilityRole="alert" style={styles.apiError}>
            Não foi possível excluir o livro. Ele continua na lista. (
            {exclusao.error.message})
          </Text>
        ) : null}

        {livrosFiltrados.length === 0 ? (
          <Text style={styles.emptyMessage}>
            {termoBusca ? "Nenhum livro encontrado para essa busca." : "Nenhum livro cadastrado no acervo."}
          </Text>
        ) : null}

        <View style={styles.list}>
          {livrosFiltrados.map((livro) => (
            <View key={livro.id} style={[styles.card, { width: larguraCard }]}>
              {livro.foto ? (
                <Image
                  source={{ uri: livro.foto }}
                  style={[styles.cover, { height: alturaCapa }]}
                  accessibilityLabel={`Capa de ${livro.titulo}`}
                />
              ) : (
                <View
                  style={[
                    styles.cover,
                    { height: alturaCapa },
                    styles.coverPlaceholder,
                    { backgroundColor: livro.corCapa ?? theme.colors.surfaceSoft },
                  ]}
                >
                  {livro.selo ? (
                    <Text style={styles.coverSelo}>{livro.selo}</Text>
                  ) : null}
                  <View style={styles.coverRule} />
                  <Text
                    style={[
                      styles.coverTitle,
                      !livro.temporario && styles.placeholderTitle,
                    ]}
                    numberOfLines={4}
                  >
                    {livro.temporario ? livro.titulo : "Sem capa"}
                  </Text>
                  {livro.temporario ? (
                    <>
                      <Text style={styles.coverAuthor} numberOfLines={2}>
                        {livro.autor}
                      </Text>
                      <Text style={styles.coverMark}>TRAÇA · SEBO</Text>
                    </>
                  ) : null}
                </View>
              )}

              <View style={styles.cardInfo}>
                <Text style={styles.cardKicker}>LIVRO USADO</Text>
                {livro.temporario || !livro.id ? (
                  <Text style={styles.bookTitle}>{livro.titulo}</Text>
                ) : (
                  <TouchableOpacity
                    accessibilityRole="link"
                    onPress={() => router.push(`/livros/${livro.id}` as Href)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.bookTitle, styles.bookTitleLink]}>
                      {livro.titulo}
                    </Text>
                  </TouchableOpacity>
                )}
                <Text style={styles.author}>{livro.autor}</Text>
                <Text style={styles.seller} numberOfLines={1}>
                  Vendedor: {livro.vendedor ? (
                    <Text
                      accessibilityRole="link"
                      onPress={() =>
                        router.push(`/vendedores/${livro.vendedor!.id}` as Href)
                      }
                      style={styles.sellerLink}
                    >
                      {livro.vendedor.name}
                    </Text>
                  ) : (
                    "Vendedor não informado"
                  )}
                </Text>
                <View style={styles.cardFooter}>
                  <Text style={styles.price}>
                    {livro.preco.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </Text>
                  {livro.temporario ? (
                    <Text style={styles.priceNote}>preço de demonstração</Text>
                  ) : null}
                </View>
                {Boolean(
                  !livro.temporario &&
                    livro.id &&
                    livro.vendedor &&
                    usuarioAtual.data &&
                    !usuarioAtual.isError &&
                    livro.vendedor.id === usuarioAtual.data.id,
                ) ? (
                  <View style={styles.actions}>
                    <TouchableOpacity
                      accessibilityRole="button"
                      disabled={verificandoSessao || erroVerificacaoSessao}
                      style={[
                        styles.editButton,
                        (verificandoSessao || erroVerificacaoSessao) &&
                          styles.actionDisabled,
                      ]}
                      onPress={() =>
                        abrirRotaDeEscrita(
                          `./livros/${livro.id}/editar` as Href,
                        )
                      }
                      activeOpacity={0.8}
                    >
                      <Text style={styles.editButtonText}>
                        {authApiConfigurada && !verificandoSessao && !usuarioAutenticado
                          ? "Entrar para editar"
                          : "Editar"}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      accessibilityRole="button"
                      style={[
                        styles.deleteButton,
                        (!apiConfigurada ||
                          verificandoSessao ||
                          erroVerificacaoSessao ||
                          exclusao.isPending ||
                          confirmandoId !== null) && styles.actionDisabled,
                      ]}
                      onPress={() =>
                        void confirmarExclusao(livro.id, livro.titulo)
                      }
                      disabled={
                        !apiConfigurada ||
                        verificandoSessao ||
                        erroVerificacaoSessao ||
                        exclusao.isPending ||
                        confirmandoId !== null
                      }
                      activeOpacity={0.8}
                    >
                      {exclusao.isPending && exclusao.variables === livro.id ? (
                        <ActivityIndicator size="small" color={theme.colors.danger} />
                      ) : (
                        <Text style={styles.deleteButtonText}>
                          {confirmandoId === livro.id
                            ? "Confirmando…"
                            : authApiConfigurada && !usuarioAutenticado
                              ? "Entrar para excluir"
                              : "Excluir"}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.footerNote}>
          {usandoDemonstracao
            ? "Os títulos e preços exibidos são temporários e não foram consultados na API."
            : "Livros carregados da API Laravel."}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.canvas,
  },
  container: {
    alignItems: "center",
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 48,
  },
  content: {
    width: "100%",
    maxWidth: 1120,
  },
  intro: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
    paddingTop: 26,
    paddingBottom: 23,
  },
  introCopy: { flex: 1, minWidth: 240, maxWidth: 690 },
  kicker: {
    color: theme.colors.accent,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.9,
  },
  title: {
    color: theme.colors.ink,
    fontFamily: theme.fonts.serif,
    fontSize: 34,
    lineHeight: 41,
    fontWeight: "400",
    marginTop: 12,
  },
  subtitle: {
    color: theme.colors.body,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 8,
    maxWidth: 560,
  },
  createButton: {
    alignSelf: "flex-start",
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    borderRadius: 5,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  createButtonText: {
    color: theme.colors.ink,
    fontSize: 12,
    fontWeight: "600",
  },
  createButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  searchBox: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    borderRadius: 5,
    backgroundColor: theme.colors.surface,
    marginBottom: 29,
  },
  searchIcon: { width: 17, height: 17, position: "relative", marginRight: 1 },
  searchLens: { width: 12, height: 12, borderRadius: 7, borderWidth: 1.5, borderColor: theme.colors.muted },
  searchHandle: { position: "absolute", left: 11, top: 11, width: 6, height: 1.5, backgroundColor: theme.colors.muted, transform: [{ rotate: "45deg" }] },
  searchInput: { flex: 1, minHeight: 42, color: theme.colors.ink, fontSize: 12 },
  clearSearch: { width: 28, height: 32, alignItems: "center", justifyContent: "center" },
  clearSearchText: { color: theme.colors.muted, fontSize: 22, lineHeight: 26 },
  shelfHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 14,
    marginBottom: 16,
  },
  sectionEyebrow: {
    color: theme.colors.accent,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.7,
  },
  sectionTitle: {
    color: theme.colors.ink,
    fontFamily: theme.fonts.serif,
    fontSize: 22,
    fontWeight: "400",
    marginTop: 5,
  },
  resultCount: { color: theme.colors.muted, fontSize: 10, marginTop: 5 },
  demoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceSoft,
  },
  demoDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: theme.colors.accent,
  },
  demoBadgeText: {
    color: theme.colors.body,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.7,
  },
  apiMessage: {
    color: theme.colors.body,
    backgroundColor: theme.colors.surfaceSoft,
    borderRadius: 5,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
    padding: 11,
  },
  emptyMessage: {
    color: theme.colors.body,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
    padding: 20,
    textAlign: "center",
  },
  apiError: {
    color: theme.colors.danger,
    backgroundColor: theme.colors.dangerSoft,
    borderRadius: 8,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
    padding: 11,
  },
  authError: {
    gap: 9,
    marginBottom: 12,
    padding: 11,
    borderRadius: 5,
    backgroundColor: theme.colors.dangerSoft,
  },
  authErrorText: {
    color: theme.colors.danger,
    fontSize: 12,
    lineHeight: 18,
  },
  retryButton: {
    alignSelf: "flex-start",
    minHeight: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  retryButtonText: {
    color: theme.colors.danger,
    fontSize: 12,
    fontWeight: "700",
  },
  list: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: 14,
  },
  card: {
    flexDirection: "column",
    alignItems: "stretch",
    padding: 0,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    shadowColor: theme.colors.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.035,
    shadowRadius: 5,
    elevation: 1,
  },
  cover: {
    width: "100%",
    height: 210,
    justifyContent: "center",
    paddingHorizontal: 11,
    paddingVertical: 12,
    borderRadius: 5,
  },
  coverPlaceholder: {
    alignItems: "center",
  },
  placeholderTitle: {
    color: theme.colors.body,
    textAlign: "center",
  },
  coverSpine: {
    position: "absolute",
    left: 6,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  coverSelo: {
    color: theme.colors.surfaceSoft,
    fontSize: 6,
    fontWeight: "800",
    letterSpacing: 1,
  },
  coverRule: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.6)",
    marginVertical: 7,
  },
  coverTitle: {
    color: theme.colors.surface,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 14,
  },
  coverAuthor: {
    color: theme.colors.accentSoft,
    fontSize: 7,
    lineHeight: 10,
    marginTop: 6,
  },
  coverMark: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 5,
    fontWeight: "700",
    letterSpacing: 0.7,
    marginTop: 5,
  },
  cardInfo: {
    flex: 1,
    minHeight: 140,
    justifyContent: "flex-start",
    padding: 14,
  },
  cardKicker: {
    color: theme.colors.accent,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  bookTitle: {
    color: theme.colors.ink,
    fontFamily: theme.fonts.serif,
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 21,
    marginTop: 5,
  },
  bookTitleLink: {
    textDecorationLine: "underline",
  },
  author: {
    color: theme.colors.body,
    fontSize: 13,
    marginTop: 4,
  },
  seller: {
    color: theme.colors.muted,
    fontSize: 11,
    marginTop: 4,
  },
  sellerLink: {
    color: theme.colors.accent,
    textDecorationLine: "underline",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "baseline",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 13,
  },
  editButton: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    borderRadius: 7,
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  editButtonText: {
    color: theme.colors.accent,
    fontSize: 12,
    fontWeight: "700",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  deleteButton: {
    minWidth: 58,
    minHeight: 30,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    borderRadius: 7,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  deleteButtonText: {
    color: theme.colors.danger,
    fontSize: 12,
    fontWeight: "700",
  },
  actionDisabled: {
    opacity: 0.5,
  },
  price: {
    color: theme.colors.accent,
    fontSize: 17,
    fontWeight: "800",
  },
  priceNote: {
    color: theme.colors.muted,
    fontSize: 10,
  },
  footerNote: {
    color: theme.colors.muted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 22,
    textAlign: "center",
  },
});
