<!-- lesson-meta: {"id":"laravel-symfony-field-guide","title":"Laravel and Symfony: A Field Guide from First Principles to Framework Internals","summary":"A dual-audience field guide to the two PHP frameworks through their shared substrate and their contrasting philosophies: shared-nothing PHP and Composer/PSR-4/PSR-7 reality; front controller and kernel lifecycles (event-centric Symfony vs pipeline-centric Laravel); middleware and routing including route model binding vs argument value resolvers; the service container in depth — Laravel's runtime reflection autowiring with bindings, providers and facades vs Symfony's compiled container with passes, tags, decoration and lazy proxies; Eloquent's Active Record against Doctrine's Data Mapper with unit of work and identity map; Blade and Twig, validation and forms, authentication and authorization (guards/policies vs firewalls/authenticators/voters), events, queues and Messenger, Artisan and debug:console, serialization and API Platform, caching, OPcache and long-running runtimes (Octane, FrankenPHP, RoadRunner) that break shared-nothing, testing with fakes, release cultures, and the recurring tensions beneath the vocabulary.","concepts":[],"tier":1,"complexity":4,"practicePrompt":"Create a throwaway Laravel and a throwaway Symfony app and inspect the machinery: php artisan route:list and tinker vs bin/console debug:router, debug:container --show-lazy and debug:autowiring. Then add a relation and deliberately trigger an N+1 by iterating posts and touching comments in a loop, fixing it with eager loading (with()) and turning preventLazyLoading() on to watch it fail loudly. No frameworks were installed or executed in this environment — run and verify it yourself.","checkPrompt":"Without running anything, answer: why is Laravel's Request an extension of Symfony's, and why that makes Laravel middleware non-PSR-15; what kernel events Symfony's HttpKernel dispatches and what a kernel.request listener can short-circuit; how Laravel's reflection-based container differs from Symfony's compiled one (compile-time validation, dead-code elimination, tags, decoration, lazy proxies); the typed-nil-equivalent gotchas of each container style (env() after config:cache; inverse-side updates that silently don't persist in Doctrine); what Unit of Work, identity map and the owning side mean; how Octane/FrankenPHP break shared-nothing and which two mechanisms (scoped bindings, ResetInterface/kernel.reset) restore safety; and which release model each framework promises.","references":["Laravel documentation — https://laravel.com/docs","Symfony documentation — https://symfony.com/doc/current/index.html","PHP-FIG Standards Recommendations — https://www.php-fig.org/psr/","Doctrine ORM documentation — https://www.doctrine-project.org/projects/doctrine-orm/en/current/index.html","Laravel Octane — https://laravel.com/docs/octane","FrankenPHP — https://frankenphp.dev","Rob Pike's proverb-equivalent: Fabien Potencier, 'Create your own framework... on top of the Symfony Components' — https://symfony.com/doc/current/create_framework/index.html"]} -->

# Laravel and Symfony: A Field Guide from First Principles to Framework Internals

## Prologue: What a PHP Framework Is Actually Solving

PHP has an unusual execution model, and understanding it is the key to almost everything else. In classic PHP, every HTTP request starts a fresh process state. The script boots, builds whatever objects it needs, produces a response, and then everything is thrown away. Nothing survives to the next request except what you deliberately store outside the process: databases, caches, sessions, files. This is called the **shared-nothing architecture**. It is wonderfully forgiving, because memory leaks and corrupted state die with the request. It is also expensive, because every request pays the cost of booting the application from scratch.

A web framework is a structured answer to a recurring question: "Given an incoming HTTP request, how do I turn it into a response in a way that is maintainable, testable, secure, and fast?" Laravel and Symfony answer the same question with different philosophies. Symfony tends toward explicitness, configurability, and decoupled components. Laravel tends toward expressiveness, convention, and developer ergonomics. They are not rivals from different worlds, though. They are close relatives. Laravel is built on top of many Symfony components, and a large share of the vocabulary below applies to both.

A beginner can read this document as a map of the territory. An experienced developer can read it as an account of *why* the territory is shaped the way it is.

---

## 1. The Shared Foundation: Composer, Autoloading, and PSRs

Before any framework runs, there is **Composer**, PHP's dependency manager. You declare the libraries you need in `composer.json`. Composer resolves compatible versions using semantic versioning constraints, records the exact resolved versions in `composer.lock`, and installs everything into `vendor/`. Committing the lock file is what makes builds reproducible.

Composer also generates an **autoloader**. PHP can register a function that is called whenever code references a class that hasn't been loaded yet. The dominant convention is **PSR-4**, which maps namespaces to directories: `App\Http\Controllers\UserController` lives at `app/Http/Controllers/UserController.php`. This is why you almost never write `require` statements in modern PHP. In production, `composer dump-autoload --optimize` (or `--classmap-authoritative`) replaces filesystem lookups with a precomputed class map, which is a small but real performance win.

