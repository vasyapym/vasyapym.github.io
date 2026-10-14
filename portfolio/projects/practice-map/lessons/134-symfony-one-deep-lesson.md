<!--
lesson-meta: {"practicePrompt":"On a fresh Symfony app, inspect the machinery first: debug:container on one service, debug:autowiring, debug:event-dispatcher kernel.request, and open the compiled container class in var/cache to see how your controller gets built. Then build one feature end to end — an invokable controller with a #[MapRequestPayload] DTO, a service flushing through Doctrine, and a Messenger message carrying only ids — with a kernel-level test proving it.","checkPrompt":"Without notes, walk the HttpKernel event pipeline and say where routing, firewalls, argument resolution, exceptions and terminate listeners sit; explain why no per-request state may live in a service property, and what breaks under Messenger workers or FrankenPHP worker mode. Also explain Doctrine's unit of work: what persist() schedules, when flush() runs and in which transaction, and why the EntityManager closes after a DB exception."}
-->
<!-- lesson-theory: {"problem":"Without this model Symfony reads as a pile of YAML and bundles held together by magic: when wiring breaks, Doctrine flushes at the wrong moment, or a worker corrupts state, there is nowhere to look. You copy tutorials instead of debugging the way seniors do — by inspecting the container, the routes and the profiler timeline.","model":"Symfony is a dependency-injection container plus an HTTP event pipeline, compiled ahead of time into plain PHP; routing, security, forms, Doctrine and Messenger are services and event listeners plugged into those two machines. Two questions replace memorized magic: which service does this and how was it wired into the container, and which lifecycle event is firing right now and who is listening. The framework's personality is being unusually inspectable — debug:container, debug:router and the profiler timeline are the daily instruments.","mechanics":"Container compile: definitions come from services.yaml, bundle extensions and attributes; autowiring matches type-hints, autoconfigure tags by interfaces (EventSubscriberInterface, #[AsMessageHandler]), compiler passes wire and prune, and the result is dumped as a generated PHP class in var/cache — services private and shared per request by default, so unused ones silently vanish and per-request state is forbidden. Wiring ambiguity, the number-one error, is resolved with aliases, binds or #[Autowire(service:...)]; decoration and lazy services extend behavior without forking. HttpKernel: kernel.request routes and secures, the ControllerResolver asks the container, the ArgumentResolver materializes Request, #[CurrentUser], entities by id, #[MapRequestPayload] and #[MapQueryString] from type-hints, kernel.view/response/terminate bracket the controller, and exceptions jump to kernel.exception. Configuration: parameters versus env vars versus bundle config, the .env cascade with the real environment winning, %env(bool:...)% processors, dump-env prod and the Secrets vault. Doctrine: identity map, persist scheduling, one flush() transaction, the EM closing after a DB exception and resetting in workers, repositories owning DQL with join fetches against N+1. Messenger: a middleware bus (validation, doctrine_transaction, dispatch_after_current_bus), messages carrying ids not entities, failure transport and retries, the outbox against phantom messages — with firewalls, authenticators and voters on the security side and the unit/Kernel/WebTestCase tiers on the testing side.","pitfalls":["Storing per-request state in service properties — fatal under workers and FrankenPHP worker mode.","Fetching services with $container->get() instead of constructor injection; private services may not even exist.","Expecting two implementations of one interface to autowire silently.","Calling flush() in a loop or expecting persist() to touch the database.","Using the EntityManager after a DB exception closed it, without resetting it.","Treating .env as a secrets store or committing .env.local.","Hand-casting APP_DEBUG=false and shipping a truthy string instead of %env(bool:...)%.","Running doctrine:schema:update --force in production instead of reading generated migrations.","Confusing authentication (firewall, authenticator) with authorization (voters, access_control).","Believing Doctrine or annotations are Symfony core rather than separate projects and replaced history."],"whenNot":"The lesson targets the modern baseline — Symfony 6.4/7.x with attributes — and does not teach the annotation-and-Guard era except as translation notes, nor Doctrine itself in depth. It is also not a claim that Symfony is MVC: the Model layer stays your own design, and the survey of Messenger, Mailer, Cache, Scheduler and friends is orientation, not a manual."} -->

