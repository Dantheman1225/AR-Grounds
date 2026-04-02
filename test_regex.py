import re
tag = '<path d="M243.71,203.84c-2.58" style="fill: #fdfdfd;"/>'
x_match = re.search(r'd="[^\d-]*M?([-+]?\d*\.?\d+)', tag)
if x_match:
    print(x_match.group(1))
