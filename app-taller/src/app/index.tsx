import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CarIllustration } from "@/components/car-illustration";
import { LicensePlate } from "@/components/license-plate";
import { ThemedText } from "@/components/themed-text";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { StatusPill } from "@/components/ui/status-pill";
import { TextField } from "@/components/ui/text-field";
import { CardShadow, Radius, StatusColors, withAlpha } from "@/constants/theme";
import { useAuth } from "@/context/auth";
import { useTheme } from "@/hooks/use-theme";
import { useActiveVehicles, type VehicleRow } from "@/hooks/use-workshop";
import { supabase } from "@/lib/supabase";
import { formatTime, VEHICLE_STEPS, type VehicleStatus } from "@/lib/types";

type Filter = "todos" | VehicleStatus;

export default function DashboardScreen() {
  const theme = useTheme();
  const { staffName } = useAuth();
  const { data: vehicles, error, isLoading, refresh } = useActiveVehicles();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("todos");

  const count = (status: VehicleStatus) =>
    vehicles.filter((vehicle) => vehicle.status === status).length;
  const query = search.replace(/\s/g, "").toLowerCase();
  const visible = vehicles.filter(
    (vehicle) =>
      (filter === "todos" || vehicle.status === filter) &&
      (!query ||
        vehicle.plate.replace(/\s/g, "").toLowerCase().includes(query) ||
        vehicle.client?.full_name
          .toLowerCase()
          .replace(/\s/g, "")
          .includes(query)),
  );

  return (
    <SafeAreaView
      style={[styles.flex, { backgroundColor: theme.background }]}
      edges={["top"]}
    >
      <View style={styles.header}>
        <View style={styles.flex}>
          <ThemedText type="small" themeColor="textSecondary">
            Hola, {staffName} 🔧
          </ThemedText>
          <ThemedText type="title">Taller</ThemedText>
        </View>
        <Pressable
          onPress={() => router.push("/nuevo-coche")}
          hitSlop={6}
          accessibilityLabel="Nuevo coche"
          style={[
            styles.iconButton,
            styles.addButton,
            { backgroundColor: theme.accent, borderColor: theme.accent },
          ]}
        >
          <Icon
            name="plus"
            color={theme.onAccent}
            size={20}
            strokeWidth={2.5}
          />
        </Pressable>
        <Pressable
          onPress={() => supabase.auth.signOut()}
          hitSlop={10}
          accessibilityLabel="Cerrar sesión"
          style={[
            styles.iconButton,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: theme.border,
            },
          ]}
        >
          <Icon name="logout" color={theme.textSecondary} size={18} />
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.flex} color={theme.accent} />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(vehicle) => vehicle.id}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={refresh}
              tintColor={theme.accent}
            />
          }
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <View style={styles.stats}>
                <Stat
                  label="En el taller"
                  value={vehicles.length}
                  color={theme.text}
                />
                <Stat
                  label="En reparación"
                  value={count("en_reparacion")}
                  color={StatusColors.en_reparacion}
                />
                <Stat
                  label="Listos"
                  value={count("listo")}
                  color={StatusColors.listo}
                />
              </View>
              <TextField
                icon="search"
                placeholder="Buscar matrícula o cliente"
                autoCapitalize="none"
                value={search}
                onChangeText={setSearch}
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filters}
              >
                <FilterChip
                  label="Todos"
                  active={filter === "todos"}
                  onPress={() => setFilter("todos")}
                />
                {VEHICLE_STEPS.map((step) => (
                  <FilterChip
                    key={step.status}
                    label={`${step.label} · ${count(step.status)}`}
                    color={StatusColors[step.status]}
                    active={filter === step.status}
                    onPress={() => setFilter(step.status)}
                  />
                ))}
              </ScrollView>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <CarIllustration color={theme.border} width={180} />
              <ThemedText
                type="small"
                themeColor="textSecondary"
                style={styles.center}
              >
                {error ??
                  (vehicles.length === 0
                    ? "No hay coches en el taller. Pulsa «Nuevo coche» para dar de alta el primero."
                    : "Ningún coche coincide con la búsqueda.")}
              </ThemedText>
            </View>
          }
          renderItem={({ item }) => <VehicleRowCard vehicle={item} />}
        />
      )}

      <Pressable
        onPress={() => router.push("/nuevo-coche")}
        style={({ pressed }) => [
          styles.fab,
          CardShadow,
          {
            backgroundColor: theme.accent,
            transform: [{ scale: pressed ? 0.96 : 1 }],
          },
        ]}
        accessibilityLabel="Nuevo coche"
      >
        <Icon name="plus" color={theme.onAccent} size={22} strokeWidth={2.5} />
        <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
          Nuevo coche
        </ThemedText>
      </Pressable>
    </SafeAreaView>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <Card style={styles.stat}>
      <ThemedText style={[styles.statValue, { color }]}>{value}</ThemedText>
      <ThemedText type="caption" themeColor="textSecondary">
        {label}
      </ThemedText>
    </Card>
  );
}

