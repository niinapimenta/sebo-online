import { useQuery } from "@tanstack/react-query";
import { listarPedidos } from "../api/pedidosApi";
import { historicoHabilitado } from "../utils/historicoCompras";
import type { PedidoConfirmado } from "../types/Pedido";

const apiConfigurada = Boolean(process.env.EXPO_PUBLIC_API_URL?.trim());

export function useHistoricoCompras(usuarioId: number | undefined) {
  return useQuery<PedidoConfirmado[]>({
    queryKey: ["pedidos", usuarioId],
    queryFn: listarPedidos,
    enabled: historicoHabilitado(usuarioId, apiConfigurada),
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 1000 * 60,
  });
}
