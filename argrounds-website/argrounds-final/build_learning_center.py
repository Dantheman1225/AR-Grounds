import os

articles_data = [
    {
        "slug": "what-is-pressure-washing",
        "title": "What Is Pressure Washing & How Does It Work? | Grounds Maintenance",
        "desc": "Discover what pressure washing is, how it differs from other washing methods, and why it's the most effective way to clean exterior surfaces.",
        "h1": "What is Pressure Washing?",
        "intro": "Pressure washing is the use of high-pressure water spray to physically blast away loose paint, mold, grime, dust, mud, and dirt from surfaces and objects.",
        "content_html": """
            <h2 style="margin-top:40px;margin-bottom:20px;">The Quick Answer</h2>
            <p>At its core, pressure washing utilizes a motorized pump to accelerate water through a narrow nozzle, creating a high-velocity stream. This stream is capable of breaking the chemical bonds of dirt, algae, and chewing gum, separating them entirely from hard surfaces like concrete or steel.</p>
            
            <h2 style="margin-top:40px;margin-bottom:20px;">How Pressure Washing Equipment Works</h2>
            <p>Standard municipal water supply enters the pressure washer where it is put under extreme pressure (often between 1,500 to 4,000 PSI) by a gas or electric-powered pump. This highly pressurized water is then forced through a restrictive nozzle. Depending on the degree of the nozzle (typically 0&deg;, 15&deg;, 25&deg;, or 40&deg;), the water slice can either act like a sharp chisel or a wide broom.</p>
            
            <h2 style="margin-top:40px;margin-bottom:20px;">Best Surfaces for High-Pressure Cleaning</h2>
            <p>High pressure is incredibly powerful, which means it can be incredibly destructive. The best surfaces for high-pressure washing include:</p>
            <ul class="service-list">
                <li>Driveways and poured concrete</li>
                <li>Brick and masonry (with caution regarding mortar)</li>
                <li>Exposed aggregate</li>
                <li>Heavy-duty commercial dumpster pads</li>
            </ul>

            <h2 style="margin-top:40px;margin-bottom:20px;">When to Call a Professional vs. DIY</h2>
            <p>While home improvement stores sell pressure washers, doing it yourself often leads to "zebra striping" (uneven cleaning lines), blown-out window seals, or etched concrete. Professional companies utilize specialized surface cleaner attachments, hot water units, and the exact chemical pre-treatments necessary to dissolve grime—meaning we don't have to rely purely on destructive water pressure.</p>

            <div style="background: rgba(26,107,60,0.05); padding: 30px; border-radius: 8px; margin-top: 40px; border-left: 4px solid #526c3d;">
                <h3 style="margin-bottom:10px;">Need concrete cleaned safely?</h3>
                <p>Check out our professional <a href="/services/driveway-cleaning/" style="font-weight:bold; color:#1a6b3c; text-decoration:underline;">Driveway Cleaning</a> services to see how we do it without risking damage to your concrete.</p>
            </div>
        """
    },
    {
        "slug": "pressure-washing-vs-power-washing",
        "title": "Pressure Washing vs Power Washing: What's the Difference?",
        "desc": "Learn the key differences between pressure washing and power washing, including which surface care method is right for your home's exterior clean.",
        "h1": "Pressure Washing vs Power Washing",
        "intro": "While often used interchangeably, the main difference between pressure washing and power washing comes down to one key element: heat.",
        "content_html": """
            <h2 style="margin-top:40px;margin-bottom:20px;">The Quick Answer</h2>
            <p>Both methods use highly pressurized water to clean hard surfaces. However, a <strong>power washer</strong> has a built-in heating element that heats the water to near boiling temperatures before it exits the wand. A <strong>pressure washer</strong> strictly utilizes cold water.</p>
            
            <h2 style="margin-top:40px;margin-bottom:20px;">What is Power Washing?</h2>
            <p>Power washing's superpower is heat. Just as hot water cleans greasy dishes in a sink much faster than cold water, hot water from a power washer melts chewing gum, automotive grease, and severe oil stains off commercial concrete incredibly fast. It is heavily utilized in commercial and industrial settings.</p>
            
            <h2 style="margin-top:40px;margin-bottom:20px;">What is Pressure Washing?</h2>
            <p>Pressure washing utilizes cold or tap-temperature water. For 90% of residential needs—like removing algae, mildew, standard dirt, and spider webs from long driveways and patios—cold water combined with the correct cleaning footprint is perfectly adequate and highly effective.</p>

            <h2 style="margin-top:40px;margin-bottom:20px;">When to Use Which Method</h2>
            <p><strong>Use a Power Washer for:</strong> Heavily soiled mechanic shop floors, fast food drive-thrus covered in grease, or concrete with massive chewing gum deposits.</p>
            <p><strong>Use a Pressure Washer for:</strong> Residential driveways, patios, standard sidewalks, and removing green algae.</p>

            <div style="background: rgba(26,107,60,0.05); padding: 30px; border-radius: 8px; margin-top: 40px; border-left: 4px solid #526c3d;">
                <h3 style="margin-bottom:10px;">The Role of Soft Washing</h3>
                <p>Neither power nor pressure washing is safe for roofing, siding, or old wood. For these, we use <strong>Soft Washing</strong>—a method using almost zero pressure (like a heavy rain) relying entirely on specialized detergents. Got a delicate surface? <a href="/quote.html" style="font-weight:bold; color:#1a6b3c; text-decoration:underline;">Ask us about soft washing.</a></p>
            </div>
        """
    },
    {
        "slug": "what-surfaces-can-be-pressure-washed",
        "title": "What Surfaces Can Be Safely Pressure Washed? | Guide",
        "desc": "Find out which exterior surfaces at your home or business can be safely cleaned with high-pressure washing, and which ones require soft washing.",
        "h1": "What Surfaces Can Be Pressure Washed?",
        "intro": "Not all surfaces are created equal when it comes to exterior cleaning. High pressure is fantastic for concrete, but it can severely damage wood or siding.",
        "content_html": """
            <h2 style="margin-top:40px;margin-bottom:20px;">The Quick Answer</h2>
            <p>You should only use high-pressure washing on porous, incredibly hard surfaces like poured concrete or solid masonry. Everything else—including vinyl siding, roofs, and wood decks—should be washed using low-pressure chemical methods.</p>
            
            <h2 style="margin-top:40px;margin-bottom:20px;">Surfaces Perfect for High Pressure</h2>
            <ul class="service-list">
                <li>Driveways and sidewalks</li>
                <li>Brick walkways and patios</li>
                <li>Exposed aggregate and durable pavers</li>
            </ul>
            
            <h2 style="margin-top:40px;margin-bottom:20px;">Surfaces That Should Never Be Pressure Washed</h2>
            <p>Using a high-pressure stream on the following surfaces will cause thousands of dollars in permanent damage:</p>
            <ul class="service-list">
                <li><strong>Asphalt Shingle Roofs:</strong> Will instantly blast away the protective ceramic granules, destroying the roof.</li>
                <li><strong>Vinyl Siding:</strong> High pressure can easily crack old vinyl or blast water horizontally underneath the seams, causing mold behind the walls.</li>
                <li><strong>Wood Decks & Fences:</strong> High pressure scars the wood, leaving permanent wand marks and 'furring' the fibers.</li>
            </ul>

            <h2 style="margin-top:40px;margin-bottom:20px;">How to Avoid Costly DIY Damage</h2>
            <p>If you're tackling a weekend project, always start with the widest fan nozzle available and test a hidden corner. If you are trying to clean a deck, roof, or home siding, strongly consider hiring a professional who specializes in <strong>soft washing.</strong></p>

            <div style="background: rgba(26,107,60,0.05); padding: 30px; border-radius: 8px; margin-top: 40px; border-left: 4px solid #526c3d;">
                <h3 style="margin-bottom:10px;">Looking to extend the life of your wood fence?</h3>
                <p>Check out our safe <a href="/services/fence-cleaning/" style="font-weight:bold; color:#1a6b3c; text-decoration:underline;">Fence Cleaning</a> guide to see how we remove algae without splintering the wood.</p>
            </div>
        """
    },
    {
        "slug": "how-often-should-you-clean-a-driveway",
        "title": "How Often Should You Clean a Concrete Driveway? | Tips",
        "desc": "Learn how frequently you should pressure wash your concrete driveway to maintain curb appeal, prevent slippery algae, and extend its lifespan.",
        "h1": "How Often Should You Clean a Driveway?",
        "intro": "For most homes, annual driveway cleaning is the sweet spot to keep concrete looking fresh and free from hazardous, slippery algae growth.",
        "content_html": """
            <h2 style="margin-top:40px;margin-bottom:20px;">The Quick Answer</h2>
            <p>As a general rule of thumb, you should pressure wash your concrete driveway <strong>once every 12 months</strong>. In high-shade areas or very wet climates, you may need to increase this to once every 6-8 months.</p>
            
            <h2 style="margin-top:40px;margin-bottom:20px;">Factors That Increase Cleaning Frequency</h2>
            <ul class="service-list">
                <li><strong>Tree Canopy:</strong> Heavy oak or pine canopies drop sap, leaves, and tannin-rich acorns that stain concrete incredibly fast.</li>
                <li><strong>Poor Drainage:</strong> If your driveway has 'bird baths' (low spots where puddles form after rain), those areas will cultivate dark green and black algae blooms constantly.</li>
                <li><strong>Automotive Use:</strong> If you work on cars or own older vehicles that drip oil and power steering fluid, more frequent spot-cleaning is required to prevent permanent deep-staining.</li>
            </ul>
            
            <h2 style="margin-top:40px;margin-bottom:20px;">The Hidden Dangers of Algae Buildup</h2>
            <p>When a driveway turns black, it isn't just dirt. The black coating is a rapidly reproducing colony of cyanobacteria (Gloeocapsa Magma) and algae. When this biological mat gets wet from morning dew or light rain, it becomes <strong>as slippery as black ice</strong>, acting as a massive slip-and-fall hazard for your family or delivery drivers.</p>

            <div style="background: rgba(26,107,60,0.05); padding: 30px; border-radius: 8px; margin-top: 40px; border-left: 4px solid #526c3d;">
                <h3 style="margin-bottom:10px;">Ready for your annual wash?</h3>
                <p>Explore our <a href="/services/driveway-cleaning/" style="font-weight:bold; color:#1a6b3c; text-decoration:underline;">Driveway Cleaning</a> service and get a free quote to eradicate algae and boost your curb appeal.</p>
            </div>
        """
    },
    {
        "slug": "why-sidewalks-turn-black",
        "title": "Why Do Concrete Sidewalks Turn Black? | Exterior Cleaning",
        "desc": "Uncover the reasons why concrete sidewalks and walkways turn black or green over time, and the best methods for safely removing the dark stains.",
        "h1": "Why Sidewalks Turn Black",
        "intro": "That dark grimy coating on your sidewalk isn't just dirt—it's likely a living layer of algae, mold, and mildew thriving in the damp concrete pores.",
        "content_html": """
            <h2 style="margin-top:40px;margin-bottom:20px;">The Quick Answer</h2>
            <p>Concrete is heavily porous, meaning it acts like a giant hard sponge. Water, microscopic dirt, and airborne algae spores settle into these tiny pores. Over months of rain and humidity, the algae begins to feed on the limestone in the concrete, creating the thick black or green layer you see on top.</p>
            
            <h2 style="margin-top:40px;margin-bottom:20px;">Gloeocapsa Magma and Organic Growth</h2>
            <p>The primary culprit for the black streaking you see on sidewalks (and often on home roofs) is a bacteria called <em>Gloeocapsa Magma</em>. To protect itself from UV rays from the sun, this bacteria creates a dark, heavily pigmented "shell." By the time your sidewalk looks totally black, you are looking at millions of these tiny protective shells.</p>
            
            <h2 style="margin-top:40px;margin-bottom:20px;">Why Regular Rinsing Doesn't Work</h2>
            <p>If you just spray a black sidewalk with a garden hose, the dirt on top will wash away, but the biological roots dug into the concrete pores will remain. Within weeks, the black algae will simply bloom again.</p>

            <h2 style="margin-top:40px;margin-bottom:20px;">The Correct Way to Remove Black Algae</h2>
            <p>To truly get rid of black algae, a professional must lay down a sodium hypochlorite based pretreatment mix. This actively breaks the cell walls of the algae, killing it at the root. Once the algae is dead, high-pressure surface cleaners easily lift the dead matter from the concrete pores, leaving it bright white for the long term.</p>

            <div style="background: rgba(26,107,60,0.05); padding: 30px; border-radius: 8px; margin-top: 40px; border-left: 4px solid #526c3d;">
                <h3 style="margin-bottom:10px;">Are your walkways looking dreary?</h3>
                <p>Check out our <a href="/services/sidewalk-walkway-cleaning/" style="font-weight:bold; color:#1a6b3c; text-decoration:underline;">Sidewalk & Walkway Cleaning</a> services and see how fast we can turn them white again.</p>
            </div>
        """
    },
    {
        "slug": "how-to-improve-curb-appeal-with-pressure-washing",
        "title": "How to Improve Curb Appeal Fast with Pressure Washing",
        "desc": "Looking to sell your home or just want a cleaner look? Learn how simple exterior cleaning and pressure washing can dramatically boost your curb appeal.",
        "h1": "How to Improve Curb Appeal Fast",
        "intro": "Whether you're listing your home for sale or hosting a summer barbecue, nothing transforms a property's exterior faster than professional pressure washing.",
        "content_html": """
            <h2 style="margin-top:40px;margin-bottom:20px;">The Quick Answer</h2>
            <p>Curb appeal is heavily driven by contrast. When driveways are bright white, they contrast beautifully against green manicured lawns and the paint of your house. When concrete turns dingy and grey, the entire property looks dull and neglected. A 2-hour pressure washing job instantly restores this premium contrast.</p>
            
            <h2 style="margin-top:40px;margin-bottom:20px;">The ROI of Exterior Cleaning</h2>
            <p>According to real estate networks, professional exterior cleaning can add thousands of dollars in perceived value to a home for a cost of just a few hundred dollars. It boasts one of the highest returns on investment (ROI) compared to repainting or re-roofing.</p>
            
            <h2 style="margin-top:40px;margin-bottom:20px;">Top 3 Areas to Focus On for Fast Results</h2>
            <ul class="service-list">
                <li><strong>The Entryway:</strong> The landing and front steps are the literal focal point of the home. Eliminate cobwebs, bee nests, and dirt here first.</li>
                <li><strong>The Driveway:</strong> Because of its massive square footage, a clean driveway makes the house look visually larger and well-maintained.</li>
                <li><strong>The Walkway:</strong> The psychological path a guest or buyer takes from the curb to your door sets the mood for the whole tour.</li>
            </ul>

            <h2 style="margin-top:40px;margin-bottom:20px;">Common Mistakes When Preparing a Home for Sale</h2>
            <p>Many homeowners spend thousands on new mulch and flowers, but ignore the concrete those flower beds sit next to. New mulch against a black, algae-covered driveway just makes the driveway look dirtier. Always clean the hardscapes <em>before</em> applying fresh mulch and planting.</p>

            <div style="background: rgba(26,107,60,0.05); padding: 30px; border-radius: 8px; margin-top: 40px; border-left: 4px solid #526c3d;">
                <h3 style="margin-bottom:10px;">The Ultimate Curb Appeal Hack</h3>
                <p>Read about our <a href="/services/" style="font-weight:bold; color:#1a6b3c; text-decoration:underline;">Driveway + Walkway Bundle</a>, the most affordable and impactful way to instantly boost the value and appearance of your home.</p>
            </div>
        """
    }
]

