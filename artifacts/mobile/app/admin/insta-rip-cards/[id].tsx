import {
  useListInstaRipCards,
  useAddInstaRipCard,
  useDeleteInstaRipCard,
  useGetInstaRip,
} from "@workspace/api-client-react";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

type InstaRarity = "common" | "rare" | "chase";

const RARITY_COLORS: Record<InstaRarity, string> = {
  common: "#9CA3AF",
  rare: "#3B82F6",
  chase: "#F59E0B",
};
const RARITY_LABEL: Record<InstaRarity, string> = {
  common: "Common",
  rare: "Rare",
  chase: "Chase",
};
const RARITIES: InstaRarity[] = ["common", "rare", "chase"];

interface CardForm {
  playerName: string;
  year: string;
  cardSet: string;
  cardNumber: string;
  rarity: InstaRarity;
  marketPrice: string;
  imageUrl: string;
}

const defaultForm: CardForm = {
  playerName: "",
  year: new Date().getFullYear().toString(),
  cardSet: "",
  cardNumber: "",
  rarity: "common",
  marketPrice: "",
  imageUrl: "",
};

export default function AdminInstaRipCardsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const ripId = Number(id);
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const qc = useQueryClient();

  const { data: rip } = useGetInstaRip(ripId);
  const { data: cards, isLoading } = useListInstaRipCards(ripId);
  const { mutateAsync: addCard, isPending: adding } = useAddInstaRipCard();
  const { mutateAsync: deleteCard } = useDeleteInstaRipCard();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CardForm>(defaultForm);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [collectrUrl, setCollectrUrl] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupSuccess, setLookupSuccess] = useState(false);

  const apiBase = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

  async function handleCollectrLookup() {
    if (!collectrUrl.trim()) return;
    setLookupLoading(true);
    setLookupError(null);
    setLookupSuccess(false);
    try {
      const res = await fetch(`${apiBase}/api/collectr-lookup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: collectrUrl.trim() }),
      });
      const data = await res.json() as {
        name?: string; cardSet?: string; cardNumber?: string;
        year?: string; imageUrl?: string | null; marketPrice?: number | null;
        error?: string;
      };
      if (!res.ok || data.error) {
        setLookupError(data.error ?? "Lookup failed");
        return;
      }
      setForm((f) => ({
        ...f,
        playerName: data.name ?? f.playerName,
        cardSet: data.cardSet ?? f.cardSet,
        cardNumber: data.cardNumber ?? f.cardNumber,
        year: data.year ?? f.year,
        imageUrl: data.imageUrl ?? f.imageUrl,
        marketPrice: data.marketPrice != null ? String(data.marketPrice.toFixed(2)) : f.marketPrice,
      }));
      setLookupSuccess(true);
    } catch {
      setLookupError("Network error — check your connection");
    } finally {
      setLookupLoading(false);
    }
  }

  async function handleAdd() {
    if (!form.playerName.trim()) return;
    await addCard({
      id: ripId,
      data: {
        playerName: form.playerName.trim(),
        year: form.year.trim(),
        cardSet: form.cardSet.trim(),
        cardNumber: form.cardNumber.trim(),
        rarity: form.rarity,
        marketPrice: parseFloat(form.marketPrice) || 0,
        imageUrl: form.imageUrl.trim() || null,
      },
    });
    await qc.invalidateQueries({ queryKey: [`/api/insta-rips`] });
    setShowForm(false);
    setForm(defaultForm);
  }

  async function handleDelete(cardId: number) {
    await deleteCard({ id: ripId, cardId });
    await qc.invalidateQueries({ queryKey: [`/api/insta-rips`] });
    setConfirmDelete(null);
  }

  const grouped = {
    chase: (cards ?? []).filter((c) => c.rarity === "chase"),
    rare: (cards ?? []).filter((c) => c.rarity === "rare"),
    common: (cards ?? []).filter((c) => c.rarity === "common"),
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={[styles.back, { color: colors.mutedForeground }]}>← Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={[styles.title, { color: colors.foreground }]}>Cards</Text>
          {rip && (
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {rip.name}
            </Text>
          )}
        </View>
        <TouchableOpacity
          onPress={() => {
            setForm(defaultForm);
            setCollectrUrl("");
            setLookupError(null);
            setLookupSuccess(false);
            setShowForm(true);
          }}
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
        >
          <Feather name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Odds reminder */}
      {rip && (
        <View style={[styles.oddsBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {RARITIES.map((r) => (
            <View key={r} style={styles.oddsItem}>
              <View style={[styles.oddsColorDot, { backgroundColor: RARITY_COLORS[r] }]} />
              <Text style={[styles.oddsText, { color: RARITY_COLORS[r] }]}>
                {RARITY_LABEL[r]} {rip[r === "common" ? "commonOdds" : r === "rare" ? "rareOdds" : "chaseOdds"]}%
              </Text>
              <Text style={[styles.oddsCount, { color: colors.mutedForeground }]}>
                ({grouped[r].length} card{grouped[r].length !== 1 ? "s" : ""})
              </Text>
            </View>
          ))}
        </View>
      )}

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}
          showsVerticalScrollIndicator={false}
        >
          {(["chase", "rare", "common"] as InstaRarity[]).map((rarity) => {
            const group = grouped[rarity];
            if (group.length === 0) return null;
            const color = RARITY_COLORS[rarity];
            return (
              <View key={rarity} style={{ marginTop: 20 }}>
                <Text style={[styles.groupTitle, { color }]}>
                  {RARITY_LABEL[rarity]} ({group.length})
                </Text>
                {group.map((card) => (
                  <View
                    key={card.id}
                    style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <View style={[styles.rarityBar, { backgroundColor: color }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.playerName, { color: colors.foreground }]}>
                        {card.playerName}
                      </Text>
                      <Text style={[styles.cardMeta, { color: colors.mutedForeground }]}>
                        {card.year} {card.cardSet} · #{card.cardNumber}
                      </Text>
                      {card.imageUrl ? (
                        <Text style={[styles.imageUrl, { color: colors.mutedForeground }]} numberOfLines={1}>
                          📷 Photo attached
                        </Text>
                      ) : null}
                    </View>
                    <View style={{ alignItems: "flex-end", gap: 6 }}>
                      <Text style={[styles.marketPrice, { color }]}>
                        ${card.marketPrice.toFixed(2)}
                      </Text>
                      {confirmDelete === card.id ? (
                        <View style={{ flexDirection: "row", gap: 6 }}>
                          <TouchableOpacity
                            onPress={() => setConfirmDelete(null)}
                            style={[styles.smallBtn, { borderColor: colors.border }]}
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                          >
                            <Text style={[styles.smallBtnText, { color: colors.mutedForeground }]}>
                              Cancel
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleDelete(card.id)}
                            style={[styles.smallBtn, { borderColor: "#EF444455" }]}
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                          >
                            <Text style={[styles.smallBtnText, { color: "#EF4444" }]}>Delete</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          onPress={() => setConfirmDelete(card.id)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Feather name="trash-2" size={16} color="#EF4444" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            );
          })}

          {(cards ?? []).length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🎴</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                No cards yet. Tap + to add cards to this pack.
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Add card modal */}
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1, backgroundColor: colors.background }}
        >
          <View style={[styles.modalHeader, { paddingTop: 20 }]}>
            <TouchableOpacity onPress={() => setShowForm(false)}>
              <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_500Medium" }}>
                Cancel
              </Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Add Card</Text>
            <TouchableOpacity onPress={handleAdd} disabled={adding || !form.playerName.trim()}>
              <Text
                style={{
                  color: !form.playerName.trim() ? colors.mutedForeground : colors.primary,
                  fontFamily: "Inter_600SemiBold",
                }}
              >
                {adding ? "Adding…" : "Add"}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
            {/* Collectr auto-fill */}
            <View style={[styles.collectrBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.collectrTitle, { color: colors.foreground }]}>
                🔍 Auto-fill from Collectr
              </Text>
              <Text style={[styles.collectrHint, { color: colors.mutedForeground }]}>
                Paste a Collectr card URL to auto-fill name, set, price & image
              </Text>
              <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
                <TextInput
                  style={[
                    styles.input,
                    { flex: 1, color: colors.foreground, borderColor: lookupError ? "#EF4444" : lookupSuccess ? "#10B981" : colors.border, backgroundColor: colors.background },
                  ]}
                  value={collectrUrl}
                  onChangeText={(v) => { setCollectrUrl(v); setLookupError(null); setLookupSuccess(false); }}
                  placeholder="https://app.getcollectr.com/cards/pokemon/..."
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
                <TouchableOpacity
                  onPress={handleCollectrLookup}
                  disabled={lookupLoading || !collectrUrl.trim()}
                  style={[styles.lookupBtn, { backgroundColor: lookupLoading || !collectrUrl.trim() ? colors.border : colors.primary }]}
                >
                  {lookupLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Feather name="zap" size={16} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>
              {lookupError ? (
                <Text style={styles.lookupError}>{lookupError}</Text>
              ) : lookupSuccess ? (
                <Text style={styles.lookupOk}>✓ Fields filled from Collectr — review & adjust below</Text>
              ) : null}
            </View>

            {/* Player Name */}
            <View>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Pokémon / Card Name *</Text>
              <TextInput
                style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
                value={form.playerName}
                onChangeText={(v) => setForm((f) => ({ ...f, playerName: v }))}
                placeholder="e.g. Charizard Holo"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>

            {/* Year + Set */}
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Year</Text>
                <TextInput
                  style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
                  value={form.year}
                  onChangeText={(v) => setForm((f) => ({ ...f, year: v }))}
                  placeholder="1999"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 2 }}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Set Name</Text>
                <TextInput
                  style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
                  value={form.cardSet}
                  onChangeText={(v) => setForm((f) => ({ ...f, cardSet: v }))}
                  placeholder="Base Set"
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>
            </View>

            {/* Card # + Market Price */}
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Card #</Text>
                <TextInput
                  style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
                  value={form.cardNumber}
                  onChangeText={(v) => setForm((f) => ({ ...f, cardNumber: v }))}
                  placeholder="4/102"
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Market Price ($)</Text>
                <TextInput
                  style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
                  value={form.marketPrice}
                  onChangeText={(v) => setForm((f) => ({ ...f, marketPrice: v }))}
                  placeholder="49.99"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            {/* Rarity picker */}
            <View>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Rarity</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {RARITIES.map((r) => (
                  <TouchableOpacity
                    key={r}
                    onPress={() => setForm((f) => ({ ...f, rarity: r }))}
                    style={[
                      styles.rarityChip,
                      {
                        backgroundColor:
                          form.rarity === r ? RARITY_COLORS[r] + "33" : colors.card,
                        borderColor:
                          form.rarity === r ? RARITY_COLORS[r] : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.rarityChipText,
                        { color: form.rarity === r ? RARITY_COLORS[r] : colors.mutedForeground },
                      ]}
                    >
                      {RARITY_LABEL[r]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Card Photo URL */}
            <View>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                Card Photo URL{" "}
                <Text style={{ fontFamily: "Inter_400Regular" }}>(optional)</Text>
              </Text>
              <TextInput
                style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
                value={form.imageUrl}
                onChangeText={(v) => setForm((f) => ({ ...f, imageUrl: v }))}
                placeholder="https://..."
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
              <Text style={[styles.fieldHint, { color: colors.mutedForeground }]}>
                Shown to user if they hit this card
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  back: { fontSize: 15, fontFamily: "Inter_500Medium" },
  title: { fontSize: 18, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 12, fontFamily: "Inter_400Regular" },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  oddsBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginHorizontal: 16,
    marginBottom: 4,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  oddsItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  oddsColorDot: { width: 8, height: 8, borderRadius: 4 },
  oddsText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  oddsCount: { fontSize: 11, fontFamily: "Inter_400Regular" },
  groupTitle: { fontSize: 13, fontFamily: "Inter_700Bold", letterSpacing: 0.5, marginBottom: 8, textTransform: "uppercase" },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    overflow: "hidden",
    gap: 10,
    paddingRight: 12,
    paddingVertical: 10,
  },
  rarityBar: { width: 4, alignSelf: "stretch" },
  playerName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  cardMeta: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  imageUrl: { fontSize: 10, fontFamily: "Inter_400Regular", marginTop: 3 },
  marketPrice: { fontSize: 16, fontFamily: "Inter_700Bold" },
  smallBtn: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  smallBtnText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  fieldLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", marginBottom: 6, letterSpacing: 0.5 },
  fieldHint: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 4 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  rarityChip: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  rarityChipText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  collectrBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 2,
  },
  collectrTitle: { fontSize: 14, fontFamily: "Inter_700Bold", marginBottom: 2 },
  collectrHint: { fontSize: 12, fontFamily: "Inter_400Regular" },
  lookupBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  lookupError: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#EF4444", marginTop: 6 },
  lookupOk: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#10B981", marginTop: 6 },
});
