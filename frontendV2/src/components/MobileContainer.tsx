import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';

interface MobileContainerProps {
  children: React.ReactNode;
}

const MobileContainer: React.FC<MobileContainerProps> = ({ children }) => {
  const { width: windowWidth } = useWindowDimensions();
  const maxWidth = 480; // Standard mobile width

  return (
    <View style={[styles.container, { backgroundColor: windowWidth > maxWidth ? '#f3f4f6' : '#fff' }]}>
      <View style={[styles.content, { maxWidth }]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    width: '100%',
    backgroundColor: '#fff',
  },
});

export default MobileContainer; 