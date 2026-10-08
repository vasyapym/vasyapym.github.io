<!-- lesson-meta: {"practicePrompt":"Pick one target role and market, read about twenty real job descriptions for it, then rewrite a headline plus an About block stating what you build, one inspectable piece of evidence, your actual city and country, and your accurate work-authorization status. Check: a stranger reading only the profile can say which team would benefit from hiring you, at what level, and can verify at least one claim by opening a link.","checkPrompt":"Reproduce from memory that hiring is uncertainty reduction under information asymmetry: a profile is an evidence package that connects claims to inspectable proof, and the process is a funnel where each transition has a conditional conversion rate. State how 'Russian-speaking', 'Russian citizen' and 'working from Russia' describe different facts, why remote does not mean work-from-any-country, and how you would diagnose whether applications, technical rounds or offers are the real bottleneck."} -->
<!-- lesson-theory: {"problem":"A developer new to international hiring mistakes keyword lists for a strategy: a profile listing every stack communicates uncertainty, titles like 'engineer' get read as seniority signals, eligibility facts about language, citizenship and current location get blended into one label, and an impressive metric such as p95 latency collapses under the first interviewer question about workload and measurement method.","model":"Hiring is uncertainty reduction under information asymmetry: you know your abilities better than the employer, the employer knows the real job better than you, and both sides reduce uncertainty with imperfect evidence. A profile is therefore an evidence package, not persuasive writing — every claim should have something a reviewer can open, run or inspect. The process is a funnel — opportunity, application, screening, technical assessment, final discussion, offer — where each transition has a conditional conversion rate, so the useful fix depends on where conversions stall. Eligibility facts such as location, work authorization and payment route are constraints that no keyword padding can compensate for.","mechanics":"Positioning before optimization: choose one primary hiring story and read roughly twenty target-market job descriptions to separate recurring responsibilities and hard authorization constraints from wish-list items. Headline and About built as claim-plus-evidence templates naming role, stack, one verified result, city and truthful authorization status; a truthful junior profile beats a senior label that collapses under questioning. Proof instead of tutorial copies: one finished project whose repository explains behavior, assumptions and limitations and includes a case study with alternatives, failures and improvements; demos explicitly distinguished from production experience. Evidence hygiene: p95 latency counts only with workload, period, environment and error behavior; confidential work becomes sanitized accounts of migrations, incidents and decisions; verification cost is the deep principle — make it easy for another engineer to check you. Funnel diagnosis: applications without conversations point at targeting, eligibility or clarity; failed technical rounds point at skills; failed finals point at level, compensation or headcount. Offer and scam literacy: base versus total compensation, gross versus net, contractor invoices not comparable to employee take-home, recruiter verification through official channels, and warning signs like payment demands, equipment checks and technical assignments run outside isolated environments.","pitfalls":["Treating discovery as hiring: polishing profile views instead of tracking useful conversations and stages","Listing 'Python, Java, frontend, backend, AI' as one identity — it communicates uncertainty, not versatility","Trusting titles: 'senior' maps differently across companies and 'engineer' does not mean more senior","Blending 'Russian-speaking', citizenship and residence into one claim, or stating a desired destination as current residence","Assuming 'remote' means any country, or that an EOR removes immigration, tax, sanctions or export-control limits","Describing coursework as commercial employment, or claiming workload numbers only reproduced in a local test","Keyword stuffing and hidden keywords instead of truthful, aligned terminology","Paying for a job, cashing an 'equipment' check, or running an untrusted assignment with personal SSH keys and cloud secrets available","Reading three rejections as proof of a cause while optimizing the wrong funnel stage"],"whenNot":"Not legal, tax or immigration advice for specific jurisdictions; not for candidates who already have a hiring commitment through personal contact; not a tool for automated mass applications — it cannot outrun a hard work-authorization restriction, and no platform setting guarantees absolute confidentiality of a confidential search."} -->

# A practical guide: Russian-speaking software developer → hired through LinkedIn

I’ll interpret your request as a guide for a Russian or Russian-speaking software developer seeking work through LinkedIn, especially internationally. The explanation is in English, with useful Russian equivalents.

