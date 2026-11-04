export type CheckoutPayload = {
  itens: Array<{ livro_id: number; quantidade: number }>;
};

export type PedidoConfirmado = {
  id: number;
  status: string;
  total: string;
  created_at: string;
  itens: Array<{
    id: number;
    livro_id: number | null;
    titulo: string;
    autor: string;
    foto: string | null;
    vendedor: { id: number; name: string } | null;
    preco_unitario: string;
    quantidade: number;
    subtotal: string;
  }>;
};
