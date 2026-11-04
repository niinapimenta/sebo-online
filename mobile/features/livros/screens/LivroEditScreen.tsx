import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { mensagemErroApi } from "@/services/apiError";
import LivroForm from "../components/LivroForm";
import type { FotoLivroArquivo } from "../components/FotoLivroCamera";
import { useLivro } from "../hooks/useLivro";
import { useUpdateLivro } from "../hooks/useUpdateLivro";
import type { LivroFormValues } from "../types/LivroSchema";

const apiConfigurada = Boolean(process.env.EXPO_PUBLIC_API_URL?.trim());

export default function LivroEditScreen({ id }: { id: string }) {
  const livroQuery = useLivro(id);
  const atualizacao = useUpdateLivro();

  if (!apiConfigurada) {
    return (
      <EstadoEdicao mensagem="A edição depende da conexão com o backend Laravel. A API ainda não está configurada neste aplicativo." />
    );
  }

  if (livroQuery.isLoading) {
    return (
      <View style={styles.stateContainer}>
        <ActivityIndicator size="large" color="#536b51" />
        <Text style={styles.stateMessage}>Carregando livro…</Text>
      </View>
    );
  }

  if (livroQuery.isError || !livroQuery.data) {
    return (
      <EstadoEdicao
        mensagem={`Não foi possível carregar este livro da API. ${livroQuery.error?.message ?? "Livro não encontrado."}`}
        onRetry={() => void livroQuery.refetch()}
      />
    );
  }

  const livro = livroQuery.data;
  const initialData: LivroFormValues = {
    titulo: livro.titulo,
    autor: livro.autor,
    editora: livro.editora ?? "",
    preco: String(livro.preco),
    estoque: String(livro.estoque),
    ano_publicacao: String(livro.ano_publicacao),
    data_publicacao: livro.data_publicacao,
    descricao: livro.descricao ?? "",
  };

  return (
    <LivroForm
      initialData={initialData}
      onSubmit={(data, foto?: FotoLivroArquivo) =>
        atualizacao.mutate({ id, data, foto })
      }
      isSubmitting={atualizacao.isPending}
      apiConfigurada={apiConfigurada}
      erroEnvio={mensagemErroApi(atualizacao.error)}
      submitLabel="Salvar alterações"
      connectionMessage="A edição depende da conexão com o backend Laravel."
    />
  );
}

function EstadoEdicao({ mensagem, onRetry }: { mensagem: string; onRetry?: () => void }) {
  return (
    <View style={styles.stateContainer}>
      <Text style={styles.errorTitle}>Edição indisponível</Text>
      <Text style={styles.errorMessage}>{mensagem}</Text>
      {onRetry ? (
        <TouchableOpacity accessibilityRole="button" onPress={onRetry} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Tentar novamente</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stateContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "#f5f1e8",
    padding: 24,
  },
  stateMessage: {
    color: "#78664f",
    fontSize: 14,
  },
  errorTitle: {
    color: "#493b2a",
    fontSize: 19,
    fontWeight: "700",
    textAlign: "center",
  },
  errorMessage: {
    color: "#78664f",
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
    borderRadius: 9,
    backgroundColor: "#536b51",
  },
  retryButtonText: { color: "#fffdf8", fontSize: 13, fontWeight: "700" },
});
