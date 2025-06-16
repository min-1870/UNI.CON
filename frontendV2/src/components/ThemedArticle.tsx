
import { ArticleType, InitialDataType } from '@/constants/types';
import { View, Pressable, StyleSheet } from 'react-native';
import { AntDesign, FontAwesome } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import {fetchAPI, getData} from "@/components/Utils";
import ThemedText from '@/components/ThemedText';
import ThemedTag from '@/components/ThemedTag';
import React,  { useState, useEffect, useCallback, useMemo  } from "react";
import { router } from 'expo-router';
import URLs from "@/constants/Urls";
import moment from 'moment';
import Markdown from 'react-native-markdown-display'
import { Image } from 'react-native';
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      // backgroundColor: background_color,
      borderRadius: 20,
      marginHorizontal: 15,
      padding: 16, 
      
      boxShadow: '0px 3px 13px rgba(0, 0, 0, 0.08)',
      backdropFilter: 'blur(10px)', // For web platforms
      elevation: 10, // For Android shadow
    },
    infoContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginBottom: 14,
    },
    content: {
      gap: 5
    },
    tagContainer:{
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 14,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
      gap: 10,
    },
    button: {
      display: 'flex',
      gap: 4,
      alignItems: 'flex-end',
      flexDirection: 'row',
    },
    body: {
      width:'100%'
    },
    img: {
      width: '100%',
      borderRadius: 20,
      marginVertical: 10,
      maxHeight: 1000,
    }
  });

const IMG_REGEX = new RegExp(
  `!\\[[^\\]]*\\]\\((${URLs.BUCKET}[^)]+)\\)`,
  'g'
);

// Module‐level cache for aspect ratios
const ratioCache = new Map<string, number>();
function parseMarkdownImages(raw: string) {
  const bodies: string[] = [];
  const imgUris: string[] = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = IMG_REGEX.exec(raw)) !== null) {
    bodies.push(raw.slice(lastIndex, m.index));
    imgUris.push(m[1]);
    lastIndex = m.index + m[0].length;
  }
  bodies.push(raw.slice(lastIndex));
  return { bodies, imgUris };
}

type ThemedArticleProps = {
  articleData: any;
  trendingTags?: string[];
  initialData?: InitialDataType|null;
  type?: string;
};

