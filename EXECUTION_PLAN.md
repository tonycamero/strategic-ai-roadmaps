# 🎯 Automated Lead Enrichment Engine - Execution Plan
## TonyGroupSales | Eugene/Springfield B2B Prospecting

**Last Updated:** November 11, 2025  
**Business:** B2B CRM/Automation sales to professional services firms (3-25 employees)  
**Target Market:** Eugene/Springfield, OR (Accounting, Financial, Insurance, Law, Mortgage, Real Estate, Consulting)

---

## 📋 Executive Summary

**What We're Building:**  
An AI-powered lead enrichment system that transforms basic prospect data (name, firm, website) into rich intelligence profiles revealing:
- How they think (brand tone, content themes)
- How they market (social channels, posting cadence)
- How they buy tech (current stack, buying signals, change readiness)
- What pain points we can exploit (CRM fit score, personalized angles)

**Why It Matters:**  
- Makes outreach surgical vs. generic
- Identifies high-fit prospects (CRMFitScore 4-5) before wasting time
- Gives Maria/sales team ready-to-use intel for every conversation
- Scales pipeline generation from 50 → 500+ prospects/month

**Investment:**  
- Phase 1 POC: $100/mo, 1 week
- Full system: $100-200/mo ongoing, 4-5 weeks to build
- Dev cost: $0 (DIY) or $2-5k (hire freelancer)

**ROI:**  
- Enrichment cost: $0.10-0.25/lead
- If 5% of enriched leads → meetings → 20% close at $1k+ deal size
- 500 leads/mo × 5% × 20% × $1k = $5k/mo revenue vs. $200/mo cost = 25x ROI

---

## 🏗️ System Architecture

### Option C: Hybrid Approach (RECOMMENDED)

**Lead Sourcing:**
- Scrape Google Maps for local businesses (legal for public data)
- Export LinkedIn Sales Navigator (if available)
- Manual CSV imports from chambers, directories

**Enrichment Stack:**
- **Websites:** Playwright (free) crawls public pages
- **Tech Detection:** Wappalyzer CLI (free) identifies CRM/tools
- **Emails:** Hunter.io API ($49/mo) finds verified emails
- **Reviews:** Google Places API ($20/mo) fetches ratings/reviews
- **Intelligence:** GPT-4o-mini ($5-30/mo) analyzes everything → generates scores

**Output:**
- Enriched CSV with 14 new fields (see below)
- Auto-scored by CRM fit (1-5)
- Ready for Airtable/GHL import

---

## 📊 Enrichment Fields (Output Schema)

| Field | Description | Source | Difficulty |
|-------|-------------|--------|-----------|
| **PrimarySocialChannels** | Comma-separated active channels | Website footer scrape | Easy |
| **ContentCadence** | Posting frequency (High/Medium/Low/None) | LinkedIn/website scrape | Medium |
| **ContentThemes** | Main topics they post about | GPT-4 analysis | Easy |
| **BrandTone** | Public voice characterization | GPT-4 reads website | Easy |
| **TriggerEvents** | Recent events (new office, hiring, etc.) | News/LinkedIn parse | Hard |
| **TechStackSignals** | Tools mentioned (HubSpot, QuickBooks, etc.) | Wappalyzer + site scrape | Easy |
| **ReviewProfileSummary** | Google review footprint summary | Google Places API | Easy |
| **BuyingIntentSignals** | Hiring for marketing/CRM, running webinars, etc. | GPT-4 synthesis | Medium |
| **ChangeReadiness** | Openness to new systems (1-5 scale) | GPT-4 scores signals | Easy |
| **CRMFitScore** | Overall fit for AI CRM offer (1-5 scale) | GPT-4 scores profile | Easy |
| **DecisionDynamics** | How decisions get made | LinkedIn team analysis | Medium |
| **KeyPersonalitySignals** | Decision-maker's style from content | LinkedIn profile analysis | Medium |
| **RedFlags** | Reasons to avoid/de-prioritize | Review sentiment + GPT-4 | Easy |
| **WarpNotes** | 1-3 sentence tactical sales brief | GPT-4 synthesizes all | Easy |

**Cost per lead:** $0.10-0.25

---

## 🛠️ Tech Stack

