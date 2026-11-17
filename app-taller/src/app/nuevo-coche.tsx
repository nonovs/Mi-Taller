import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { type ReactNode, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { CarIllustration } from "@/components/car-illustration";
import { CredentialsCard } from "@/components/credentials-card";
import { LicensePlate } from "@/components/license-plate";
import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { TextField } from "@/components/ui/text-field";
import { Radius, withAlpha } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { createVehicle } from "@/hooks/use-workshop";

const CAR_COLORS = [
  { name: "Blanco", hex: "#F2F2F2" },
  { name: "Negro", hex: "#1C1C1E" },
  { name: "Gris", hex: "#7D8187" },
  { name: "Plata", hex: "#BFC3C8" },
  { name: "Rojo", hex: "#C0392B" },
  { name: "Azul", hex: "#2563EB" },
  { name: "Azul marino", hex: "#1E3A5F" },
  { name: "Verde", hex: "#2F7D4F" },
  { name: "Amarillo", hex: "#E8B923" },
  { name: "Naranja", hex: "#E8590C" },
  { name: "Marrón", hex: "#7B4A2A" },
  { name: "Beige", hex: "#D8C3A0" },
];

const DELIVERY_OPTIONS = [
  { label: "Sin fecha", days: null },
  { label: "Hoy", days: 0 },
  { label: "Mañana", days: 1 },
  { label: "En 2 días", days: 2 },
  { label: "En 1 semana", days: 7 },
] as const;

const TASK_SUGGESTIONS = [
  "Diagnosis",
  "Cambio de aceite y filtros",
  "Revisión de frenos",
  "Neumáticos",
  "Pre-ITV",
  "Lavado y entrega",
];

type Created = {
  vehicleId: string;
  email: string;
  password: string | null;
};

export default function NewVehicleScreen() {
  const theme = useTheme();
  const [clientName, setClientName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [plate, setPlate] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [mileage, setMileage] = useState("");
  const [color, setColor] = useState(CAR_COLORS[0].hex);
  const [notes, setNotes] = useState("");
  const [deliveryDays, setDeliveryDays] = useState<number | null>(null);
  const [tasks, setTasks] = useState<string[]>([]);
  const [taskDraft, setTaskDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [created, setCreated] = useState<Created | null>(null);

  const canSave =
    clientName.trim() &&
    email.trim() &&
    phone.replace(/\D/g, "").length >= 9 &&
    plate.trim() &&
    brand.trim() &&
    model.trim();

  function addTask(title: string) {
    const clean = title.trim();
    if (!clean || tasks.includes(clean)) return;
    Haptics.selectionAsync();
    setTasks([...tasks, clean]);
    setTaskDraft("");
  }

  async function save() {
    setError(null);
    setIsSaving(true);
    try {
      const delivery =
        deliveryDays === null
          ? null
          : new Date(Date.now() + deliveryDays * 86_400_000).toISOString();
      const result = await createVehicle({
        client: { full_name: clientName, email, phone },
        vehicle: {
          plate,
          brand,
          model,
          year: parseInt(year, 10) || null,
          color,
          mileage: parseInt(mileage.replace(/\D/g, ""), 10) || null,
          notes: notes || null,
          estimated_delivery: delivery,
        },
        tasks: taskDraft.trim() ? [...tasks, taskDraft.trim()] : tasks,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCreated({
        vehicleId: result.vehicle_id,
        email: result.client_email,
        password: result.temporary_password,
      });
    } catch (saveError) {
      setError((saveError as Error).message);
    }
    setIsSaving(false);
  }

  if (created) {
    return (
      <ScrollView
        style={{ backgroundColor: theme.background }}
        contentContainerStyle={styles.content}
      >
        <View style={styles.success}>
          <View
            style={[styles.successIcon, { backgroundColor: theme.successSoft }]}
          >
            <Icon
              name="check"
              color={theme.success}
              size={30}
              strokeWidth={3}
            />
          </View>
          <ThemedText type="subtitle">Coche dado de alta</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.center}>
            {created.password
              ? `Hemos creado la cuenta de ${clientName.trim()}. Envíale ahora sus datos de acceso:`
              : `${clientName.trim()} ya tenía cuenta: verá el coche al entrar en su app.`}
          </ThemedText>
        </View>
        {created.password && (
          <CredentialsCard
            clientName={clientName.trim()}
            email={created.email}
            password={created.password}
            phone={phone}
            intro={`tu ${brand.trim()} ${model.trim()} ya está en nuestro taller.`}
          />
        )}
        <Button
          label="Ver el coche"
          variant={created.password ? "secondary" : "primary"}
          icon="chevron-right"
          onPress={() =>
            router.replace({
              pathname: "/vehiculo/[id]",
              params: { id: created.vehicleId },
            })
          }
        />
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Vista previa en directo */}
        <View
          style={[
            styles.preview,
            {
              backgroundColor: withAlpha(color, 0.16),
              borderColor: theme.border,
            },
          ]}
        >
          <CarIllustration color={color} width={250} />
          <LicensePlate plate={plate.trim() || "0000 XXX"} />
          <ThemedText type="heading">
            {`${brand} ${model}`.trim() || "Marca y modelo"}
          </ThemedText>
        </View>

        <Section title="Cliente" icon="user">
          <TextField
            label="Nombre y apellidos"
            value={clientName}
            onChangeText={setClientName}
            autoCapitalize="words"
          />
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            hint="Con este email entrará en la app. Si ya es cliente, el coche se añade a su cuenta."
          />
          <TextField
            label="Móvil"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="600 123 456"
            hint="Le enviaremos aquí sus datos de acceso por WhatsApp o SMS."
          />
        </Section>

        <Section title="Coche" icon="tool">
          <TextField
            label="Matrícula"
            value={plate}
            onChangeText={setPlate}
            autoCapitalize="characters"
            placeholder="1234 ABC"
          />
          <View style={styles.pair}>
            <View style={styles.flex}>
              <TextField
                label="Marca"
                value={brand}
                onChangeText={setBrand}
                placeholder="Seat"
              />
            </View>
            <View style={styles.flex}>
              <TextField
                label="Modelo"
                value={model}
                onChangeText={setModel}
                placeholder="León"
              />
            </View>
          </View>
          <View style={styles.pair}>
            <View style={styles.flex}>
              <TextField
                label="Año"
                value={year}
                onChangeText={setYear}
                keyboardType="number-pad"
                maxLength={4}
              />
            </View>
            <View style={styles.flex}>
              <TextField
                label="Kilómetros"
                value={mileage}
                onChangeText={setMileage}
                keyboardType="number-pad"
              />
            </View>
          </View>
          <ThemedText type="caption" themeColor="textSecondary">
            COLOR · {CAR_COLORS.find((option) => option.hex === color)?.name}
          </ThemedText>
          <View style={styles.swatches}>
            {CAR_COLORS.map((option) => (
              <Pressable
                key={option.hex}
                accessibilityLabel={option.name}
                onPress={() => {
                  Haptics.selectionAsync();
                  setColor(option.hex);
                }}
                style={[
                  styles.swatch,
                  {
                    backgroundColor: option.hex,
                    borderColor:
                      color === option.hex ? theme.accent : theme.border,
                    borderWidth: color === option.hex ? 3 : 1,
                  },
                ]}
              />
            ))}
          </View>
        </Section>

        <Section title="Visita" icon="calendar">
          <TextField
            label="Motivo de la visita"
            value={notes}
            onChangeText={setNotes}
            multiline
            placeholder="Ruido al frenar, revisión de los 90.000 km…"
          />
          <ThemedText type="caption" themeColor="textSecondary">
            ENTREGA PREVISTA
          </ThemedText>
          <View style={styles.chips}>
            {DELIVERY_OPTIONS.map((option) => {
              const active = deliveryDays === option.days;
              return (
                <Pressable
                  key={option.label}
                  onPress={() => setDeliveryDays(option.days)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active
                        ? theme.accent
                        : theme.backgroundElement,
                      borderColor: active ? theme.accent : theme.border,
                    },
                  ]}
                >
                  <ThemedText
                    type="caption"
                    style={{
                      color: active ? theme.onAccent : theme.textSecondary,
                    }}
                  >
                    {option.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </Section>

        <Section title="Trabajos" icon="check">
          {tasks.map((task, index) => (
            <View
              key={task}
              style={[styles.taskRow, { borderColor: theme.border }]}
            >
              <ThemedText type="caption" themeColor="textSecondary">
                {index + 1}
              </ThemedText>
              <ThemedText type="small" style={styles.flex}>
                {task}
              </ThemedText>
              <Pressable
                onPress={() => setTasks(tasks.filter((item) => item !== task))}
                hitSlop={8}
              >
                <Icon name="x" color={theme.textSecondary} size={18} />
              </Pressable>
            </View>
          ))}
          <TextField
            icon="plus"
            placeholder="Añadir trabajo…"
            value={taskDraft}
            onChangeText={setTaskDraft}
            onSubmitEditing={() => addTask(taskDraft)}
            returnKeyType="done"
            blurOnSubmit={false}
          />
          <View style={styles.chips}>
            {TASK_SUGGESTIONS.filter(
              (suggestion) => !tasks.includes(suggestion),
            ).map((suggestion) => (
              <Pressable
                key={suggestion}
                onPress={() => addTask(suggestion)}
                style={[styles.chip, { borderColor: theme.border }]}
              >
                <ThemedText type="caption" themeColor="textSecondary">
                  + {suggestion}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </Section>

        {error && (
          <ThemedText
            type="small"
            style={[styles.center, { color: theme.danger }]}
          >
            {error}
          </ThemedText>
        )}
        <Button
          label="Dar de alta"
          icon="check"
          onPress={save}
          loading={isSaving}
          disabled={!canSave}
        />
        <ThemedText
          type="caption"
          themeColor="textSecondary"
          style={[styles.center, styles.footnote]}
        >
          Obligatorio: nombre, email, móvil, matrícula, marca y modelo.
        </ThemedText>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: "user" | "tool" | "calendar" | "check";
  children: ReactNode;
}) {
  const theme = useTheme();
  return (
    <Card style={styles.section}>
      <View style={styles.sectionHeader}>
        <View
          style={[styles.sectionIcon, { backgroundColor: theme.accentSoft }]}
        >
          <Icon name={icon} color={theme.accent} size={16} />
        </View>
        <ThemedText type="heading">{title}</ThemedText>
      </View>
      {children}
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { textAlign: "center" },
  content: { padding: 16, gap: 16, paddingBottom: 48 },
  preview: {
    alignItems: "center",
    gap: 10,
    padding: 20,
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
  },
  section: { gap: 12 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  sectionIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  pair: { flexDirection: "row", gap: 10 },
  swatches: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  swatch: { width: 36, height: 36, borderRadius: 18 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  success: { alignItems: "center", gap: 8, paddingVertical: 12 },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  footnote: { fontWeight: 500, letterSpacing: 0 },
});
