<!--
lesson-meta: {"practicePrompt":"Build the small CRUD blog from the Practice Path — policies, FormRequests, factories, Pest feature tests — including one test that proves another user is forbidden from editing a post. Then deliberately create an N+1, catch it with preventLazyLoading, fix it with eager loading, and move one notification into a queued job dispatched afterCommit, with a test proving it is pushed and idempotent.","checkPrompt":"Without notes, draw the request lifecycle from public/index.php to the response and place form requests, route-model binding and middleware on it; explain why env() outside config returns null after config:cache; and say what makes a queued job idempotent under at-least-once delivery — including the SerializesModels and afterCommit mechanics."}
-->
<!-- lesson-theory: {"problem":"Without this model Laravel feels like magic that intermittently betrays you in production: N+1 queries, authorization that only hides a button, jobs running before a transaction commits, workers never restarted after deploys. You can scaffold an app, but you cannot debug it or defend your decisions in a review.","model":"Laravel is not magic: it is the request lifecycle plus a service container plus conventions. A request flows from public/index.php through providers, middleware, the router and a form request into a thin controller and Eloquent, then back out; facades are container lookups, Blade compiles to plain PHP, and validation is UX while database constraints are the real integrity. The senior dividing line is the second machine — long-lived processes (queue workers, scheduler, Octane) that break the fresh-request assumption.","mechanics":"Lifecycle: bootstrap/app.php in the 11/12 skeleton wires routing, middleware and exceptions in one fluent call, and the app boots per request under FPM but once per worker, Octane or scheduler. Container: bind, singleton and scoped bindings resolve by type-hint; register() only binds while boot() may use other services; scoped bindings exist precisely for Octane and queue workers. Eloquent: casts() replaces the old $casts property, with() and withCount() fight the N+1 that preventLazyLoading throws on, mass update()/delete() bypass model events, chunkById() replaces chunk() when rows move. Security: FormRequest authorize() plus policies plus can: middleware make server-side authorization, validated() is the only trusted input, and unique indexes decide races that validation cannot. Jobs and events: SerializesModels stores only the id and re-fetches, afterCommit defers dispatch until commit, tries/backoff/timeout and ShouldBeUnique are per-job policy, scheduling lives in routes/console.php with onOneServer() and withoutOverlapping() relying on cache locks. Production: config:cache, queue:restart after deploys, Redis-backed queues and cache, Horizon monitoring, feature tests through HTTP with Queue::fake() and the same DB engine as prod.","pitfalls":["Calling env() anywhere outside config after config:cache and reading null.","Treating a hidden button in Blade as authorization instead of a server-side policy check.","Passing $request->all() into create() or update() and opening mass assignment.","Fixing N+1 lazily in the view instead of eager loading at the query.","Expecting model events and observers to fire on mass update() or delete().","Using chunk() while updating rows and silently skipping records instead of chunkById().","Dispatching inside a transaction without afterCommit and racing the worker.","Assuming SerializesModels freezes the model rather than storing only the id.","Storing request state in singletons or statics that leak on Octane and queue workers.","Building a separate API plus SPA for a single frontend where Inertia or Livewire ships faster."],"whenNot":"This is a practitioner's map for current Laravel 11/12 on PHP 8.2+, not a PHP or SQL primer and not a guide to the legacy 10-era skeleton or other frameworks. It also does not crown one service-layer style — Action classes, services, fat models and the repository question are presented as a contested argument in their own section."} -->

# Laravel, Taught Like a Practitioner

Assume Laravel 12, PHP 8.2+ (8.3/8.4 typical), Composer, MySQL/Postgres or SQLite locally. If you learned Laravel pre-11, the mental model is unchanged, but the skeleton got thinner in 11/12 — I'll flag those changes.

If you remember only three things:

1. **Laravel is not magic. It is a request lifecycle + a service container + conventions.** Almost every "magic" trick resolves to one of those.
2. **Eloquent is the centre of gravity.** Architecture fights are mostly about where logic goes *around* Eloquent.
3. **Most production bugs are not framework bugs.** They're N+1 queries, missing authorization, non-idempotent jobs, and validation trusted where a DB constraint was needed.

---

## 1. The Mental Model

Experienced Laravel developers don't think in pages. They think in this pipeline:

