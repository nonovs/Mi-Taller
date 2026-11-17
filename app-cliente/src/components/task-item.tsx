import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/ui/icon';
import { useTheme } from '@/hooks/use-theme';
import { TASK_STATUS_LABEL, type Task } from '@/lib/types';

/** Fila de un trabajo dentro de la tarjeta "Trabajos". */
export function TaskItem({ task, isLast }: { task: Task; isLast: boolean }) {
  const theme = useTheme();
  const done = task.status === 'completada';
  const inProgress = task.status === 'en_curso';
  const color = done ? theme.success : inProgress ? theme.accent : theme.textSecondary;

  return (
    <View style={[styles.row, !isLast && { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
      <View
        style={[
          styles.icon,
          {
            borderColor: done ? theme.success : inProgress ? theme.accent : theme.border,
            backgroundColor: done ? theme.success : inProgress ? theme.accentSoft : 'transparent',
          },
        ]}>
        {done && <Icon name="check" color="#fff" size={14} strokeWidth={3} />}
        {inProgress && <Icon name="tool" color={theme.accent} size={13} />}
      </View>
      <View style={styles.body}>
        <ThemedText
          type="smallBold"
          themeColor={done ? 'textSecondary' : 'text'}
          style={done && styles.doneTitle}>
          {task.title}
        </ThemedText>
        {!!task.description && (
          <ThemedText type="small" themeColor="textSecondary">
            {task.description}
          </ThemedText>
        )}
      </View>
      <ThemedText type="caption" style={{ color }}>
        {TASK_STATUS_LABEL[task.status]}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12 },
  icon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 2, paddingTop: 2 },
  doneTitle: { textDecorationLine: 'line-through' },
});
