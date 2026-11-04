import type { PedidoConfirmado } from "../types/Pedido";

export function criarServicoHistorico(
  get: (path: string) => Promise<{ data: PedidoConfirmado[] }>,
): () => Promise<PedidoConfirmado[]> {
  return async () => {
    const { data } = await get("/pedidos");
    return data;
  };
}

export function historicoHabilitado(
  usuarioId: number | undefined,
  apiConfigurada: boolean,
): boolean {
  return apiConfigurada && Number.isSafeInteger(usuarioId) && (usuarioId ?? 0) > 0;
}