### Core Engine
- **Language:** Python 3.10+
- **Scraping:** Playwright (headless browser for JS-heavy sites)
- **Data Processing:** Pandas (CSV manipulation)
- **LLM:** OpenAI GPT-4o-mini (cost-effective for analysis)

### APIs & Services
| Service | Purpose | Cost | Notes |
|---------|---------|------|-------|
| Google Places API | Reviews + business info | $20/mo (1k leads) | $0.017/request |
| Hunter.io | Email finding | $49/mo (1k searches) | Starter plan |
| Wappalyzer CLI | Tech stack detection | FREE | Open source |
| OpenAI API | GPT-4o-mini for scoring | $5-30/mo | $0.00015/1k input tokens |
| Bright Data (optional) | Proxies if rate-limited | $50/mo | Only if needed |

### Data Pipeline
- **Input:** CSV (FirstName, LastName, FirmName, CompanyWebsite, City, Industry)
- **Processing:** Python orchestrates scraping → API calls → LLM analysis
- **Output:** Enriched CSV with original + 14 new columns
- **Storage:** Airtable (free tier) or PostgreSQL (local)

---

## 📅 Phased Execution Plan

### **PHASE 1: Proof of Concept (Week 1)**
**Goal:** Validate approach on 10 leads  
**Budget:** $100  
**Deliverable:** Working script that enriches 10 Eugene prospects

#### Tickets:

**Ticket 1.1: Environment Setup**
```bash
# Create project structure
mkdir -p enrichment-engine/{scripts,data,output,config}
cd enrichment-engine
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install playwright pandas openai python-dotenv requests

# Setup Playwright browser
playwright install chromium
```

**Ticket 1.2: Config & Credentials**
```bash
# Create .env file with API keys
cat > .env << 'EOF'
OPENAI_API_KEY=your_key_here
HUNTER_API_KEY=your_key_here
GOOGLE_PLACES_API_KEY=your_key_here
EOF

# Create config.py for settings
touch config/settings.py
```

**Ticket 1.3: Website Scraper Module**
```python
# scripts/scrape_website.py
# Function: scrape_website(url) -> dict
# - Crawls homepage + about page
# - Extracts text content, meta tags, footer links
# - Returns: {text, social_links, meta_description}
```

**Ticket 1.4: Tech Stack Detector**
```python
# scripts/detect_tech.py
# Function: detect_tech_stack(url) -> list
# - Uses Wappalyzer CLI or custom header detection
# - Returns: ['WordPress', 'HubSpot', 'Google Analytics', etc.]
```

**Ticket 1.5: Review Fetcher**
```python
# scripts/fetch_reviews.py
# Function: fetch_google_reviews(business_name, city) -> dict
# - Calls Google Places API
# - Returns: {rating, review_count, top_themes}
```

**Ticket 1.6: LLM Analyzer**
```python
# scripts/llm_analysis.py
# Function: analyze_with_gpt(website_text, tech_stack, reviews) -> dict
# - Prompts GPT-4o-mini with structured questions
# - Returns: {brand_tone, content_themes, change_readiness, crm_fit_score, warp_notes}
```

**Ticket 1.7: Main Orchestrator**
```python
# scripts/enrich_leads.py
# Main script that:
# 1. Reads input CSV (10 test leads)
# 2. For each lead:
#    - Scrape website
#    - Detect tech stack
#    - Fetch reviews
#    - Analyze with LLM
#    - Append enrichment fields
# 3. Write output CSV
```

**Ticket 1.8: POC Test Run**
```bash
# Extract 10 leads from master CSV
head -n 11 eugene_prospects_master.csv > data/test_leads.csv

# Run enrichment
python scripts/enrich_leads.py --input data/test_leads.csv --output output/enriched_test.csv

# Review results
cat output/enriched_test.csv
```

**Success Criteria:**
- ✅ 8/10 leads enriched successfully
- ✅ CRMFitScore feels accurate when manually validated
- ✅ WarpNotes provide actionable outreach angles
- ✅ Total cost < $10 (API usage on 10 leads)

---

### **PHASE 2: Full Pipeline Build (Weeks 2-3)**
**Goal:** Scale to 169 leads + production-ready code  
**Budget:** $100-150/mo  
**Deliverable:** Batch processor that handles full prospect list

#### Tickets:

**Ticket 2.1: Error Handling & Retry Logic**
- Add try/catch blocks for API failures
- Implement exponential backoff for rate limits
- Log failures to errors.csv for manual review

