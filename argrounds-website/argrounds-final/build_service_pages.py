import os

pages_data = [
    {
        "slug": "driveway-cleaning",
        "title": "Driveway Cleaning in Little Rock | Grounds Maintenance",
        "desc": "Learn what driveway cleaning is, what it removes, who it's for, and how to book Grounds Maintenance for professional concrete cleaning service in Little Rock.",
        "h1": "Professional Driveway Cleaning for Homes and Small Businesses",
        "intro": "Lift years of dirt, algae, and surface grime off your concrete and instantly make your property look cleaner, brighter, and more welcoming.",
        "quick_answer": {
            "what": "High-pressure concrete washing with specialized pre-treatments.",
            "removes": "Motor oil stains, tire marks, mold, mildew, and black algae.",
            "who": "Homeowners prepping to sell, small businesses needing a clean entrance, or anyone combating slippery surfaces."
        },
        "cleans_list": ["Standard concrete driveways", "Parking pads and carports", "Apron areas near the street", "Lightly stained concrete", "Curb edges and borders"],
        "why_book": ["Dramatically better curb appeal", "Less slippery, dangerous buildup", "Cleaner entrance to the home (saving interior floors)", "Great first impression for guests or buyers"],
        "faqs": [
            ("What is the difference between pressure washing and power washing my driveway?", "Power washing adds heat to the high-pressure water, which is better for extremely greasy stains. For standard concrete driveways, high pressure combined with the right chemical pretreatment is highly effective and usually what people refer to as pressure washing."),
            ("Will this remove black algae and tire marks?", "Yes. Black algae (Gloeocapsa Magma) is destroyed by our pre-treatment, and standard tire marks lift easily. Deeply soaked older oil stains may leave a shadow, but we dramatically lighten them."),
            ("Is high-pressure washing safe for old or cracked concrete?", "We always inspect the concrete first. If it's structurally sound but old, we can adjust our pressure. If it's heavily spalling or degraded, we switch to a softer low-pressure chemical clean to avoid damage."),
            ("How long does driveway cleaning usually take?", "A standard two-car driveway typically takes 1.5 to 2 hours from setup to final rinse."),
            ("How often should my concrete driveway be cleaned?", "For most residential properties in Central Arkansas, once a year keeps algae at bay and maintains top curb appeal.")
        ],
        "image_placeholder": "/assets/gallery/Driveway Before.webp"
    },
    {
        "slug": "sidewalk-walkway-cleaning",
        "title": "Sidewalk & Walkway Cleaning in Little Rock | Grounds Maintenance",
        "desc": "Learn what sidewalk cleaning is, what it removes, who it's for, and how to book Grounds Maintenance for walkway washing service in Little Rock.",
        "h1": "Professional Sidewalk & Walkway Cleaning for Homes and Small Businesses",
        "intro": "Brighten up your home's entrance and eliminate slippery organic growth with our thorough sidewalk and walkway cleaning services.",
        "quick_answer": {
            "what": "Targeted surface cleaning for public sidewalks and residential pathways.",
            "removes": "Algae, mud, gum, dirty drip lines, and slippery green growth.",
            "who": "Homeowners association compliance, city-facing businesses, and homeowners."
        },
        "cleans_list": ["Public-facing city sidewalks", "Front door walkways", "Side-of-house pathways", "Brick, concrete, and stone step lead-ups", "Community paths"],
        "why_book": ["Eliminates severe slip-and-fall hazards", "Boosts front yard contrast against grass", "Keeps neighborhood associations happy", "Less dirt tracked into your home's foyer"],
        "faqs": [
            ("Why do my sidewalks turn dark green or black?", "Walkways are prone to holding moisture, creating a perfect breeding ground for algae and mold. Over time, this organic matter layers, turning green and eventually black."),
            ("Can you clean stamped or decorative concrete walkways?", "Yes. We lower the pressure and rely more on our specialized detergents to safely lift dirt without chipping or damaging decorative finishes."),
            ("Does cleaning the sidewalk actually improve property value?", "While it doesn't increase appraised value directly, it drastically improves perceived value and 'curb appeal'—making it a huge factor for homes going on the market."),
            ("How often do walkways need to be pressure washed?", "Every 6 to 12 months, depending heavily on shade cover and nearby trees which drop sap and debris."),
            ("Will your cleaning process damage surrounding grass or landscaping?", "No. We thoroughly pre-soak and post-rinse surrounding vegetation and use environmentally conscious dilutions to ensure your plants stay healthy.")
        ],
        "image_placeholder": "/assets/gallery/Front Door Before.webp"
    },
    {
        "slug": "patio-paver-cleaning",
        "title": "Patio & Paver Cleaning in Little Rock | Grounds Maintenance",
        "desc": "Learn what patio cleaning is, what it removes, who it's for, and how to book Grounds Maintenance for paver cleaning service in Little Rock.",
        "h1": "Professional Patio & Paver Cleaning for Homes and Small Businesses",
        "intro": "Reclaim your outdoor living space. We remove algae, moss, and weather stains from patios and pavers to give you a pristine backyard oasis.",
        "quick_answer": {
            "what": "A precision clean designed for outdoor living and entertainment spaces.",
            "removes": "Mildew, food/drink spills, embedded dirt, and light weed growth in joints.",
            "who": "Homeowners prepping for spring/summer gatherings or pool openings."
        },
        "cleans_list": ["Standard concrete patios", "Brick paver courtyards", "Pool decks and surrounds", "Stamped concrete lounge areas", "Stone terraces"],
        "why_book": ["Creates a clean, inviting outdoor space", "Prevents algae transfer to bare feet and pool water", "Extends the life of costly hardscapes", "Readies the space for summer furniture and grills"],
        "faqs": [
            ("Can you pressure wash patio pavers without blowing out the joint sand?", "Yes. We use a wide fan spray at an angle to clean the paver face while minimizing sand loss. Sand naturally degrades, but we are careful not to actively excavate it."),
            ("What causes moss and weeds to grow between pavers?", "Wind blows dirt and organic matter into the joints over time. Moisture settles there, creating an ideal tiny garden bed for moss and weeds."),
            ("Is soft washing better than pressure washing for delicate patios?", "Absolutely. For delicate stone or older pavers, our soft wash process utilizes cleaning agents to dissolve grime safely without high pressure."),
            ("Will this remove rust or grill grease stains from my patio?", "We have specialized degreasers and rust removers. Grill grease usually lifts incredibly well. Severe rust may require a multi-step acid treatment but can be significantly reduced."),
            ("Do I need to move my outdoor furniture before you arrive?", "We ask that you clear smaller items like toys, cushions, and potted plants. We can generally work around heavy tables or grills if necessary.")
        ],
        "image_placeholder": "/assets/gallery/Driveway 2 Before.webp"
    },
    {
        "slug": "deck-cleaning",
        "title": "Deck Cleaning in Little Rock | Grounds Maintenance",
        "desc": "Learn what deck cleaning is, what it removes, who it's for, and how to book Grounds Maintenance for safe wood and composite deck cleaning service in Little Rock.",
        "h1": "Professional Deck Cleaning for Homes and Small Businesses",
        "intro": "Safely restore the natural beauty of your wood or composite deck. We eliminate grey weathering, algae, and mildew without splintering the surface.",
        "quick_answer": {
            "what": "A low-pressure, chemical-first wood and composite restoration service.",
            "removes": "Grey UV weathering, green algae, black mildew spots, and surface grime.",
            "who": "Homeowners who want to preserve their deck or prepare it for a fresh stain."
        },
        "cleans_list": ["Treated pine lumber decks", "Cedar and hardwood decking", "Composite decks (Trex, TimberTech)", "Wooden handrails and spindles", "Built-in seating"],
        "why_book": ["Restores original wood color and grain", "Prevents premature rotting and wood decay", "Makes composite decks look factory-new", "Crucial first step before staining or sealing"],
        "faqs": [
            ("Is pressure washing safe for wood decks?", "Only if done correctly. High pressure will easily splinter and fur wood. We use specialized wood cleaners and brighteners, followed by a gentle, low-pressure rinse."),
            ("Do you clean composite decking like Trex?", "Yes. Composite decks are highly susceptible to black mold spots forming in the artificial grain. Our soft wash process eliminates these spots safely without voiding the manufacturer warranty."),
            ("Can you clean my deck to prepare it for a fresh coat of stain?", "Yes, this is one of our most popular requests. We strip away standard organics and open the pores of the wood using a brightener so it's perfectly prepped to accept new stain."),
            ("Why is my deck turning green or grey?", "The green is algae thriving in the damp, shaded areas. The grey is UV damage from the sun oxidizing the top layer of wood fibers. We remove both."),
            ("How soon after cleaning can we use the deck again?", "You can typically walk on it safely in a few hours. If you are staining, you must wait 24-48 dry hours for the wood moisture content to drop.")
        ],
        "image_placeholder": "/assets/gallery/Driveway 2 After.webp"
    },
    {
        "slug": "fence-cleaning",
        "title": "Fence Cleaning in Little Rock | Grounds Maintenance",
        "desc": "Learn what fence cleaning is, what it removes, who it's for, and how to book Grounds Maintenance for wood and vinyl fence washing service in Little Rock.",
        "h1": "Professional Fence Cleaning for Homes and Small Businesses",
        "intro": "Revitalize your property boundaries. We safely wash away mold, algae, and dirt from wood and vinyl fences, extending their lifespan and looks.",
        "quick_answer": {
            "what": "Soft washing for long boundary lines to restore vibrant color.",
            "removes": "Green algae blooms, grey oxidation, dirt kick-up, and mud splatters.",
            "who": "Property owners dealing with unsightly boundaries or HOA warning letters."
        },
        "cleans_list": ["White PVC/Vinyl privacy fencing", "Classic wooden picket fences", "Board-on-board privacy fences", "Metal and chain-link boundaries", "Brick perimeter walls"],
        "why_book": ["Brightens the entire perimeter of the yard", "Prevents algae from eating into wooden boards", "Much cheaper than replacing a dingy fence", "Restores the crisp white look of vinyl fencing"],
        "faqs": [
            ("Can you pressure wash both wood and white vinyl fences?", "We clean both, but with different methods. Vinyl requires a soft wash with detergents to melt away algae. Wood requires a specialized cleaner and a gentle rinse to avoid splintering."),
            ("Will cleaning my wood fence make it look new again?", "It is often shocking how much it helps. While we can't reverse physical rot or warping, removing the grey oxidation layer reveals the beautiful original wood tones hidden beneath."),
            ("Can fence cleaning remove hard water rust stains from sprinklers?", "Standard washing won't remove hard water iron stains. However, we can apply a specialized rust removal treatment to tackle orange sprinkler stains on vinyl fences."),
            ("Is fence washing necessary before applying a new stain or paint?", "Absolutely. Painting or staining over dirt and algae guarantees the new finish will peel and fail quickly. Proper cleaning ensures a lasting bond."),
            ("Will the process damage plants or grass along the fence line?", "No. When cleaning fences near landscaping, we heavily pre-water the plants to fill their pores, use targeted low-pressure sprays, and rinse thoroughly afterward to ensure safety.")
        ],
        "image_placeholder": "/assets/gallery/Front Door Before.webp"
    },
    {
        "slug": "porch-entryway-cleaning",
        "title": "Porch & Entryway Cleaning in Little Rock | Grounds Maintenance",
        "desc": "Learn what porch cleaning is, what it removes, who it's for, and how to book Grounds Maintenance for entryway pressure washing service in Little Rock.",
        "h1": "Professional Porch & Entryway Cleaning for Homes and Small Businesses",
        "intro": "Make the right first impression. We carefully clean steps, landings, and porch surfaces to remove cobwebs, dirt, and stains for a welcoming entrance.",
        "quick_answer": {
            "what": "Detail-oriented, localized cleaning for the focal point of your home.",
            "removes": "Cobwebs, bug debris, mud, algae on steps, and drip line stains.",
            "who": "Homeowners hosting events, selling their house, or doing spring cleaning."
        },
        "cleans_list": ["Concrete front porches", "Brick or stone entry steps", "Surrounding brick facades or siding (soft wash)", "Overhead porch ceilings and pillars", "Front landings"],
        "why_book": ["Maximizes the very first thing guests see", "Removes creepy crawlies and cobwebs from the doorway", "Safe approach near delicate front doors and lighting", "Provides a massive visual upgrade for minimal cost"],
        "faqs": [
            ("Can you clean brick or stone steps safely?", "Yes. Brick and mortar joints require a customized approach. We apply detergents to handle the heavy lifting, preventing the need for destructive high pressure on older mortar."),
            ("Do you remove cobwebs and bug nests around the entryway?", "Yes. We use a gentle soft wash to sweep away dirt dauber nests, spider webs, and bug debris from the corners and ceilings of the porch areas."),
            ("What causes those dark drip stains on my porch concrete?", "If you don't have gutters, water running off the roof continually hits the concrete, creating a damp environment where algae and oxidation thrive. We can clean these 'drip lines' away."),
            ("Is the cleaning safe for my painted front door or siding?", "During an entryway clean, we employ extreme care near doors and windows, using low pressure and wide-fan rinses to ensure water isn't forced underneath seals or onto delicate paint."),
            ("How quickly can you clean a front entrance before an event or open house?", "An entryway-only clean is very fast, usually taking less than 45 minutes. Contact us and we can often fit these smaller jobs into our schedule the same week.")
        ],
        "image_placeholder": "/assets/gallery/Front Door After.webp"
    },
    {
        "slug": "storefront-entry-cleaning",
        "title": "Storefront Entry Cleaning in Little Rock | Grounds Maintenance",
        "desc": "Learn what storefront cleaning is, what it removes, who it's for, and how to book Grounds Maintenance for commercial entry cleaning in Little Rock.",
        "h1": "Professional Storefront Entry Cleaning for Small Businesses",
        "intro": "Draw in more customers with a pristine storefront. We eliminate gum, drink spills, and heavy foot-traffic grime from your commercial entryway.",
        "quick_answer": {
            "what": "Heavy-duty commercial concrete cleaning for business facades.",
            "removes": "Chewing gum, soda spills, heavy organic dirt, and bird droppings.",
            "who": "Retail stores, restaurants, offices, and strip malls looking to attract foot traffic."
        },
        "cleans_list": ["Commercial entry pads", "Adjacent public sidewalks", "Drive-thru lanes and curbs", "Dumpster pad enclosures", "Building facades (soft wash)"],
        "why_book": ["Customers absolutely judge a business by its exterior", "Prevents sticky gum and smells right at the front door", "Compliance with commercial lease agreements", "Reduces slip-and-fall liabilities on wet, grimy concrete"],
        "faqs": [
            ("Do you offer recurring maintenance plans for storefronts?", "Yes. Many local businesses book us for quarterly or bi-annual cleanings. Getting ahead of the grime keeps the entrance perpetually clean and usually drops the per-visit cost."),
            ("Can you schedule cleaning outside of our normal business hours?", "Absolutely. We know minimizing disruption to your customers is crucial. We can schedule early mornings, evenings, or weekends depending on your operating hours."),
            ("Are you able to remove gum and heavy stains from commercial concrete?", "Yes. We utilize hot water pressure washers and specialized commercial degreasers to lift blackened gum wads and heavy traffic stains that cold-water machines cannot touch."),
            ("Will this cleaning damage our window displays or signage?", "No. When cleaning the concrete directly below windows, we use specialized surface cleaners that contain the spray, preventing dirty water from bouncing onto your clean storefront glass."),
            ("Why is maintaining a clean storefront so important for local businesses?", "Before a customer ever interacts with an employee or product, they interact with your concrete. A filthy, gum-covered entrance creates an immediate subconscious feeling of neglect.")
        ],
        "image_placeholder": "/assets/gallery/Driveway Before.webp"
    }
]

