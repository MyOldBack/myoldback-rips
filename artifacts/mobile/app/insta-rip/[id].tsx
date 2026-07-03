import {
  useGetInstaRip,
  useOpenInstaRip,
  type InstaRip,
  type InstaRipCard,
  type InstaRipOpenResult,
} from "@workspace/api-client-react";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useUser } from "@/contexts/UserContext";

const RARITY_COLORS: Record<string, string> = {
  common: "#9CA3AF",
  rare: "#3B82F6",
  chase: "#F59E0B",
};

const RARITY_LABEL: Record<string, string> = {
  common: "Common",
  rare: "Rare",
  chase: "Chase",
};

const CARD_W = 72;
const CARD_GAP = 10;
const ITEM_W = CARD_W + CARD_GAP;
const STRIP_LEN = 30;
const WINNER_POS = 24;

type InstaRarity = "common" | "rare" | "chase";

function buildStrip(rip: InstaRip, hitRarity: InstaRarity): InstaRarity[] {
  const strip: InstaRarity[] = [];
  for (let i = 0; i < STRIP_LEN; i++) {
    if (i === WINNER_POS) {
      strip.push(hitRarity);
      continue;
    }
    const roll = Math.random() * 100;
    if (roll < rip.chaseOdds) strip.push("chase");
    else if (roll < rip.chaseOdds + rip.rareOdds) strip.push("rare");
    else strip.push("common");
  }
  return strip;
}

function CardBack({ rarity, winner }: { rarity: InstaRarity; winner: boolean }) {
  const color = RARITY_COLORS[rarity];
  return (
    <View
      style={[
        styles.cardBack,
        {
          borderColor: winner ? color : color + "60",
          backgroundColor: winner ? color + "30" : color + "12",
          width: CARD_W,
        },
      ]}
    >
      <Text style={[styles.cardQ, { color: winner ? color : color + "99" }]}>?</Text>
      <View style={[styles.rarityDot, { backgroundColor: color }]} />
    </View>
  );
}

