/**
 * PackRevealModal — simplified slot-machine card reveal
 *
 * Animation sequence:
 *  1. Modal fades in
 *  2. A single card cycles through random entries, getting slower (setInterval phases)
 *  3. Winner card locks in with a spring scale-bounce + haptic
 *  4. Colored particle dots burst outward
 *  5. Info panel fades in below the card
 */

import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

// ─── Constants ────────────────────────────────────────────────────────────────

const RARITY_COLOR: Record<string, string> = {
  common: "#6B7280",
  uncommon: "#10B981",
  rare: "#3B82F6",
  "ultra-rare": "#8B5CF6",
  legendary: "#F59E0B",
};

const RARITY_LABEL: Record<string, string> = {
  common: "COMMON",
  uncommon: "UNCOMMON",
  rare: "RARE",
  "ultra-rare": "✨ ULTRA RARE",
  legendary: "🔥 LEGENDARY",
};

// How many cards to show per phase, and how long to wait between each
const SPIN_PHASES = [
  { count: 10, ms: 55  },
  { count: 8,  ms: 100 },
  { count: 6,  ms: 180 },
  { count: 4,  ms: 320 },
  { count: 3,  ms: 550 },
];

const PARTICLE_COLORS = [
  "#F59E0B", "#FBBF24", "#A78BFA", "#60A5FA",
  "#34D399", "#fff",    "#F472B6", "#FB7185",
  "#818CF8", "#38BDF8", "#4ADE80", "#FCD34D",
];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RevealEntry {
  id: number;
  itemId: number;
  itemName: string;
  rarity: string;
}

export interface RevealResult {
  hitItemName: string;
  hitItemEstimatedValue: number;
  hitItemCategory: string;
  hitRarity: string;
}

interface Props {
  visible: boolean;
  entries: RevealEntry[];
  result: RevealResult | null;
  onClose: () => void;
}

// ─── Particle ────────────────────────────────────────────────────────────────

function Particle({
  angle, color, distance, size, progress,
}: {
  angle: number; color: string; distance: number;
  size: number;  progress: Animated.Value;
}) {
  const rad = (angle * Math.PI) / 180;
  const tx = progress.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(rad) * distance] });
  const ty = progress.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(rad) * distance] });
  const op = progress.interpolate({ inputRange: [0, 0.1, 0.75, 1], outputRange: [0, 1, 1, 0] });
  const sc = progress.interpolate({ inputRange: [0, 0.25, 1],    outputRange: [0, 1.5, 0.4] });
  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: size, height: size, borderRadius: size / 2,
          backgroundColor: color,
          opacity: op,
          transform: [{ translateX: tx }, { translateY: ty }, { scale: sc }],
        },
      ]}
    />
  );
}

// ─── PackRevealModal ──────────────────────────────────────────────────────────