```
HTTP request
  -> public/index.php
  -> bootstrap/app.php creates Illuminate\Foundation\Application
  -> Service Providers register() then boot()
  -> HTTP Kernel pushes request through Middleware (onion)
  -> Router matches, resolves Route Model Bindings
  -> FormRequest: authorize() + validated()
  -> Controller (thin) -> Action/Service/Model
  -> Eloquent -> Query Builder -> PDO -> DB
  -> Response / Blade / JSON Resource
  -> Middleware unwinds, terminable middleware runs after response
```

And separately, long-lived processes that break the "fresh request" assumption:

```
Queue worker (php artisan queue:work / Horizon)  - boots app once, loops jobs
Scheduler (cron: * * * * * php artisan schedule:run)
Octane (Swoole / RoadRunner / FrankenPHP) - boots app once, loops requests
```

PHP normally is share-nothing per request: no state survives. The moment you use queues or Octane, leaked static state, singletons holding request data, and memory leaks become real. That's a senior dividing line.

**A layer below:** Blade compiles to plain PHP cached in `storage/framework/views`. Facades are `__callStatic` proxies that resolve a class out of the container. Eloquent builds a Query Builder which builds SQL with PDO bindings. Config caching serialises config to a file so `.env` is never re-read. None of it is magic if you follow the resolution.

### The current app skeleton (11/12)

Legacy (≤10) had `app/Http/Kernel.php`, `app/Console/Kernel.php`, many providers. Now:

- `bootstrap/app.php` — routing, middleware, exceptions configured in one fluent call
- `bootstrap/providers.php` — your service providers list
- `routes/web.php`, `routes/console.php` (scheduler + Artisan commands live here now), `routes/api.php` only after `php artisan install:api`
- `bootstrap/cache`, `.env`, `config/*.php`

```php
// bootstrap/app.php
return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->alias(['admin' => EnsureAdmin::class]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // custom rendering/reporting here, not a Handler class
    })
    ->create();
```

Rule that saves careers: **never call `env()` outside `config/*.php`.** After `php artisan config:cache`, `env()` outside config returns `null`. Read `config('app.name')` everywhere else.

---

## 2. The Service Container and Facades — The Real Engine

The container is a dependency-injection registry. Controllers, jobs, commands get their constructor dependencies auto-resolved ("zero-config resolution") if they're concrete classes or bound interfaces.

```php
// In a ServiceProvider::register()
$this->app->bind(PaymentGateway::class, StripeGateway::class);        // new each time
$this->app->singleton(GeoIp::class);                                   // one per app lifecycle
$this->app->scoped(RequestContext::class);                             // one per request/job (matters on Octane)

// Consumed by type-hinting — no `new`, no facade
public function __construct(private PaymentGateway $payments) {}
```

Vocabulary, with nuance:

- **register() vs boot():** `register()` only binds things. `boot()` can *use* other services. Putting logic that resolves services in `register()` is a classic subtle bug.
- **Facade vs injection:** `Cache::get()` resolves `cache` from the container. Seniors inject in long-lived/tested domain code (`Cache\Repository`, your interfaces) and allow facades in controllers, Blade-adjacent code, tinker. Facade-heavy code that also uses `Cache::shouldReceive()` mocks in tests is a smell — you're mocking the framework, not your boundary.
- **Signals of depth:** asking "is this bound as singleton, and does it hold request state?" on Octane/queue workers. That's the question that exposes people.

---

## 3. Routing, Middleware, Controllers

Conventions: RESTful resource routes, route-model binding, thin controllers.

```php
Route::middleware(['auth'])->group(function () {
    Route::resource('posts', PostController::class)->except(['destroy']);
    Route::delete('posts/{post}', [PostController::class, 'destroy'])
        ->middleware('can:delete,post'); // policy check as middleware
});

// Implicit binding: {post} -> Post by id. Customise key in model: getRouteKeyName() => 'slug'
// Scoped binding: child must belong to parent or 404
Route::get('teams/{team}/posts/{post}', ...)->scopeBindings();
```

Middleware is an onion: request goes in A→B→C→controller, response unwinds C→B→A. `terminate()` runs after the response is sent — use it for logging/metrics, not business logic.

**Sloppy vs good controller:**

