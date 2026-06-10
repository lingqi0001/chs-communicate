import re
import os

def patch_view_js():
    filepath = 'js/view.js'
    with open(filepath, 'rb') as f:
        content = f.read().decode('utf-8', errors='ignore')
    
    # 1. Add import at the top
    import_str = "import { LiquidGlassEffect } from './liquid-glass.js?v=20260610-1028';\n\n"
    if "import { LiquidGlassEffect }" not in content:
        content = import_str + content
    else:
        # Update existing import
        content = re.sub(
            r"import\s+\{\s*LiquidGlassEffect\s*\}\s+from\s+['\"]./liquid-glass\.js(?:\?v=[^'\"]+)?['\"];",
            "import { LiquidGlassEffect } from './liquid-glass.js?v=20260610-1028';",
            content
        )
    
    # 2. Add initialization in init function
    # Look for this.initNavigation(); with optional comment and trailing characters
    init_pattern = r"(init:\s*function\s*\(\s*\)\s*\{[^}]*?this\.initNavigation\(\);[^\n]*)"
    
    initialization_code = """
        // Initialize Liquid Glass effect on bottom navigation bar
        try {
            const bottomNav = document.getElementById('bottomNav');
            if (bottomNav) {
                console.log("ViewModule: Initializing bottomNav liquid glass...");
                new LiquidGlassEffect(bottomNav, {
                    radius: 36,            // matches 72px height (rounded-full)
                    refractionWidth: 14,   // bevel width
                    maxDisplacement: 8,    // warp strength
                    mouseRadius: 65,       // hover ripple size
                    mouseStrength: 5       // hover ripple push force
                });
                console.log("ViewModule: bottomNav liquid glass initialized successfully");
            } else {
                console.warn("ViewModule: bottomNav element not found in DOM");
            }
        } catch (e) {
            console.error("ViewModule: Error initializing bottomNav liquid glass:", e);
        }

        // Initialize Liquid Glass effect on bottom navigation active pill
        try {
            const bottomNavActivePill = document.getElementById('bottomNavActivePill');
            if (bottomNavActivePill) {
                console.log("ViewModule: Initializing bottomNavActivePill liquid glass...");
                new LiquidGlassEffect(bottomNavActivePill, {
                    radius: 28,            // matches 56px height (rounded-full)
                    refractionWidth: 8,    // bevel width
                    maxDisplacement: 4,    // warp strength
                    mouseRadius: 40,       // hover ripple size
                    mouseStrength: 3       // hover ripple push force
                });
                console.log("ViewModule: bottomNavActivePill liquid glass initialized successfully");
            } else {
                console.warn("ViewModule: bottomNavActivePill element not found in DOM");
            }
        } catch (e) {
            console.error("ViewModule: Error initializing bottomNavActivePill liquid glass:", e);
        }

        // Initialize Liquid Glass effect on tab search button
        try {
            const tabBtnSearch = document.getElementById('tabBtn-search');
            if (tabBtnSearch) {
                console.log("ViewModule: Initializing tabBtn-search liquid glass...");
                new LiquidGlassEffect(tabBtnSearch, {
                    radius: 36,            // matches 72px height (rounded-full)
                    refractionWidth: 14,   // bevel width
                    maxDisplacement: 8,    // warp strength
                    mouseRadius: 65,       // hover ripple size
                    mouseStrength: 5       // hover ripple push force
                });
                console.log("ViewModule: tabBtn-search liquid glass initialized successfully");
            } else {
                console.warn("ViewModule: tabBtn-search element not found in DOM");
            }
        } catch (e) {
            console.error("ViewModule: Error initializing tabBtn-search liquid glass:", e);
        }"""
    
    if "Initializing bottomNav liquid glass..." not in content:
        match = re.search(init_pattern, content)
        if match:
            matched_str = match.group(1)
            content = content.replace(matched_str, matched_str + initialization_code)
            print("Successfully added initialization to view.js")
        else:
            # Try a broader search for initNavigation
            init_nav_pos = content.find("this.initNavigation();")
            if init_nav_pos != -1:
                end_line_pos = content.find("\n", init_nav_pos)
                matched_str = content[init_nav_pos:end_line_pos]
                content = content.replace(matched_str, matched_str + initialization_code)
                print("Successfully added initialization to view.js (fallback match)")
            else:
                print("Error: Could not find initNavigation() in view.js!")
    else:
        print("Initialization already present in view.js")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

def patch_chat_js():
    filepath = 'js/chat.js'
    with open(filepath, 'rb') as f:
        content = f.read().decode('utf-8', errors='ignore')
    
    # Update import cache buster
    content_new = re.sub(
        r"import\s+\{\s*LiquidGlassEffect\s*\}\s+from\s+['\"]./liquid-glass\.js(?:\?v=[^'\"]+)?['\"];",
        "import { LiquidGlassEffect } from './liquid-glass.js?v=20260610-1028';",
        content
    )
    if content != content_new:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content_new)
        print("Successfully updated chat.js import cache buster")
    else:
        print("chat.js import cache buster already updated or match failed")

def patch_index_html():
    filepath = 'index.html'
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace view.js and chat.js in import map
    content_new = re.sub(
        r'"\./js/view\.js": "\./js/view\.js\?v=[^"]+"',
        '"./js/view.js": "./js/view.js?v=20260610-1028"',
        content
    )
    content_new = re.sub(
        r'"\./js/chat\.js": "\./js/chat\.js\?v=[^"]+"',
        '"./js/chat.js": "./js/chat.js?v=20260610-1028"',
        content_new
    )
    content_new = re.sub(
        r',"\./js/chat\.js": "\./js/chat\.js\?v=[^"]+"',
        ', "./js/chat.js": "./js/chat.js?v=20260610-1028"',
        content_new
    )
    # Also replace style.css if it's there
    content_new = re.sub(
        r'style\.css\?v=\d+',
        'style.css?v=20260610-1028',
        content_new
    )
    
    if content != content_new:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content_new)
        print("Successfully patched index.html import map")
    else:
        print("index.html import map already updated or match failed")

if __name__ == '__main__':
    patch_view_js()
    patch_chat_js()
    patch_index_html()
