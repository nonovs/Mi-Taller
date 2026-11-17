import * as Haptics from 'expo-haptics';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/ui/icon';
import { Radius, StatusColors, withAlpha } from '@/constants/theme';
import { setVehicleStatus } from '@/hooks/use-workshop';
import { VEHICLE_STEPS, type VehicleStatus } from '@/lib/types';

const OPTIONS: { status: VehicleStatus; label: string }[] = [
  ...VEHICLE_STEPS,
  { status: 'entregado', label: 'Entregado' },
];

/** Botonera para cambiar el estado del coche; el cliente lo ve al instante. */
export function StatusPicker({ vehicleId, status }: { vehicleId: string; status: VehicleStatus }) {
  function change(next: VehicleStatus) {
    if (next === status) return;
    const apply = () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setVehicleStatus(vehicleId, next).catch((error: Error) =>
        Alert.alert('No se pudo cambiar el estado', error.message),
      );
    };
    if (next === 'entregado') {
      Alert.alert('¿Marcar como entregado?', 'El coche dejará de aparecer en la lista del taller.', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Entregado', onPress: apply },
      ]);
    } else {
      apply();
    }
  }

  return (
    <View style={styles.grid}>
      {OPTIONS.map((option) => {
        const selected = option.status === status;
        const color = StatusColors[option.status];
        return (
          <Pressable
            key={option.status}
            onPress={() => change(option.status)}
            style={[
              styles.option,
              {
                backgroundColor: selected ? color : withAlpha(color, 0.1),
                borderColor: selected ? color : 'transparent',
              },
            ]}>
            {selected && <Icon name="check" color="#fff" size={14} strokeWidth={3} />}
            <ThemedText type="smallBold" style={{ color: selected ? '#fff' : color }}>
              {option.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 40,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
  },
});
