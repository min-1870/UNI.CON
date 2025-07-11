import React, {
  createContext,
  useCallback,
  useContext,
  useState,
  ReactNode,
  useRef,
  useEffect,
} from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  Animated,
  Easing,
} from 'react-native';
import ThemedCard from '@/components/ThemedCard';
import ThemedText from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Octicons } from '@expo/vector-icons';

export interface ToastOptions {
  text1: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  position?: { top?: number };
}

interface ToastContextValue {
  showToast: (opts: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });
export const useToast = () => useContext(ToastContext);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastOptions[]>([]);

  const showToast = useCallback((opts: ToastOptions) => {
    setToasts(curr => [...curr, { duration: 3000, position: { top: 50 }, ...opts }]);
  }, []);

  const removeToast = useCallback((i: number) => {
    setToasts(curr => curr.filter((_, idx) => idx !== i));
  }, []);

  // pick your brand & error colors from theme
  const brand = useThemeColor({}, 'UNICON_CONTENT');
  const error = useThemeColor({}, 'ERROR_TEXT');

  // A little component that handles its own slide-in / slide-out animation
  const ToastItem: React.FC<{ toast: ToastOptions; index: number }> = ({ toast, index }) => {
    const translateY = useRef(new Animated.Value(-100)).current;

    useEffect(() => {
      // slide in
      Animated.timing(translateY, {
        toValue: toast.position?.top ?? 50,
        duration: 150,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();

      // schedule slide out + removal
      const timer = setTimeout(() => {
        Animated.timing(translateY, {
          toValue: -200,
          duration: 100,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }).start(() => removeToast(index));
      }, toast.duration);

      return () => clearTimeout(timer);
    }, []);

    const style = StyleSheet.create({
      backdrop: { flex: 1, backgroundColor: 'transparent' },
      // no longer absolute-position on top; we'll translate it instead
      wrapper: {
        position: 'absolute',
        left: 0,
        right: 0,
      },
      card: {
        alignSelf: 'center',
        minWidth: 300,
        borderRadius: 50,
        borderTopLeftRadius: 50,
        borderTopRightRadius: 50,
        padding: 15,
        paddingHorizontal: 25,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
      },
      textWrapper: {
        flex: 1,
        alignItems: 'flex-start',
      },
          text: { textAlign: 'center'},
    });

    return (
      <Modal transparent visible key={index}>
        <TouchableWithoutFeedback onPress={() => removeToast(index)}>
          <View style={style.backdrop} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            style.wrapper,
            { transform: [{ translateY }] },
          ]}
        >
          <ThemedCard style={style.card}>
            {toast.type === 'error' ? (
              <Octicons name="x" size={24} color={error} />
            ) : toast.type === 'info' ? (
              <Octicons name="info" size={24} color={brand} />
            ) : toast.type === 'warning' ? (
              <Octicons name="bug" size={24} color={brand} />
            ) : (
              <Octicons name="check" size={24} color={brand} />
            )}
            <View style={style.textWrapper}>
              <ThemedText font='textBold' size='bigger' style={style.text}>{
                toast.type === 'warning' ? 'Warning' :
                toast.type === 'error' ? 'Error' :
                toast.type === 'info' ? 'Info' :
                toast.type === 'success' ? 'Success' : ''
              }</ThemedText>
              <ThemedText size='smaller' color='gray'>
                {toast.text1.length > 50 ? toast.text1.slice(0, 50) + '…' : toast.text1}
              </ThemedText>
            </View>
          </ThemedCard>
        </Animated.View>
      </Modal>
    );
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.map((t, i) => (
        <ToastItem key={i} toast={t} index={i} />
      ))}
    </ToastContext.Provider>
  );
};
