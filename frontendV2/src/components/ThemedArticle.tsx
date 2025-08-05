import React,  { useState, useEffect, useCallback, useMemo  } from "react";
import { ArticleType, InitialDataType } from '@/constants/types';
import { View, Pressable, StyleSheet } from 'react-native';
import { AntDesign, FontAwesome } from '@expo/vector-icons';
import { useArticlesStore } from '@/store/articleStore';
import { useThemeColor } from '@/hooks/useThemeColor';
import {fetchAPI, getData} from "@/components/Utils";
import Markdown from 'react-native-markdown-display';
import { numberToString, pointToTitle } from '@/components/Utils';
import ThemedText from '@/components/ThemedText';
import ThemedTag from '@/components/ThemedTag';
import ThemedCard from '@/components/ThemedCard';
import { Image } from 'react-native';
import { router } from 'expo-router';
import URLs from "@/constants/Urls";
import moment from 'moment';
  
  const styles = StyleSheet.create({
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
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      minWidth: 30,
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
  articleData: ArticleType;
  trendingTags?: string[];
  initialData?: InitialDataType|null;
  type?: string;
};

function ThemedArticle({ articleData, initialData, trendingTags, type='default',  }: ThemedArticleProps) {

  const button_color = useThemeColor({}, 'DEFAULT_GRAY_TEXT');
  const active_button_color = useThemeColor({}, 'UNICON_BACKGROUND');
  const [fetchedTrendingTags, setFetchedTrendingTags] = useState<string[]>(trendingTags ?? []);
  
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
    const url = articleData.like_status
        ? URLs.ARTICLE_UNLIKE(String(articleData.id))
        : URLs.ARTICLE_LIKE(String(articleData.id));
    const response_data = await fetchAPI(url, {method: 'POST'})
    if (response_data) {
        useArticlesStore.getState().updateArticle(articleData.id, {
          like_status: !articleData.like_status,
          likes_count: articleData.likes_count + (articleData.like_status ? -1 : 1),
        });
    }
  };

  const handleSave = async () => {
      const url = articleData.save_status
      ? URLs.ARTICLE_UNSAVE(String(articleData.id))
      : URLs.ARTICLE_SAVE(String(articleData.id));
      
      const data = await fetchAPI(url, {method: 'POST'})
      if (data) {
        useArticlesStore.getState().updateArticle(articleData.id, {
          save_status: !articleData.save_status,
        });
      }    
  };

  const handleArticleDetail = useCallback(() => {
        useArticlesStore.getState().updateArticle(articleData.id, {
          view_status: true,
          views_count: articleData.views_count + 1,
        });
    router.push({ pathname: '/article/[id]', params: { id: String(articleData.id) } });
  }, [articleData.id]);
  
  return (
    <ThemedCard type={
        type === 'default' ? (articleData.view_status ? 'defaultViewed' : 'default') : 'detail'
      }>
      <Pressable onPress={() => (type === 'default' && handleArticleDetail())}>
        <View style={[styles.infoContainer]}>
            {articleData.unicon && (
              <ThemedTag initialData={initialData} type='uni' unClickable={true} text={articleData.user_school.toUpperCase()}/>
            )}
          {articleData.marketplace && (
            <ThemedText size='bigger' font='textBold' 
              color={
              articleData.status === 0 
              ? 'brand' 
              : articleData.status === 1 
              ? 'gray' 
              : 'red'
            } >
              {articleData.status === 0 ? 'Selling' : articleData.status === 1 ? 'Pending' : 'Sold'}
            </ThemedText>
          )}
          <ThemedText color="brand">
            {pointToTitle(articleData.user_static_points)}
          </ThemedText>
          <ThemedText color="gray" size='smaller'>
            {moment(articleData.created_at).fromNow()}
          </ThemedText>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
           <ThemedText color="gray" size='smaller' >
             {articleData.deleted? 'deleted' : articleData.edited ? 'edited' : null}
           </ThemedText>
          </View>
        </View>
        <View style={styles.content}>
          <ThemedText size='h3' font='textBold'>{articleData.title}</ThemedText>
            { articleData.marketplace && (
              <View style={{ flexDirection: 'row', width: '100%', marginTop: 10, }}>
                <View style={{ flexDirection: 'column', gap: 5, flex: 1 }}>
                  <ThemedText font='textMedium' color='gray'>Contact</ThemedText>
                  <ThemedText size='bigger' font='textBold'>{articleData.contact}</ThemedText>
                </View>
                <View style={{ flexDirection: 'column', gap: 5, flex: 1  }}>
                  <ThemedText font='textMedium' color='gray'>Price</ThemedText>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <ThemedText size='bigger' font='textBold'>{articleData.price}</ThemedText>
                    <ThemedText size='bigger' font='textMedium' >AUD</ThemedText>
                  </View>
                </View>
              </View>
            )}
            {type === 'default' ? (
              <React.Fragment>
                <ThemedText justify={true}>
                  <Markdown>
                    {(() => {
                      const snippet = bodies[0].slice(0,200).trimEnd();
                      const needsMore = bodies[0].length > 200 || bodies.length > 1;
                      return needsMore
                        ? `${snippet}... **read more**`
                        : snippet;
                    })()}
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
                  <ThemedText justify={true}>
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
            {articleData.tag.length > 0 && articleData.tag
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
            name={articleData.like_status ? 'heart' : 'hearto'}
            size={15}
            color={articleData.like_status ? active_button_color: button_color}
          />
          <ThemedText size='smaller' color="gray" font='textMedium'>
            {numberToString(articleData.likes_count)}
          </ThemedText>
        </Pressable>
        <View style={[styles.button]}>
          <AntDesign
            name={'message1'}
            size={15}
            color={button_color}
          />
          <ThemedText size='smaller' color="gray" font='textMedium'>
            {articleData.comments_count}
          </ThemedText>
        </View>
        <View style={[styles.button]}>
          <AntDesign
            name={'eyeo'}
            size={15}
            color={button_color}
          />
          <ThemedText size='smaller' color="gray" font='textMedium'>
            {articleData.views_count}
          </ThemedText>
        </View>
        <Pressable onPress={handleSave} style={[styles.button]}>
          <FontAwesome
            name={articleData.save_status ? 'bookmark' : 'bookmark-o'}
            size={15}
            color={button_color}
          />
        </Pressable>
      </View>
    </ThemedCard>
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