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
  backgroundColor?: 'defaultGray' | 'default' | 'defaultViewed';
  size?: 'smaller' | 'default' | 'bigger' | 'h1' | 'h2' | 'h3';
  font?: 'textRegular' | 'textMedium' | 'textSemibold' | 'textBold' | 'displayBold';
  editable?: boolean; // Optional prop to make the dropdown editable
}


export const ThemedDropdown: React.FC<InlineDropdownProps> = ({
  options,
  selectedValue,
  onValueChange,
  placeholder = 'Select…',
  backgroundColor = 'defaultGray',
  size = 'default',
  font = 'textRegular',
  editable = true,
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
      padding: 12,
      paddingHorizontal: 20,
      marginHorizontal: 0,
    },
    dropdown: {
      marginTop: 8,
      position: 'absolute', 
      width: width,
      top: '100%',
      padding: 0,
      marginHorizontal: 0,
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
      paddingVertical: 8,
      paddingHorizontal: 16,
    },
  });

  return (
    <View> 
      <Pressable
        onPress={() => setOpen((prev) => !prev)}
      >
        <ThemedCard type={backgroundColor} shadow={false} style={styles.selector}>
        <View style={{ flex:1, alignItems: 'center', justifyContent: 'center' }}>
          <ThemedText size={size} font={font} >{selectedLabel}</ThemedText>
        </View>
        <Octicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={useThemeColor({}, 'DEFAULT_TEXT')}
          style={{ marginLeft: 8 }}
        />
        </ThemedCard>
      </Pressable>

      {open && (
          <ThemedCard type={backgroundColor} style={styles.dropdown}>
          <FlatList
            data={options}
            keyExtractor={(item) => item.value}
            style={styles.list}
            contentContainerStyle={styles.listContainer}
            renderItem={({ item }) => (
              <Pressable
                style={styles.item}
                onPress={() => {
                  if (!editable) return;
                  onValueChange(item.value);
                  setOpen(false);
                }}
              >
                {item.value === selectedValue ? (
                  <ThemedText size={size} font={font} color='brand'>{item.label}</ThemedText>
                )
                : (
                  <ThemedText size={size} font={font} color={editable ? 'default' : 'gray'}>{item.label}</ThemedText>
                )}
                
              </Pressable>
            )}
          />
        </ThemedCard>
      )}
    </View>
  );
};
