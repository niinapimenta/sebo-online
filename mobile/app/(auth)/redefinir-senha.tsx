import { Stack } from "expo-router";
import ResetPasswordScreen from "@/features/auth/screens/ResetPasswordScreen";

export default function RedefinirSenhaRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ResetPasswordScreen />
    </>
  );
}
