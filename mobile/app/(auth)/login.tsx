import { Stack } from "expo-router";
import LoginScreen from "@/features/auth/screens/LoginScreen";

export default function LoginRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <LoginScreen />
    </>
  );
}
