import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import api from "@/services/api";
import type { FotoLivroArquivo } from "../components/FotoLivroCamera";
import type { Livro } from "../types/Livro";
import type { LivroCreateData } from "../types/LivroSchema";
import { montarLivroFormData } from "../utils/livroFormData";

const apiConfigurada = Boolean(process.env.EXPO_PUBLIC_API_URL?.trim());

type AtualizacaoLivro = {
  id: string;
  data: LivroCreateData;
  foto?: FotoLivroArquivo;
};

export function useUpdateLivro() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data, foto }: AtualizacaoLivro) => {
      if (!apiConfigurada) {
        throw new Error(
          "A edição depende da conexão com a API Laravel. Configure EXPO_PUBLIC_API_URL para continuar.",
        );
      }

      const formData = montarLivroFormData({
        data,
        foto,
        methodOverride: "PUT",
      });
      const response = await api.post<Livro>(`/livros/${id}`, formData);

      return response.data;
    },
    onSuccess: (livroAtualizado, variables) => {
      queryClient.setQueryData(["livros", variables.id], livroAtualizado);
      queryClient.invalidateQueries({ queryKey: ["livros"] });
      router.back();
    },
  });
}
