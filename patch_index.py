import sys
import re

filepath = r'c:\Users\moss\Desktop\CHScommunicate\index.html'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace view.js and chat.js query parameters dynamically using regex
content_new, count_view = re.subn(r'"\./js/view\.js": "\./js/view\.js\?v=[^"]+"', '"./js/view.js": "./js/view.js?v=20260610-1026"', content)
content_new, count_chat = re.subn(r'"\./js/chat\.js": "\./js/chat\.js\?v=[^"]+"', '"./js/chat.js": "./js/chat.js?v=20260610-1026"', content_new)
content_new, count_chat_comma = re.subn(r',"\./js/chat\.js": "\./js/chat\.js\?v=[^"]+"', ',"./js/chat.js": "./js/chat.js?v=20260610-1026"', content_new)
content_new = content_new.replace('style.css?v=12', 'style.css?v=13')

if count_view == 0 and count_chat == 0 and count_chat_comma == 0:
    print("Warning: No regex matches found for view.js or chat.js in import map.")

if content == content_new:
    print("Error: No replacements were made in index.html! Confirm if index.html contains import map.")
    sys.exit(1)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content_new)

print("Successfully patched index.html with new cache busters.")
