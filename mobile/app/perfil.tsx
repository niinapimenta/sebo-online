import { Stack } from "expo-router";
import AuthGate from "@/features/auth/components/AuthGate";
import ProfileScreen from "@/features/auth/screens/ProfileScreen";

export default function PerfilRoute() {
  return (
    <>
      <Stack.Screen options={{ title: "Meu perfil" }} />
      <AuthGate>
        <ProfileScreen />
      </AuthGate>
    </>
  );
}
