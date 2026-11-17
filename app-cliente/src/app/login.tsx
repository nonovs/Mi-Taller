import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { AuthScreen } from '@/components/auth-screen';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { useTheme } from '@/hooks/use-theme';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export default function LoginScreen() {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function signIn() {
    setError(null);
    setIsSubmitting(true);
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: password.trim(),
    });
    setIsSubmitting(false);
    // Si va bien, el router abre "Mis coches" (o el cambio de contraseña si es temporal).
    if (authError) {
      setError(
        authError.code === 'invalid_credentials'
          ? 'Email o contraseña incorrectos.'
          : 'No se ha podido entrar. Revisa la conexión.',
      );
    }
  }

  return (
    <AuthScreen
      title="Tu coche, en directo"
      subtitle="Mira cómo va la reparación y lo que te cuenta el mecánico, sin tener que llamar."
      footer={
        <ThemedText type="small" themeColor="textSecondary" style={styles.footer}>
          ¿Primera vez? Usa la contraseña temporal que te ha dado el taller.{'\n'}
          ¿La has olvidado? Pídele una nueva al taller.
        </ThemedText>
      }>
      {!isSupabaseConfigured ? (
        <ThemedText type="small" themeColor="textSecondary">
          Falta configurar Supabase: copia .env.example a .env y reinicia con «npx expo start».
        </ThemedText>
      ) : (
        <>
          <TextField
            label="Email"
            icon="mail"
            placeholder="tu@email.com"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextField
            label="Contraseña"
            icon="key"
            placeholder="••••••••"
            autoCapitalize="none"
            autoComplete="password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={signIn}
          />
          {error && (
            <ThemedText type="small" style={{ color: theme.danger }}>
              {error}
            </ThemedText>
          )}
          <Button
            label="Entrar"
            onPress={signIn}
            loading={isSubmitting}
            disabled={!email || !password}
          />
        </>
      )}
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  footer: { textAlign: 'center' },
});
