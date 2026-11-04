import { theme } from "@/theme";
import { useLocalSearchParams } from "expo-router";
import { router, type Href } from "expo-router";
import { useMemo } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useBibliotecaVendedor } from "../hooks/useBibliotecaVendedor";

const apiConfigurada = Boolean(process.env.EXPO_PUBLIC_API_URL?.trim());

export default function BibliotecaVendedorScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id ?? "";
  const idValido = useMemo(() => /^\d+$/.test(id), [id]);
  const biblioteca = useBibliotecaVendedor(idValido ? id : "");

  if (!apiConfigurada) {
    return (
      <Estado mensagem="A biblioteca do vendedor depende da conexão com o backend Laravel. A API não está configurada neste aplicativo." />
    );
  }

  if (!idValido) {
    return <Estado mensagem="Não foi possível identificar este vendedor." />;
  }

  if (biblioteca.isPending) {
    return (
      <View style={styles.state}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
        <Text style={styles.stateText}>Carregando biblioteca…</Text>
      </View>
    );
  }

  if (biblioteca.isError || !biblioteca.data) {
    return (
      <View style={styles.state}>
        <Text style={styles.errorTitle}>Biblioteca indisponível</Text>
        <Text style={styles.stateText} accessibilityRole="alert">
          Não foi possível carregar este perfil. Verifique sua conexão e tente novamente.
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => void biblioteca.refetch()}
          style={styles.retryButton}
          activeOpacity={0.82}
        >
          <Text style={styles.retryButtonText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { vendedor, livros } = biblioteca.data;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>TRAÇA · SEBO ONLINE</Text>
        <Text style={styles.title}>Biblioteca do vendedor</Text>
        <Text style={styles.sellerName}>{vendedor.name}</Text>
        <Text style={styles.count}>
          {livros.length} {livros.length === 1 ? "livro disponível" : "livros disponíveis"}
        </Text>
      </View>

      {livros.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Nenhum livro disponível</Text>
          <Text style={styles.emptyText}>
            Este vendedor ainda não tem livros disponíveis para venda.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {livros.map((livro) => (
            <View key={livro.id} style={styles.bookCard}>
              {livro.foto ? (
                <Image
                  source={{ uri: livro.foto }}
                  style={styles.cover}
                  resizeMode="cover"
                  accessibilityLabel={`Capa de ${livro.titulo}`}
                />
              ) : (
                <View style={[styles.cover, styles.coverPlaceholder]}>
                  <Text style={styles.placeholderText} numberOfLines={4}>
                    {livro.titulo}
                  </Text>
                  <Text style={styles.placeholderMark}>TRAÇA · SEBO</Text>
                </View>
              )}
              <View style={styles.bookInfo}>
                <TouchableOpacity
                  accessibilityRole="link"
                  onPress={() => router.push(`/livros/${livro.id}` as Href)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.bookTitle, styles.bookTitleLink]}>
                    {livro.titulo}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.author}>{livro.autor}</Text>
                <Text style={styles.price}>
                  {livro.preco.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function Estado({ mensagem }: { mensagem: string }) {
  return (
    <View style={styles.state}>
      <Text style={styles.errorTitle}>Perfil indisponível</Text>
      <Text style={styles.stateText}>{mensagem}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.canvas,
  },
  container: {
    width: "100%",
    maxWidth: 900,
    alignSelf: "center",
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 6,
    backgroundColor: theme.colors.surface,
  },
  eyebrow: {
    color: theme.colors.accent,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  title: {
    marginTop: 8,
    color: theme.colors.ink,
    fontFamily: theme.fonts.serif,
    fontSize: 30,
    fontWeight: "400",
  },
  sellerName: {
    marginTop: 12,
    color: theme.colors.accent,
    fontSize: 18,
    fontWeight: "700",
  },
  count: {
    marginTop: 5,
    color: theme.colors.muted,
    fontSize: 13,
  },
  list: {
    gap: 14,
  },
  bookCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 5,
    backgroundColor: theme.colors.surface,
  },
  cover: {
    width: 88,
    height: 122,
    borderRadius: 5,
    backgroundColor: theme.colors.surfaceSoft,
  },
  coverPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    padding: 9,
    backgroundColor: theme.colors.accent,
  },
  placeholderText: {
    color: theme.colors.surface,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
  },
  placeholderMark: {
    marginTop: 8,
    color: theme.colors.accentSoft,
    fontSize: 7,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  bookInfo: {
    flex: 1,
    gap: 6,
  },
  bookTitle: {
    color: theme.colors.ink,
    fontSize: 17,
    fontWeight: "700",
  },
  bookTitleLink: {
    textDecorationLine: "underline",
  },
  author: {
    color: theme.colors.body,
    fontSize: 13,
  },
  price: {
    marginTop: 5,
    color: theme.colors.accent,
    fontSize: 17,
    fontWeight: "800",
  },
  emptyCard: {
    alignItems: "center",
    gap: 8,
    padding: 25,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 5,
    backgroundColor: theme.colors.surface,
  },
  emptyTitle: {
    color: theme.colors.ink,
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  emptyText: {
    color: theme.colors.body,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  state: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
    backgroundColor: theme.colors.canvas,
  },
  errorTitle: {
    color: theme.colors.ink,
    fontSize: 19,
    fontWeight: "700",
    textAlign: "center",
  },
  stateText: {
    color: theme.colors.body,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    maxWidth: 520,
  },
  retryButton: {
    minHeight: 42,
    justifyContent: "center",
    marginTop: 4,
    paddingHorizontal: 16,
    borderRadius: 5,
    backgroundColor: theme.colors.accent,
  },
  retryButtonText: {
    color: theme.colors.surface,
    fontSize: 13,
    fontWeight: "700",
  },
});
