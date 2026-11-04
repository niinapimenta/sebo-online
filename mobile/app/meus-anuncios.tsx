import { Stack } from "expo-router";
import AuthGate from "@/features/auth/components/AuthGate";
import MeusAnunciosScreen from "@/features/livros/screens/MeusAnunciosScreen";

export default function MeusAnunciosRoute() {
  return (
    <>
      <Stack.Screen options={{ title: "Meus anúncios" }} />
      <AuthGate returnTo="/meus-anuncios">
        <MeusAnunciosScreen />
      </AuthGate>
    </>
  );
}
