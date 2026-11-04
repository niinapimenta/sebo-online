export type LivroParaCarrinho = {
  id: number | string | null | undefined;
  titulo: string;
  preco: number;
  estoque: number;
  foto: string | null;
  vendedor: {
    id: number;
    name: string;
  } | null;
  temporario?: boolean;
};

export type ItemCarrinho = {
  livroId: number;
  quantidade: number;
  titulo: string;
  precoCentavos: number;
  estoque: number;
  foto: string | null;
  vendedor: LivroParaCarrinho["vendedor"];
};

export type ItemCarrinhoComSubtotal = ItemCarrinho & {
  subtotalCentavos: number;
};

export type Carrinho = {
  itens: ItemCarrinho[];
};

export type ResultadoCarrinho =
  | { sucesso: true; carrinho: Carrinho }
  | {
      sucesso: false;
      carrinho: Carrinho;
      erro: "livro_invalido" | "estoque_indisponivel" | "quantidade_invalida" | "quantidade_acima_estoque";
    };
