import { View, Text, type ViewProps } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';

type FeedArticleProps = {
  lightColor?: string;
  darkColor?: string;
  article: any;
};

function FeedArticle({ lightColor, darkColor, article }: FeedArticleProps) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'feedArticleBackground');
  const articleTitleColor = useThemeColor({ light: lightColor, dark: darkColor }, 'feedArticleTitle');
  const articleContentColor = useThemeColor({ light: lightColor, dark: darkColor }, 'feedArticleContent');

  return (
    <View style={[{ backgroundColor }]}>
      <Text style={{ color: articleTitleColor }}>{article.title}</Text>
      <Text style={{ color: articleContentColor }}>{article.body}</Text>
    </View>
  );
};

export { FeedArticle };