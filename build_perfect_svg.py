import os
import re

# Read the ORIGINAL SVG
orig_path = r'd:\Future Tech Companies\Grounds Maintenance Services\AR-Grounds\Brand Media\Land Scape Banner SVG code.svg'
with open(orig_path, 'r', encoding='utf-8') as f:
    svg = f.read()

# We want the text to be #ffffff (white).
# The original SVG creates text by cutting it OUT of #fdfdfd (the bounding box), 
# OR by drawing explicit shapes as #23432c (dark green).
# ALSO, the inner loops of the letters are filled with #fdfdfd OR #23432c.
# We will use the native fill-rule="evenodd" which mathematically perfectly works if the bounding box is removed!
# But wait, we proved "evenodd" did NOT work because the SVG has duplicate shapes stacking!

# Let's fix this mathematically perfectly. 
# We'll just define all the "dark green" parts to #ffffff
# AND we define all the "off white" parts (#fdfdfd) to #ffffff.
# This makes the ENTIRE banner a single flat white shape!
# BUT wait! If the entire banner is flat white... 
# The inner loops will be flat white, the text will be flat white, the bounding box will be flat white!

# So the true robust fix is: we replace `#fdfdfd` (the background box) with `transparent`. 
# WAIT. If we replace `#fdfdfd` with `transparent`, the text cutouts (holes) show the transparent background (they disappear!).
# And if we replace `#fdfdfd` with '#1a1a16', it becomes exactly the footer color.

# Let's just inject the FOOTER COLOR! This is the most bulletproof visual trick since it's pixel perfect!
# 1. Background box and hole cutouts: #fdfdfd -> #1a1a16 (footer color)
# 2. Explicit loop overlays: #23432c -> #ffffff
# 3. Explicit text layers: #23432c -> #ffffff
# WAIT! If the background box `#fdfdfd` becomes `#1a1a16`, 
# then the holes cut OUT of the background box will show the real footer (#1a1a16). 
# So the holes are #1a1a16, and the box is #1a1a16. It's invisible!

# Actually, if I just run a simple HTML+CSS solution!
# What if we just parse the original SVG, grab all paths, and force them into a <mask id="mask">?
# Masking is difficult if some paths are meant to be holes and some are overlays.
