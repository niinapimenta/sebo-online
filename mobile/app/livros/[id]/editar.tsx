import { Stack, useLocalSearchParams } from "expo-router";
import AuthGate from "@/features/auth/components/AuthGate";
import LivroEditScreen from "@/features/livros/screens/LivroEditScreen";

export default function EditarLivroRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const livroId = Array.isArray(id) ? id[0] : id;

  return (
    <>
      <Stack.Screen options={{ title: "Editar livro" }} />
      <AuthGate>
        {livroId ? (
          <LivroEditScreen id={livroId} />
        ) : (
          <LivroEditScreen id="" />
        )}
      </AuthGate>
    </>
  );
}
