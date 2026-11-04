import { Stack } from "expo-router";
import BibliotecaVendedorScreen from "@/features/vendedores/screens/BibliotecaVendedorScreen";

export default function VendedorRoute() {
  return (
    <>
      <Stack.Screen options={{ title: "Biblioteca do vendedor" }} />
      <BibliotecaVendedorScreen />
    </>
  );
}
