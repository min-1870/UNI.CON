import React, { useState } from 'react';
import { View, Pressable, FlatList, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import ThemedText from '@/components/ThemedText';
import ThemedCard from '@/components/ThemedCard';
import { useThemeColor } from '@/hooks/useThemeColor';
import Octicons from '@expo/vector-icons/Octicons';

export interface Option {
  label: string;
  value: string;
}

interface InlineDropdownProps {
  options: Option[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  style?: ViewStyle;
}


export const ThemedDropdown: React.FC<InlineDropdownProps> = ({
  options,
  selectedValue,
  onValueChange,
  placeholder = 'Select…',
  style,
}) => {
  const [open, setOpen] = useState(false);
  const selectedLabel =
    options.find((o) => o.value === selectedValue)?.label ?? placeholder;
  const width = style?.width || 100; // Default width if not provided
  
  const styles = StyleSheet.create({
    wrapper: {
      width: width,
    },
    selector: {
      width: width,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 0,
    },
    dropdown: {
      marginTop: 8,
      position: 'absolute', 
      width: width,
      top: '100%',
      padding: 0,
    },
    list: {
      width: '100%',
      overflow: 'hidden', 
      zIndex: 1000,
    },
    listContainer: {
      paddingVertical: 4,
    },
    item: {
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
  });

  return (
    <View> 
      <Pressable
        onPress={() => setOpen((prev) => !prev)}
      >
        <ThemedCard type='defaultViewed' shadow={false} style={styles.selector}>
        <ThemedText>{selectedLabel}</ThemedText>
        <Octicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={useThemeColor({}, 'DEFAULT_TEXT')}
          style={{ marginLeft: 8 }}
        />
        </ThemedCard>
      </Pressable>

      {open && (
          <ThemedCard type='defaultViewed' style={styles.dropdown}>
          <FlatList
            data={options}
            keyExtractor={(item) => item.value}
            style={styles.list}
            contentContainerStyle={styles.listContainer}
            renderItem={({ item }) => (
              <Pressable
                style={styles.item}
                onPress={() => {
                  onValueChange(item.value);
                  setOpen(false);
                }}
              >
                <ThemedText>{item.label}</ThemedText>
              </Pressable>
            )}
          />
        </ThemedCard>
      )}
    </View>
  );
};