**Ticket 2.2: Email Enrichment**
- Integrate Hunter.io API for missing emails
- Add email validation/verification step
- Append to output: EmailFound, EmailVerified

**Ticket 2.3: LinkedIn Profile Analysis (Optional)**
- Use Evaboot ($29/mo) for compliant LinkedIn export
- OR manual CSV import from Sales Navigator
- Extract: JobTitle, YearsAtCompany, RecentPosts

**Ticket 2.4: Batch Processing**
- Add parallel processing (multiprocessing or asyncio)
- Process 10 leads at a time to avoid rate limits
- Progress bar + ETA display

**Ticket 2.5: Data Validation**
- Check for duplicate leads (by email/domain)
- Validate required fields before enrichment
- Flag incomplete records

**Ticket 2.6: Full List Test**
```bash
# Run on all 169 leads
python scripts/enrich_leads.py --input data/eugene_prospects_master.csv --output output/enriched_full.csv --parallel 5

# Expected runtime: 2-3 hours
# Expected cost: $20-30 in API calls
```

**Success Criteria:**
- ✅ 140+ of 169 leads enriched (80%+ success rate)
- ✅ At least 20 leads score CRMFitScore 4-5
- ✅ Error log explains all failures
- ✅ Output CSV imports cleanly to Airtable

---

### **PHASE 3: Lead Sourcing Automation (Week 4)**
**Goal:** Auto-discover 100+ new prospects/week  
**Budget:** $150-200/mo  
**Deliverable:** Scrapers that populate pipeline continuously

#### Tickets:

**Ticket 3.1: Google Maps Scraper**
```python
# scripts/scrape_google_maps.py
# Search queries:
# - "CPA Eugene OR"
# - "financial advisor Springfield OR"
# - "insurance agency Eugene OR"
# - etc.
# Extract: Name, Address, Phone, Website, Rating, ReviewCount
# Output: new_leads.csv
```

**Ticket 3.2: Yelp Scraper (Backup)**
- Similar to Google Maps but uses Yelp business search
- Complements coverage for service businesses

**Ticket 3.3: Chamber Directory Import**
- Download Eugene Area Chamber member list
- Parse PDF or scrape online directory
- Normalize to standard CSV format

**Ticket 3.4: Deduplication Pipeline**
- Check new leads against existing database
- Match by domain, phone, or normalized business name
- Flag duplicates, only enrich new records

**Ticket 3.5: Weekly Automation**
```bash
# Create cron job to run every Monday
0 9 * * 1 /home/tonycamero/code/TonyGroupSales/enrichment-engine/run_weekly.sh
```

**Success Criteria:**
- ✅ 100+ new leads discovered per week
- ✅ <5% duplicate rate
- ✅ Auto-enrichment runs without manual intervention

---

### **PHASE 4: Integration & Automation (Week 5)**
**Goal:** Hands-off operation with CRM integration  
**Budget:** $150-200/mo  
**Deliverable:** Fully automated pipeline from discovery → enrichment → CRM

#### Tickets:

**Ticket 4.1: Airtable Integration**
```python
# scripts/push_to_airtable.py
# Use Airtable API to:
# - Create new records for enriched leads
# - Update existing records with new enrichment data
# - Tag high-fit prospects (CRMFitScore >= 4)
```

**Ticket 4.2: Slack Notifications**
```python
# scripts/notify_slack.py
# Post to #sales channel when:
# - New CRMFitScore 5 prospect discovered
# - Weekly summary (X new leads, Y high-fit)
# Include: FirmName, CRMFitScore, WarpNotes snippet
```

**Ticket 4.3: GHL Integration (Optional)**
- If using GoHighLevel CRM
- Push enriched leads directly to pipeline
- Auto-assign to Maria based on industry/fit score

**Ticket 4.4: Daily Health Check**
```bash
# Cron job runs daily at 6am
# Checks: API quotas, error rates, enrichment success rate
# Emails alert if success rate < 70%
```

**Ticket 4.5: Analytics Dashboard**
- Simple Python notebook or Streamlit app
- Shows: leads/week, enrichment success rate, top industries, CRM fit distribution
- Helps optimize targeting

