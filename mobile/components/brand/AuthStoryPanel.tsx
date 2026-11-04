import { Image, StyleSheet, Text, View } from "react-native";
import { theme } from "@/theme";

export default function AuthStoryPanel({ mode }: { mode: "login" | "register" }) {
  return (
    <View style={styles.panel}>
      <Text style={styles.eyebrow}>CADA LIVRO, UM NOVO COMEÇO</Text>
      <Text style={styles.title}>Sua estante tem histórias esperando alguém.</Text>
      <Text style={styles.description}>
        Descubra sua próxima leitura e ajude bons livros a encontrar novos leitores.
      </Text>
      <View style={styles.stillLife} accessibilityElementsHidden>
        <View style={styles.bookBack} />
        <View style={styles.bookTall}><View style={styles.bookLine} /></View>
        <View style={styles.bookMedium}><View style={styles.bookLine} /></View>
        <View style={styles.bookShort}><View style={styles.bookLine} /></View>
        <View style={styles.openBook}>
          <View style={styles.pageLeft} />
          <View style={styles.pageRight} />
        </View>
        <View style={styles.glow} />
      </View>
      <View style={styles.footer}>
        <Image source={require("../../assets/brand/traca-logo.png")} style={styles.logo} resizeMode="contain" />
        <Text style={styles.footerText}>{mode === "register" ? "Abra espaço para novas histórias." : "Boas histórias sempre encontram o caminho de volta."}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    minHeight: 570,
    maxWidth: 500,
    overflow: "hidden",
    justifyContent: "flex-start",
    padding: 36,
    borderRadius: theme.radius.large,
    backgroundColor: "#f2e2d2",
  },
  eyebrow: { color: theme.colors.accent, fontSize: 9, letterSpacing: 2, fontWeight: "700" },
  title: { maxWidth: 360, marginTop: 20, color: theme.colors.ink, fontFamily: theme.fonts.serif, fontSize: 37, lineHeight: 43 },
  description: { maxWidth: 320, marginTop: 14, color: theme.colors.body, fontSize: 13, lineHeight: 20 },
  stillLife: { flex: 1, minHeight: 210, justifyContent: "flex-end", alignItems: "center", marginTop: 22, position: "relative" },
  glow: { position: "absolute", bottom: 6, width: "100%", height: 72, borderRadius: 40, backgroundColor: "#e2c6a7" },
  bookBack: { position: "absolute", bottom: 30, width: 280, height: 34, borderRadius: 4, backgroundColor: "#7c4931", transform: [{ rotate: "-2deg" }] },
  bookTall: { position: "absolute", bottom: 58, left: "24%", width: 47, height: 132, borderRadius: 5, backgroundColor: "#b86643", transform: [{ rotate: "-4deg" }] },
  bookMedium: { position: "absolute", bottom: 58, left: "40%", width: 54, height: 105, borderRadius: 4, backgroundColor: "#d09b63", transform: [{ rotate: "2deg" }] },
  bookShort: { position: "absolute", bottom: 58, left: "59%", width: 51, height: 84, borderRadius: 4, backgroundColor: "#80513b", transform: [{ rotate: "-2deg" }] },
  bookLine: { position: "absolute", left: 8, right: 8, top: 13, height: 1, backgroundColor: "rgba(255,255,255,0.55)" },
  openBook: { position: "absolute", bottom: 2, width: 240, height: 67, flexDirection: "row", alignItems: "flex-end", justifyContent: "center" },
  pageLeft: { width: 112, height: 52, borderTopLeftRadius: 7, borderBottomLeftRadius: 3, backgroundColor: "#fffaf1", transform: [{ skewY: "-8deg" }] },
  pageRight: { width: 112, height: 52, borderTopRightRadius: 7, borderBottomRightRadius: 3, backgroundColor: "#f9f1e4", transform: [{ skewY: "8deg" }] },
  footer: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 20 },
  logo: { width: 56, height: 56 },
  footerText: { maxWidth: 220, color: theme.colors.body, fontSize: 11, lineHeight: 17 },
});
