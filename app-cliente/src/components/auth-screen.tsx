import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CarIllustration } from '@/components/car-illustration';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = { title: string; subtitle: string; children: ReactNode; footer?: ReactNode };

/** Marco común de login y cambio de contraseña: marca arriba, formulario en tarjeta. */
export function AuthScreen({ title, subtitle, children, footer }: Props) {
  const theme = useTheme();

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={[theme.accentSoft, theme.background]}
        style={StyleSheet.absoluteFill}
        locations={[0, 0.6]}
      />
      <SafeAreaView style={styles.flex}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.brand}>
              <View style={[styles.logo, { backgroundColor: theme.accent }]}>
                <Icon name="tool" color={theme.onAccent} size={22} />
              </View>
              <ThemedText type="heading">MiTaller</ThemedText>
            </View>

            <View style={styles.hero}>
              <CarIllustration color={theme.accent} width={240} />
              <ThemedText type="title" style={styles.center}>
                {title}
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.center}>
                {subtitle}
              </ThemedText>
            </View>

            <Card style={styles.form}>{children}</Card>
            {footer}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: 20, gap: 24 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'center' },
  logo: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: { alignItems: 'center', gap: 6 },
  center: { textAlign: 'center' },
  form: { gap: 14, padding: 20 },
});
