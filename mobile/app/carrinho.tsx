import { Stack } from "expo-router";
import CarrinhoScreen from "@/features/carrinho/screens/CarrinhoScreen";

export default function CarrinhoRoute() {
  return (
    <>
      <Stack.Screen options={{ title: "Carrinho" }} />
      <CarrinhoScreen />
    </>
  );
}
