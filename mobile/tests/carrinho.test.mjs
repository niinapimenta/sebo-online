import assert from "node:assert/strict";
import test from "node:test";
import {
  adicionarLivro,
  alterarQuantidade,
  carrinhoVazio,
  obterItensComSubtotal,
  obterTotalCentavos,
  removerLivro,
} from "../features/carrinho/utils/carrinho.ts";
import { criarPersistenciaCarrinho } from "../features/carrinho/utils/persistenciaCarrinho.ts";

const livro = (id, vendedorId, preco = 10.1, estoque = 4, extras = {}) => ({
  id,
  titulo: `Livro ${id}`,
  preco,
  estoque,
  foto: null,
  vendedor: { id: vendedorId, name: `Vendedor ${vendedorId}` },
  ...extras,
});

function adicionar(carrinho, item) {
  const resultado = adicionarLivro(carrinho, item);
  assert.equal(resultado.sucesso, true);
  return resultado.carrinho;
}

test("adiciona livro e incrementa a quantidade ao adicionar novamente", () => {
  let carrinho = adicionar(carrinhoVazio, livro(1, 10));
  carrinho = adicionar(carrinho, livro(1, 10));
  assert.equal(carrinho.itens.length, 1);
  assert.equal(carrinho.itens[0].quantidade, 2);
  assert.equal(carrinho.itens[0].precoCentavos, 1010);
});

test("mantém livros de vendedores diferentes no mesmo carrinho", () => {
  let carrinho = adicionar(carrinhoVazio, livro(1, 10));
  carrinho = adicionar(carrinho, livro(2, 20, 5));
  assert.deepEqual(carrinho.itens.map((item) => item.vendedor.id), [10, 20]);
});

test("altera quantidade e bloqueia quantidade menor que um ou acima do estoque", () => {
  let carrinho = adicionar(carrinhoVazio, livro(1, 10, 10, 3));
  const alterado = alterarQuantidade(carrinho, 1, 3);
  assert.equal(alterado.sucesso, true);
  carrinho = alterado.carrinho;
  assert.equal(carrinho.itens[0].quantidade, 3);
  assert.equal(alterarQuantidade(carrinho, 1, 4).erro, "quantidade_acima_estoque");
  assert.equal(alterarQuantidade(carrinho, 1, 0).erro, "quantidade_invalida");
  assert.equal(carrinho.itens[0].quantidade, 3);
});

test("calcula subtotal e total em centavos e remove item", () => {
  let carrinho = adicionar(carrinhoVazio, livro(1, 10, 10.1));
  carrinho = adicionar(carrinho, livro(1, 10, 10.1));
  carrinho = adicionar(carrinho, livro(2, 20, 5.25));
  assert.deepEqual(obterItensComSubtotal(carrinho).map((item) => item.subtotalCentavos), [2020, 525]);
  assert.equal(obterTotalCentavos(carrinho), 2545);
  carrinho = removerLivro(carrinho, 1);
  assert.deepEqual(carrinho.itens.map((item) => item.livroId), [2]);
});

test("impede livro temporário, sem ID real e sem estoque", () => {
  assert.equal(adicionarLivro(carrinhoVazio, livro("demo-1", 1)).erro, "livro_invalido");
  assert.equal(adicionarLivro(carrinhoVazio, livro(null, 1)).erro, "livro_invalido");
  assert.equal(adicionarLivro(carrinhoVazio, livro(1, 1, 10, 0)).erro, "estoque_indisponivel");
  assert.equal(adicionarLivro(carrinhoVazio, livro(1, 1, 10, 4, { temporario: true })).erro, "livro_invalido");
});

test("impede adicionar além do estoque disponível", () => {
  let carrinho = adicionar(carrinhoVazio, livro(1, 10, 10, 1));
  const resultado = adicionarLivro(carrinho, livro(1, 10, 10, 1));
  assert.equal(resultado.erro, "quantidade_acima_estoque");
  assert.equal(carrinho.itens[0].quantidade, 1);
});

test("restaura o carrinho salvo e salva alterações para uma próxima inicialização", async () => {
  const dados = new Map();
  const storage = {
    async getItem(chave) { return dados.get(chave) ?? null; },
    async setItem(chave, valor) { dados.set(chave, valor); },
    async removeItem(chave) { dados.delete(chave); },
  };
  const persistencia = criarPersistenciaCarrinho(storage, "carrinho-teste");
  const carrinho = adicionar(carrinhoVazio, livro(8, 3, 12.34, 5));

  await persistencia.salvar(carrinho);
  const restaurado = await criarPersistenciaCarrinho(storage, "carrinho-teste").restaurar();
  assert.deepEqual(restaurado, carrinho);
});

test("descarta dados inválidos ou de versão incompatível sem falhar", async () => {
  const dados = new Map([
    ["corrompido", "{json"],
    ["incompativel", JSON.stringify({ versao: 99, itens: [] })],
    ["item-invalido", JSON.stringify({ versao: 1, itens: [{ livroId: -2 }] })],
  ]);
  const storage = {
    async getItem(chave) { return dados.get(chave) ?? null; },
    async setItem(chave, valor) { dados.set(chave, valor); },
    async removeItem(chave) { dados.delete(chave); },
  };

  for (const chave of ["corrompido", "incompativel", "item-invalido"]) {
    const restaurado = await criarPersistenciaCarrinho(storage, chave).restaurar();
    assert.deepEqual(restaurado, carrinhoVazio);
    assert.equal(dados.has(chave), false);
  }
});

test("ignora somente itens inválidos dentro de um carrinho parcialmente legível", async () => {
  const valido = adicionar(carrinhoVazio, livro(4, 7)).itens[0];
  const dados = JSON.stringify({ versao: 1, itens: [valido, { ...valido, quantidade: 99 }] });
  const persistencia = criarPersistenciaCarrinho({
    async getItem() { return dados; },
    async setItem() {},
  }, "carrinho-teste");

  assert.deepEqual(await persistencia.restaurar(), { itens: [valido] });
});

test("falhas de leitura e gravação do armazenamento não propagam exceções", async () => {
  const persistencia = criarPersistenciaCarrinho({
    async getItem() { throw new Error("storage indisponível"); },
    async setItem() { throw new Error("storage indisponível"); },
  }, "carrinho-teste");

  assert.deepEqual(await persistencia.restaurar(), carrinhoVazio);
  await assert.doesNotReject(() => persistencia.salvar(carrinhoVazio));
});
