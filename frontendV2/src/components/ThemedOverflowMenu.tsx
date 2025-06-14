import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
} from 'react-native';
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

    const background_color = useThemeColor({}, 'default_card_background_color');
    
    const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    menu: {
        position: 'absolute',
        backgroundColor: background_color,
        borderRadius: 20,

        shadowColor: 'rgba(0, 0, 0, 1)',
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 13,
        shadowOpacity: 0.08,
        backdropFilter: 'blur(10px)', // For web platforms
        elevation: 10, // For Android shadow
    },
    item: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    label: {
        fontSize: 16,
        color: '#333',
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

        <View style={[styles.menu, { top: position.top, right: position.right }]}>
            {options.map((opt, i) => (
            <TouchableOpacity
                key={i}
                style={styles.item}
                onPress={() => {
                opt.onPress();
                onDismiss();
                }}
            >
                <Text style={styles.label}>{opt.label}</Text>
            </TouchableOpacity>
            ))}
        </View>
        </Modal>
    );
    };


export default OverflowMenu;