import * as Haptics from "expo-haptics";
import { memo, type ReactElement, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import ReorderableList, {
  type ReorderableListReorderEvent,
  reorderItems,
  useIsActive,
  useReorderableDrag,
} from "react-native-reorderable-list";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { TextField } from "@/components/ui/text-field";
import { CardShadow, Radius } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import {
  addTask,
  advanceTask,
  deleteTask,
  reorderTasks,
  updateTask,
} from "@/hooks/use-workshop";
import { TASK_STATUS_LABEL, type Task, type TaskStatus } from "@/lib/types";

const SUGGESTIONS = [
  "Diagnosis",
  "Cambio de aceite y filtros",
  "Revisión de frenos",
  "Neumáticos",
  "Pre-ITV",
  "Lavado y entrega",
];

type Props = {
  vehicleId: string;
  tasks: Task[];
  header: ReactElement;
  /** Recarga los datos tras un cambio (el realtime no avisa de los borrados filtrados). */
  onChange: () => Promise<void>;
};

/**
 * Trabajos del coche: añadir arriba, tocar el círculo para avanzar el estado,
 * tocar el trabajo para editarlo o borrarlo, y arrastrar ⋮⋮ para ordenar.
 */
export function TaskBoard({ vehicleId, tasks, header, onChange }: Props) {
  // Orden local mientras se arrastra, para que no "salte" antes de que llegue el realtime.
  const [order, setOrder] = useState<{ ids: string[]; basis: Task[] } | null>(
    null,
  );
  const [editing, setEditing] = useState<Task | null>(null);
  const ordered =
    order && order.basis === tasks
      ? order.ids
          .map((id) => tasks.find((task) => task.id === id))
          .filter((task): task is Task => !!task)
      : tasks;

  /** Ejecuta un cambio, recarga y avisa si falla. */
  async function run(action: () => Promise<void>, failure: string) {
    try {
      await action();
    } catch (error) {
      Alert.alert(failure, (error as Error).message);
    }
    await onChange();
  }

  function handleReorder({ from, to }: ReorderableListReorderEvent) {
    const next = reorderItems(ordered, from, to);
    setOrder({ ids: next.map((task) => task.id), basis: tasks });
    run(
      () =>
        reorderTasks(
          vehicleId,
          next.map((task) => task.id),
        ),
      "No se pudo ordenar",
    );
  }

  return (
    <>
      <ReorderableList
        data={ordered}
        keyExtractor={(task) => task.id}
        onReorder={handleReorder}
        shouldUpdateActiveItem
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={styles.header}>
            {header}
            <AddTask
              existing={tasks}
              onAdd={(title) =>
                run(
                  () =>
                    addTask(
                      vehicleId,
                      title,
                      Math.max(0, ...tasks.map((task) => task.position)) + 1,
                    ),
                  "No se pudo añadir",
                )
              }
            />
          </View>
        }
        ListEmptyComponent={
          <ThemedText
            type="small"
            themeColor="textSecondary"
            style={styles.empty}
          >
            Aún no hay trabajos. Añade el primero arriba.
          </ThemedText>
        }
        ListFooterComponent={
          tasks.length > 0 ? (
            <ThemedText
              type="caption"
              themeColor="textSecondary"
              style={styles.tip}
            >
              Toca ○ para cambiar el estado · toca el trabajo para editarlo o
              borrarlo · mantén ⋮⋮ y arrastra para ordenar
            </ThemedText>
          ) : undefined
        }
        renderItem={({ item }) => (
          <TaskRow
            task={item}
            onAdvance={() => run(() => advanceTask(item), "No se pudo guardar")}
            onOpen={() => setEditing(item)}
          />
        )}
      />
      <TaskEditor
        task={editing}
        onClose={() => setEditing(null)}
        onSave={(changes) => {
          if (!editing) return;
          const id = editing.id;
          setEditing(null);
          run(() => updateTask(id, changes), "No se pudo guardar");
        }}
        onDelete={() => {
          if (!editing) return;
          const id = editing.id;
          setEditing(null);
          run(() => deleteTask(id), "No se pudo borrar");
        }}
      />
    </>
  );
}

