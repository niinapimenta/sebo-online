import api from "@/services/api";
import { criarServicoCheckout } from "../utils/checkout";
import { criarServicoHistorico } from "../utils/historicoCompras";
import type { PedidoConfirmado } from "../types/Pedido";

export const enviarPedido = criarServicoCheckout(async (payload) => {
  const { data } = await api.post<PedidoConfirmado>("/pedidos", payload);
  return data;
});

export const listarPedidos = criarServicoHistorico(async (path) =>
  api.get<PedidoConfirmado[]>(path),
);
