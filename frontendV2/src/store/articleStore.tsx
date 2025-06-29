import { ArticleType } from '@/constants/types';
import { create } from 'zustand';

// type FeedType = 'all' | 'hot' | 'recommend';

type ArticlesStore = {
  articlesById: Record<number, ArticleType>;
  feeds: Record<string, Record<string, number[]>>;  
  nextArticlePage: Record<string, Record<string, string | null>>;
  currentArticlePage: Record<string, Record<string, string | null>>;
  lastResetPage: string | null; 


  setFeed: (page: string, feed: string, articles: ArticleType[]) => void;
  setNextArticlePage: (page: string, feed: string, nextPage: string | null) => void;
  updateArticle: (id: number, update: Partial<ArticleType>) => void;
  reset: (page: string) => void;
  clear: () => void;
};

export const useArticlesStore = create<ArticlesStore>((set, get) => ({
    articlesById: {},
    feeds: {},
    nextArticlePage: {},
    currentArticlePage: {},
    lastResetPage: null,

    clear: () =>
        set({
            articlesById: {},
            feeds: {},
            nextArticlePage: {},
            currentArticlePage: {},
            lastResetPage: null,
        }),

    reset: (page) => {
        if (page === get().lastResetPage) {
            return; // No need to reset if it's the same page
        }
        set((state) => {
            // Remove only the data for the specified page
            const { [page]: _, ...restFeeds } = state.feeds;
            const { [page]: __, ...restNext } = state.nextArticlePage;
            const { [page]: ___, ...restCurrent } = state.currentArticlePage;
            return {
                
                feeds: restFeeds,
                nextArticlePage: restNext,
                currentArticlePage: restCurrent,
                lastResetPage: page,

            };
        });
    },
    setNextArticlePage: (page, feed, nextPage) =>
        set((state) => {
        const prevNextPage = state.nextArticlePage[page] || {};
        const prevCurrentPage = state.currentArticlePage[page] || {};
        return {
            currentArticlePage: {
            ...state.currentArticlePage,
            [page]: {
                ...prevCurrentPage,
                [feed]: prevNextPage[feed] || null,
            },
            },
            nextArticlePage: {
            ...state.nextArticlePage,
            [page]: {
                ...prevNextPage,
                [feed]: nextPage,
            },
            },
        };
        }),

    setFeed: (page, feed, articles) =>
        set((state) => {
            // Add/Update articles in the articlesById dictionary
            const newArticlesById = { ...state.articlesById };
            articles.forEach((a) => {
                newArticlesById[a.id] = { ...newArticlesById[a.id], ...a };
            });

            // Set the feed order with page applied
            return {
                articlesById: newArticlesById,
                feeds: {
                    ...state.feeds,
                    [page]: {
                        ...(state.feeds[page] || {}),
                        [feed]: articles.map((a) => a.id),
                    },
                },
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