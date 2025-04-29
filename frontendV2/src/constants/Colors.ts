/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const brand_color = '#57EC6B'
const card_color =  '#f7f7f7'

const custom_colors = {
    text: '#11181C',
    background: '#f8f9f7',
    tint: '#0a7ea4',
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: '#0a7ea4',

    errorText: '#e6566c',

    ThemedButtonBackground: brand_color,
    ThemedButtonBorder: '#d3d6d9',
    ThemedButtonText: '#000000',

    authTextInputBackground: '#f2f2f2',
    authTextInputPlaceholder: '#9b9797',
    authTextInputText: '#000000',

    articleBackground: card_color,
    articleName: '#000000',
    articleTime: '#a2a9b2',
    articlePoints: brand_color,
    articleTitle: '#000000',
    articleBody: '#000000',
    articleButton: '#858b98',

    postBackground: card_color,
    postPlaceHolder: '#a8a4a4',

    commentBackground: '#ffffff',
    commentName: '#000000',
    commentTime: '#a2a9b2',
    commentBody: '#000000',
    commentButton: '#858b98',
  };
  
export const Colors = {
  light: custom_colors,
  dark: custom_colors
  // dark: {
  //   text: '#ECEDEE',
  //   background: '#151718',
  //   tint: tintColorDark,
  //   icon: '#9BA1A6',
  //   tabIconDefault: '#9BA1A6',
  //   tabIconSelected: tintColorDark,
  // },
};