function ThemedArticle({ articleData, initialData, trendingTags, type='default' }: ThemedArticleProps) {
  
  const view_background_color = useThemeColor({}, 'default_view_card_background_color');
  const background_color = useThemeColor({}, 'default_card_background_color');
  const button_color = useThemeColor({}, 'default_placeholder_color');
  const [fetchedTrendingTags, setFetchedTrendingTags] = useState<string[]>(trendingTags ?? []);
  const [article, setArticleState] = useState<ArticleType>(articleData);
  const { bodies, imgUris } = useMemo(
    () => parseMarkdownImages(articleData.body),
    [articleData.body]
  );
  const [ratios, setRatios] = useState<number[]>(
    imgUris.map(uri => ratioCache.get(uri) || (16/9))
  );

  useEffect(() => {
    if (!trendingTags) {
      (async () => {
        const tags = await getData('trending_tags');
        setFetchedTrendingTags(Array.isArray(tags) ? tags : []);
      })();
    }
  }, [trendingTags]);
  

  // Compute ratios, but cache to avoid repeated work
  useEffect(() => {
    imgUris.forEach((uri, i) => {
      if (!ratioCache.has(uri)) {
        Image.getSize(
          uri,
          (w, h) => {
            const r = w/h;
            ratioCache.set(uri, r);
            setRatios(rArr => {
              const copy = [...rArr];
              copy[i] = r;
              return copy;
            });
          },
          () => {}
        );
      }
    });
  }, [imgUris]);

  const handleLike = async () => {
    const url = article.like_status
        ? URLs.ARTICLE_UNLIKE(String(article.id))
        : URLs.ARTICLE_LIKE(String(article.id));
    const response_data = await fetchAPI(url, {method: 'POST'})
    if (response_data) {
        setArticleState((prevState: any) => ({
          ...prevState,
          like_status: !prevState.like_status,
          likes_count: prevState.likes_count + (prevState.like_status ? -1 : 1),
        }));
    }
  };

  const handleSave = async () => {
      const url = article.save_status
      ? URLs.ARTICLE_UNSAVE(String(article.id))
      : URLs.ARTICLE_SAVE(String(article.id));
      
      const data = await fetchAPI(url, {method: 'POST'})
      if (data) {
          setArticleState((prevState: any) => ({
          ...prevState,
          save_status: !article.save_status,
          }));
      }    
  };

  const handleArticleDetail = useCallback(() => {
    router.push({ pathname: '/article/[id]', params: { id: String(articleData.id) } });
  }, [articleData.id]);
  
  return (
    <View style={[
      styles.container,
      type === 'detail' && { borderTopRightRadius: 0, borderTopLeftRadius: 0, marginHorizontal: 0, marginBottom: 20 },
      { backgroundColor: type === 'default' ? article.view_status ? view_background_color : background_color : background_color}
    ]}>
      <Pressable onPress={handleArticleDetail}>
        <View style={[styles.infoContainer]}>
            {article.unicon && (
              <ThemedTag initialData={initialData} type='uni' text={article.user_school.toUpperCase()}/>
            )}
          <ThemedText type='articleAuthor'>
            {article.user_temp_name}
          </ThemedText>
          <ThemedText type='articlePoints'>
            {article.user_static_points}
          </ThemedText>
          <ThemedText type='articleDate'>
            {moment(article.created_at).fromNow()}
          </ThemedText>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
           <ThemedText type='articleDate' >
             {article.deleted? 'deleted' : article.edited ? 'edited' : null}
           </ThemedText>
          </View>
        </View>
        <View style={styles.content}>
          <ThemedText type='articleTitle'>{article.title}</ThemedText>
            {type === 'default' ? (
              <React.Fragment>
                <ThemedText type="articleBody">
                  <Markdown>
                    {bodies[0].length > 200 
                      ? bodies[0].slice(0, 200).trimEnd() + ' ... read more'
                      : bodies.length > 1 
                      ? bodies[0].trimEnd() + ' ... read more'
                      : bodies[0]
                    }
                  </Markdown>
                </ThemedText>
                {imgUris[0] && (
                  <View style={{ paddingHorizontal: 10 }}>
                    <Image
                      source={{
                        uri: imgUris[0],
                        cache: 'force-cache',
                      }}
                      style={{
                        width: '100%',
                        aspectRatio: ratios[0] || 16 / 9,
                        borderRadius: 20,
                        marginVertical: 10,
                        maxHeight: 1000,
                      }}
                    />
                  </View>
                )}
              </React.Fragment>
            ) : (
              bodies.map((bodyText, idx) => (
                <React.Fragment key={idx}>
                  <ThemedText type="articleBody">
                    <Markdown>
                      {bodyText}
                    </Markdown>
                  </ThemedText>
                  {imgUris[idx] && (
                    <View style={{ paddingHorizontal: 10 }}>
                      <Image
                        source={{
                          uri: imgUris[idx],
                          cache: 'force-cache',
                        }}
                        style={[styles.img, { aspectRatio: ratios[idx] || 16 / 9 }]}
                      />
                    </View>
                  )}
                </React.Fragment>
              ))
            )}
          <View style={styles.tagContainer}>
            {article.tag.length > 0 && article.tag
              .map((tag: string, i: number) => (
                <ThemedTag
                  text={tag}
                  type={fetchedTrendingTags.includes(tag) ? 'ranked' : 'default'}
                  key={i}
                />
            ))}
          </View>
        </View>
      </Pressable>
      <View style={[styles.buttonContainer]}>
        <Pressable onPress={handleLike} style={[styles.button]}>
          <AntDesign
            name={article.like_status ? 'heart' : 'hearto'}
            size={15}
            color={button_color}
          />
          <ThemedText type='articleButton'>
            {article.likes_count}
          </ThemedText>
        </Pressable>
        <View style={[styles.button]}>
          <AntDesign
            name={'message1'}
            size={15}
            color={button_color}
          />
          <ThemedText type='articleButton'>
            {article.comments_count}
          </ThemedText>
        </View>
        <View style={[styles.button]}>
          <AntDesign
            name={'eyeo'}
            size={15}
            color={button_color}
          />
          <ThemedText type='articleButton'>
            {article.views_count}
          </ThemedText>
        </View>
        <Pressable onPress={handleSave} style={[styles.button]}>
          <FontAwesome
            name={article.save_status ? 'bookmark' : 'bookmark-o'}
            size={15}
            color={button_color}
          />
        </Pressable>
      </View>
    </View>
  );
};


