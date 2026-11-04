import type { CheckoutPayload, PedidoConfirmado } from "../types/Pedido";
import type { ItemCarrinho } from "../types/Carrinho";

export function montarPayloadCheckout(
  itens: Pick<ItemCarrinho, "livroId" | "quantidade">[],
): CheckoutPayload {
  return {
    itens: itens.map(({ livroId, quantidade }) => ({
      livro_id: livroId,
      quantidade,
    })),
  };
}

export class CheckoutEmAndamentoError extends Error {
  constructor() {
    super("Já existe um pedido sendo enviado.");
    this.name = "CheckoutEmAndamentoError";
  }
}

export function criarServicoCheckout(
  enviar: (payload: CheckoutPayload) => Promise<PedidoConfirmado>,
): (payload: CheckoutPayload) => Promise<PedidoConfirmado> {
  let enviando = false;

  return async (payload) => {
    if (enviando) throw new CheckoutEmAndamentoError();
    enviando = true;
    try {
      return await enviar(payload);
    } finally {
      enviando = false;
    }
  };
}
