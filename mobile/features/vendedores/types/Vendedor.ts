import type { Livro } from "@/features/livros/types/Livro";

export type VendedorPublico = {
  id: number;
  name: string;
};

export type BibliotecaVendedor = {
  vendedor: VendedorPublico;
  livros: Livro[];
};

export type BibliotecaVendedorApiResponse = {
  data: BibliotecaVendedor;
};
