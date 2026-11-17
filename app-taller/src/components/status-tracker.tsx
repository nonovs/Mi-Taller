import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/ui/icon';
import { StatusColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatTime, VEHICLE_STEPS, type VehicleStatus } from '@/lib/types';

const DESCRIPTIONS: Record<VehicleStatus, string> = {
  recibido: 'Tu coche está en el taller, a la espera de revisión.',
  diagnostico: 'El mecánico está revisando qué le pasa.',
  en_reparacion: 'Se están haciendo los trabajos.',
  listo: 'Ya puedes pasar a recogerlo.',
  entregado: 'Coche entregado. ¡Gracias por confiar en nosotros!',
};

type Props = { status: VehicleStatus; changedAt: string };

/** Línea de tiempo vertical: Recibido → Diagnóstico → En reparación → Listo. */
export function StatusTracker({ status, changedAt }: Props) {
  const theme = useTheme();
  const current =
    status === 'entregado'
      ? VEHICLE_STEPS.length
      : VEHICLE_STEPS.findIndex((step) => step.status === status);

  return (
    <View>
      {VEHICLE_STEPS.map((step, index) => {
        const done = index < current;
        const active = index === current;
        const color = done || active ? StatusColors[step.status] : theme.border;
        const isLast = index === VEHICLE_STEPS.length - 1;

        return (
          <View key={step.status} style={styles.row}>
            <View style={styles.rail}>
              <View
                style={[
                  styles.node,
                  {
                    borderColor: color,
                    backgroundColor: done ? color : theme.backgroundElement,
                  },
                  active && styles.nodeActive,
                ]}>
                {done && <Icon name="check" color="#fff" size={12} strokeWidth={3} />}
                {active && <View style={[styles.nodeCore, { backgroundColor: color }]} />}
              </View>
              {!isLast && (
                <View style={[styles.line, { backgroundColor: done ? color : theme.border }]} />
              )}
            </View>
            <View style={[styles.body, isLast && styles.bodyLast]}>
              <View style={styles.titleRow}>
                <ThemedText
                  type={active ? 'smallBold' : 'small'}
                  themeColor={done || active ? 'text' : 'textSecondary'}>
                  {step.label}
                </ThemedText>
                {active && (
                  <ThemedText type="caption" themeColor="textSecondary">
                    {formatTime(changedAt)}
                  </ThemedText>
                )}
              </View>
              {active && (
                <ThemedText type="small" themeColor="textSecondary">
                  {DESCRIPTIONS[step.status]}
                </ThemedText>
              )}
            </View>
          </View>
        );
      })}
      {status === 'entregado' && (
        <ThemedText type="small" themeColor="textSecondary" style={styles.delivered}>
          {DESCRIPTIONS.entregado}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12 },
  rail: { alignItems: 'center', width: 24 },
  node: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeActive: { width: 24, height: 24, borderRadius: 12 },
  nodeCore: { width: 10, height: 10, borderRadius: 5 },
  line: { width: 2.5, flex: 1, minHeight: 18, borderRadius: 2 },
  body: { flex: 1, paddingBottom: 18, gap: 2 },
  bodyLast: { paddingBottom: 0 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 22 },
  delivered: { marginTop: 10 },
});
