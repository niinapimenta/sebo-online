import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  adicionarLivro as adicionar,
  alterarQuantidade as alterar,
  carrinhoVazio,
  obterItensComSubtotal,
  obterTotalCentavos,
  removerLivro as remover,
} from "../utils/carrinho";
import { restaurarCarrinho, salvarCarrinho } from "../storage/carrinhoStorage";
import type { Carrinho, LivroParaCarrinho, ResultadoCarrinho } from "../types/Carrinho";

type CarrinhoContextValue = {
  carrinho: Carrinho;
  restaurado: boolean;
  itens: ReturnType<typeof obterItensComSubtotal>;
  totalCentavos: number;
  adicionarLivro: (livro: LivroParaCarrinho) => ResultadoCarrinho;
  alterarQuantidade: (livroId: number, quantidade: number) => ResultadoCarrinho;
  removerLivro: (livroId: number) => void;
  limparCarrinho: () => void;
};

const CarrinhoContext = createContext<CarrinhoContextValue | null>(null);

export function CarrinhoProvider({ children }: { children: ReactNode }) {
  const [carrinho, setCarrinho] = useState<Carrinho>(carrinhoVazio);
  const carrinhoAtual = useRef(carrinho);
  const [restaurado, setRestaurado] = useState(false);
  const restauradoRef = useRef(false);
  const operacoesPendentes = useRef<Array<(atual: Carrinho) => Carrinho>>([]);

  useEffect(() => {
    let ativo = true;
    void restaurarCarrinho().then((salvo) => {
      if (!ativo) return;
      const restauradoComOperacoes = operacoesPendentes.current.reduce(
        (atual, operacao) => operacao(atual),
        salvo,
      );
      operacoesPendentes.current = [];
      carrinhoAtual.current = restauradoComOperacoes;
      restauradoRef.current = true;
      setCarrinho(restauradoComOperacoes);
      setRestaurado(true);
    });
    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    if (restaurado) void salvarCarrinho(carrinho);
  }, [carrinho, restaurado]);

  const adicionarLivro = useCallback((livro: LivroParaCarrinho) => {
    const resultado = adicionar(carrinhoAtual.current, livro);
    if (!restauradoRef.current && resultado.sucesso) {
      operacoesPendentes.current.push((atual) => adicionar(atual, livro).carrinho);
    }
    carrinhoAtual.current = resultado.carrinho;
    setCarrinho(resultado.carrinho);
    return resultado;
  }, []);

  const alterarQuantidade = useCallback((livroId: number, quantidade: number) => {
    const resultado = alterar(carrinhoAtual.current, livroId, quantidade);
    if (!restauradoRef.current && resultado.sucesso) {
      operacoesPendentes.current.push((atual) => alterar(atual, livroId, quantidade).carrinho);
    }
    carrinhoAtual.current = resultado.carrinho;
    setCarrinho(resultado.carrinho);
    return resultado;
  }, []);

  const removerLivro = useCallback((livroId: number) => {
    if (!restauradoRef.current) {
      operacoesPendentes.current.push((atual) => remover(atual, livroId));
    }
    const proximo = remover(carrinhoAtual.current, livroId);
    carrinhoAtual.current = proximo;
    setCarrinho(proximo);
  }, []);

  const limparCarrinho = useCallback(() => {
    if (!restauradoRef.current) {
      operacoesPendentes.current.push(() => carrinhoVazio);
    }
    carrinhoAtual.current = carrinhoVazio;
    setCarrinho(carrinhoVazio);
  }, []);

  const value = useMemo(
    () => ({
      carrinho,
      restaurado,
      itens: obterItensComSubtotal(carrinho),
      totalCentavos: obterTotalCentavos(carrinho),
      adicionarLivro,
      alterarQuantidade,
      removerLivro,
      limparCarrinho,
    }),
    [carrinho, restaurado, adicionarLivro, alterarQuantidade, removerLivro, limparCarrinho],
  );

  return <CarrinhoContext.Provider value={value}>{children}</CarrinhoContext.Provider>;
}

export function useCarrinho(): CarrinhoContextValue {
  const context = useContext(CarrinhoContext);
  if (!context) {
    throw new Error("useCarrinho deve ser usado dentro de CarrinhoProvider.");
  }
  return context;
}
