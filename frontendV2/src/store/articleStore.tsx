import { ArticleType } from '@/constants/types';
import { create } from 'zustand';

// type FeedType = 'all' | 'hot' | 'recommend';

type ArticlesStore = {
  articlesById: Record<number, ArticleType>;
  feeds: Record<string, number[]>;  
  nextArticlePage: Record<string, string | null>;
  currentArticlePage: Record<string, string | null>; 


  setFeed: (feed: string, articles: ArticleType[]) => void;
  setNextArticlePage: (feed: string, nextPage: string | null) => void;
  updateArticle: (id: number, update: Partial<ArticleType>) => void;
  reset: () => void;
};

export const useArticlesStore = create<ArticlesStore>((set) => ({
    articlesById: {},
    feeds: {},
    nextArticlePage: {},
    currentArticlePage: {},

    reset: () =>
        set((state) => ({
            articlesById: {},
            feeds: {},
            nextArticlePage: {},
            currentArticlePage: {},
        })),

    setNextArticlePage: (feed, nextPage) =>
        set((state) => ({
            currentArticlePage: { ...state.currentArticlePage, [feed]: state.nextArticlePage[feed] || null },
            nextArticlePage: { ...state.nextArticlePage, [feed]: nextPage },
    })),


    setFeed: (feed, articles) => 
        
        set((state) => {
        // Add/Update articles in the articlesById dictionary
        const newArticlesById = { ...state.articlesById };
        articles.forEach((a) => {
            newArticlesById[a.id] = { ...newArticlesById[a.id], ...a };
        });

        // Set the feed order
        return {
            articlesById: newArticlesById,
            feeds: { ...state.feeds, [feed]: articles.map((a) => a.id) },
        };
    }),

    updateArticle: (id, update) =>
        set((state) => ({
        articlesById: {
            ...state.articlesById,
            [id]: { ...state.articlesById[id], ...update },
        },
    })),
}));