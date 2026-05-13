import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Modal,
  TextInput,
  Pressable,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { format, parse, isValid } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Colors } from '../../constants/colors';

function parseYyyyMmDd(s: string): Date {
  const d = parse(s.trim(), 'yyyy-MM-dd', new Date());
  return isValid(d) ? d : new Date();
}

function parseHhMm(s: string): Date {
  const ref = new Date();
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
  if (!m) {
    ref.setHours(9, 0, 0, 0);
    return ref;
  }
  const h = Math.min(23, Math.max(0, parseInt(m[1], 10)));
  const min = Math.min(59, Math.max(0, parseInt(m[2], 10)));
  ref.setHours(h, min, 0, 0);
  return ref;
}

export interface FormDatePickerProps {
  label: string;
  value: string;
  onChange: (yyyyMmDd: string) => void;
  minimumDate?: Date;
  zorunlu?: boolean;
}

/** Tarih: `yyyy-MM-dd` — iOS/Android yerel seçici; web’de metin alanı. */
export function FormDatePicker({ label, value, onChange, minimumDate, zorunlu }: FormDatePickerProps) {
  const [androidOpen, setAndroidOpen] = useState(false);
  const [iosOpen, setIosOpen] = useState(false);
  const [iosDraft, setIosDraft] = useState(() => (value ? parseYyyyMmDd(value) : new Date()));

  const displayText = useMemo(() => {
    if (!value?.trim()) return 'Tarih seçin';
    const d = parse(value.trim(), 'yyyy-MM-dd', new Date());
    return isValid(d) ? format(d, 'd MMMM yyyy', { locale: tr }) : 'Tarih seçin';
  }, [value]);

  const commitAndroid = (event: DateTimePickerEvent, date?: Date) => {
    setAndroidOpen(false);
    if (event.type !== 'set' || !date) return;
    onChange(format(date, 'yyyy-MM-dd'));
  };

  const openPicker = () => {
    if (Platform.OS === 'web') return;
    const base = value ? parseYyyyMmDd(value) : new Date();
    setIosDraft(base);
    if (Platform.OS === 'android') setAndroidOpen(true);
    else setIosOpen(true);
  };

  if (Platform.OS === 'web') {
    return (
      <View style={styles.wrap}>
        <Text style={styles.label}>
          {label}
          {zorunlu ? ' *' : ''}
        </Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-AA-GG"
          placeholderTextColor={Colors.textMuted}
          value={value}
          onChangeText={onChange}
        />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>
        {label}
        {zorunlu ? ' *' : ''}
      </Text>
      <TouchableOpacity style={styles.pickerRow} onPress={openPicker} activeOpacity={0.7}>
        <Text style={[styles.pickerText, !value?.trim() && styles.placeholder]} numberOfLines={1}>
          {displayText}
        </Text>
        <Ionicons name="calendar-outline" size={20} color={Colors.primaryLight} />
      </TouchableOpacity>

      {Platform.OS === 'android' && androidOpen && (
        <DateTimePicker
          value={value ? parseYyyyMmDd(value) : new Date()}
          mode="date"
          display="default"
          onChange={commitAndroid}
          minimumDate={minimumDate}
        />
      )}

      {Platform.OS === 'ios' && (
        <Modal visible={iosOpen} transparent animationType="slide">
          <View style={styles.modalRoot}>
            <Pressable style={styles.modalBackdrop} onPress={() => setIosOpen(false)} />
            <View style={styles.iosSheet}>
            <View style={styles.iosToolbar}>
              <TouchableOpacity onPress={() => setIosOpen(false)}>
                <Text style={styles.iosToolbarBtn}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  onChange(format(iosDraft, 'yyyy-MM-dd'));
                  setIosOpen(false);
                }}
              >
                <Text style={[styles.iosToolbarBtn, styles.iosToolbarTamam]}>Tamam</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={iosDraft}
              mode="date"
              display="spinner"
              locale="tr_TR"
              onChange={(_, d) => d && setIosDraft(d)}
              minimumDate={minimumDate}
              themeVariant="light"
            />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

export interface FormTimePickerProps {
  label: string;
  value: string;
  onChange: (hhMm: string) => void;
  /** Bitiş saati gibi alanlarda temizleme */
  clearable?: boolean;
  zorunlu?: boolean;
}

/** Saat: `HH:mm` (24 saat) */
export function FormTimePicker({ label, value, onChange, clearable, zorunlu }: FormTimePickerProps) {
  const [androidOpen, setAndroidOpen] = useState(false);
  const [iosOpen, setIosOpen] = useState(false);
  const [iosDraft, setIosDraft] = useState(() => parseHhMm(value || '09:00'));

  const displayText = value?.trim() ? value.trim() : 'Saat seçin';

  const commitAndroid = (event: DateTimePickerEvent, date?: Date) => {
    setAndroidOpen(false);
    if (event.type !== 'set' || !date) return;
    onChange(format(date, 'HH:mm'));
  };

  const openPicker = () => {
    if (Platform.OS === 'web') return;
    setIosDraft(parseHhMm(value || '09:00'));
    if (Platform.OS === 'android') setAndroidOpen(true);
    else setIosOpen(true);
  };

  if (Platform.OS === 'web') {
    return (
      <View style={styles.wrap}>
        <Text style={styles.label}>
          {label}
          {zorunlu ? ' *' : ''}
        </Text>
        <TextInput
          style={styles.input}
          placeholder="SS:DD"
          placeholderTextColor={Colors.textMuted}
          value={value}
          onChangeText={onChange}
        />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>
        {label}
        {zorunlu ? ' *' : ''}
      </Text>
      <View style={styles.timeRow}>
        <TouchableOpacity style={[styles.pickerRow, { flex: 1 }]} onPress={openPicker} activeOpacity={0.7}>
          <Text style={[styles.pickerText, !value?.trim() && styles.placeholder]}>{displayText}</Text>
          <Ionicons name="time-outline" size={20} color={Colors.primaryLight} />
        </TouchableOpacity>
        {clearable && !!value?.trim() ? (
          <TouchableOpacity style={styles.clearBtn} onPress={() => onChange('')} hitSlop={8}>
            <Ionicons name="close-circle" size={22} color={Colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {Platform.OS === 'android' && androidOpen && (
        <DateTimePicker
          value={parseHhMm(value || '09:00')}
          mode="time"
          display="default"
          is24Hour
          onChange={commitAndroid}
        />
      )}

      {Platform.OS === 'ios' && (
        <Modal visible={iosOpen} transparent animationType="slide">
          <View style={styles.modalRoot}>
            <Pressable style={styles.modalBackdrop} onPress={() => setIosOpen(false)} />
            <View style={styles.iosSheet}>
            <View style={styles.iosToolbar}>
              <TouchableOpacity onPress={() => setIosOpen(false)}>
                <Text style={styles.iosToolbarBtn}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  onChange(format(iosDraft, 'HH:mm'));
                  setIosOpen(false);
                }}
              >
                <Text style={[styles.iosToolbarBtn, styles.iosToolbarTamam]}>Tamam</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={iosDraft}
              mode="time"
              display="spinner"
              is24Hour
              locale="tr_TR"
              onChange={(_, d) => d && setIosDraft(d)}
              themeVariant="light"
            />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 0 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8, marginTop: 16 },
  input: {
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 12,
    padding: 14,
    color: Colors.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  pickerText: { flex: 1, fontSize: 14, color: Colors.text, fontWeight: '500' },
  placeholder: { color: Colors.textMuted, fontWeight: '400' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  clearBtn: { padding: 4 },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  iosSheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 24,
  },
  iosToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  iosToolbarBtn: { fontSize: 16, color: Colors.textMuted },
  iosToolbarTamam: { fontWeight: '700', color: Colors.primaryLight },
});
