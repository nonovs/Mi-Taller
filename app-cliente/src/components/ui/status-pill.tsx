import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, StatusColors, withAlpha } from '@/constants/theme';
import { VEHICLE_STATUS_LABEL, type VehicleStatus } from '@/lib/types';

/** Etiqueta de color con el estado del coche. */
export function StatusPill({ status, label }: { status: VehicleStatus; label?: string }) {
  const color = StatusColors[status];
  return (
    <View style={[styles.pill, { backgroundColor: withAlpha(color, 0.14) }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <ThemedText type="caption" style={{ color }}>
        {label ?? VEHICLE_STATUS_LABEL[status]}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
});