The **PSRs** (PHP Standards Recommendations, published by the PHP-FIG group) are interface-level agreements that let libraries interoperate. The ones you'll hear about most are PSR-3 (logging, implemented by Monolog in both frameworks), PSR-4 (autoloading), PSR-6 and PSR-16 (caching), PSR-7 (immutable HTTP messages), PSR-11 (container interface), PSR-14 (event dispatching), and PSR-15 (HTTP middleware).

One subtlety matters here. Neither framework uses PSR-7 as its native HTTP representation. Symfony's **HttpFoundation** predates PSR-7 and uses *mutable* Request and Response objects. Laravel's `Illuminate\Http\Request` literally extends Symfony's Request class. Bridges exist when you need PSR-7 interop, but the native model is HttpFoundation. Knowing this explains why Laravel middleware isn't PSR-15 middleware, even though it looks similar.

---

## 2. The Request Lifecycle: From `index.php` to Response

Both frameworks use the **front controller** pattern. Your web server sends every request to a single file, `public/index.php`. That file boots the application and hands the request to a **kernel**, the object responsible for turning a Request into a Response.

**In Symfony,** the conceptual core is `HttpKernelInterface::handle(Request): Response`. The `HttpKernel` implementation is essentially an event-driven state machine. It dispatches a sequence of events, and almost every framework feature is simply a listener attached to one of them:

- `kernel.request` fires first. Routing, locale detection, and firewall security all hook in here. A listener can even return a Response early and short-circuit everything.
- `kernel.controller` fires once a controller has been resolved.
- `kernel.controller_arguments` fires once its arguments have been determined.
- The controller then runs. If it returns something other than a Response, `kernel.view` gives listeners a chance to convert that value into one. This is how API Platform or template-rendering attributes work.
- `kernel.response` lets listeners modify the outgoing response (headers, the debug toolbar injection, and so on).
- `kernel.exception` handles errors.
- `kernel.terminate` fires *after* the response has been sent to the client, when using PHP-FPM. This makes it a good place for slow work like sending emails.

This design is elegant. The kernel itself knows almost nothing, and the framework is composed out of listeners.

**In Laravel,** the lifecycle goes like this. `index.php` requires the bootstrap file, which creates the **Application**. The Application is simultaneously the service container and the orchestrator. The HTTP kernel then:

1. Runs **bootstrappers**: loading environment variables, configuration, exception handling, facades, and service providers.
2. Sends the request through a **pipeline** of global middleware.
3. Hands it to the **router**, which matches a route.
4. Runs route-specific middleware.
5. Calls the controller.
6. Returns the Response back out through the same pipeline.

Since Laravel 11, the skeleton is slimmer. Middleware, routing, and exception configuration live in a fluent builder in `bootstrap/app.php` rather than in a user-land `Http\Kernel` class. The underlying mechanics are unchanged.

The key architectural contrast is this: **Symfony's lifecycle is event-centric, and Laravel's is pipeline-centric.** Both are valid implementations of the same need, which is to insert cross-cutting behavior around request handling.

---

## 3. Middleware and the Onion Model

**Middleware** is code that wraps request handling. The standard metaphor is an onion. The request passes inward through each layer to the core (your controller), and the response passes back outward through the same layers in reverse.

In Laravel, a middleware is a class with a `handle($request, Closure $next)` method:

- Code *before* calling `$next($request)` runs on the way in, for example checking authentication.
- Code *after* it runs on the way out, for example adding headers.
- Not calling `$next` at all short-circuits the chain, for example by returning a redirect.

This is the **Chain of Responsibility** pattern, implemented by `Illuminate\Pipeline\Pipeline`, which folds an array of middleware into nested closures. Laravel groups middleware into **middleware groups**, most notably `web` (sessions, cookies, CSRF protection) and `api` (stateless, typically throttled). It also supports **terminable middleware**, whose `terminate` method runs after the response is sent.

Symfony has no first-class "middleware" concept in its HTTP layer. The equivalent is **event listeners and subscribers** on kernel events. A listener on `kernel.request` with a high priority acts like early middleware, and a listener on `kernel.response` acts like after-middleware. Symfony *does* have a formal middleware concept in its **Messenger** component, which we'll meet later.

---

## 4. Routing: Mapping URLs to Code

**Routing** maps an HTTP method plus a URL pattern to a handler.

**Laravel** routes typically live in `routes/web.php` and `routes/api.php`, written in a fluent PHP syntax such as `Route::get('/users/{user}', [UserController::class, 'show'])`. Routes can have:

- names, for URL generation;
- middleware;
- prefixes, and grouping;
- constraints on parameters.

**Resource routes** generate the conventional seven RESTful actions (index, create, store, show, edit, update, destroy) in one line. This is a clear example of Laravel's convention-over-configuration ethos.

**Route model binding** is one of Laravel's signature conveniences. If a route has `{user}` and the controller method type-hints `User $user`, Laravel automatically queries the database and injects the model, returning a 404 if it's not found. You can customize the lookup key (for example, `{post:slug}`) and scope child bindings to parents.

