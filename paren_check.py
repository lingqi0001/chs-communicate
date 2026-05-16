
import sys

def check_braces(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Simple state machine to ignore braces in comments and strings
    in_string = None # ' or " or `
    in_comment = None # // or /*
    brace_stack = []
    line_num = 1
    char_num = 0
    
    i = 0
    while i < len(content):
        char = content[i]
        char_num += 1
        
        if char == '\n':
            line_num += 1
            char_num = 0
            if in_comment == '//':
                in_comment = None
        
        if in_comment:
            if in_comment == '/*' and content[i:i+2] == '*/':
                in_comment = None
                i += 1
            i += 1
            continue
            
        if in_string:
            if char == '\\':
                i += 2
                continue
            if char == in_string:
                in_string = None
            i += 1
            continue
            
        # Check for strings
        if char in ("'", '"', '`'):
            in_string = char
            i += 1
            continue
            
        # Check for comments
        if content[i:i+2] == '//':
            in_comment = '//'
            i += 2
            continue
        if content[i:i+2] == '/*':
            in_comment = '/*'
            i += 2
            continue
            
        if char in ('{', '('):
            brace_stack.append((line_num, char_num, char))
        elif char in ('}', ')'):
            if not brace_stack or (char == '}' and brace_stack[-1][2] != '{') or (char == ')' and brace_stack[-1][2] != '('):
                print(f"Unexpected '}}' at line {line_num}, char {char_num}")
            else:
                brace_stack.pop()
        
        i += 1
        
    if brace_stack:
        for line, char in brace_stack:
            print(f"Unclosed '{{' opened at line {line}, char {char}")

if __name__ == "__main__":
    check_braces(sys.argv[1])