The central idea is simple: LinkedIn helps employers discover you, but discovery is not hiring. Hiring requires a believable match between your abilities, the employer’s problems, your communication skills, and the practical arrangements under which you can work.


1. What “software developer” actually means

A software developer, разработчик программного обеспечения, builds and maintains software. A programmer, программист, writes code, but professional development includes much more: understanding requirements, choosing an approach, testing, deployment, debugging, security, documentation, and collaboration.

“Software developer” and “software engineer” frequently overlap as job titles. “Engineer” does not automatically mean “more senior.” Read the responsibilities rather than trusting the title.

Frontend development concerns interfaces users interact with. Backend development concerns server-side behavior, business rules, and data. Full-stack development spans both, although most full-stack developers have a stronger side. Mobile, embedded, data engineering, security, and machine learning are other specializations.

DevOps primarily describes practices connecting development and operations, although companies also use it as a job title. Site reliability engineering, SRE, applies engineering methods to operating reliable services. Platform engineering builds shared infrastructure and tools that help other developers work effectively.

Seniority is mainly about scope, independence, judgment, and impact—not simply years.

A junior, джун, completes bounded tasks with guidance. A mid-level developer, often called мидл in Russian, can usually deliver a feature independently. A senior, сеньор, handles ambiguity, anticipates failure, makes trade-offs, and improves other engineers’ effectiveness. Staff and principal engineers often influence multiple teams without necessarily managing people.

These levels are not standardized. A “senior” at one company may map to “mid-level” at another.


2. Technical vocabulary: from names to understanding

A technology stack, стек, is the collection of technologies used to build and operate a system. Python is a programming language. FastAPI is a framework. PostgreSQL is a database management system. Docker packages applications and their dependencies into container images. A cloud provider supplies computing services. These are different categories, not interchangeable badges.

A library provides functionality your code calls. A framework usually supplies a larger structure into which your application fits. A runtime is the environment that executes a program. Understanding these distinctions helps you describe your experience accurately.

An API, application programming interface, is a defined way for software components to interact. It is not necessarily a web service. HTTP is a common protocol used by web APIs. REST is an architectural style, not merely another name for “an endpoint returning JSON.” CRUD means create, read, update, and delete: common operations on stored information.

SQL is a language for working with relational data; PostgreSQL and MySQL are database systems. A transaction groups operations into a commit-or-rollback unit. Its isolation level affects how concurrent transactions interact. An index can accelerate particular queries, but costs storage and additional work during writes. Good engineering means understanding these consequences, not simply knowing that “indexes make databases faster.”

Git is a version-control system. GitHub and GitLab are platforms built around repositories and collaboration. A commit records a change; a branch supports a line of development; a pull request or merge request proposes integrating changes. Code review, ревью кода, examines correctness, maintainability, security, and fit with the surrounding system.

Testing has several levels. Unit tests check relatively isolated behavior. Integration tests check interactions between components. End-to-end tests exercise larger user workflows. High test coverage does not prove correctness: tests can execute code without checking the important behavior.

CI, continuous integration, combines frequent integration with automated checks such as builds and tests. Continuous delivery keeps changes ready for release. Continuous deployment automatically releases changes that pass the required checks. Both latter terms are often abbreviated CD, so context matters.

Production, продакшен or прод, means the live environment used for real work. Deploying means releasing software into an environment. Operating software includes monitoring it, investigating incidents, and recovering from failures. Observability uses outputs such as logs, metrics, and traces to help explain what a running system is doing.

At the advanced level, think in trade-offs. Caching can reduce latency but introduces freshness and invalidation problems. Queues can separate work in time, but retries and duplicate delivery must be handled. An idempotent operation can be repeated without producing additional unintended effects—a crucial property when requests or messages are retried.

Performance describes behavior under a particular workload. Scalability concerns how that behavior changes as workload grows. Reliability concerns correct operation over time. Security includes authentication—“Who are you?”—and authorization—“What are you allowed to do?”

The professional question is not “Have you heard of Kubernetes?” It is “What problem would justify using it here, and what operational cost would it introduce?”


3. Vocabulary used in recruitment

