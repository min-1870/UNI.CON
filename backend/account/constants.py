REGISTER_NAME = "user-list"
LOGIN_NAME = "user-login"
VALIDATE_NAME = "user-validate"
MOCK_USER = {"email": "z5364523@student.unsw.edu.au", "password": "securepassword123"}
USER_RESPONSE_KEYS = {
    "id",
    "email",
    "initial",
    "color",
    "points",
    "refresh",
    "access",
    "is_validated",
}
OTP_EMAIL_SUBJECT = "Your OTP for UNI.CON is here!"
OTP_EMAIL_BODY = "This is your OTP for UNI.CON: "
FORGOT_PASSWORD_EMAIL_SUBJECT = "Your new password for UNI.CON is here!"
FORGOT_PASSWORD_EMAIL_BODY = "We have provided a temporary password for you. Please change it after login: "

TEMPORARY_CODE_LIFETIME = 60 * 5  # 5 minutes
VALIDATION_CODE_LENGTH = 6
VALIDATION_CODE_CACHE_KEY = (lambda uid: f"USER_{uid}_VALIDATION_CODE")
SSO_SESSION_CACHE_KEY = (
    lambda session_id: f"SSO_SESSION_{session_id}_CACHE_KEY"
)
GOOGLE_LOGIN_CALLBACK_URL = "http://localhost:8081"#"http://localhost:8000/api/account/user/googlelogin/"
GOOGLE_LINK_CALLBACK_URL = "http://localhost:8081"#"http://localhost:8000/api/account/user/googlelink/"
FEED_REDIRECT_URI = "http://localhost:5173/feed"