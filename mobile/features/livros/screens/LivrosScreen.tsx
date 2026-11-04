import { StatusBar } from "expo-status-bar";
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
  TouchableOpacity,
  View,
} from "react-native";
import { livrosTemporarios } from "../data/livrosTemporarios";
import { useCurrentUser, authApiConfigurada } from "@/features/auth/hooks/useCurrentUser";
import { useLogout } from "@/features/auth/hooks/useLogout";
import { useDeleteLivro } from "../hooks/useDeleteLivro";
import { useLivros } from "../hooks/useLivros";
import { useCarrinho } from "@/features/carrinho/context/CarrinhoProvider";

const apiConfigurada = Boolean(process.env.EXPO_PUBLIC_API_URL?.trim());

export default function LivrosScreen() {
  const { data: livrosApi, error, isError, isFetching } = useLivros();
  const { carrinho } = useCarrinho();
  const usuarioAtual = useCurrentUser();
  const logout = useLogout();
  const exclusao = useDeleteLivro();
  const exclusaoEmAndamento = useRef(false);
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null);
  const [cadastroLivroPendente, setCadastroLivroPendente] = useState(false);
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
      router.push("./livros/novo" as Href);
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
      <StatusBar style="dark" />
      <View style={styles.content}>
        <View style={styles.topline}>
          <Text style={styles.brand}>traça</Text>
          <View style={styles.toplineActions}>
            <Text style={styles.toplineNote}>LIVROS COM HISTÓRIA</Text>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => router.push("/carrinho" as Href)}
              style={styles.accountButton}
            >
              <Text style={styles.accountButtonText}>
                Carrinho ({carrinho.itens.reduce((total, item) => total + item.quantidade, 0)})
              </Text>
            </TouchableOpacity>
            {verificandoSessao ? (
              <View style={styles.sessionStatus}>
                <ActivityIndicator size="small" color="#536b51" />
                <Text style={styles.accountStatusText}>Verificando sessão</Text>
              </View>
            ) : erroVerificacaoSessao ? (
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => void usuarioAtual.refetch()}
                style={styles.accountButton}
              >
                <Text style={styles.accountButtonText}>Tentar novamente</Text>
              </TouchableOpacity>
            ) : usuarioAutenticado ? (
              <View style={styles.sessionStatus}>
                <TouchableOpacity
                  accessibilityRole="link"
                  onPress={() => router.push("/perfil" as Href)}
                >
                  <Text style={[styles.accountStatusText, styles.profileLink]} numberOfLines={1}>
                    {usuarioAtual.data?.name}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  accessibilityRole="button"
                  disabled={logout.isPending}
                  onPress={() => logout.mutate()}
                  style={styles.accountButton}
                >
                  {logout.isPending ? (
                    <ActivityIndicator size="small" color="#536b51" />
                  ) : (
                    <Text style={styles.accountButtonText}>Sair</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => router.push("/(auth)/login")}
                style={styles.accountButton}
              >
                <Text style={styles.accountButtonText}>Entrar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.intro}>
          <Text style={styles.kicker}>SEBO ONLINE</Text>
          <Text style={styles.title}>Traça — Sebo Online</Text>
          <Text style={styles.subtitle}>
            Boas histórias merecem continuar circulando. Encontre sua próxima
            leitura por aqui.
          </Text>
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
                <ActivityIndicator size="small" color="#fffdf8" />
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
                      : "＋ Cadastrar livro"}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.shelfHeader}>
          <View>
            <Text style={styles.sectionEyebrow}>ESCOLHAS DA ESTANTE</Text>
            <Text style={styles.sectionTitle}>Livros para descobrir</Text>
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

        {logout.isError ? (
          <Text accessibilityRole="alert" style={styles.authErrorText}>
            Não foi possível encerrar sua sessão. Você continua conectado; tente
            novamente.
          </Text>
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

        {!usandoDemonstracao && livrosExibidos.length === 0 ? (
          <Text style={styles.emptyMessage}>
            Nenhum livro cadastrado no acervo.
          </Text>
        ) : null}

        <View style={styles.list}>
          {livrosExibidos.map((livro) => (
            <View key={livro.id} style={styles.card}>
              {livro.foto ? (
                <Image
                  source={{ uri: livro.foto }}
                  style={styles.cover}
                  accessibilityLabel={`Capa de ${livro.titulo}`}
                />
              ) : (
                <View
                  style={[
                    styles.cover,
                    styles.coverPlaceholder,
                    { backgroundColor: livro.corCapa ?? "#e9e0d1" },
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
                        <ActivityIndicator size="small" color="#9b463b" />
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
    backgroundColor: "#f5f1e8",
  },
  container: {
    alignItems: "center",
    paddingHorizontal: 22,
    paddingBottom: 48,
  },
  content: {
    width: "100%",
    maxWidth: 900,
  },
  topline: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#ded6c8",
  },
  toplineActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    gap: 12,
  },
  sessionStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  accountStatusText: {
    maxWidth: 150,
    color: "#78664f",
    fontSize: 11,
    fontWeight: "600",
  },
  profileLink: {
    textDecorationLine: "underline",
  },
  accountButton: {
    minHeight: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#c9d2c3",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  accountButtonText: {
    color: "#536b51",
    fontSize: 11,
    fontWeight: "700",
  },
  brand: {
    color: "#493b2a",
    fontSize: 27,
    fontWeight: "800",
    letterSpacing: -1.5,
  },
  toplineNote: {
    color: "#897b68",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  intro: {
    paddingTop: 42,
    paddingBottom: 36,
  },
  kicker: {
    color: "#9a684c",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
  },
  title: {
    color: "#493b2a",
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -1.2,
    marginTop: 9,
  },
  subtitle: {
    color: "#78664f",
    fontSize: 15,
    lineHeight: 23,
    marginTop: 12,
    maxWidth: 560,
  },
  createButton: {
    alignSelf: "flex-start",
    backgroundColor: "#536b51",
    borderRadius: 9,
    marginTop: 18,
    paddingHorizontal: 15,
    paddingVertical: 11,
  },
  createButtonText: {
    color: "#fffdf8",
    fontSize: 13,
    fontWeight: "700",
  },
  createButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  shelfHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 14,
    marginBottom: 18,
  },
  sectionEyebrow: {
    color: "#9a684c",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.7,
  },
  sectionTitle: {
    color: "#493b2a",
    fontSize: 22,
    fontWeight: "700",
    marginTop: 5,
  },
  demoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#e9e0d1",
  },
  demoDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#a46d42",
  },
  demoBadgeText: {
    color: "#705b43",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.7,
  },
  apiMessage: {
    color: "#78664f",
    backgroundColor: "#f1e8d9",
    borderRadius: 9,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
    padding: 11,
  },
  emptyMessage: {
    color: "#78664f",
    backgroundColor: "#fffdf8",
    borderColor: "#e7dfd2",
    borderWidth: 1,
    borderRadius: 12,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
    padding: 20,
    textAlign: "center",
  },
  apiError: {
    color: "#8b3f32",
    backgroundColor: "#f2e2dc",
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
    borderRadius: 9,
    backgroundColor: "#f2e2dc",
  },
  authErrorText: {
    color: "#8b3f32",
    fontSize: 12,
    lineHeight: 18,
  },
  retryButton: {
    alignSelf: "flex-start",
    minHeight: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#d4aaa1",
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  retryButtonText: {
    color: "#8b3f32",
    fontSize: 12,
    fontWeight: "700",
  },
  list: {
    gap: 14,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e7dfd2",
    backgroundColor: "#fffdf8",
    shadowColor: "#493b2a",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 2,
  },
  cover: {
    width: 92,
    height: 126,
    overflow: "hidden",
    justifyContent: "center",
    paddingHorizontal: 11,
    paddingVertical: 12,
    borderRadius: 5,
  },
  coverPlaceholder: {
    alignItems: "center",
  },
  placeholderTitle: {
    color: "#705b43",
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
    color: "#f8edda",
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
    color: "#fff8eb",
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 14,
  },
  coverAuthor: {
    color: "#f4e8d4",
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
    minHeight: 104,
    justifyContent: "center",
  },
  cardKicker: {
    color: "#a27d59",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  bookTitle: {
    color: "#493b2a",
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 22,
    marginTop: 5,
  },
  bookTitleLink: {
    textDecorationLine: "underline",
  },
  author: {
    color: "#817561",
    fontSize: 13,
    marginTop: 4,
  },
  seller: {
    color: "#897b68",
    fontSize: 11,
    marginTop: 4,
  },
  sellerLink: {
    color: "#536b51",
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
    borderColor: "#c9d2c3",
    borderRadius: 7,
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  editButtonText: {
    color: "#536b51",
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
    borderColor: "#e1c5bf",
    borderRadius: 7,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  deleteButtonText: {
    color: "#9b463b",
    fontSize: 12,
    fontWeight: "700",
  },
  actionDisabled: {
    opacity: 0.5,
  },
  price: {
    color: "#536b51",
    fontSize: 17,
    fontWeight: "800",
  },
  priceNote: {
    color: "#9a8e7c",
    fontSize: 10,
  },
  footerNote: {
    color: "#897b68",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 22,
    textAlign: "center",
  },
});
