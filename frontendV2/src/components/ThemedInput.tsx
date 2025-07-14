import { useThemeColor } from '@/hooks/useThemeColor';
import { Platform, TextStyle, TextInput, StyleSheet, type TextInputProps, TouchableOpacity, View } from 'react-native';
import React, { useState, useEffect } from 'react';
import { Octicons } from '@expo/vector-icons';

type ThemedInputProps = TextInputProps & {
  type?: 'auth' | 'comment' | 'search' | 'validation';
  inputRef?: React.Ref<TextInput>;
};

export default function ThemedInput({
  type,
  inputRef,
  ...rest
}: ThemedInputProps) {
    const DEFAULT_GRAY_BACKGROUND = useThemeColor({}, 'DEFAULT_GRAY_BACKGROUND');
    const DEFAULT_GRAY_TEXT = useThemeColor({}, 'DEFAULT_GRAY_TEXT');
    const DEFAULT_TEXT = useThemeColor({}, 'DEFAULT_TEXT');
    const DEFAULT_CARD_BACKGROUND = useThemeColor({}, 'DEFAULT_CARD_BACKGROUND');
    const [visible, setVisible] = useState(true);

    const default_style = {
      ...(Platform.OS === 'web'
        ? ({ outlineStyle: 'none' } as TextStyle)
        : {}),
    };
    const styles = type === 'auth'
      ? StyleSheet.create({
          style: {
            padding: 12,
            paddingHorizontal: 20,
            backgroundColor: DEFAULT_GRAY_BACKGROUND,
            borderRadius: 50,
            alignItems: 'center',
            justifyContent: 'center',
            color: DEFAULT_TEXT, 
            width: '100%',
          },
        })
      : type === 'validation'
      ? StyleSheet.create({
          style: {
            borderRadius: 10,
            height: 48,
            width: 48,
            fontSize: 24,
            backgroundColor: DEFAULT_GRAY_BACKGROUND,
            textAlign: 'center',
            color: DEFAULT_TEXT, 
          },
        })
      : type === 'comment'
      ? StyleSheet.create({
          style: {
            padding: 3,
            paddingHorizontal: 15,
            backgroundColor: DEFAULT_GRAY_BACKGROUND,
            borderRadius: 50,
            alignItems: 'center',
            justifyContent: 'center',
            color: DEFAULT_TEXT, 
            width: '100%',
            height: '100%',
          },
        })
      : type === 'search'
      ? StyleSheet.create({
          style: {
            paddingHorizontal: 30,
            paddingVertical: 18,
            backgroundColor: DEFAULT_CARD_BACKGROUND,
            borderRadius: 50,
            alignItems: 'center',
            justifyContent: 'center',
            color: DEFAULT_TEXT, 
            width: '100%',
            
            boxShadow: '0px 3px 13px rgba(0, 0, 0, 0.08)',
            backdropFilter: 'blur(10px)', // For web platforms
            elevation: 10, // For Android shadow
          },
        })
      : StyleSheet.create({
          style: {
            padding: 12,
            paddingHorizontal: 20,
            backgroundColor: DEFAULT_GRAY_BACKGROUND,
            borderRadius: 50,
            alignItems: 'center',
            justifyContent: 'center',
            color: DEFAULT_TEXT, 
            width: '100%',
          },
   });
      

  return (
    <View style={type === 'auth' ? { position: 'relative', width: '100%' } : {flex: 1, height: '100%'}}>
      <TextInput
        style={[default_style, styles.style, rest.style]}
        {...rest}
        placeholderTextColor={DEFAULT_GRAY_TEXT}
        ref={inputRef} 
        secureTextEntry={type === 'auth' ? visible : false}
        placeholder={
          rest.placeholder !== undefined
            ? rest.placeholder
            : type === 'auth'
            ? "Enter your password"
            : type === 'search'
            ? 'Search...'
            : type === 'comment'
            ? 'Add a comment...'
            : ''
        }
      />
      {type === 'auth' && (
        <TouchableOpacity
          style={{
            position: 'absolute',
            right: 15,
            top: 12,
            zIndex: 1000
          }}
          onPress={() => setVisible(!visible)}
        >
          <Octicons name={!visible ? 'eye-closed' : 'eye'} size={20} color={DEFAULT_GRAY_TEXT} />
        </TouchableOpacity>
      )}
    </View>
  );
}
