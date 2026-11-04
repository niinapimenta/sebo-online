import assert from "node:assert/strict";
import test from "node:test";
import {
  CheckoutEmAndamentoError,
  criarServicoCheckout,
  montarPayloadCheckout,
} from "../features/carrinho/utils/checkout.ts";
import { mensagemErroApi } from "../services/apiError.ts";

const pedido = {
  id: 42,
  status: "confirmado",
  total: "57.80",
  created_at: "2026-11-04T10:00:00.000Z",
  itens: [],
};

test("monta o payload apenas com IDs dos livros e quantidades", () => {
  const payload = montarPayloadCheckout([
    { livroId: 7, quantidade: 2, precoCentavos: 2000, subtotalCentavos: 4000 },
    { livroId: 9, quantidade: 1, precoCentavos: 1780, subtotalCentavos: 1780 },
  ]);
  assert.deepEqual(payload, {
    itens: [
      { livro_id: 7, quantidade: 2 },
      { livro_id: 9, quantidade: 1 },
    ],
  });
});

test("retorna a confirmação enviada pelo servidor após sucesso", async () => {
  let payloadEnviado;
  const checkout = criarServicoCheckout(async (payload) => {
    payloadEnviado = payload;
    return pedido;
  });
  const payload = montarPayloadCheckout([{ livroId: 7, quantidade: 2 }]);

  assert.equal(await checkout(payload), pedido);
  assert.deepEqual(payloadEnviado, payload);
});

test("propaga erro 422 do servidor e disponibiliza suas mensagens de validação", async () => {
  const erro = {
    isAxiosError: true,
    response: {
      status: 422,
      data: { errors: { "itens.0.quantidade": ["A quantidade excede o estoque disponível."] } },
    },
  };
  const checkout = criarServicoCheckout(async () => { throw erro; });

  await assert.rejects(checkout({ itens: [{ livro_id: 7, quantidade: 3 }] }), (recebido) => recebido === erro);
  assert.equal(mensagemErroApi(erro), "A quantidade excede o estoque disponível.");
});

test("propaga falha de conexão e apresenta mensagem compreensível", async () => {
  const erro = { isAxiosError: true, code: "ERR_NETWORK" };
  const checkout = criarServicoCheckout(async () => { throw erro; });

  await assert.rejects(checkout({ itens: [{ livro_id: 7, quantidade: 1 }] }), (recebido) => recebido === erro);
  assert.match(mensagemErroApi(erro), /conectar ao servidor/i);
});

test("bloqueia envio duplicado enquanto a primeira requisição está pendente", async () => {
  let concluir;
  let chamadas = 0;
  const checkout = criarServicoCheckout(() => {
    chamadas += 1;
    if (chamadas > 1) return Promise.resolve(pedido);
    return new Promise((resolve) => { concluir = resolve; });
  });
  const primeiraRequisicao = checkout({ itens: [{ livro_id: 7, quantidade: 1 }] });
  await Promise.resolve();

  await assert.rejects(
    checkout({ itens: [{ livro_id: 7, quantidade: 1 }] }),
    CheckoutEmAndamentoError,
  );

  concluir(pedido);
  assert.equal(await primeiraRequisicao, pedido);
  assert.equal(await checkout({ itens: [{ livro_id: 7, quantidade: 1 }] }), pedido);
  assert.equal(chamadas, 2);
});
