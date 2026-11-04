export function podeComprarDoVendedor(
  vendedorId: number | null,
  usuarioId: number | null,
): boolean {
  return usuarioId === null || vendedorId === null || vendedorId !== usuarioId;
}
