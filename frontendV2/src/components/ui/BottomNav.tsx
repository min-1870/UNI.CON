import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { BlurView } from 'expo-blur';

interface BottomNavProps {
  onSearchClick?: () => void;
  onAddClick?: () => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ onSearchClick, onAddClick }) => {
  const pathname = usePathname();

  const navItems = [
    { 
      icon: 'home-outline' as const, 
      activeIcon: 'home' as const, 
      label: 'Home', 
      path: '/feed' as const 
    },
    { 
      icon: 'search-outline' as const, 
      activeIcon: 'search' as const, 
      label: 'Search', 
      action: onSearchClick 
    },
    { 
      icon: 'add-circle-outline' as const, 
      activeIcon: 'add-circle' as const, 
      label: 'Add', 
      action: onAddClick 
    },
    { 
      icon: 'chatbubble-outline' as const, 
      activeIcon: 'chatbubble' as const, 
      label: 'Chat', 
      path: '/chat' as const 
    },
    { 
      icon: 'person-outline' as const, 
      activeIcon: 'person' as const, 
      label: 'Profile', 
      path: '/profile' as const 
    },
  ];

  const handleNavClick = (item: typeof navItems[0]) => {
    if (item.action) {
      item.action();
    } else if (item.path) {
      router.push(item.path as any);
    }
  };

  return (
    <View style={styles.container}>
      <BlurView intensity={100} tint="light" style={styles.blurContainer}>
        <View style={styles.navContainer}>
          {navItems.map((item, index) => {
            const isActive = item.path && pathname === item.path;
            
            return (
              <TouchableOpacity
                key={index}
                onPress={() => handleNavClick(item)}
                style={[
                  styles.navItem,
                  isActive && styles.navItemActive
                ]}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={isActive ? item.activeIcon : item.icon} 
                  size={26} 
                  color={isActive ? '#007AFF' : '#8E8E93'} 
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 34,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  blurContainer: {
    borderRadius: 35,
    overflow: 'hidden',
    backgroundColor: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 10,
  },
  navContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: Platform.OS === 'ios' ? 'transparent' : 'rgba(255, 255, 255, 0.95)',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'transparent',
  },
  navItemActive: {
    backgroundColor: Platform.OS === 'ios' ? 'rgba(0, 122, 255, 0.1)' : 'rgba(0, 122, 255, 0.15)',
    transform: [{ scale: 1.1 }],
  },
});

export default BottomNav;