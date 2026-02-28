from typing import List
import numpy as np


def get_embeddings(texts: List[str], model_name: str = "all-MiniLM-L6-v2") -> np.ndarray:
    try:
        from sentence_transformers import SentenceTransformer
    except Exception:
        raise RuntimeError("sentence-transformers required for embeddings. Install via requirements.txt")
    model = SentenceTransformer(model_name)
    emb = model.encode(texts, convert_to_numpy=True, show_progress_bar=False)
    return emb


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    # a and b are 1-D arrays
    from numpy.linalg import norm

    if a is None or b is None:
        return 0.0
    denom = (norm(a) * norm(b))
    if denom == 0:
        return 0.0
    return float(np.dot(a, b) / denom)


def batch_cosine_similarity(mat_a: np.ndarray, mat_b: np.ndarray):
    # returns matrix of similarities
    from sklearn.metrics.pairwise import cosine_similarity as sk_cos

    return sk_cos(mat_a, mat_b)