export default React.memo(
  ThemedArticle,
  (prevProps, nextProps) =>
    prevProps.type === nextProps.type &&
    prevProps.initialData === nextProps.initialData &&
    prevProps.articleData.id === nextProps.articleData.id &&
    prevProps.articleData.tag === nextProps.articleData.tag &&
    prevProps.articleData.view_status === nextProps.articleData.view_status &&
    prevProps.articleData.like_status === nextProps.articleData.like_status &&
    prevProps.articleData.likes_count === nextProps.articleData.likes_count &&
    prevProps.articleData.save_status === nextProps.articleData.save_status
);



// import React, {
//   useState,
//   useEffect,
//   useMemo,
//   useCallback
// } from "react";
// import {
//   View,
//   Pressable,
//   StyleSheet,
//   Image
// } from "react-native";
// import { AntDesign, FontAwesome } from '@expo/vector-icons';
// import moment from 'moment';
// import Markdown from 'react-native-markdown-display';
// import { useThemeColor } from '@/hooks/useThemeColor';
// import { fetchAPI } from "@/components/Utils";
// import { ArticleType, InitialDataType } from '@/constants/types';
// import URLs from "@/constants/Urls";
// import ThemedText from '@/components/ThemedText';
// import ThemedTag from '@/components/ThemedTag';
// import { router } from 'expo-router';

// // Hoist and cache regex once
// const IMG_REGEX = new RegExp(
//   `!\\[[^\\]]*\\]\\((${URLs.BUCKET}[^)]+)\\)`,
//   'g'
// );

// // Module‐level cache for aspect ratios
// const ratioCache = new Map<string, number>();

// function parseMarkdownImages(raw: string) {
//   const bodies: string[] = [];
//   const imgUris: string[] = [];
//   let lastIndex = 0;
//   let m: RegExpExecArray | null;
//   while ((m = IMG_REGEX.exec(raw)) !== null) {
//     bodies.push(raw.slice(lastIndex, m.index));
//     imgUris.push(m[1]);
//     lastIndex = m.index + m[0].length;
//   }
//   bodies.push(raw.slice(lastIndex));
//   return { bodies, imgUris };
// }

// const styles = StyleSheet.create({
//   container: {
//     borderRadius: 20,
//     marginHorizontal: 15,
//     padding: 16,
//     backgroundColor: "#fff",
//     elevation: 2,
//     shadowColor: "#000",
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     marginBottom: 20,
//   },
//   infoRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 12,
//     justifyContent: "space-between",
//   },
//   content: { marginBottom: 12 },
//   buttonsRow: { flexDirection: "row", gap: 16, marginTop: 12 },
//   image: {
//     width: "100%",
//     borderRadius: 12,
//     marginVertical: 8,
//   },
//   tagContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
// });

// type Props = {
//   articleData: ArticleType;
//   initialData?: InitialDataType | null;
//   trendingTags: string[];
// };

// function ThemedArticle({
//   articleData,
//   initialData,
//   trendingTags
// }: Props) {
//   const bg = useThemeColor({}, 'default_card_background_color');
//   const textColor = useThemeColor({}, 'default_text_color');
//   const iconColor = useThemeColor({}, 'default_placeholder_color');

//   // Memoize parsed markdown
//   const { bodies, imgUris } = useMemo(
//     () => parseMarkdownImages(articleData.body),
//     [articleData.body]
//   );

