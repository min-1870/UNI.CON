import { useThemeColor } from '@/hooks/useThemeColor';
import { Pressable, Text, StyleSheet, type ButtonProps } from 'react-native';
import { ReactNode } from 'react';

type ThemedButtonProps = Omit<ButtonProps, 'title'> & {
  type?: 
  | 'auth' 
  | 'feedChecked' 
  | 'feedUnchecked' 
  | 'toggled' 
  | 'unToggled' 
  | 'elevatedToggled' 
  | 'elevatedUnToggled';
  children: ReactNode;
};

export default function ThemedButton({
  children,
  disabled = false,
  type ='auth',
  ...rest
}: ThemedButtonProps) {
    const DEFAULT_TOGGLED_COLOR = useThemeColor({}, 'UNICON_BACKGROUND');
    const DEFAULT_UNTOGGLED_COLOR = useThemeColor({}, 'DEFAULT_CARD_BACKGROUND');

  const styles = type === 'auth'
    ? StyleSheet.create({
        button: {
          padding: 12,
          borderRadius: 20,
          width: '100%',
          backgroundColor: DEFAULT_TOGGLED_COLOR,
          alignItems: 'center',
          justifyContent: 'center',
        },
      })
    : type === 'feedChecked'
    ? StyleSheet.create({
        button: {
          paddingHorizontal: 12,
          paddingVertical: 5,
          borderRadius: 50,
          backgroundColor: DEFAULT_TOGGLED_COLOR,
          alignItems: 'center',
          justifyContent: 'center',
        },
      })
    : type === 'feedUnchecked'
    ? StyleSheet.create({
        button: {
          paddingHorizontal: 12,
          paddingVertical: 5,
          borderRadius: 50,
          backgroundColor: DEFAULT_UNTOGGLED_COLOR,
          alignItems: 'center',
          justifyContent: 'center',
        },
      })
    : type === 'toggled'
    ? StyleSheet.create({
        button: {
          paddingHorizontal: 20,
          paddingVertical: 10,
          borderRadius: 50,
          backgroundColor: DEFAULT_TOGGLED_COLOR,
          alignItems: 'center',
          justifyContent: 'center',
        },
      })
    : type === 'elevatedToggled'
    ? StyleSheet.create({
        button: {
          paddingHorizontal: 20,
          paddingVertical: 10,
          borderRadius: 50,
          backgroundColor: DEFAULT_TOGGLED_COLOR,
          alignItems: 'center',
          justifyContent: 'center',
      
      
          boxShadow: '0px 3px 13px rgba(0, 0, 0, 0.08)',
          backdropFilter: 'blur(10px)', // For web platforms
          elevation: 10, // For Android shadow
        },
      })
    : type === 'unToggled'
    ? StyleSheet.create({
        button: {
          paddingHorizontal: 15,
          paddingVertical: 5,
          borderRadius: 50,
          borderWidth: 5,
          borderColor: DEFAULT_TOGGLED_COLOR,
          backgroundColor: DEFAULT_UNTOGGLED_COLOR,
          alignItems: 'center',
          justifyContent: 'center',
        },
      })
    : type === 'elevatedUnToggled'
    ? StyleSheet.create({
        button: {
          paddingHorizontal: 15,
          paddingVertical: 5,
          borderRadius: 50,
          borderWidth: 5,
          borderColor: DEFAULT_TOGGLED_COLOR,
          backgroundColor: DEFAULT_UNTOGGLED_COLOR,
          alignItems: 'center',
          justifyContent: 'center',
      
      
          boxShadow: '0px 3px 13px rgba(0, 0, 0, 0.08)',
          backdropFilter: 'blur(10px)', // For web platforms
          elevation: 10, // For Android shadow
        },
      })
    : StyleSheet.create({
        button: {
          paddingHorizontal: 15,
          paddingVertical: 5,
          borderRadius: 50,
          borderWidth: 5,
          borderColor: DEFAULT_TOGGLED_COLOR,
          alignItems: 'center',
          justifyContent: 'center',
        },
      });
  return (
    <Pressable
      style={({ pressed }) => [styles.button,
        { 
          opacity: (pressed || disabled) ? 0.5 : 1,
        }
      ]}
      {...rest}
    >
        {children}
    </Pressable>
  );
}