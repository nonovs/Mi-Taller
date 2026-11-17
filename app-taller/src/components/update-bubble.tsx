import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatTime, type VehicleUpdate } from '@/lib/types';

/** Mensaje del taller con avatar del mecánico, nombre y hora. */
export function UpdateBubble({ update, highlight = false }: { update: VehicleUpdate; highlight?: boolean }) {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      <View style={[styles.avatar, { backgroundColor: theme.accentSoft }]}>
        <ThemedText type="smallBold" style={{ color: theme.accent }}>
          {update.author_name.charAt(0).toUpperCase()}
        </ThemedText>
      </View>
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: highlight ? theme.accentSoft : theme.backgroundElement,
            borderColor: highlight ? theme.accent : theme.border,
          },
        ]}>
        <View style={styles.meta}>
          <ThemedText type="smallBold">{update.author_name}</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">
            {formatTime(update.created_at)}
          </ThemedText>
        </View>
        <ThemedText type="small" style={styles.message}>
          {update.message}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.lg,
    borderTopLeftRadius: 6,
    borderWidth: 1,
    gap: 4,
  },
  meta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  message: { lineHeight: 21 },
});