A recruiter, рекрутер, manages candidate interactions and the hiring process. A sourcer focuses on finding potential candidates. A hiring manager usually leads the team or owns the hiring decision. An ATS, applicant tracking system, stores applications and supports recruitment workflows. It is not one universal robot with a secret résumé-scoring formula.

A vacancy or job opening is a вакансия. An application is an отклик. A résumé or CV is a резюме. Screening, скрининг, is an initial suitability check. A technical interview, техническое собеседование or техсобес, assesses engineering ability. A take-home assignment is an exercise completed outside the interview. A referral, рекомендация сотрудника, is an introduction through an employee—not a guarantee of an interview or offer.

An offer, оффер, proposes employment or engagement terms. Onboarding is the process of joining and becoming effective. A probationary period is an испытательный срок; its legal meaning varies by country.

Also distinguish business models. A product company develops its own product. An outsourcing company delivers work for clients. Staff augmentation, often called аутстаффинг in Russian-speaking markets, places people into a client’s team while another company may employ or contract with them. Always understand who signs your contract, pays you, and directs your work.


4. The Russian-specific issue: separate language, citizenship, and location

“Russian-speaking,” “Russian citizen,” and “currently working from Russia” describe different facts. Employers may need to know your place of work, work authorization, time-zone availability, and whether they can employ and pay you through an available arrangement.

If you live outside Russia, state your actual city and country. If you want to relocate, put the destination in your preferences and explain your relocation needs. Do not present a desired location as your current residence.

“Remote” does not necessarily mean “work from any country.” A remote job may be limited to countries where the employer has payroll capability, suitable contracts, or acceptable security and compliance arrangements.

Visa sponsorship means employer support for an immigration process; it is not the same as a relocation allowance. An employer of record, EOR, is an organization that legally employs someone locally on behalf of another business. An EOR can solve some administrative problems, but it does not automatically remove immigration, tax, sanctions, or export-control restrictions.

For Russia-connected hiring, restrictions can depend on jurisdiction, location, employer, payment route, technology, and other circumstances. Do not assume either that every Russian candidate is ineligible or that every international remote role is available. Ask the employer’s recruiting or HR team early. Contracting is not a workaround for legal restrictions.

LinkedIn was blocked in Russia in 2016. Check current access rules and platform availability. Company career pages and established recruiter contacts are useful additional channels, especially if LinkedIn access is unreliable.

A useful factual statement might be: “Based in [city, country], available for [working-hour overlap], seeking [employment or contract work], and [accurate work-authorization or sponsorship status].”


5. Choose a position before optimizing a profile

A profile saying “Python, Java, frontend, backend, AI, DevOps, blockchain, anything” creates uncertainty. It does not necessarily communicate versatility.

Choose one primary hiring story: for example, “Junior Python backend developer,” “Java engineer working on payment systems,” or “Frontend developer focused on accessible React applications.”

Read roughly twenty relevant job descriptions in your target market. Identify recurring responsibilities, required skills, location restrictions, and interview expectations. Separate genuine requirements from wish-list items.

You do not need every listed library. However, a hard work-authorization requirement cannot usually be compensated for by adding more keywords.

Your positioning should answer: “Which team would benefit from hiring me, for which kind of work, at which level?”


6. Build a LinkedIn profile as an evidence package

Your headline should make your role and strongest relevant skills immediately understandable. For example:

“Python Backend Developer | FastAPI, PostgreSQL, Docker | APIs and Automated Testing”

Add a seniority label only when it accurately represents your experience. A truthful junior profile is stronger than a senior label that collapses during questioning.

For international roles, use clear English in the principal profile. A Russian-language version can be useful for Russian-speaking audiences. LinkedIn’s exact search and ranking systems are proprietary and change over time. Relevant, truthful terminology helps people understand and find you, but there is no reliable “keyword hack” that guarantees recruiter attention.

Your About section should explain what you do, provide evidence, identify your target, and clarify logistics. A template is:

“I build backend services with Python, FastAPI and PostgreSQL. My recent work includes [professional achievement or independent project], where I [specific contribution and verified result]. I’m interested in [role or domain]. Based in [city, country], I’m seeking [local, remote, or relocation] opportunities and [accurate authorization or sponsorship statement].”

Replace the brackets with facts. If your experience comes from independent projects, say so. Do not describe coursework as commercial employment.

