import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { CardShadow, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props<T extends string> = {
  options: { value: T; label: string; badge?: number }[];
  value: T;
  onChange: (value: T) => void;
};

/** Selector de pestañas tipo iOS. */
export function Segmented<T extends string>({ options, value, onChange }: Props<T>) {
  const theme = useTheme();
  return (
    <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => {
              if (!selected) Haptics.selectionAsync();
              onChange(option.value);
            }}
            style={[
              styles.segment,
              selected && [CardShadow, { backgroundColor: theme.backgroundElement }],
            ]}>
            <ThemedText type="smallBold" themeColor={selected ? 'text' : 'textSecondary'}>
              {option.label}
            </ThemedText>
            {!!option.badge && (
              <View style={[styles.badge, { backgroundColor: theme.accent }]}>
                <ThemedText type="caption" style={{ color: theme.onAccent, fontSize: 11, lineHeight: 14 }}>
                  {option.badge}
                </ThemedText>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', borderRadius: Radius.md, padding: 3 },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 36,
    borderRadius: Radius.md - 3,
  },
  badge: { minWidth: 18, paddingHorizontal: 5, borderRadius: 9, alignItems: 'center' },
});
