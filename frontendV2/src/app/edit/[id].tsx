import {View, NativeSyntheticEvent, TextInputKeyPressEventData,} from 'react-native';
import { StyleSheet, TextInput, Pressable,  ScrollView, Image } from 'react-native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import React, { useState, useLayoutEffect, useEffect } from 'react';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import {  CommonActions } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { useThemeColor } from '@/hooks/useThemeColor';
import type { TabParamList } from '../(tabs)/_layout';
import { ImagePickerResult } from 'expo-image-picker';
import ThemedButton from '@/components/ThemedButton';
import { useRoute } from '@react-navigation/native';
import ThemedView from '@/components/ThemedView';
import * as ImagePicker from 'expo-image-picker'; 
import ThemedText from '@/components/ThemedText';
import ThemedTag from '@/components/ThemedTag';
import ThemedCard from '@/components/ThemedCard';
import {fetchAPI} from "@/components/Utils";
import URLs from "@/constants/Urls";
import { useToast } from '@/contexts/ToastContext';

export default function EditArticlePage() {
  const { showToast } = useToast();
  // const [imgResultsOrLinks,  setImgResultsOrLinks]  = useState<(ImagePickerResult | string)[]>([]);
  const navigation = useNavigation<BottomTabNavigationProp<TabParamList, 'post'>>();
  const [imgResults,  setImgResults]  = useState<(ImagePickerResult|string)[]>([]);
  const [inputHeights, setInputHeights] = useState<number[]>([]);
  const [bodies,  setBodies]  = useState<string[]>([""]);
  const [ratios, setRatios] = useState<number[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [unicon, setUnicon] = useState(false);
  const [title, setTitle] = useState('');
  const [raw, setRaw] = useState('');
  
  
  const DEFAULT_CARD_BACKGROUND = useThemeColor({}, 'DEFAULT_CARD_BACKGROUND');
  const DEFAULT_GRAY_TEXT = useThemeColor({}, 'DEFAULT_GRAY_TEXT');
  const DEFAULT_TEXT = useThemeColor({}, 'DEFAULT_TEXT');
  const ALWAYS_BLACK = useThemeColor({}, 'ALWAYS_BLACK');
  const articleId = (useRoute().params as { id: string }).id;

  function parseMarkdownImages(raw: string): {
    bodies: string[];
    imgUris: string[];
  } {  
    const imgRegex = new RegExp(
      `!\\[[^\\]]*\\]\\((${URLs.BUCKET}[^)]+)\\)`,
      'g'
    );
    const bodies: string[] = [];
    const imgUris: string[] = [];
    let lastIndex = 0;
    let m: RegExpExecArray | null;

    while ((m = imgRegex.exec(raw)) !== null) {
      bodies.push(raw.slice(lastIndex, m.index).trim());
      imgUris.push(m[1]);
      lastIndex = m.index + m[0].length;
    }
    bodies.push(raw.slice(lastIndex).trimStart());

    return { bodies, imgUris };
  }

  const fetchArticle = async () => {
    setLoading(true);
    const response = await fetchAPI(
      URLs.ARTICLE(String(articleId)), {
      method: 'GET',
      token: true,
    });
    if (!response.error) {
      const { bodies, imgUris } = parseMarkdownImages(response.data.results.article.body);
      setBodies(bodies);
      setImgResults(imgUris);
      setTitle(response.data.results.article.title);
      setUnicon(response.data?.results?.article?.unicon);
      setTags(response.data.results.article.tag);
      setInputHeights(prev => {
      const newHeights = [...prev];
        bodies.forEach((body, idx) => {
          newHeights[idx] = ((body.match(/\n/g) || []).length + 1) * 30;
        });
        return newHeights;
      });

    } else {
      showToast({
        type: 'error',
        text1: `Hi, ${response.data.detail}!`,
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchArticle();
  }, [articleId]);

  useEffect(() => {
    Promise.all(
      imgResults.map(
        img =>
          new Promise<number>(resolve => {
            let uri: string | undefined;
            if (typeof img === 'string') {
              uri = img;
            } else if (img && 'assets' in img && img.assets && img.assets[0]?.uri) {
              uri = img.assets[0].uri;
            }
            if (uri) {
              Image.getSize(
                uri,
                (w, h) => resolve(w / h),
                () => resolve(16 / 9) // fallback
              );
            } else {
              resolve(16 / 9); // fallback if no uri
            }
          })
      )
    ).then(setRatios);
  }, [imgResults]);

  const handleUpdate = async () => {
    setLoading(true);
    if (!title || !bodies) {
      showToast({
        type: 'error',
        text1: `Title and body cannot be empty!`,
      });
      setLoading(false);
      return;
    }
    
    const uploadedImageUrls = await Promise.all(
      imgResults
        .slice(0, bodies.length - 1)
        .map(img => (typeof img !== 'string' ? handleUploadImgs(img) : img))
    );

    let body_raw = '';
    bodies.forEach((body, idx) => {
      body_raw += body;
      if (idx + 1 < bodies.length) {
        const imgUrl = uploadedImageUrls[idx];
        if (imgUrl) {
          body_raw += `\n![](${imgUrl})\n`;
        }
      }
    });
    const response = await fetchAPI(
      URLs.ARTICLE(String(articleId) + '/'), 
      {
        method: 'PATCH',
        token: true,
        body: { 
          title: title, 
          body: body_raw, 
          unicon: unicon,
          tag: tags
        },
      }
    );
    if (!response.error){
      setTitle('');
      setBodies(['']);
      setImgResults([])
      setInputHeights([])
      setUnicon(false);
      setRaw('');
      setTags([]);
      navigation.dispatch(
        CommonActions.reset({
          index: 1,
          routes: [
            { name: '(tabs)' }, 
            { 
              name: 'article/[id]',
              params: { id: String(articleId) },
            },
          ],
        })
      );
    }else{
      showToast({
        type: 'error',
        text1: `Hi, ${response.data.detail}!`,
      });
    }    
    setLoading(false);
  };  

  const handleUploadImgs = async (imgResult: ImagePickerResult) => {
    setLoading(true);

    if (!imgResult.assets || imgResult.assets.length === 0) {
      showToast({
        type: 'error',
        text1: 'No image asset found!',
      });
      setLoading(false);
      return;
    }

    const asset = imgResult.assets[0]
    const { uri, mimeType, fileName } = asset
    const type = mimeType ?? 'image/jpeg'
    const name = fileName ?? uri.split('/').pop()
    const fileKey = `uploads/${Date.now()}_${name}`
    const getResponse = await fetchAPI(
      URLs.ARTICLE_IMG(`?file_name=${encodeURIComponent(fileKey)}&file_type=${encodeURIComponent(type)}`), 
      {
        method: 'GET',
        token: true,
        body: {},
      }
    );
    if (!getResponse.error){
      const file = await fetch(uri)
      const blob = await file.blob()
      const putResponse = await fetch(getResponse.data.uploadUrl, {
          method: 'PUT',
          body: blob,
          headers: { 'Content-Type': type },
      });
      if (putResponse.ok){
        return getResponse.data.publicUrl
      }else{
        showToast({
          type: 'error',
          text1: `Sorry, the image uploading was unsuccessful!`,
        });
      }
    }else{
      showToast({
        type: 'error',
        text1: `Hi, ${getResponse.data.detail}!`,
      });
    }
    setLoading(false);
    return null
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: {
      backgroundColor: DEFAULT_CARD_BACKGROUND, // navbar background
      // shadowColor: 'transparent', // remove iOS bottom border
      elevation: 0, // remove Android shadow
      borderWidth: 0, 
      },
      headerTintColor: DEFAULT_TEXT,
      headerTitleAlign: 'center',
      headerTitle: 'Edit Article',
      headerLeft: () => (
        <Feather 
          name="arrow-left" 
          size={24} 
          color={DEFAULT_TEXT}
          onPress={() => {
            setTitle('');
            setBodies(['']);
            setImgResults([]);
            setInputHeights([]);
            setUnicon(false);
            setRaw('');
            setTags([]);
            navigation.goBack();
          }}
          style={{ marginLeft: 20 }}
        />
      ),
      headerRight: () => (
        <ThemedText
          onPress={handleUpdate} 
          disabled={loading}
          style={{ marginRight: 30 }}
        >
          Update
        </ThemedText>
      ),
    });
  }, [navigation, handleUpdate, loading]);


  const handlePickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled) {
      setBodies(prevBodies => [...prevBodies, ""])
      setInputHeights(prevInputHeights => [...prevInputHeights, 30])
      setImgResults(prevImgResults => [...prevImgResults, result])
    }
  };

  const handleCurrentBody = async (text: string, idx: number) => {

    setInputHeights(prev => {
      const newHeights = [...prev];
      newHeights[idx] = ((text.match(/\n/g) || []).length + 1) * 30;
      return newHeights;
    });

    setBodies((prevBodies) =>
      prevBodies.map((body, i) => (i === idx ? text : body))
    );
    
  }

  const handleRemoveImg = async (idx: number) => {
    setImgResults(prevImgResults => prevImgResults.filter((_, i) => i !== idx))
    setBodies((prevBodies) => {
      if (prevBodies.length < 2 || idx < 0 || idx >= prevBodies.length - 1) return prevBodies;
      const mergedBody = prevBodies[idx] + "\n" + prevBodies[idx + 1];
      return [
      ...prevBodies.slice(0, idx),
      mergedBody,
      ...prevBodies.slice(idx + 2),
      ];
    });

    setInputHeights((prevInputHeights) => {
      const mergedHeight = prevInputHeights[idx]  + prevInputHeights[idx + 1];
      if (prevInputHeights.length == 2){
        return [mergedHeight]
      } else {
        return [
        ...prevInputHeights.slice(0, idx),
        mergedHeight,
        ...prevInputHeights.slice(idx + 2),
        ];
      };
    });
  }

  const onKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (e.nativeEvent.key === ' ' || e.nativeEvent.key === ',') {
      const word = raw.trim();
      if (word.length > 0 && !tags.includes(word)) {
        setTags([...tags, word]);
      }
      setRaw(''); 
    }
  };

  const removeTag = (indexToRemove: number) => {
    setTags(prev => prev.filter((_, i) => i !== indexToRemove));
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
    },
    cardContainer: {
      minHeight: 700,
      display: 'flex',
    },
    textAreasContainer:{
      display: 'flex',
      flex: 1
    },
    uniconContainer:{
      display: 'flex',
      flexDirection: 'row',
      gap: 10,
    },
    textWrapper:{
      flex: 1,
      justifyContent: 'center',
      alignSelf: 'center',
      flexDirection: 'column',
      alignItems: 'center',
    },
    titleTextArea: {
      borderWidth: 0,         
      borderRadius: 4,
      padding: 8,
      fontSize: 20,
      color: DEFAULT_TEXT
    },
    activeBodyTextArea: {
      marginBottom: 20, 
      flex:1
    },
    bodyTextArea: {
      borderWidth: 0,
      borderRadius: 4,
      paddingHorizontal: 8,
      fontSize: 16,
      color: DEFAULT_TEXT,
      lineHeight: 30
    },
    tagAreaContainer:{
      padding: 20,
      gap: 20,
      display: 'flex',
      minHeight: 200,
    },
    chipContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
    },
    tagTextArea: {
      color: DEFAULT_TEXT,
      flexGrow: 1,
      minWidth: 80,
      fontSize: 16,
      padding: 4,
    },
    img: {
      width: '100%',
      borderRadius: 20,
      marginVertical: 10,
      maxHeight: 1000,
    }
  });

  return (
    <ScrollView 
        style={{ backgroundColor: DEFAULT_CARD_BACKGROUND }} 
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
    >
    <ThemedView style={styles.container}>
      <ThemedCard type='detail' style={styles.cardContainer}>
        <View style={styles.textAreasContainer}>
          <TextInput
            style={styles.titleTextArea}
            underlineColorAndroid="transparent" 
            numberOfLines={6}            
            placeholder="Title"
            placeholderTextColor={DEFAULT_GRAY_TEXT}
            value={title}
            onChangeText={setTitle}
            textAlignVertical="top"      
            scrollEnabled
          />
          {bodies.map((bodyText, idx) => {
            
            const isLastBlock = idx === bodies.length - 1;

            return (
              
              <React.Fragment key={`content-block-${idx}`}>
                <TextInput
                    style={[
                        styles.bodyTextArea,
                        { height: inputHeights[idx] || undefined },
                        isLastBlock && styles.activeBodyTextArea
                    ]}
                    underlineColorAndroid="transparent"
                    multiline
                    placeholder={isLastBlock ? "Continue writing..." : ""}
                    placeholderTextColor={DEFAULT_GRAY_TEXT}
                    value={bodyText}
                    onChangeText={(text) => handleCurrentBody(text, idx)}
                    textAlignVertical="top"
                    scrollEnabled={false} 
                    onKeyPress={({ nativeEvent }) => {
                      if (nativeEvent.key === 'Backspace' && bodyText === '' && idx > 0) {
                        handleRemoveImg(idx-1);
                      }
                    }}
                />
                {imgResults[idx] && typeof imgResults[idx] === 'string' ? (
                  <Pressable onPress={() => handleRemoveImg(idx)}>
                    <Image
                      source={{ uri: imgResults[idx] }}
                      style={[styles.img, { aspectRatio: ratios[idx] || 16 / 9 }]}
                    />
                  </Pressable>
                ) : (
                  typeof imgResults[idx] !== 'string' && imgResults[idx]?.assets && imgResults[idx].assets[0]?.uri && (
                    <Pressable onPress={() => handleRemoveImg(idx)}>
                      <Image
                        source={{ uri: imgResults[idx].assets![0].uri }}
                        style={[styles.img, { aspectRatio: ratios[idx] || 16 / 9 }]}
                      />
                    </Pressable>
                  )
                )}
              </React.Fragment>
            );
          })}
        </View>
          <View style={styles.uniconContainer}>
            <View style={styles.textWrapper}>
              <ThemedText  size='smaller' color='gray'>
                By enabling the unicon option your post will be
              </ThemedText>
              <ThemedText  size='smaller' color='gray'>
                visible to other supported university students
              </ThemedText>
            </View>
            <ThemedButton
              type={'toggled'}
              onPress={() => handlePickImage()}
            >
              <MaterialIcons
                name="add-to-photos" 
                size={17} 
                color={ALWAYS_BLACK}
              />
            </ThemedButton>
            <ThemedButton
              type={unicon ? 'toggled' : 'unToggled'}
              onPress={() => {setUnicon(!unicon);}}
            >
              <ThemedText size='smaller' color={unicon ? 'black' : 'gray' }>UNI.CON</ThemedText>
            </ThemedButton>
          </View>
      </ThemedCard>
      <View style={styles.tagAreaContainer}>
        <ThemedText size='h3' font='displayBold'>Add Tags</ThemedText>
        <View style={styles.chipContainer}>
          {tags.map((tag, i) => (
            <Pressable onPress={() => removeTag(i)}>
              <ThemedTag text={tag} type={'default'} key={i}/>
            </Pressable>
          ))}
          <TextInput
            style={styles.tagTextArea}
            value={raw}
            onChangeText={setRaw}
            onKeyPress={onKeyPress}
            placeholder="Type and hit space"
            placeholderTextColor={DEFAULT_GRAY_TEXT}
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>
      </View>
    </ThemedView>
    </ScrollView>
  );
}