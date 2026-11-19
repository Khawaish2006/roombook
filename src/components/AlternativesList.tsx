// "Try these instead". Smart Alternatives shown after a conflict. Tapping one opens confirmation.
import { router } from 'expo-router';
import { View } from 'react-native';
import { List, Text } from 'react-native-paper';
import { Alternative } from '../services/alternativesService';
import { formatDate, formatRange } from '../utils/time';

interface Props {
  alternatives: Alternative[];
  purpose?: string;
  attendees?: string;
  /** 'replace' from the confirm screen, 'push' from the availability screen. */
  navigate?: 'replace' | 'push';
}

export function AlternativesList({ alternatives, purpose, attendees, navigate = 'replace' }: Props) {
  if (alternatives.length === 0) {
    return <Text variant="bodyMedium" style={{ marginTop: 8 }}>No close alternatives that day. Try another date.</Text>;
  }
  const open = (a: Alternative) =>
    router[navigate]({
      pathname: '/booking/confirm',
      params: { roomId: a.roomId, date: a.date, start: String(a.startMin), end: String(a.endMin), purpose: purpose ?? '', attendees: attendees ?? '' },
    });

  const same = alternatives.filter((a) => a.reason === 'same_room');
  const similar = alternatives.filter((a) => a.reason === 'similar_room');
  return (
    <View>
      <Text variant="titleMedium" style={{ marginTop: 12 }}>💡 Try these instead</Text>
      {same.length > 0 && <List.Subheader>Same room, other times</List.Subheader>}
      {same.map((a) => (
        <List.Item key={`s${a.startMin}`} title={`${a.roomName} · ${formatRange(a.startMin, a.endMin)}`} description={formatDate(a.date, true)}
          left={(p) => <List.Icon {...p} icon="clock-outline" />} right={(p) => <List.Icon {...p} icon="chevron-right" />} onPress={() => open(a)} />
      ))}
      {similar.length > 0 && <List.Subheader>Similar rooms, same time</List.Subheader>}
      {similar.map((a) => (
        <List.Item key={`r${a.roomId}`} title={a.roomName} description={`${formatDate(a.date, true)} · ${formatRange(a.startMin, a.endMin)}`}
          left={(p) => <List.Icon {...p} icon="door-open" />} right={(p) => <List.Icon {...p} icon="chevron-right" />} onPress={() => open(a)} />
      ))}
    </View>
  );
}
