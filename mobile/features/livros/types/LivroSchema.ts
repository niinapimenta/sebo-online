import { z } from "zod";

const numeroPositivo = z
  .string()
  .trim()
  .min(1, "Informe o preço.")
  .regex(/^(?:\d+|\d+[.,]\d+|[.,]\d+)$/, "Informe um preço válido.")
  .transform((valor) => Number(valor.replace(",", ".")))
  .pipe(z.number().finite().gt(0, "O preço deve ser maior que zero."));

const numeroInteiro = (label: string, minimo: number, maximo?: number) =>
  z
    .string()
    .trim()
    .min(1, `Informe ${label}.`)
    .regex(/^\d+$/, `Informe ${label} como número inteiro.`)
    .transform(Number)
    .pipe(
      maximo === undefined
        ? z
            .number()
            .int(`Informe ${label} como número inteiro.`)
            .min(minimo, `${label} deve ser no mínimo ${minimo}.`)
        : z
            .number()
            .int(`Informe ${label} como número inteiro.`)
            .min(minimo, `${label} deve ser no mínimo ${minimo}.`)
            .max(maximo, `${label} não pode ser maior que ${maximo}.`),
    );

export const LivroSchema = z.object({
  titulo: z
    .string()
    .trim()
    .min(1, "O título é obrigatório.")
    .max(255, "O título deve ter até 255 caracteres."),
  autor: z
    .string()
    .trim()
    .min(1, "O autor é obrigatório.")
    .max(255, "O autor deve ter até 255 caracteres."),
  editora: z
    .string()
    .trim()
    .max(255, "A editora deve ter até 255 caracteres.")
    .transform((valor) => (valor === "" ? null : valor)),
  preco: numeroPositivo,
  estoque: numeroInteiro("o estoque", 0),
  ano_publicacao: numeroInteiro(
    "o ano de publicação",
    1,
    new Date().getFullYear(),
  ),
  data_publicacao: z
    .string()
    .trim()
    .min(1, "A data de publicação é obrigatória.")
    .pipe(z.iso.date("Use uma data válida no formato AAAA-MM-DD.")),
  descricao: z
    .string()
    .transform((valor) => (valor.trim() === "" ? null : valor.trim())),
});

export type LivroFormValues = z.input<typeof LivroSchema>;
export type LivroCreateData = z.output<typeof LivroSchema>;
