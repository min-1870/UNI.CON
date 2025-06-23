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
      path: '/search' as const 
    },
    { 
      icon: 'add-circle-outline' as const, 
      activeIcon: 'add-circle' as const, 
      label: 'Add', 
      action: onAddClick 
    },
    { 
      icon: 'storefront-outline' as const, 
      activeIcon: 'storefront' as const, 
      label: 'Marketplace', 
      path: '/marketplace' as const 
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
      <BlurView intensity={80} tint="light" style={styles.blurContainer}>
        {/* Glass effect overlay */}
        <View style={styles.glassOverlay} />
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
                  color={isActive ? '#57EC6A' : '#666'} 
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
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 35,
    elevation: 25,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  glassOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 35,
  },
  navContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: 'transparent', // Always transparent to show glass effect
    zIndex: 1, // Above the glass overlay
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'transparent',
  },
  navItemActive: {
    backgroundColor: '#E7FEE7',
    transform: [{ scale: 1.1 }],
    shadowColor: '#E7FEE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});

export default BottomNav;