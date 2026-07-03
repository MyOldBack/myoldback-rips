import {
  useListInstaRips,
  useCreateInstaRip,
  useDeleteInstaRip,
  useUpdateInstaRip,
} from "@workspace/api-client-react";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

const RARITY_COLORS = { common: "#9CA3AF", rare: "#3B82F6", chase: "#F59E0B" };

function OddsStepper({
  label,
  color,
  value,
  readOnly,
  onInc,
  onDec,
}: {
  label: string;
  color: string;
  value: number;
  readOnly?: boolean;
  onInc?: () => void;
  onDec?: () => void;
}) {
  const colors = useColors();
  return (
    <View style={styles.stepperRow}>
      <View style={[styles.stepperColorDot, { backgroundColor: color }]} />
      <Text style={[styles.stepperLabel, { color: colors.foreground }]}>{label}</Text>
      <View style={[styles.stepperTrack, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.stepperBar,
            { width: `${Math.max(value, 2)}%` as any, backgroundColor: color },
          ]}
        />
      </View>
      {readOnly ? (
        <Text style={[styles.stepperPct, { color }]}>{value}%</Text>
      ) : (
        <View style={styles.stepperControls}>
          <TouchableOpacity
            onPress={onDec}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 4 }}
            style={[styles.stepBtn, { borderColor: colors.border }]}
          >
            <Text style={[styles.stepBtnText, { color: colors.foreground }]}>−</Text>
          </TouchableOpacity>
          <Text style={[styles.stepperPct, { color }]}>{value}%</Text>
          <TouchableOpacity
            onPress={onInc}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
            style={[styles.stepBtn, { borderColor: colors.border }]}
          >
            <Text style={[styles.stepBtnText, { color: colors.foreground }]}>+</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

interface FormState {
  name: string;
  description: string;
  cost: string;
  isActive: boolean;
  commonOdds: number;
  rareOdds: number;
}

const defaultForm: FormState = {
  name: "",
  description: "",
  cost: "9.99",
  isActive: true,
  commonOdds: 70,
  rareOdds: 25,
};

export default function AdminInstaRipsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const qc = useQueryClient();

  const { data: rips, isLoading } = useListInstaRips();
  const { mutateAsync: createRip, isPending: creating } = useCreateInstaRip();
  const { mutateAsync: updateRip } = useUpdateInstaRip();
  const { mutateAsync: deleteRip } = useDeleteInstaRip();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const chaseOdds = Math.max(100 - form.commonOdds - form.rareOdds, 0);
  const oddsValid = form.commonOdds + form.rareOdds <= 99;

  function adjCommon(delta: number) {
    const next = Math.min(Math.max(form.commonOdds + delta, 0), 98 - form.rareOdds);
    setForm((f) => ({ ...f, commonOdds: next }));
  }
  function adjRare(delta: number) {
    const next = Math.min(Math.max(form.rareOdds + delta, 0), 98 - form.commonOdds);
    setForm((f) => ({ ...f, rareOdds: next }));
  }

  async function handleCreate() {
    if (!form.name.trim()) return;
    if (!oddsValid) return;
    await createRip({
      data: {
        name: form.name.trim(),
        description: form.description.trim(),
        cost: parseFloat(form.cost) || 9.99,
        isActive: form.isActive,
        commonOdds: form.commonOdds,
        rareOdds: form.rareOdds,
        chaseOdds,
      },
    });
    await qc.invalidateQueries({ queryKey: [`/api/insta-rips`] });
    setShowForm(false);
    setForm(defaultForm);
  }

  async function handleToggleActive(id: number, rip: any) {
    await updateRip({ id, data: { ...rip, isActive: !rip.isActive, cards: undefined } });
    await qc.invalidateQueries({ queryKey: [`/api/insta-rips`] });
  }

  async function handleDelete(id: number) {
    await deleteRip({ id });
    await qc.invalidateQueries({ queryKey: [`/api/insta-rips`] });
    setConfirmDelete(null);
  }

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
        <Text style={[styles.title, { color: colors.foreground }]}>Insta Rips</Text>
        <TouchableOpacity
          onPress={() => { setForm(defaultForm); setShowForm(true); }}
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
        >
          <Feather name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={rips ?? []}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 80 }}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: colors.mutedForeground }]}>
              No insta rips yet. Tap + to create one.
            </Text>
          }
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {/* Status bar */}
              <View
                style={[
                  styles.statusBar,
                  { backgroundColor: item.isActive ? "#22C55E" : "#6B7280" },
                ]}
              />

              <View style={styles.cardInner}>
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.ripName, { color: colors.foreground }]}>{item.name}</Text>
                    <Text style={[styles.ripMeta, { color: colors.mutedForeground }]}>
                      ${item.cost.toFixed(2)} · {item.cards.length} card{item.cards.length !== 1 ? "s" : ""}
                    </Text>
                  </View>
                  <Switch
                    value={item.isActive}
                    onValueChange={() => handleToggleActive(item.id, item)}
                    trackColor={{ true: "#22C55E" }}
                  />
                </View>

                {/* Odds mini bars */}
                <View style={styles.miniOdds}>
                  {[
                    { label: "C", pct: item.commonOdds, color: RARITY_COLORS.common },
                    { label: "R", pct: item.rareOdds, color: RARITY_COLORS.rare },
                    { label: "CH", pct: item.chaseOdds, color: RARITY_COLORS.chase },
                  ].map(({ label, pct, color }) => (
                    <View key={label} style={styles.miniBar}>
                      <View style={[styles.miniBarFill, { width: `${pct}%` as any, backgroundColor: color }]} />
                      <Text style={[styles.miniBarLabel, { color }]}>{pct}%</Text>
                    </View>
                  ))}
                </View>

                {/* Actions */}
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: colors.primary + "55" }]}
                    onPress={() => router.push(`/admin/insta-rip-cards/${item.id}` as any)}
                  >
                    <Feather name="credit-card" size={14} color={colors.primary} />
                    <Text style={[styles.actionBtnText, { color: colors.primary }]}>Cards</Text>
                  </TouchableOpacity>

                  {confirmDelete === item.id ? (
                    <>
                      <TouchableOpacity
                        style={[styles.actionBtn, { borderColor: "#6B7280" }]}
                        onPress={() => setConfirmDelete(null)}
                      >
                        <Text style={[styles.actionBtnText, { color: "#9CA3AF" }]}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtn, { borderColor: "#EF444455" }]}
                        onPress={() => handleDelete(item.id)}
                      >
                        <Feather name="trash-2" size={14} color="#EF4444" />
                        <Text style={[styles.actionBtnText, { color: "#EF4444" }]}>Confirm</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity
                      style={[styles.actionBtn, { borderColor: "#EF444455" }]}
                      onPress={() => setConfirmDelete(item.id)}
                    >
                      <Feather name="trash-2" size={14} color="#EF4444" />
                      <Text style={[styles.actionBtnText, { color: "#EF4444" }]}>Delete</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          )}
        />
      )}

      {/* Create modal */}
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
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>New Insta Rip</Text>
            <TouchableOpacity onPress={handleCreate} disabled={creating || !oddsValid}>
              <Text
                style={{
                  color: !oddsValid ? colors.mutedForeground : colors.primary,
                  fontFamily: "Inter_600SemiBold",
                }}
              >
                {creating ? "Creating…" : "Create"}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
            <View>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Pack Name *</Text>
              <TextInput
                style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
                value={form.name}
                onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
                placeholder="e.g. Base Blaster"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>
            <View>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Description</Text>
              <TextInput
                style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card, minHeight: 72, textAlignVertical: "top" }]}
                value={form.description}
                onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
                placeholder="Short description of this pack"
                placeholderTextColor={colors.mutedForeground}
                multiline
              />
            </View>
            <View>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Cost per Open ($)</Text>
              <TextInput
                style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
                value={form.cost}
                onChangeText={(v) => setForm((f) => ({ ...f, cost: v }))}
                keyboardType="decimal-pad"
                placeholder="9.99"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>

            {/* Odds section */}
            <View style={[styles.oddsSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.oddsSectionTitle, { color: colors.foreground }]}>
                Drop Odds
              </Text>
              <Text style={[styles.oddsSectionHint, { color: colors.mutedForeground }]}>
                Adjust Common & Rare. Chase is auto-calculated.
              </Text>
              <OddsStepper
                label="Common"
                color={RARITY_COLORS.common}
                value={form.commonOdds}
                onInc={() => adjCommon(5)}
                onDec={() => adjCommon(-5)}
              />
              <OddsStepper
                label="Rare"
                color={RARITY_COLORS.rare}
                value={form.rareOdds}
                onInc={() => adjRare(5)}
                onDec={() => adjRare(-5)}
              />
              <OddsStepper
                label="Chase"
                color={RARITY_COLORS.chase}
                value={chaseOdds}
                readOnly
              />
              {!oddsValid && (
                <Text style={styles.oddsError}>
                  ⚠ Common + Rare must leave at least 1% for Chase
                </Text>
              )}
            </View>

            <View style={styles.activeRow}>
              <Text style={[styles.fieldLabel, { color: colors.foreground, marginBottom: 0 }]}>
                Active (visible to users)
              </Text>
              <Switch
                value={form.isActive}
                onValueChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
                trackColor={{ true: "#22C55E" }}
              />
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
    paddingBottom: 12,
  },
  back: { fontSize: 15, fontFamily: "Inter_500Medium" },
  title: { fontSize: 20, fontFamily: "Inter_700Bold" },
  addBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  empty: { textAlign: "center", marginTop: 48, fontFamily: "Inter_400Regular" },
  card: { borderRadius: 16, borderWidth: 1, overflow: "hidden", flexDirection: "row" },
  statusBar: { width: 4 },
  cardInner: { flex: 1, padding: 14 },
  cardTop: { flexDirection: "row", alignItems: "flex-start", marginBottom: 10 },
  ripName: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  ripMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  miniOdds: { marginBottom: 10, gap: 4 },
  miniBar: {
    height: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 4,
    overflow: "hidden",
    justifyContent: "center",
  },
  miniBarFill: { position: "absolute", top: 0, left: 0, bottom: 0, borderRadius: 4 },
  miniBarLabel: {
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
    paddingLeft: 6,
    zIndex: 1,
  },
  actions: { flexDirection: "row", gap: 8 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  actionBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
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
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  oddsSection: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  oddsSectionTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  oddsSectionHint: { fontSize: 12, fontFamily: "Inter_400Regular" },
  stepperRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  stepperColorDot: { width: 10, height: 10, borderRadius: 5 },
  stepperLabel: { fontSize: 13, fontFamily: "Inter_500Medium", width: 60 },
  stepperTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  stepperBar: { height: 8, borderRadius: 4 },
  stepperPct: { fontSize: 13, fontFamily: "Inter_700Bold", width: 36, textAlign: "center" },
  stepperControls: { flexDirection: "row", alignItems: "center", gap: 2 },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  stepBtnText: { fontSize: 18, lineHeight: 20 },
  oddsError: {
    color: "#FBBF24",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
  activeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
});