**Success Criteria:**
- ✅ Zero manual work required for weekly pipeline fill
- ✅ High-fit prospects surface in Slack within 24hrs of discovery
- ✅ System runs for 4 consecutive weeks without critical failures

---

## 💰 Cost Breakdown

### Monthly Operational Costs

| Item | Phase 1 (POC) | Phase 2 (Full) | Phase 3-4 (Ongoing) |
|------|---------------|----------------|---------------------|
| Google Places API | $5 | $20 | $20-40 |
| Hunter.io | $49 | $49 | $49 |
| OpenAI API (GPT-4o-mini) | $3 | $10 | $20-30 |
| Evaboot (LinkedIn) | $0 | $0 | $29 (optional) |
| Proxies (if needed) | $0 | $0 | $50 (if rate-limited) |
| **Total** | **~$60** | **~$80** | **~$150-200** |

### One-Time Costs
- Development time: $0 (DIY) or $2,000-5,000 (hire dev on Upwork)
- Setup/testing: 20-40 hours

### ROI Analysis (500 leads/month)
```
Enrichment cost: $200/mo
Leads enriched: 500
Cost per lead: $0.40

Assuming:
- 5% meeting conversion (25 meetings)
- 20% close rate (5 deals)
- $1,500 avg deal size

Monthly revenue: $7,500
Monthly cost: $200
Net profit: $7,300
ROI: 36.5x
```

---

## ⚖️ Legal & Ethical Compliance

### What We DON'T Do (High Risk)
- ❌ Scrape LinkedIn profiles directly (TOS violation, lawsuit risk)
- ❌ Scrape Facebook/Instagram business pages (TOS violation)
- ❌ Harvest emails from sites with robots.txt blocks
- ❌ Store sensitive personal data without clear business purpose
- ❌ Send unsolicited emails without CAN-SPAM compliance

### What We DO (Compliant)
- ✅ Crawl publicly accessible web pages (legal under HiQ v. LinkedIn ruling)
- ✅ Use official APIs with proper authentication
- ✅ Provide opt-out mechanism for enriched contacts
- ✅ Respect robots.txt and rate limits
- ✅ Include privacy policy covering data use
- ✅ CAN-SPAM compliance: physical address, unsubscribe link, accurate subject lines

### Risk Mitigation
- Use Evaboot ($29/mo) for LinkedIn data instead of scraping
- Rotate proxies only if necessary (ethical providers like Bright Data)
- Document data sources in enrichment pipeline
- Regular compliance audits (quarterly review)

---

## 🎯 Success Metrics

### Phase 1 (POC)
- [ ] 80%+ enrichment success rate on test batch
- [ ] CRMFitScore correlates with manual assessment
- [ ] WarpNotes provide unique outreach angles
- [ ] Cost < $10 for 10 leads

### Phase 2 (Full Pipeline)
- [ ] 140+ of 169 initial leads enriched
- [ ] 20+ prospects score CRMFitScore 4-5
- [ ] 1+ meeting booked using enriched intel
- [ ] Clean Airtable import with no manual cleanup

### Phase 3 (Lead Sourcing)
- [ ] 100+ new prospects discovered per week
- [ ] <5% duplicate rate
- [ ] 70%+ enrichment success on auto-discovered leads

### Phase 4 (Automation)
- [ ] 4 consecutive weeks with zero manual intervention
- [ ] High-fit prospects surface in Slack within 24hrs
- [ ] Sales team closes 1+ deal attributed to enriched data

---

## 🚨 Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| API rate limits | Medium | Medium | Add proxies, implement backoff |
| Scraper breakage | High | Low | 10-20% monthly maintenance budget |
| LinkedIn TOS violation | Low | High | Use Evaboot, avoid direct scraping |
| GDPR/CCPA compliance | Medium | High | Add opt-out, document data sources |
| Low enrichment quality | Medium | High | A/B test prompts, tune scoring model |
| Cost overrun | Low | Medium | Set API spending alerts |

---

## 📝 Implementation Checklist

### Pre-Launch
- [ ] Create GitHub repo: `tony-enrichment-engine`
- [ ] Set up .env with API keys
- [ ] Create test dataset (10 leads)
- [ ] Document prompt templates for GPT-4
- [ ] Set up error logging

