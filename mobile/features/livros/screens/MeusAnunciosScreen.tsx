import { router, type Href } from "expo-router";
import { useRef, useState } from "react";
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
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useDeleteLivro } from "../hooks/useDeleteLivro";
import { useMeusLivros } from "../hooks/useMeusLivros";
import type { Livro } from "../types/Livro";
import { mensagemErroApi } from "@/services/apiError";

export default function MeusAnunciosScreen() {
  const usuario = useCurrentUser();
  const consulta = useMeusLivros(usuario.data?.id);
  const exclusao = useDeleteLivro();
  const [confirmandoId, setConfirmandoId] = useState<number | null>(null);
  const exclusaoBloqueada = useRef(false);

  if (usuario.isPending || usuario.isFetching || consulta.isPending) {
    return (
      <View style={styles.state}>
        <ActivityIndicator size="large" color="#536b51" />
        <Text style={styles.stateText}>Carregando seus anúncios…</Text>
      </View>
    );
  }

  if (consulta.isError) {
    return (
      <View style={styles.state}>
        <Text style={styles.stateTitle}>Anúncios indisponíveis</Text>
        <Text style={styles.stateText} accessibilityRole="alert">
          {mensagemErroApi(consulta.error) ?? "Não foi possível carregar seus anúncios."}
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => void consulta.refetch()}
          style={styles.primaryButton}
          activeOpacity={0.82}
        >
          <Text style={styles.primaryButtonText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const livros = (consulta.data ?? []).filter((livro) => livro.estoque > 0);

  function pedirExclusao(livro: Livro) {
    if (exclusaoBloqueada.current || exclusao.isPending) return;
    exclusaoBloqueada.current = true;
    setConfirmandoId(livro.id);

    const confirmar = () => {
      exclusao.mutate(String(livro.id), {
        onSettled: () => {
          exclusaoBloqueada.current = false;
          setConfirmandoId(null);
        },
      });
    };
    const cancelar = () => {
      exclusaoBloqueada.current = false;
      setConfirmandoId(null);
    };

    if (Platform.OS === "web") {
      if (window.confirm(`Deseja excluir “${livro.titulo}”? Esta ação não pode ser desfeita.`)) {
        confirmar();
      } else {
        cancelar();
      }
      return;
    }

    Alert.alert(
      "Excluir anúncio",
      `Deseja excluir “${livro.titulo}”? Esta ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel", onPress: cancelar },
        { text: "Excluir", style: "destructive", onPress: confirmar },
      ],
      { cancelable: true, onDismiss: cancelar },
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>SUA CONTA</Text>
        <View style={styles.heading}>
          <View>
            <Text style={styles.title}>Meus anúncios</Text>
            <Text style={styles.subtitle}>Livros disponíveis anunciados por você.</Text>
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => router.push("/livros/novo" as Href)}
            style={styles.newButton}
            activeOpacity={0.82}
          >
            <Text style={styles.newButtonText}>＋ Novo anúncio</Text>
          </TouchableOpacity>
        </View>

        {exclusao.isError ? (
          <Text accessibilityRole="alert" style={styles.errorNotice}>
            {mensagemErroApi(exclusao.error) ?? "Não foi possível excluir este anúncio."}
          </Text>
        ) : null}

        {livros.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Nenhum anúncio disponível</Text>
            <Text style={styles.emptyText}>
              Seus livros com estoque disponível aparecerão aqui.
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => router.push("/livros/novo" as Href)}
              style={styles.primaryButton}
              activeOpacity={0.82}
            >
              <Text style={styles.primaryButtonText}>Cadastrar um livro</Text>
            </TouchableOpacity>
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
                    <Text style={styles.placeholderTitle} numberOfLines={4}>
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
                    <Text style={styles.bookTitle}>{livro.titulo}</Text>
                  </TouchableOpacity>
                  <Text style={styles.author}>{livro.autor}</Text>
                  <View style={styles.bookMeta}>
                    <Text style={styles.price}>{formatarMoeda(livro.preco)}</Text>
                    <Text style={styles.stock}>
                      {livro.estoque} {livro.estoque === 1 ? "unidade" : "unidades"} disponíveis
                    </Text>
                  </View>
                  <View style={styles.actions}>
                    <TouchableOpacity
                      accessibilityRole="button"
                      onPress={() => router.push(`/livros/${livro.id}/editar` as Href)}
                      style={styles.editButton}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.editButtonText}>Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      accessibilityRole="button"
                      disabled={exclusao.isPending}
                      onPress={() => pedirExclusao(livro)}
                      style={[styles.deleteButton, exclusao.isPending && styles.disabledButton]}
                      activeOpacity={0.8}
                    >
                      {exclusao.isPending && confirmandoId === livro.id ? (
                        <ActivityIndicator size="small" color="#9b463b" />
                      ) : (
                        <Text style={styles.deleteButtonText}>Excluir</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f5f1e8" },
  container: { alignItems: "center", padding: 20, paddingBottom: 42 },
  content: { width: "100%", maxWidth: 900 },
  eyebrow: { color: "#9a684c", fontSize: 10, fontWeight: "800", letterSpacing: 1.5 },
  heading: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 14, marginTop: 8, marginBottom: 20 },
  title: { color: "#493b2a", fontSize: 27, fontWeight: "800" },
  subtitle: { marginTop: 6, color: "#78664f", fontSize: 14, lineHeight: 21 },
  newButton: { minHeight: 38, justifyContent: "center", paddingHorizontal: 12, borderWidth: 1, borderColor: "#c9d2c3", borderRadius: 8 },
  newButtonText: { color: "#536b51", fontSize: 12, fontWeight: "700" },
  list: { gap: 13 },
  bookCard: { flexDirection: "row", alignItems: "center", gap: 15, padding: 15, borderWidth: 1, borderColor: "#e7dfd2", borderRadius: 14, backgroundColor: "#fffdf8" },
  cover: { width: 82, height: 114, borderRadius: 5, backgroundColor: "#e9e0d1" },
  coverPlaceholder: { alignItems: "center", justifyContent: "center", padding: 8, backgroundColor: "#536b51" },
  placeholderTitle: { color: "#fff8eb", fontSize: 11, fontWeight: "800", textAlign: "center" },
  placeholderMark: { marginTop: 7, color: "#f4e8d4", fontSize: 6, fontWeight: "700", letterSpacing: 0.4 },
  bookInfo: { flex: 1, minWidth: 0 },
  bookTitle: { color: "#493b2a", fontSize: 16, fontWeight: "700", textDecorationLine: "underline" },
  author: { marginTop: 4, color: "#817561", fontSize: 13 },
  bookMeta: { flexDirection: "row", flexWrap: "wrap", alignItems: "baseline", gap: 12, marginTop: 9 },
  price: { color: "#536b51", fontSize: 16, fontWeight: "800" },
  stock: { color: "#897b68", fontSize: 11 },
  actions: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 },
  editButton: { minHeight: 31, justifyContent: "center", paddingHorizontal: 11, borderWidth: 1, borderColor: "#c9d2c3", borderRadius: 7 },
  editButtonText: { color: "#536b51", fontSize: 12, fontWeight: "700" },
  deleteButton: { minWidth: 60, minHeight: 31, alignItems: "center", justifyContent: "center", paddingHorizontal: 10, borderWidth: 1, borderColor: "#e1c5bf", borderRadius: 7 },
  deleteButtonText: { color: "#9b463b", fontSize: 12, fontWeight: "700" },
  disabledButton: { opacity: 0.5 },
  emptyCard: { alignItems: "center", gap: 10, marginTop: 8, padding: 26, borderWidth: 1, borderColor: "#e7dfd2", borderRadius: 14, backgroundColor: "#fffdf8" },
  emptyTitle: { color: "#493b2a", fontSize: 17, fontWeight: "700", textAlign: "center" },
  emptyText: { color: "#78664f", fontSize: 13, lineHeight: 19, textAlign: "center" },
  primaryButton: { minHeight: 42, alignItems: "center", justifyContent: "center", marginTop: 4, paddingHorizontal: 16, borderRadius: 9, backgroundColor: "#536b51" },
  primaryButtonText: { color: "#fffdf8", fontSize: 13, fontWeight: "700" },
  errorNotice: { marginBottom: 14, color: "#9b463b", fontSize: 13, lineHeight: 19 },
  state: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24, backgroundColor: "#f5f1e8" },
  stateTitle: { color: "#493b2a", fontSize: 19, fontWeight: "700", textAlign: "center" },
  stateText: { maxWidth: 500, color: "#78664f", fontSize: 14, lineHeight: 21, textAlign: "center" },
});
