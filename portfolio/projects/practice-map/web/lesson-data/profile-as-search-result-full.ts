import type { LessonSection } from "../curriculum";

export const sections: readonly LessonSection[] = [
  {
    heading: null,
    blocks: [
      {"kind":"p","text":"*An in-depth guide to refining your CV and LinkedIn to land a job, ranked by what matters most*"},
    ],
  },
  {
    heading: "Before We Start: How Hiring Actually Works",
    blocks: [
      {"kind":"p","text":"Most CV advice fails because it is written from the candidate's point of view: \"How do I present myself well?\" The useful question comes from the other side of the desk: \"What is the person hiring me actually doing when they encounter my profile?\""},
      {"kind":"p","text":"Here is what really happens."},
      {"kind":"p","text":"**A recruiter has a req (a job to fill) and too little time.** They might have 15–40 open roles at once. For each, they either sort through hundreds of applicants or go hunting on LinkedIn using a search tool called LinkedIn Recruiter. That tool lets them filter by job title, keywords, skills, location, years of experience, current or past companies, schools, and whether someone is open to work."},
      {"kind":"p","text":"**Your profile then goes through three stages, each with a different reader:**"},
      {"kind":"list","ordered":true,"items":["**The search stage (a machine).** Do you show up at all? This depends on keywords, titles, location, and skills. If you don't appear in the search results, nothing else matters.","**The skim stage (a tired human, ~7 seconds).** Eye-tracking research by the job site Ladders found recruiters spend roughly 7 seconds on an initial resume scan. They look at current title, current company, previous title and company, dates, and education. On LinkedIn, they see your photo, headline, current role, and location in the search results before they even click.","**The read stage (an interested human, 1–3 minutes).** If you pass the skim, someone actually reads. Now they want evidence. What did you accomplish, at what scale, and does it match what they need?"]},
      {"kind":"p","text":"Then, if you get through, a hiring manager repeats stages 2 and 3 with a more skeptical, more technical eye."},
      {"kind":"p","text":"**The core mental model:** your profile is a **search result** first, a **sales page** second, and a **reference document** third. Most people write it as a reference document only, which is a list of everything they've done, and wonder why nobody calls."},
      {"kind":"p","text":"Everything below is ranked by how much it moves you through that funnel."},
    ],
  },
  {
    heading: "The Ranking",
    blocks: [
      {"kind":"list","items":["1 — Know your target; Why it matters: Every other decision depends on it","2 — Understand how you get found; Why it matters: Invisible profiles don't get calls","3 — Write impact, not duties; Why it matters: The single biggest quality gap between candidates","4 — The headline; Why it matters: Most-viewed text you own","5 — Job titles & Experience structure; Why it matters: What recruiters actually skim","6 — The first-glance zone; Why it matters: Photo, location, Open to Work","7 — The About section; Why it matters: Your narrative and keyword reservoir","8 — The CV as a tailored document; Why it matters: Formatting, ATS parsing, tailoring","9 — Skills section; Why it matters: A searchable filter, not decoration","10 — Proof; Why it matters: Recommendations, Featured, portfolio","11 — Visibility; Why it matters: Network and activity","12 — The hard cases; Why it matters: Gaps, career changes, layoffs","13 — Settings & hygiene; Why it matters: Small mistakes that cost interviews","14 — What to ignore; Why it matters: Where people waste effort"]},
    ],
  },
  {
    heading: "#1 — Know Your Target (Positioning)",
    blocks: [
      {"kind":"p","text":"**Why it's #1:** A profile written for \"any job\" is optimized for no job. Keywords, headline, which achievements you lead with, and what you leave out all depend on knowing who you're trying to convince."},
      {"kind":"p","text":"The most common failure is not bad writing. It is vagueness. \"Experienced professional with a passion for growth and innovation, seeking new opportunities\" describes everyone and therefore no one. A recruiter searching for a *Senior Product Marketing Manager in fintech* will never find that person, and wouldn't recognize them if they did."},
    ],
  },
  {
    heading: "How to define your target",
    blocks: [
      {"kind":"p","text":"Answer these in writing:"},
      {"kind":"list","items":["**Role title(s):** What exact title would appear on the job posting? Pick one primary title and at most one or two close variants (e.g., \"Data Analyst\" / \"Business Intelligence Analyst\").","**Level:** Junior, mid, senior, lead, manager, director? Be realistic but not modest.","**Industry or domain (if relevant):** Healthcare, B2B SaaS, logistics, public sector?","**Location / work model:** City, remote, hybrid, which countries?","**Your edge:** What makes you better than the average candidate for this role? Usually it's a combination, such as \"an engineer who understands finance\" or \"a recruiter who's done sales.\""]},
    ],
  },
  {
    heading: "The research exercise that changes everything",
    blocks: [
      {"kind":"p","text":"Collect **10–15 real job postings** for your target role. Paste them into one document. Then highlight:"},
      {"kind":"list","items":["Words and phrases that appear repeatedly (these are your keywords)","Tools and technologies mentioned","Responsibilities that show up in most postings","What separates senior postings from junior ones"]},
      {"kind":"p","text":"This document becomes your source of truth. You're no longer guessing what employers want, because you're reading their exact language. You'll use it in every section below."},
    ],
  },
  {
    heading: "Write a one-sentence positioning statement",
    blocks: [
      {"kind":"callout","variant":"key","text":"*\"I'm a [title] who [does what] for [whom/what kind of company], with particular strength in [edge].\"*"},
      {"kind":"p","text":"Example: *\"I'm a supply chain analyst who uses data to cut costs in manufacturing operations, with particular strength in automating reporting that used to be done by hand.\"*"},
      {"kind":"p","text":"You won't paste this anywhere verbatim, but it will become the spine of your headline, About section, and CV summary."},
      {"kind":"p","text":"**If you're targeting two different directions** (say, project management and operations), you can make a LinkedIn profile that bridges both if they're close. If they're genuinely different, LinkedIn should lean toward the primary target, and you tailor separate CVs for each."},
    ],
  },
  {
    heading: "#2 — Understand How You Get Found (Search & Keywords)",
    blocks: [
      {"kind":"p","text":"**Why it's #2:** You can have the best-written profile in the world, and if it doesn't contain the words recruiters type into search, it will sit unread. On LinkedIn especially, a huge share of opportunities come from recruiters finding *you* (inbound), not from you applying."},
    ],
  },
  {
    heading: "How LinkedIn search works (simplified)",
    blocks: [
      {"kind":"p","text":"When a recruiter searches, LinkedIn matches their query against your profile's text, giving more weight to certain fields. The fields that matter most:"},
      {"kind":"list","ordered":true,"items":["**Headline**","**Current job title**","**Past job titles**","**Skills section**","**About section**","**Experience descriptions**","**Location** (a hard filter: if you're outside their location filter, you're gone)"]},
      {"kind":"p","text":"Recruiters often search by title first (\"Product Designer\"), then narrow with keywords (\"Figma,\" \"design systems,\" \"B2B\"), location, and years of experience."},
    ],
  },
  {
    heading: "The ATS myth, corrected",
    blocks: [
      {"kind":"p","text":"You've probably heard that \"75% of resumes are rejected by robots before a human sees them.\" This is mostly a myth. Applicant Tracking Systems (Workday, Greenhouse, Lever, iCIMS, etc.) are primarily databases and workflow tools. Most do not auto-reject based on a keyword score."},
      {"kind":"p","text":"What actually happens:"},
      {"kind":"list","items":["**Knockout questions** auto-reject you (\"Do you have work authorization?\" \"Do you have 5+ years of experience?\"). Answer these honestly but carefully.","**Recruiters search and filter** inside the ATS using keywords, the same way they do on LinkedIn. If your CV lacks the terms, you won't come up when they search.","**Parsing errors** can scramble your CV if it uses complex layouts, which makes you look worse when a human reads the parsed version.","**Volume** is the real killer. A posting gets 300+ applicants, and the recruiter reviews the first 50 or the top results of a keyword search."]},
      {"kind":"p","text":"So keywords matter, but because humans use search, not because robots grade you."},
    ],
  },
  {
    heading: "How to use keywords well",
    blocks: [
      {"kind":"list","items":["**Mirror the exact phrasing** from job postings. If postings say \"stakeholder management,\" don't write only \"working with partners.\" If they say \"Salesforce,\" write \"Salesforce,\" not just \"CRM tools.\"","**Include both acronym and full term** at least once: \"Search Engine Optimization (SEO),\" \"Applicant Tracking System (ATS).\"","**Put keywords in context**, not lists. \"Built Tableau dashboards that reduced weekly reporting time by 6 hours\" beats a block of keywords. It's searchable *and* credible.","**Use the title variants** recruiters search for. A \"Software Engineer\" might also be searched as \"Software Developer,\" \"Backend Engineer,\" or \"Full Stack Developer.\" Work variants naturally into your headline or About section.","**Don't keyword-stuff.** A headline like \"Marketing | Digital Marketing | Marketing Manager | Marketing Strategy | Growth Marketing\" reads as desperate and spammy to the human who eventually looks."]},
    ],
  },
  {
    heading: "#3 — Write Impact, Not Duties",
    blocks: [
      {"kind":"p","text":"**Why it's #3:** This is the single biggest quality difference between profiles that get interviews and profiles that don't. Once you're found, this is what convinces. It applies equally to your CV and LinkedIn."},
    ],
  },
  {
    heading: "The problem",
    blocks: [
      {"kind":"p","text":"Most people describe their job description:"},
      {"kind":"callout","variant":"key","text":"- Responsible for managing social media accounts - Handled customer inquiries - Worked on the data pipeline - Assisted with onboarding new employees"},
      {"kind":"p","text":"This tells a recruiter what you were *supposed* to do. It says nothing about whether you were good at it. Every other person with that title did the same things."},
    ],
  },
  {
    heading: "The fix: the XYZ formula",
    blocks: [
      {"kind":"p","text":"Laszlo Bock, Google's former head of people operations, popularized this structure:"},
      {"kind":"callout","variant":"key","text":"**Accomplished [X] as measured by [Y], by doing [Z].**"},
      {"kind":"p","text":"Or, more flexibly: **Action verb + what you did + result (preferably measured) + how or why it mattered.**"},
    ],
  },
  {
    heading: "Before and after examples",
    blocks: [
      {"kind":"p","text":"**Marketing**"},
      {"kind":"list","items":["NO *Responsible for managing social media accounts.*","YES *Grew LinkedIn following from 4K to 19K in 12 months by launching a weekly customer-story series, generating 300+ inbound demo requests.*"]},
      {"kind":"p","text":"**Customer service**"},
      {"kind":"list","items":["NO *Handled customer inquiries via phone and email.*","YES *Resolved 60+ customer tickets daily with a 96% satisfaction score, highest on a team of 14; wrote 25 help-center articles that reduced repeat inquiries by 18%.*"]},
      {"kind":"p","text":"**Software engineering**"},
      {"kind":"list","items":["NO *Worked on the data pipeline.*","YES *Rebuilt the nightly ETL pipeline in Python and Airflow, cutting runtime from 5 hours to 40 minutes and eliminating the recurring failures that delayed morning reports.*"]},
      {"kind":"p","text":"**Operations / HR**"},
      {"kind":"list","items":["NO *Assisted with onboarding new employees.*","YES *Redesigned the onboarding process for 120+ hires per year, cutting time-to-productivity from 6 weeks to 4 and raising 90-day retention from 82% to 91%.*"]},
      {"kind":"p","text":"**Teaching**"},
      {"kind":"list","items":["NO *Taught math to high school students.*","YES *Taught algebra and geometry to 150 students per year; raised the pass rate on state exams from 64% to 81% over two years by introducing data-driven small-group intervention.*"]},
    ],
  },
  {
    heading: "\"But I don't have numbers\"",
    blocks: [
      {"kind":"p","text":"You almost always have more than you think. Look for:"},
      {"kind":"list","items":["**Volume:** How many? Customers served, tickets closed, reports produced, people trained, projects run","**Frequency:** How often? Daily, weekly, per quarter","**Scale:** How big? Budget size, team size, number of users, revenue of the product, number of locations","**Time:** How much faster? Hours saved, deadlines met, cycle times reduced","**Money:** Revenue generated, costs cut, budget managed","**Quality:** Error rates, satisfaction scores, retention, compliance results","**Rank:** Top performer, first to do X, selected over others, promoted early","**Before vs. after:** What was the situation before you, and after?"]},
      {"kind":"p","text":"If exact numbers aren't available, **honest estimates are acceptable** (\"~30%,\" \"roughly 200 accounts\"), as long as you can explain how you got them in an interview. Never invent numbers. Interviewers probe, and a fabricated metric that collapses under one follow-up question will sink you."},
      {"kind":"p","text":"If something really can't be quantified, show **scope or consequence** instead:"},
      {"kind":"list","items":["*\"Selected by the VP of Sales to lead the CRM migration across 3 regional teams.\"*","*\"Wrote the incident response playbook now used company-wide.\"*"]},
    ],
  },
  {
    heading: "Calibrate to your level",
    blocks: [
      {"kind":"p","text":"What counts as impressive changes with seniority:"},
      {"kind":"list","items":["**Junior:** Show execution, learning speed, reliability, and initiative. (\"Automated a manual spreadsheet process in my first month, saving the team 4 hours weekly.\")","**Mid-level:** Show ownership. You led things end-to-end and the results were yours.","**Senior:** Show scope, judgment, and influence. You set direction, improved how others work, and made decisions with large consequences.","**Manager/Leader:** Show the team's results, hiring and developing people, and business outcomes. (\"Built and led a 9-person team that delivered...\")"]},
      {"kind":"p","text":"A senior candidate whose bullets read like a junior's (\"Completed tasks assigned by manager\") will be leveled down. A junior candidate who claims \"drove company strategy\" will be disbelieved."},
    ],
  },
  {
    heading: "Practical rules for bullets",
    blocks: [
      {"kind":"list","items":["Start with a strong, specific verb: *built, launched, cut, grew, redesigned, negotiated, led, automated, won.* Avoid *helped, assisted, was responsible for, participated in*.","Lead with the result when it's impressive: *\"Cut cloud costs 34% by...\"*","3–6 bullets for recent roles; 1–3 for older ones.","One to two lines each. If it needs three, split it or cut it.","Order bullets by relevance to your target, not chronology."]},
    ],
  },
  {
    heading: "#4 — The Headline",
    blocks: [
      {"kind":"p","text":"**Why it's #4:** Your headline appears everywhere: search results, comments, connection requests, messages, \"people you may know.\" It's the most-viewed text you control and one of the most heavily weighted fields in search. You have 220 characters."},
    ],
  },
  {
    heading: "The default is wasted space",
    blocks: [
      {"kind":"p","text":"If you don't write one, LinkedIn uses your current job title and company: *\"Analyst at Acme Corp.\"* That's fine but bland, and if your title is unusual it might actively hurt you."},
    ],
  },
  {
    heading: "A formula that works",
    blocks: [
      {"kind":"callout","variant":"key","text":"**[Target Title] | [Specialty or Domain] | [Proof or Value]**"},
      {"kind":"p","text":"Examples:"},
      {"kind":"list","items":["*Senior Data Analyst | SQL, Python, Tableau | Turning messy operational data into decisions for logistics teams*","*Product Designer | B2B SaaS & Design Systems | Previously at Shopify*","*Registered Nurse → Healthcare Operations | Process improvement, patient flow, Lean Six Sigma Green Belt*","*Account Executive | Mid-Market SaaS | 132% of quota 2023 · President's Club*","*Frontend Engineer | React, TypeScript | Building fast, accessible web apps*"]},
    ],
  },
  {
    heading: "Principles",
    blocks: [
      {"kind":"list","items":["**Put your target title first.** Recruiters scan left to right, and search weights it.","**Be the role you want, honestly.** If you're a \"Marketing Coordinator\" applying for \"Marketing Specialist\" roles, you can write \"Marketing Specialist | Content & Email\" if your work genuinely matches. Don't claim a title you can't support.","**Specific beats grand.** \"Visionary Leader | Change Agent | Thought Leader\" is noise. \"Engineering Manager | Platform & Infrastructure | Teams of 5–15\" is signal.","**One piece of credibility goes far:** a recognizable company, a metric, a credential, or a notable achievement.","**The front matters most.** Only the first ~60–80 characters show in many views (search results, mobile). Make sure the beginning stands on its own.","**Avoid:** \"Seeking opportunities,\" \"Unemployed,\" \"Aspiring [X],\" and walls of pipes and buzzwords. \"Aspiring Data Scientist\" tells a recruiter you're not one yet. \"Data Analyst | Python, Machine Learning\" positions you as someone who already does the work."]},
    ],
  },
  {
    heading: "#5 — Job Titles and the Experience Section",
    blocks: [
      {"kind":"p","text":"**Why it's #5:** This is what recruiters actually skim. In those first seconds, they look at your current and previous titles, companies, and dates to judge \"Is this person at the right level, in the right field, on the right trajectory?\""},
    ],
  },
  {
    heading: "Job titles: honest translation",
    blocks: [
      {"kind":"p","text":"Companies invent strange titles. \"Customer Happiness Hero,\" \"Member of Technical Staff,\" \"Associate III,\" \"Analyst\" (which can mean anything from entry-level to senior specialist)."},
      {"kind":"p","text":"Recruiters search by standard titles. If yours is non-standard, you can translate it, as long as it's truthful:"},
      {"kind":"list","items":["**Option A:** Use the standard equivalent: *Customer Success Manager*","**Option B:** Combine them: *Customer Success Manager (official title: Customer Happiness Hero)*","**Option C:** Keep the official title, and put the standard one in the headline and description"]},
      {"kind":"p","text":"The rule: **would your former manager agree that the translated title accurately describes your job?** If yes, you're fine. If you're inflating (\"Coordinator\" → \"Manager\"), you risk being caught in a background check, which often verifies titles."},
    ],
  },
  {
    heading: "Structure each role well",
    blocks: [
      {"kind":"p","text":"For each position:"},
      {"kind":"list","ordered":true,"items":["**Title, company, dates, location** (accurately; dates are checked).","**One line of context** (optional but powerful, especially for lesser-known companies): *\"Series B fintech startup, 80 employees, serving 2,000 small businesses.\"* This helps the reader judge scale.","**3–6 achievement bullets** (see #3).","**Skills tagged** to the role (LinkedIn lets you attach skills to each position, which strengthens your skills section's credibility and searchability)."]},
    ],
  },
  {
    heading: "Show progression",
    blocks: [
      {"kind":"p","text":"If you were promoted within a company, **list each title separately under the same company** (LinkedIn groups them automatically). Promotions are one of the strongest signals you can show. They prove that people who saw your work up close chose to give you more responsibility."},
    ],
  },
  {
    heading: "How far back to go",
    blocks: [
      {"kind":"list","items":["Detail the last **10–15 years**.","Older roles can be listed with title and company only, or summarized.","Very early or irrelevant jobs (retail during university when you're now a senior engineer) can be removed, unless they fill a meaningful gap or show something relevant."]},
    ],
  },
  {
    heading: "LinkedIn vs. CV here",
    blocks: [
      {"kind":"p","text":"LinkedIn can hold more detail per role (up to 2,000 characters). But don't paste a novel. The same skim rules apply. Use bullets, put the best first, and keep it tight. Your CV should be even more selective, tailored to each application (see #8)."},
    ],
  },
  {
    heading: "#6 — The First-Glance Zone",
    blocks: [
      {"kind":"p","text":"**Why it's #6:** Before anyone reads a word, they see your photo, banner, name, headline, location, and whether you're open to work. This shapes the first impression and, in the case of location, determines whether you appear in search at all."},
    ],
  },
  {
    heading: "Photo",
    blocks: [
      {"kind":"p","text":"LinkedIn has long reported that profiles with photos get dramatically more views (their oft-quoted figure is up to 21x more views). Whatever the exact number, a missing photo reads as an incomplete or suspicious profile."},
      {"kind":"p","text":"A good photo:"},
      {"kind":"list","items":["Your face takes up ~60% of the frame (head and shoulders)","You look like yourself on a good day, as you'd show up to an interview in your field","Good, natural light (facing a window works well)","Simple, uncluttered background","You look approachable. A genuine slight smile helps in most fields.","Recent (within a few years)"]},
      {"kind":"p","text":"You don't need a professional photographer. A modern phone in portrait mode, a friend, and a window will do. Avoid group crops, sunglasses, wedding photos, and distant vacation shots."},
    ],
  },
  {
    heading: "Banner",
    blocks: [
      {"kind":"p","text":"The banner image behind your photo is optional but free real estate. A simple, clean image related to your field, your city skyline, or your company's branded banner all work. Some people add a one-line value statement or contact info. A plain default banner won't cost you a job, but a thoughtful one adds polish."},
    ],
  },
  {
    heading: "Location",
    blocks: [
      {"kind":"p","text":"**This is more important than people realize.** Recruiters filter by location. If you're in Manchester targeting London roles, or open to relocation, your location setting determines whether you appear."},
      {"kind":"list","items":["Set it to the **metro area you're targeting** (LinkedIn uses city/region granularity).","If you're open to multiple locations or remote work, mention that in your About section and Open to Work settings.","Be honest. If you set London but live in Manchester, be ready to explain your relocation plan in the first call."]},
    ],
  },
  {
    heading: "Open to Work",
    blocks: [
      {"kind":"p","text":"You have two options:"},
      {"kind":"list","ordered":true,"items":["**Recruiters only.** Visible to people using LinkedIn Recruiter. LinkedIn takes steps to hide this from recruiters at your current company, but it explicitly cannot guarantee full privacy. This is low-risk and high-value, so turn it on if you're looking.","**All LinkedIn members.** Adds the green #OpenToWork frame to your photo."]},
      {"kind":"p","text":"The green frame is genuinely debated. Some recruiters say it signals availability and they reach out more. Others (and some hiring managers) quietly perceive it as a sign of desperation or unemployment. Evidence is mixed and opinions vary by industry."},
      {"kind":"p","text":"**A reasonable approach:** Use \"Recruiters only\" by default. Consider the public frame if you're unemployed, early in your career, or in a field where it's common and well-received, and you want your network's help actively."},
      {"kind":"p","text":"Either way, **fill in the Open to Work details carefully:** job titles (up to 5), locations, remote/hybrid/on-site, start date, and employment type. Recruiters filter on these."},
    ],
  },
  {
    heading: "#7 — The About Section",
    blocks: [
      {"kind":"p","text":"**Why it's #7:** It's not what gets you found first, and many recruiters skip it in a quick skim. But for the reader who's interested, it's where you tell your story, and it's a high-capacity space for keywords (up to 2,600 characters)."},
    ],
  },
  {
    heading: "The first three lines are everything",
    blocks: [
      {"kind":"p","text":"Only about the first 2–3 lines show before \"...see more.\" Treat them as your hook. Many people waste them on throat-clearing: *\"I am a results-driven professional with over 10 years of experience in various industries...\"*"},
      {"kind":"p","text":"Instead, lead with who you are and what you do, concretely."},
    ],
  },
  {
    heading: "A reliable structure",
    blocks: [
      {"kind":"list","ordered":true,"items":["**Hook (1–2 sentences):** Who you are, what you do, for whom.","**Proof (2–4 sentences or bullets):** Your most impressive and relevant achievements.","**How you work / what you're known for (1–3 sentences):** Your approach, strengths, or the problems you love solving.","**What you're looking for (1–2 sentences, optional):** Especially useful if job hunting.","**Keywords / Specialties (optional):** A short line of core skills, tools, or domains.","**Call to action:** How to reach you."]},
    ],
  },
  {
    heading: "Example",
    blocks: [
      {"kind":"callout","variant":"key","text":"I help B2B software companies turn product usage data into revenue decisions. Over the past six years as a data analyst, I've built the reporting systems that sales, product, and finance teams rely on daily.  Some highlights: • Built a churn-prediction model that flagged at-risk accounts 60 days earlier, helping save ~$1.2M in annual recurring revenue • Replaced 40+ manual spreadsheets with automated dashboards in Looker, saving the finance team ~15 hours per week • Trained 30+ non-technical colleagues to write their own SQL queries  I'm at my best translating between technical and business teams. I like figuring out what question someone is really asking, then building something they'll actually use.  I'm currently exploring senior analyst and analytics engineering roles in SaaS, remote or in the Austin area.  Core tools: SQL, Python (pandas), dbt, Looker, Tableau, Snowflake, A/B testing  Reach me at [email] or via message here."},
    ],
  },
  {
    heading: "Tone",
    blocks: [
      {"kind":"list","items":["**First person.** \"I build...\" not \"Jane is a results-oriented professional who...\" Third person on LinkedIn reads as stiff.","**Human but professional.** It's okay to show some personality. Don't write a memoir.","**Concrete over abstract.** Every adjective (\"passionate,\" \"dynamic,\" \"detail-oriented\") is weaker than an example that proves it."]},
    ],
  },
  {
    heading: "#8 — The CV as a Tailored Document",
    blocks: [
      {"kind":"p","text":"**Why it's #8:** Your LinkedIn is a single broad profile everyone sees. Your CV is a document you send for a specific job, and it can and should be tailored. It's ranked here because the content (#1–#5) does most of the work, and formatting and tailoring amplify it."},
    ],
  },
  {
    heading: "LinkedIn vs. CV: different jobs",
    blocks: [
      {"kind":"list","items":["Audience — Anyone searching; CV: One specific employer","Purpose — Be found, build credibility; CV: Win this specific interview","Breadth — Broader, covers your range; CV: Narrow, matches the role","Length — Can be more detailed; CV: 1–2 pages","Tone — Slightly more personal; CV: Tight, formal"]},
      {"kind":"p","text":"They must be **consistent**: same titles, companies, and dates. Recruiters check. Discrepancies raise red flags."},
    ],
  },
  {
    heading: "Format for both humans and machines",
    blocks: [
      {"kind":"p","text":"**Do:**"},
      {"kind":"list","items":["Reverse-chronological order (most recent first). It's what recruiters expect.","Simple, single-column layout","Standard section headings: *Summary, Experience, Skills, Education, Certifications*","Clean, common fonts (Calibri, Arial, Garamond, Helvetica), 10–12pt","Consistent date format","Save as PDF unless the employer asks for Word (.docx). PDFs preserve formatting, and modern ATS parse them well.","File name: *FirstName-LastName-CV.pdf* or *FirstName-LastName-Product-Manager.pdf*, not *resume_final_v7_REAL.pdf*"]},
      {"kind":"p","text":"**Avoid:**"},
      {"kind":"list","items":["Multi-column designs, tables, text boxes, icons, skill bars (\"Python ●●●●○\"), and graphics. These often scramble in ATS parsing, and skill bars are meaningless (four dots out of five compared to what?).","Headers/footers for important info (some parsers skip them)","Photos, age, marital status in the US, UK, Canada, Australia (they introduce bias risk and many recruiters prefer not to see them). In parts of continental Europe, the Middle East, and Asia, photos and some personal details are more customary. Follow local norms.","\"Objective\" statements (\"Seeking a challenging role to grow my skills\"). Replace with a 2–3 line summary of what you offer.","\"References available upon request.\" Assumed."]},
    ],
  },
  {
    heading: "Length",
    blocks: [
      {"kind":"list","items":["**1 page:** Early career (roughly under 5–7 years) or career changers","**2 pages:** Mid to senior professionals","**Longer:** Academic CVs, some government roles, some medical and research roles, where conventions differ"]},
      {"kind":"p","text":"A tight, relevant one-page CV beats a padded two-pager every time."},
    ],
  },
  {
    heading: "How to tailor in 15–20 minutes per application",
    blocks: [
      {"kind":"p","text":"You don't rewrite from scratch. Keep a **master CV** with every achievement you've ever written. For each application:"},
      {"kind":"list","ordered":true,"items":["Read the posting and highlight the top 5–8 requirements and keywords.","**Adjust your summary** to mirror the role (\"Product marketing manager with 6 years in B2B fintech...\").","**Reorder and swap bullets** so the most relevant achievements come first in each role.","**Align language.** If they say \"client,\" don't say \"customer\"; if they say \"cross-functional,\" use that phrase where true.","**Update the skills section** to put their required skills first (only ones you actually have).","**Cut what's irrelevant** to make room."]},
      {"kind":"p","text":"Tailoring matters more for competitive roles and roles you really want. For high-volume applications, a well-targeted base CV for your role category often suffices."},
    ],
  },
  {
    heading: "#9 — The Skills Section",
    blocks: [
      {"kind":"p","text":"**Why it's #9:** Recruiters filter by skills in LinkedIn Recruiter, so this section directly affects search. It's lower on the list because it's quick to fix and less persuasive to a human reader."},
    ],
  },
  {
    heading: "What to do",
    blocks: [
      {"kind":"list","items":["**Add skills generously.** LinkedIn allows up to 100. Include hard skills (tools, methods, technologies), domain knowledge, and a few relevant soft skills.","**Pull from your job-posting research.** If 10 of 15 postings mention \"Agile,\" \"Jira,\" and \"stakeholder management,\" and you have those skills, add them.","**Choose your top skills carefully.** LinkedIn lets you highlight top skills in your About section, and your most relevant should be prominent.","**Link skills to experiences.** When you add a skill, LinkedIn lets you connect it to specific jobs or education entries. This makes the claim more credible and helps search.","**Use standard names.** \"Microsoft Excel,\" not \"spreadsheet wizardry.\""]},
    ],
  },
  {
    heading: "Endorsements and assessments",
    blocks: [
      {"kind":"p","text":"Endorsements (people clicking to vouch for your skills) carry little weight with most recruiters. They're easily given and mostly social. Don't spend time chasing them. A few on your top skills look fine, and that's all."},
      {"kind":"p","text":"LinkedIn's skill assessments have changed over time and their value varies. Certifications from recognized bodies (AWS, PMP, Google, CPA, etc.) carry more weight, so list them in the Licenses & Certifications section."},
    ],
  },
  {
    heading: "#10 — Proof: Recommendations, Featured, and Portfolio",
    blocks: [
      {"kind":"p","text":"**Why it's #10:** Proof turns claims into evidence. It matters most at the \"read\" stage, when someone is deciding whether to take you seriously. It rarely gets you found, but it often tips decisions."},
    ],
  },
  {
    heading: "Recommendations",
    blocks: [
      {"kind":"p","text":"Written recommendations from managers, clients, or colleagues are far more meaningful than endorsements, because someone took real time to vouch for you publicly."},
      {"kind":"list","items":["**Aim for 2–5 quality recommendations**, ideally including at least one manager.","**Make it easy for people.** When you ask, remind them of specific things you did together. You can even offer a few bullet points they can use. \"Would you be willing to write a short recommendation? If helpful, it'd be great if you could mention the Q3 migration project and how I handled the vendor negotiations.\"","**Recent beats old.** A glowing recommendation from 2012 is nice; one from last year matters more.","**Write recommendations for others.** It's generous, builds relationships, and often prompts reciprocity."]},
    ],
  },
  {
    heading: "Featured section",
    blocks: [
      {"kind":"p","text":"This sits near the top of your profile and lets you pin posts, links, documents, or media. Use it for:"},
      {"kind":"list","items":["Portfolio pieces (designers, writers, developers, marketers)","Case studies or project write-ups","Articles you've written or talks you've given","Press coverage or awards","A GitHub repo, personal website, or published research"]},
      {"kind":"p","text":"Two or three strong items beat ten mediocre ones. If you have nothing to feature, it's okay to leave this out rather than fill it with weak content."},
    ],
  },
  {
    heading: "For specific fields",
    blocks: [
      {"kind":"list","items":["**Engineers:** GitHub with real, readable projects (a clean README matters), technical blog posts","**Designers:** A portfolio site with case studies showing process and results, not just pretty screens","**Writers/Marketers:** Published work, campaign results","**Analysts:** A public project with real data (Tableau Public, a notebook, a write-up)","**Most other roles:** Recommendations and well-written achievements do the job"]},
    ],
  },
  {
    heading: "#11 — Visibility: Network and Activity",
    blocks: [
      {"kind":"p","text":"**Why it's #11:** A stronger network and some activity help you get found and remembered, but they're optional accelerants. Plenty of people get hired with quiet profiles."},
    ],
  },
  {
    heading: "Network size and composition",
    blocks: [
      {"kind":"list","items":["LinkedIn search results for standard (non-Recruiter) users are influenced by your connection degree. Many hiring managers and people at companies you want use regular LinkedIn, not Recruiter. Being a 2nd-degree connection makes you more visible and more approachable.","**Connect thoughtfully:** colleagues (current and past), classmates, people you meet at events, and **recruiters who specialize in your field.**","Aim for a few hundred meaningful connections. \"500+\" is a minor credibility signal on the profile, but quality matters more than raw numbers.","**Add a short note** when connecting with people you don't know well: *\"Hi Priya, I saw your talk on data governance at the meetup last week and found the part about lineage tracking really useful. Would love to connect.\"*"]},
    ],
  },
  {
    heading: "Activity",
    blocks: [
      {"kind":"p","text":"When you comment or post, your name and headline appear in other people's feeds. That's free visibility. Recruiters also sometimes glance at your activity."},
      {"kind":"p","text":"**Low-effort, high-value options:**"},
      {"kind":"list","items":["Leave thoughtful comments (2–4 sentences, actually adding something) on posts by people in your target field or companies","Occasionally share a lesson learned, a project you're proud of, or a useful resource with your own take","Congratulate people in your network on new roles (this keeps relationships warm)"]},
      {"kind":"p","text":"**What to avoid:**"},
      {"kind":"list","items":["Political arguments and divisive content (unless that's directly relevant to your field and you're comfortable with the consequences)","Complaining about former employers","\"Agree!\" comments and engagement bait"]},
      {"kind":"p","text":"You don't need to become a \"LinkedIn influencer.\" Being visible occasionally is plenty."},
    ],
  },
  {
    heading: "#12 — The Hard Cases",
    blocks: [
      {"kind":"p","text":"**Why it's #12:** Not everyone needs this section, but if you do, it matters a lot. These situations make recruiters hesitate, and how you frame them can make the difference."},
    ],
  },
  {
    heading: "Employment gaps",
    blocks: [
      {"kind":"p","text":"Gaps are far more common and accepted than they used to be, especially after widespread layoffs. What hurts is a gap that is **unexplained**, which leaves the recruiter to imagine the worst."},
      {"kind":"list","items":["**Short gaps (under ~6 months):** Usually don't need explanation, especially if you use years only on your CV for older roles. Don't play games with dates on recent roles, though.","**Longer gaps:** Address them briefly and neutrally. LinkedIn now lets you add a **Career Break** entry with types like caregiving, health, travel, education, relocation, and others.","**Show what you did, if relevant:** courses, certifications, freelance work, volunteering, personal projects.","**Don't overexplain or apologize.** One line is enough: *\"Career break: full-time caregiver for family member (2022–2023); completed Google Data Analytics Certificate.\"*"]},
    ],
  },
  {
    heading: "Layoffs",
    blocks: [
      {"kind":"p","text":"Being laid off carries much less stigma than it once did, particularly when layoffs were company-wide."},
      {"kind":"list","items":["It's fine to note it neutrally: *\"Role eliminated in company-wide restructuring affecting 20% of staff.\"*","On LinkedIn, many people post openly about being laid off and ask for help. This often generates real leads, as your network wants to help. Keep it gracious and specific about what you're looking for."]},
    ],
  },
  {
    heading: "Career changers",
    blocks: [
      {"kind":"p","text":"This is where positioning (#1) matters most. Your challenge: help a recruiter see you as a credible candidate for a role you haven't formally held."},
      {"kind":"list","items":["**Lead with the target, not the past.** Headline: *\"Project Manager | Healthcare Operations | Former RN with 8 years in clinical settings\"* rather than *\"Registered Nurse seeking new opportunities.\"*","**Translate your experience** into the target field's language. A teacher moving into instructional design has \"designed curriculum for 150 learners,\" \"assessed learning outcomes with data,\" and \"managed stakeholders (parents, administrators).\"","**Pick achievements that transfer.** Rewrite old bullets to emphasize the skills the new field values.","**Fill the gap with evidence:** relevant courses, certifications, freelance or volunteer projects, portfolio pieces. Even one real project in the new field changes the conversation.","**Your unfair advantage** is often the combination. A nurse in healthcare tech, an accountant in fintech product, a teacher in edtech. Name it explicitly.","**Consider a \"Relevant Experience\" section** on your CV above other experience, if your most relevant work isn't your most recent."]},
    ],
  },
  {
    heading: "Overqualified / stepping down",
    blocks: [
      {"kind":"p","text":"If you're applying for roles below your previous level (by choice), tone down your title emphasis slightly, focus bullets on hands-on work rather than strategy, and address it proactively in a cover letter or summary: *\"After years in management, I'm returning to individual contributor work, where I do my best work.\"*"},
    ],
  },
  {
    heading: "Short tenures / job hopping",
    blocks: [
      {"kind":"p","text":"A few short stints are normal, especially in startups. Add context where helpful (\"Company acquired,\" \"Contract role,\" \"Startup closed\"). Group contract work under one heading (\"Independent Consultant, 2021–2023\") with client projects as bullets."},
    ],
  },
  {
    heading: "#13 — Settings and Hygiene",
    blocks: [
      {"kind":"p","text":"**Why it's #13:** These take 20 minutes total and won't win you a job on their own. But mistakes here can quietly cost you."},
    ],
  },
  {
    heading: "Checklist",
    blocks: [
      {"kind":"list","items":["[ ] **Custom URL:** Change linkedin.com/in/jane-smith-4a8b72910 to linkedin.com/in/janesmith (or similar). Put it on your CV.","[ ] **Turn off \"share profile updates with your network\"** while making many edits, so your network doesn't get notified 30 times. (You can turn it back on when you want people to see a big update like a new job.)","[ ] **Contact info:** Add a professional email. Consider adding phone if comfortable.","[ ] **Name:** Use the name you go by professionally. Add pronunciation (LinkedIn supports a recorded audio clip) if your name is often mispronounced.","[ ] **Industry:** Set it accurately; some searches filter on it.","[ ] **Education:** Complete, with degrees and fields of study. Remove graduation years if you're worried about age bias (it's common and acceptable).","[ ] **Consistency:** Titles, dates, and companies match between your CV and LinkedIn.","[ ] **Spelling and grammar:** Run everything through a spellchecker and read it aloud. Typos on a profile signal carelessness.","[ ] **Profile language:** If you're targeting another country, consider a secondary profile in that language (LinkedIn supports this).","[ ] **Remove the outdated:** Old \"objective\" statements, irrelevant skills, abandoned links.","[ ] **Check how you look:** View your profile as public (via \"View as\" options) and on mobile, where many recruiters actually browse."]},
    ],
  },
  {
    heading: "#14 — What to Ignore (or Barely Bother With)",
    blocks: [
      {"kind":"p","text":"**Why it's last:** Knowing where *not* to spend time is valuable too."},
      {"kind":"list","items":["**Endorsement counts.** Minimal weight.","**Fancy CV design templates.** They often parse poorly and rarely impress recruiters outside creative fields. Even designers usually send simple CVs plus a portfolio.","**Listing every course you've ever taken.** List relevant, recognized ones. Twenty LinkedIn Learning certificates in unrelated topics look like padding.","**Hobbies and interests** on a CV. Usually skip, unless genuinely relevant, distinctive, or useful as a conversation starter (and you have room).","**Buzzwords** like \"synergy,\" \"go-getter,\" \"thought leader,\" \"ninja,\" \"guru,\" \"rockstar.\" They make readers' eyes glaze over.","**Soft-skill claims without proof.** \"Excellent communicator\" means nothing. \"Presented quarterly results to the executive team\" proves it.","**Obsessing over \"perfect.\"** A good profile live today beats a perfect one next month."]},
    ],
  },
  {
    heading: "Beyond the Profile: Turning Visibility into an Actual Job",
    blocks: [
      {"kind":"p","text":"A great profile is necessary but not sufficient. It gets you found and makes you credible. These habits convert that into offers."},
    ],
  },
  {
    heading: "1. Referrals beat applications",
    blocks: [
      {"kind":"p","text":"Referred candidates are consistently reported to be hired at much higher rates than cold applicants, often several times more likely, depending on the study. A referral gets your CV in front of a human, with context and trust attached."},
      {"kind":"list","items":["Search your target companies on LinkedIn and look for 1st and 2nd-degree connections.","Reach out warmly and specifically. Ask for a short conversation or insight, not immediately for a referral.","Many companies pay referral bonuses, so employees are often happy to refer qualified candidates."]},
    ],
  },
  {
    heading: "2. Message recruiters and hiring managers directly",
    blocks: [
      {"kind":"p","text":"A short, specific message often works better than another application in a pile."},
      {"kind":"callout","variant":"key","text":"*Hi Marcus, I just applied for the Senior Data Analyst role on your team. I've spent the last four years building retention analytics for a B2B SaaS company. Most recently, I built a churn model that helped save ~$1.2M ARR. The posting's focus on product analytics is exactly where I've been working. Would you be open to a quick chat? Either way, thanks for your time.*"},
      {"kind":"p","text":"Key ingredients: who you are, one strong piece of proof that matches their need, a light ask. Under 100 words."},
    ],
  },
  {
    heading: "3. Apply early",
    blocks: [
      {"kind":"p","text":"Postings get flooded within days. Many recruiters review applicants in order and start interviewing before the posting closes. Set up job alerts and apply within the first few days when possible."},
    ],
  },
  {
    heading: "4. Be careful with Easy Apply",
    blocks: [
      {"kind":"p","text":"LinkedIn's Easy Apply makes applying effortless, which means everyone does it and volumes are huge. It's fine to use, but for roles you really want, pair it with a direct message or a referral, or apply on the company's own site with a tailored CV."},
    ],
  },
  {
    heading: "5. Track everything",
    blocks: [
      {"kind":"p","text":"A simple spreadsheet: company, role, date applied, contact person, status, follow-up date. Job searching is a pipeline; treat it like one."},
    ],
  },
  {
    heading: "6. Your profile will get checked after you apply",
    blocks: [
      {"kind":"p","text":"Even when you apply through a company site, recruiters and hiring managers often look you up on LinkedIn before an interview. Your CV and profile must tell the same story, and your profile should reinforce why you're a strong fit."},
    ],
  },
  {
    heading: "The Weekend Overhaul: A Step-by-Step Plan",
    blocks: [
      {"kind":"p","text":"If you want to do all of this efficiently, here's a plan that fits into one focused weekend."},
      {"kind":"p","text":"**Saturday morning: Research and positioning (2–3 hours)**"},
      {"kind":"list","ordered":true,"items":["Collect 10–15 job postings for your target role.","Highlight recurring keywords, tools, and responsibilities.","Write your positioning statement.","List your target titles, locations, and work preferences."]},
      {"kind":"p","text":"**Saturday afternoon: Achievements (3–4 hours)**"},
      {"kind":"list","ordered":true,"items":["For each role in your past 10–15 years, brainstorm everything you accomplished. Don't filter yet.","Find numbers: volume, scale, time, money, quality, rank, before vs. after.","Rewrite into XYZ-style bullets. Aim for 6–10 strong candidates per recent role.","This becomes your master CV document."]},
      {"kind":"p","text":"**Sunday morning: LinkedIn (3 hours)**"},
      {"kind":"list","ordered":true,"items":["Turn off update notifications to your network.","Write your headline.","Update job titles (translated honestly where needed) and add context lines.","Paste in your best 3–6 bullets per role.","Write your About section.","Add 30–50+ relevant skills, link them to roles, and set your top skills.","Update photo, banner, location, custom URL, contact info.","Set Open to Work preferences."]},
      {"kind":"p","text":"**Sunday afternoon: CV and proof (2–3 hours)**"},
      {"kind":"list","ordered":true,"items":["Build a clean, single-column CV from your master document, targeted at your main role.","Check consistency with LinkedIn.","Request 2–3 recommendations with specific prompts.","Add any portfolio items to Featured.","Proofread everything aloud. Ask a friend to skim it for 10 seconds and tell you what you do. If they can't, revise."]},
      {"kind":"p","text":"**Ongoing (30 minutes a few times a week)**"},
      {"kind":"list","items":["Comment thoughtfully on relevant posts","Connect with people at target companies and specialized recruiters","Tailor your CV for priority applications","Follow up on applications and messages"]},
    ],
  },
  {
    heading: "The Whole Book on One Page",
    blocks: [
      {"kind":"list","ordered":true,"items":["**Know your target.** Vague profiles attract nobody. Pick a title, level, and domain, and build everything around it.","**Get found.** Mirror the language of real job postings in your headline, titles, skills, and descriptions. Recruiters search; be in the results.","**Write impact, not duties.** Action + result + measurement. Numbers, scope, before-and-after. This is the biggest differentiator.","**Own your headline.** Target title first, specialty second, proof third. 220 characters, front-loaded.","**Make titles and experience skimmable.** Standard titles (honestly translated), context, best bullets first, promotions visible.","**Nail the first glance.** Clear photo, correct location, Open to Work filled out properly.","**Hook in the About section.** First person, concrete first lines, proof, what you're looking for.","**Tailor the CV.** Simple format that parses, 1–2 pages, reordered and reworded for each priority role, consistent with LinkedIn.","**Fill the skills section.** It's a search filter. Ignore endorsement counts.","**Add proof.** Recommendations from people who've seen your work; featured work if your field allows.","**Be a little visible.** Thoughtful comments and connections compound.","**Frame the hard stuff briefly and confidently.** Gaps, layoffs, career changes. Explain once, then show evidence.","**Do the hygiene.** Custom URL, notifications off while editing, no typos.","**Ignore the noise.** Fancy templates, buzzwords, endorsement chasing."]},
      {"kind":"p","text":"And remember: **the profile gets you found; relationships get you hired.** Pair your polished profile with referrals, direct outreach, and early applications, and you'll be playing a different game from the hundreds of people quietly clicking \"Easy Apply.\""},
    ],
  },
];;
