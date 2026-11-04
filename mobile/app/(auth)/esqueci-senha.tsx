import { Stack } from "expo-router";
import ForgotPasswordScreen from "@/features/auth/screens/ForgotPasswordScreen";

export default function EsqueciSenhaRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ForgotPasswordScreen />
    </>
  );
}
