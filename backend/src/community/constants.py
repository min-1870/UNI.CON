DELETED_TITLE = '[DELETED ARTICLE]'
DELETED_BODY = '[DELETED CONTENT]'

REGISTER_SUBMIT_NAME = 'register/submit'
REGISTER_CONFIRM_VIEW_NAME = 'register/confirm'

ARTICLE_PATCH_DETAIL_DELETE_NAME = 'article-detail'
ARTICLE_LIST_CREATE_NAME = 'article-list'
ARTICLE_SCORE_NAME = 'article-hot'
ARTICLE_PREFERENCE_NAME = 'article-preference'
ARTICLE_LIKE_NAME = 'article-like'
ARTICLE_UNLIKE_NAME = 'article-unlike'

COMMENT_PATCH_DETAIL_DELETE_NAME = 'comment-detail'
COMMENT_LIST_CREATE_NAME = 'comment-list'
COMMENT_LIKE_NAME = 'comment-like'
COMMENT_UNLIKE_NAME = 'comment-unlike'

MOCK_ARTICLE ={
    "title":"Nice title",
    "body":"Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    "unicon":True,
}
MOCK_ARTICLE_WITH_COURSES ={
    "title":"Nice title",
    "body":"Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    "unicon":False,
    "course_code":'comp1231, Comp1320'
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

MOCK_ARTICLE_2 ={
    "title":"Nice title",
    "body":"Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    "unicon":False,
}

MOCK_COMMENT ={
    "body":"Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
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

MOCK_COMMENT ={
    "body":"Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
}
        
MOCK_USER_1 = {
    "password": "securepassword123",
    "email": "z5555555@student.unsw.edu.au"
} 
        
MOCK_USER_2 = {
    "password": "securepassword123",
    "email": "z6666666@student.unsw.edu.au"
} 
        
MOCK_USER_3 = {
    "password": "securepassword123",
    "email": "z6666666@student.uts.edu.au"
} 