/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const LIGHT_MODE = {
    UNICON_BACKGROUND: '#81ef90',
    UNICON_CONTENT: '#2c9669',

    DEFAULT_TEXT: '#232835',
    DEFAULT_CARD_BACKGROUND: '#fafafa',
    DEFAULT_VIEWED_CARD_BACKGROUND: '#ececec',
    DEFAULT_BACKGROUND: '#f8f9f7',

    DEFAULT_GRAY_TEXT: '#a2a9b2',
    DEFAULT_GRAY_BACKGROUND: '#f2f2f2',

    ALWAYS_BLACK: '#000000',
    ALWAYS_WHITE: '#ffffff',

    DEFAULT_TAG_BACKGROUND: '#e4e6e8',
    RANKED_TAG_BACKGROUND: '#E2F7E3',
    RANKED_TAG_TEXT: '#3CC94F',

    SKIMMER_PRIMARY: '#4ecca3', // new skimmer color for light mode
    SKIMMER_SECONDARY: '#e0f7ef', // new skimmer color for light mode
  };

const DARK_MODE = {
  UNICON_BACKGROUND: '#81ef90',
  UNICON_CONTENT: '#2c9669',

  DEFAULT_TEXT: '#e4e6e8',
  DEFAULT_CARD_BACKGROUND: '#232835',
  DEFAULT_VIEWED_CARD_BACKGROUND: '#2c2f3a',
  DEFAULT_BACKGROUND: '#181a20',

  DEFAULT_GRAY_TEXT: '#6c7380',
  DEFAULT_GRAY_BACKGROUND: '#232835',

  ALWAYS_BLACK: '#000000',
  ALWAYS_WHITE: '#ffffff',

  DEFAULT_TAG_BACKGROUND: '#2c2f3a',
  RANKED_TAG_BACKGROUND: '#233b2a',
  RANKED_TAG_TEXT: '#81ef90',

  SKIMMER_PRIMARY: '#4ecca3', // new skimmer color
  SKIMMER_SECONDARY: '#393e46', // new skimmer color
};
  
export const Colors = {
  light: LIGHT_MODE,
  dark: DARK_MODE
};
