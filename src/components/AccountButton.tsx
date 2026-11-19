// Header button showing the user's initials. Tapping it opens the
// "Log out?" dialog (which shows who's signed in) to log out / switch account.
import { useState } from 'react';
import { Pressable } from 'react-native';
import { Avatar } from 'react-native-paper';
import { useAuth } from '../hooks/useAuth';
import { LogoutDialog } from './LogoutDialog';

export function AccountButton() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  if (!user) return null;

  const initials = user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <>
      <Pressable onPress={() => setOpen(true)} accessibilityLabel="Log out or switch account" hitSlop={8} style={{ marginRight: 12 }}>
        <Avatar.Text size={34} label={initials} />
      </Pressable>
      <LogoutDialog visible={open} onDismiss={() => setOpen(false)} />
    </>
  );
}
