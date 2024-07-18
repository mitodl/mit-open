# Topic Data

We manage topic data through a yaml file that is kept in this folder. The file gets committed to the repo. You should generally _not_ change the topic data here - instead, make changes, roll them into a migration in the `data_fixtures` app, and apply them there. This will ensure the changes get made on RC and production as well.

## Data format

The yaml file is structured like this:

```yaml
---
topics:
  - name: the name of the topic
    id: the ID for the topic
    icon:
      the Remixicon that we should use for the topic (ideally, the React version
      - ex RiPaletteLine)
    mappings:
      offeror_code:
        - offeror topic
        - other offeror topic
    children:
      - name: the name of the topic
        id: the ID for the topic
        icon:
          the Remixicon that we should use for the topic (ideally, the React version
          - ex RiPaletteLine)
        mappings:
          offeror_code:
            - offeror topic
            - other offeror topic
        children: []
```

Children use the same format as the items under `topics`.

## Transforming topic maps

We generally work with topic data through csv files (for use in Google Sheets, etc.). The format we typically use for that is:

```csv
Offeror Topic Name,Open Topic Name 1,Open Topic Name 2
```

This script will translate and create a new `topics.yaml` file with the changes:

```python
import csv
import yaml
from pathlib import Path

def _process_topic(topic, offeror_code):
	if not topic["mappings"]:
		topic["mappings"] = {}

	if not topic["mappings"] or offeror_code not in topic["mappings"]:
		topic["mappings"][offeror_code] = []

	for csv_topic in csv_data:
		if (topic["name"] == csv_topic[1] or topic["name"] == csv_topic[2]) and csv_topic[0] not in topic["mappings"][offeror_code]:
			topic["mappings"][offeror_code].append(csv_topic[0].strip())

	if "children" in topic and topic["children"] and len(topic["children"]) > 0:
		for child_topic in topic["children"]:
			_process_topic(child_topic, offeror_code) if child_topic else None

def process_topics(topics_file_loc, csv_loc, offeror_code, output_location):
	with Path(topics_file_loc).open() as yaml_input_file:
	    topic_data = yaml.safe_load(yaml_input_file.read())

	with Path(csv_loc).open() as csv_file:
	    csv_reader = csv.reader(csv_file)
	    csv_data = []
	    for data in csv_reader:
	        csv_data.append(data)

	for topic in topic_data["topics"]:
	    _process_topic(topic, offeror_code)

	with Path(output_location).open("w") as yaml_output_file:
		yaml.dump(topic_data, yaml_output_file)
```

You can open a Django shell or a notebook and paste that in, then run `process_topics()` to process your datafile. The result of this will be written to the output location specified.

> [!IMPORTANT]
> You'll need to queue up a migration in the `data_fixtures` app to import the new data. In addition, this will include _all_ topic data, not just a delta. If you want a delta, then you'll need to make some modifications to the code.

Headers in the CSV files don't matter because they just won't map to a topic, so they'll get skipped naturally.

## Loading changes

Use the `data_fixtures` app. Create a migration there that calls `RunPython` and calls one of the upsert functions (both in `learning_resources/utils.py`):

- `upsert_topic_data_file` - if you've got an external file of changes
- `upsert_topic_data_string` - if you've got a string instead

## In tests

If you're working with tests that require topic data to be there, it's best to run the `upsert_topic_data_file` to get the baseline topics in place. Depending on your test, you may need to add or remove topic mappings. The `data_fixtures` migrations don't necessarily run in the test environment.