//   // Compute ratios, but cache to avoid repeated work
//   const [ratios, setRatios] = useState<number[]>(
//     imgUris.map(uri => ratioCache.get(uri) || (16/9))
//   );
//   useEffect(() => {
//     imgUris.forEach((uri, i) => {
//       if (!ratioCache.has(uri)) {
//         Image.getSize(
//           uri,
//           (w, h) => {
//             const r = w/h;
//             ratioCache.set(uri, r);
//             setRatios(rArr => {
//               const copy = [...rArr];
//               copy[i] = r;
//               return copy;
//             });
//           },
//           () => {}
//         );
//       }
//     });
//   }, [imgUris]);

//   // Handlers memoized
//   const handleLike = useCallback(async () => {
//     const url = articleData.like_status
//       ? URLs.ARTICLE_UNLIKE(String(articleData.id))
//       : URLs.ARTICLE_LIKE(String(articleData.id));
//     const res = await fetchAPI(url, { method: "POST" });
//     if (res) {
//       // You’d want to lift state up or use context
//     }
//   }, [articleData.id, articleData.like_status]);

//   const handleSave = useCallback(async () => {
//     const url = articleData.save_status
//       ? URLs.ARTICLE_UNSAVE(String(articleData.id))
//       : URLs.ARTICLE_SAVE(String(articleData.id));
//     await fetchAPI(url, { method: "POST" });
//   }, [articleData.id, articleData.save_status]);

//   const goDetail = useCallback(() => {
//     router.push({ pathname: '/article/[id]', params: { id: String(articleData.id) } });
//   }, [articleData.id]);

//   return (
//     <Pressable onPress={goDetail} style={[styles.container, { backgroundColor: bg }]}>
//       <View style={styles.infoRow}>
//         <ThemedText type="articleAuthor">{articleData.user_temp_name}</ThemedText>
//         <ThemedText type="articleDate">
//           {moment(articleData.created_at).fromNow()}
//         </ThemedText>
//       </View>

//       <View style={styles.content}>
//         <ThemedText type="articleTitle">{articleData.title}</ThemedText>
//         <ThemedText type="articleBody">
//           {bodies[0].length > 150
//             ? bodies[0].slice(0, 150).trimEnd() + "…"
//             : bodies[0]}
//         </ThemedText>
//         {imgUris[0] && (
//           <Image
//             source={{ uri: imgUris[0] }}
//             style={[styles.image, { aspectRatio: ratios[0] }]}
//             resizeMode="cover"
//           />
//         )}
//         <View style={styles.tagContainer}>
//           {articleData.tag.map((t, i) => (
//             <ThemedTag
//               key={i}
//               text={t}
//               type={trendingTags.includes(t) ? "ranked" : "default"}
//             />
//           ))}
//         </View>
//       </View>

//       <View style={styles.buttonsRow}>
//         <Pressable onPress={handleLike} style={{ flexDirection: "row", gap: 4 }}>
//           <AntDesign
//             name={articleData.like_status ? "heart" : "hearto"}
//             size={16}
//             color={iconColor}
//           />
//           <ThemedText type="articleButton">{articleData.likes_count}</ThemedText>
//         </Pressable>
//         <Pressable style={{ flexDirection: "row", gap: 4 }}>
//           <AntDesign name="message1" size={16} color={iconColor} />
//           <ThemedText type="articleButton">{articleData.comments_count}</ThemedText>
//         </Pressable>
//         <Pressable onPress={handleSave} style={{ flexDirection: "row", gap: 4 }}>
//           <FontAwesome
//             name={articleData.save_status ? "bookmark" : "bookmark-o"}
//             size={16}
//             color={iconColor}
//           />
//         </Pressable>
//       </View>
//     </Pressable>
//   );
// }

// // Only re-render when the few primitive props actually change
// export default React.memo(
//   ThemedArticle,
//   (a, b) =>
//     a.articleData.id === b.articleData.id &&
//     a.articleData.like_status === b.articleData.like_status &&
//     a.articleData.likes_count === b.articleData.likes_count &&
//     a.articleData.save_status === b.articleData.save_status &&
//     a.trendingTags.join(",") === b.trendingTags.join(",")
// );