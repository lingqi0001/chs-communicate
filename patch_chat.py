import os

filepath = r"c:\Users\moss\Desktop\CHScommunicate\js\chat.js"
with open(filepath, "rb") as f:
    content = f.read()

# Replace block 1:
# We will do replacement using bytes directly to avoid any line ending translation issues.
target1 = b"isDisbanded = !!" + b"safeGetIsSyncDone() && !(getCnCache()[classId]);"
replacement1 = b"isDisbanded = !!" + b"safeGetIsSyncDone() && !(AppModules.Sync.existingClassIds && AppModules.Sync.existingClassIds[classId]);"

target2 = b"isRemoved = !!" + b"safeGetIsSyncDone() && !(safeGetSidebarClasses()[classId]);"
replacement2 = b"isRemoved = !!" + b"safeGetIsSyncDone() && !isDisbanded && !(safeGetSidebarClasses()[classId]);"

# In the original file, target3 is statusEl.innerText = ctCache[classId] || "Group Chat";
# Let's replace it with the new condition. We must ensure we match the correct indentation and carriage returns.
# Let's detect the line endings:
if b"\r\n" in content:
    newline = b"\r\n"
else:
    newline = b"\n"

target3 = b'statusEl.innerText = ctCache[classId] || "Group Chat";'
replacement3 = b'if (isDisbanded) {' + newline + \
               b'                statusEl.innerText = "Class disbanded";' + newline + \
               b'            } else if (isRemoved) {' + newline + \
               b'                statusEl.innerText = "You have been removed from this chat";' + newline + \
               b'            } else {' + newline + \
               b'                statusEl.innerText = ctCache[classId] || "Group Chat";' + newline + \
               b'            }'

if target1 in content:
    content = content.replace(target1, replacement1)
    print("Target 1 replaced.")
else:
    print("Target 1 not found!")

if target2 in content:
    content = content.replace(target2, replacement2)
    print("Target 2 replaced.")
else:
    print("Target 2 not found!")

if target3 in content:
    content = content.replace(target3, replacement3)
    print("Target 3 replaced.")
else:
    print("Target 3 not found!")

with open(filepath, "wb") as f:
    f.write(content)
print("Binary patch complete.")
