import { Stack } from "expo-router";
import RegisterScreen from "@/features/auth/screens/RegisterScreen";

export default function RegisterRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <RegisterScreen />
    </>
  );
}