# Read the base template structure (like quote.html) to grab the nav and footer.
base_file = "d:\\Future Tech Companies\\Grounds Maintenance Services\\AR-Grounds\\argrounds-website\\argrounds-final\\quote.html"
with open(base_file, "r", encoding="utf-8") as f:
    base_html = f.read()

# We'll split the base HTML into head, header, footer.
end_of_header = base_html.find("</header>") + len("</header>")
start_of_footer = base_html.find("<footer class=\"site-footer\">")

header_block = base_html[:end_of_header]
footer_block = base_html[start_of_footer:]

os.makedirs("d:\\Future Tech Companies\\Grounds Maintenance Services\\AR-Grounds\\argrounds-website\\argrounds-final\\services", exist_ok=True)

for page in pages_data:
    path_dir = f"d:\\Future Tech Companies\\Grounds Maintenance Services\\AR-Grounds\\argrounds-website\\argrounds-final\\services\\{page['slug']}"
    os.makedirs(path_dir, exist_ok=True)
    
    # build FAQ HTML
    faq_html = ""
    for faq in page["faqs"]:
        faq_html += f'''
          <details class="faq-item reveal-up">
            <summary>{faq[0]}</summary>
            <p>{faq[1]}</p>
          </details>'''

    # build Bullet lists
    cleans_html = "".join([f"<li>{item}</li>" for item in page["cleans_list"]])
    why_book_html = "".join([f"<li>{item}</li>" for item in page["why_book"]])

    main_content = f'''
  <main id="main">
    <section class="page-hero">
      <div class="container page-hero-inner">
        <p class="eyebrow eyebrow--light reveal-up">Professional Service</p>
        <h1 class="reveal-up delay-1" style="font-size: 2.8rem; margin-bottom: 20px;">{page["h1"]}</h1>
        <p class="page-hero-sub reveal-up delay-2">{page["intro"]}</p>
        <div class="reveal-up delay-3" style="margin-top: 30px;">
           <a href="/quote.html" class="btn btn-primary" style="background:#526c3d; border-color:#526c3d;">Get a Free Quote <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" style="width:20px;height:20px;margin-left:8px;vertical-align:middle"><path d="M4 10h12M10 4l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></a>
        </div>
      </div>
    </section>

    <!-- CONTENT MODULES -->
    <section class="section" id="service-details">
      <div class="container">
        
        <!-- QUICK ANSWER & IMAGE -->
        <div style="display: flex; flex-wrap: wrap; gap: 40px; margin-bottom: 60px;">
          <div style="flex: 1 1 500px; order: 2;">
            <div style="border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); height: 100%;">
              <img src="{page["image_placeholder"]}" alt="{page["h1"]}" style="width: 100%; height: 100%; object-fit: cover;" />
            </div>
          </div>
          <div style="flex: 1 1 400px; order: 1;">
            <div style="background: rgba(26,107,60,0.05); padding: 40px; border-radius: 12px; height: 100%;">
              <h2 style="margin-bottom: 20px; font-size: 2rem;">The Quick Answer</h2>
              <p><strong>What it is:</strong><br/>{page["quick_answer"]["what"]}</p>
              <p style="margin-top: 20px;"><strong>What it removes:</strong><br/>{page["quick_answer"]["removes"]}</p>
              <p style="margin-top: 20px;"><strong>Who it's for:</strong><br/>{page["quick_answer"]["who"]}</p>
            </div>
          </div>
        </div>

        <div style="display: flex; flex-wrap: wrap; gap: 40px; margin-bottom: 80px;">
           <div style="flex: 1 1 300px;">
             <h2 style="font-size: 2rem; margin-bottom: 20px;">What We Clean</h2>
             <ul class="service-list" style="margin-bottom: 0;">
                {cleans_html}
             </ul>
           </div>
           <div style="flex: 1 1 300px;">
             <h2 style="font-size: 2rem; margin-bottom: 20px;">Why Homeowners Book This</h2>
             <ul class="service-list" style="margin-bottom: 0;">
                {why_book_html}
             </ul>
           </div>
        </div>
      </div>
    </section>

    <!-- PROCESS -->
    <section class="section section--tint" id="process">
      <div class="container">
        <div class="section-header reveal-up">
          <p class="eyebrow">How We Do It</p>
          <h2>Our 4-Step Process.</h2>
        </div>
        <div class="steps-wrap">
          <div class="step-card reveal-up">
            <div class="step-num">01</div>
            <h3>Inspect & Prepare</h3>
            <p>We evaluate the surface, tape off delicate areas, and pre-water surrounding plants to protect them from detergents.</p>
          </div>
          <div class="step-connector" aria-hidden="true">&#8594;</div>
          <div class="step-card reveal-up delay-1">
            <div class="step-num">02</div>
            <h3>Pre-Treat Surface</h3>
            <p>We apply our proprietary cleaning agents to break the bond of dirt, stains, and organic growth safely.</p>
          </div>
          <div class="step-connector" aria-hidden="true">&#8594;</div>
          <div class="step-card reveal-up delay-2">
            <div class="step-num">03</div>
            <h3>Deep Clean</h3>
            <p>Using correct, controlled pressure, we lift away the separated grime to permanently remove years of weathering.</p>
          </div>
          <div class="step-connector" aria-hidden="true">&#8594;</div>
          <div class="step-card reveal-up delay-3">
            <div class="step-num">04</div>
            <h3>Rinse & Review</h3>
            <p>We perform a thorough final rinse of the area, clean up the edges, and confirm everything meets our high standards.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="section" id="faq">
      <div class="container">
        <div class="section-header reveal-up">
          <p class="eyebrow">Common Questions</p>
          <h2>Everything You Need to Know.</h2>
        </div>
        <div class="faq-list">
          {faq_html}
        </div>
      </div>
    </section>

    <!-- RELATED ARTICLES -->
    <section class="section section--tint">
      <div class="container text-center reveal-up">
        <h2>Want to Learn More?</h2>
        <p style="margin-bottom: 30px;">Check out our <a href="/learning-center/" style="color: #526c3d; font-weight: bold; text-decoration: underline;">Learning Center</a> for detailed guides, signs of property wear, and interior cleaning tips.</p>
      </div>
    </section>

    <!-- BOTTOM CTA -->
    <section class="section section--dark">
      <div class="container text-center reveal-up">
        <h2 class="cta-head">Ready to See the Difference?</h2>
        <p class="cta-sub">Get your free, no-obligation quote today. We'll respond within 24 hours — usually same day.</p>
        <a href="/quote.html" class="btn btn-primary btn-lg">Get My Free Quote
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4 10h12M10 4l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </a>
      </div>
    </section>

  </main>
'''

    # Modify the base head to use absolute paths (already done by fix_paths except we copied from quote.html directly, which we fixed.)
    # We just need to replace the title and description tag in head.
    import re
    head_replaced = re.sub(r'<title>.*?</title>', f'<title>{page["title"]}</title>', header_block)
    head_replaced = re.sub(r'<meta name="description" content=".*?" />', f'<meta name="description" content="{page["desc"]}" />', head_replaced)

    final_html = head_replaced + main_content + footer_block

    with open(f"{path_dir}\\index.html", "w", encoding="utf-8") as f:
        f.write(final_html)

print("Generated all 7 phase 1 service pages.")