# Read the base template structure
base_file = "d:\\Future Tech Companies\\Grounds Maintenance Services\\AR-Grounds\\argrounds-website\\argrounds-final\\quote.html"
with open(base_file, "r", encoding="utf-8") as f:
    base_html = f.read()

end_of_header = base_html.find("</header>") + len("</header>")
start_of_footer = base_html.find("<footer class=\"site-footer\">")

header_block = base_html[:end_of_header]
footer_block = base_html[start_of_footer:]

os.makedirs("d:\\Future Tech Companies\\Grounds Maintenance Services\\AR-Grounds\\argrounds-website\\argrounds-final\\learning-center", exist_ok=True)

# Build the articles
for article in articles_data:
    path_dir = f"d:\\Future Tech Companies\\Grounds Maintenance Services\\AR-Grounds\\argrounds-website\\argrounds-final\\learning-center\\{article['slug']}"
    os.makedirs(path_dir, exist_ok=True)

    main_content = f'''
  <main id="main">
    <section class="page-hero" style="padding-top:120px; padding-bottom:60px;">
      <div class="container page-hero-inner text-left" style="max-width:800px; margin: 0 auto; text-align: left;">
        <p class="eyebrow eyebrow--light reveal-up" style="justify-content: flex-start; text-transform:uppercase;">Educational Guide</p>
        <h1 class="reveal-up delay-1" style="font-size: 2.5rem; margin-bottom: 20px;">{article["h1"]}</h1>
        <p class="page-hero-sub reveal-up delay-2" style="font-size:1.1rem; opacity:0.9;">{article["intro"]}</p>
      </div>
    </section>

    <!-- CONTENT -->
    <section class="section" id="article-content">
      <div class="container" style="max-width:800px; margin: 0 auto;">
          <div class="article-body" style="font-size:1.1rem; line-height:1.8; color:#333;">
              {article["content_html"]}
          </div>
      </div>
    </section>

    <!-- BOTTOM CTA -->
    <section class="section section--dark">
      <div class="container text-center reveal-up">
        <h2 class="cta-head">Prefer to Have a Professional Handle it?</h2>
        <p class="cta-sub">Get your free, no-obligation quote today. Central AR's highest-rated pressure washing crew.</p>
        <a href="/quote.html" class="btn btn-primary btn-lg">Get My Free Quote
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4 10h12M10 4l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </a>
      </div>
    </section>
  </main>
'''

    import re
    head_replaced = re.sub(r'<title>.*?</title>', f'<title>{article["title"]}</title>', header_block)
    head_replaced = re.sub(r'<meta name="description" content=".*?" />', f'<meta name="description" content="{article["desc"]}" />', head_replaced)

    # Highlight active nav link correctly: remove active class from all, add to learning center
    head_replaced = head_replaced.replace('class="nav-active"', '')
    head_replaced = head_replaced.replace('href="/learning-center/"', 'href="/learning-center/" class="nav-active"')

    final_html = head_replaced + main_content + footer_block

    with open(f"{path_dir}\\index.html", "w", encoding="utf-8") as f:
        f.write(final_html)