```php
// Sloppy: fat, trusts input, authorizes by hiding a button, sends mail synchronously
public function store(Request $request) {
    $post = Post::create($request->all());               // mass-assignment vuln
    Mail::to($post->author)->send(new PostPublished($post)); // slow, fails request on SMTP error
    return back();
}

// Good: FormRequest authorizes + validates, Action does work, side effects queued
public function store(StorePostRequest $request, CreatePost $action): RedirectResponse
{
    $post = $action->execute($request->user(), $request->validated());
    return to_route('posts.show', $post);
}
```

Controllers orchestrate; they should read like a table of contents.

---

## 4. Eloquent — Where You Must Be Fluent

Eloquent is Active Record over the query builder. Convention: `Post` model → `posts` table, `id` PK, `post_id` FK, pivot tables alphabetical singular (`post_tag`).

```php
class Post extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['title', 'body', 'status', 'published_at'];

    // Laravel 11/12 preferred casts style (replaces protected $casts property)
    protected function casts(): array
    {
        return [
            'published_at' => 'datetime',
            'status' => PostStatus::class, // backed enum cast
        ];
    }

    public function author(): BelongsTo { return $this->belongsTo(User::class, 'user_id'); }
    public function tags(): BelongsToMany { return $this->belongsToMany(Tag::class)->withTimestamps(); }

    // Local scope: Post::published()
    public function scopePublished(Builder $q): Builder
    {
        return $q->whereNotNull('published_at')->where('published_at', '<=', now());
    }
}
```

### The failure modes that matter

**N+1 — the #1 Laravel perf bug.** Lazy loading in a loop/Blade/resource:

```php
$posts = Post::latest()->paginate(20); // 1 query
foreach ($posts as $p) { echo $p->author->name; } // +20 queries

$posts = Post::with('author')->latest()->paginate(20); // 2 queries total
```

Turn this on in `AppServiceProvider::boot()` during development: `Model::preventLazyLoading(! app()->isProduction());` It throws instead of silently querying. Also know `withCount()`, `loadMissing()`, aggregate loading, and that API Resources should use `->whenLoaded('author')` so serialisation doesn't trigger queries.

**Mass assignment.** `$fillable` is your allowlist. `$guarded = []` plus `$request->all()` is an exploitable privilege-escalation (`is_admin=1`) waiting to happen. Only ever pass `$request->validated()`, never `$request->all()`, into `create()/update()`.

**Events don't fire on mass operations.** `Post::where(...)->update([...])` and `->delete()` bypass model events, observers, and casts mutation. Fine when intentional and fast; a silent bug when you expected an observer to sync search or audit.

**Other footguns:** mutable `Carbon` instances mutating each other; `chunk()` while updating rows shifts offsets and skips rows (use `chunkById()` / `lazy()`); global scopes that hide data in surprising places (use sparingly, prefer explicit local scopes); soft-deleted rows colliding with DB `unique` indexes.

### Migrations

```php
Schema::create('posts', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->string('title');
    $table->string('status')->default('draft')->index();
    $table->timestamp('published_at')->nullable();
    $table->timestamps();
    $table->softDeletes();
});
```

Rules: never edit a migration that has run in prod — write a new one. Foreign keys + unique indexes are your *real* integrity; validation is just UX, because validation races. Two simultaneous requests both pass `unique:users,email`; only the DB index saves you.

---

## 5. Validation and Authorization — Where Security Actually Lives

Form Requests separate authorize → validate → controller:

```php
class StorePostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', Post::class);
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:120'],
            'status' => ['required', Rule::enum(PostStatus::class)],
            'tags' => ['array'], 'tags.*' => ['integer', Rule::exists('tags', 'id')],
        ];
    }
}
```

Policies model *who can do what to which model*:

```php
class PostPolicy
{
    public function update(User $user, Post $post): bool
    {
        return $user->id === $post->user_id || $user->hasRole('editor');
    }
    // before() hook for super-admins — powerful, easy to abuse, document why
}
```

Invoked via `$this->authorize()`, `Gate`, `can:` middleware, or `@can` in Blade. **Hiding a button is not authorization.** Every mutating endpoint must authorize server-side. This is the most common finding in Laravel security reviews.

Transactions and races:

