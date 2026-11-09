import { router, usePathname, type Href } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useCarrinho } from "@/features/carrinho/context/CarrinhoProvider";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { theme } from "@/theme";

export default function BrandHeader() {
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const [hydrated, setHydrated] = useState(Platform.OS !== "web");
  const { carrinho } = useCarrinho();
  const usuario = useCurrentUser();
  const compacto = !hydrated || width < 680;
  const ehCadastro = pathname.includes("cadastro");
  const ehLogin = pathname.includes("login");
  const rotaAuth = ehCadastro || ehLogin;
  const quantidadeCarrinho = carrinho.itens.reduce((soma, item) => soma + item.quantidade, 0);

  useEffect(() => {
    if (Platform.OS === "web") setHydrated(true);
  }, []);

  function voltar() {
    if (router.canGoBack()) router.back();
    else router.replace("/" as Href);
  }

  return (
    <View style={styles.outer}>
      <View style={styles.inner}>
        {pathname !== "/" ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={voltar} style={styles.back}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>
        ) : null}

        <Pressable accessibilityRole="link" accessibilityLabel="Traça, ir ao catálogo" onPress={() => router.replace("/" as Href)} style={styles.brand}>
          <Image source={require("../../assets/brand/traca-logo.png")} style={styles.logo} resizeMode="contain" />
          {!compacto ? (
            <View style={styles.tagline}>
              <Text style={styles.taglineTop}>SEBO ONLINE</Text>
              <Text style={styles.taglineBottom}>NOVAS HISTÓRIAS</Text>
            </View>
          ) : null}
        </Pressable>

        {rotaAuth ? (
          <Pressable
            accessibilityRole="link"
            onPress={() => router.replace((ehCadastro ? "/(auth)/login" : "/(auth)/cadastro") as Href)}
            style={styles.authLink}
          >
            <Text style={styles.authPrompt}>{ehCadastro ? "Já faz parte? " : "Primeira vez? "}</Text>
            <Text style={styles.authAction}>{ehCadastro ? "Entrar" : "Criar conta"}</Text>
            {!compacto ? <Text style={styles.arrow}> ↗</Text> : null}
          </Pressable>
        ) : compacto ? (
          <View style={styles.mobileActions}>
            <Pressable accessibilityRole="link" accessibilityLabel={`Carrinho, ${quantidadeCarrinho} itens`} onPress={() => router.push("/carrinho" as Href)} style={styles.iconButton}>
              <CartGlyph />
              {quantidadeCarrinho > 0 ? <View style={styles.badge}><Text style={styles.badgeText}>{quantidadeCarrinho > 9 ? "9+" : quantidadeCarrinho}</Text></View> : null}
            </Pressable>
            <Pressable accessibilityRole="link" accessibilityLabel={usuario.data ? "Meu perfil" : "Entrar"} onPress={() => router.push((usuario.data ? "/perfil" : "/(auth)/login") as Href)} style={styles.iconButton}>
              <AccountGlyph />
            </Pressable>
          </View>
        ) : (
          <View style={styles.desktopNav}>
            <Pressable accessibilityRole="link" onPress={() => router.replace("/" as Href)} style={styles.navLink}>
              <SearchGlyph /><Text style={styles.navText}>Explorar livros</Text>
            </Pressable>
            <Pressable accessibilityRole="link" onPress={() => router.push("/livros/novo" as Href)} style={styles.sellButton}>
              <Text style={styles.sellPlus}>＋</Text><Text style={styles.sellText}>Vender livro</Text>
            </Pressable>
            <Pressable accessibilityRole="link" accessibilityLabel="Abrir carrinho" onPress={() => router.push("/carrinho" as Href)} style={styles.desktopIconButton}>
              <CartGlyph />
              {quantidadeCarrinho > 0 ? <View style={styles.badge}><Text style={styles.badgeText}>{quantidadeCarrinho > 9 ? "9+" : quantidadeCarrinho}</Text></View> : null}
            </Pressable>
            <Pressable accessibilityRole="link" onPress={() => router.push((usuario.data ? "/perfil" : "/(auth)/login") as Href)} style={styles.navLink}>
              <AccountGlyph /><Text style={styles.navText}>{usuario.data?.name ?? "Entrar"}</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

function CartGlyph() {
  return (
    <View style={styles.cartGlyph} accessible={false}>
      <View style={styles.cartHandle} />
      <View style={styles.cartBasket} />
      <View style={styles.cartWheelLeft} />
      <View style={styles.cartWheelRight} />
    </View>
  );
}

function AccountGlyph() {
  return (
    <View style={styles.accountGlyph} accessible={false}>
      <View style={styles.accountHead} />
      <View style={styles.accountBody} />
    </View>
  );
}

function SearchGlyph() {
  return (
    <View style={styles.searchGlyph} accessible={false}>
      <View style={styles.searchLens} />
      <View style={styles.searchHandle} />
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: "100%",
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  inner: {
    width: "100%",
    maxWidth: 1120,
    minHeight: 70,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 14,
  },
  back: { width: 30, height: 40, alignItems: "center", justifyContent: "center" },
  backText: { color: theme.colors.accent, fontFamily: theme.fonts.serif, fontSize: 34, lineHeight: 38 },
  brand: { flexDirection: "row", alignItems: "center", gap: 8, marginRight: "auto" },
  logo: { width: 56, height: 56 },
  tagline: { borderLeftWidth: 1, borderLeftColor: theme.colors.borderStrong, paddingLeft: 11, gap: 3 },
  taglineTop: { color: theme.colors.body, fontSize: 8, letterSpacing: 1.6, fontWeight: "600" },
  taglineBottom: { color: theme.colors.accent, fontSize: 7, letterSpacing: 1.2 },
  desktopNav: { flexDirection: "row", alignItems: "center", gap: 13 },
  navLink: { minHeight: 42, flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 7 },
  searchGlyph: { width: 17, height: 17, position: "relative" },
  searchLens: { width: 12, height: 12, borderRadius: 7, borderWidth: 1.5, borderColor: theme.colors.ink },
  searchHandle: { position: "absolute", left: 11, top: 11, width: 6, height: 1.5, backgroundColor: theme.colors.ink, transform: [{ rotate: "45deg" }] },
  navText: { color: theme.colors.ink, fontSize: 12, letterSpacing: 0.1 },
  sellButton: { minHeight: 40, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, borderWidth: 1, borderColor: theme.colors.accent, borderRadius: theme.radius.small },
  sellPlus: { color: theme.colors.accent, fontSize: 18, lineHeight: 20 },
  sellText: { color: theme.colors.ink, fontSize: 12 },
  desktopIconButton: { width: 38, height: 40, alignItems: "center", justifyContent: "center", position: "relative" },
  iconButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center", position: "relative", borderRadius: theme.radius.medium },
  mobileActions: { flexDirection: "row", alignItems: "center", gap: 3 },
  cartGlyph: { width: 23, height: 23, position: "relative" },
  cartHandle: { position: "absolute", left: 2, top: 3, width: 5, height: 7, borderLeftWidth: 1.5, borderTopWidth: 1.5, borderColor: theme.colors.ink },
  cartBasket: { position: "absolute", left: 7, top: 7, width: 14, height: 10, borderWidth: 1.5, borderTopWidth: 1, borderColor: theme.colors.ink, transform: [{ skewX: "-8deg" }] },
  cartWheelLeft: { position: "absolute", left: 9, bottom: 1, width: 3, height: 3, borderRadius: 2, backgroundColor: theme.colors.ink },
  cartWheelRight: { position: "absolute", right: 3, bottom: 1, width: 3, height: 3, borderRadius: 2, backgroundColor: theme.colors.ink },
  accountGlyph: { width: 20, height: 22, alignItems: "center", justifyContent: "center", gap: 2 },
  accountHead: { width: 7, height: 7, borderRadius: 4, borderWidth: 1.5, borderColor: theme.colors.ink },
  accountBody: { width: 14, height: 8, borderWidth: 1.5, borderBottomWidth: 0, borderTopLeftRadius: 8, borderTopRightRadius: 8, borderColor: theme.colors.ink },
  badge: { position: "absolute", top: 0, right: 0, minWidth: 17, height: 17, paddingHorizontal: 3, borderRadius: theme.radius.pill, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.accent },
  badgeText: { color: theme.colors.white, fontSize: 9, fontWeight: "700" },
  authLink: { flexDirection: "row", alignItems: "center", paddingVertical: 9 },
  authPrompt: { color: theme.colors.body, fontSize: 11 },
  authAction: { color: theme.colors.ink, fontSize: 12, fontWeight: "600" },
  arrow: { color: theme.colors.accent, fontSize: 14 },
});
