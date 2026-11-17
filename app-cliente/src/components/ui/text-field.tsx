import { StyleSheet, TextInput, type TextInputProps, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Icon, type IconName } from '@/components/ui/icon';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = TextInputProps & { label?: string; icon?: IconName; hint?: string };

/** Campo de texto con etiqueta, icono opcional y pista debajo. */
export function TextField({ label, icon, hint, style, multiline, ...rest }: Props) {
  const theme = useTheme();
  return (
    <View style={styles.wrapper}>
      {label && (
        <ThemedText type="caption" themeColor="textSecondary">
          {label.toUpperCase()}
        </ThemedText>
      )}
      <View
        style={[
          styles.field,
          multiline && styles.multiline,
          { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        ]}>
        {icon && <Icon name={icon} color={theme.textSecondary} size={18} />}
        <TextInput
          placeholderTextColor={theme.textSecondary}
          multiline={multiline}
          style={[styles.input, multiline && styles.inputMultiline, { color: theme.text }, style]}
          {...rest}
        />
      </View>
      {hint && (
        <ThemedText type="caption" themeColor="textSecondary" style={styles.hint}>
          {hint}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 50,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  multiline: { alignItems: 'flex-start', paddingVertical: 12 },
  input: { flex: 1, fontSize: 16, paddingVertical: 12 },
  inputMultiline: { minHeight: 72, paddingVertical: 0, textAlignVertical: 'top' },
  hint: { fontWeight: 500, letterSpacing: 0 },
});
