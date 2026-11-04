import { Stack } from "expo-router";
import AuthGate from "@/features/auth/components/AuthGate";
import HistoricoComprasScreen from "@/features/carrinho/screens/HistoricoComprasScreen";

export default function HistoricoComprasRoute() {
  return (
    <>
      <Stack.Screen options={{ title: "Histórico de compras" }} />
      <AuthGate returnTo="/historico-compras">
        <HistoricoComprasScreen />
      </AuthGate>
    </>
  );
}
