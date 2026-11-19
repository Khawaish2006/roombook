// Add / edit room (?id= for edit) with validation.
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Checkbox, HelperText, SegmentedButtons, Switch, Text, TextInput } from 'react-native-paper';
import { FACILITIES, Facility, Room, RoomType } from '../../src/models';
import { getRoomById, insertRoom, roomExists, updateRoom } from '../../src/repositories/roomRepo';
import { FACILITY_META, SPACING } from '../../src/theme';

export default function RoomForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id;

  const [roomId, setRoomId] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<RoomType>('classroom');
  const [capacity, setCapacity] = useState('');
  const [block, setBlock] = useState('');
  const [floor, setFloor] = useState('');
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    getRoomById(id).then((r) => {
      if (!r) return;
      setRoomId(r.id); setName(r.name); setType(r.type); setCapacity(String(r.capacity));
      setBlock(r.block); setFloor(r.floor != null ? String(r.floor) : ''); setFacilities(r.facilities); setIsActive(r.isActive);
    });
  }, [id]);

  const validate = async () => {
    const e: Record<string, string> = {};
    if (!roomId.trim()) e.roomId = 'Room ID is required';
    else if (!isEdit && (await roomExists(roomId.trim()))) e.roomId = 'A room with this ID already exists';
    if (!(parseInt(capacity, 10) > 0)) e.capacity = 'Capacity must be greater than 0';
    if (!block.trim()) e.block = 'Block is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    setSaving(true);
    if (await validate()) {
      const room: Room = {
        id: roomId.trim(),
        name: name.trim() || roomId.trim(),
        type,
        capacity: parseInt(capacity, 10),
        block: block.trim(),
        floor: floor ? parseInt(floor, 10) : null,
        facilities,
        isActive,
        imageKey: type,
      };
      isEdit ? await updateRoom(room) : await insertRoom(room);
      router.back();
    }
    setSaving(false);
  };

  const toggleFacility = (f: Facility) =>
    setFacilities((list) => (list.includes(f) ? list.filter((x) => x !== f) : [...list, f]));

  return (
    <ScrollView contentContainerStyle={{ padding: SPACING.md, paddingBottom: SPACING.xl }} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: isEdit ? `Edit ${id}` : 'Add room' }} />
      <TextInput mode="outlined" label="Room ID (e.g. A-205)" value={roomId} onChangeText={setRoomId} disabled={isEdit} autoCapitalize="characters" />
      <HelperText type="error" visible={!!errors.roomId}>{errors.roomId}</HelperText>
      <TextInput mode="outlined" label="Display name (optional)" value={name} onChangeText={setName} />

      <Text variant="labelLarge" style={styles.label}>Type</Text>
      <SegmentedButtons
        value={type}
        onValueChange={(v) => setType(v as RoomType)}
        density="small"
        buttons={[
          { value: 'classroom', label: 'Class' },
          { value: 'study_room', label: 'Study' },
          { value: 'seminar_hall', label: 'Hall' },
          { value: 'lab', label: 'Lab' },
        ]}
      />

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <TextInput mode="outlined" label="Capacity" keyboardType="number-pad" value={capacity} onChangeText={setCapacity} />
          <HelperText type="error" visible={!!errors.capacity}>{errors.capacity}</HelperText>
        </View>
        <View style={{ flex: 1 }}>
          <TextInput mode="outlined" label="Floor" keyboardType="number-pad" value={floor} onChangeText={setFloor} />
        </View>
      </View>
      <TextInput mode="outlined" label="Block (e.g. Academic Block A)" value={block} onChangeText={setBlock} />
      <HelperText type="error" visible={!!errors.block}>{errors.block}</HelperText>

      <Text variant="labelLarge" style={styles.label}>Facilities</Text>
      {FACILITIES.map((f) => (
        <Checkbox.Item key={f} label={FACILITY_META[f].label} status={facilities.includes(f) ? 'checked' : 'unchecked'} onPress={() => toggleFacility(f)} mode="android" />
      ))}

      <View style={[styles.row, { alignItems: 'center', justifyContent: 'space-between', marginTop: SPACING.sm }]}>
        <Text variant="bodyLarge">Active (bookable)</Text>
        <Switch value={isActive} onValueChange={setIsActive} />
      </View>

      <Button mode="contained" onPress={save} loading={saving} style={{ marginTop: SPACING.lg }} contentStyle={{ paddingVertical: 6 }}>
        {isEdit ? 'Save changes' : 'Add room'}
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  label: { marginTop: SPACING.md, marginBottom: SPACING.sm },
  row: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
});