```php
DB::transaction(function () use ($data) {
    $account = Account::whereKey($id)->lockForUpdate()->firstOrFail(); // SELECT ... FOR UPDATE
    $account->decrement('balance', $data['amount']);
}, attempts: 3); // retry on deadlock

// Queue side effects only after commit or the job may run before the row exists:
PublishPost::dispatch($post)->afterCommit();
```

---

## 6. The Full Feature, End to End

Publish a post, notify followers async:

```php
// app/Actions/CreatePost.php — single-purpose, plain PHP, easily unit-tested
class CreatePost
{
    public function execute(User $author, array $data): Post
    {
        return DB::transaction(function () use ($author, $data) {
            $post = $author->posts()->create($data);
            $post->tags()->sync($data['tags'] ?? []);
            PostPublished::dispatch($post)->afterCommit(); // event, not mail directly
            return $post;
        });
    }
}

// app/Jobs/NotifyFollowers.php
class NotifyFollowers implements ShouldQueue
{
    use Queueable, SerializesModels; // model is re-fetched by id when job runs

    public function __construct(public Post $post) {}

    public function handle(): void
    {
        // MUST be idempotent: queues are at-least-once. Retries/duplicates will happen.
        $this->post->author->followers->each(fn ($u) =>
            $u->notify(new PostPublishedNotification($this->post)));
    }

    public function failed(Throwable $e): void { /* alert, don't swallow */ }
}
```

Know the `SerializesModels` trap: only the ID is serialised; if the model is deleted before the job runs, the job fails deserialising. Use `$deleteWhenMissingModels = true` where dropping is correct. Also set `$tries`, `$backoff`, `$timeout`, and `uniqueId()` (`ShouldBeUnique`) when duplicate execution would double-charge or double-email.

Scheduling now lives in `routes/console.php`:

```php
Schedule::job(new PruneDrafts)->dailyAt('02:00')->onOneServer();
Schedule::command('reports:generate')->hourly()->withoutOverlapping();
```

`onOneServer()` / `withoutOverlapping()` rely on cache locks — remember them when you scale to multiple app servers.

---

## 7. The View/Frontend Decision (Genuinely Contested)

| Choice | What it is | Pick when |
|---|---|---|
| Blade + Alpine | Server-rendered, sprinkles of JS | CRUD, admin, content — underrated default |
| Livewire 3 (+ Volt) | Server components, reactive without an SPA | Interactive Laravel UI, team is PHP-strong. Watch wire traffic & component state bloat |
| Inertia 2 (React/Vue) | SPA feel, Laravel routing/data, no separate API | Product apps wanting SPA UX without API duplication — current default starter kits |
| Separate API + SPA/mobile | Sanctum/Passport tokens, JSON Resources | Multiple clients, public API, mobile app |

Don't build a separate API "for the future" if your only client is your own frontend — Inertia/Livewire will be faster to ship and safer. Senior signal: being able to say *why not* an SPA.

Auth landscape: session guard for web; **Sanctum** for SPA cookie auth and personal access tokens (`createToken('mobile', ['posts:create'])`, abilities checked with `tokenCan()`); **Passport** only if you truly need to be an OAuth2 provider — it's trending out as default. Starter kits (Breeze/Jetstream historically; in 12, official React/Vue/Livewire kits) scaffold auth — never hand-roll password handling.

---

## 8. Testing Like a Senior

Pest (built on PHPUnit) is the current community default; PHPUnit is fine. Feature tests through HTTP are the Laravel sweet spot.

```php
it('lets an author publish and queues notifications', function () {
    Queue::fake();
    $user = User::factory()->create();
    $tag  = Tag::factory()->create();

    $this->actingAs($user)
         ->post(route('posts.store'), [
             'title' => 'Hello', 'body' => '...', 'status' => 'published', 'tags' => [$tag->id],
         ])
         ->assertRedirect();

    $this->assertDatabaseHas('posts', ['title' => 'Hello', 'user_id' => $user->id]);
    Queue::assertPushed(NotifyFollowers::class);
});

it('forbids editing others posts', function () {
    $post = Post::factory()->create();
    $this->actingAs(User::factory()->create())
         ->put(route('posts.update', $post), ['title' => 'x'])
         ->assertForbidden();
});
```

