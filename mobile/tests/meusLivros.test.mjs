import assert from "node:assert/strict";
import test from "node:test";
import { criarServicoMeusLivros, consultaMeusLivrosHabilitada } from "../features/livros/utils/meusLivros.ts";
import { mensagemErroApi } from "../services/apiError.ts";

const anuncios = [
  { id: 21, titulo: "Anúncio próprio", estoque: 2, preco: 24.5 },
];

test("consulta a rota autenticada de anúncios próprios", async () => {
  let rota;
  const listar = criarServicoMeusLivros(async (path) => {
    rota = path;
    return { data: anuncios };
  });

  assert.deepEqual(await listar(), anuncios);
  assert.equal(rota, "/meus-livros");
});

test("aceita resposta vazia da API", async () => {
  const listar = criarServicoMeusLivros(async () => ({ data: [] }));
  assert.deepEqual(await listar(), []);
});

test("propaga erro da API para o estado de erro e nova tentativa", async () => {
  const erro = {
    isAxiosError: true,
    response: { status: 500, data: { message: "Falha ao carregar anúncios." } },
  };
  const listar = criarServicoMeusLivros(async () => { throw erro; });

  await assert.rejects(listar(), (recebido) => recebido === erro);
  assert.equal(mensagemErroApi(erro), "Falha ao carregar anúncios.");
});

test("habilita a listagem somente quando há usuário autenticado", () => {
  assert.equal(consultaMeusLivrosHabilitada(undefined, true), false);
  assert.equal(consultaMeusLivrosHabilitada(12, false), false);
  assert.equal(consultaMeusLivrosHabilitada(0, true), false);
  assert.equal(consultaMeusLivrosHabilitada(12, true), true);
});
