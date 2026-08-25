import json

with open('MLS_Winner_Prediction (1).ipynb', 'r', encoding='utf-8') as f:
    nb = json.load(f)

cells = [c['source'] for c in nb['cells'] if c['cell_type'] == 'code']

with open('extract_data.py', 'w', encoding='utf-8') as f:
    for c in cells:
        f.write(''.join(c))
        f.write('\n\n')
