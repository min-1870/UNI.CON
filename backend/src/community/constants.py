CACHE_TIMEOUT = 60 * 60 * 24
EMBEDDING_VECTOR_SIZE = 1536
EMBEDDING_VECTOR_MODEL = "text-embedding-3-small"
ENV_OPENAI_API_KEY = "OPENAI_API_KEY"
INDEX_FILE_NAME = "index.idx"
PAGINATOR_SIZE = 10


ARTICLE_CACHE_KEY = (
    lambda article_id: f"ARTICLE_{article_id}"
)
ARTICLES_CACHE_KEY = (
    lambda school_id, view_name, identifier="": f"{school_id}_{view_name}_{identifier}"
)
ARTICLES_LIKE_CACHE_KEY = (
    lambda user_id: f"{user_id}_LIKED_ARTICLES"
)
ARTICLES_VIEW_CACHE_KEY = (
    lambda user_id: f"{user_id}_VIEWED_ARTICLES"
)
ARTICLES_SAVE_CACHE_KEY = (
    lambda user_id: f"{user_id}_SAVED_ARTICLES"
)
COMMENTS_CACHE_KEY = (
    lambda article_id, comment_id="": f"ARTICLE_{article_id}_COMMENT_{comment_id}"
)
COMMENTS_LIKE_CACHE_KEY = (
    lambda user_id: f"{user_id}_LIKED_COMMENTS"
)

DELETED_TITLE = "[DELETED ARTICLE]"
DELETED_BODY = "[DELETED CONTENT]"

REGISTER_SUBMIT_NAME = "user-list"
REGISTER_CONFIRM_VIEW_NAME = "user-validate"

ARTICLE_PATCH_DETAIL_DELETE_NAME = "article-detail"
ARTICLE_LIST_CREATE_NAME = "article-list"
ARTICLE_SCORE_NAME = "article-hot"
ARTICLE_PREFERENCE_NAME = "article-preference"
ARTICLE_LIKE_NAME = "article-like"
ARTICLE_UNLIKE_NAME = "article-unlike"

COMMENT_PATCH_DETAIL_DELETE_NAME = "comment-detail"
COMMENT_LIST_CREATE_NAME = "comment-list"
COMMENT_LIKE_NAME = "comment-like"
COMMENT_UNLIKE_NAME = "comment-unlike"

MOCK_ARTICLE = {
    "title": "Nice title",
    "body": "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    "unicon": True,
    "course_code": [],
}
MOCK_ARTICLE_WITH_COURSES = {
    "title": "Nice title",
    "body": "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    "unicon": False,
    "course_code": ["comp1231", "Comp1320"],
}
MOCK_ARTICLE_RESPONSE_KEYS = {
    "id",
    "title",
    "body",
    "user",
    "unicon",
    "deleted",
    "edited",
    "created_at",
    "views_count",
    "comments_count",
    "likes_count",
    "user_temp_name",
    "user_static_points",
    "user_school",
    "like_status",
    "course_code",
}

MOCK_COMMENT = {
    "body": "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
}
MOCK_COMMENT_RESPONSE_KEYS = {
    "id",
    "body",
    "user",
    "deleted",
    "edited",
    "parent_comment",
    "article",
    "created_at",
    "comments_count",
    "likes_count",
    "user_temp_name",
    "user_static_points",
    "user_school",
    "like_status",
}

MOCK_COMMENT = {
    "body": "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
}

MOCK_USER_1 = {"password": "securepassword123", "email": "z5555555@student.unsw.edu.au"}

MOCK_USER_2 = {"password": "securepassword123", "email": "z6666666@student.unsw.edu.au"}

MOCK_USER_3 = {"password": "securepassword123", "email": "z6666666@student.uts.edu.au"}
