import { useCreateLivro } from "../hooks/useCreateLivro";
import LivroForm from "../components/LivroForm";
import type { FotoLivroArquivo } from "../components/FotoLivroCamera";
import { mensagemErroApi } from "@/services/apiError";
import type { LivroCreateData } from "../types/LivroSchema";

const apiConfigurada = Boolean(process.env.EXPO_PUBLIC_API_URL?.trim());

export default function LivroCreateScreen() {
  const cadastro = useCreateLivro();

  function handleCreate(data: LivroCreateData, foto?: FotoLivroArquivo) {
    cadastro.mutate({ data, foto });
  }

  return (
    <LivroForm
      onSubmit={handleCreate}
      isSubmitting={cadastro.isPending}
      apiConfigurada={apiConfigurada}
      erroEnvio={mensagemErroApi(cadastro.error)}
    />
  );
}