function FilterChip({
  label,
  active,
  color,
  onPress,
}: {
  label: string;
  active: boolean;
  color?: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  const tint = color ?? theme.text;
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? tint : theme.backgroundElement,
          borderColor: active ? tint : theme.border,
        },
      ]}
    >
      <ThemedText
        type="caption"
        style={{
          color: active ? theme.background : (color ?? theme.textSecondary),
        }}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}

function VehicleRowCard({ vehicle }: { vehicle: VehicleRow }) {
  const theme = useTheme();
  const total = vehicle.tasks.length;
  const completed = vehicle.tasks.filter(
    (task) => task.status === "completada",
  ).length;
  const lastUpdate = vehicle.vehicle_updates[0];

  return (
    <Pressable
      onPress={() =>
        router.push({ pathname: "/vehiculo/[id]", params: { id: vehicle.id } })
      }
      style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
    >
      <Card style={styles.row}>
        <View
          style={[
            styles.thumb,
            { backgroundColor: withAlpha(vehicle.color, 0.14) },
          ]}
        >
          <CarIllustration color={vehicle.color} width={86} />
        </View>
        <View style={styles.rowBody}>
          <View style={styles.rowTop}>
            <LicensePlate plate={vehicle.plate} size="small" />
            <Icon name="chevron-right" color={theme.textSecondary} size={18} />
          </View>
          <ThemedText type="smallBold" numberOfLines={1}>
            {vehicle.brand} {vehicle.model}
            <ThemedText type="small" themeColor="textSecondary">
              {vehicle.client ? ` · ${vehicle.client.full_name}` : ""}
            </ThemedText>
          </ThemedText>
          <View style={styles.rowMeta}>
            <StatusPill status={vehicle.status} />
            {total > 0 && (
              <ThemedText type="caption" themeColor="textSecondary">
                {completed}/{total} trabajos
              </ThemedText>
            )}
          </View>
          {lastUpdate && (
            <ThemedText
              type="caption"
              themeColor="textSecondary"
              style={styles.lastUpdate}
            >
              Último aviso: {formatTime(lastUpdate.created_at)}
            </ThemedText>
          )}
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { textAlign: "center" },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  addButton: { marginRight: 8 },
  list: { paddingHorizontal: 16, paddingBottom: 110, gap: 10 },
  listHeader: { gap: 12, marginBottom: 4 },
  stats: { flexDirection: "row", gap: 10 },
  stat: { flex: 1, padding: 12, gap: 2 },
  statValue: { fontSize: 28, lineHeight: 34, fontWeight: 800 },
  filters: { gap: 8 },
  chip: {
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  row: { flexDirection: "row", gap: 12, padding: 12, alignItems: "center" },
  thumb: {
    width: 104,
    height: 76,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  rowBody: { flex: 1, gap: 6 },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  lastUpdate: { fontWeight: 500, letterSpacing: 0 },
  empty: {
    alignItems: "center",
    gap: 12,
    paddingTop: 40,
    paddingHorizontal: 24,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 34,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 54,
    paddingHorizontal: 20,
    borderRadius: 27,
  },
});
