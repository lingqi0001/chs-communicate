with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip = False
for line in lines:
    if 'window.openGradeCalculator = () => {' in line:
        skip = True
    elif 'let lastIsMobile =' in line and skip:
        skip = False
    
    if '<div id="gradeCalculatorPage"' in line and not skip:
        skip = True
    elif '<!-- Database Admin Console -->' in line and skip:
        skip = False
        new_lines.append(line)
        continue

    if not skip:
        new_lines.append(line)

with open('index.html', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
