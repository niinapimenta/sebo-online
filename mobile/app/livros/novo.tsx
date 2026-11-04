import { Stack } from "expo-router";
import AuthGate from "@/features/auth/components/AuthGate";
import LivroCreateScreen from "@/features/livros/screens/LivroCreateScreen";

export default function NovoLivroRoute() {
  return (
    <>
      <Stack.Screen options={{ title: "Cadastrar livro" }} />
      <AuthGate>
        <LivroCreateScreen />
      </AuthGate>
    </>
  );
}
