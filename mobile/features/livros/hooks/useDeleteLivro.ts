import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import type { Livro } from "../types/Livro";

const apiConfigurada = Boolean(process.env.EXPO_PUBLIC_API_URL?.trim());

export function useDeleteLivro() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!apiConfigurada) {
        throw new Error(
          "A exclusão depende da conexão com a API Laravel. Configure EXPO_PUBLIC_API_URL para continuar.",
        );
      }

      await api.delete(`/livros/${id}`);
      return id;
    },
    onSuccess: (id) => {
      queryClient.setQueryData<Livro[]>(["livros"], (livros) =>
        livros?.filter((livro) => String(livro.id) !== id),
      );
      queryClient.removeQueries({ queryKey: ["livros", id], exact: true });
      queryClient.invalidateQueries({ queryKey: ["livros"] });
    },
  });
}
