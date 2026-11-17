import * as Haptics from 'expo-haptics';
import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Icon, type IconName } from '@/components/ui/icon';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  size?: 'md' | 'lg';
  style?: ViewStyle;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  size = 'lg',
  style,
}: Props) {
  const theme = useTheme();
  const palette = {
    primary: { background: theme.accent, color: theme.onAccent, border: theme.accent },
    secondary: { background: theme.backgroundElement, color: theme.text, border: theme.border },
    ghost: { background: 'transparent', color: theme.accent, border: 'transparent' },
    danger: { background: theme.dangerSoft, color: theme.danger, border: theme.dangerSoft },
  }[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => [
        styles.base,
        size === 'lg' ? styles.lg : styles.md,
        {
          backgroundColor: palette.background,
          borderColor: palette.border,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={palette.color} />
      ) : (
        <View style={styles.content}>
          {icon && <Icon name={icon} color={palette.color} size={size === 'lg' ? 20 : 18} />}
          <ThemedText type="smallBold" style={[styles.label, { color: palette.color }]}>
            {label}
          </ThemedText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  lg: { height: 52 },
  md: { height: 42 },
  content: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontSize: 15 },
});
