import { useState } from 'react';

import { AuthScreen } from '@/components/auth-screen';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { useAuth } from '@/context/auth';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';

const MIN_LENGTH = 8;

export default function ChangePasswordScreen() {
  const theme = useTheme();
  const { firstName } = useAuth();
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function save() {
    if (password.length < MIN_LENGTH) {
      setError(`La contraseña debe tener al menos ${MIN_LENGTH} caracteres.`);
      return;
    }
    if (password !== repeat) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setError(null);
    setIsSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({
      password,
      data: { must_change_password: false },
    });
    setIsSaving(false);
    // Si va bien, la sesión se actualiza y el router abre "Mis coches".
    if (updateError) {
      setError(
        updateError.code === 'same_password'
          ? 'Elige una contraseña distinta de la temporal.'
          : updateError.code === 'weak_password'
            ? 'Esa contraseña es demasiado débil. Prueba con otra más larga.'
            : 'No se ha podido guardar. Revisa la conexión.',
      );
    }
  }

  return (
    <AuthScreen
      title={firstName ? `¡Hola, ${firstName}!` : '¡Bienvenido!'}
      subtitle="Crea tu propia contraseña para sustituir la temporal que te dio el taller.">
      <TextField
        label="Nueva contraseña"
        icon="key"
        placeholder={`Mínimo ${MIN_LENGTH} caracteres`}
        autoCapitalize="none"
        autoComplete="new-password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TextField
        label="Repite la contraseña"
        icon="key"
        autoCapitalize="none"
        autoComplete="new-password"
        secureTextEntry
        value={repeat}
        onChangeText={setRepeat}
        onSubmitEditing={save}
      />
      {error && (
        <ThemedText type="small" style={{ color: theme.danger }}>
          {error}
        </ThemedText>
      )}
      <Button label="Guardar y entrar" onPress={save} loading={isSaving} disabled={!password || !repeat} />
      <Button label="Salir" variant="ghost" size="md" onPress={() => supabase.auth.signOut()} />
    </AuthScreen>
  );
}
