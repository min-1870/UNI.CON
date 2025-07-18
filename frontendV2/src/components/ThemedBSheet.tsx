import React, { ReactNode, useEffect, useRef, useState } from 'react';
import {
  Modal,
  Animated,
  TouchableWithoutFeedback,
  StyleSheet,
  Dimensions,
  Easing,
  Pressable,
} from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import ThemedCard from './ThemedCard';
import { Octicons } from '@expo/vector-icons';

export interface ThemedBottomSheetProps {
    children: ReactNode;
    visible: boolean;
    onDismiss: () => void;
    height?: number;
}

const { height: WINDOW_HEIGHT } = Dimensions.get('window');

export default function ThemedBSheet({
    children,
    visible,
    onDismiss,
    height = WINDOW_HEIGHT * 0.5,
}: ThemedBottomSheetProps) {
    const DEFAULT_BACKGROUND = useThemeColor({}, 'DEFAULT_BACKGROUND') + '80';
    const DEFAULT_TEXT = useThemeColor({}, 'DEFAULT_TEXT');
    const DEFAULT_GRAY_TEXT = useThemeColor({}, 'DEFAULT_GRAY_TEXT');

    const [showModal, setShowModal] = useState(visible);

    const translateY = useRef(new Animated.Value(height)).current;
    const backdropOpacity = useRef(new Animated.Value(0)).current;

    
    const maxContentWidth = 500;
    const { width: windowWidth } = Dimensions.get('window');
    const horizontalOffset = windowWidth > maxContentWidth ? (windowWidth - maxContentWidth) / 2 : 0;
    const width = windowWidth > maxContentWidth ? maxContentWidth : windowWidth;

    const openDuration = 300;
    const closeDuration = 150;

    useEffect(() => {
        if (visible) {
        setShowModal(true);
        Animated.parallel([
            Animated.timing(backdropOpacity, {
            toValue: 1,
            duration: openDuration / 2,
            easing: Easing.linear,
            useNativeDriver: true,
            }),
            Animated.timing(translateY, {
            toValue: 0,
            duration: openDuration,
            easing: Easing.out(Easing.poly(4)),
            useNativeDriver: true,
            }),
        ]).start();
        } else if (showModal) {
        Animated.parallel([
            Animated.timing(backdropOpacity, {
            toValue: 0,
            duration: closeDuration / 2,
            easing: Easing.linear,
            useNativeDriver: true,
            }),
            Animated.timing(translateY, {
            toValue: height,
            duration: closeDuration,
            easing: Easing.in(Easing.poly(4)),
            useNativeDriver: true,
            }),
        ]).start(({ finished }) => {
            if (finished) setShowModal(false);
        });
        }
    }, [visible]);

    return (
        <Modal
        visible={showModal}
        transparent
        animationType="none"
        onRequestClose={onDismiss}
        >
        <TouchableWithoutFeedback onPress={onDismiss}>
            <Animated.View
            style={[
                styles.backdrop,
                { 
                    backgroundColor: DEFAULT_BACKGROUND,
                    opacity: backdropOpacity,
                    left: horizontalOffset,
                    width: width,
                },
            ]}
            />
        </TouchableWithoutFeedback>

        <Animated.View
            style={[
            styles.sheet,
            {
                height,
                transform: [{ translateY }],
                left: horizontalOffset,
                width: width,
            },
            ]}
        >
            <ThemedCard style={styles.card} >
                <Pressable onPress={onDismiss}>
                    <Octicons style={styles.button} name="chevron-down" size={15} color={DEFAULT_GRAY_TEXT} />
                </Pressable>
                
                {children}
            </ThemedCard>
        </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    sheet: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        overflow: 'hidden',
    },
    card: {
        flex: 1,
        marginHorizontal: 0,
        marginBottom: 0,
        borderRadius: 0,
    },
    button: {
        alignSelf:'center',
        marginBottom: 10,
    }
});
