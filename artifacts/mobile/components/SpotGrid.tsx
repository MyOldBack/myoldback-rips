import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface SpotGridProps {
  totalSpots: number;
  spots: Array<{ slotNumber: number; userName: string; isWinner: boolean }>;
  myUserName?: string | null;
}

const SEGMENT_COLORS = [
  "#FF6B00", "#FFD700", "#FF3B6B", "#00C9A7", "#7B61FF",
  "#FF9F40", "#36A2EB", "#FF6384", "#4BC0C0", "#9966FF",
];

function colorForUser(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return SEGMENT_COLORS[Math.abs(hash) % SEGMENT_COLORS.length];
}

export function SpotGrid({ totalSpots, spots, myUserName }: SpotGridProps) {
  const colors = useColors();
  const filledMap = new Map(spots.map((s) => [s.slotNumber, s]));

  return (
    <View style={styles.grid}>
      {Array.from({ length: totalSpots }, (_, i) => i + 1).map((slot) => {
        const spot = filledMap.get(slot);
        const isMine = spot && spot.userName === myUserName;
        const isWinner = spot?.isWinner;

        return (
          <View
            key={slot}
            style={[
              styles.cell,
              {
                backgroundColor: spot
                  ? isWinner
                    ? colors.accent
                    : colorForUser(spot.userName) + "33"
                  : colors.secondary,
                borderColor: isWinner
                  ? colors.accent
                  : isMine
                  ? colors.primary
                  : colors.border,
                borderWidth: isMine || isWinner ? 2 : 1,
              },
            ]}
          >
            <Text style={[styles.slotNum, { color: colors.mutedForeground }]}>
              {slot}
            </Text>
            {spot && (
              <Text
                style={[
                  styles.slotName,
                  {
                    color: isWinner ? "#0A0F1E" : isMine ? colors.primary : colors.foreground,
                  },
                ]}
                numberOfLines={1}
              >
                {spot.userName}
              </Text>
            )}
            {isWinner && <Text style={styles.trophy}>🏆</Text>}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    paddingHorizontal: 16,
  },
  cell: {
    width: 70,
    height: 64,
    borderRadius: 10,
    padding: 6,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  slotNum: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
  },
  slotName: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  trophy: {
    fontSize: 14,
  },
});
