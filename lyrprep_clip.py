import sys
import os
import re
import pyperclip

def process_lrc_file(input_path):
    # Read the input file and remove empty lines
    with open(input_path, 'r', encoding='utf-8') as file:
        lines = file.readlines()
    
    # Remove empty lines and strip whitespace
    lines = [line.strip() for line in lines if line.strip()]
    
    # Process each line
    processed_lines = []
    for line in lines:
        # Remove first 11 characters
        line = line[11:] if len(line) > 11 else ''
        
        # Skip empty lines
        if not line.strip():
            continue
            
        # Make first letter of words after '(' uppercase
        line = re.sub(r'\(\s*([a-z])', lambda x: '(' + x.group(1).upper(), line)
        
        # Split on " (" and remove both parentheses
        parts = line.split(' (')
        processed_parts = []
        for part in parts:
            # Remove both parentheses
            part = part.replace('(', '').replace(')', '')
            
            # Check if line ends with a dash (lyric cut-off)
            if part.endswith('-'):
                part = part[:-1] + '—'  # Replace ending dash with em dash
            else:
                # Replace dashes with "-\" only for non-ending dashes
                part = part.replace('-', '-\\')
            
            # Replace spaces with "\\ \\"
            part = part.replace(' ', '\\ \\')
            processed_parts.append(part)
        
        # Join with newlines
        processed_line = '\n'.join(processed_parts)
        processed_lines.append(processed_line)
    
    # Join all processed lines
    result = '\n'.join(processed_lines)
    
    # Copy result to clipboard
    pyperclip.copy(result)
    print("Processed text copied to clipboard!")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: drag and drop a .lrc file onto this script")
        sys.exit(1)
    
    input_file = sys.argv[1]
    if not os.path.exists(input_file):
        print(f"Error: File not found: {input_file}")
        sys.exit(1)
    
    if not input_file.lower().endswith('.lrc'):
        print(f"Error: Only .lrc files are supported. Got: {input_file}")
        sys.exit(1)
    
    process_lrc_file(input_file)