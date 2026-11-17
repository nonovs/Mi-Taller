import { Stack, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CarIllustration } from "@/components/car-illustration";
import { Composer } from "@/components/composer";
import { CredentialsCard } from "@/components/credentials-card";
import { LicensePlate } from "@/components/license-plate";
import { StatusPicker } from "@/components/status-picker";
import { TaskBoard } from "@/components/task-board";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Segmented } from "@/components/ui/segmented";
import { StatusPill } from "@/components/ui/status-pill";
import { UpdateBubble } from "@/components/update-bubble";
import { Radius, withAlpha } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { resetClientPassword, useVehicleChat } from "@/hooks/use-workshop";
import {
  type Client,
  formatDate,
  type Task,
  type Vehicle,
  type VehicleUpdate,
} from "@/lib/types";

type Tab = "chat" | "trabajos" | "ficha";

export default function VehicleScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, error, isLoading, refresh } = useVehicleChat(id);
  const { vehicle, client, tasks, updates } = data;
  const [tab, setTab] = useState<Tab>("chat");

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
        <ThemedText themeColor="textSecondary">
          {error ?? "Coche no encontrado."}
        </ThemedText>
      </ThemedView>
    );
  }

  const pending = tasks.filter((task) => task.status !== "completada").length;

  return (
    <ThemedView style={styles.flex}>
      <Stack.Screen options={{ title: `${vehicle.brand} ${vehicle.model}` }} />
      <SafeAreaView style={styles.flex} edges={["bottom"]}>
        <View style={[styles.summary, { borderColor: theme.border }]}>
          <View
            style={[
              styles.thumb,
              { backgroundColor: withAlpha(vehicle.color, 0.16) },
            ]}
          >
            <CarIllustration color={vehicle.color} width={70} />
          </View>
          <View style={styles.flex}>
            <View style={styles.summaryTop}>
              <LicensePlate plate={vehicle.plate} size="small" />
              <StatusPill status={vehicle.status} />
            </View>
            <ThemedText
              type="small"
              themeColor="textSecondary"
              numberOfLines={1}
            >
              {client?.full_name ?? "Cliente"}
            </ThemedText>
          </View>
        </View>
        <View style={styles.tabs}>
          <Segmented<Tab>
            value={tab}
            onChange={setTab}
            options={[
              { value: "chat", label: "Chat" },
              { value: "trabajos", label: "Trabajos", badge: pending },
              { value: "ficha", label: "Ficha" },
            ]}
          />
        </View>

        {tab === "chat" && <ChatTab vehicle={vehicle} updates={updates} />}
        {tab === "trabajos" && (
          <WorkTab vehicle={vehicle} tasks={tasks} onChange={refresh} />
        )}
        {tab === "ficha" && <InfoTab vehicle={vehicle} client={client} />}
      </SafeAreaView>
    </ThemedView>
  );
}

function ChatTab({
  vehicle,
  updates,
}: {
  vehicle: Vehicle;
  updates: VehicleUpdate[];
}) {
  const listRef = useRef<FlatList>(null);
  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      <FlatList
        ref={listRef}
        data={updates}
        keyExtractor={(update) => update.id}
        contentContainerStyle={styles.chat}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() =>
          listRef.current?.scrollToEnd({ animated: true })
        }
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <ThemedText type="heading">Cuéntale al cliente</ThemedText>
            <ThemedText
              type="small"
              themeColor="textSecondary"
              style={styles.center}
            >
              Escribe un mensaje o toca el micro para grabar una nota de voz. El
              cliente lo verá al momento en su app.
            </ThemedText>
          </View>
        }
        renderItem={({ item, index }) => (
          <UpdateBubble
            update={item}
            highlight={index === updates.length - 1}
          />
        )}
      />
      <Composer vehicleId={vehicle.id} />
    </KeyboardAvoidingView>
  );
}

function WorkTab({
  vehicle,
  tasks,
  onChange,
}: {
  vehicle: Vehicle;
  tasks: Task[];
  onChange: () => Promise<void>;
}) {
  const completed = tasks.filter((task) => task.status === "completada").length;
  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      <TaskBoard
        vehicleId={vehicle.id}
        tasks={tasks}
        onChange={onChange}
        header={
          <View style={styles.workHeader}>
            <ThemedText type="caption" themeColor="textSecondary">
              ESTADO DEL COCHE
            </ThemedText>
            <StatusPicker vehicleId={vehicle.id} status={vehicle.status} />
            <View style={styles.progress}>
              <ProgressRing
                progress={tasks.length ? completed / tasks.length : 0}
                size={48}
              />
              <View>
                <ThemedText type="heading">
                  {completed} de {tasks.length} trabajos
                </ThemedText>
                <ThemedText type="caption" themeColor="textSecondary">
                  El cliente ve cada cambio en directo
                </ThemedText>
              </View>
            </View>
          </View>
        }
      />
    </KeyboardAvoidingView>
  );
}