Judgment calls:

- `RefreshDatabase` + factories, not seeded fixtures. Factories with states: `User::factory()->admin()->unverified()`.
- `Queue::fake()`, `Mail::fake()`, `Storage::fake()`, `Http::fake()` — fake at framework boundaries, don't mock Eloquent models.
- Use the same DB engine in CI as prod. SQLite in-memory is fast but hides Postgres/MySQL JSON, constraint, and collation differences. This bites.

Tooling: Artisan generators (`make:model Post -mf --policy`, `make:request`, `make:job`, `make:test --pest`), Tinker for probing, Pint for formatting (run it, stop arguing style), Sail (Docker) or Herd locally, Vite for assets (Webpack Mix is legacy), Telescope/Pail locally, Horizon for queue monitoring in prod.

---

## 9. Where Does Business Logic Go? (The Eternal Argument)

Laravel ships no service layer, so teams invent one. Honest positions:

- **Action classes** (one public method, e.g. `CreatePost` above): testable, composable, my default recommendation for non-trivial writes.
- **Service classes** (`PostService`): fine, but tend to become god-classes holding unrelated methods. If you use them, keep them narrow and domain-named.
- **Fat models**: rich Eloquent models with domain methods (`$post->publish()`) are idiomatic for model-centric invariants. Don't force everything off the model.
- **Repository pattern over Eloquent:** mostly an anti-pattern in Laravel. You duplicate the query builder, lose scopes/relations, and gain a leaky abstraction. Justified only at genuine external boundaries (payment provider, third-party API) — there, hide it behind *your* interface bound in the container.

DTOs (`spatie/laravel-data` is popular) earn their keep at API boundaries; internal CRUD rarely needs them.

---

## 10. Production Readiness

```bash
composer install --no-dev --optimize-autoloader
php artisan config:cache route:cache view:cache event:cache
php artisan migrate --force
php artisan queue:restart   # workers otherwise keep running OLD code — classic deploy bug
php artisan storage:link
```

Checklist seniors recite: `APP_DEBUG=false`, `APP_KEY` set and never rotated casually (it decrypts cookies/sessions), OPcache on, eager loading audited, slow-query log, Horizon + scheduler cron running, cache/queue/session on Redis not `sync`/`file` in prod, filesystem on S3 with private disks + `temporaryUrl()` for downloads.

**Octane caution:** huge speed win by keeping the app booted, but any request state stored in singletons/statics leaks between users. Only adopt with eyes open and tests.

---

## Vocabulary Cheat-Sheet

- **"In the provider"** — binding or bootstrapping logic lives in a ServiceProvider.
- **"Fire and forget"** — dispatch a queued job/event; ensure idempotency if you say this.
- **"After commit"** — deferring side effects until the DB transaction commits.
- **"Eager load it"** — fix N+1 with `with()` before the loop, not in the view.
- **"Mass operation"** — query-builder update/delete that skips model events.
- **"Validated data"** — only `$request->validated()` is trusted input.
- **"Resource"** — ambiguous: `JsonResource` API transformer, or resource controller/routes. Clarify which.
- **"Guard"** — auth driver (`web` session vs `sanctum` token), not authorization.

## Questions That Make You Sound Experienced

- "Is that job idempotent, and what's its retry/backoff behaviour?"
- "Will this dispatch fire before the transaction commits?"
- "Are we authorizing in the FormRequest/policy, or only hiding it in Blade?"
- "Does this mass update need model events to fire?"
- "Singleton or scoped binding — safe on the queue worker/Octane?"
- "Same DB engine in CI as prod?"

## Practice Path

1. CRUD blog with policies, FormRequests, factories, Pest tests — including a forbidden-access test.
2. Deliberately create an N+1, find it with `preventLazyLoading`, fix with eager loading.
3. Add a queued notification with `afterCommit`, retries, and a test proving it's pushed and idempotent.
4. Break something with `config:cache` + stray `env()` call; fix it properly.
5. Expose the same data via Inertia/Livewire *and* a Sanctum-protected API with a `JsonResource`; feel the tradeoff.

Master the lifecycle, the container, Eloquent's sharp edges, and authorization — and you don't just *use* Laravel, you can defend decisions about it in a room full of people who do.