function RevealOverlay({
  card,
  hitRarity,
  ripName,
  onClaim,
}: {
  card: InstaRipCard;
  hitRarity: InstaRarity;
  ripName: string;
  onClaim: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(600)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const [imgError, setImgError] = useState(false);
  const color = RARITY_COLORS[hitRarity];

  useEffect(() => {
    Haptics.notificationAsync(
      hitRarity === "chase"
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Warning,
    );
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 60, friction: 10 }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 10 }),
      Animated.timing(glowAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.25] });
  const showImage = !!card.imageUrl && !imgError;

  return (
    <Animated.View
      style={[
        styles.revealOverlay,
        { transform: [{ translateY: slideAnim }, { scale: scaleAnim }] },
      ]}
    >
      <View style={[styles.revealCard, { borderColor: color }]}>
        {/* Glow */}
        <Animated.View
          style={[styles.revealGlow, { backgroundColor: color, opacity: glowOpacity }]}
        />

        {/* Rarity badge */}
        <View style={[styles.rarityBadge, { backgroundColor: color + "22", borderColor: color }]}>
          <Text style={[styles.rarityBadgeText, { color }]}>
            ★ {RARITY_LABEL[hitRarity]}
          </Text>
        </View>

        {/* Card image or placeholder */}
        {showImage ? (
          <Image
            source={{ uri: card.imageUrl! }}
            style={styles.cardImage}
            resizeMode="contain"
            onError={() => setImgError(true)}
          />
        ) : (
          <View style={[styles.cardImagePlaceholder, { borderColor: color + "44" }]}>
            <Text style={[styles.cardImageInitial, { color }]}>
              {card.playerName.split(" ").map((w) => w[0]).join("").slice(0, 2)}
            </Text>
          </View>
        )}

        {/* Card info */}
        <Text style={styles.revealPlayer}>{card.playerName}</Text>
        <Text style={styles.revealMeta}>
          {card.year} • {card.cardSet}
        </Text>
        {card.cardNumber ? (
          <Text style={styles.revealCardNum}>#{card.cardNumber}</Text>
        ) : null}

        {/* Market price */}
        <View style={[styles.priceChip, { borderColor: color + "44" }]}>
          <Text style={[styles.priceLabel, { color: "#9CA3AF" }]}>MARKET VALUE</Text>
          <Text style={[styles.priceValue, { color }]}>${card.marketPrice.toFixed(2)}</Text>
        </View>

        {/* Claim button */}
        <TouchableOpacity
          style={[styles.claimBtn, { backgroundColor: color }]}
          onPress={onClaim}
          activeOpacity={0.85}
        >
          <Text style={styles.claimBtnText}>
            {hitRarity === "chase" ? "🔥 Claim Chase Hit!" : "Claim Card"}
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

function SpinWheel({
  rip,
  result,
  onClose,
}: {
  rip: InstaRip;
  result: InstaRipOpenResult;
  onClose: () => void;
}) {
  const { width: screenW } = useWindowDimensions();
  const spinAnim = useRef(new Animated.Value(0)).current;
  const [showReveal, setShowReveal] = useState(false);

  const hitRarity = result.hitRarity as InstaRarity;
  const strip = useMemo(() => buildStrip(rip, hitRarity), [rip, hitRarity]);

  const endX = -(WINNER_POS * ITEM_W - screenW / 2 + CARD_W / 2);
  const translateX = spinAnim.interpolate({ inputRange: [0, 1], outputRange: [0, endX] });

  useEffect(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.timing(spinAnim, {
        toValue: 0.82,
        duration: 1800,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setTimeout(() => setShowReveal(true), 350);
    });
  }, []);

  return (
    <View style={StyleSheet.absoluteFill}>
      <LinearGradient colors={["#080812", "#0d0d20"]} style={StyleSheet.absoluteFill} />

      {/* Title */}
      <View style={styles.wheelHeader}>
        <Text style={styles.wheelTitle}>Opening {rip.name}...</Text>
        <Text style={styles.wheelSubtitle}>Good luck!</Text>
      </View>

      {/* Spinning strip */}
      <View style={styles.stripViewport}>
        {/* Edge fades */}
        <LinearGradient
          colors={["#080812", "transparent"]}
          style={[styles.fadeEdge, styles.fadeLeft]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          pointerEvents="none"
        />
        <LinearGradient
          colors={["transparent", "#080812"]}
          style={[styles.fadeEdge, styles.fadeRight]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          pointerEvents="none"
        />
        {/* Center highlight */}
        <View style={styles.centerHighlight} pointerEvents="none" />

        {/* Cards */}
        <Animated.View style={[styles.strip, { transform: [{ translateX }] }]}>
          {strip.map((rarity, i) => (
            <CardBack key={i} rarity={rarity} winner={i === WINNER_POS} />
          ))}
        </Animated.View>
      </View>

      {/* Bottom label */}
      {!showReveal && (
        <Text style={styles.spinHint}>Hold tight…</Text>
      )}

      {/* Reveal overlay */}
      {showReveal && (
        <RevealOverlay
          card={result.hitCard}
          hitRarity={hitRarity}
          ripName={rip.name}
          onClaim={onClose}
        />
      )}
    </View>
  );
}

function OddsBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <View style={styles.oddsRow}>
      <Text style={[styles.oddsLabel, { color }]}>{label}</Text>
      <View style={styles.oddsTrack}>
        <View style={[styles.oddsBar, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={[styles.oddsPct, { color }]}>{pct}%</Text>
    </View>
  );
}

export default function InstaRipDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userName } = useUser();

  const { data: rip, isLoading } = useGetInstaRip(Number(id));
  const { mutateAsync: openRip, isPending } = useOpenInstaRip();

  const [result, setResult] = useState<InstaRipOpenResult | null>(null);
  const [wheelVisible, setWheelVisible] = useState(false);

  async function handleOpen() {
    if (!rip) return;
    try {
      const res = await openRip({ id: Number(id), data: { userName: userName ?? "Guest" } });
      setResult(res);
      setWheelVisible(true);
    } catch {
      // handle error
    }
  }

  function handleClose() {
    setWheelVisible(false);
    setResult(null);
  }

  if (isLoading || !rip) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.mutedForeground }}>Loading…</Text>
      </View>
    );
  }

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["#0f0618", colors.background]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.4 }}
      />

      {/* Back button */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={[styles.backBtn, { top: topPad + 8 }]}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={{ paddingTop: topPad + 56, paddingHorizontal: 20, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Pack header */}
        <View style={styles.packHeader}>
          <View style={[styles.packIconBg, { borderColor: "#7C3AED55" }]}>
            <Text style={styles.packIcon}>🔴</Text>
          </View>
          <Text style={[styles.packName, { color: colors.foreground }]}>{rip.name}</Text>
          <Text style={[styles.packDesc, { color: colors.mutedForeground }]}>{rip.description}</Text>
          <View style={styles.costBadge}>
            <Text style={styles.costText}>${rip.cost.toFixed(2)} per open</Text>
          </View>
        </View>

        {/* Odds */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Drop Odds</Text>
          <OddsBar label="Common" pct={rip.commonOdds} color={RARITY_COLORS.common} />
          <OddsBar label="Rare" pct={rip.rareOdds} color={RARITY_COLORS.rare} />
          <OddsBar label="Chase" pct={rip.chaseOdds} color={RARITY_COLORS.chase} />
        </View>

        {/* Card pool */}
        {rip.cards.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Card Pool ({rip.cards.length})
            </Text>
            {rip.cards.map((card) => {
              const color = RARITY_COLORS[card.rarity as InstaRarity];
              return (
                <View key={card.id} style={[styles.poolCard, { borderColor: colors.border }]}>
                  <View style={[styles.poolRarityBar, { backgroundColor: color }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.poolPlayer, { color: colors.foreground }]}>
                      {card.playerName}
                    </Text>
                    <Text style={[styles.poolMeta, { color: colors.mutedForeground }]}>
                      {card.year} {card.cardSet} #{card.cardNumber}
                    </Text>
                  </View>
                  <View>
                    <View style={[styles.poolRarityChip, { backgroundColor: color + "22", borderColor: color }]}>
                      <Text style={[styles.poolRarityText, { color }]}>
                        {RARITY_LABEL[card.rarity as InstaRarity]}
                      </Text>
                    </View>
                    <Text style={[styles.poolPrice, { color: color }]}>
                      ${card.marketPrice.toFixed(2)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Times opened */}
        <Text style={[styles.openedCount, { color: colors.mutedForeground }]}>
          Opened {rip.totalOpened} time{rip.totalOpened !== 1 ? "s" : ""}
        </Text>
      </ScrollView>

      {/* Open button */}
      <View style={[styles.openBtnContainer, { paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity
          style={[
            styles.openBtn,
            isPending && { opacity: 0.6 },
            !rip.isActive && { backgroundColor: "#333" },
          ]}
          onPress={handleOpen}
          disabled={isPending || !rip.isActive}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={rip.isActive ? ["#7C3AED", "#5B21B6"] : ["#333", "#222"]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <Text style={styles.openBtnText}>
            {isPending
              ? "Spinning…"
              : !rip.isActive
              ? "Inactive"
              : `Open Pack — $${rip.cost.toFixed(2)}`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Spinning wheel modal */}
      <Modal visible={wheelVisible} animationType="fade" statusBarTranslucent>
        {rip && result && (
          <SpinWheel rip={rip} result={result} onClose={handleClose} />
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  backBtn: { position: "absolute", left: 20, zIndex: 10 },
  backText: { color: "#9CA3AF", fontSize: 15, fontFamily: "Inter_500Medium" },
  packHeader: { alignItems: "center", marginBottom: 28 },
  packIconBg: {
    width: 80,
    height: 80,
    borderRadius: 24,
    borderWidth: 2,
    backgroundColor: "#7C3AED22",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  packIcon: { fontSize: 40 },
  packName: { fontSize: 26, fontFamily: "Inter_700Bold", textAlign: "center", marginBottom: 8 },
  packDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  costBadge: {
    marginTop: 12,
    backgroundColor: "#F59E0B22",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#F59E0B55",
  },
  costText: { color: "#F59E0B", fontFamily: "Inter_700Bold", fontSize: 16 },
  section: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 14 },
  oddsRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  oddsLabel: { fontSize: 12, fontFamily: "Inter_500Medium", width: 58 },
  oddsTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  oddsBar: { height: 8, borderRadius: 4 },
  oddsPct: { fontSize: 12, fontFamily: "Inter_600SemiBold", width: 34, textAlign: "right" },
  poolCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 10,
    overflow: "hidden",
  },
  poolRarityBar: { width: 3, height: 38, borderRadius: 2 },
  poolPlayer: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  poolMeta: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  poolRarityChip: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  poolRarityText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  poolPrice: { fontSize: 12, fontFamily: "Inter_700Bold", textAlign: "right", marginTop: 3 },
  openedCount: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center", marginTop: 4 },
  openBtnContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  openBtn: {
    height: 58,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  openBtnText: {
    color: "#fff",
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    letterSpacing: 0.3,
  },

  // Spinning wheel styles
  wheelHeader: { alignItems: "center", paddingTop: 80, paddingBottom: 40 },
  wheelTitle: { color: "#fff", fontSize: 22, fontFamily: "Inter_700Bold" },
  wheelSubtitle: { color: "#666", fontSize: 14, fontFamily: "Inter_400Regular", marginTop: 4 },
  stripViewport: {
    height: CARD_W + 32,
    overflow: "hidden",
    justifyContent: "center",
    position: "relative",
  },
  strip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    gap: CARD_GAP,
  },
  cardBack: {
    height: CARD_W + 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  cardQ: { fontSize: 26, fontFamily: "Inter_700Bold" },
  rarityDot: { width: 6, height: 6, borderRadius: 3 },
  centerHighlight: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: "50%",
    marginLeft: -(CARD_W / 2 + 4),
    width: CARD_W + 8,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.35)",
    borderRadius: 12,
    zIndex: 2,
  },
  fadeEdge: { position: "absolute", top: 0, bottom: 0, width: 80, zIndex: 3 },
  fadeLeft: { left: 0 },
  fadeRight: { right: 0 },
  spinHint: {
    color: "#555",
    textAlign: "center",
    marginTop: 24,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },

  // Reveal overlay styles
  revealOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 48,
  },
  revealCard: {
    borderRadius: 24,
    borderWidth: 2,
    backgroundColor: "#0d0d1e",
    padding: 24,
    alignItems: "center",
    gap: 10,
    overflow: "hidden",
  },
  revealGlow: {
    position: "absolute",
    top: -60,
    left: -60,
    right: -60,
    height: 120,
    borderRadius: 60,
  },
  rarityBadge: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
  },
  rarityBadgeText: { fontSize: 13, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  cardImage: { width: 140, height: 196, borderRadius: 8 },
  cardImagePlaceholder: {
    width: 140,
    height: 196,
    borderRadius: 8,
    borderWidth: 2,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardImageInitial: { fontSize: 52, fontFamily: "Inter_700Bold" },
  revealPlayer: { color: "#fff", fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center" },
  revealMeta: { color: "#9CA3AF", fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  revealCardNum: { color: "#666", fontSize: 12, fontFamily: "Inter_400Regular" },
  priceChip: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    width: "100%",
  },
  priceLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1.5 },
  priceValue: { fontSize: 28, fontFamily: "Inter_700Bold", marginTop: 2 },
  claimBtn: {
    width: "100%",
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  claimBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
});
