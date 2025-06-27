const DEBUG = true ;

let domain = "https://unicon.min1870.com/api"
if (DEBUG) {
    domain = "http://localhost:8000/api";
}

const URLS = {
    // Authentication
    LOGIN: `${domain}/account/user/login/`,
    GOOGLE_LOGIN: `${domain}/account/user/googlelogin/`,
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenEndpoint:         'https://oauth2.googleapis.com/token',
    GOOGLE_CLIENT_ID: '654153127818-9aao6il7d5vv3ivdb27nlsa58s7i6knl.apps.googleusercontent.com',
    TEMP_STATE: `${domain}/account/user/google_auth_session/`,
    GOOGLE_LINK_URL: `${domain}/account/user/googlelink/`,
    NEW_PASSWORD: `${domain}/account/user/newpassword/`,
    CHANGE_PASSWORD: `${domain}/account/user/changepassword/`,
    NEW_TOKEN: `${domain}/account/token/refresh`,

    // Feed (main feed)
    TIME_SORTED_ARTICLES: `${domain}/community/article`,
    HOT_SORTED_ARTICLES: `${domain}/community/article/hot`,
    PREFERENCE_SORTED_ARTICLES: `${domain}/community/article/preference`,

    // Feed (profile feed)
    POSTED_ARTICLES: `${domain}/community/article/posted_articles/`,
    SAVED_ARTICLES: `${domain}/community/article/saved_articles/`,
    COMMENTED_ARTICLES: `${domain}/community/article/commented_articles/`,
    LIKED_ARTICLES: `${domain}/community/article/liked_articles/`,

    // Notifications
    OLD_NOTIFICATIONS: `${domain}/community/article/old_notifications`,
    NEW_NOTIFICATIONS: `${domain}/community/article/new_notifications`,

    // 


    // CRUDE Article
    ARTICLE: (articleId?: string) => `${domain}/community/article${articleId ? `/${articleId}/` : '/'}`,
    ARTICLE_IMG: (queryParams?: string) => `${domain}/community/article/image${queryParams || ''}`,
    ARTICLE_HOT: `${domain}/community/article/hot`,
    ARTICLE_PREFERENCE: `${domain}/community/article/preference`,
    ARTICLE_LIKE: (articleId: string) => `${domain}/community/article/${articleId}/like/`,
    ARTICLE_UNLIKE: (articleId: string) => `${domain}/community/article/${articleId}/unlike/`,
    ARTICLE_SAVE: (articleId: string) => `${domain}/community/article/${articleId}/save/`,
    ARTICLE_UNSAVE: (articleId: string) => `${domain}/community/article/${articleId}/unsave/`,

    // CRUDE comment
    COMMENT: (commentId: string = '') => `${domain}/community/comment/${commentId ? `${commentId}/` : ''}`,
    COMMENT_LIKE: (commentId: string) => `${domain}/community/comment/${commentId}/like/`,
    COMMENT_UNLIKE: (commentId: string) => `${domain}/community/comment/${commentId}/unlike/`,

    // Searching
    SEARCHING_ARTICLE: (searchContent: string) => `${domain}/community/article/search?search_content=${searchContent}`,
};

export default URLS;
