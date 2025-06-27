import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { BlurView } from 'expo-blur';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';

interface BottomNavProps {
  // No props needed anymore since all navigation is via routes
}

const BottomNav: React.FC<BottomNavProps> = () => {
  const pathname = usePathname();
  const colorScheme = useColorScheme();
  const brandColor = useThemeColor({}, 'default_brand_color');
  const cardBackground = useThemeColor({}, 'default_card_background_color');
  const placeholderColor = useThemeColor({}, 'default_placeholder_color');

  // Define navbar sequence for relative animations
  const navSequence = ['/', '/search', '/post', '/marketplace', '/profile'];
  
  const navItems = [
    { 
      icon: 'home-outline' as const, 
      activeIcon: 'home' as const, 
      label: 'Home', 
      path: '/' as const 
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
      path: '/post' as const 
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

  const getRouteWithAnimation = (targetPath: string, currentPath: string) => {
    const currentIndex = navSequence.indexOf(currentPath);
    const targetIndex = navSequence.indexOf(targetPath);
    
    // Determine animation direction
    if (currentIndex !== -1 && targetIndex !== -1) {
      if (targetIndex < currentIndex) {
        // Moving left - need slide from left animation
        return targetPath + '?anim=left';
      } else if (targetIndex > currentIndex) {
        // Moving right - need slide from right animation  
        return targetPath + '?anim=right';
      }
    }
    
    // Special case for post - always from bottom
    if (targetPath === '/post') {
      return targetPath + '?anim=bottom';
    }
    
    return targetPath;
  };

  const handleNavClick = (item: typeof navItems[0]) => {
    console.log('Navigation clicked:', item.label, 'to path:', item.path, 'from:', pathname);
    if (item.path) {
      const currentIndex = navSequence.indexOf(pathname);
      const targetIndex = navSequence.indexOf(item.path);
      
      console.log(`🧭 Navigation: ${pathname} (${currentIndex}) → ${item.path} (${targetIndex})`);
      
      // Add visual feedback for debugging
      console.log(`📍 Current: ${pathname} at navbar position ${currentIndex}`);
      console.log(`🎯 Target: ${item.path} at navbar position ${targetIndex}`);
      
      // Special handling for post - always slide from bottom
      if (item.path === '/post') {
        console.log('🎬 Animation: slide from BOTTOM (new screen comes from bottom)');
        router.replace({
          pathname: item.path,
          params: { animDirection: 'bottom' }
        });
        return; // Exit early for post
      }
      
      // For relative animations, we'll use a custom navigation approach
      if (currentIndex !== -1 && targetIndex !== -1) {
        if (targetIndex < currentIndex) {
          // Moving left in navbar (e.g., Profile → Home)
          // New screen should slide FROM the left
          console.log('🎬 Animation: slide from LEFT (new screen comes from left side)');
          router.replace({
            pathname: item.path,
            params: { animDirection: 'left' }
          });
        } else if (targetIndex > currentIndex) {
          // Moving right in navbar (e.g., Home → Search)  
          // New screen should slide FROM the right
          console.log('🎬 Animation: slide from RIGHT (new screen comes from right side)');
          router.replace({
            pathname: item.path, 
            params: { animDirection: 'right' }
          });
        } else {
          // Same position
          router.replace(item.path);
        }
      } else {
        // Default navigation
        router.replace(item.path);
      }
    }
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
      backgroundColor: Platform.OS === 'ios' 
        ? (colorScheme === 'dark' ? 'rgba(25, 25, 25, 0.2)' : 'rgba(255, 255, 255, 0.1)')
        : (colorScheme === 'dark' ? 'rgba(25, 25, 25, 0.95)' : 'rgba(255, 255, 255, 0.95)'),
      shadowColor: colorScheme === 'dark' ? '#000' : '#000',
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: colorScheme === 'dark' ? 0.4 : 0.2,
      shadowRadius: 35,
      elevation: 25,
      borderWidth: 0.5,
      borderColor: colorScheme === 'dark' 
        ? 'rgba(255, 255, 255, 0.1)'
        : 'rgba(255, 255, 255, 0.5)',
    },
    glassOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colorScheme === 'dark' 
        ? 'rgba(25, 25, 25, 0.6)'
        : 'rgba(255, 255, 255, 0.4)',
      borderRadius: 35,
    },
    navContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 20,
      backgroundColor: 'transparent',
      zIndex: 1,
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
      backgroundColor: colorScheme === 'dark' 
        ? 'rgba(74, 222, 128, 0.2)' 
        : '#E7FEE7',
      transform: [{ scale: 1.1 }],
      shadowColor: brandColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
  });

  return (
    <View style={styles.container}>
      <BlurView intensity={80} tint={colorScheme === 'dark' ? 'dark' : 'light'} style={styles.blurContainer}>
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
                  color={isActive ? brandColor : placeholderColor} 
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
};

export default BottomNav;