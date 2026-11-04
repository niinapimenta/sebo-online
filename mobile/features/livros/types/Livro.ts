export type Livro = {
  id: number;
  titulo: string;
  autor: string;
  editora: string | null;
  preco: number;
  estoque: number;
  ano_publicacao: number;
  data_publicacao: string;
  descricao: string | null;
  foto: string | null;
  vendedor: {
    id: number;
    name: string;
  } | null;
  created_at: string | null;
  updated_at: string | null;
};
