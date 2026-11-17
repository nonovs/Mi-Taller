import { StyleSheet, View, type ViewProps } from 'react-native';

import { CardShadow, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Superficie elevada básica de la app. */
export function Card({ style, ...rest }: ViewProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.card,
        CardShadow,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
  },
});
