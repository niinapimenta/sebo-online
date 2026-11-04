import { useMutation, useQueryClient } from "@tanstack/react-query";
import { enviarPedido } from "../api/pedidosApi";
import type { CheckoutPayload } from "../types/Pedido";

export function useFinalizarPedido() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CheckoutPayload) => enviarPedido(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["livros"] }),
        queryClient.invalidateQueries({ queryKey: ["vendedores"] }),
        queryClient.invalidateQueries({ queryKey: ["pedidos"] }),
      ]);
    },
  });
}
