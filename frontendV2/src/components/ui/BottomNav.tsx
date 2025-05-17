import React, { useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { Home, ShoppingCart, Search, User } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

interface BottomNavProps {
  isVisible: boolean;
}

const { width } = Dimensions.get('window');

const BottomNav = ({ isVisible }: BottomNavProps) => {
  const navigation = useNavigation();
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: isVisible ? 0 : 100,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isVisible]);

  const handleNavigate = (target: string) => {
    navigation.navigate(target as never);
  };

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
      <View style={styles.navBar}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => handleNavigate('Feed')}
        >
          <Home size={24} color="#999" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => handleNavigate('Shop')}
        >
          <ShoppingCart size={24} color="#999" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => handleNavigate('Search')}
        >
          <Search size={24} color="#999" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => handleNavigate('Profile')}
        >
          <User size={24} color="#999" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 15,
    left: 20,
    right: 20,
    zIndex: 999,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  navButton: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default BottomNav;