In the Experience section, move beyond “responsible for developing applications.” Explain the problem, your contribution, and the outcome.

For example: “Improved [API] p95 latency from [X] to [Y] under [defined workload] by addressing [bottleneck], measured using [method].”

Here, p95 latency is the threshold at or below which 95% of measured request latencies fall. It is useful only with context: workload, measurement period, environment, and error behavior. An impressive-looking number without those details may tell an interviewer very little.

Not every achievement needs a percentage. “Implemented role-based authorization and integration tests covering unauthorized access” is useful if true. Do not invent measurements to satisfy résumé advice.

Use Featured to expose your strongest evidence: a project, a technical case study, a demonstration, or a public contribution. For work covered by confidentiality obligations, describe the problem and your contribution without revealing proprietary code or sensitive information.

Keep your résumé focused and machine-readable, following the employer’s requested format. Align terminology with the role when it accurately describes your experience. Avoid hidden keywords and keyword stuffing.

Use job preferences and Open to Work settings deliberately. If your search is confidential, review visibility controls, but do not assume any platform setting provides an absolute privacy guarantee.

Paid LinkedIn features are optional. They cannot substitute for relevance and evidence.


7. Build proof that survives inspection

For a beginner, one coherent, finished project is often more useful than ten unfinished tutorial copies.

A backend example could be a booking service with authentication, database constraints preventing invalid reservations, background notifications, automated tests, and deployment instructions. Its value comes from correct behavior and explained decisions—not from the number of technologies attached to it.

The repository should explain what the system does, how to run it, how to test it, what assumptions it makes, and what its limitations are. Include a small architecture explanation. Use synthetic data, and never publish secrets or employer-owned material.

Add a short case study: the problem, constraints, chosen design, alternatives considered, failures encountered, and what you would improve next. A meaningful limitation is not embarrassing. Recognizing limitations demonstrates judgment.

Distinguish demonstrations from production experience. “Handled this workload in a reproducible local test” is not the same as “served paying customers at this scale.”

Experienced developers do not need a public GitHub activity graph to prove that they worked. Many valuable systems are private. Sanitized accounts of migrations, incidents, performance improvements, design decisions, and cross-team delivery can provide strong evidence.

The deeper principle is verification cost: make it easy for another engineer to check what you claim.


8. Turn LinkedIn activity into relevant conversations

Search using the titles companies actually use. “Software engineer,” “backend developer,” “backend engineer,” and “Python developer” may overlap. Combine titles with a stack or domain, then inspect the location and employment conditions.

Create relevant alerts and follow target companies. Read the full description rather than relying only on an “entry-level” or “remote” label.

Apply through the requested process. Easy Apply is convenient, but it is an application mechanism—not a complete strategy. If the company requires an application on its official careers site, complete that step.

A useful recruiter message is short and specific:

“Hi [Name], I applied for [role and job ID]. My strongest match is [relevant skill or experience]; [one concrete example]. I’m based in [country] and [brief, accurate eligibility statement]. Is this position open to candidates in my situation?”

If eligibility is already clear, use the final sentence to ask about the team’s needs or the next step instead.

When contacting an engineer, show genuine relevance rather than demanding a referral:

“Hi [Name], your explanation of [specific topic] was useful. I worked on a related problem in [project], especially [detail]. I’m considering [team or role] at your company. What does the team value most in someone joining at this level?”

Only reference something you actually read. Do not manufacture familiarity.

A referral should follow a plausible fit. You can ask: “If, after reviewing my background, you think it matches, would you be comfortable referring me?” Give the person an easy way to decline.

One polite follow-up after about a week is generally reasonable. Repeated messages rarely improve the relationship.

Posting is optional. A concise explanation of a bug, benchmark, design trade-off, or lesson learned can demonstrate communication and engineering judgment. Daily generic motivational content is not required to get hired.


9. Prepare for the actual interview, not an imaginary universal interview

Ask the recruiter about the process, assessment format, and permitted tools.

The recruiter screen commonly checks your background, motivation, communication, compensation expectations, location, availability, and eligibility. Prepare a short introduction: what you do, one relevant achievement, and what you want next.