**Symfony** routes are now most commonly declared with PHP **attributes** directly on controller methods, such as `#[Route('/users/{id}', name: 'user_show', methods: ['GET'])]`. YAML, XML, and PHP configuration are also supported. Symfony's Routing component compiles all routes into an optimized matcher class. It generates regular expressions that are combined and cached so that matching stays fast even with thousands of routes.

The Symfony analogue to route model binding is the **argument value resolver** system. When a controller is called, Symfony walks through a chain of resolvers to figure out what to pass to each parameter:

- the Request object;
- route attributes;
- services;
- Doctrine entities, via `#[MapEntity]`;
- deserialized and validated request bodies, via `#[MapRequestPayload]`;
- query strings, via `#[MapQueryString]`.

This system is more explicit and extensible than Laravel's magic, and more verbose when you first meet it.

---

## 5. The Service Container and Dependency Injection: The Heart of Both Frameworks

If you understand one concept deeply, make it this one.

**Dependency Injection (DI)** means a class receives its collaborators from the outside instead of creating them itself. A `ReportGenerator` that needs a mailer should accept a `MailerInterface` in its constructor, not call `new SmtpMailer()` internally. This makes code testable (you can pass a fake), flexible (you can swap implementations), and honest about its dependencies.

**Inversion of Control (IoC)** is the broader principle: the framework calls your code and supplies what it needs, rather than your code controlling the flow and fetching everything. A **service container**, also called a DI container or IoC container, is the object that knows how to build services and wire their dependencies together.

### Laravel's container

Laravel's container is **runtime and reflection-based**. When you ask for a class, it inspects the constructor with PHP's Reflection API, recursively resolves each type-hinted dependency, and builds the object. This **autowiring** works out of the box for concrete classes with no configuration.

For interfaces, or for custom construction logic, you register **bindings**:

- `bind` creates a new instance each time.
- `singleton` creates one instance per application lifetime.
- `scoped` creates one instance per request or job lifecycle, which matters under Octane.
- `instance` registers an already-built object.

**Contextual binding** (`$this->app->when(A::class)->needs(Interface::class)->give(Impl::class)`) lets different consumers receive different implementations of the same interface.

These registrations happen in **service providers**, which are the central bootstrapping mechanism of Laravel. Each provider has two phases:

- `register()` is for binding things into the container only. At this point other services may not exist yet.
- `boot()` runs after all providers are registered. It's safe to use other services here: registering event listeners, view composers, routes, and so on.

**Deferred providers** only load when one of their services is actually requested, which reduces boot cost. Packages ship providers and are auto-discovered through Composer metadata.

### Symfony's container

Symfony's container is **compiled**. At build time (the cache warmup), Symfony reads all service definitions from YAML, PHP, and attributes, plus bundle configuration. It runs a series of **compiler passes** that analyze and transform the service graph. Then it dumps the whole thing into a plain, highly optimized PHP class in `var/cache/`. At runtime there is no reflection and no configuration parsing: fetching a service is essentially a method call that runs `new` with hard-coded arguments.

This gives Symfony some powerful properties:

- **Compile-time validation.** A missing dependency is an error at build time, not in production at 3 a.m.
- **Dead-code elimination.** Unused private services are removed.
- **Rich metaprogramming.**

Key Symfony container vocabulary:

- **Autowiring** resolves constructor arguments by type, as in Laravel, but at compile time.
- **Autoconfiguration** automatically applies tags based on interfaces or attributes. A class implementing `EventSubscriberInterface` is registered as a subscriber without you writing anything.
- **Tags** are labels on service definitions that compiler passes collect. This is how "give me all the Twig extensions" or "all the voters" works. `#[AutowireIterator]` and `#[AutowireLocator]` let you inject tagged collections directly.
- **Private vs. public services.** Services are private by default, meaning they can only be injected, not fetched with `$container->get()`. This deliberately discourages the **service locator** anti-pattern.
- **Service decoration** (`#[AsDecorator]`) wraps an existing service with your own implementation, so you can add logging or caching around a service you don't own. This is the Decorator pattern at the container level.
- **Service locators** are small, scoped containers that hold only specific services and are lazily instantiated. They are a controlled compromise when you genuinely need dynamic lookup.
- **Lazy services** are replaced by proxies that construct the real object only when first used. Recent PHP versions added native lazy objects, which frameworks can use for this.
- **Parameters** are named configuration values, such as `%kernel.project_dir%`, injectable into services.

### Bundles vs. service providers

The Symfony equivalent of a Laravel service provider is the **bundle**. A bundle is a plugin that ships an **Extension** class, which loads and validates configuration through a `Configuration` tree definition, and optionally compiler passes. Modern applications are no longer structured as bundles themselves; the application code lives in `src/`, and bundles are used for reusable third-party packages.

### Facades: Laravel's most debated feature

