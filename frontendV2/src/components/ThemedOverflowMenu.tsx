import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
} from 'react-native';
import ThemedCard from '@/components/ThemedCard';
import ThemedText from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
type Option = {
  label: string;
  onPress: () => void;
};

interface OverflowMenuProps {
  visible: boolean;
  onDismiss: () => void;
  options: Option[];
  // approximate screen‐coords for the menu; you can tweak these
  position?: { top: number; right: number };
}

const OverflowMenu: React.FC<OverflowMenuProps> = ({
        visible,
        onDismiss,
        options,
        position = { top: 10, right: 10 },
    }) => {
    
    const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    menu: {
        position: 'absolute',
        borderRadius: 20,
    },
    item: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    });
    
    return (
        <Modal
        transparent
        visible={visible}
        animationType="fade"
        onRequestClose={onDismiss}
        >
        {/* catch taps outside menu to dismiss */}
        <TouchableWithoutFeedback onPress={onDismiss}>
            <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <ThemedCard style={[styles.menu, { top: position.top, right: position.right }]}>
            {options.map((opt, i) => (
            <TouchableOpacity
                key={i}
                style={styles.item}
                onPress={() => {
                opt.onPress();
                onDismiss();
                }}
            >
                <ThemedText>{opt.label}</ThemedText>
            </TouchableOpacity>
            ))}
        </ThemedCard>
        </Modal>
    );
    };


export default OverflowMenu;