import logging
import re
from datetime import time

import openai
import tiktoken

from learning_resources.models import ContentFileEmbedding

CHUNK_SIZE = 8142
CHUNK_OVERLAP = 0
CHUNK_ADJUST = 50

log = logging.getLogger(__name__)


def num_tokens_from_string(string: str, encoding_name: str) -> int:
    """Return the number of tokens in a text string."""
    encoding = tiktoken.get_encoding(encoding_name)
    return len(encoding.encode(string))


def chunk_file_by_size(content, chunk_size=CHUNK_SIZE, chunk_adjust=CHUNK_ADJUST):
    page_text_chunks = []
    if num_tokens_from_string(content, "cl100k_base") > chunk_size:
        split = "@@@^^^".join(content.split(". ")).split("@@@^^^")
        chunkText = ""
        for sentence in split:
            stripped_sentence = sentence.strip()
            if len(stripped_sentence) == 0:
                continue
            sentence_tokens = num_tokens_from_string(stripped_sentence, "cl100k_base")
            if sentence_tokens > chunk_size:
                continue
            chunk_tokens = num_tokens_from_string(chunkText, "cl100k_base")
            if chunk_tokens + sentence_tokens > chunk_size:
                page_text_chunks.append(chunkText.strip())
                chunkText = ""
            if re.search("[a-zA-Z]", stripped_sentence[-1]):
                chunkText += stripped_sentence + ". "
            else:
                chunkText += stripped_sentence + " "
        page_text_chunks.append(chunkText.strip())
    else:
        page_text_chunks.append(content.strip())

    if len(page_text_chunks) > 2:  # noqa: PLR2004
        last_elem = num_tokens_from_string(page_text_chunks[-1], "cl100k_base")
        second_to_last_elem = num_tokens_from_string(
            page_text_chunks[-2], "cl100k_base"
        )
        if last_elem + second_to_last_elem < (chunk_size + chunk_adjust):
            page_text_chunks[-2] += page_text_chunks[-1]
            page_text_chunks.pop()

    return page_text_chunks


def embed_chunk(chunk):
    client = openai.OpenAI()
    response = client.embeddings.create(input=chunk, model="text-embedding-ada-002")
    return response.data[0].embedding


def make_contentfile_chunks(content_file, create_embeddings=False):  # noqa: FBT002
    content_file.embeddings.all().delete()
    if not content_file.content:
        return
    page_text_chunks = chunk_file_by_size(content_file.content)

    for chunk in page_text_chunks[:1]:
        embedding = None
        if create_embeddings:
            try:
                embedding = embed_chunk(chunk)
            except:  # noqa: E722
                time.sleep(5)
                try:
                    embedding = embed_chunk(content_file)
                except:  # noqa: E722
                    log.exception("Error creating embedding")
                    return
        ContentFileEmbedding.objects.create(
            content_file=content_file, text_chunk=chunk, embedding=embedding
        )
