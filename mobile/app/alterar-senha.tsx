import { Stack } from "expo-router";
import AuthGate from "@/features/auth/components/AuthGate";
import ChangePasswordScreen from "@/features/auth/screens/ChangePasswordScreen";

export default function AlterarSenhaRoute() {
  return (
    <>
      <Stack.Screen options={{ title: "Alterar senha" }} />
      <AuthGate>
        <ChangePasswordScreen />
      </AuthGate>
    </>
  );
}