Technical assessment depends on the role. It might involve algorithms, debugging, code review, API design, SQL, practical implementation, or discussion of previous work.

DSA means data structures and algorithms. Big-O notation describes how resource requirements grow with input size; it does not directly state elapsed running time. Understanding complexity is useful, but memorizing algorithm exercises is not a substitute for the practical skills a particular role requires.

During coding interviews, clarify requirements, explain your approach, consider edge cases, and test the result. Silent speed is less informative than understandable reasoning.

System-design interviews assess how you turn requirements into an architecture. Begin with workload, correctness, latency, availability, data, and operational constraints. Then discuss components and failure modes. Do not begin by naming fashionable infrastructure.

Behavioral interviews examine how you work with people and uncertainty. STAR—situation, task, action, result—is a useful structure. Be clear about what you personally did versus what the team accomplished. Prepare examples involving a difficult bug, a disagreement, a mistake, and an ambiguous task.

For international work, understandable English matters more than sounding like a native speaker. Practise explaining a project, asking clarifying questions, and writing a concise status update.

A small vocabulary adjustment helps: “mid-level” is usually more natural than “middle developer” in English. Разработал can become “built,” “developed,” or “implemented.” Актуальный often means “current,” not “actual.”

AI can help with practice and editing. In assessed work, follow the employer’s rules and be able to explain everything you submit.


10. The advanced model: hiring as uncertainty reduction

Hiring involves information asymmetry. You know more about your abilities than the employer does; the employer knows more about the real job than you do. Both sides use imperfect evidence to reduce uncertainty.

A strong profile is therefore not merely persuasive writing. It connects a claim to evidence: “I can do this kind of work; here is something inspectable that supports it.”

Think of the process as a funnel: relevant opportunity, application or introduction, screening, technical assessment, final discussion, offer. Each transition has a conditional conversion rate.

If applications rarely produce conversations, examine targeting, eligibility, clarity, evidence, and market conditions. If interviews happen but technical rounds repeatedly fail, more profile polishing may not address the main problem. If technical rounds go well but offers fail, investigate competing candidates, level alignment, compensation, headcount, and other practical factors.

These patterns suggest questions; they do not prove causes. Three rejections are a very small sample. Hiring conditions and applicant pools vary.

Track applications, CV versions, eligibility, responses, interview stages, and feedback. Optimize useful conversations and progress—not profile views alone.

Also evaluate the employer. Ask what success looks like in the first ninety days, how code review works, how incidents are handled, and what support a new engineer receives. Hiring should produce a workable match in both directions.


11. Understand the offer and recognize scams

Base salary is fixed salary. Total compensation may include bonuses and equity. Gross pay is before applicable deductions; net pay is what remains after them. Equity may vest over time and may not be readily convertible into cash.

A contractor’s invoice amount is not directly comparable to an employee’s take-home salary. Taxes, benefits, paid leave, equipment, insurance, and administrative obligations can differ substantially.

Confirm the contracting entity, currency, payment schedule, employment or contractor status, working location, benefits, probation, notice terms, and any relocation or sponsorship commitments. For cross-border arrangements, obtain relevant tax or immigration advice rather than relying on a recruiter’s informal assurance.

Verify recruiters through official company channels before sharing sensitive documents. Treat demands to pay for a job, buy cryptocurrency, or cash an “equipment” check as major warning signs.

Developer-specific caution matters too: a technical assignment can contain malicious code. Inspect unfamiliar projects and use an isolated environment without access to personal credentials, SSH keys, or cloud secrets.


12. A practical first month

During the first week, choose a target role and market, examine representative vacancies, and identify your main skill and eligibility gaps.

During the second week, rewrite your profile and résumé around truthful evidence. Improve one relevant project or prepare one substantial professional case study.

During the third week, begin a sustainable rhythm of targeted applications, relevant conversations, and interview practice. Record the results.

During the fourth week, review where progress stops and adjust the most plausible bottleneck. Continue building skills where evidence is weak.

For someone starting from zero, this is a search-setup plan—not a promise of job readiness in thirty days. Building employable engineering ability may take considerably longer.

The final principle is this: do not try to look like every possible developer. Make it easy for a particular employer to understand what you can build, inspect the evidence, communicate with you, and determine how they can hire you.
