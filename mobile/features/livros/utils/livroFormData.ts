import type { FotoLivroArquivo } from "../components/FotoLivroCamera";
import type { LivroCreateData } from "../types/LivroSchema";

type LivroFormDataOptions = {
  data: LivroCreateData;
  foto?: FotoLivroArquivo;
  methodOverride?: "PUT";
};

type ArquivoFormDataReactNative = {
  uri: string;
  name: string;
  type: string;
};

export function montarLivroFormData({
  data,
  foto,
  methodOverride,
}: LivroFormDataOptions): FormData {
  const formData = new FormData();

  for (const [campo, valor] of Object.entries(data)) {
    formData.append(campo, valor === null ? "" : String(valor));
  }

  if (foto) {
    const formDataReactNative = formData as unknown as {
      append(campo: string, valor: string | ArquivoFormDataReactNative): void;
    };

    formDataReactNative.append("foto", {
      uri: foto.uri,
      name: foto.name,
      type: foto.type,
    });
  }

  if (methodOverride) {
    formData.append("_method", methodOverride);
  }

  return formData;
}
