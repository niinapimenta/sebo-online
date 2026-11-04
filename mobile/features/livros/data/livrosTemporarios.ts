export type LivroTemporario = {
  id: string;
  titulo: string;
  autor: string;
  preco: number;
  corCapa: string;
  selo: string;
};

// Dados apenas para a composição visual. Substituir por useLivros/API quando a API estiver disponível.
export const livrosTemporarios: LivroTemporario[] = [
  {
    id: "demo-1",
    titulo: "O pequeno príncipe",
    autor: "Antoine de Saint-Exupéry",
    preco: 24.9,
    corCapa: "#b86c4b",
    selo: "CLÁSSICO",
  },
  {
    id: "demo-2",
    titulo: "A hora da estrela",
    autor: "Clarice Lispector",
    preco: 19.5,
    corCapa: "#60796b",
    selo: "LITERATURA",
  },
  {
    id: "demo-3",
    titulo: "Quarto de despejo",
    autor: "Carolina Maria de Jesus",
    preco: 32,
    corCapa: "#b29458",
    selo: "MEMÓRIA",
  },
  {
    id: "demo-4",
    titulo: "O livro do desassossego",
    autor: "Fernando Pessoa",
    preco: 38.9,
    corCapa: "#53677d",
    selo: "POESIA",
  },
];
