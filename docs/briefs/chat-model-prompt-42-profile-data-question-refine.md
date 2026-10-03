# Round — fill real profile data into a card-api ts data file (minimize-iteration3 relay Q1)

## Active variant

Q1 — question-form refinement: one question sentence, everything inside one code
block (placeholder data file verbatim + resume verbatim, terse markers between).
The preceding instruction-style draw (schema DSL + "your calls" menu, in-chat,
not saved) routed badly on the randomized router and motivated this shape.

## Paste this

```text
what will be the finished better version of the ts data file below for the resume inside it?

--- file to refine (exact shape) ---
import type { ProfileInput } from './profile-data.schema';

export const profilesData = [
  {
    slug: 'ivan-ivanov',
    isPrimary: true,
    name: 'Иван Иванов',
    title: 'Backend-разработчик (Node.js / TypeScript)',
    description:
      'Разрабатываю серверные приложения на Node.js и TypeScript. Проектирую GraphQL/REST API, работаю с PostgreSQL через Prisma, упаковываю сервисы в Docker.',
    location: 'Москва, Россия',
    email: 'ivan.ivanov@example.com',
    links: [
      { label: 'GitHub', url: 'https://github.com/your-username' },
      { label: 'LinkedIn', url: 'https://www.linkedin.com/in/your-username' },
      { label: 'Telegram', url: 'https://t.me/your-username' },
    ],
    skills: [
      { name: 'TypeScript', category: 'Languages' },
      { name: 'JavaScript', category: 'Languages' },
      { name: 'Node.js', category: 'Backend' },
      { name: 'NestJS', category: 'Backend' },
      { name: 'GraphQL', category: 'Backend' },
      { name: 'REST API', category: 'Backend' },
      { name: 'PostgreSQL', category: 'Databases' },
      { name: 'Prisma', category: 'Databases' },
      { name: 'Docker', category: 'DevOps' },
      { name: 'Git', category: 'Tools' },
    ],
    experience: [
      {
        company: 'ООО «Пример»',
        position: 'Junior Backend Developer',
        startDate: '2024-03-01',
        achievements: [
          'Разработал GraphQL API для внутреннего сервиса на NestJS',
          'Перевёл локальное окружение команды на Docker Compose',
        ],
      },
      {
        company: 'Фриланс',
        position: 'Node.js Developer',
        startDate: '2023-01-01',
        endDate: '2024-02-29',
        achievements: ['Сделал 3 Telegram-бота на Node.js для малого бизнеса'],
      },
    ],
    projects: [
      {
        name: 'Digital Card API',
        description: 'Эта цифровая визитка: NestJS + GraphQL + Prisma + PostgreSQL + Docker',
        url: 'https://vasyapym.onrender.com/graphql',
        repositoryUrl: 'https://github.com/vasyapym/digital-card-api',
        technologies: ['TypeScript', 'NestJS', 'GraphQL', 'Prisma', 'PostgreSQL', 'Docker'],
      },
    ],
  },
] satisfies ProfileInput[];

--- resume ---
### Hero

**Vasily Argunov**
Backend developer · PHP 8 & 1C-Bitrix · Saint Petersburg

I build e-commerce backends that stay fast under large catalogs: 1C integrations, Bitrix modules, and SQL that doesn't fall over at 400k SKUs.

[Email](mailto:vasyapym@gmail.com) · [Telegram](https://t.me/vspmzx) · [GitHub](https://vasyapym.github.io)

### About

I'm a backend developer working mainly with PHP 8 and 1C-Bitrix (D7). For the last two years I've been on e-commerce projects, where most of my time goes into three things: integrations (1C via CommerceML, Bitrix24 REST), performance (query optimization, caching, Core Web Vitals), and tooling that makes catalogs with hundreds of thousands of items manageable for the people who maintain them.

Before that, I spent three and a half years as a researcher in computational linguistics, processing large text corpora in Python. That's where I picked up the habit of treating data problems carefully and automating anything repetitive.

I use AI coding agents heavily in day-to-day work, and I've introduced that workflow to a team, together with the guardrails that make it safe: code review, security audits, and a firm YAGNI policy.

I'm open to full-time, part-time, and project work, in any format (on-site, hybrid, remote). Based in Saint Petersburg, not relocating, happy to travel.

### Work

**Traktorodetal Group** · Backend Developer · Dec 2025 – present
Industrial parts distributor, 400,000+ SKUs.
- 1C ↔ website sync over CommerceML: catalog, stock, prices
- Product mapping for the customer account area (400k+ items, 250+ categories)
- Fixed N+1 queries and slow pagination `COUNT`s across the site
- PHP modules for smart filters, bulk photo upload by 1C code, catalog property management
- Admin audit tools for catalog data completeness (30k+ items)
- IP geolocation; site forms → Bitrix24 CRM via REST
- Rolled out an AI-agent-assisted workflow to the team

**Levenhuk Group** · Web Developer · Sep 2024 – Dec 2025
Optics manufacturer; several international storefronts on 1C-Bitrix.
- Homepage: 2,445 ms → 1,432 ms (−41%), page weight −37%, JS files 23 → 13
- Product page: weight −50%, server requests −21%
- Removed redundant SQL, added caching for heavy blocks
- Metadata generation system (H1–H3, Title, Description) for several group sites
- Templates and components for four sites

**NEFU, Arctic Linguistic Ecology Lab** · Junior Researcher · Jan 2021 – Aug 2024
- Quantitative corpus analysis in Python (pandas, regex)
- Automated parsing, cleaning, and computation over large datasets

### Stack

Core: PHP 8 · 1C-Bitrix D7 · MySQL · SQL
Also: TypeScript · Python · PostgreSQL · Redis · Laravel · Symfony · Docker · Linux · nginx
Integrations: CommerceML (1C) · Bitrix24 REST API · third-party REST APIs
Tools: Git/GitLab · PHPUnit · Lighthouse · Claude Code · Codex

### Education

PhD studies. Linguistics and Literary Studies (2023) · M.A. Linguistics / Intercultural Communication (2020) · B.A. Foreign Philology, English (2018) — North-Eastern Federal University, Yakutsk

### Contact

vasyapym@gmail.com · Telegram @vspmzx · +7 914 276 0124 (WhatsApp)
```
