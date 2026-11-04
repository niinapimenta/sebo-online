import type { Livro } from "../types/Livro";

export function criarServicoMeusLivros(
  get: (path: string) => Promise<{ data: Livro[] }>,
): () => Promise<Livro[]> {
  return async () => {
    const { data } = await get("/meus-livros");
    return data;
  };
}

export function consultaMeusLivrosHabilitada(
  usuarioId: number | undefined,
  apiConfigurada: boolean,
): boolean {
  return apiConfigurada && Number.isSafeInteger(usuarioId) && (usuarioId ?? 0) > 0;
}
