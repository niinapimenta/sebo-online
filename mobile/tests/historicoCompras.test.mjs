import assert from "node:assert/strict";
import test from "node:test";
import {
  criarServicoHistorico,
  historicoHabilitado,
} from "../features/carrinho/utils/historicoCompras.ts";

const pedidos = [
  { id: 11, total: "28.50", created_at: "2026-11-04T09:30:00.000Z", status: "confirmado", itens: [] },
  { id: 8, total: "12.00", created_at: "2026-10-30T12:00:00.000Z", status: "confirmado", itens: [] },
];

test("consulta GET /pedidos e retorna a lista da API", async () => {
  let caminhoConsultado;
  const listar = criarServicoHistorico(async (path) => {
    caminhoConsultado = path;
    return { data: pedidos };
  });

  assert.deepEqual(await listar(), pedidos);
  assert.equal(caminhoConsultado, "/pedidos");
});

test("retorna lista vazia quando o usuário ainda não tem pedidos", async () => {
  const listar = criarServicoHistorico(async () => ({ data: [] }));
  assert.deepEqual(await listar(), []);
});

test("propaga falhas da API para o estado de erro e retry do React Query", async () => {
  const erro = new Error("API indisponível");
  const listar = criarServicoHistorico(async () => { throw erro; });
  await assert.rejects(listar(), (recebido) => recebido === erro);
});

test("só habilita a consulta com API configurada e usuário autenticado", () => {
  assert.equal(historicoHabilitado(undefined, true), false);
  assert.equal(historicoHabilitado(15, false), false);
  assert.equal(historicoHabilitado(0, true), false);
  assert.equal(historicoHabilitado(15, true), true);
});