const TaskRow = memo(function TaskRow({
  task,
  onAdvance,
  onOpen,
}: {
  task: Task;
  onAdvance: () => void;
  onOpen: () => void;
}) {
  const theme = useTheme();
  const drag = useReorderableDrag();
  const isActive = useIsActive();
  const done = task.status === "completada";
  const inProgress = task.status === "en_curso";
  const color = done
    ? theme.success
    : inProgress
      ? theme.accent
      : theme.textSecondary;

  return (
    <View
      style={[
        styles.row,
        isActive && CardShadow,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: isActive ? theme.accent : theme.border,
        },
      ]}
    >
      <Pressable
        onPress={() => {
          Haptics.selectionAsync();
          onAdvance();
        }}
        hitSlop={8}
        accessibilityLabel="Cambiar estado"
        style={styles.checkButton}
      >
        <View
          style={[
            styles.check,
            {
              borderColor: done
                ? theme.success
                : inProgress
                  ? theme.accent
                  : theme.border,
              backgroundColor: done
                ? theme.success
                : inProgress
                  ? theme.accentSoft
                  : "transparent",
            },
          ]}
        >
          {done && <Icon name="check" color="#fff" size={15} strokeWidth={3} />}
          {inProgress && <Icon name="tool" color={theme.accent} size={14} />}
        </View>
      </Pressable>
      <Pressable
        style={styles.main}
        onPress={onOpen}
        accessibilityLabel="Editar trabajo"
      >
        <ThemedText
          type="smallBold"
          themeColor={done ? "textSecondary" : "text"}
          style={done && styles.done}
        >
          {task.title}
        </ThemedText>
        {!!task.description && (
          <ThemedText
            type="caption"
            themeColor="textSecondary"
            numberOfLines={2}
            style={styles.description}
          >
            {task.description}
          </ThemedText>
        )}
        <ThemedText type="caption" style={{ color }}>
          {TASK_STATUS_LABEL[task.status]}
        </ThemedText>
      </Pressable>
      <Pressable
        onPressIn={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          drag();
        }}
        hitSlop={8}
        accessibilityLabel="Arrastrar para ordenar"
        style={styles.grip}
      >
        <Icon name="grip" color={theme.textSecondary} size={20} />
      </Pressable>
    </View>
  );
});

