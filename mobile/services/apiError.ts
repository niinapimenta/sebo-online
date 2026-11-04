import axios from "axios";

type LaravelErrorResponse = {
  message?: unknown;
  errors?: Record<string, unknown>;
};

export function mensagemErroApi(error: unknown): string | undefined {
  if (!error) return undefined;

  if (axios.isAxiosError<LaravelErrorResponse>(error)) {
    const status = error.response?.status;

    if (status === 413) {
      return "A foto excede o limite de 5 MB.";
    }

    const errosValidacao = error.response?.data?.errors;
    if (errosValidacao) {
      const mensagens = Object.values(errosValidacao).flatMap((valor) =>
        Array.isArray(valor) ? valor : [valor],
      );
      const mensagensTexto = mensagens.filter(
        (mensagem): mensagem is string => typeof mensagem === "string",
      );

      if (mensagensTexto.length > 0) return mensagensTexto.join(" ");
    }

    const mensagemServidor = error.response?.data?.message;
    if (typeof mensagemServidor === "string") return mensagemServidor;

    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      return "A conexão com o servidor expirou. Tente novamente.";
    }

    if (!error.response) {
      return "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.";
    }

    return error.message;
  }

  return error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
}
