def remove_child_queries(query):
    if isinstance(query, dict):
        if "has_child" in query:
            del query["has_child"]
            if len(query.keys()) == 0:
                return None
        new_query_dict = query.copy()
        for key, value in query.items():
            new_val = remove_child_queries(value)
            if new_val:
                new_query_dict[key] = new_val
            else:
                del new_query_dict[key]
        query = new_query_dict
    elif isinstance(query, list):
        new_query = []
        for item in query:
            stripped = remove_child_queries(item)
            if stripped:
                new_query.append(stripped)
        if len(new_query) > 0:
            query = new_query
        else:
            return None
    return query
