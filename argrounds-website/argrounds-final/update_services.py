import codecs

services_hub_html = """    <!-- PAGE HERO -->
    <section class="page-hero">
      <div class="container page-hero-inner">
        <h1 class="reveal-up delay-1" style="font-size: 3rem; margin-bottom: 20px;">Exterior Cleaning Services That Instantly Improve Curb Appeal</h1>
        <p class="page-hero-sub reveal-up delay-2">Professional pressure washing and soft washing solutions tailored to your property's needs. We remove dirt, algae, and stains safely and effectively.</p>
      </div>
    </section>

    <!-- OUR CLEANING SERVICES GRID -->
    <section class="section" id="services">
      <div class="container">
        <div class="section-header reveal-up">
          <p class="eyebrow">Service Directory</p>
          <h2>Our Cleaning Services</h2>
          <p class="section-sub">Choose a service below to learn exactly what we do, how we do it, and the results you can expect.</p>
        </div>

        <div class="services-grid">
          <!-- Driveway Cleaning -->
          <article class="service-card reveal-up">
            <div class="service-icon-circle"><svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" class="bi bi-car-front" viewBox="0 0 16 16"><path d="M4 9a1 1 0 1 1-2 0 1 1 0 0 1 2 0m10 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0M6 8a1 1 0 0 0 0 2h4a1 1 0 1 0 0-2zM4.862 4.276 3.906 6.19a.51.51 0 0 0 .497.731c.91-.073 2.35-.17 3.597-.17s2.688.097 3.597.17a.51.51 0 0 0 .497-.731l-.956-1.913A.5.5 0 0 0 10.691 4H5.309a.5.5 0 0 0-.447.276"/><path d="M2.52 3.515A2.5 2.5 0 0 1 4.82 2h6.362c1 0 1.904.596 2.298 1.515l.792 1.848c.075.175.21.319.38.404.5.25.855.715.965 1.262l.335 1.679q.05.242.049.49v.413c0 .814-.39 1.543-1 1.997V13.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-1.338c-1.292.048-2.745.088-4 .088s-2.708-.04-4-.088V13.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-1.892c-.61-.454-1-1.183-1-1.997v-.413a2.5 2.5 0 0 1 .049-.49l.335-1.68c.11-.546.465-1.012.964-1.261a.8.8 0 0 0 .381-.404l.792-1.848ZM4.82 3a1.5 1.5 0 0 0-1.379.91l-.792 1.847a1.8 1.8 0 0 1-.853.904.8.8 0 0 0-.43.564L1.03 8.904a1.5 1.5 0 0 0-.03.294v.413c0 .796.62 1.448 1.408 1.484 1.555.07 3.786.155 5.592.155s4.037-.084 5.592-.155A1.48 1.48 0 0 0 15 9.611v-.413q0-.148-.03-.294l-.335-1.68a.8.8 0 0 0-.43-.563 1.8 1.8 0 0 1-.853-.904l-.792-1.848A1.5 1.5 0 0 0 11.18 3z"/></svg></div>
            <h3>Driveway Cleaning</h3>
            <p>Lift years of dirt, algae, and surface grime off your concrete and instantly make your property look cleaner.</p>
            <a href="/services/driveway-cleaning.html" class="service-link">Learn More &#8594;</a>
          </article>

          <!-- Sidewalk Cleaning -->
          <article class="service-card reveal-up delay-1">
            <div class="service-icon-circle"><svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" class="bi bi-person-walking" viewBox="0 0 16 16"><path d="M9.5 1.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0M6.44 3.752A.75.75 0 0 1 7 3.5h1.445c.742 0 1.32.643 1.243 1.38l-.43 4.083a1.8 1.8 0 0 1-.088.395l-.318.906.213.242a.8.8 0 0 1 .114.175l2 4.25a.75.75 0 1 1-1.357.638l-1.956-4.154-1.68-1.921A.75.75 0 0 1 6 8.96l.138-2.613-.435.489-.464 2.786a.75.75 0 1 1-1.48-.246l.5-3a.75.75 0 0 1 .18-.375l2-2.25Z"/><path d="M6.25 11.745v-1.418l1.204 1.375.261.524a.8.8 0 0 1-.12.231l-2.5 3.25a.75.75 0 1 1-1.19-.914zm4.22-4.215-.494-.494.205-1.843.006-.067 1.124 1.124h1.44a.75.75 0 0 1 0 1.5H11a.75.75 0 0 1-.531-.22Z"/></svg></div>
            <h3>Sidewalk &amp; Walkway Cleaning</h3>
            <p>Brighten up your home's entrance and eliminate slippery organic growth with our thorough cleaning.</p>
            <a href="/services/sidewalk-walkway-cleaning.html" class="service-link">Learn More &#8594;</a>
          </article>

          <!-- Patio & Paver Cleaning -->
          <article class="service-card reveal-up delay-2">
            <div class="service-icon-circle"><svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" class="bi bi-tree" viewBox="0 0 16 16"><path d="M8.416.223a.5.5 0 0 0-.832 0l-3 4.5A.5.5 0 0 0 5 5.5h.098L3.076 8.735A.5.5 0 0 0 3.5 9.5h.191l-1.638 3.276a.5.5 0 0 0 .447.724H7V16h2v-2.5h4.5a.5.5 0 0 0 .447-.724L12.31 9.5h.191a.5.5 0 0 0 .424-.765L10.902 5.5H11a.5.5 0 0 0 .416-.777zM6.437 4.758A.5.5 0 0 0 6 4.5h-.066L8 1.401 10.066 4.5H10a.5.5 0 0 0-.424.765L11.598 8.5H11.5a.5.5 0 0 0-.447.724L12.69 12.5H3.309l1.638-3.276A.5.5 0 0 0 4.5 8.5h-.098l2.022-3.235a.5.5 0 0 0 .013-.507z"/></svg></div>
            <h3>Patio &amp; Paver Cleaning</h3>
            <p>Reclaim your outdoor living space. Remove algae, moss, and stains from patios to give you a pristine backyard.</p>
            <a href="/services/patio-paver-cleaning.html" class="service-link">Learn More &#8594;</a>
          </article>

          <!-- Deck Cleaning -->
          <article class="service-card reveal-up">
            <div class="service-icon-circle"><svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" class="bi bi-layers" viewBox="0 0 16 16"><path d="M8.235 1.559a.5.5 0 0 0-.47 0l-7.5 4a.5.5 0 0 0 0 .882L3.188 8 .264 9.559a.5.5 0 0 0 0 .882l7.5 4a.5.5 0 0 0 .47 0l7.5-4a.5.5 0 0 0 0-.882L12.813 8l2.922-1.559a.5.5 0 0 0 0-.882zm3.515 7.008L14.438 10 8 13.433 1.562 10 4.25 8.567l3.515 1.874a.5.5 0 0 0 .47 0zM8 9.433 1.562 6 8 2.567 14.438 6z"/></svg></div>
            <h3>Deck Cleaning</h3>
            <p>Safely restore the natural beauty of your wood or composite deck. Eliminate grey weathering without splintering.</p>
            <a href="/services/deck-cleaning.html" class="service-link">Learn More &#8594;</a>
          </article>

          <!-- Fence Cleaning -->
          <article class="service-card reveal-up delay-1">
            <div class="service-icon-circle"><svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" class="bi bi-distribute-vertical" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M1 1.5a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 0-1h-13a.5.5 0 0 0-.5.5zm0 13a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 0-1h-13a.5.5 0 0 0-.5.5z"/><path d="M2 7a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-2z"/></svg></div>
            <h3>Fence Cleaning</h3>
            <p>Revitalize property boundaries. Safely wash away mold and algae from wood and vinyl fences.</p>
            <a href="/services/fence-cleaning.html" class="service-link">Learn More &#8594;</a>
          </article>

          <!-- Porch & Entryway -->
          <article class="service-card reveal-up delay-2">
            <div class="service-icon-circle"><svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" class="bi bi-door-open" viewBox="0 0 16 16"><path d="M8.5 10c-.276 0-.5-.448-.5-1s.224-1 .5-1 .5.448.5 1-.224 1-.5 1"/><path d="M10.828.122A.5.5 0 0 1 11 .5V1h.5A1.5 1.5 0 0 1 13 2.5V15h1.5a.5.5 0 0 1 0 1h-13a.5.5 0 0 1 0-1H3V1.5a.5.5 0 0 1 .43-.495l7-1a.5.5 0 0 1 .398.117M11.5 2H11v13h1V2.5a.5.5 0 0 0-.5-.5M4 1.934V15h6V1.077z"/></svg></div>
            <h3>Porch &amp; Entryway Cleaning</h3>
            <p>Make the right first impression. We carefully clean steps and top landings to remove dirt and welcome guests.</p>
            <a href="/services/porch-entryway-cleaning.html" class="service-link">Learn More &#8594;</a>
          </article>
          
          <!-- Storefront Entry Cleaning -->
          <article class="service-card reveal-up">
            <div class="service-icon-circle"><svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" class="bi bi-shop" viewBox="0 0 16 16"><path d="M2.97 1.35A1 1 0 0 1 3.736 1h8.528a1 1 0 0 1 .766.35l2.762 3.222A.5.5 0 0 1 16 5v1a1 1 0 0 1-1 1h-1v7a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7H1a1 1 0 0 1-1-1V5a.5.5 0 0 1 .208-.4L2.97 1.35zM3 7v7h3V7zm5 7h4V7H8zm4-8H4V5.59L4.992 2h6.015L12 5.59zM1 6h14V5l-2.483-2.898a.5.5 0 0 0-.383-.175H3.866a.5.5 0 0 0-.383.175L1 5z"/></svg></div>
            <h3>Storefront Entry Cleaning</h3>
            <p>Draw in more customers with a pristine storefront. Eliminate heavy foot-traffic grime from your entryway.</p>
            <a href="/services/storefront-entry-cleaning.html" class="service-link">Learn More &#8594;</a>
          </article>
        </div>
      </div>
    </section>

    <!-- WHY CHOOSE US -->
    <section class="section section--tint" id="why-choose-us">
      <div class="container">
        <div class="section-header reveal-up">
          <p class="eyebrow">Trust & Safety</p>
          <h2>Why Choose Grounds Maintenance</h2>
        </div>
        <div class="trust-strip" style="background: transparent;">
          <div class="trust-row">
            <div class="trust-item" style="padding: 1rem;">
              <div class="trust-icon"><svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" class="bi bi-lightning-charge" viewBox="0 0 16 16">
      <path d="M11.251.068a.5.5 0 0 1 .227.58L9.677 6.5H13a.5.5 0 0 1 .364.843l-8 8.5a.5.5 0 0 1-.842-.49L6.323 9.5H3a.5.5 0 0 1-.364-.843l8-8.5a.5.5 0 0 1 .615-.09zM4.157 8.5H7a.5.5 0 0 1 .478.647L6.11 13.59l5.732-6.09H9a.5.5 0 0 1-.478-.647L9.89 2.41z"/>
    </svg></div>
              <div><strong>Quick Turnaround</strong><span>Because we focus locally, we can get you scheduled faster than the big companies.</span></div>
            </div>
            <div class="trust-item" style="padding: 1rem;">
              <div class="trust-icon"><svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" class="bi bi-stars" viewBox="0 0 16 16">
      <path d="M7.657 6.247c.11-.33.576-.33.686 0l.645 1.937a2.89 2.89 0 0 0 1.829 1.828l1.936.645c.33.11.33.576 0 .686l-1.937.645a2.89 2.89 0 0 0-1.828 1.829l-.645 1.936a.361.361 0 0 1-.686 0l-.645-1.937a2.89 2.89 0 0 0-1.828-1.828l-1.937-.645a.361.361 0 0 1 0-.686l1.937-.645a2.89 2.89 0 0 0 1.828-1.828zM3.794 1.148a.217.217 0 0 1 .412 0l.387 1.162c.173.518.579.924 1.097 1.097l1.162.387a.217.217 0 0 1 0 .412l-1.162.387A1.73 1.73 0 0 0 4.593 5.69l-.387 1.162a.217.217 0 0 1-.412 0L3.407 5.69A1.73 1.73 0 0 0 2.31 4.593l-1.162-.387a.217.217 0 0 1 0-.412l1.162-.387A1.73 1.73 0 0 0 3.407 2.31zM10.863.099a.145.145 0 0 1 .274 0l.258.774c.115.346.386.617.732.732l.774.258a.145.145 0 0 1 0 .274l-.774.258a1.16 1.16 0 0 0-.732.732l-.258.774a.145.145 0 0 1-.274 0l-.258-.774a1.16 1.16 0 0 0-.732-.732L9.1 2.137a.145.145 0 0 1 0-.274l.774-.258c.346-.115.617-.386.732-.732z"/>
    </svg></div>
              <div><strong>Great Results</strong><span>We utilize correct chemical pre-treatments combined with the right pressure settings.</span></div>
            </div>
            <div class="trust-item" style="padding: 1rem;">
              <div class="trust-icon"><svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" class="bi bi-shield-check" viewBox="0 0 16 16">
      <path d="M5.338 1.59a61 61 0 0 0-2.837.856.48.48 0 0 0-.328.39c-.554 4.157.726 7.19 2.253 9.188a10.7 10.7 0 0 0 2.287 2.233c.346.244.652.42.893.533q.18.085.293.118a1 1 0 0 0 .139.03 1 1 0 0 0 .139-.03q.112-.033.293-.118c.241-.113.547-.29.893-.533a10.7 10.7 0 0 0 2.287-2.233c1.527-1.997 2.807-5.031 2.253-9.188a.48.48 0 0 0-.328-.39c-.651-.213-1.75-.56-2.837-.855C9.552 1.29 8.531 1.067 8 1.067c-.53 0-1.552.223-2.662.524zM5.072.56C6.157.265 7.31 0 8 0s1.843.265 2.928.56c1.11.3 2.229.655 2.887.87a1.54 1.54 0 0 1 1.044 1.262c.596 4.477-.787 7.795-2.465 9.99a11.8 11.8 0 0 1-2.517 2.453 7 7 0 0 1-1.048.625c-.28.132-.581.24-.829.24s-.548-.108-.829-.24a7 7 0 0 1-1.048-.625 11.8 11.8 0 0 1-2.517-2.453C1.928 10.487.545 7.169 1.141 2.692A1.54 1.54 0 0 1 2.185 1.43 63 63 0 0 1 5.072.56"/>
      <path d="M10.854 5.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 7.793l2.646-2.647a.5.5 0 0 1 .708 0"/>
    </svg></div>
              <div><strong>Safer Than DIY</strong><span>Prevent irreversible etching to your concrete by letting trained technicians handle it.</span></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- BUNDLES -->
    <section class="section" id="bundles">
      <div class="container">
        <div class="section-header reveal-up">
          <p class="eyebrow">Service Bundles</p>
          <h2>Do More. Save More.</h2>
          <p class="section-sub">Maximize your property's curb appeal while saving money.</p>
        </div>

        <div class="services-grid" style="grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));">
          <article class="service-card service-card--featured reveal-up delay-1">
            <div class="featured-badge">Curb Appeal Package</div>
            <h3>Driveway + Entryway</h3>
            <p>The ultimate front-of-house clean. Combining driveway, walkway, and full porch/entryway cleaning.</p>
            <a href="/quote.html" class="service-link">Get a Bundle Quote &#8594;</a>
          </article>
          
          <article class="service-card reveal-up delay-2" style="border: 1px solid rgba(26,107,60,0.2);">
            <h3>Backyard Refresh Package</h3>
            <p>Perfect for summer preparation. Clean your patio/pavers, pool deck, and outdoor living spaces together.</p>
            <a href="/quote.html" class="service-link">Get a Bundle Quote &#8594;</a>
          </article>

          <article class="service-card reveal-up delay-2" style="border: 1px solid rgba(26,107,60,0.2);">
            <h3>Storefront Refresh Package</h3>
            <p>For commercial clients. Routine maintenance on entry concrete, sidewalks, and high-traffic common areas.</p>
            <a href="/quote.html" class="service-link">Get a Bundle Quote &#8594;</a>
          </article>
        </div>
      </div>
    </section>
"""

with open("d:\\Future Tech Companies\\Grounds Maintenance Services\\AR-Grounds\\argrounds-website\\argrounds-final\\services\\index.html", "r", encoding="utf-8") as f:
    text = f.read()

start_marker = "<!-- PAGE HERO -->"
end_marker = "<!-- FAQ -->"
idx_start = text.find(start_marker)
idx_end = text.find(end_marker)

if idx_start != -1 and idx_end != -1:
    new_text = text[:idx_start] + services_hub_html + text[idx_end:]
    with open("d:\\Future Tech Companies\\Grounds Maintenance Services\\AR-Grounds\\argrounds-website\\argrounds-final\\services\\index.html", "w", encoding="utf-8") as f:
        f.write(new_text)
    print("Replaced successfully")
else:
    print("Could not find markers!")
