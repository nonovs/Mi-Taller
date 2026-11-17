import { Link } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CarIllustration } from '@/components/car-illustration';
import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/ui/icon';
import { ProgressRing } from '@/components/ui/progress-ring';
import { VehicleHero } from '@/components/vehicle-hero';
import { Radius } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useTheme } from '@/hooks/use-theme';
import { useVehicles, type VehicleSummary } from '@/hooks/use-workshop';
import { supabase } from '@/lib/supabase';
import { formatDate, formatTime } from '@/lib/types';

export default function VehiclesScreen() {
  const theme = useTheme();
  const { firstName } = useAuth();
  const { data: vehicles, error, isLoading, refresh } = useVehicles();

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.flex}>
          <ThemedText type="small" themeColor="textSecondary">
            {firstName ? `Hola, ${firstName} 👋` : 'Hola 👋'}
          </ThemedText>
          <ThemedText type="title">Mis coches</ThemedText>
        </View>
        <Pressable
          onPress={() => supabase.auth.signOut()}
          hitSlop={10}
          accessibilityLabel="Cerrar sesión"
          style={[styles.iconButton, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <Icon name="logout" color={theme.textSecondary} size={18} />
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.flex} color={theme.accent} />
      ) : (
        <FlatList
          data={vehicles}
          keyExtractor={(vehicle) => vehicle.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} tintColor={theme.accent} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <CarIllustration color={theme.border} width={200} />
              <ThemedText type="heading">{error ? 'No se pudo cargar' : 'Sin coches en el taller'}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
                {error ?? 'Cuando dejes tu coche en el taller aparecerá aquí y podrás seguir la reparación.'}
              </ThemedText>
            </View>
          }
          renderItem={({ item }) => <VehicleCard vehicle={item} />}
        />
      )}
    </SafeAreaView>
  );
}

function VehicleCard({ vehicle }: { vehicle: VehicleSummary }) {
  const theme = useTheme();
  const total = vehicle.tasks.length;
  const completed = vehicle.tasks.filter((task) => task.status === 'completada').length;
  const lastUpdate = vehicle.vehicle_updates[0];

  return (
    <Link href={{ pathname: '/vehiculo/[id]', params: { id: vehicle.id } }} asChild>
      <Pressable style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] })}>
        <VehicleHero vehicle={vehicle} size="compact">
          <View style={[styles.summary, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            {total > 0 && (
              <View style={styles.summaryRow}>
                <ProgressRing progress={completed / total} size={44} />
                <View style={styles.flex}>
                  <ThemedText type="smallBold">
                    {completed} de {total} trabajos hechos
                  </ThemedText>
                  <ThemedText type="caption" themeColor="textSecondary">
                    {vehicle.estimated_delivery
                      ? `Entrega prevista: ${formatDate(vehicle.estimated_delivery)}`
                      : `En el taller desde el ${formatDate(vehicle.entered_at)}`}
                  </ThemedText>
                </View>
                <Icon name="chevron-right" color={theme.textSecondary} size={20} />
              </View>
            )}
            {lastUpdate && (
              <View style={[styles.lastUpdate, total > 0 && { borderTopColor: theme.border, borderTopWidth: 1 }]}>
                <Icon name="message" color={theme.accent} size={16} />
                <ThemedText type="small" numberOfLines={2} style={styles.flex}>
                  <ThemedText type="smallBold">{lastUpdate.author_name}: </ThemedText>
                  {lastUpdate.message}
                </ThemedText>
                <ThemedText type="caption" themeColor="textSecondary">
                  {formatTime(lastUpdate.created_at)}
                </ThemedText>
              </View>
            )}
          </View>
        </VehicleHero>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  list: { padding: 16, paddingTop: 4, gap: 16, flexGrow: 1 },
  summary: {
    alignSelf: 'stretch',
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 4,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  lastUpdate: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 32 },
});
