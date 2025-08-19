USER_POINT_DELTA = {
    'article':{
        'view': 1,
        'like': 2,
        'comment': 3,
    },
    'comment': {
        'like': 1,
        'comment': 2,
    }
}


SHORT_CACHE_TIMEOUT = 60 * 10 # 10 Minutes
CACHE_TIMEOUT = 60 * 60 # 1 Hour
LONG_CACHE_TIMEOUT = 60 * 60 * 24 # 1 Day
EMBEDDING_VECTOR_SIZE = 1536
EMBEDDING_VECTOR_MODEL = "text-embedding-3-small"
ENV_OPENAI_API_KEY = "OPENAI_API_KEY"
INDEX_FILE_NAME = "index.idx"
PAGINATOR_SIZE = 10
NOTIFICATION_EMAIL_SUBJECT = "You have a new notification from UNI.CON"
NOTIFICATION_EMAIL_BODY = (
    lambda type_name, content, group: f"You have a new {group} on {type_name}: {content}"
)


NOTIFICATION_GROUP = (
    (0, "Comment"),
    (1, "Like"),
)
NOTIFICATION_GROUP_KV = {
    "comment" : 0,
    "like" : 1,
}

# Article cache keys
ARTICLE_CACHE_KEY = (
    lambda article_id: f"ARTICLE_{article_id}"
)
USER_LIKED_ARTICLES_KEY = (
    lambda user_id: f"USER_{user_id}_LIKED_ARTICLES"
)
USER_VIEWED_ARTICLES_KEY = (
    lambda user_id: f"USER_{user_id}_VIEWED_ARTICLES"
)
USER_SAVED_ARTICLES_KEY = (
    lambda user_id: f"USER_{user_id}_SAVED_ARTICLES"
)
ARTICLE_FACETS_KEY = (
    lambda facets, values: f"ARTICLE_FACETS_{'_'.join(facets) if isinstance(facets, list) else facets}_{'_'.join(values) if isinstance(values, list) else values}"
)
ARTICLE_IDS_KEY = (
    lambda facets, versions: f"ARTICLE_IDS_{facets}_{versions}"
)


# Comment cache keys
COMMENT_CACHE_KEY = (
    lambda article_id: f"COMMENT_{article_id}"
)
USER_LIKED_COMMENTS_KEY = (
    lambda user_id: f"USER_{user_id}_LIKED_COMMENTS"
)
COMMENT_SCHOOL_IDS_CACHE_KEY = (
    lambda article_id, parent_comment_id: f"ARTICLE_{article_id}_COMMENT_{parent_comment_id}_COMMENT_IDS"
)


# Notification cache keys
NOTIFICATION_CACHE_KEY = (
    lambda notification_id: f"NOTIFICATION_{notification_id}"
)
NOTIFICATION_USER_IDS_CACHE_KEY = (
    lambda user_id: f"USER_{user_id}_NOTIFICATION_IDS"
)

# school specific cache keys
TRENDING_TAGS_CACHE_KEY = (
    lambda school: f"SCHOOL_{school}_TRENDING_TAGS"
)

EMAIL_NOTIFICATIONS_THRESHOLD = 5


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
    "tag": [],
}
MOCK_ARTICLE_WITH_COURSES = {
    "title": "Nice title",
    "body": "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    "unicon": False,
    "tag": ["comp1231", "Comp1320"],
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
    "tag",
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
