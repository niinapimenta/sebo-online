import assert from "node:assert/strict";
import test from "node:test";
import { podeComprarDoVendedor } from "../features/livros/utils/compraLivro.ts";

test("bloqueia a compra do próprio anúncio", () => {
  assert.equal(podeComprarDoVendedor(12, 12), false);
});

test("permite comprar anúncio de outro vendedor", () => {
  assert.equal(podeComprarDoVendedor(12, 34), true);
});

test("mantém o comportamento para usuário não autenticado", () => {
  assert.equal(podeComprarDoVendedor(12, null), true);
});
