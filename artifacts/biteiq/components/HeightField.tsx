import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import {
  cmToFtIn,
  cmToIn,
  ftInToCm,
  inToCm,
  type LengthUnit,
} from "@/lib/units";

interface Props {
  label: string;
  cm: number;
  onChangeCm: (cm: number) => void;
  unit: LengthUnit;
  onUnitChange: (u: LengthUnit) => void;
}

const UNITS: { key: LengthUnit; label: string }[] = [
  { key: "cm", label: "cm" },
  { key: "in", label: "in" },
  { key: "ft_in", label: "ft+in" },
];

export function HeightField({ label, cm, onChangeCm, unit, onUnitChange }: Props) {
  const colors = useColors();
  const [singleText, setSingleText] = useState(() =>
    cm > 0 ? (unit === "cm" ? String(Math.round(cm)) : cmToIn(cm).toFixed(1)) : "",
  );
  const [ftText, setFtText] = useState(() =>
    cm > 0 ? String(cmToFtIn(cm).ft) : "",
  );
  const [inText, setInText] = useState(() =>
    cm > 0 ? String(cmToFtIn(cm).inches) : "",
  );

  useEffect(() => {
    if (cm <= 0) return;
    // Only refresh display from `cm` if the user-typed value diverges
    // (e.g. unit change, profile prefill). Avoids fighting in-flight typing.
    if (unit === "ft_in") {
      const { ft, inches } = cmToFtIn(cm);
      const typedCm = ftInToCm(parseInt(ftText, 10) || 0, parseFloat(inText) || 0);
      if (Math.abs(typedCm - cm) > 0.5) {
        setFtText(String(ft));
        setInText(String(inches));
      }
    } else {
      const expected = unit === "cm" ? String(Math.round(cm)) : cmToIn(cm).toFixed(1);
      const typedNum = parseFloat(singleText.replace(",", "."));
      const typedCm = !Number.isFinite(typedNum)
        ? 0
        : unit === "cm"
          ? typedNum
          : inToCm(typedNum);
      if (Math.abs(typedCm - cm) > 0.5) {
        setSingleText(expected);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cm, unit]);

  const onSingleChange = (text: string) => {
    setSingleText(text);
    const n = parseFloat(text.replace(",", "."));
    if (!Number.isFinite(n) || n <= 0) {
      onChangeCm(0);
      return;
    }
    onChangeCm(unit === "cm" ? n : inToCm(n));
  };

  const onFtChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, "");
    setFtText(cleaned);
    const ft = parseInt(cleaned, 10);
    const inches = parseFloat(inText);
    onChangeCm(
      ftInToCm(Number.isFinite(ft) ? ft : 0, Number.isFinite(inches) ? inches : 0),
    );
  };

  const onInChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, "");
    setInText(cleaned);
    const ft = parseInt(ftText, 10);
    const inches = parseFloat(cleaned);
    onChangeCm(
      ftInToCm(Number.isFinite(ft) ? ft : 0, Number.isFinite(inches) ? inches : 0),
    );
  };

  return (
    <View
      style={[
        styles.field,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>
          {label}
        </Text>
        <View
          style={[
            styles.unitSeg,
            { backgroundColor: colors.background, borderColor: colors.border },
          ]}
        >
          {UNITS.map((u) => {
            const active = u.key === unit;
            return (
              <Pressable
                key={u.key}
                onPress={() => onUnitChange(u.key)}
                style={[
                  styles.unitSegItem,
                  { backgroundColor: active ? colors.primary : "transparent" },
                ]}
              >
                <Text
                  style={{
                    color: active ? colors.primaryForeground : colors.foreground,
                    fontFamily: "Inter_700Bold",
                    fontSize: 11,
                  }}
                >
                  {u.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {unit === "ft_in" ? (
        <View style={styles.dualRow}>
          <View style={styles.dualCol}>
            <TextInput
              value={ftText}
              onChangeText={onFtChange}
              placeholder="5"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="number-pad"
              maxLength={1}
              style={[styles.input, { color: colors.foreground }]}
            />
            <Text style={[styles.suffix, { color: colors.mutedForeground }]}>
              ft
            </Text>
          </View>
          <View style={styles.dualCol}>
            <TextInput
              value={inText}
              onChangeText={onInChange}
              placeholder="10"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="decimal-pad"
              maxLength={4}
              style={[styles.input, { color: colors.foreground }]}
            />
            <Text style={[styles.suffix, { color: colors.mutedForeground }]}>
              in
            </Text>
          </View>
        </View>
      ) : (
        <TextInput
          value={singleText}
          onChangeText={onSingleChange}
          placeholder={unit === "cm" ? "178" : "70"}
          placeholderTextColor={colors.mutedForeground}
          keyboardType="decimal-pad"
          style={[styles.input, { color: colors.foreground, paddingTop: 6 }]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.2,
  },
  unitSeg: {
    flexDirection: "row",
    borderRadius: 10,
    borderWidth: 1,
    padding: 3,
  },
  unitSegItem: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 7,
  },
  input: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  dualRow: {
    flexDirection: "row",
    gap: 14,
    marginTop: 6,
  },
  dualCol: {
    flex: 1,
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  suffix: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
});
