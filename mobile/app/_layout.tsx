import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { CarrinhoProvider } from "@/features/carrinho/context/CarrinhoProvider";
import BrandHeader from "@/components/brand/BrandHeader";
import { theme } from "@/theme";

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <CarrinhoProvider>
          <StatusBar style="dark" />
          <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.canvas }} edges={["top", "bottom"]}>
            <BrandHeader />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.canvas } }} />
          </SafeAreaView>
        </CarrinhoProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
