import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import type {
  BibliotecaVendedor,
  BibliotecaVendedorApiResponse,
} from "../types/Vendedor";

const apiConfigurada = Boolean(process.env.EXPO_PUBLIC_API_URL?.trim());

export function useBibliotecaVendedor(id: string) {
  return useQuery<BibliotecaVendedor>({
    queryKey: ["vendedores", id],
    queryFn: async () => {
      const { data }: { data: BibliotecaVendedorApiResponse } = await api.get(
        `/vendedores/${id}`,
      );

      return data.data;
    },
    enabled: Boolean(id) && apiConfigurada,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 1000 * 60 * 5,
  });
}
