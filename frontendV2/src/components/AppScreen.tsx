import React from 'react';
import { View, StyleSheet, StatusBar, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MobileContainer from './MobileContainer';

interface AppScreenProps {
  children: React.ReactNode;
  style?: any;
}

const AppScreen: React.FC<AppScreenProps> = ({ children, style }) => {
  const insets = useSafeAreaInsets();

  return (
    <MobileContainer>
      <View
        style={[
          styles.container,
          {
            paddingTop: Platform.OS === 'ios' ? insets.top : StatusBar.currentHeight,
            paddingBottom: insets.bottom,
            paddingLeft: insets.left,
            paddingRight: insets.right,
          },
          style,
        ]}
      >
        {children}
      </View>
    </MobileContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default AppScreen; 