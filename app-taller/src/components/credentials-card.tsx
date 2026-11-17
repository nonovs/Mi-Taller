import * as SMS from "expo-sms";
import { Alert, Linking, Share, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Fonts, Radius } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type Props = {
  clientName: string;
  email: string;
  password: string;
  phone: string | null;
  /** Frase inicial del mensaje, p. ej. "tu Seat León (1234 KLM) ya está en el taller." */
  intro: string;
};

/** Muestra el acceso temporal del cliente y permite enviárselo por WhatsApp o compartirlo. */
export function CredentialsCard({
  clientName,
  email,
  password,
  phone,
  intro,
}: Props) {
  const theme = useTheme();
  const firstName = clientName.split(" ")[0];
  const message =
    `Hola ${firstName}, ${intro}\n\n` +
    `Con la app MiTaller puedes seguir la reparación y los mensajes del mecánico.\n\n` +
    `Usuario: ${email}\nContraseña temporal: ${password}\n\n` +
    `Al entrar te pedirá crear tu propia contraseña.`;

  const digits = (phone ?? "").replace(/\D/g, "");
  const number = digits.length === 9 ? `34${digits}` : digits;

  async function sendWhatsApp() {
    const url = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(
        "WhatsApp",
        "No se ha podido abrir WhatsApp. Prueba por SMS.",
      );
    }
  }

  async function sendSms() {
    if (!(await SMS.isAvailableAsync())) {
      Alert.alert(
        "SMS",
        "Este dispositivo no puede enviar SMS. Usa «Compartir».",
      );
      return;
    }
    await SMS.sendSMSAsync([`+${number}`], message);
  }

  return (
    <Card style={styles.card}>
      <ThemedText type="heading">Acceso de {firstName}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Pásale estos datos. Al entrar por primera vez creará su propia
        contraseña.
      </ThemedText>
      <View style={[styles.box, { backgroundColor: theme.backgroundSelected }]}>
        <ThemedText type="caption" themeColor="textSecondary">
          USUARIO
        </ThemedText>
        <ThemedText type="smallBold" selectable>
          {email}
        </ThemedText>
        <ThemedText
          type="caption"
          themeColor="textSecondary"
          style={styles.gap}
        >
          CONTRASEÑA TEMPORAL
        </ThemedText>
        <ThemedText
          selectable
          style={[styles.password, { color: theme.accent }]}
        >
          {password}
        </ThemedText>
      </View>
      {!!digits && (
        <>
          <Button
            label="Enviar por WhatsApp"
            icon="message"
            onPress={sendWhatsApp}
          />
          <Button
            label="Enviar por SMS"
            icon="phone"
            variant="secondary"
            onPress={sendSms}
          />
        </>
      )}
      <Button
        label="Otra app…"
        icon="share"
        variant={digits ? "ghost" : "primary"}
        onPress={() => Share.share({ message })}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12 },
  box: { borderRadius: Radius.md, padding: 14, gap: 2 },
  gap: { marginTop: 10 },
  password: {
    fontFamily: Fonts.mono,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: 700,
    letterSpacing: 3,
  },
});
