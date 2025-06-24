/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const light_colors = {
  default_brand_color: '#81ef90',
  default_card_background_color: '#f7f7f7',
  default_text_color: '#11181C',
  default_background_color: '#f8f9f7',
  default_placeholder_color: '#a2a9b2',
  default_input_background_color: '#f2f2f2',
  default_error_color: '#f92665',
  default_tag_background_color: '#e4e6e8'
};

const dark_colors = {
  default_brand_color: '#4ade80', // Green accent for primary actions
  default_card_background_color: '#191919', // Dark Slate Gray for cards and modals
  default_text_color: 'rgba(255, 255, 255, 0.95)', // 95% white for primary text
  default_background_color: '#121212', // Charcoal Gray for main background
  default_placeholder_color: 'rgba(255, 255, 255, 0.65)', // 65% white for muted text
  default_input_background_color: '#252525', // Outer Space for input fields and interactive elements
  default_error_color: '#ff6b6b', // Slightly adjusted red for better visibility on dark background
  default_tag_background_color: '#252525' // Outer Space for tag backgrounds
};
  
export const Colors = {
  light: light_colors,
  dark: dark_colors
};
