import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { type Draft, type DraftInput, publishUpdate, requestDraft } from '@/lib/drafts';

type Mode =
  | { kind: 'idle' }
  | { kind: 'sending' }
  | { kind: 'recording' }
  | { kind: 'drafting'; label: string }
  | { kind: 'review'; draft: Draft; message: string; publishing: boolean };

/**
 * Barra inferior del chat del mecánico.
 * - Texto + enviar: se publica tal cual al cliente.
 * - Texto + ✨: la IA lo redacta mejor y el mecánico revisa el borrador.
 * - Micrófono: se transcribe la nota de voz (y la IA la pule si está activa) y se revisa.
 */
export function Composer({ vehicleId }: { vehicleId: string }) {
  const theme = useTheme();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const [mode, setMode] = useState<Mode>({ kind: 'idle' });
  const [text, setText] = useState('');
  const [showOriginal, setShowOriginal] = useState(false);

  async function sendText() {
    const message = text.trim();
    setMode({ kind: 'sending' });
    try {
      await publishUpdate(vehicleId, message, 'texto', message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setText('');
    } catch (error) {
      Alert.alert('No se pudo enviar', (error as Error).message);
    }
    setMode({ kind: 'idle' });
  }

  async function draft(input: DraftInput, label: string) {
    setMode({ kind: 'drafting', label });
    try {
      const result = await requestDraft(vehicleId, input);
      setShowOriginal(false);
      setMode({ kind: 'review', draft: result, message: result.message, publishing: false });
    } catch (error) {
      setMode({ kind: 'idle' });
      Alert.alert('No se pudo preparar el mensaje', (error as Error).message);
    }
  }

  async function startRecording() {
    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Micrófono', 'Activa el permiso de micrófono para grabar notas de voz.');
      return;
    }
    await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setMode({ kind: 'recording' });
  }

  async function stopRecording(send: boolean) {
    await recorder.stop();
    await setAudioModeAsync({ allowsRecording: false });
    if (send && recorder.uri) {
      await draft({ audioUri: recorder.uri }, 'Transcribiendo la nota de voz…');
    } else {
      setMode({ kind: 'idle' });
    }
  }

  async function publishReview(current: Extract<Mode, { kind: 'review' }>) {
    setMode({ ...current, publishing: true });
    try {
      await publishUpdate(vehicleId, current.message, current.draft.source, current.draft.original);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (current.draft.source === 'texto') setText('');
      setMode({ kind: 'idle' });
    } catch (error) {
      setMode({ ...current, publishing: false });
      Alert.alert('No se pudo publicar', (error as Error).message);
    }
  }

  const barStyle = [styles.bar, { borderColor: theme.border, backgroundColor: theme.background }];

  if (mode.kind === 'recording') {
    const seconds = Math.floor(recorderState.durationMillis / 1000);
    return (
      <View style={barStyle}>
        <Pressable onPress={() => stopRecording(false)} hitSlop={8} style={styles.sideButton}>
          <Icon name="trash" color={theme.textSecondary} size={20} />
        </Pressable>
        <View style={[styles.recording, { backgroundColor: theme.dangerSoft }]}>
          <View style={[styles.recDot, { backgroundColor: theme.danger }]} />
          <ThemedText type="smallBold" style={[styles.timer, { color: theme.danger }]}>
            {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1} style={styles.flex}>
            Cuenta qué le estás haciendo…
          </ThemedText>
        </View>
        <Pressable
          style={[styles.roundButton, { backgroundColor: theme.danger }]}
          onPress={() => stopRecording(true)}
          accessibilityLabel="Parar y preparar mensaje">
          <Icon name="stop" color="#fff" />
        </Pressable>
      </View>
    );
  }

  if (mode.kind === 'drafting') {
    return (
      <View style={barStyle}>
        <ActivityIndicator color={theme.accent} />
        <ThemedText type="small" themeColor="textSecondary">
          {mode.label}
        </ThemedText>
      </View>
    );
  }

  if (mode.kind === 'review') {
    const { draft: current } = mode;
    return (
      <View style={[styles.review, { borderColor: theme.border, backgroundColor: theme.background }]}>
        <View style={styles.reviewHeader}>
          <Icon name={current.polished ? 'sparkles' : 'mic'} color={theme.accent} size={16} />
          <ThemedText type="smallBold" style={{ color: theme.accent }}>
            {current.polished ? 'Redactado por la IA · revísalo' : 'Transcripción · revísala'}
          </ThemedText>
        </View>
        {!current.polished && (
          <ThemedText type="caption" themeColor="textSecondary" style={styles.notice}>
            La IA no está activada: es lo que dijiste, tal cual. Corrígelo antes de enviarlo.
          </ThemedText>
        )}
        <TextInput
          style={[styles.reviewInput, { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
          multiline
          editable={!mode.publishing}
          value={mode.message}
          onChangeText={(message) => setMode({ ...mode, message })}
        />
        {current.polished && (
          <>
            <Pressable onPress={() => setShowOriginal((value) => !value)} hitSlop={6}>
              <ThemedText type="caption" themeColor="textSecondary">
                {showOriginal ? '▾' : '▸'} {current.source === 'audio' ? 'Lo que dijiste' : 'Lo que escribiste'}
              </ThemedText>
            </Pressable>
            {showOriginal && (
              <ThemedText type="small" themeColor="textSecondary" style={styles.original}>
                «{current.original}»
              </ThemedText>
            )}
          </>
        )}
        <View style={styles.reviewActions}>
          <Button
            label="Descartar"
            variant="secondary"
            size="md"
            disabled={mode.publishing}
            onPress={() => setMode({ kind: 'idle' })}
            style={styles.flex}
          />
          <Button
            label="Enviar al cliente"
            icon="send"
            size="md"
            loading={mode.publishing}
            disabled={!mode.message.trim()}
            onPress={() => publishReview(mode)}
            style={styles.flex2}
          />
        </View>
      </View>
    );
  }

  const hasText = text.trim().length > 0;
  const isSending = mode.kind === 'sending';
  return (
    <View style={barStyle}>
      {hasText && (
        <Pressable
          onPress={() => draft({ text: text.trim() }, 'La IA está redactando el mensaje…')}
          disabled={isSending}
          hitSlop={6}
          style={[styles.sideButton, { backgroundColor: theme.accentSoft }]}
          accessibilityLabel="Mejorar con IA">
          <Icon name="sparkles" color={theme.accent} size={20} />
        </Pressable>
      )}
      <TextInput
        style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
        placeholder="Escribe al cliente…"
        placeholderTextColor={theme.textSecondary}
        multiline
        editable={!isSending}
        value={text}
        onChangeText={setText}
      />
      <Pressable
        style={[styles.roundButton, { backgroundColor: theme.accent, opacity: isSending ? 0.6 : 1 }]}
        disabled={isSending}
        onPress={hasText ? sendText : startRecording}
        accessibilityLabel={hasText ? 'Enviar mensaje' : 'Grabar nota de voz'}>
        {isSending ? (
          <ActivityIndicator color={theme.onAccent} />
        ) : (
          <Icon name={hasText ? 'send' : 'mic'} color={theme.onAccent} size={20} />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flex2: { flex: 2 },
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    minHeight: 66,
  },
  input: {
    flex: 1,
    minHeight: 46,
    maxHeight: 120,
    borderRadius: 23,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 16,
  },
  roundButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recording: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  recDot: { width: 10, height: 10, borderRadius: 5 },
  timer: { fontVariant: ['tabular-nums'] },
  review: { borderTopWidth: StyleSheet.hairlineWidth, padding: 12, gap: 8 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  notice: { fontWeight: 500, letterSpacing: 0 },
  reviewInput: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: 12,
    fontSize: 16,
    minHeight: 90,
    maxHeight: 200,
    textAlignVertical: 'top',
  },
  original: { fontStyle: 'italic' },
  reviewActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
});
