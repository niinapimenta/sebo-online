import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import api from "@/services/api";
import type { FotoLivroArquivo } from "../components/FotoLivroCamera";
import type { Livro } from "../types/Livro";
import type { LivroCreateData } from "../types/LivroSchema";
import { montarLivroFormData } from "../utils/livroFormData";

const apiConfigurada = Boolean(process.env.EXPO_PUBLIC_API_URL?.trim());

type NovoLivro = {
  data: LivroCreateData;
  foto?: FotoLivroArquivo;
};

export function useCreateLivro() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ data, foto }: NovoLivro) => {
      if (!apiConfigurada) {
        throw new Error(
          "O cadastro depende da conexão com a API Laravel. Configure EXPO_PUBLIC_API_URL para continuar.",
        );
      }

      const formData = montarLivroFormData({ data, foto });
      const response = await api.post<Livro>("/livros", formData);

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["livros"] });
      router.back();
    },
  });
}
