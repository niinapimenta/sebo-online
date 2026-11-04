import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import type { Livro } from "../types/Livro";

const apiConfigurada = Boolean(process.env.EXPO_PUBLIC_API_URL?.trim());

export function useLivros() {
  return useQuery<Livro[]>({
    queryKey: ["livros"],
    queryFn: async () => {
      const { data }: { data: Livro[] } = await api.get("/livros");
      return data;
    },
    enabled: apiConfigurada,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 1000 * 60 * 5,
  });
}
