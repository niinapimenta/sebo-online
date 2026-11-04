import { Stack, useLocalSearchParams } from "expo-router";
import LivroDetailsScreen from "@/features/livros/screens/LivroDetailsScreen";

export default function LivroDetailsRoute() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id ?? "";

  return (
    <>
      <Stack.Screen options={{ title: "Detalhes do livro" }} />
      <LivroDetailsScreen id={id} />
    </>
  );
}
