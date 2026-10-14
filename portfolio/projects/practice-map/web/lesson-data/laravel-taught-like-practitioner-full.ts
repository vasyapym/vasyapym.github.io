import type { LessonSection } from "../curriculum";

export const sections: readonly LessonSection[] = [
  {
    heading: null,
    blocks: [
      {"kind":"p","text":"Assume Laravel 12, PHP 8.2+ (8.3/8.4 typical), Composer, MySQL/Postgres or SQLite locally. If you learned Laravel pre-11, the mental model is unchanged, but the skeleton got thinner in 11/12 — I'll flag those changes."},
      {"kind":"p","text":"If you remember only three things:"},
      {"kind":"list","ordered":true,"items":["**Laravel is not magic. It is a request lifecycle + a service container + conventions.** Almost every \"magic\" trick resolves to one of those.","**Eloquent is the centre of gravity.** Architecture fights are mostly about where logic goes *around* Eloquent.","**Most production bugs are not framework bugs.** They're N+1 queries, missing authorization, non-idempotent jobs, and validation trusted where a DB constraint was needed."]},
    ],
  },
  {
    heading: "1. The Mental Model",
    blocks: [
      {"kind":"p","text":"Experienced Laravel developers don't think in pages. They think in this pipeline:"},
      {"kind":"p","text":"And separately, long-lived processes that break the \"fresh request\" assumption:"},
      {"kind":"p","text":"PHP normally is share-nothing per request: no state survives. The moment you use queues or Octane, leaked static state, singletons holding request data, and memory leaks become real. That's a senior dividing line."},
      {"kind":"p","text":"**A layer below:** Blade compiles to plain PHP cached in `storage/framework/views`. Facades are `__callStatic` proxies that resolve a class out of the container. Eloquent builds a Query Builder which builds SQL with PDO bindings. Config caching serialises config to a file so `.env` is never re-read. None of it is magic if you follow the resolution."},
      {"kind":"p","text":"**The current app skeleton (11/12)**"},
      {"kind":"p","text":"Legacy (≤10) had `app/Http/Kernel.php`, `app/Console/Kernel.php`, many providers. Now:"},
      {"kind":"list","items":["`bootstrap/app.php` — routing, middleware, exceptions configured in one fluent call","`bootstrap/providers.php` — your service providers list","`routes/web.php`, `routes/console.php` (scheduler + Artisan commands live here now), `routes/api.php` only after `php artisan install:api`","`bootstrap/cache`, `.env`, `config/*.php`"]},
      {"kind":"p","text":"Rule that saves careers: **never call `env()` outside `config/*.php`.** After `php artisan config:cache`, `env()` outside config returns `null`. Read `config('app.name')` everywhere else."},
    ],
    examples: [
      {"title":"Блок 1","code":"HTTP request\n  -> public/index.php\n  -> bootstrap/app.php creates Illuminate\\Foundation\\Application\n  -> Service Providers register() then boot()\n  -> HTTP Kernel pushes request through Middleware (onion)\n  -> Router matches, resolves Route Model Bindings\n  -> FormRequest: authorize() + validated()\n  -> Controller (thin) -> Action/Service/Model\n  -> Eloquent -> Query Builder -> PDO -> DB\n  -> Response / Blade / JSON Resource\n  -> Middleware unwinds, terminable middleware runs after response","explanation":"Пояснение не заполнено."},
      {"title":"Блок 2","code":"Queue worker (php artisan queue:work / Horizon)  - boots app once, loops jobs\nScheduler (cron: * * * * * php artisan schedule:run)\nOctane (Swoole / RoadRunner / FrankenPHP) - boots app once, loops requests","explanation":"Пояснение не заполнено."},
      {"title":"Блок 3","code":"// bootstrap/app.php\nreturn Application::configure(basePath: dirname(__DIR__))\n    ->withRouting(\n        web: __DIR__.'/../routes/web.php',\n        commands: __DIR__.'/../routes/console.php',\n        health: '/up',\n    )\n    ->withMiddleware(function (Middleware $middleware) {\n        $middleware->alias(['admin' => EnsureAdmin::class]);\n    })\n    ->withExceptions(function (Exceptions $exceptions) {\n        // custom rendering/reporting here, not a Handler class\n    })\n    ->create();","explanation":"Пояснение не заполнено."},
    ],
  },
  {
    heading: "2. The Service Container and Facades — The Real Engine",
    blocks: [
      {"kind":"p","text":"The container is a dependency-injection registry. Controllers, jobs, commands get their constructor dependencies auto-resolved (\"zero-config resolution\") if they're concrete classes or bound interfaces."},
      {"kind":"p","text":"Vocabulary, with nuance:"},
      {"kind":"list","items":["**register() vs boot():** `register()` only binds things. `boot()` can *use* other services. Putting logic that resolves services in `register()` is a classic subtle bug.","**Facade vs injection:** `Cache::get()` resolves `cache` from the container. Seniors inject in long-lived/tested domain code (`Cache\\Repository`, your interfaces) and allow facades in controllers, Blade-adjacent code, tinker. Facade-heavy code that also uses `Cache::shouldReceive()` mocks in tests is a smell — you're mocking the framework, not your boundary.","**Signals of depth:** asking \"is this bound as singleton, and does it hold request state?\" on Octane/queue workers. That's the question that exposes people."]},
    ],
    examples: [
      {"title":"Блок 4","code":"// In a ServiceProvider::register()\n$this->app->bind(PaymentGateway::class, StripeGateway::class);        // new each time\n$this->app->singleton(GeoIp::class);                                   // one per app lifecycle\n$this->app->scoped(RequestContext::class);                             // one per request/job (matters on Octane)\n\n// Consumed by type-hinting — no `new`, no facade\npublic function __construct(private PaymentGateway $payments) {}","explanation":"Пояснение не заполнено."},
    ],
  },
  {
    heading: "3. Routing, Middleware, Controllers",
    blocks: [
      {"kind":"p","text":"Conventions: RESTful resource routes, route-model binding, thin controllers."},
      {"kind":"p","text":"Middleware is an onion: request goes in A→B→C→controller, response unwinds C→B→A. `terminate()` runs after the response is sent — use it for logging/metrics, not business logic."},
      {"kind":"p","text":"**Sloppy vs good controller:**"},
      {"kind":"p","text":"Controllers orchestrate; they should read like a table of contents."},
    ],
    examples: [
      {"title":"Блок 5","code":"Route::middleware(['auth'])->group(function () {\n    Route::resource('posts', PostController::class)->except(['destroy']);\n    Route::delete('posts/{post}', [PostController::class, 'destroy'])\n        ->middleware('can:delete,post'); // policy check as middleware\n});\n\n// Implicit binding: {post} -> Post by id. Customise key in model: getRouteKeyName() => 'slug'\n// Scoped binding: child must belong to parent or 404\nRoute::get('teams/{team}/posts/{post}', ...)->scopeBindings();","explanation":"Пояснение не заполнено."},
      {"title":"Блок 6","code":"// Sloppy: fat, trusts input, authorizes by hiding a button, sends mail synchronously\npublic function store(Request $request) {\n    $post = Post::create($request->all());               // mass-assignment vuln\n    Mail::to($post->author)->send(new PostPublished($post)); // slow, fails request on SMTP error\n    return back();\n}\n\n// Good: FormRequest authorizes + validates, Action does work, side effects queued\npublic function store(StorePostRequest $request, CreatePost $action): RedirectResponse\n{\n    $post = $action->execute($request->user(), $request->validated());\n    return to_route('posts.show', $post);\n}","explanation":"Пояснение не заполнено."},
    ],
  },
  {
    heading: "4. Eloquent — Where You Must Be Fluent",
    blocks: [
      {"kind":"p","text":"Eloquent is Active Record over the query builder. Convention: `Post` model → `posts` table, `id` PK, `post_id` FK, pivot tables alphabetical singular (`post_tag`)."},
      {"kind":"p","text":"**The failure modes that matter**"},
      {"kind":"p","text":"**N+1 — the #1 Laravel perf bug.** Lazy loading in a loop/Blade/resource:"},
      {"kind":"p","text":"Turn this on in `AppServiceProvider::boot()` during development: `Model::preventLazyLoading(! app()->isProduction());` It throws instead of silently querying. Also know `withCount()`, `loadMissing()`, aggregate loading, and that API Resources should use `->whenLoaded('author')` so serialisation doesn't trigger queries."},
      {"kind":"p","text":"**Mass assignment.** `$fillable` is your allowlist. `$guarded = []` plus `$request->all()` is an exploitable privilege-escalation (`is_admin=1`) waiting to happen. Only ever pass `$request->validated()`, never `$request->all()`, into `create()/update()`."},
      {"kind":"p","text":"**Events don't fire on mass operations.** `Post::where(...)->update([...])` and `->delete()` bypass model events, observers, and casts mutation. Fine when intentional and fast; a silent bug when you expected an observer to sync search or audit."},
      {"kind":"p","text":"**Other footguns:** mutable `Carbon` instances mutating each other; `chunk()` while updating rows shifts offsets and skips rows (use `chunkById()` / `lazy()`); global scopes that hide data in surprising places (use sparingly, prefer explicit local scopes); soft-deleted rows colliding with DB `unique` indexes."},
      {"kind":"p","text":"**Migrations**"},
      {"kind":"p","text":"Rules: never edit a migration that has run in prod — write a new one. Foreign keys + unique indexes are your *real* integrity; validation is just UX, because validation races. Two simultaneous requests both pass `unique:users,email`; only the DB index saves you."},
    ],
    examples: [
      {"title":"Блок 7","code":"class Post extends Model\n{\n    use HasFactory, SoftDeletes;\n\n    protected $fillable = ['title', 'body', 'status', 'published_at'];\n\n    // Laravel 11/12 preferred casts style (replaces protected $casts property)\n    protected function casts(): array\n    {\n        return [\n            'published_at' => 'datetime',\n            'status' => PostStatus::class, // backed enum cast\n        ];\n    }\n\n    public function author(): BelongsTo { return $this->belongsTo(User::class, 'user_id'); }\n    public function tags(): BelongsToMany { return $this->belongsToMany(Tag::class)->withTimestamps(); }\n\n    // Local scope: Post::published()\n    public function scopePublished(Builder $q): Builder\n    {\n        return $q->whereNotNull('published_at')->where('published_at', '<=', now());\n    }\n}","explanation":"Пояснение не заполнено."},
      {"title":"Блок 8","code":"$posts = Post::latest()->paginate(20); // 1 query\nforeach ($posts as $p) { echo $p->author->name; } // +20 queries\n\n$posts = Post::with('author')->latest()->paginate(20); // 2 queries total","explanation":"Пояснение не заполнено."},
      {"title":"Блок 9","code":"Schema::create('posts', function (Blueprint $table) {\n    $table->id();\n    $table->foreignId('user_id')->constrained()->cascadeOnDelete();\n    $table->string('title');\n    $table->string('status')->default('draft')->index();\n    $table->timestamp('published_at')->nullable();\n    $table->timestamps();\n    $table->softDeletes();\n});","explanation":"Пояснение не заполнено."},
    ],
  },
  {
    heading: "5. Validation and Authorization — Where Security Actually Lives",
    blocks: [
      {"kind":"p","text":"Form Requests separate authorize → validate → controller:"},
      {"kind":"p","text":"Policies model *who can do what to which model*:"},
      {"kind":"p","text":"Invoked via `$this->authorize()`, `Gate`, `can:` middleware, or `@can` in Blade. **Hiding a button is not authorization.** Every mutating endpoint must authorize server-side. This is the most common finding in Laravel security reviews."},
      {"kind":"p","text":"Transactions and races:"},
    ],
    examples: [
      {"title":"Блок 10","code":"class StorePostRequest extends FormRequest\n{\n    public function authorize(): bool\n    {\n        return $this->user()->can('create', Post::class);\n    }\n\n    public function rules(): array\n    {\n        return [\n            'title' => ['required', 'string', 'max:120'],\n            'status' => ['required', Rule::enum(PostStatus::class)],\n            'tags' => ['array'], 'tags.*' => ['integer', Rule::exists('tags', 'id')],\n        ];\n    }\n}","explanation":"Пояснение не заполнено."},
      {"title":"Блок 11","code":"class PostPolicy\n{\n    public function update(User $user, Post $post): bool\n    {\n        return $user->id === $post->user_id || $user->hasRole('editor');\n    }\n    // before() hook for super-admins — powerful, easy to abuse, document why\n}","explanation":"Пояснение не заполнено."},
      {"title":"Блок 12","code":"DB::transaction(function () use ($data) {\n    $account = Account::whereKey($id)->lockForUpdate()->firstOrFail(); // SELECT ... FOR UPDATE\n    $account->decrement('balance', $data['amount']);\n}, attempts: 3); // retry on deadlock\n\n// Queue side effects only after commit or the job may run before the row exists:\nPublishPost::dispatch($post)->afterCommit();","explanation":"Пояснение не заполнено."},
    ],
  },
  {
    heading: "6. The Full Feature, End to End",
    blocks: [
      {"kind":"p","text":"Publish a post, notify followers async:"},
      {"kind":"p","text":"Know the `SerializesModels` trap: only the ID is serialised; if the model is deleted before the job runs, the job fails deserialising. Use `$deleteWhenMissingModels = true` where dropping is correct. Also set `$tries`, `$backoff`, `$timeout`, and `uniqueId()` (`ShouldBeUnique`) when duplicate execution would double-charge or double-email."},
      {"kind":"p","text":"Scheduling now lives in `routes/console.php`:"},
      {"kind":"p","text":"`onOneServer()` / `withoutOverlapping()` rely on cache locks — remember them when you scale to multiple app servers."},
    ],
    examples: [
      {"title":"Блок 13","code":"// app/Actions/CreatePost.php — single-purpose, plain PHP, easily unit-tested\nclass CreatePost\n{\n    public function execute(User $author, array $data): Post\n    {\n        return DB::transaction(function () use ($author, $data) {\n            $post = $author->posts()->create($data);\n            $post->tags()->sync($data['tags'] ?? []);\n            PostPublished::dispatch($post)->afterCommit(); // event, not mail directly\n            return $post;\n        });\n    }\n}\n\n// app/Jobs/NotifyFollowers.php\nclass NotifyFollowers implements ShouldQueue\n{\n    use Queueable, SerializesModels; // model is re-fetched by id when job runs\n\n    public function __construct(public Post $post) {}\n\n    public function handle(): void\n    {\n        // MUST be idempotent: queues are at-least-once. Retries/duplicates will happen.\n        $this->post->author->followers->each(fn ($u) =>\n            $u->notify(new PostPublishedNotification($this->post)));\n    }\n\n    public function failed(Throwable $e): void { /* alert, don't swallow */ }\n}","explanation":"Пояснение не заполнено."},
      {"title":"Блок 14","code":"Schedule::job(new PruneDrafts)->dailyAt('02:00')->onOneServer();\nSchedule::command('reports:generate')->hourly()->withoutOverlapping();","explanation":"Пояснение не заполнено."},
    ],
  },
  {
    heading: "7. The View/Frontend Decision (Genuinely Contested)",
    blocks: [
      {"kind":"list","items":["Blade + Alpine — Server-rendered, sprinkles of JS; Pick when: CRUD, admin, content — underrated default","Livewire 3 (+ Volt) — Server components, reactive without an SPA; Pick when: Interactive Laravel UI, team is PHP-strong. Watch wire traffic & component state bloat","Inertia 2 (React/Vue) — SPA feel, Laravel routing/data, no separate API; Pick when: Product apps wanting SPA UX without API duplication — current default starter kits","Separate API + SPA/mobile — Sanctum/Passport tokens, JSON Resources; Pick when: Multiple clients, public API, mobile app"]},
      {"kind":"p","text":"Don't build a separate API \"for the future\" if your only client is your own frontend — Inertia/Livewire will be faster to ship and safer. Senior signal: being able to say *why not* an SPA."},
      {"kind":"p","text":"Auth landscape: session guard for web; **Sanctum** for SPA cookie auth and personal access tokens (`createToken('mobile', ['posts:create'])`, abilities checked with `tokenCan()`); **Passport** only if you truly need to be an OAuth2 provider — it's trending out as default. Starter kits (Breeze/Jetstream historically; in 12, official React/Vue/Livewire kits) scaffold auth — never hand-roll password handling."},
    ],
  },
  {
    heading: "8. Testing Like a Senior",
    blocks: [
      {"kind":"p","text":"Pest (built on PHPUnit) is the current community default; PHPUnit is fine. Feature tests through HTTP are the Laravel sweet spot."},
      {"kind":"p","text":"Judgment calls:"},
      {"kind":"list","items":["`RefreshDatabase` + factories, not seeded fixtures. Factories with states: `User::factory()->admin()->unverified()`.","`Queue::fake()`, `Mail::fake()`, `Storage::fake()`, `Http::fake()` — fake at framework boundaries, don't mock Eloquent models.","Use the same DB engine in CI as prod. SQLite in-memory is fast but hides Postgres/MySQL JSON, constraint, and collation differences. This bites."]},
      {"kind":"p","text":"Tooling: Artisan generators (`make:model Post -mf --policy`, `make:request`, `make:job`, `make:test --pest`), Tinker for probing, Pint for formatting (run it, stop arguing style), Sail (Docker) or Herd locally, Vite for assets (Webpack Mix is legacy), Telescope/Pail locally, Horizon for queue monitoring in prod."},
    ],
    examples: [
      {"title":"Блок 15","code":"it('lets an author publish and queues notifications', function () {\n    Queue::fake();\n    $user = User::factory()->create();\n    $tag  = Tag::factory()->create();\n\n    $this->actingAs($user)\n         ->post(route('posts.store'), [\n             'title' => 'Hello', 'body' => '...', 'status' => 'published', 'tags' => [$tag->id],\n         ])\n         ->assertRedirect();\n\n    $this->assertDatabaseHas('posts', ['title' => 'Hello', 'user_id' => $user->id]);\n    Queue::assertPushed(NotifyFollowers::class);\n});\n\nit('forbids editing others posts', function () {\n    $post = Post::factory()->create();\n    $this->actingAs(User::factory()->create())\n         ->put(route('posts.update', $post), ['title' => 'x'])\n         ->assertForbidden();\n});","explanation":"Пояснение не заполнено."},
    ],
  },
  {
    heading: "9. Where Does Business Logic Go? (The Eternal Argument)",
    blocks: [
      {"kind":"p","text":"Laravel ships no service layer, so teams invent one. Honest positions:"},
      {"kind":"list","items":["**Action classes** (one public method, e.g. `CreatePost` above): testable, composable, my default recommendation for non-trivial writes.","**Service classes** (`PostService`): fine, but tend to become god-classes holding unrelated methods. If you use them, keep them narrow and domain-named.","**Fat models**: rich Eloquent models with domain methods (`$post->publish()`) are idiomatic for model-centric invariants. Don't force everything off the model.","**Repository pattern over Eloquent:** mostly an anti-pattern in Laravel. You duplicate the query builder, lose scopes/relations, and gain a leaky abstraction. Justified only at genuine external boundaries (payment provider, third-party API) — there, hide it behind *your* interface bound in the container."]},
      {"kind":"p","text":"DTOs (`spatie/laravel-data` is popular) earn their keep at API boundaries; internal CRUD rarely needs them."},
    ],
  },
  {
    heading: "10. Production Readiness",
    blocks: [
      {"kind":"p","text":"Checklist seniors recite: `APP_DEBUG=false`, `APP_KEY` set and never rotated casually (it decrypts cookies/sessions), OPcache on, eager loading audited, slow-query log, Horizon + scheduler cron running, cache/queue/session on Redis not `sync`/`file` in prod, filesystem on S3 with private disks + `temporaryUrl()` for downloads."},
      {"kind":"p","text":"**Octane caution:** huge speed win by keeping the app booted, but any request state stored in singletons/statics leaks between users. Only adopt with eyes open and tests."},
    ],
    examples: [
      {"title":"Блок 16","code":"composer install --no-dev --optimize-autoloader\nphp artisan config:cache route:cache view:cache event:cache\nphp artisan migrate --force\nphp artisan queue:restart   # workers otherwise keep running OLD code — classic deploy bug\nphp artisan storage:link","explanation":"Пояснение не заполнено."},
    ],
  },
  {
    heading: "Vocabulary Cheat-Sheet",
    blocks: [
      {"kind":"list","items":["**\"In the provider\"** — binding or bootstrapping logic lives in a ServiceProvider.","**\"Fire and forget\"** — dispatch a queued job/event; ensure idempotency if you say this.","**\"After commit\"** — deferring side effects until the DB transaction commits.","**\"Eager load it\"** — fix N+1 with `with()` before the loop, not in the view.","**\"Mass operation\"** — query-builder update/delete that skips model events.","**\"Validated data\"** — only `$request->validated()` is trusted input.","**\"Resource\"** — ambiguous: `JsonResource` API transformer, or resource controller/routes. Clarify which.","**\"Guard\"** — auth driver (`web` session vs `sanctum` token), not authorization."]},
    ],
  },
  {
    heading: "Questions That Make You Sound Experienced",
    blocks: [
      {"kind":"list","items":["\"Is that job idempotent, and what's its retry/backoff behaviour?\"","\"Will this dispatch fire before the transaction commits?\"","\"Are we authorizing in the FormRequest/policy, or only hiding it in Blade?\"","\"Does this mass update need model events to fire?\"","\"Singleton or scoped binding — safe on the queue worker/Octane?\"","\"Same DB engine in CI as prod?\""]},
    ],
  },
  {
    heading: "Practice Path",
    blocks: [
      {"kind":"list","ordered":true,"items":["CRUD blog with policies, FormRequests, factories, Pest tests — including a forbidden-access test.","Deliberately create an N+1, find it with `preventLazyLoading`, fix with eager loading.","Add a queued notification with `afterCommit`, retries, and a test proving it's pushed and idempotent.","Break something with `config:cache` + stray `env()` call; fix it properly.","Expose the same data via Inertia/Livewire *and* a Sanctum-protected API with a `JsonResource`; feel the tradeoff."]},
      {"kind":"p","text":"Master the lifecycle, the container, Eloquent's sharp edges, and authorization — and you don't just *use* Laravel, you can defend decisions about it in a room full of people who do."},
    ],
  },
];;
