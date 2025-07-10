// /**
//  * Learn more about light and dark modes:
//  * https://docs.expo.dev/guides/color-schemes/
//  */

// import { getData } from '@/components/Utils';
// import { Colors } from '@/constants/Colors';
// import { useColorScheme } from '@/hooks/useColorScheme';
// import { useEffect, useState } from 'react';

// export function useThemeColor(
//   props: { light?: string; dark?: string },
//   colorName: keyof typeof Colors.light & keyof typeof Colors.dark
// ) {
//   // const theme = useColorScheme() ?? 'light';
//   const [themed, setThemed] = useState<'light' | 'dark'>('light');
//   useEffect(() => {
//     const loadTheme = async () => {
//       const theme = await getData('theme') === 'dark' ? 'dark' : 'light';
//       setThemed(typeof theme === 'string' ? theme : 'light');
//       // setThemed('dark');
//     };
//     loadTheme();
//   }, []);
//   const theme = themed;
//   const colorFromProps = props[themed as 'light' | 'dark'];

//   if (colorFromProps) {
//     return colorFromProps;
//   } else {
//     return Colors[theme][colorName];
//   }
// }
// hooks/useThemeColor.ts
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/theme/ThemeContext';

export function useThemeColor<
  K extends keyof typeof Colors.light & keyof typeof Colors.dark
>(props: { light?: string; dark?: string }, colorName: K) {
  const { mode, system } = useTheme();
  // decide whether we're in light or dark right now:
  const theme = mode === 'auto' ? system : mode;
  // if a prop override was provided, use it; otherwise pull from your Colors file
  return props[theme] ?? Colors[theme][colorName];
}
