import os
import glob
import re
import json

def get_h1(content):
    m = re.search(r'<h1[^>]*>(.*?)</h1>', content, re.IGNORECASE | re.DOTALL)
    if m:
        # Strip internal tags like <br>, <em>
        return re.sub(r'<[^>]+>', '', m.group(1)).strip()
    return ""

def get_faqs(content):
    # faqs are in <details class="faq-item ...">
    # <summary>Q</summary>
    # <p>A</p>
    faqs = []
    blocks = re.findall(r'<details[^>]*faq-item[^>]*>(.*?)</details>', content, re.IGNORECASE | re.DOTALL)
    for block in blocks:
        q_m = re.search(r'<summary[^>]*>(.*?)</summary>', block, re.IGNORECASE | re.DOTALL)
        p_m = re.search(r'<p[^>]*>(.*?)</p>', block, re.IGNORECASE | re.DOTALL)
        if q_m and p_m:
            faqs.append({
                "question": q_m.group(1).strip(),
                "answer": p_m.group(1).strip()
            })
    return faqs

def build_breadcrumb(filepath, h1_text):
    # determine path relative to root
    rel_path = filepath.replace("\\", "/").replace("d:/Future Tech Companies/Grounds Maintenance Services/AR-Grounds/argrounds-website/argrounds-final/", "")
    
    parts = [p for p in rel_path.split("/") if p and p != "index.html"]
    
    items = [{
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://argrounds.com/"
    }]
    
    current_url = "https://argrounds.com"
    pos = 2
    for i, part in enumerate(parts):
        current_url += f"/{part}"
        name = part.replace("-", " ").title()
        
        # If it's the last part, we can use the H1 or a cleaner version
        if i == len(parts) - 1 and h1_text:
            name = h1_text
            
        # Hardcode top level hubs
        if part == "services":
            name = "Services"
        elif part == "learning-center":
            name = "Learning Center"
            
        items.append({
            "@type": "ListItem",
            "position": pos,
            "name": name,
            "item": current_url + "/"
        })
        pos += 1
        
    ld = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": items
    }
    return f'\n<script type="application/ld+json">\n{json.dumps(ld, indent=2)}\n</script>\n'

def build_faq(faqs):
    if not faqs: return ""
    
    entities = []
    for f in faqs:
        entities.append({
            "@type": "Question",
            "name": f["question"],
            "acceptedAnswer": {
                "@type": "Answer",
                "text": f["answer"]
            }
        })
        
    ld = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": entities
    }
    return f'\n<script type="application/ld+json">\n{json.dumps(ld, indent=2)}\n</script>\n'

base_dir = "d:/Future Tech Companies/Grounds Maintenance Services/AR-Grounds/argrounds-website/argrounds-final"
html_files = glob.glob(f'{base_dir}/**/*.html', recursive=True)

for filepath in html_files:
    if "thank-you" in filepath or "404" in filepath:
        continue
        
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Check if already has json-ld breadcrumb to avoid duplicates during testing
    if '"@type": "BreadcrumbList"' in content:
        continue
        
    rel_path = filepath.replace("\\", "/").replace(base_dir, "").lstrip("/")
    if rel_path == "index.html" or not rel_path:
        continue # skip home page
        
    h1 = get_h1(content)
    
    # 1. Breadcrumb
    breadcrumb_script = build_breadcrumb(filepath, h1)
    
    # 2. FAQ
    faqs = get_faqs(content)
    faq_script = build_faq(faqs)
    
    combined_scripts = breadcrumb_script + faq_script
    
    # Inject right before </head>
    new_content = content.replace("</head>", f"{combined_scripts}</head>")
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Added structured data to {rel_path}")
