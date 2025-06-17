from celery import shared_task
from community.constants import (
    NOTIFICATION_EMAIL_SUBJECT,
    NOTIFICATION_EMAIL_BODY,
    NOTIFICATION_GROUP_KV,
    INDEX_FILE_NAME,
    ENV_OPENAI_API_KEY,
    EMBEDDING_VECTOR_MODEL
)
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from django.utils import timezone
from decouple import config
from django_redis import get_redis_connection
from community.models import Article
from account.models import User
import smtplib
from openai import OpenAI
import numpy as np
import faiss

@shared_task
def send_email(contents, email):

    unicon_email = config("UNICON_EMAIL")
    unicon_password = config("UNICON_EMAIL_PASSWORD")
    
    # Create email message
    msg = MIMEMultipart()
    msg["From"] = unicon_email
    msg["To"] = "200134kms@gmail.com" # TODO Replace with actual recipient email
    msg["Subject"] = NOTIFICATION_EMAIL_SUBJECT
    email_body = str(contents)
    
    msg.attach(MIMEText(email_body, "plain"))

    try:
        # Connect to Gmail SMTP server
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(unicon_email, unicon_password)
        server.sendmail(unicon_email, "200134kms@gmail.com", msg.as_string())
        server.quit()
        print("Email sent: ", email_body)
        
    except Exception as e:
        print("Error:", e)

@shared_task
def get_n_update_preference_vector(article_id, user_id, alpha=0.1):
    user_instance = User.objects.get(pk=user_id)
    article_instance = Article.objects.get(pk=article_id)
    user_embeddings = np.array(user_instance.embedding_vector)
    article_embedding = np.array(article_instance.embedding_vector)
    new_user_embedding_vectors = ((1 - alpha) * user_embeddings + alpha * article_embedding).tolist()
    # Update the user's embedding vector in the database
    User.objects.filter(pk=user_instance.id).update(embedding_vector=new_user_embedding_vectors)
    
@shared_task
def get_n_register_embedding_vectors(article_id):
    try:
        index = faiss.read_index(INDEX_FILE_NAME)
        client = OpenAI(api_key=config(ENV_OPENAI_API_KEY))
    except Exception:
        return
    article_instance = Article.objects.get(pk=article_id)
    text = article_instance.title + " " + article_instance.body
    embedding_vector = client.embeddings.create(input=[text], model=EMBEDDING_VECTOR_MODEL).data[0].embedding
    index.remove_ids(np.array([article_instance.id]))
    index.add_with_ids(
        np.array([embedding_vector]), 
        np.array([article_instance.id])
    )
    faiss.write_index(index, INDEX_FILE_NAME)
    # Store the embedding vector in the Article instance
    Article.objects.filter(pk=article_instance.pk).update(embedding_vector=embedding_vector)

@shared_task
def recalc_all_engagement():
    now = timezone.now()
    # Iterate through all articles (consider batching for very large datasets)
    for article in Article.objects.all():
        age_hours = (now - article.created_at).total_seconds() / 3600
        # Weighted sum of interactions (adjust weights α, β, γ as needed)
        raw_score = 0.1 * article.views_count \
                    + 1 * article.likes_count \
                    + 3 * article.comments_count
        # Time-decay formula: adjust δ (e.g., 1.2) to tune freshness
        score = raw_score / pow(age_hours + 2, 1.2)
        # Save only the changed field
        Article.objects.filter(pk=article.pk).update(engagement_score=score)


@shared_task
def recalc_dirty_engagement():
    conn = get_redis_connection("default")
    dirty_ids = conn.smembers("articles:dirty")
    if not dirty_ids:
        return  # nothing to do
    for raw_id in dirty_ids:
        article_id = raw_id.decode()
        try:
            article = Article.objects.get(pk=article_id)
        except Article.DoesNotExist:
            conn.srem("articles:dirty", article_id)
            continue
        # Compute your weighted, time-decay score here
        age_hours = (timezone.now() - article.created_at).total_seconds()/3600
        raw = 0.1*article.views_count + 1*article.likes_count + 3*article.comments_count
        new_score = raw / pow(age_hours + 2, 1.2)
        Article.objects.filter(pk=article_id).update(engagement_score=new_score)
        conn.srem("articles:dirty", article_id)