import {
  useListRipCards,
  useAddRipCard,
  useDeleteRipCard,
  getListRipCardsQueryKey,
} from "@workspace/api-client-react";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
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

const RARITIES = ["common", "uncommon", "rare", "ultra-rare", "legendary"] as const;
type Rarity = typeof RARITIES[number];

const RARITY_COLOR: Record<Rarity, string> = {
  common: "#9CA3AF",
  uncommon: "#10B981",
  rare: "#3B82F6",
  "ultra-rare": "#8B5CF6",
  legendary: "#F59E0B",
};

const RARITY_LABEL: Record<Rarity, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  "ultra-rare": "Ultra Rare",
  legendary: "Legendary",
};

const EMPTY_FORM = {
  playerName: "",
  year: new Date().getFullYear().toString(),
  set: "",
  cardNumber: "",
  description: "",
  rarity: "common" as Rarity,
};

export default function RipCardsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const ripId = Number(id);
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const qc = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const { data: cards, isLoading, refetch, isRefetching } = useListRipCards(ripId, {
    query: { queryKey: getListRipCardsQueryKey(ripId) },
  });

  const addMutation = useAddRipCard({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListRipCardsQueryKey(ripId) });
        setShowModal(false);
        setForm(EMPTY_FORM);
      },
    },
  });

  const deleteMutation = useDeleteRipCard({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListRipCardsQueryKey(ripId) });
        setConfirmDeleteId(null);
      },
      onError: () => setConfirmDeleteId(null),
    },
  });

  const handleAdd = () => {
    if (!form.playerName || !form.year || !form.set || !form.cardNumber || !form.description) return;
    addMutation.mutate({ id: ripId, data: { ...form, imageUrl: null } });
  };

  const setField = (key: keyof typeof EMPTY_FORM) => (val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  return (
    <>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 8 }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.back, { color: colors.primary }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.foreground }]}>Rip Cards</Text>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            onPress={() => setShowModal(true)}
          >
            <Feather name="plus" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={cards}
            keyExtractor={(c) => String(c.id)}
            contentContainerStyle={{ padding: 16, gap: 10 }}
            refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>🃏</Text>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  No cards logged yet. Tap + to record a pull.
                </Text>
              </View>
            }
            renderItem={({ item: card }) => {
              const rc = RARITY_COLOR[card.rarity as Rarity] ?? colors.mutedForeground;
              const isConfirming = confirmDeleteId === card.id;
              const isDeleting = deleteMutation.isPending && confirmDeleteId === card.id;
              return (
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: isConfirming ? colors.destructive : colors.border }]}>
                  <View style={[styles.rarityBar, { backgroundColor: rc }]} />
                  <View style={styles.cardBody}>
                    <View style={styles.cardTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.playerName, { color: colors.foreground }]}>{card.playerName}</Text>
                        <Text style={[styles.cardMeta, { color: colors.mutedForeground }]}>
                          {card.year} · {card.set} #{card.cardNumber}
                        </Text>
                        {card.description ? (
                          <Text style={[styles.cardDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
                            {card.description}
                          </Text>
                        ) : null}
                      </View>
                      <View style={[styles.rarityBadge, { backgroundColor: rc + "22" }]}>
                        <Text style={[styles.rarityText, { color: rc }]}>
                          {RARITY_LABEL[card.rarity as Rarity] ?? card.rarity}
                        </Text>
                      </View>
                    </View>
                    {isConfirming ? (
                      <View style={styles.confirmRow}>
                        <TouchableOpacity
                          style={[styles.confirmBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                          onPress={() => setConfirmDeleteId(null)}
                        >
                          <Text style={[styles.confirmBtnText, { color: colors.mutedForeground }]}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.confirmBtn, { backgroundColor: colors.destructive }]}
                          onPress={() => deleteMutation.mutate({ id: ripId, cardId: card.id })}
                          disabled={isDeleting}
                        >
                          {isDeleting ? <ActivityIndicator size="small" color="#fff" /> : (
                            <Text style={[styles.confirmBtnText, { color: "#fff" }]}>Delete</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => setConfirmDeleteId(card.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Feather name="trash-2" size={15} color={colors.destructive} />
                        <Text style={[styles.deleteBtnText, { color: colors.destructive }]}>Remove</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            }}
          />
        )}
      </View>

      <Modal visible={showModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.overlay}
        >
          <View style={[styles.sheet, { backgroundColor: colors.card }]}>
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Log Card Pull</Text>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {([
                { label: "Player Name *", key: "playerName", placeholder: "e.g. Shohei Ohtani" },
                { label: "Year *", key: "year", placeholder: "2024" },
                { label: "Set *", key: "set", placeholder: "e.g. Topps Chrome" },
                { label: "Card # *", key: "cardNumber", placeholder: "e.g. TC-150" },
                { label: "Description *", key: "description", placeholder: "e.g. Rookie Auto Refractor /99" },
              ] as const).map((f) => (
                <View key={f.key} style={{ marginBottom: 10 }}>
                  <Text style={[styles.label, { color: colors.mutedForeground }]}>{f.label}</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.secondary, color: colors.foreground, borderColor: colors.border }]}
                    value={form[f.key]}
                    onChangeText={setField(f.key)}
                    placeholder={f.placeholder}
                    placeholderTextColor={colors.mutedForeground}
                  />
                </View>
              ))}

              <Text style={[styles.label, { color: colors.mutedForeground }]}>Rarity *</Text>
              <View style={styles.rarityRow}>
                {RARITIES.map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[
                      styles.rarityChip,
                      {
                        backgroundColor: form.rarity === r ? RARITY_COLOR[r] : colors.secondary,
                        borderColor: RARITY_COLOR[r],
                      },
                    ]}
                    onPress={() => setForm((f) => ({ ...f, rarity: r }))}
                  >
                    <Text style={[styles.rarityChipText, { color: form.rarity === r ? "#fff" : RARITY_COLOR[r] }]}>
                      {RARITY_LABEL[r]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.border }]}
                onPress={() => { setShowModal(false); setForm(EMPTY_FORM); }}
              >
                <Text style={[styles.btnText, { color: colors.mutedForeground }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                onPress={handleAdd}
                disabled={addMutation.isPending}
              >
                <Text style={[styles.btnText, { color: "#fff" }]}>
                  {addMutation.isPending ? "Logging..." : "Log Pull"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 12,
  },
  back: { fontSize: 16, fontFamily: "Inter_500Medium" },
  title: { fontSize: 22, fontFamily: "Inter_700Bold" },
  addBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  card: { borderRadius: 14, borderWidth: 1, flexDirection: "row", overflow: "hidden" },
  rarityBar: { width: 4 },
  cardBody: { flex: 1, padding: 14, gap: 8 },
  cardTop: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  playerName: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  cardMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 2 },
  cardDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 16 },
  rarityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, alignSelf: "flex-start" },
  rarityText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  deleteBtn: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", paddingVertical: 2 },
  deleteBtnText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  confirmRow: { flexDirection: "row", gap: 8 },
  confirmBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1,
    alignItems: "center", justifyContent: "center", minHeight: 34,
  },
  confirmBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center" },
  overlay: { flex: 1, backgroundColor: "#00000088", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36, maxHeight: "90%" },
  sheetTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 12 },
  label: { fontSize: 12, fontFamily: "Inter_500Medium", marginBottom: 4 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15, fontFamily: "Inter_400Regular" },
  rarityRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4, marginBottom: 12 },
  rarityChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5 },
  rarityChipText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  modalBtns: { flexDirection: "row", gap: 12, marginTop: 12 },
  cancelBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, borderWidth: 1, alignItems: "center" },
  saveBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: "center" },
  btnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
