import os

def replace_in_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        if 'improving-ocean-jewelry-telephony.trycloudflare.com' in content:
            content = content.replace('improving-ocean-jewelry-telephony.trycloudflare.com', 'tourtravel.yber.in')
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Replaced in {filepath}")
    except Exception as e:
        pass

for root, dirs, files in os.walk('.'):
    if 'node_modules' in root or '.git' in root or '.next' in root:
        continue
    for file in files:
        if file.endswith('.js') or file.endswith('.mjs') or file == '.env':
            replace_in_file(os.path.join(root, file))
