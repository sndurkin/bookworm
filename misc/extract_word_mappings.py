# This file is used to extract words from the phonics dictionary csv file
# in this same directory and output a json file with the word as the key
# and the value is a list of grapheme-phoneme mappings.
#
# The dictionary comes from: https://github.com/techczech/phonicsengine

import csv
import json


def write_file(data, output_file):
    with open(output_file, 'w', encoding='utf-8') as file:
        json.dump(data, file, ensure_ascii=False, indent=2)

def extract_mappings(file_name):
    word_mapping = {}

    # Open the file and read it as a tab-delimited file
    with open(file_name, 'r', encoding='utf-8') as file:
        reader = csv.reader(file, delimiter='\t')

        # Process each row
        for row in reader:
            word = row[0]  # The word (e.g., 'AIDS', 'AM', 'African')
            grapheme_phoneme_str = row[3]  # The grapheme-phoneme mapping (e.g., 'ai-eɪ,d-d,s-z')

            # Split grapheme-phoneme pairs by commas and then by '-'
            grapheme_phoneme_list = []
            for pair in grapheme_phoneme_str.split(','):
                if pair == '' or pair == 'NULL':
                    continue

                try:
                    grapheme, phoneme = pair.split('-', 1)
                except Exception as e:
                    print(f"Failed on: '{pair}' in '{row}'")
                    raise e
                grapheme_phoneme_list.append({
                    'grapheme': grapheme,
                    'phoneme': phoneme,
                })

            # Add to the word mapping
            if len(grapheme_phoneme_list) > 0:
                word_mapping[word] = grapheme_phoneme_list

    return word_mapping

mappings = extract_mappings('phonics_engine_dictionary_english-v 7.csv')

keys_list = sorted(mappings.keys())
for key in keys_list:
    print(key)

print(f"Extracted {len(mappings)} words")

# Print the result
write_file(mappings, 'word_mappings.json')