# Symfony — One Deep Lesson

Assume you're rusty on modern PHP/Symfony but not a beginner programmer. This lesson aims to get you operating credibly at a mid-to-senior level: understanding the mental model seniors actually debug with, the vocabulary, what's under the abstractions, and where the real tradeoffs live.

---

## 0. The One-Sentence Mental Model

> **Symfony is a dependency-injection container plus an HTTP event pipeline, compiled ahead of time into plain PHP. Everything else — routing, security, forms, Doctrine, Messenger — is services and event listeners plugged into those two machines.**

If you remember nothing else, remember this. Most "Symfony magic" dissolves once you ask two questions:

1. **Which service is doing this, and how was it wired into the container?**
2. **Which event in the request lifecycle is firing right now, and who is listening?**

Seniors don't memorize Symfony. They debug by inspecting the container (`debug:container`), the routes (`debug:router`), and the profiler timeline. The framework is unusually *inspectable* — that's its personality.

A few framing facts:

- **Symfony is both a set of standalone components and a full-stack framework.** HttpFoundation, DependencyInjection, Messenger, Console, etc. are independent libraries (Laravel, Drupal, and phpBB all use Symfony components underneath). The "framework" is FrameworkBundle gluing them together via a Kernel. When someone says "Symfony," they usually mean the full-stack distribution.
- **Doctrine is not Symfony.** It's a separate ORM project integrated via DoctrineBundle. Conflating them causes confusion; you can use Symfony with no Doctrine at all.
- **Symfony Flex** is a Composer plugin. When you `composer require orm` or `composer require security`, Flex resolves an alias to real packages *and* applies a "recipe" — it writes starter config files, edits `.env`, updates `config/bundles.php`. Recipes are why installing a bundle "just works." Always check `git diff` after a require to see what the recipe did. That's a senior habit.
- **Modern baseline (what you'll meet in 2026):** Symfony 6.4 LTS and 7.x lines, PHP 8.2+, **attributes everywhere** (`#[Route]`, `#[ORM\Entity]`), no annotations, no AppBundle, no SwiftMailer. More on legacy translation later.

### A 60-second modern-PHP refresher (since you're rusty)

Current Symfony code leans hard on PHP 8 features:

- **Attributes** `#[...]` — native metadata, read via reflection at container-compile time. They replaced docblock annotations.
- **Constructor property promotion + `readonly`** — `public function __construct(private readonly MailerInterface $mailer) {}`. The backbone of DTOs and services.
- **Typed properties, union types, backed enums** — `enum InvoiceStatus: string { case Draft = 'draft'; ... }`, used directly in Doctrine mappings.
- **`declare(strict_types=1);`** at the top of every file — Symfony convention.

---

## 1. Anatomy of a Project

```
my-project/
├── bin/console          # CLI entry point (Symfony Console app)
├── composer.json
├── .env                 # committed defaults (NOT secrets)
├── .env.local           # your machine's overrides (gitignored)
├── config/
│   ├── bundles.php      # which bundles are active, per environment
│   ├── services.yaml    # YOUR services: autowiring defaults, binds
│   ├── routes.yaml      # route loading (usually points at attributes)
│   └── packages/        # one file per bundle: doctrine.yaml, security.yaml...
├── public/index.php     # web entry point (tiny)
├── src/
│   ├── Kernel.php
│   ├── Controller/
│   ├── Entity/
│   ├── Repository/
│   ├── Service/         # or domain-named folders — contested, see §11
│   ├── Form/
│   ├── Message/  MessageHandler/
│   ├── Security/
│   └── EventSubscriber/
├── templates/           # Twig
├── migrations/
├── tests/
└── var/                 # cache + logs, never committed, safe to delete
```

Your whole app boot is basically this (`public/index.php`):

```php
<?php
use App\Kernel;

require_once dirname(__DIR__).'/vendor/autoload_runtime.php';

return function (array $context) {
    return new Kernel($context['APP_ENV'], (bool) $context['APP_DEBUG']);
};
```

The `autoload_runtime.php` bit is the **Symfony Runtime component**: it lets the same entry point run under PHP-FPM, the Symfony CLI server, FrankenPHP, or a CLI worker without changing your code. It builds the `Request` from globals, hands it to the Kernel, sends the response.

`src/Kernel.php` is tiny — it uses `MicroKernelTrait`, which loads `config/` and registers bundles. **Understand: your job is mostly writing services and configuration. The Kernel is plumbing.**

Environments: `APP_ENV` is `dev`, `test`, or `prod` (you can invent more). It changes which config loads, whether the container is rebuilt automatically, whether the profiler exists, and how errors render. `APP_DEBUG=1` in dev/test only. A classic production incident is `APP_ENV=dev` (or debug on) in production — slow, leaky, and it exposes the profiler. Seniors check `symfony console about` first on any unfamiliar box.

---

## 2. The Heart: The Dependency Injection Container

This is the layer below everything. Learn it properly and Symfony stops being magic.

### What actually happens

At boot, Symfony collects **service definitions** — recipes for constructing objects — from:

- Your `config/services.yaml`
- Each bundle's extension (e.g. DoctrineBundle registers `EntityManagerInterface` based on `doctrine.yaml`)
- Attributes on your classes

Then the container is **compiled**:

1. Parameters and env placeholders are resolved.
2. **Autowiring** inspects your constructors via reflection and matches type-hints to services.
3. **Compiler passes** run: they wire tagged services together (all your event subscribers, message handlers, voters, console commands...), resolve references, remove unused private services, inline small ones.
4. The result is **dumped as a generated PHP class** in `var/cache/<env>/`. In prod, that class is pre-built and opcached; there's no YAML parsing per request. In dev, it's rebuilt automatically when config files change (tracked via resource freshness metadata).

You can literally open `var/cache/dev/Container*/` and read how your controller gets built. Doing this once teaches you more than a day of docs.

### services.yaml, decoded

```yaml
services:
    _defaults:
        autowire: true          # inject by type-hint
        autoconfigure: true     # auto-tag based on interfaces implemented
        bind:
            string $projectDir: '%kernel.project_dir%'
            bool $emailNotificationsEnabled: '%env(bool:EMAIL_NOTIFICATIONS)%'

    App\:
        resource: '../src/'
        exclude:
            - '../src/DependencyInjection/'
            - '../src/Entity/'
            - '../src/Kernel.php'
```

Nuances seniors know:

- **`autoconfigure` is where most "magic" lives.** Implement `EventSubscriberInterface` → tagged `kernel.event_subscriber`. Extend `AbstractType` → registered as a form type. Implement `MessageHandler` conventions / use `#[AsMessageHandler]` → wired to Messenger. It's just compiler passes reading your interfaces and attributes.
- **Services are private by default** (since Symfony 4). You cannot `$container->get(MyService::class)` from arbitrary code — and you shouldn't want to. You get services by *constructor injection*. Private + unused services are deleted at compile time, which means "unused service silently vanished" is a real debugging experience.
- **Services are shared (singletons) by default** within a request. So: **never store per-request state** (the current `Request`, the current user, a mutable entity) in a service property. In classic PHP-FPM this bug hides because the process dies each request; under Messenger workers or FrankenPHP worker mode it corrupts other jobs/requests. Inject `RequestStack` if you must, or better, pass values as method arguments.
- **Autowiring ambiguity is the #1 wiring error.** Two services implementing `PaymentGatewayInterface`? The container can't guess. Fix with an explicit alias/bind, or target one implementation with an attribute:

```php
public function __construct(
    #[Autowire(service: 'app.stripe_gateway')]
    private PaymentGatewayInterface $gateway,
    #[Autowire(env: 'STRIPE_SECRET')]
    private string $stripeSecret,
) {}
```

- **Decoration** (`#[AutowireDecorated]` or `decorates:` in YAML) wraps a service — how you extend core behavior without forking.
- **Lazy services and service subscribers/locators** exist for when constructing the full graph is expensive. `AbstractController` uses a *service locator*: a mini-container with only the handful of services controllers typically need (Twig, router, security...). That's why `$this->render()` works without you injecting Twig into every controller.

### Essential debugging commands

```bash
symfony console debug:container InvoiceManager     # how it's wired, is it public?
symfony console debug:container --tag=kernel.event_subscriber
symfony console debug:autowiring Message           # what can I type-hint?
symfony console debug:event-dispatcher kernel.request
symfony console lint:container                     # catches broken wiring pre-deploy
symfony console debug:config framework             # resolved config (vs. your YAML)
```

`debug:config` vs `config:dump-reference` distinction: the former shows *effective* values after all files merge; the latter shows *available options*. Know both.

---

## 3. The Request Lifecycle (HttpKernel)

`Kernel::handle(Request)` returns a `Response`. Underneath, `HttpKernel` runs an event pipeline:

```
Request created (HttpFoundation value object)
  │
  ├─ kernel.request        → RouterListener matches URL, sets _controller + route params
  │                          (also: security firewall listeners, locale, etc., by priority)
  ├─ ControllerResolver    → asks the CONTAINER for the controller; it's a service
  ├─ ArgumentResolver      → builds method args from type-hints (see below)
  ├─ kernel.controller     → last chance to swap the controller
  ├─ YOUR CONTROLLER RUNS  → returns...
  ├─ kernel.view           → only if you returned a non-Response (rare now); converts to Response
  ├─ kernel.response       → listeners mutate headers, cookies, cache metadata, compression
  └─ Response::send()
  └─ kernel.terminate      → AFTER bytes are sent: heavy logging, spooling mail, metrics
```

Exceptions anywhere jump to **`kernel.exception`**, where listeners (error handler, your custom ones) convert them to responses. In dev this produces the beautiful exception page; in prod, your error templates.

Key insights:

- **HttpFoundation** (`Request`/`Response`) is *not* superglobals. Never touch `$_GET`/`$_POST` in Symfony code — it's a testability and security smell.
- **ArgumentResolver is quietly one of the most powerful features.** Type-hint any of these in a controller method and they materialize:
  - `Request`, `SessionInterface`, the current route params by name
  - `#[CurrentUser] ?User $user`
  - A Doctrine entity matching the route id (the `EntityValueResolver` — built into the framework since 6.2; old-timers know it as SensioFrameworkExtraBundle's `@ParamConverter`)
  - `#[MapRequestPayload] CreateInvoice $dto` — deserialize + validate a JSON body into a DTO (6.3+)
  - `#[MapQueryString] InvoiceFilter $filter`
  - Any service (method injection works, though constructor injection is cleaner for testability)
- Controllers registered as services + lazy subscription is why controllers can have constructors with injected repositories.

Event listeners vs subscribers: a **listener** is a single callable registered for one event; a **subscriber** is a class declaring a map of events → methods. Subscribers are the norm in apps (self-contained, autoconfigured). Priorities matter: higher runs earlier, and a listener can call `$event->stopPropagation()`. You can also use `#[AsEventListener]` attributes now.

---

## 4. Configuration & Environment Variables

Three different things that beginners conflate:

| Concept | Lives where | When resolved | Use for |
|---|---|---|---|
| **Parameters** | config / `%kernel.project_dir%` | compile time | static paths, constants |
| **Env vars** | `.env*`, real environment | runtime (via `%env(...)%`) | secrets, per-deploy settings |
| **Bundle config** | `config/packages/*.yaml` | compile time | how framework pieces behave |

Env details that bite people:

- Load order: `.env` → `.env.local` → `.env.$APP_ENV` → `.env.$APP_ENV.local` → **real environment variables always win**. `.env` is committed and contains only non-secret defaults. Never commit `.env.local` or actual secrets.
- For production performance: `composer dump-env prod` compiles `.env` into `.env.local.php` so Dotenv doesn't parse files per request. Real secrets should come from the actual environment or **Symfony Secrets** (`symfony console secrets:set DATABASE_PASSWORD`) — an encrypted vault committed to the repo, decrypted with a key kept outside it.
- Env values are strings unless you cast: `%env(bool:FEATURE_X)%`, `%env(int:...)%`, `%env(csv:...)%`, `%env(resolve:...)%` (resolves nested parameters), `%env(key:...,vault:...)`. The classic footgun: `APP_DEBUG=false` *string* is truthy in raw PHP — the `(bool) $context['APP_DEBUG']` cast in `index.php` works only because Symfony's runtime handles `'false'`/`'0'` specially. Use processors, don't hand-cast.
- Config formats: YAML dominates, but **PHP config** (`config/packages/framework.php` returning a `FrameworkConfig` builder object) is increasingly preferred by senior teams — it's typed, refactorable, and IDE-friendly. XML exists mostly in bundles for BC. It's genuinely contested; YAML is fine, PHP is nicer at scale.

---

## 5. Routing & Controllers

Routes today are attributes on controller methods:

```php
#[Route('/invoices/{id<\d+>}', name: 'invoice_show', methods: ['GET'])]
public function show(Invoice $invoice): Response
```

The `{id<\d+>}` inline requirement, route naming (`invoice_show`), and method constraints are all standard. Names matter — generate URLs with `generateUrl('invoice_show', ...)` / `path()` in Twig, never hardcode paths.

Controller philosophy — this is where "good vs sloppy" is most visible:

**Sloppy (you'll see this in legacy codebases):** a 150-line action that reads `$request->request->get(...)`, validates inline, queries Doctrine, builds an email, calls an API, and renders. Untestable, unreusable.

**Credible:** the controller is a thin **orchestrator** — parse input, check authorization, delegate to an application service, translate the result into a response.

```php
#[Route('/invoices')]
final class InvoiceController extends AbstractController
{
    #[Route('', name: 'invoice_create', methods: ['POST'])]
    #[IsGranted('ROLE_ACCOUNTANT')]
    public function create(
        #[MapRequestPayload] CreateInvoice $dto,   // deserialized + validated; 422 on failure
        InvoiceManager $invoices,
    ): JsonResponse {
        $invoice = $invoices->create($dto);

        return $this->json($invoice, Response::HTTP_CREATED, [], ['groups' => 'invoice:read']);
    }
}
```

Notes:

- `AbstractController` gives helpers (`render`, `json`, `redirectToRoute`, `denyAccessUnlessGranted`, `addFlash`...). It's convenient but hides dependencies in a locator. **Contested:** purists write plain invokable controllers (`__invoke`) with everything constructor-injected; pragmatists use `AbstractController` for HTML apps. Both are defensible; a single-action invokable controller per route is increasingly fashionable (ADR style). Just be consistent.
- Returning arrays/DTOs and letting a listener serialize is legacy-ish; return `Response` objects. `$this->json()` uses the Serializer with groups — **be careful with serialization groups**, they are your API contract and a data-leak surface (see §10).
- Flash messages (`addFlash`) + redirects are the HTML form-post-redirect pattern; irrelevant for APIs.

---

## 6. Doctrine ORM — A Layer Below

Doctrine's model is a **Unit of Work**, and misunderstanding it causes half of all Doctrine bugs:

- The `EntityManager` tracks every managed entity in an **identity map**. Loading invoice #5 twice in one request returns *the same PHP object*.
- `persist()` schedules insertion; **nothing hits the database until `flush()`**, which computes change sets (diffs against snapshots taken at load) and runs everything in **one transaction**. So: mutate managed entities freely, `flush()` once. You don't call `save()` per change.
- `flush()` in a loop, or `persist` without flush, or entities becoming **detached** (EM cleared/closed, entity from another request/session) are the classic bugs. After a DB exception, the EM is *closed* — further use throws; in workers you must reset it (`doctrine:schema...` no — `ManagerRegistry::resetManager()` / the services resetter does this).
- Entities are mapped with attributes now:

```php
#[ORM\Entity(repositoryClass: InvoiceRepository::class)]
class Invoice
{
    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 100)]
    private string $customer = '';

    #[ORM\Column(enumType: InvoiceStatus::class)]
    private InvoiceStatus $status = InvoiceStatus::Draft;
}
```

- **Repositories** extend `ServiceEntityRepository`; write intention-revealing methods (`findOverdue(): array`) with QueryBuilder/DQL inside. Controllers should never see QueryBuilder.
- **The N+1 footgun:** lazy-loaded relations fire one query per access in loops and in serializers. Fix with join fetches (`addSelect` + `join`) in the repository query when you know you'll traverse. The profiler's Doctrine tab (query count) exposes this instantly — check it on every list page.
- **Migrations** (DoctrineMigrationsBundle): `make:migration` diffs entity mapping vs DB and generates SQL. **Always read generated migrations before running.** `doctrine:schema:update --force` in production is malpractice. Run migrations as a deploy step, not at boot.
- Money as integer cents or a Money value object, never float. Not Doctrine-specific, but seniors will judge you for `float $price`.

Doctrine ORM 3 / DBAL 4 (current lines) removed some old APIs (e.g., some `getSingleResult` behaviors, annotations support dropped) — if old tutorials reference `Doctrine\ORM\Mapping` docblocks, translate to attributes.

---

## 7. Input: DTOs, Forms, Validation, Serializer

There are two input cultures in Symfony, and knowing when each applies is a senior signal:

**HTML culture — the Form component.** A `FormType` class defines fields, maps them onto an object (`data_class`), handles transformation (e.g. text → `DateTimeImmutable`), CSRF, and rendering via Twig form themes.

```php
$form = $this->createForm(InvoiceType::class, $invoice);
$form->handleRequest($request);
if ($form->isSubmitted() && $form->isValid()) {   // order matters: isValid() before isSubmitted() throws
    $em->flush();
    return $this->redirectToRoute('invoice_show', ['id' => $invoice->getId()]);
}
```

Forms are powerful but heavy — the component has its own event system (`PRE_SET_DATA`, `POST_SUBMIT`...), view model, and a learning cliff. Legit criticisms: overkill for simple forms, leaky for complex dynamic ones.

**API culture — DTO + Validator + Serializer.** This is where the framework has moved: plain DTO classes with constraint attributes, populated by `#[MapRequestPayload]`, validated automatically:

```php
final class CreateInvoice
{
    public function __construct(
        #[Assert\NotBlank, Assert\Length(max: 100)]
        public readonly string $customer,
        #[Assert\NotBlank, Assert\Email]
        public readonly string $email,
        #[Assert\Positive]
        public readonly int $amountCents,
    ) {}
}
```

Validation constraints (`NotBlank`, `Length`, `Range`, `Email`, custom constraints) live in the Validator component and are shared by both cultures. The Serializer handles JSON↔objects, with **groups** controlling exposure per context and **normalizers** for custom shapes.

**The contested bit:** validate on the DTO (request boundary — my recommendation), on the entity (defense in depth, but conflates persistence with input), or both? And: rich entities with invariant-protecting methods vs anemic entities + service-layer logic? Symfony is deliberately unopinionated. Pragmatic senior take: DTOs at the boundary always; entities keep the invariants that are cheap to keep; services own workflows and transactions (the EM flush = transaction boundary; wrap multi-step writes in `$em->wrapInTransaction(...)` when you need explicit control).

---

## 8. Security

The modern system (since 5.3, the old Guard system is gone):

- **Firewall**: a regex-matched zone of your app (`^/admin`, `^/api`, main). First match wins. Firewalls decide *whether and how* authentication happens for a request. `security: false` for profiler/assets in dev.
- **User provider**: loads the user (often `entity: { class: App\Entity\User, property: email }`).
- **Authenticator**: does the actual login check — built-ins for form login, login link, remember-me, JSON login, access tokens; or your own class implementing `AuthenticatorInterface`, returning a `Passport` with **badges** (password credentials, CSRF, remember-me). Stateful HTML login vs `stateless: true` API firewalls is the key config decision. JWT usually comes via LexikJWTAuthenticationBundle, not core.
- **Password hashers**: `auto` (currently bcrypt/argon2id via Sodium) with automatic rehash-on-login upgrades.
- **Authorization** is separate from authentication:
  - `access_control` rules in config (first match wins — order matters; a broad early rule silently swallowing later ones is a real bug class).
  - `#[IsGranted('ROLE_ADMIN')]` on controllers, `$this->denyAccessUnlessGranted(...)`, `is_granted()` in Twig.
  - **Voters** for object-level rules: "can this user edit *this* invoice?" Implement `VoterInterface` (or `#[AsVoter]`-style), return grant/deny/abstain for an attribute + subject. When a permission question involves a specific entity, the answer is a voter, not role checks scattered in controllers. Roles answer "what kind of user"; voters answer "this user, this object, this action."
- **Role hierarchy**: `ROLE_ADMIN: [ROLE_ACCOUNTANT, ROLE_USER]` etc.
- CSRF: enabled by default for form login and the Form component; token-based APIs are exempt *because* they're stateless and token-authenticated — understand *why* before disabling anything.

`symfony console make:user`, `make:security:form-login`, and `security:hash-password` are your scaffolding. Also `debug:config security` — read the effective config; security misconfigurations are silent.

---

## 9. Output: Twig, and the UX Layer

Twig is Symfony's templating: auto-escaped by default (XSS-safe; `|raw` is a deliberate, reviewable act), with `{{ path('invoice_show', {id: invoice.id}) }}`, template inheritance, components, and form themes. Even API-only projects use Twig for emails.

Current frontend story — know this to sound current:

- **AssetMapper + importmap** (since 6.3) is the default: serve JS/CSS directly, no Node build step. 
- **Webpack Encore** is the older default; still fine for complex SPAs, but no longer the starting point.
- **Symfony UX** (Stimulus, Turbo, Live Components, Twig Components) is the "HTML-over-the-wire with sprinkles" ecosystem by the Symfony team — increasingly the standard choice over bolting on a full SPA for server-rendered apps.

---

## 10. The Rest of the Platform You'll Actually Use

**Messenger** — message bus + async transport, the backbone of background work:

```php
// dispatch (in a service, after flush)
$bus->dispatch(new InvoiceCreated($invoice->getId()));   // message = plain readonly DTO, IDs not entities

// handle
#[AsMessageHandler]
final class SendInvoiceEmail
{
    public function __invoke(InvoiceCreated $message): void { /* re-fetch entity, send mail */ }
}
```

Configure transports (`doctrine://default`, `amqp://`, `redis://`) and routing (`'App\Message\InvoiceCreated': async`) in `messenger.yaml`. Then `messenger:consume async -vv` runs a long-lived worker. Under the hood the bus is a **middleware pipeline**: validation → `doctrine_transaction` → `dispatch_after_current_bus` → send → handle. Details seniors care about:

- Messages must be serializable; carry IDs, not Doctrine entities (they'll be detached/stale by handling time).
- **Failure transport + retries** with exponential backoff (`messenger:failed:show/retry`). Design handlers to be **idempotent** — messages can be redelivered.
- The phantom-message trap: dispatching inside a DB transaction that later rolls back. Mitigate with the doctrine transaction middleware, dispatch-after-commit patterns, or an outbox table for critical flows.
- The same bus is often (contestably) used synchronously as a command/query bus for CQRS-lite. It can organize an app nicely or become indirection soup — taste required.

**Also in the toolbox** (know what each is for, reach when needed): **Mailer** (replaced SwiftMailer, which is dead — old tutorials lie), **Notifier** (Slack/SMS/chat), **Cache** (PSR-6 pools, tag-aware invalidation; separate from HTTP cache), **HttpCache** (built-in reverse proxy with ESI — `Response::setPublic()`, `setSharedMaxAge`, surrogate invalidation), **Scheduler** (6.3+, cron replacement: `#[AsPeriodicTask]`-style schedules as code), **Clock** (mockable time in tests — never `new \DateTimeImmutable()` deep in services if you'll test it), **Lock & Semaphore** (prevent overlapping cron/worker runs), **RateLimiter**, **Workflow** (state machines for order/invoice statuses), **HttpClient**, **Translation**, **Monolog** logging with channels. **API Platform** and **Mercure** (real-time push) are separate projects built *on* Symfony that you'll encounter constantly.

---

## 11. How It Looks in Actual Work

**Daily workflow:**

```bash
symfony serve                    # local server w/ TLS (Symfony CLI)
symfony console make:controller / make:entity / make:form / make:crud   # MakerBundle scaffolding
symfony console debug:router     # know your routes cold
symfony console doctrine:migrations:diff && doctrine:migrations:migrate
symfony console cache:clear      # prod deploys, config changes
```

MakerBundle generates idiomatic starter code — use it, then **own the output**; it's a starting point, not architecture. Seniors read and adjust generated code rather than treating it as gospel.

**Reading an unfamiliar Symfony codebase in 30 minutes** (do this on any new job):

1. `composer.json` — Symfony version, bundles installed.
2. `config/bundles.php` + `config/packages/` — what subsystems exist.
3. `config/services.yaml` — binds, custom wiring, anything exotic.
4. `debug:router`, `debug:container --tags` — entry points and magic wiring.
5. `src/` layout — layered (Controller/Entity/Service) or domain-grouped (`src/Invoicing/...`)? That tells you the team's architectural posture.

**Testing** — three tiers, and the seams the framework gives you:

- **Unit**: plain PHPUnit on services/DTOs, no kernel. Fast; most business logic should be testable here if you injected dependencies properly.
- **KernelTestCase**: boots the kernel; use `static::getContainer()` — a special *test container* that can fetch private services. For repository queries, service wiring, Messenger handler integration.
- **WebTestCase**: BrowserKit `KernelBrowser` simulates full HTTP requests: `$client->request('GET', '/invoices')`, assertions via `assertResponseIsSuccessful()`, DOM crawler for forms/links. Security and routing get tested here. Real-browser tests via Panther are rare and slow — reserve for JS-critical paths.

Supporting cast: **DoctrineFixturesBundle** + **Zenstruck Foundry** (factories — very popular) for test data; **DAMADoctrineTestBundle** wraps each test in a rolled-back transaction; the **PHPUnit Bridge** surfaces deprecations as failures so upgrades don't blindside you. `APP_ENV=test` has its own config (`when@test` blocks or `config/packages/test/`).

**Quality tooling** in credible shops: PHPStan (level 5–8, with `phpstan-doctrine`/`phpstan-symfony` extensions — the container-aware one matters), PHP-CS-Fixer with the Symfony ruleset, sometimes Rector for automated upgrades/refactors. Symfony's **BC promise** (no BC breaks in minor versions; deprecations introduced in minors, removed in majors) plus Rector + the deprecation helper makes upgrades a routine task rather than a rewrite — a genuine differentiator of this ecosystem.

**Debugging:** the **Profiler** (web debug toolbar, dev only) is your flight recorder: request timeline by event listener, Doctrine queries with params, Messenger messages dispatched, security token/voters with their votes, cache hits, rendered templates. Also `dump()`/`dd()` from VarDumper. Form profiling shows exactly which field failed validation and why.

**Production deployment checklist** (recite this in interviews):

```bash
composer install --no-dev --optimize-autoloader
APP_ENV=prod APP_DEBUG=0 php bin/console cache:clear   # compiles + warms the container
php bin/console doctrine:migrations:migrate --no-interaction
```

Plus: OPcache on (with preloading), real env vars injected (not `.env.local` files hand-edited on servers), workers supervised (systemd/Supervisor) for Messenger consumers, logs to stdout/stderr. **FrankenPHP** (with a Symfony runtime, worker mode, HTTP/3, early hints) is the modern deployment story gaining ground over PHP-FPM+nginx; FPM remains perfectly respectable. Worker mode makes the "no per-request state in services" rule (§2) load-bearing — services get reset between requests via the `kernel.reset` mechanism (`ResetInterface`), and Doctrine's EM is reset by the framework; anything you stash in a property is your bug.

---

## 12. Common Footguns & Misconceptions

1. **"Symfony is MVC like Laravel/Rails."** It's an HTTP framework; the "Model" is your own design. Nothing forces entities-as-models.

