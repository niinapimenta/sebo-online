import type {
  Carrinho,
  ItemCarrinhoComSubtotal,
  LivroParaCarrinho,
  ResultadoCarrinho,
} from "../types/Carrinho";

export const carrinhoVazio: Carrinho = { itens: [] };

export function precoEmCentavos(preco: number): number | null {
  if (!Number.isFinite(preco) || preco < 0) return null;
  return Math.round(preco * 100);
}

export function adicionarLivro(
  carrinho: Carrinho,
  livro: LivroParaCarrinho,
): ResultadoCarrinho {
  const livroId = Number(livro.id);
  const precoCentavos = precoEmCentavos(livro.preco);
  if (
    livro.temporario ||
    !Number.isSafeInteger(livroId) ||
    livroId <= 0 ||
    !livro.titulo.trim() ||
    precoCentavos === null ||
    !Number.isInteger(livro.estoque) ||
    livro.estoque < 0
  ) {
    return falha(carrinho, "livro_invalido");
  }
  if (livro.estoque === 0) return falha(carrinho, "estoque_indisponivel");

  const existente = carrinho.itens.find((item) => item.livroId === livroId);
  const novaQuantidade = (existente?.quantidade ?? 0) + 1;
  if (novaQuantidade > livro.estoque) {
    return falha(carrinho, "quantidade_acima_estoque");
  }

  const novoItem = {
    livroId,
    quantidade: novaQuantidade,
    titulo: livro.titulo,
    precoCentavos,
    estoque: livro.estoque,
    foto: livro.foto,
    vendedor: livro.vendedor,
  };
  const itens = existente
    ? carrinho.itens.map((item) => (item.livroId === livroId ? novoItem : item))
    : [...carrinho.itens, novoItem];

  return { sucesso: true, carrinho: { itens } };
}

export function alterarQuantidade(
  carrinho: Carrinho,
  livroId: number,
  quantidade: number,
): ResultadoCarrinho {
  if (!Number.isInteger(quantidade) || quantidade < 1) {
    return falha(carrinho, "quantidade_invalida");
  }
  const item = carrinho.itens.find((atual) => atual.livroId === livroId);
  if (!item) return falha(carrinho, "livro_invalido");
  if (quantidade > item.estoque) {
    return falha(carrinho, "quantidade_acima_estoque");
  }

  return {
    sucesso: true,
    carrinho: {
      itens: carrinho.itens.map((atual) =>
        atual.livroId === livroId ? { ...atual, quantidade } : atual,
      ),
    },
  };
}

export function removerLivro(carrinho: Carrinho, livroId: number): Carrinho {
  return {
    itens: carrinho.itens.filter((item) => item.livroId !== livroId),
  };
}

export function obterItensComSubtotal(carrinho: Carrinho): ItemCarrinhoComSubtotal[] {
  return carrinho.itens.map((item) => ({
    ...item,
    subtotalCentavos: item.precoCentavos * item.quantidade,
  }));
}

export function obterTotalCentavos(carrinho: Carrinho): number {
  return carrinho.itens.reduce(
    (total, item) => total + item.precoCentavos * item.quantidade,
    0,
  );
}

function falha(
  carrinho: Carrinho,
  erro: Extract<ResultadoCarrinho, { sucesso: false }>["erro"],
): ResultadoCarrinho {
  return { sucesso: false, carrinho, erro };
}