### Phase 1 (POC)
- [ ] Build website scraper
- [ ] Integrate Wappalyzer
- [ ] Connect Google Places API
- [ ] Connect OpenAI API
- [ ] Build main orchestrator
- [ ] Test on 10 leads
- [ ] Review results with team

### Phase 2 (Full Build)
- [ ] Add error handling
- [ ] Integrate Hunter.io
- [ ] Implement batch processing
- [ ] Run on full 169-lead list
- [ ] Import to Airtable
- [ ] Train Maria on enriched data

### Phase 3 (Sourcing)
- [ ] Build Google Maps scraper
- [ ] Add deduplication logic
- [ ] Set up weekly cron job
- [ ] Monitor for 2 weeks

### Phase 4 (Automation)
- [ ] Connect Airtable API
- [ ] Set up Slack webhooks
- [ ] Create analytics dashboard
- [ ] Document runbook for troubleshooting
- [ ] Hand off to operations

---

## 📚 Appendix

### Sample Enrichment Prompts

**Brand Tone Analysis:**
```
Analyze the following website copy and characterize the brand tone on a 1-5 scale:
1 = Very conservative/corporate
2 = Professional but approachable
3 = Warm/relationship-focused
4 = Modern/data-driven
5 = Bold/unconventional

Website text: {text}

Respond in JSON format:
{
  "tone_score": 3,
  "rationale": "One sentence explanation"
}
```

**CRM Fit Scoring:**
```
You are a B2B sales analyst evaluating a prospect's fit for an AI-powered CRM solution.

Prospect profile:
- Industry: {industry}
- Company size: {size}
- Services: {services}
- Tech stack: {tech_stack}
- Review themes: {review_summary}

Rate CRM fit on 1-5 scale:
1 = Very poor fit (too small, simple, or locked into enterprise stack)
3 = Moderate fit (some potential but challenges)
5 = Excellent fit (ideal size, complexity, manual processes, growth signals)

Respond in JSON format:
{
  "crm_fit_score": 4,
  "rationale": "One sentence explanation",
  "key_pain_points": ["pain 1", "pain 2"]
}
```

### Tech Stack Detection (Wappalyzer CLI)
```bash
# Install Wappalyzer CLI
npm install -g wappalyzer

# Run detection
wappalyzer https://example.com --pretty

# Sample output:
# {
#   "technologies": [
#     {"name": "WordPress", "categories": ["CMS"]},
#     {"name": "Google Analytics", "categories": ["Analytics"]}
#   ]
# }
```

### Sample Output CSV Structure
```csv
FirstName,LastName,FirmName,CompanyWebsite,City,Industry,PrimarySocialChannels,ContentCadence,ContentThemes,BrandTone,TriggerEvents,TechStackSignals,ReviewProfileSummary,BuyingIntentSignals,ChangeReadiness,CRMFitScore,DecisionDynamics,KeyPersonalitySignals,RedFlags,WarpNotes
Chris,Palmer,BVal CPAs & Advisors LLP,https://www.bvalcpas.com,Eugene,Accounting,"LinkedIn,Facebook",Medium,"Tax tips, business advisory, local events",Conservative/professional,"Hiring for marketing coordinator; New blog launched 2024","WordPress,HubSpot,QuickBooks","4.8 stars on 42 Google reviews; praised for responsiveness","Active hiring for ops roles; Running monthly webinar series",4,5,"Multi-partner consensus; 3-5 person leadership team","Data-driven; emphasizes education and long-term relationships","None","Large advisory-heavy firm with HubSpot already but fragmented client touchpoint tracking. Angle: unify CRM across tax/consulting/advisory workflows."
```

---

## 🎬 Next Steps

**To kick off Phase 1 POC:**
1. Create project directory: `cd /home/tonycamero/code/TonyGroupSales && mkdir enrichment-engine`
2. Set up Python environment (Ticket 1.1)
3. Obtain API keys:
   - OpenAI: https://platform.openai.com/api-keys
   - Hunter.io: https://hunter.io/api-keys
   - Google Places: https://console.cloud.google.com/apis/credentials
4. Extract 10 test leads from master CSV
5. Run through Tickets 1.2-1.8
6. Review enriched output and validate quality

**Ready to execute when you give the signal.** 🚀

---

**Document Owner:** Tony Camero  
**Repository:** `/home/tonycamero/code/TonyGroupSales`  
**Status:** Planning - Awaiting Phase 1 kickoff
