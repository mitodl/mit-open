INSERT INTO learning_resources_learningresourceofferor (created_on, updated_on, code, name, professional)
SELECT (data ->> 'created_on')::timestamptz AS created_on,
       (data ->> 'updated_on')::timestamptz AS updated_on,
       (data ->> 'code')::text AS code,
       (data ->> 'name')::text AS name,
       (data ->> 'professional')::boolean AS professional
FROM jsonb_array_elements('[
  {
    "created_on": "2024-01-01",
    "updated_on": "2024-01-01",
    "code": "mitx",
    "name": "MITx",
    "professional": false
  }
]'::jsonb) AS item(data);

INSERT INTO learning_resources_learningresource (id, created_on, updated_on, readable_id, title, description, published, resource_type, etl_source, professional, offered_by_id)
SELECT (data ->> 'id')::integer AS id,
       (data ->> 'created_on')::timestamptz AS created_on,
       (data ->> 'updated_on')::timestamptz AS updated_on,
       (data ->> 'readable_id')::text AS readable_id,
       (data ->> 'title')::text AS title,
       (data ->> 'description')::text AS description,
       (data ->> 'published')::boolean AS published,
       (data ->> 'resource_type')::text AS resource_type,
       (data ->> 'etl_source')::text AS etl_source,
       (data ->> 'professional')::boolean AS professional,
       (data ->> 'offered_by_id')::text AS offered_by_id
FROM jsonb_array_elements('[
  {
    "id": 100000,
    "created_on": "2024-01-01",
    "updated_on": "2024-01-01",
    "readable_id": "test-100000",
    "title": "Test 100000",
    "description": "Description",
    "published": true,
    "resource_type": "program",
    "etl_source": "micromasters",
    "professional": false,
    "offered_by_id": "mitx"
  }
]'::jsonb) AS item(data);