A **facade** in Laravel is a class like `Cache` or `DB` that you call statically, as in `Cache::get('key')`. It is *not* a static class. It's a **static proxy**. The facade's `__callStatic` magic method looks up the real object in the container, using the key returned by `getFacadeAccessor()`, and forwards the call to it.

So facades are service-container lookups dressed up in static syntax. They're testable: `Cache::shouldReceive(...)` swaps in a Mockery mock, and many facades offer `::fake()`. Laravel also offers **real-time facades**, where prefixing any class import with `Facades\` makes it callable statically, and global **helpers** like `cache()`, `config()`, and `app()`.

The debate is architectural. Critics argue that facades hide dependencies (they aren't visible in constructors), couple code to the framework, and complicate static analysis. Defenders argue that they give terse, readable code with no real loss of testability. Tools like Larastan and IDE helper generators exist partly to recover the type information that facades obscure. Laravel's answer to the critics is **Contracts**: interfaces like `Illuminate\Contracts\Cache\Repository` that you can inject explicitly, Symfony-style, if you prefer.

---

## 6. Configuration and Environments

Both frameworks read environment-specific values from a **`.env`** file (or real environment variables) so that secrets and host-specific settings stay out of version control.

**Laravel** keeps configuration in PHP arrays under `config/`, which call `env()` to read variables. In production, `php artisan config:cache` merges everything into a single cached file. After that, `env()` calls *outside* the config files return null, which is a classic gotcha. The rule is: only call `env()` inside config files, and read configuration elsewhere with `config('app.name')`.

**Symfony** has a formal concept of **environments**: `dev`, `prod`, and `test` by default, each able to load different configuration from `config/packages/{env}/`. Configuration can be YAML, PHP, or XML, and each bundle validates its own configuration tree, so typos produce clear errors. **Environment variable processors** transform values at runtime, as in `%env(int:DATABASE_PORT)%`, `%env(json:...)%`, or `%env(resolve:...)%`. Environment variables are resolved lazily at runtime even though the container is compiled. **Secrets** can be stored encrypted in the repository using the secrets vault.

**Symfony Flex** is a Composer plugin that automates configuration. When you install a package, a **recipe** automatically creates config files, registers bundles, and adds environment variables. Running `composer require orm` works because Flex maintains **aliases** that map short names to packages.

---

## 7. The Data Layer: Active Record vs. Data Mapper

This is the deepest philosophical difference between the two ecosystems.

### Eloquent (Laravel): Active Record

In the **Active Record** pattern, a model object *is* a database row, and it knows how to persist itself. You write `$user = User::find(1); $user->name = 'Ada'; $user->save();`. The model class extends `Illuminate\Database\Eloquent\Model`, and attributes are stored in an internal array accessed through magic `__get` and `__set`. There are no declared properties by default. The columns come from the table.

Eloquent vocabulary:

- **Mass assignment protection.** `$fillable` (an allowlist) or `$guarded` (a denylist) prevents attackers from injecting unexpected fields through `User::create($request->all())`.
- **Relationships**, defined as methods: `hasOne`, `hasMany`, `belongsTo`, `belongsToMany` (many-to-many with a **pivot table**), `hasManyThrough`, and **polymorphic relations** (`morphTo`, `morphMany`), where one relation can point to multiple model types through a type column and an ID column.
- **Lazy loading vs. eager loading.** Accessing `$post->comments` runs a query when you first touch it (lazy loading). In a loop over 100 posts, that's 101 queries: the infamous **N+1 problem**. Eager loading with `Post::with('comments')->get()` fetches everything in two queries. `Model::preventLazyLoading()` turns accidental N+1s into exceptions during development.
- **Casts** convert attributes to and from types such as dates, booleans, JSON arrays, enums, encrypted values, and custom value objects.
- **Accessors and mutators** compute or transform attributes on read and write.
- **Scopes.** Local scopes are reusable query fragments like `->active()`. Global scopes are automatically applied constraints. **Soft deletes** are a built-in global scope that hides rows with a `deleted_at` timestamp.
- **Model events and observers** hook into lifecycle moments: creating, created, updating, saved, deleting, and so on.
- **Collections.** Query results are `Collection` objects with a rich functional API (`map`, `filter`, `groupBy`, `pluck`). **Lazy collections** and `cursor()` or `lazy()` use PHP generators to process huge datasets with constant memory.
- **Factories and seeders** generate fake data for tests and populate databases.
- **Migrations** are version-controlled schema changes written in PHP with the Schema builder. You write them by hand, and they run in order.

The strength of Active Record is velocity and readability. The cost is coupling. Your domain objects *are* persistence objects, and business logic tends to accumulate in "fat models." Testing a model's logic in isolation from the database takes discipline.

### Doctrine ORM (Symfony's default): Data Mapper

In the **Data Mapper** pattern, your entities are plain PHP objects (**POPOs**) with no knowledge of the database. A separate layer, the mapper, moves data between objects and tables. Doctrine entities are ordinary classes with typed properties and mapping metadata, usually attributes like `#[ORM\Entity]` and `#[ORM\Column]`.

Doctrine vocabulary:

- **EntityManager** is the central API. You call `persist($entity)` to tell Doctrine to manage a new object, `remove($entity)` to schedule deletion, and `flush()` to actually write changes.
- **Unit of Work** is the most important concept in Doctrine. The EntityManager tracks every managed entity and its original state. Calling `flush()` computes a changeset across *all* managed objects and writes it in a single transaction, ordering inserts correctly according to foreign keys. You don't call "save" on individual objects. You change objects in memory, and flush synchronizes the whole graph.
- **Identity Map.** Within one EntityManager, each database row corresponds to exactly one object instance. Fetching user #1 twice gives you the same object, which guarantees consistency within a request.
- **Proxies.** Lazy-loaded associations are represented by generated proxy objects that load their data on first access.
- **Owning side vs. inverse side.** In bidirectional associations, only the owning side (the one holding the foreign key) determines what gets written. Updating only the inverse side is a classic bug where changes silently don't persist.
- **Cascade and orphanRemoval** control whether operations propagate to related entities.
- **DQL** (Doctrine Query Language) is an object-oriented query language that talks about entities and properties rather than tables and columns. The **QueryBuilder** constructs DQL programmatically.
- **Repositories** are classes dedicated to querying a given entity type.
- **Hydration** is the process of turning result sets into objects or arrays. Choosing array hydration for read-heavy endpoints is a common optimization.
- **Doctrine Migrations** can *generate* migrations by diffing your entity mapping against the current database schema.

The strength of Data Mapper is that your domain model is decoupled and can embody real business rules. That makes it favored by practitioners of **Domain-Driven Design (DDD)**. The costs are a steeper learning curve and a more complex mental model: you have to understand managed and detached states, flush semantics, and memory growth in long batch processes (which requires periodic `clear()`).

---

## 8. Views and Templating: Blade and Twig

Both frameworks compile templates into plain PHP and cache the result, so templating adds almost no runtime cost after the first render.

**Blade** (Laravel) uses `{{ $var }}` for auto-escaped output (via `htmlspecialchars`, which protects against XSS) and `{!! $var !!}` for raw output. Directives like `@if`, `@foreach`, `@auth`, and `@can` compile to PHP control structures. Blade allows arbitrary PHP, which is powerful and occasionally a footgun. Layout composition uses **template inheritance** (`@extends`, `@section`, `@yield`) or, more idiomatically today, **components** (`<x-alert type="error">`), which can be class-based or anonymous. Components use **slots** for content projection and `@props` for declared attributes.

**Twig** (Symfony) has a stricter philosophy: templates are for presentation, not logic. You can't write raw PHP. The syntax is `{{ }}` for output, `{% %}` for logic, and `{# #}` for comments. Output is auto-escaped by default and context-aware. Key features include template inheritance with `{% extends %}` and `{% block %}`, **filters** (`{{ name|upper }}`), functions, macros, and **extensions** for adding your own. Twig can run in **sandbox mode**, which makes it safe for user-authored templates.

**The modern frontend story** has three broad approaches.

- **Laravel:**
  - **Livewire** builds reactive components written in PHP. State lives on the server, and interactions are sent over AJAX with DOM diffing.
  - **Inertia.js** uses server-side routing and controllers but renders React, Vue, or Svelte pages, with no separate API needed.
  - **Vite** is the default for asset bundling.
- **Symfony:**
  - **Symfony UX** is a family of packages built on Hotwire's **Stimulus** (small JavaScript controllers attached to HTML) and **Turbo** (page acceleration and partial updates without writing JavaScript).
  - **Twig Components** and **Live Components** are Symfony's answer to Livewire.
  - **AssetMapper** serves modern JavaScript through native import maps with no Node build step. Webpack Encore remains available.

---

## 9. Validation and Forms

**Laravel validation** is rule-based and request-centric. You can call `$request->validate(['email' => 'required|email|unique:users'])`, or better, create a **Form Request** class that encapsulates authorization and validation rules for an endpoint. It is automatically resolved and validated before your controller runs. Failed validation automatically redirects back with errors and old input (for web requests) or returns a 422 JSON response (for API requests). Custom rules are classes, and rules can be conditional (`sometimes`, `required_if`).

**Symfony** separates two components.

- The **Validator** attaches **constraints** to objects, usually entities or DTOs, via attributes like `#[Assert\NotBlank]` and `#[Assert\Email]`. Validation is object-centric: you validate a *thing*, not a request. **Validation groups** allow different rules in different contexts, and **group sequences** order them.
- The **Form component** is a sophisticated system. You define a **form type** class describing fields, and the form maps submitted data onto an object, validates it, and renders it through Twig. Its vocabulary includes:
  - **data transformers**, which convert between the model's representation, the normalized representation, and the view representation (for example, entity ↔ ID ↔ string);
  - **form events** such as `PRE_SET_DATA` and `PRE_SUBMIT` for dynamic forms;
  - **form themes** for rendering.

  It's powerful for complex admin-style forms and heavy for simple ones. Many API-focused Symfony applications skip it in favor of `#[MapRequestPayload]` with validated DTOs.

---

## 10. Security: Authentication and Authorization

Two words that beginners conflate:

- **Authentication** answers *who are you?*
- **Authorization** answers *what are you allowed to do?*

### Laravel

Authentication is organized around **guards** and **providers**. A *guard* defines how users are authenticated for a request: the `session` guard for browsers, or token guards for APIs. A *provider* defines how users are retrieved from storage, whether through Eloquent or the query builder.

Laravel provides starter kits that scaffold full auth flows (login, registration, password reset, email verification). Two packages cover API authentication:

- **Sanctum** handles lightweight API tokens and cookie-based SPA authentication.
- **Passport** is a full **OAuth2** server.

**Fortify** is a headless authentication backend. **Socialite** handles OAuth login with third parties like GitHub and Google.

Authorization uses two constructs:

- **Gates** are closures for general abilities, like `Gate::define('view-dashboard', ...)`.
- **Policies** are classes that group authorization logic around a model, such as `PostPolicy::update(User $user, Post $post)`.

You check them with `$user->can()`, `Gate::allows()`, `$this->authorize()`, `@can` in Blade, or the `can:` middleware.

### Symfony

The Security component is more explicit and more configurable, configured in `security.yaml`.

- **Firewalls** define security zones by URL pattern, each with its own authentication mechanism. The `dev` firewall typically disables security for the profiler.
- **Authenticators** (the modern system, introduced in Symfony 5) implement authentication strategies such as form login, JSON login, API tokens, or custom logic. An authenticator returns a **Passport** containing the user and credentials, decorated with **badges** (a CSRF token badge, a remember-me badge, a password upgrade badge).
- **User providers** load users by identifier.
- **Password hashers** handle hashing and support transparent rehashing when algorithms change.
- **Roles** are strings like `ROLE_ADMIN`, and a **role hierarchy** lets roles inherit other roles.
- **access_control** rules restrict URL patterns to roles.
- **Voters** are the authorization workhorse. When you call `isGranted('EDIT', $post)` or use `#[IsGranted]`, Symfony asks every voter to grant, deny, or abstain. An **access decision strategy** (affirmative, consensus, unanimous, or priority) combines their votes. Voters are the Symfony analogue of Laravel policies, with a more pluggable design.

Both frameworks provide **CSRF protection**, secure session handling, and modern password hashing (bcrypt or Argon2).

---

## 11. Events, Queues, and Asynchronous Work

**Events** decouple parts of a system. The code that does something announces it ("an order was placed"), and any number of listeners react to it (send email, update inventory, notify analytics) without the announcer knowing about them. This is the **Observer pattern**, applied application-wide.

**Laravel** has event classes and listener classes, registered automatically through discovery or explicitly. Listeners can implement `ShouldQueue` to run asynchronously. **Queues** are central to Laravel's culture:

- A **job** is a class with a `handle` method, dispatched onto a queue backed by a **driver** (database, Redis, Amazon SQS, Beanstalkd).
- **Workers** (`php artisan queue:work`) are long-running processes that pull and execute jobs.
- Jobs support retries with **backoff**, timeouts, rate limiting, uniqueness (`ShouldBeUnique`), **chaining** (sequential jobs), and **batching** (parallel jobs with completion callbacks).
- Failed jobs are recorded for inspection and retry.
- **Horizon** provides a dashboard and configuration layer for Redis queues.

The **scheduler** replaces a crontab full of entries with a single cron line running `schedule:run` every minute. Your schedule is defined fluently in code.

**Symfony** uses the **EventDispatcher** (which implements PSR-14) for synchronous events, with listeners and subscribers and priorities. It also supports **stopping propagation**, where a listener can prevent later listeners from running.

For asynchronous work, Symfony has **Messenger**, which is a more general abstraction than a job queue. It is a **message bus**:

- You dispatch a **message**, which is a plain PHP object, and one or more **handlers** process it.
- The message is wrapped in an **Envelope** carrying **stamps**, which are metadata like `DelayStamp`, `TransportNamesStamp`, and handled/sent markers.
- The bus runs a **middleware** chain (validation, Doctrine transactions, logging).
- **Routing** configuration decides whether a message is handled synchronously or sent to a **transport** (Doctrine, Redis, AMQP/RabbitMQ, Amazon SQS) to be consumed later by `messenger:consume` workers.
- **Retry strategies** and a **failure transport** handle errors.

Because the same message can be sync or async purely through configuration, Messenger is a natural fit for **CQRS** (Command Query Responsibility Segregation). You can configure a separate command bus, query bus, and event bus. The **Scheduler** component is built on Messenger and treats recurring tasks as messages.

---

## 12. The Console: Artisan and `bin/console`

Both frameworks' command-line tools are built on the **Symfony Console** component, which provides argument and option parsing, input validation, styled output, progress bars, tables, and interactive questions.

**Artisan** (`php artisan`) is Laravel's CLI. It handles code generation (`make:model -mfc` creates a model with a migration, factory, and controller), migrations, queue workers, cache management, and **Tinker**, an interactive REPL built on PsySH.

`bin/console` is Symfony's equivalent. It's paired with the **MakerBundle** for scaffolding (`make:entity`, `make:controller`) and debugging commands that are extraordinarily useful for understanding a system:

- `debug:router`
- `debug:container`
- `debug:autowiring`
- `debug:event-dispatcher`
- `debug:config`

These commands let you inspect the compiled application, and they're one of the best learning tools in the PHP world.

---

## 13. Serialization, APIs, and HTTP Communication

For shaping JSON output, Laravel offers **API Resources**: transformer classes that convert models into arrays, with conditional attributes and relationship inclusion. Symfony offers the **Serializer** component. It works in two stages: **normalizers** convert objects to arrays and back, and **encoders** convert arrays to JSON, XML, CSV, and other formats. Serialization groups control which fields appear in which context.

**API Platform**, built on Symfony, is a major framework in its own right. You annotate resources, and it generates REST and GraphQL APIs with OpenAPI documentation, pagination, filtering, validation, and hypermedia formats like JSON-LD and Hydra. It also supports Laravel now, though Symfony remains its home.

For outgoing HTTP requests, Laravel's `Http` client is a fluent wrapper around Guzzle, with excellent testing fakes. Symfony's **HttpClient** is its own implementation, supporting asynchronous and concurrent requests through a streaming response model.

Notifications and mail are handled by similar pairs:

- Laravel **Notifications** send messages across multiple channels (mail, database, broadcast, Slack, SMS). **Mailables** are built on Symfony Mailer.
- Symfony provides **Mailer** and **Notifier** directly.

For real-time features, Laravel offers **broadcasting**, with Echo on the client side and **Reverb** as a first-party WebSocket server. Symfony integrates with **Mercure**, a protocol for server-sent-event-based push.

---

## 14. Caching, Performance, and Long-Running Processes

**Framework-level caches** remove repeated boot work:

- In Laravel, `config:cache`, `route:cache`, `view:cache`, and `event:cache`, often run together through `optimize`.
- In Symfony, the compiled container, router, and templates are produced during cache warmup.

**OPcache**, PHP's bytecode cache, is mandatory in production. **Preloading** (PHP 7.4+) can load framework classes into shared memory at server start, and Symfony generates a preload file automatically.

**Application caching** works like this in each framework:

- Laravel's `Cache` facade offers stores (Redis, Memcached, file, database, array) and the `remember` pattern, which means "return the cached value, or compute it and store it." It also provides atomic locks and, in recent versions, stale-while-revalidate style helpers.
- Symfony's **Cache** component implements PSR-6 and PSR-16. It supports **tag-based invalidation** and **cache stampede protection**, where a single process recomputes an expired value while others wait or receive stale data, using probabilistic early expiration.

**Long-running application servers** change the rules of the game. **Laravel Octane**, and Symfony running on runtimes like **FrankenPHP** in worker mode or **RoadRunner**, boot the application *once* and serve many requests from the same process. That eliminates boot overhead and can multiply throughput. But it breaks the shared-nothing assumption from the prologue:

- Static properties persist between requests.
- Singletons persist between requests.
- Anything a request mutates can **leak state** into the next request.

A singleton that captured the current user or request is now a security bug. This is why Laravel introduced `scoped` bindings and why services must be designed to reset or remain stateless. Symfony provides a `ResetInterface` and the `kernel.reset` tag so services can be cleaned between requests. The **Symfony Runtime** component abstracts how the application is booted, decoupling it from global state so the same app can run under PHP-FPM, CLI, or worker-mode servers.

---

## 15. Error Handling, Debugging, and Observability

Laravel centralizes exception handling, where you can configure how exceptions are **reported** (logged or sent to an error tracker) and **rendered** (converted to responses). Its development error page is detailed and helpful. Debugging and observability tools include:

- **Telescope**, which records requests, queries, jobs, and exceptions in development;
- **Pulse**, a production performance dashboard;
- `dd()` and `dump()`, powered by Symfony's **VarDumper**.

Symfony's **Web Profiler** and **Web Debug Toolbar** are arguably the best development tools in the PHP ecosystem. Every request in dev mode is profiled, and you can inspect:

- timing, broken down per event listener;
- database queries;
- the security token and voter decisions;
- dispatched events;
- cache calls;
- Messenger messages;
- the forms tree;
- Twig render times.

Both frameworks use **Monolog** for logging, organized into **channels** and **handlers**, with processors that add context.

---

## 16. Testing

Both frameworks run on **PHPUnit**. Laravel also promotes **Pest**, a more expressive testing framework built on PHPUnit.

**Laravel testing** has two main categories:

- **Feature tests** make simulated HTTP requests (`$this->get('/users')->assertOk()`), using fluent JSON assertions and authentication helpers (`actingAs($user)`).
- **Unit tests** exercise isolated classes.

`RefreshDatabase` wraps each test in a transaction, or migrates a fresh database, for isolation. Laravel's standout feature is its **fakes**: `Queue::fake()`, `Mail::fake()`, `Event::fake()`, `Http::fake()`, `Storage::fake()`, and others. These replace real services with in-memory recorders you can assert against, which makes it trivial to verify side effects without actually performing them.

**Symfony testing** uses:

- `KernelTestCase` to boot the kernel and access the **test container**, which exposes private services;
- `WebTestCase` for functional tests with a simulated browser client and DOM crawler;
- **Panther** for real-browser end-to-end tests.

Common community tools include **Zenstruck Foundry**, which provides factories comparable to Laravel's, and DAMA's DoctrineTestBundle, which provides transactional isolation.

---

## 17. The Ecosystems and Their Cultures

**Laravel's** ecosystem is commercial and vertically integrated, much of it first-party:

- **Forge** for server provisioning, **Vapor** for serverless deployment on AWS Lambda, and **Laravel Cloud** as a managed platform;
- **Nova** for admin panels, **Cashier** for subscription billing, **Scout** for full-text search, and **Socialite** for OAuth login;
- **Sail** for Docker development, **Herd** as a native development environment, and **Pint** for code style.

Community projects like Filament (admin panels) and Spatie's extensive package catalog are pillars of the ecosystem. Laravel ships a major version roughly yearly. Each major receives bug fixes for about 18 months and security fixes for about two years.

**Symfony's** ecosystem is component-oriented. Its components power Drupal, Magento/Adobe Commerce, Shopware, phpBB, Laravel itself, and many other projects. SensioLabs and the core team maintain the framework, and the community around it builds major tools like API Platform, EasyAdmin, and Sylius. Symfony follows a strict, predictable **release process**:

- a minor version every six months (in May and November);
- a major version every two years;
- a **Long-Term Support** release at the `.4` minor version of each major.

Its **backward compatibility promise** and deprecation policy are unusually rigorous. Deprecations are announced in minor versions and removed only in the next major, so upgrading means fixing deprecation warnings, not rewriting code.

---

## 18. Synthesis: The Philosophy Underneath the Vocabulary

Beneath all this terminology lie a handful of recurring design tensions.

**Explicitness vs. convenience.** Symfony makes wiring visible: compiled containers, typed configuration trees, private-by-default services, and autowiring that fails loudly at build time. Laravel optimizes for the shortest path from idea to working code: facades, magic model attributes, helpers, and route model binding. Neither is "more correct." Symfony's explicitness pays off in large, long-lived codebases with many contributors. Laravel's expressiveness pays off in velocity and approachability. In practice, the gap has narrowed. Laravel encourages constructor injection and ships contracts, and Symfony has adopted attributes, autowiring, and MakerBundle to reduce boilerplate.

**Active Record vs. Data Mapper.** This isn't really about ORMs. It's about whether your domain model and your persistence model are the same thing. Coupling them (Eloquent) is fast and intuitive. Separating them (Doctrine) supports richer domain modeling at the cost of conceptual overhead.

**Runtime magic vs. compile-time analysis.** Laravel's dynamism (magic methods, runtime resolution) is resistant to static analysis. The ecosystem compensates with Larastan and IDE helpers. Symfony's compiled container and typed configuration are naturally friendly to PHPStan and Psalm. As PHP's type system has matured (typed properties, enums, readonly classes, attributes, generics expressed in docblocks), both frameworks have moved toward stronger typing.

**The shared-nothing inheritance.** Many decisions in both frameworks exist because of PHP's per-request model: compilation and caching to reduce boot cost, and the assumption that state dies with the request. The move toward long-running workers (Octane, FrankenPHP, RoadRunner) is forcing both ecosystems to re-examine assumptions that were safe for twenty years.

**A one-paragraph mental model.** A request enters through a front controller. A kernel passes it through layers of cross-cutting concern: middleware in Laravel, kernel event listeners in Symfony. A router maps it to a controller, whose arguments are resolved by a dependency-injection container that assembles services from their declared dependencies. The controller coordinates domain logic, persisting data through an ORM, whether an Active Record model or a Data Mapper entity manager with a unit of work. It checks authorization through policies or voters, validates input through rules or constraints, and defers slow work to queues or message buses processed by background workers. It returns a response rendered by a compiled template engine or a serializer. The whole structure is configured through environment-aware configuration, bootstrapped by service providers or bundles, observable through profilers and logs, and verifiable through tests that swap real services for fakes.

Learn that sentence well, and every new term you encounter in either framework becomes a detail of a structure you already understand.
