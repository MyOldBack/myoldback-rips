import React, { useEffect, useRef } from "react";
import { Animated, Easing, Platform, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, G, Line, Path, Text as SvgText } from "react-native-svg";
import { useColors } from "@/hooks/useColors";

interface SpinWheelProps {
  slots: string[];
  winnerIndex: number | null;
  spinning: boolean;
  onSpinComplete?: () => void;
  size?: number;
}

const SEGMENT_COLORS = [
  "#FF6B00", "#FFD700", "#FF3B6B", "#00C9A7", "#7B61FF",
  "#FF9F40", "#36A2EB", "#FF6384", "#4BC0C0", "#9966FF",
];

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function segmentPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}

export function SpinWheel({ slots, winnerIndex, spinning, onSpinComplete, size = 280 }: SpinWheelProps) {
  const colors = useColors();
  const rotation = useRef(new Animated.Value(0)).current;
  const rotationRef = useRef(0);

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 10;

  useEffect(() => {
    if (spinning && winnerIndex !== null && slots.length > 0) {
      const segmentAngle = 360 / slots.length;
      const targetAngle = segmentAngle * winnerIndex + segmentAngle / 2;
      const spins = 1440 + (360 - targetAngle);

      rotation.setValue(0);
      rotationRef.current = 0;

      Animated.timing(rotation, {
        toValue: spins,
        duration: 4000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: Platform.OS !== "web",
      }).start(({ finished }) => {
        if (finished) {
          onSpinComplete?.();
        }
      });
    }
  }, [spinning, winnerIndex]);

  const rotationInterp = rotation.interpolate({
    inputRange: [0, 360],
    outputRange: ["0deg", "360deg"],
    extrapolate: "extend",
  });

  if (slots.length === 0) {
    return (
      <View style={[styles.empty, { width: size, height: size }]}>
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No spots yet</Text>
      </View>
    );
  }

  const segmentAngle = 360 / slots.length;

  return (
    <View style={styles.container}>
      {/* Pointer */}
      <View style={[styles.pointer, { borderBottomColor: colors.accent }]} />

      <Animated.View style={{ transform: [{ rotate: rotationInterp }] }}>
        <Svg width={size} height={size}>
          {slots.map((label, i) => {
            const startAngle = i * segmentAngle;
            const endAngle = startAngle + segmentAngle;
            const midAngle = startAngle + segmentAngle / 2;
            const segColor = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
            const textPoint = polarToCartesian(cx, cy, r * 0.65, midAngle);
            const shortLabel = label.length > 8 ? label.slice(0, 7) + "…" : label;

            return (
              <G key={i}>
                <Path
                  d={segmentPath(cx, cy, r, startAngle, endAngle)}
                  fill={segColor}
                  stroke="#0A0F1E"
                  strokeWidth={1.5}
                />
                <SvgText
                  x={textPoint.x}
                  y={textPoint.y}
                  textAnchor="middle"
                  fontSize={slots.length > 6 ? 10 : 13}
                  fontWeight="bold"
                  fill="#fff"
                  rotation={midAngle - 90}
                  origin={`${textPoint.x}, ${textPoint.y}`}
                >
                  {shortLabel}
                </SvgText>
              </G>
            );
          })}
          <Circle cx={cx} cy={cy} r={18} fill="#0A0F1E" stroke="#FF6B00" strokeWidth={3} />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  pointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderBottomWidth: 24,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    position: "absolute",
    top: -14,
    zIndex: 10,
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9999,
    borderWidth: 2,
    borderStyle: "dashed",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
});
