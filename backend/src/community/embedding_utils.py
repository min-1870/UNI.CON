from .constants import (
    EMBEDDING_VECTOR_SIZE,
    EMBEDDING_VECTOR_MODEL,
    ENV_OPENAI_API_KEY,
    INDEX_FILE_NAME,
)
from decouple import config
from .models import Article
from openai import OpenAI
import numpy as np
import faiss

client = OpenAI(api_key=config(ENV_OPENAI_API_KEY))


def get_embedding(text, model=EMBEDDING_VECTOR_MODEL):
    text = text.replace("\n", " ")
    return client.embeddings.create(input=[text], model=model).data[0].embedding


def update_preference_vector(user_embeddings, article_embedding, alpha=0.1):
    user_embeddings = np.array(user_embeddings)
    article_embedding = np.array(article_embedding)
    return ((1 - alpha) * user_embeddings + alpha * article_embedding).tolist()


def add_embedding_to_faiss(index, article_embedding, article_id):
    article_embedding = np.array([article_embedding])
    article_id = np.array([article_id])
    index.add_with_ids(article_embedding, article_id)
    faiss.write_index(index, INDEX_FILE_NAME)


def search_similar_embeddings(index, embedding, k=100):
    _, ids = index.search(np.array([embedding]), k=k)
    return ids[0]


def reset_faiss(index):  # This function only for testcases
    index.reset()
    for article_instance in Article.objects.all():
        add_embedding_to_faiss(
            index, article_instance.embedding_vector, article_instance.id
        )


def get_faiss_index():
    try:
        index = faiss.read_index(INDEX_FILE_NAME)
    except Exception:
        index = faiss.IndexFlatL2(EMBEDDING_VECTOR_SIZE)
        index = faiss.IndexIDMap(index)
        for article_instance in Article.objects.all():
            add_embedding_to_faiss(
                index, article_instance.embedding_vector, article_instance.id
            )
    return index
