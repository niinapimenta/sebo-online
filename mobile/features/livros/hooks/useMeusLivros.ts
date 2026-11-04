import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import { consultaMeusLivrosHabilitada, criarServicoMeusLivros } from "../utils/meusLivros";
import type { Livro } from "../types/Livro";

const apiConfigurada = Boolean(process.env.EXPO_PUBLIC_API_URL?.trim());
const listarMeusLivros = criarServicoMeusLivros((path) => api.get<Livro[]>(path));

export function useMeusLivros(usuarioId: number | undefined) {
  return useQuery<Livro[]>({
    queryKey: ["livros", "meus-anuncios", usuarioId],
    queryFn: listarMeusLivros,
    enabled: consultaMeusLivrosHabilitada(usuarioId, apiConfigurada),
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 1000 * 60,
  });
}
