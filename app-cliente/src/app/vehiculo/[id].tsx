import { Stack, useLocalSearchParams } from 'expo-router';
import type { ReactNode } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { StatusTracker } from '@/components/status-tracker';
import { TaskItem } from '@/components/task-item';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Icon, type IconName } from '@/components/ui/icon';
import { ProgressRing } from '@/components/ui/progress-ring';
import { UpdateBubble } from '@/components/update-bubble';
import { VehicleHero } from '@/components/vehicle-hero';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useVehicleDetail } from '@/hooks/use-workshop';
import { formatDate } from '@/lib/types';

export default function VehicleScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, error, isLoading, refresh } = useVehicleDetail(id);
  const { vehicle, tasks, updates } = data;

  if (isLoading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator color={theme.accent} />
      </ThemedView>
    );
  }

  if (!vehicle) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText themeColor="textSecondary">{error ?? 'Coche no encontrado.'}</ThemedText>
      </ThemedView>
    );
  }

  const completed = tasks.filter((task) => task.status === 'completada').length;

  return (
    <ThemedView style={styles.flex}>
      <Stack.Screen options={{ title: vehicle.plate }} />
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} tintColor={theme.accent} />}>
        <VehicleHero vehicle={vehicle}>
          <View style={styles.facts}>
            {vehicle.mileage != null && (
              <Fact icon="clock" label="Kilómetros" value={vehicle.mileage.toLocaleString('es-ES')} />
            )}
            <Fact icon="calendar" label="Entrada" value={formatDate(vehicle.entered_at)} />
            {vehicle.estimated_delivery && (
              <Fact icon="check" label="Entrega prevista" value={formatDate(vehicle.estimated_delivery)} />
            )}
          </View>
        </VehicleHero>

        <Section title="Estado de la reparación">
          <StatusTracker status={vehicle.status} changedAt={vehicle.status_changed_at} />
        </Section>

        <Section
          title="Mensajes del taller"
          aside={updates.length > 0 ? `${updates.length}` : undefined}>
          {updates.length === 0 ? (
            <ThemedText type="small" themeColor="textSecondary">
              Aquí verás lo que el mecánico te vaya contando sobre tu coche.
            </ThemedText>
          ) : (
            <View style={styles.messages}>
              {updates.map((update, index) => (
                <UpdateBubble key={update.id} update={update} highlight={index === 0} />
              ))}
            </View>
          )}
        </Section>

        <Section title="Trabajos">
          {tasks.length === 0 ? (
            <ThemedText type="small" themeColor="textSecondary">
              El taller todavía no ha añadido trabajos.
            </ThemedText>
          ) : (
            <>
              <View style={styles.progress}>
                <ProgressRing progress={completed / tasks.length} size={56} />
                <View style={styles.flex}>
                  <ThemedText type="heading">
                    {completed} de {tasks.length} completados
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {completed === tasks.length ? '¡Todo terminado!' : 'Se actualiza en tiempo real'}
                  </ThemedText>
                </View>
              </View>
              {tasks.map((task, index) => (
                <TaskItem key={task.id} task={task} isLast={index === tasks.length - 1} />
              ))}
            </>
          )}
        </Section>

        {!!vehicle.notes && (
          <Section title="Motivo de la visita">
            <ThemedText type="small" themeColor="textSecondary">
              {vehicle.notes}
            </ThemedText>
          </Section>
        )}
      </ScrollView>
    </ThemedView>
  );
}

function Section({ title, aside, children }: { title: string; aside?: string; children: ReactNode }) {
  const theme = useTheme();
  return (
    <Card style={styles.section}>
      <View style={styles.sectionHeader}>
        <ThemedText type="heading">{title}</ThemedText>
        {aside && (
          <View style={[styles.badge, { backgroundColor: theme.accentSoft }]}>
            <ThemedText type="caption" style={{ color: theme.accent }}>
              {aside}
            </ThemedText>
          </View>
        )}
      </View>
      {children}
    </Card>
  );
}

function Fact({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.fact, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <Icon name={icon} color={theme.textSecondary} size={14} />
      <View>
        <ThemedText type="caption" themeColor="textSecondary">
          {label}
        </ThemedText>
        <ThemedText type="smallBold">{value}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  content: { padding: 16, gap: 16, paddingBottom: 48 },
  facts: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 4 },
  fact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  section: { gap: 14 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: Radius.pill },
  messages: { gap: 12 },
  progress: { flexDirection: 'row', alignItems: 'center', gap: 14 },
});