export default function PackRevealModal({ visible, entries, result, onClose }: Props) {
  const colors = useColors();

  // Which entry is currently displayed in the spinning card slot
  const [displayed, setDisplayed] = useState<RevealEntry | null>(null);
  // Whether we've finished spinning and locked on the winner
  const [revealed, setRevealed] = useState(false);

  // Animated values (all RN Animated — no Reanimated needed)
  const modalOpacity    = useRef(new Animated.Value(0)).current;
  const cardScale       = useRef(new Animated.Value(1)).current;
  const cardFlash       = useRef(new Animated.Value(0)).current; // quick flash between cycles
  const particleProgress = useRef(new Animated.Value(0)).current;
  const infoOpacity     = useRef(new Animated.Value(0)).current;
  const infoTranslateY  = useRef(new Animated.Value(16)).current;
  const screenFlash     = useRef(new Animated.Value(0)).current;

  // Keep a ref to the current setTimeout so we can cancel on unmount
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPending = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // ── Reveal winner ────────────────────────────────────────────────────────────

  const revealWinner = useCallback(
    (winner: RevealEntry) => {
      setDisplayed(winner);
      setRevealed(true);

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});

      // Card scale: punch-in (0.8 → 1.1 → 1)
      cardScale.setValue(0.8);
      Animated.spring(cardScale, {
        toValue: 1,
        damping: 8,
        stiffness: 120,
        useNativeDriver: true,
      }).start();

      // Screen flash
      screenFlash.setValue(1);
      Animated.timing(screenFlash, {
        toValue: 0, duration: 400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();

      // Particles burst
      particleProgress.setValue(0);
      Animated.timing(particleProgress, {
        toValue: 1, duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false, // non-native because layout props
      }).start();

      // Info panel slides up
      infoOpacity.setValue(0);
      infoTranslateY.setValue(16);
      Animated.parallel([
        Animated.timing(infoOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.timing(infoTranslateY, {
          toValue: 0, duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    },
    [cardScale, screenFlash, particleProgress, infoOpacity, infoTranslateY]
  );

  // ── Run spinning phases then reveal ─────────────────────────────────────────

  useEffect(() => {
    if (!visible || !result || entries.length === 0) return;

    // Reset state
    setRevealed(false);
    setDisplayed(entries[0]);
    modalOpacity.setValue(0);
    cardScale.setValue(1);
    cardFlash.setValue(0);
    particleProgress.setValue(0);
    infoOpacity.setValue(0);
    infoTranslateY.setValue(16);
    screenFlash.setValue(0);

    const winnerEntry =
      entries.find((e) => e.rarity === result.hitRarity) ??
      entries[Math.floor(Math.random() * entries.length)];

    // Fade modal in
    Animated.timing(modalOpacity, {
      toValue: 1, duration: 280, useNativeDriver: true,
    }).start();

    // Build the full spin sequence: array of [entry, delayMs] pairs
    const schedule: Array<{ entry: RevealEntry; delay: number }> = [];
    for (const phase of SPIN_PHASES) {
      for (let i = 0; i < phase.count; i++) {
        const rnd = entries[Math.floor(Math.random() * entries.length)];
        schedule.push({ entry: rnd, delay: phase.ms });
      }
    }

    // Chain the sequence with nested timeouts
    let cumulativeDelay = 350; // initial pause before spinning

    for (let i = 0; i < schedule.length; i++) {
      const { entry, delay } = schedule[i];
      const d = cumulativeDelay;
      cumulativeDelay += delay;

      timeoutRef.current = setTimeout(() => {
        setDisplayed(entry);
        // Light haptic every few cards
        if (i % 3 === 0) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }
        // Flash between cards for the snappy slot feel
        cardFlash.setValue(0.35);
        Animated.timing(cardFlash, {
          toValue: 0, duration: delay * 0.6,
          useNativeDriver: true,
        }).start();
      }, d);
    }

    // Final: reveal winner after all schedule done
    timeoutRef.current = setTimeout(() => {
      revealWinner(winnerEntry);
    }, cumulativeDelay);

    return () => clearPending();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, result]);

  if (!result) return null;

  const rarityColor = RARITY_COLOR[displayed?.rarity ?? result.hitRarity] ?? "#8B5CF6";
  const winnerColor = RARITY_COLOR[result.hitRarity] ?? "#8B5CF6";

  const NUM_PARTICLES = 16;
  const particleAngles = Array.from({ length: NUM_PARTICLES }, (_, i) => (i * 360) / NUM_PARTICLES);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.overlay, { opacity: modalOpacity }]}>
        <View style={[styles.modal, { backgroundColor: colors.card }]}>

          {/* ── Header ── */}
          <Text style={[styles.header, { color: colors.mutedForeground }]}>🃏 YOUR PULL</Text>

          {/* ── Spinning / winner card ── */}
          <Animated.View style={[styles.cardWrap, { transform: [{ scale: cardScale }] }]}>
            {/* Rarity-colored gradient background */}
            <View style={[styles.card, { borderColor: rarityColor + "88" }]}>
              <LinearGradient
                colors={[rarityColor + "44", rarityColor + "11"] as [string, string]}
                style={StyleSheet.absoluteFill}
              />
              {/* Flash overlay between card changes */}
              <Animated.View style={[StyleSheet.absoluteFill, styles.cardFlashOverlay, { opacity: cardFlash }]} />

              <Text style={[styles.cardSuit, { color: rarityColor }]}>
                {revealed ? "★" : "?"}
              </Text>
              <Text style={styles.cardName} numberOfLines={2}>
                {displayed?.itemName ?? "..."}
              </Text>

              {revealed && (
                <View style={[styles.rarityPill, { backgroundColor: winnerColor + "33" }]}>
                  <Text style={[styles.rarityPillText, { color: winnerColor }]}>
                    {RARITY_LABEL[result.hitRarity] ?? result.hitRarity.toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          </Animated.View>

          {/* ── Particle burst (positioned on the card) ── */}
          <View style={styles.particleOrigin} pointerEvents="none">
            {particleAngles.map((angle, i) => (
              <Particle
                key={i}
                angle={angle}
                color={PARTICLE_COLORS[i % PARTICLE_COLORS.length]}
                distance={95 + (i % 4) * 20}
                size={6 + (i % 3) * 3}
                progress={particleProgress}
              />
            ))}
          </View>

          {/* ── Info panel (slides in after reveal) ── */}
          <Animated.View
            style={[
              styles.infoPanel,
              { opacity: infoOpacity, transform: [{ translateY: infoTranslateY }] },
            ]}
          >
            <Text style={[styles.infoCategory, { color: colors.mutedForeground }]}>
              {result.hitItemCategory}
            </Text>
            <Text style={[styles.infoValue, { color: colors.primary }]}>
              ~${result.hitItemEstimatedValue.toFixed(2)}
            </Text>
            <Pressable
              style={[styles.closeBtn, { backgroundColor: "#7C3AED" }]}
              onPress={onClose}
            >
              <Text style={styles.closeBtnText}>🔥 Nice Pull!</Text>
            </Pressable>
          </Animated.View>

          {/* Placeholder so the modal doesn't jump height when info appears */}
          {!revealed && <View style={styles.infoPanelPlaceholder} />}
        </View>
      </Animated.View>

      {/* ── Full-screen flash on lock ── */}
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.screenFlash, { opacity: screenFlash }]}
        pointerEvents="none"
      />
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "#00000099",
    alignItems: "center",
    justifyContent: "center",
  },
  modal: {
    width: 320,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    gap: 18,
    overflow: "hidden",
  },
  header: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 2,
  },

  // Spinning card
  cardWrap: {
    width: "100%",
    alignItems: "center",
  },
  card: {
    width: "100%",
    height: 180,
    borderRadius: 16,
    borderWidth: 2,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 20,
  },
  cardFlashOverlay: {
    backgroundColor: "#fff",
    borderRadius: 16,
  },
  cardSuit: {
    fontSize: 36,
  },
  cardName: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    textAlign: "center",
  },
  rarityPill: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
  },
  rarityPillText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },

  // Particles (positioned at card center)
  particleOrigin: {
    position: "absolute",
    top: 24 + 16 + 90, // header area + gap + half card height
    alignSelf: "center",
    width: 0,
    height: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  particle: {
    position: "absolute",
  },

  // Info panel
  infoPanel: {
    width: "100%",
    alignItems: "center",
    gap: 8,
  },
  infoPanelPlaceholder: {
    height: 112, // roughly matches the info panel height so modal stays tall
  },
  infoCategory: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  infoValue: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
  },
  closeBtn: {
    marginTop: 4,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
  },
  closeBtnText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },

  // Screen flash
  screenFlash: {
    backgroundColor: "#fff",
  },
});