# BUILD THE HUB
hub_title = "Pressure Washing Learning Center & Guides | Grounds Maintenance"
hub_desc = "Learn about pressure washing, soft washing, and exterior surface care. Helpful tips for homeowners and businesses in Little Rock to improve curb appeal."
hub_h1 = "Learn About Pressure Washing, Exterior Cleaning, and Surface Care"
hub_intro = "Your complete guide to keeping your property clean, safe, and looking its best. Discover tips, guides, and expert advice on all things exterior cleaning."

hub_main = f'''
  <main id="main">
    <section class="page-hero">
      <div class="container page-hero-inner">
        <h1 class="reveal-up delay-1" style="font-size: 2.8rem; margin-bottom: 20px;">{hub_h1}</h1>
        <p class="page-hero-sub reveal-up delay-2">{hub_intro}</p>
      </div>
    </section>

    <!-- HUB DIRECTORY -->
    <section class="section section--tint" id="directory">
      <div class="container">
        
        <h2 style="font-size: 2.2rem; margin-bottom: 30px; padding-bottom: 10px; border-bottom: 2px solid rgba(26,107,60,0.1);">Pressure Washing Basics</h2>
        <div class="services-grid" style="margin-bottom: 60px; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:20px;">
           <article class="service-card reveal-up" style="background:#fff; border: 1px solid #eaeaea;">
             <p style="font-size:0.8rem; color:#526c3d; font-weight:bold; margin-bottom:10px; text-transform:uppercase;">Guide</p>
             <h3 style="font-size:1.5rem; margin-bottom:10px;"><a href="/learning-center/what-is-pressure-washing/" style="color:#0a1f12; text-decoration:none;">What is Pressure Washing?</a></h3>
             <p style="font-size:1rem; color:#555; margin-bottom:20px;">Understand the fundamentals of high-pressure cleaning vs traditional washing.</p>
             <a href="/learning-center/what-is-pressure-washing/" class="service-link">Read Full Guide &#8594;</a>
           </article>

           <article class="service-card reveal-up delay-1" style="background:#fff; border: 1px solid #eaeaea;">
             <p style="font-size:0.8rem; color:#526c3d; font-weight:bold; margin-bottom:10px; text-transform:uppercase;">Guide</p>
             <h3 style="font-size:1.5rem; margin-bottom:10px;"><a href="/learning-center/pressure-washing-vs-power-washing/" style="color:#0a1f12; text-decoration:none;">Pressure vs Power Washing</a></h3>
             <p style="font-size:1rem; color:#555; margin-bottom:20px;">Breaking down the differences and when hot water makes all the difference.</p>
             <a href="/learning-center/pressure-washing-vs-power-washing/" class="service-link">Read Full Guide &#8594;</a>
           </article>

           <article class="service-card reveal-up delay-2" style="background:#fff; border: 1px solid #eaeaea;">
             <p style="font-size:0.8rem; color:#526c3d; font-weight:bold; margin-bottom:10px; text-transform:uppercase;">Guide</p>
             <h3 style="font-size:1.5rem; margin-bottom:10px;"><a href="/learning-center/what-surfaces-can-be-pressure-washed/" style="color:#0a1f12; text-decoration:none;">What Surfaces Are Safe?</a></h3>
             <p style="font-size:1rem; color:#555; margin-bottom:20px;">A breakdown of porous surfaces that handle pressure vs those that require soft washing.</p>
             <a href="/learning-center/what-surfaces-can-be-pressure-washed/" class="service-link">Read Full Guide &#8594;</a>
           </article>
        </div>

        <h2 style="font-size: 2.2rem; margin-bottom: 30px; padding-bottom: 10px; border-bottom: 2px solid rgba(26,107,60,0.1);">Surface-Specific Guides</h2>
        <div class="services-grid" style="margin-bottom: 60px; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:20px;">
           <article class="service-card reveal-up" style="background:#fff; border: 1px solid #eaeaea;">
             <p style="font-size:0.8rem; color:#526c3d; font-weight:bold; margin-bottom:10px; text-transform:uppercase;">Service Overview</p>
             <h3 style="font-size:1.5rem; margin-bottom:10px;"><a href="/services/driveway-cleaning/" style="color:#0a1f12; text-decoration:none;">Driveway Cleaning Guide</a></h3>
             <p style="font-size:1rem; color:#555; margin-bottom:20px;">Everything you need to know about tackling driveway grime, oil, and algae.</p>
             <a href="/services/driveway-cleaning/" class="service-link">View Service &#8594;</a>
           </article>

           <article class="service-card reveal-up delay-1" style="background:#fff; border: 1px solid #eaeaea;">
             <p style="font-size:0.8rem; color:#526c3d; font-weight:bold; margin-bottom:10px; text-transform:uppercase;">Service Overview</p>
             <h3 style="font-size:1.5rem; margin-bottom:10px;"><a href="/services/deck-cleaning/" style="color:#0a1f12; text-decoration:none;">Proper Deck Protocol</a></h3>
             <p style="font-size:1rem; color:#555; margin-bottom:20px;">Why high pressure destroys wood, and the correct chemical process to use.</p>
             <a href="/services/deck-cleaning/" class="service-link">View Service &#8594;</a>
           </article>

           <article class="service-card reveal-up delay-2" style="background:#fff; border: 1px solid #eaeaea;">
             <p style="font-size:0.8rem; color:#526c3d; font-weight:bold; margin-bottom:10px; text-transform:uppercase;">Service Overview</p>
             <h3 style="font-size:1.5rem; margin-bottom:10px;"><a href="/services/fence-cleaning/" style="color:#0a1f12; text-decoration:none;">Fence Restoration</a></h3>
             <p style="font-size:1rem; color:#555; margin-bottom:20px;">Restoring original wood grain and brightening stained vinyl border fencing.</p>
             <a href="/services/fence-cleaning/" class="service-link">View Service &#8594;</a>
           </article>
        </div>

        <h2 style="font-size: 2.2rem; margin-bottom: 30px; padding-bottom: 10px; border-bottom: 2px solid rgba(26,107,60,0.1);">Homeowner & Business Tips</h2>
        <div class="services-grid" style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:20px;">
           <article class="service-card reveal-up" style="background:#fff; border: 1px solid #eaeaea;">
             <p style="font-size:0.8rem; color:#526c3d; font-weight:bold; margin-bottom:10px; text-transform:uppercase;">Tips & Tricks</p>
             <h3 style="font-size:1.5rem; margin-bottom:10px;"><a href="/learning-center/how-often-should-you-clean-a-driveway/" style="color:#0a1f12; text-decoration:none;">How Often to Clean Concrete?</a></h3>
             <p style="font-size:1rem; color:#555; margin-bottom:20px;">Find out the ideal timelines to maintain curb appeal and prevent slippery surfaces.</p>
             <a href="/learning-center/how-often-should-you-clean-a-driveway/" class="service-link">Read Full Guide &#8594;</a>
           </article>

           <article class="service-card reveal-up delay-1" style="background:#fff; border: 1px solid #eaeaea;">
             <p style="font-size:0.8rem; color:#526c3d; font-weight:bold; margin-bottom:10px; text-transform:uppercase;">Tips & Tricks</p>
             <h3 style="font-size:1.5rem; margin-bottom:10px;"><a href="/learning-center/why-sidewalks-turn-black/" style="color:#0a1f12; text-decoration:none;">Why Sidewalks Turn Black</a></h3>
             <p style="font-size:1rem; color:#555; margin-bottom:20px;">The microscopic organic factors that turn bright concrete black over time.</p>
             <a href="/learning-center/why-sidewalks-turn-black/" class="service-link">Read Full Guide &#8594;</a>
           </article>

           <article class="service-card reveal-up delay-2" style="background:#fff; border: 1px solid #eaeaea;">
             <p style="font-size:0.8rem; color:#526c3d; font-weight:bold; margin-bottom:10px; text-transform:uppercase;">Real Estate</p>
             <h3 style="font-size:1.5rem; margin-bottom:10px;"><a href="/learning-center/how-to-improve-curb-appeal-with-pressure-washing/" style="color:#0a1f12; text-decoration:none;">Immediate Curb Appeal Tips</a></h3>
             <p style="font-size:1rem; color:#555; margin-bottom:20px;">Maximizing your property perception with high-contrast exterior cleaning.</p>
             <a href="/learning-center/how-to-improve-curb-appeal-with-pressure-washing/" class="service-link">Read Full Guide &#8594;</a>
           </article>
        </div>

      </div>
    </section>

    <!-- BOTTOM CTA -->
    <section class="section section--dark">
      <div class="container text-center reveal-up">
        <h2 class="cta-head">Prefer to Have a Professional Handle it?</h2>
        <p class="cta-sub">Get your free, no-obligation quote today. Central AR's highest-rated pressure washing crew.</p>
        <a href="/quote.html" class="btn btn-primary btn-lg">Get My Free Quote
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4 10h12M10 4l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </a>
      </div>
    </section>
  </main>
'''

head_hub = re.sub(r'<title>.*?</title>', f'<title>{hub_title}</title>', header_block)
head_hub = re.sub(r'<meta name="description" content=".*?" />', f'<meta name="description" content="{hub_desc}" />', head_hub)
head_hub = head_hub.replace('class="nav-active"', '')
head_hub = head_hub.replace('href="/learning-center/"', 'href="/learning-center/" class="nav-active"')

final_hub_html = head_hub + hub_main + footer_block

with open("d:\\Future Tech Companies\\Grounds Maintenance Services\\AR-Grounds\\argrounds-website\\argrounds-final\\learning-center\\index.html", "w", encoding="utf-8") as f:
    f.write(final_hub_html)

print("Generated Learning Center Hub & Articles")
