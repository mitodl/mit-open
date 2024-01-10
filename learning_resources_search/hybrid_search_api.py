import logging

import numpy as np
from django.conf import settings
from opensearchpy import OpenSearch, RequestsHttpConnection

VECTOR_INDEX_NAME = "discussions_local_content_embedding_default"
TEXT_INDEX_NAME = "discussions_local_course_default"
MODEL_ID = "009xkowBA1OpIYkX_pNS"

log = logging.getLogger(__name__)


def normalize_bm25_formula(score, max_score):
    return score / max_score


def normalize_bm25(bm_results):
    hits = bm_results["hits"]["hits"]
    if not hits:
        return bm_results
    max_score = bm_results["hits"]["max_score"]
    for hit in hits:
        hit["_score"] = normalize_bm25_formula(hit["_score"], max_score)
    bm_results["hits"]["max_score"] = hits[0]["_score"]
    bm_results["hits"]["hits"] = hits
    return bm_results


def run_query(query, vector_boost_level=1.0, bm25_boost_level=1.0):
    os_client = get_client(f"http://{settings.OPENSEARCH_URL}")
    apu_request_body = {
        "size": 20,
        "query": {
            "neural_sparse": {
                "sparse_embedding": {
                    "query_text": query,
                    "model_id": MODEL_ID,
                    "max_token_score": 2.0,
                }
            }
        },
    }

    bm25_query = {"size": 20, "query": {"match": {"chunk": query}}}
    vector_search_results = os_client.search(
        body=apu_request_body, index=VECTOR_INDEX_NAME
    )
    bm25_results = os_client.search(body=bm25_query, index=VECTOR_INDEX_NAME)
    bm25_results = normalize_bm25(bm25_results)
    combined_results = interpolate_results(
        vector_search_results["hits"]["hits"], bm25_results["hits"]["hits"]
    )
    sorted_elements = apply_boost(
        combined_results, vector_boost_level, bm25_boost_level
    )

    result_data_dictionary = extract_results_data(
        vector_search_results["hits"]["hits"], bm25_results["hits"]["hits"]
    )
    return construct_response(result_data_dictionary, sorted_elements)


def extract_results_data(vector_data, bm25_data):
    result_data_dictionary = {}
    for vector_hit in vector_data:
        chunk_id = vector_hit["_source"]["id"]
        result_data_dictionary[chunk_id] = vector_hit
    for bm25_hit in bm25_data:
        chunk_id = vector_hit["_source"]["id"]
        result_data_dictionary[chunk_id] = bm25_hit
    return result_data_dictionary


def construct_response(result_data_dictionary, sorted_elements):
    return [
        result_data_dictionary[sorted_element]
        for sorted_element in sorted_elements
        if sorted_element in result_data_dictionary
    ]


def normalize_data(data):
    return data / np.linalg.norm(data, ord=2)


def get_client(server_url: str) -> OpenSearch:
    return OpenSearch(
        server_url,
        use_ssl=False,
        verify_certs=False,
        connection_class=RequestsHttpConnection,
    )


def get_min_score(common_elements, elements_dictionary):
    if len(common_elements):
        return min([min(v) for v in elements_dictionary.values()])
    else:
        # No common results - assign arbitrary minimum score value
        return 0.01


def interpolate_results(vector_hits, bm25_hits):  # noqa: C901
    # gather all product ids
    bm25_ids_list = []
    vector_ids_list = []
    for hit in bm25_hits:
        bm25_ids_list.append(hit["_source"]["id"])  # noqa: PERF401
    for hit in vector_hits:
        vector_ids_list.append(hit["_source"]["id"])  # noqa: PERF401
    # find common product ids
    common_results = set(bm25_ids_list) & set(vector_ids_list)
    results_dictionary = dict((key, []) for key in common_results)  # noqa: C402
    for common_result in common_results:
        for index, vector_hit in enumerate(vector_hits):  # noqa: B007
            if vector_hit["_source"]["id"] == common_result:
                results_dictionary[common_result].append(vector_hit["_score"])
        for index, BM_hit in enumerate(bm25_hits):  # noqa: B007
            if BM_hit["_source"]["id"] == common_result:
                results_dictionary[common_result].append(BM_hit["_score"])
    min_value = get_min_score(common_results, results_dictionary)
    # assign minimum value scores for all unique results
    for vector_hit in vector_hits:
        if vector_hit["_source"]["id"] not in common_results:
            new_scored_element_id = vector_hit["_source"]["id"]
            results_dictionary[new_scored_element_id] = [min_value]
    for BM_hit in bm25_hits:
        if BM_hit["_source"]["id"] not in common_results:
            new_scored_element_id = BM_hit["_source"]["id"]
            results_dictionary[new_scored_element_id] = [min_value]

    return results_dictionary


def apply_boost(combined_results, vector_boost_level, bm25_boost_level):
    for element in combined_results:
        if len(combined_results[element]) == 1:
            combined_results[element] = (
                combined_results[element][0] * vector_boost_level
                + combined_results[element][0] * bm25_boost_level
            )
        else:
            combined_results[element] = (
                combined_results[element][0] * vector_boost_level
                + combined_results[element][1] * bm25_boost_level
            )
    # sort the results based on the new scores
    return [
        k
        for k, v in sorted(
            combined_results.items(), key=lambda item: item[1], reverse=True
        )
    ]