function InfoTab({
  vehicle,
  client,
}: {
  vehicle: Vehicle;
  client: Client | null;
}) {
  const theme = useTheme();
  const [credentials, setCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  function confirmReset() {
    if (!client) return;
    Alert.alert(
      "Nueva contraseña temporal",
      `${client.full_name} ya no podrá entrar con su contraseña actual hasta que use la nueva.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Generar",
          onPress: async () => {
            setIsResetting(true);
            try {
              const result = await resetClientPassword(client.user_id);
              setCredentials({
                email: result.client_email,
                password: result.temporary_password,
              });
            } catch (error) {
              Alert.alert("No se pudo generar", (error as Error).message);
            }
            setIsResetting(false);
          },
        },
      ],
    );
  }

  const phoneDigits = (client?.phone ?? "").replace(/\D/g, "");

  return (
    <ScrollView contentContainerStyle={styles.info}>
      <Card style={styles.infoCard}>
        <ThemedText type="caption" themeColor="textSecondary">
          CLIENTE
        </ThemedText>
        <ThemedText type="heading">
          {client?.full_name ?? "Sin ficha de cliente"}
        </ThemedText>
        {client && (
          <>
            <ThemedText type="small" themeColor="textSecondary" selectable>
              {client.email}
            </ThemedText>
            {!!client.phone && (
              <ThemedText type="small" themeColor="textSecondary" selectable>
                {client.phone}
              </ThemedText>
            )}
            {!!phoneDigits && (
              <View style={styles.actions}>
                <Button
                  label="Llamar"
                  icon="phone"
                  variant="secondary"
                  size="md"
                  style={styles.flex}
                  onPress={() => Linking.openURL(`tel:${phoneDigits}`)}
                />
                <Button
                  label="WhatsApp"
                  icon="message"
                  variant="secondary"
                  size="md"
                  style={styles.flex}
                  onPress={() =>
                    Linking.openURL(
                      `https://wa.me/${phoneDigits.length === 9 ? `34${phoneDigits}` : phoneDigits}`,
                    )
                  }
                />
              </View>
            )}
            <Button
              label="Nueva contraseña temporal"
              icon="key"
              variant="ghost"
              size="md"
              loading={isResetting}
              onPress={confirmReset}
            />
          </>
        )}
      </Card>

      {credentials && client && (
        <CredentialsCard
          clientName={client.full_name}
          email={credentials.email}
          password={credentials.password}
          phone={client.phone}
          intro="aquí tienes una contraseña nueva para entrar en la app del taller."
        />
      )}

      <Card style={styles.infoCard}>
        <ThemedText type="caption" themeColor="textSecondary">
          COCHE
        </ThemedText>
        <InfoRow label="Matrícula" value={vehicle.plate} />
        <InfoRow
          label="Marca y modelo"
          value={`${vehicle.brand} ${vehicle.model}`}
        />
        {vehicle.year != null && (
          <InfoRow label="Año" value={String(vehicle.year)} />
        )}
        {vehicle.mileage != null && (
          <InfoRow
            label="Kilómetros"
            value={vehicle.mileage.toLocaleString("es-ES")}
          />
        )}
        <InfoRow label="Entrada" value={formatDate(vehicle.entered_at)} />
        <InfoRow
          label="Entrega prevista"
          value={
            vehicle.estimated_delivery
              ? formatDate(vehicle.estimated_delivery)
              : "Sin fecha"
          }
        />
        <View style={styles.colorRow}>
          <ThemedText type="small" themeColor="textSecondary">
            Color
          </ThemedText>
          <View
            style={[
              styles.colorDot,
              { backgroundColor: vehicle.color, borderColor: theme.border },
            ]}
          />
        </View>
      </Card>

      {!!vehicle.notes && (
        <Card style={styles.infoCard}>
          <ThemedText type="caption" themeColor="textSecondary">
            MOTIVO DE LA VISITA
          </ThemedText>
          <ThemedText type="small">{vehicle.notes}</ThemedText>
        </Card>
      )}
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="smallBold">{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { textAlign: "center" },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  summary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  thumb: {
    width: 84,
    height: 56,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 4,
  },
  tabs: { paddingHorizontal: 16, paddingVertical: 12 },
  chat: { padding: 16, gap: 12, flexGrow: 1 },
  emptyChat: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 24,
  },
  workHeader: { gap: 12, marginBottom: 8 },
  progress: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 4,
  },
  info: { padding: 16, gap: 12, paddingBottom: 48 },
  infoCard: { gap: 8 },
  actions: { flexDirection: "row", gap: 10, marginTop: 4 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  colorRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  colorDot: { width: 22, height: 22, borderRadius: 11, borderWidth: 1 },
});
