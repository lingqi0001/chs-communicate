import os

view_js_path = 'js/view.js'

with open(view_js_path, 'rb') as f:
    content = f.read().decode('utf-8', errors='ignore')

# 1. Add the import at the top
import_str = "import { LiquidGlassEffect } from './liquid-glass.js';\n\n"
if "import { LiquidGlassEffect }" not in content:
    content = import_str + content

replacement_init = """this.initNavigation(); // 启动返回键拦截

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

# 2. Add the initialization code
target_init = "this.initNavigation(); // 启动返回键拦截"
if target_init in content:
    content = content.replace(target_init, replacement_init)
    with open(view_js_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("SUCCESS: js/view.js successfully patched!")
else:
    # Try matching without comment space variation
    target_init_fallback = "this.initNavigation();"
    if target_init_fallback in content:
        content = content.replace(target_init_fallback, replacement_init)
        with open(view_js_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("SUCCESS: js/view.js successfully patched with fallback!")
    else:
        print("ERROR: target_init not found in js/view.js!")
