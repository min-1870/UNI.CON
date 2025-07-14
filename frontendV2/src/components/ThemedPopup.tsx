import React from 'react';
import ThemedCard from './ThemedCard';
import ThemedText from './ThemedText';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  GestureResponderEvent
} from 'react-native';

interface ThemedPopupProps {
  visible: boolean;
  title?: string;
  message: string;
  onConfirm: (event: GestureResponderEvent) => void;
  onCancel: (event: GestureResponderEvent) => void;
}

const ThemedPopup: React.FC<ThemedPopupProps> = ({
  visible,
  title = 'Confirm',
  message,
  onConfirm,
  onCancel,
}) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onCancel}
  >
    <View style={styles.backdrop}>
      <ThemedCard style={styles.container}>
        <ThemedText size='h3' font='textBold'>{title}</ThemedText>
        <ThemedText >{message}</ThemedText>
        <View style={styles.buttonRow}>
          <Pressable style={styles.button} onPress={onCancel}>
            <ThemedText font='textBold' >Cancel</ThemedText>
          </Pressable>
          <Pressable style={styles.button} onPress={onConfirm}>
            <ThemedText font='textBold' >OK</ThemedText>
          </Pressable>
        </View>
      </ThemedCard>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: 280,
    padding: 20,
    gap: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  button: {
    marginLeft: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
});

export default ThemedPopup;
