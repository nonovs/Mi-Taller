import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { CarIllustration } from '@/components/car-illustration';
import { LicensePlate } from '@/components/license-plate';
import { ThemedText } from '@/components/themed-text';
import { StatusPill } from '@/components/ui/status-pill';
import { Radius, withAlpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Vehicle } from '@/lib/types';

type Props = {
  vehicle: Vehicle;
  /** 'large' para la ficha del coche, 'compact' para las tarjetas de lista. */
  size?: 'large' | 'compact';
  /** Contenido extra bajo el modelo (datos, progreso…). */
  children?: ReactNode;
};

/** El coche "aparcado en el taller": degradado con su color, dibujo, matrícula y estado. */
export function VehicleHero({ vehicle, size = 'large', children }: Props) {
  const theme = useTheme();
  const large = size === 'large';

  return (
    <View style={[styles.wrapper, { borderColor: theme.border }]}>
      <LinearGradient
        colors={[withAlpha(vehicle.color, 0.28), withAlpha(vehicle.color, 0.06), theme.backgroundElement]}
        locations={[0, 0.55, 1]}
        style={[styles.gradient, large ? styles.gradientLarge : styles.gradientCompact]}>
        <View style={styles.topRow}>
          <StatusPill status={vehicle.status} />
          {vehicle.year != null && (
            <ThemedText type="caption" themeColor="textSecondary">
              {vehicle.year}
            </ThemedText>
          )}
        </View>
        <View style={styles.car}>
          <CarIllustration color={vehicle.color} width={large ? 300 : 230} />
          <View style={[styles.floor, { backgroundColor: theme.text }]} />
        </View>
        <LicensePlate plate={vehicle.plate} size={large ? 'large' : 'small'} />
        <ThemedText type={large ? 'subtitle' : 'heading'} style={styles.center}>
          {vehicle.brand} {vehicle.model}
        </ThemedText>
        {children}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  gradient: { alignItems: 'center', gap: 10 },
  gradientLarge: { padding: 20, paddingTop: 16 },
  gradientCompact: { padding: 16 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', alignSelf: 'stretch' },
  car: { alignItems: 'center' },
  floor: { height: 2, width: '85%', borderRadius: 1, opacity: 0.08, marginTop: -4 },
  center: { textAlign: 'center' },
});