function AddTask({
  existing,
  onAdd,
}: {
  existing: Task[];
  onAdd: (title: string) => void;
}) {
  const theme = useTheme();
  const [title, setTitle] = useState("");
  const suggestions = SUGGESTIONS.filter(
    (suggestion) =>
      !existing.some(
        (task) => task.title.toLowerCase() === suggestion.toLowerCase(),
      ),
  );

  function add(value: string) {
    const clean = value.trim();
    if (!clean) return;
    Haptics.selectionAsync();
    setTitle("");
    onAdd(clean);
  }

  return (
    <View style={styles.add}>
      <View
        style={[
          styles.addField,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: theme.accent,
          },
        ]}
      >
        <Icon name="plus" color={theme.accent} size={20} />
        <TextInput
          style={[styles.addInput, { color: theme.text }]}
          placeholder="Añadir trabajo…"
          placeholderTextColor={theme.textSecondary}
          value={title}
          onChangeText={setTitle}
          onSubmitEditing={() => add(title)}
          returnKeyType="done"
          submitBehavior="submit"
        />
        <Pressable
          onPress={() => add(title)}
          disabled={!title.trim()}
          style={[
            styles.addButton,
            {
              backgroundColor: title.trim()
                ? theme.accent
                : theme.backgroundSelected,
            },
          ]}
        >
          <ThemedText
            type="smallBold"
            style={{
              color: title.trim() ? theme.onAccent : theme.textSecondary,
            }}
          >
            Añadir
          </ThemedText>
        </Pressable>
      </View>
      {suggestions.length > 0 && (
        <View style={styles.suggestions}>
          {suggestions.map((suggestion) => (
            <Pressable
              key={suggestion}
              onPress={() => add(suggestion)}
              style={[styles.suggestion, { borderColor: theme.border }]}
            >
              <ThemedText type="caption" themeColor="textSecondary">
                + {suggestion}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const STATUSES: TaskStatus[] = ["pendiente", "en_curso", "completada"];

/** Hoja para editar un trabajo: nombre, nota para el cliente, estado y borrar. */
function TaskEditor({
  task,
  onClose,
  onSave,
  onDelete,
}: {
  task: Task | null;
  onClose: () => void;
  onSave: (changes: Pick<Task, "title" | "description" | "status">) => void;
  onDelete: () => void;
}) {
  return (
    <Modal
      visible={!!task}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      {/* key: el formulario se reinicia con los datos de cada trabajo que se abre */}
      {task && (
        <TaskEditorForm
          key={task.id}
          task={task}
          onClose={onClose}
          onSave={onSave}
          onDelete={onDelete}
        />
      )}
    </Modal>
  );
}

function TaskEditorForm({
  task,
  onClose,
  onSave,
  onDelete,
}: {
  task: Task;
  onClose: () => void;
  onSave: (changes: Pick<Task, "title" | "description" | "status">) => void;
  onDelete: () => void;
}) {
  const theme = useTheme();
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [status, setStatus] = useState<TaskStatus>(task.status);

  function confirmDelete() {
    Alert.alert("¿Borrar este trabajo?", task.title, [
      { text: "Cancelar", style: "cancel" },
      { text: "Borrar", style: "destructive", onPress: onDelete },
    ]);
  }

  return (
    <SafeAreaView style={[styles.sheet, { backgroundColor: theme.background }]}>
      <View style={styles.sheetHeader}>
        <Pressable onPress={onClose} hitSlop={10}>
          <ThemedText style={{ color: theme.accent }}>Cancelar</ThemedText>
        </Pressable>
        <ThemedText type="heading">Editar trabajo</ThemedText>
        <Pressable
          onPress={() =>
            onSave({
              title: title.trim(),
              description: description.trim() || null,
              status,
            })
          }
          disabled={!title.trim()}
          hitSlop={10}
        >
          <ThemedText
            type="smallBold"
            style={{ color: title.trim() ? theme.accent : theme.textSecondary }}
          >
            Guardar
          </ThemedText>
        </Pressable>
      </View>

      <View style={styles.sheetBody}>
        <TextField label="Trabajo" value={title} onChangeText={setTitle} />
        <TextField
          label="Nota para el cliente (opcional)"
          value={description}
          onChangeText={setDescription}
          multiline
          placeholder="Ej.: pastillas delanteras Brembo, discos en buen estado."
          hint="El cliente la verá debajo del trabajo en su app."
        />
        <ThemedText type="caption" themeColor="textSecondary">
          ESTADO
        </ThemedText>
        <View style={styles.statusRow}>
          {STATUSES.map((option) => {
            const selected = option === status;
            const color =
              option === "completada"
                ? theme.success
                : option === "en_curso"
                  ? theme.accent
                  : theme.textSecondary;
            return (
              <Pressable
                key={option}
                onPress={() => {
                  Haptics.selectionAsync();
                  setStatus(option);
                }}
                style={[
                  styles.statusOption,
                  {
                    borderColor: selected ? color : theme.border,
                    backgroundColor: selected ? color : "transparent",
                  },
                ]}
              >
                <ThemedText
                  type="smallBold"
                  style={{ color: selected ? "#fff" : color }}
                >
                  {TASK_STATUS_LABEL[option]}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.flex} />
        <Button
          label="Borrar trabajo"
          icon="trash"
          variant="danger"
          onPress={confirmDelete}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { padding: 16, gap: 8, paddingBottom: 48 },
  header: { gap: 16, marginBottom: 6 },
  empty: { textAlign: "center", paddingVertical: 24 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radius.md,
    borderWidth: 1,
    minHeight: 60,
  },
  checkButton: { paddingHorizontal: 12, paddingVertical: 14 },
  check: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  main: { flex: 1, gap: 2, paddingVertical: 10 },
  description: { fontWeight: 500, letterSpacing: 0 },
  done: { textDecorationLine: "line-through" },
  grip: { paddingHorizontal: 14, paddingVertical: 18 },
  add: { gap: 10 },
  addField: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 54,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    paddingLeft: 14,
    paddingRight: 6,
  },
  addInput: { flex: 1, fontSize: 16, height: "100%" },
  addButton: {
    height: 42,
    paddingHorizontal: 14,
    borderRadius: Radius.sm,
    justifyContent: "center",
  },
  suggestions: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  suggestion: {
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tip: { textAlign: "center", fontWeight: 500, letterSpacing: 0, marginTop: 8 },
  sheet: { flex: 1 },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  sheetBody: { flex: 1, padding: 16, gap: 14, paddingBottom: 24 },
  statusRow: { flexDirection: "row", gap: 8 },
  statusOption: {
    flex: 1,
    height: 44,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
});
