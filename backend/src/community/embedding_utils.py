from decouple import config
from .models import Article
from openai import OpenAI
import numpy as np
import faiss

client = OpenAI(api_key=config("OPENAI_API_KEY"))


def get_embedding(text, model="text-embedding-3-small"):
    text = text.replace("\n", " ")
    return client.embeddings.create(input=[text], model=model).data[0].embedding


def calculate_similarity(vector_1, vector_2):
    return np.dot(vector_1, vector_2) / (
        np.linalg.norm(vector_1) * np.linalg.norm(vector_2)
    )


def update_preference_vector(user_embeddings, article_embedding, alpha=0.1):
    user_embeddings = np.array(user_embeddings)
    article_embedding = np.array(article_embedding)
    return ((1 - alpha) * user_embeddings + alpha * article_embedding).tolist()


def add_embedding_to_faiss(index, article_embedding, article_id):
    article_embedding = np.array([article_embedding])
    article_id = np.array([article_id])
    index.add_with_ids(article_embedding, article_id)
    faiss.write_index(index, "index.idx")


def search_similar_embeddings(index, embedding, k=100):
    _, ids = index.search(np.array([embedding]), k=k)
    return ids[0]


def reset_faiss(index):
    index.reset()
    for article_instance in Article.objects.all():
        add_embedding_to_faiss(
            index, article_instance.embedding_vector, article_instance.id
        )


def get_faiss_index():
    try:
        index = faiss.read_index("index_file.idx")
    except Exception:
        index = faiss.IndexFlatL2(1536)
        index = faiss.IndexIDMap(index)
        for article_instance in Article.objects.all():
            add_embedding_to_faiss(
                index, article_instance.embedding_vector, article_instance.id
            )
    return index
