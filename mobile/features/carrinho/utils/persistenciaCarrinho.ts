import type { Carrinho, ItemCarrinho } from "../types/Carrinho";

export const VERSAO_CARRINHO = 1;
const carrinhoVazio: Carrinho = { itens: [] };

export type ArmazenamentoCarrinho = {
  getItem: (chave: string) => Promise<string | null>;
  setItem: (chave: string, valor: string) => Promise<void>;
  removeItem?: (chave: string) => Promise<void>;
};

export function desserializarCarrinho(valor: string | null): Carrinho {
  if (!valor) return carrinhoVazio;

  try {
    const salvo: unknown = JSON.parse(valor);
    if (!ehRegistro(salvo) || salvo.versao !== VERSAO_CARRINHO || !Array.isArray(salvo.itens)) {
      return carrinhoVazio;
    }

    const itensValidos: ItemCarrinho[] = [];
    const ids = new Set<number>();
    for (const item of salvo.itens) {
      if (!itemValido(item) || ids.has(item.livroId)) continue;
      ids.add(item.livroId);
      itensValidos.push(item);
    }
    if (salvo.itens.length > 0 && itensValidos.length === 0) return carrinhoVazio;
    return { itens: itensValidos };
  } catch {
    return carrinhoVazio;
  }
}

export function serializarCarrinho(carrinho: Carrinho): string {
  return JSON.stringify({ versao: VERSAO_CARRINHO, itens: carrinho.itens });
}

export function criarPersistenciaCarrinho(armazenamento: ArmazenamentoCarrinho, chave: string) {
  let escritasEmFila = Promise.resolve();
  return {
    async restaurar(): Promise<Carrinho> {
      try {
        const salvo = await armazenamento.getItem(chave);
        const carrinho = desserializarCarrinho(salvo);
        if (salvo && carrinho === carrinhoVazio) {
          await armazenamento.removeItem?.(chave);
        } else if (salvo && serializarCarrinho(carrinho) !== salvo) {
          await armazenamento.setItem(chave, serializarCarrinho(carrinho));
        }
        return carrinho;
      } catch {
        return carrinhoVazio;
      }
    },
    salvar(carrinho: Carrinho): Promise<void> {
      const valor = serializarCarrinho(carrinho);
      escritasEmFila = escritasEmFila.then(async () => {
        try {
          await armazenamento.setItem(chave, valor);
        } catch {
          // Falha no armazenamento local não deve interromper o uso do aplicativo.
        }
      });
      return escritasEmFila;
    },
  };
}

function ehRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

function itemValido(valor: unknown): valor is ItemCarrinho {
  if (!ehRegistro(valor)) return false;
  const vendedor = valor.vendedor;
  const vendedorValido =
    vendedor === null ||
    (ehRegistro(vendedor) &&
      Number.isSafeInteger(vendedor.id) &&
      (vendedor.id as number) > 0 &&
      typeof vendedor.name === "string");

  return (
    Number.isSafeInteger(valor.livroId) &&
    (valor.livroId as number) > 0 &&
    Number.isSafeInteger(valor.quantidade) &&
    (valor.quantidade as number) >= 1 &&
    Number.isSafeInteger(valor.estoque) &&
    (valor.estoque as number) >= (valor.quantidade as number) &&
    Number.isSafeInteger(valor.precoCentavos) &&
    (valor.precoCentavos as number) >= 0 &&
    typeof valor.titulo === "string" &&
    Boolean(valor.titulo.trim()) &&
    (typeof valor.foto === "string" || valor.foto === null) &&
    vendedorValido
  );
}
