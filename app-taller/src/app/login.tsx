import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { AuthScreen } from '@/components/auth-screen';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { useAuth } from '@/context/auth';
import { useTheme } from '@/hooks/use-theme';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export default function LoginScreen() {
  const theme = useTheme();
  const { error: accountError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function signIn() {
    setError(null);
    setIsSubmitting(true);
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    setIsSubmitting(false);
    // Si va bien y la cuenta es del taller, el router abre el panel.
    if (authError) {
      setError(
        authError.code === 'invalid_credentials'
          ? 'Email o contraseña incorrectos.'
          : 'No se ha podido entrar. Revisa la conexión.',
      );
    }
  }

  const message = error ?? accountError;

  return (
    <AuthScreen
      title="Acceso taller"
      subtitle="Gestiona los coches y mantén informados a los clientes mientras trabajas."
      footer={
        <ThemedText type="small" themeColor="textSecondary" style={styles.footer}>
          Solo para el personal del taller.
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
            placeholder="mecanico@taller.com"
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
          {message && (
            <ThemedText type="small" style={{ color: theme.danger }}>
              {message}
            </ThemedText>
          )}
          <Button label="Entrar" onPress={signIn} loading={isSubmitting} disabled={!email || !password} />
        </>
      )}
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  footer: { textAlign: 'center' },
});
