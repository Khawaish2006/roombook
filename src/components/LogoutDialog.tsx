// Confirm dialog used anywhere a user can log out / switch account.
import { router } from 'expo-router';
import { Button, Dialog, Portal, Text } from 'react-native-paper';
import { useAuth } from '../hooks/useAuth';

export function LogoutDialog({ visible, onDismiss }: { visible: boolean; onDismiss: () => void }) {
  const { user, logout } = useAuth();

  const doLogout = async () => {
    onDismiss();
    await logout();
    router.replace('/login');
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>Log out?</Dialog.Title>
        <Dialog.Content>
          <Text>
            You're signed in as {user?.email}. Log out to sign in with a different account.
          </Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancel</Button>
          <Button onPress={doLogout}>Log out</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
