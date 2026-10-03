import type { LessonSection } from "../curriculum";

export const sections: readonly LessonSection[] = [
  {
    heading: "0. The one idea you should carry out of this lesson",
    blocks: [
      {"kind":"p","text":"Most web frameworks treat your function signature as a formality — a place to catch whatever the router throws at you. FastAPI treats the signature as **the specification**. The types you annotate are simultaneously the parser, the validator, the serializer, the documentation, and the editor autocomplete. One declaration, five consequences."},
      {"kind":"p","text":"Everything else in FastAPI is machinery in service of that idea. If you internalize it now, the rest of the framework will feel less like a pile of features and more like the inevitable consequence of a single design commitment."},
    ],
  },
  {
    heading: "1. The lineage: why this framework exists at all",
    blocks: [
      {"kind":"p","text":"To understand FastAPI you need three pieces of prehistory, because FastAPI is less an invention than a *synthesis* — it is what happens when three independent threads of Python evolution finally braid together."},
      {"kind":"p","text":"**Thread one: type hints.** PEP 484 (2015) gave Python optional static annotations. For years these were treated as documentation for humans and linters — decorative, inert, ignored at runtime. The interesting observation, which took the ecosystem half a decade to fully exploit, is that annotations are *also available at runtime* via `typing.get_type_hints()`. They are data. You can read them. You can act on them."},
      {"kind":"p","text":"**Thread two: Pydantic.** Samuel Colvin took that observation and built a library that reads your annotations and does something aggressive with them: coerce, validate, and reject. A Pydantic model is a type declaration that enforces itself. Pydantic v2 rewrote the validation core in Rust (`pydantic-core`), which matters more than it sounds — validation is on the hot path of every single request, and making it fast changed the performance calculus of the whole approach."},
      {"kind":"p","text":"**Thread three: ASGI.** The old WSGI standard assumes a synchronous, request-in/response-out world: one thread, one request, blocking the whole time. That model cannot express WebSockets, server-sent events, long-lived connections, or `async`/`await` concurrency. ASGI is the successor spec — an async callable receiving `scope`, `receive`, and `send` — and Starlette (also by Tom Christie, of Django REST Framework fame) is the lightweight toolkit that makes ASGI pleasant: routing, middleware, test client, WebSockets."},
      {"kind":"p","text":"FastAPI, written by Sebastián Ramírez, is the glue: **Starlette for the transport layer, Pydantic for the data layer, and a dependency-injection system of its own invention to bind them.** It adds, almost for free, an OpenAPI schema generated from your annotations, and two interactive documentation UIs served off that schema."},
      {"kind":"callout","variant":"key","title":"Geek note:","text":"FastAPI is genuinely a thin layer. If you ever wonder \"how does it do that?\", the answer is usually \"Starlette does it\" or \"Pydantic does it.\" Reading FastAPI's source is a tractable afternoon, which is unusual and delightful."},
    ],
  },
  {
    heading: "2. Hello, specification",
    blocks: [
      {"kind":"p","text":"Twelve tokens of annotation are doing an enormous amount of work. Walk through what FastAPI inferred:"},
      {"kind":"p","text":"`item_id` appears in the path template, so it is a **path parameter**. It is annotated `int`, so the string `\"42\"` arriving over HTTP will be coerced to the integer `42`, and `\"banana\"` will produce a `422 Unprocessable Entity` with a structured error body pointing at exactly which field failed and why. You wrote no validation code."},
      {"kind":"p","text":"`q` does *not* appear in the path, and it is a scalar type with a default, so it is an **optional query parameter**. `?q=hello` populates it; its absence yields `None`."},
      {"kind":"p","text":"The returned `dict` is serialized to JSON. The whole thing is registered in an OpenAPI 3.1 document at `/openapi.json`, rendered as Swagger UI at `/docs` and ReDoc at `/redoc`, free of charge."},
      {"kind":"p","text":"The inference rules are worth stating explicitly, because once you know them, you stop guessing:"},
      {"kind":"list","items":["Name matches a `{placeholder}` in the path → **path parameter**.","Type is a Pydantic model (or a dataclass, or a `TypedDict`) → **request body**, parsed from JSON.","Otherwise, a scalar (`int`, `str`, `bool`, `float`, `UUID`, `datetime`, enums…) → **query parameter**.","Anything wrapped in `Depends(...)` → **dependency**, resolved by calling something else.","Special Starlette types (`Request`, `Response`, `BackgroundTasks`, `WebSocket`) → injected directly."]},
      {"kind":"p","text":"Everything else is explicit overrides of these defaults."},
    ],
    examples: [
      {"title":"Блок 1","code":"from fastapi import FastAPI\n\napp = FastAPI()\n\n@app.get(\"/items/{item_id}\")\nasync def read_item(item_id: int, q: str | None = None):\n    return {\"item_id\": item_id, \"q\": q}","explanation":"Пояснение не заполнено."},
    ],
  },
  {
    heading: "3. `Annotated`: the modern idiom",
    blocks: [
      {"kind":"p","text":"Early FastAPI used default values to carry metadata: `q: str = Query(max_length=50)`. This worked but conflated two orthogonal things — \"what is the default value\" and \"what are the validation rules\" — and it broke when you called the function directly in tests, since the default was now a `Query` object rather than a string."},
      {"kind":"p","text":"PEP 593's `Annotated` fixed this by giving us a place to hang metadata on a type without disturbing the value. **This is the idiom you should write today:**"},
      {"kind":"p","text":"Read `Annotated[X, meta]` as \"an `X`, and by the way, here is extra information about it that most of the language ignores but FastAPI reads.\" The default value sits where defaults belong. The function remains an ordinary callable you can unit-test without a client."},
    ],
    examples: [
      {"title":"Блок 2","code":"from typing import Annotated\nfrom fastapi import FastAPI, Query, Path\n\napp = FastAPI()\n\n@app.get(\"/items/{item_id}\")\nasync def read_item(\n    item_id: Annotated[int, Path(ge=1, description=\"Positive item ID\")],\n    q: Annotated[str | None, Query(max_length=50, pattern=\"^fixed\")] = None,\n):\n    ...","explanation":"Пояснение не заполнено."},
    ],
  },
  {
    heading: "4. Pydantic models: the request body and the response contract",
    blocks: [
      {"kind":"p","text":"Scalars are the easy case. Real APIs move structured documents around, and that is Pydantic's domain."},
      {"kind":"p","text":"Three things deserve emphasis here."},
      {"kind":"p","text":"**First, the input/output asymmetry is intentional and important.** `UserCreate` accepts a password; `UserPublic` cannot emit one. Beginners frequently define a single `User` model and reuse it everywhere, which is how passwords, internal flags, and soft-delete timestamps leak into public responses. Separate models are not boilerplate — they are the type system encoding your security boundary. Some people call this the \"schema sandwich\": input schema, domain object, output schema."},
      {"kind":"p","text":"**Second, `response_model` is a filter, not merely documentation.** If `db.insert_user` returns a fat ORM object with thirty attributes, FastAPI validates and projects it down to exactly the three fields `UserPublic` declares. Anything undeclared is dropped. This is a *fail-closed* design, and it is one of FastAPI's quietly excellent decisions."},
      {"kind":"p","text":"**Third, the return annotation (`-> UserPublic`) can replace `response_model` entirely** in modern FastAPI. Keep the explicit `response_model=` when the two must differ — for example, when your handler returns an ORM instance but you want the response filtered through a schema."},
      {"kind":"p","text":"Pydantic's coercion is principled, not magical. In v2, strings become `datetime` by ISO-8601 parsing; `\"1\"` becomes `1` under lax mode; but `\"banana\"` never becomes an int. You can demand `strict=True` per-field or per-model if you want coercion off entirely. Know which mode you are in; silent coercion is a feature until it is a bug."},
    ],
    examples: [
      {"title":"Блок 3","code":"from datetime import datetime\nfrom pydantic import BaseModel, Field, EmailStr\n\nclass UserCreate(BaseModel):\n    email: EmailStr\n    password: str = Field(min_length=12)\n    display_name: str = Field(max_length=80)\n\nclass UserPublic(BaseModel):\n    id: int\n    email: EmailStr\n    display_name: str\n    created_at: datetime\n\n@app.post(\"/users\", response_model=UserPublic, status_code=201)\nasync def create_user(payload: UserCreate) -> UserPublic:\n    user = await db.insert_user(payload)\n    return user","explanation":"Пояснение не заполнено."},
    ],
  },
  {
    heading: "5. Dependency injection: the framework's actual secret weapon",
    blocks: [
      {"kind":"p","text":"Validation gets the headlines. Dependency injection is where FastAPI earns long-term architectural respect."},
      {"kind":"p","text":"A dependency is just a callable. You declare that your handler needs its result, and FastAPI calls it for you — resolving *its* dependencies first, recursively, memoizing within a single request."},
      {"kind":"p","text":"Several conceptual points are packed in here."},
      {"kind":"p","text":"**`yield` dependencies are scoped resources.** The code before `yield` is setup, the code after is teardown, and teardown runs *after the response is generated*. This is Python's context-manager protocol lifted into the request lifecycle. Database sessions, file handles, distributed locks, tracing spans — anything with an acquire/release shape belongs here."},
      {"kind":"p","text":"**Dependencies compose into graphs, not chains.** `read_me` needs a user; the user-getter needs a database and a token; the token-getter needs the request headers. You declared a DAG, and FastAPI topologically sorts and executes it. If two different dependencies both require `get_db`, it is called *once* per request and cached — which is exactly what you want for a transaction."},
      {"kind":"p","text":"**The `Annotated` alias trick (`DB`, `CurrentUser`) is the single best ergonomic habit in FastAPI.** Define each dependency's type alias once, then use it as a plain annotation everywhere. Your handlers read like domain code rather than framework code."},
      {"kind":"p","text":"**Dependencies are the natural seam for testing.** `app.dependency_overrides[get_db] = lambda: fake_session` swaps the real database for a fake across your entire test suite, without monkeypatching or import gymnastics. This is dependency inversion in the classical sense: handlers depend on an abstract requirement, and the composition root (your app, or your test) supplies the concrete implementation."},
      {"kind":"p","text":"**Dependencies can also be pure side effects.** If a dependency returns nothing but enforces something — rate limiting, API-key checking, audit logging — attach it at the decorator or router level:"},
    ],
    examples: [
      {"title":"Блок 4","code":"from typing import Annotated\nfrom fastapi import Depends, HTTPException\n\nasync def get_db() -> AsyncIterator[AsyncSession]:\n    async with SessionLocal() as session:\n        yield session            # <- handler runs here\n\nDB = Annotated[AsyncSession, Depends(get_db)]\n\nasync def get_current_user(\n    db: DB,\n    token: Annotated[str, Depends(oauth2_scheme)],\n) -> User:\n    user = await db.get_user_by_token(token)\n    if user is None:\n        raise HTTPException(401, \"Invalid credentials\")\n    return user\n\nCurrentUser = Annotated[User, Depends(get_current_user)]\n\n@app.get(\"/me\", response_model=UserPublic)\nasync def read_me(user: CurrentUser) -> User:\n    return user","explanation":"Пояснение не заполнено."},
      {"title":"Блок 5","code":"@app.get(\"/admin\", dependencies=[Depends(require_admin)])\nasync def admin_panel(): ...\n\n# or for an entire subtree:\nrouter = APIRouter(prefix=\"/admin\", dependencies=[Depends(require_admin)])","explanation":"Пояснение не заполнено."},
    ],
  },
  {
    heading: "6. Async, and the one mistake everyone makes",
    blocks: [
      {"kind":"p","text":"FastAPI supports both `def` and `async def` handlers, and the distinction is the most commonly misunderstood thing in the framework. Here is the precise rule:"},
      {"kind":"list","items":["**`async def`** handlers run **directly on the event loop**, in the main thread, cooperatively interleaved with every other request.","**`def`** handlers are automatically run in an **external threadpool** (via AnyIO) so they cannot block the loop."]},
      {"kind":"p","text":"The failure mode follows immediately. If you write `async def` and then call something blocking inside it — a synchronous `psycopg2` query, `requests.get()`, `time.sleep()`, a heavy `json.loads` on a 50 MB payload — you have stalled the *entire event loop*. Every concurrent request on that worker freezes until you return. The framework will not warn you. Your p99 latency will."},
      {"kind":"p","text":"The counterintuitive corollary: **a plain `def` handler with a blocking driver is strictly better than an `async def` handler with the same blocking driver.** Only reach for `async def` when your I/O is genuinely awaitable all the way down — `asyncpg`, `httpx.AsyncClient`, `redis.asyncio`, `aiofiles`, SQLAlchemy's async engine."},
      {"kind":"p","text":"When you must call blocking code from async context, delegate explicitly:"},
      {"kind":"p","text":"And for CPU-bound work — image resizing, PDF generation, model inference — threads will not save you, because the GIL serializes them. That work belongs in a process pool or, better, a separate worker service behind a queue."},
      {"kind":"callout","variant":"key","title":"Mental model:","text":"the event loop is a single-lane road with very polite drivers who pull over whenever they wait. One driver who refuses to pull over blocks everyone. `def` handlers are a side road with its own lanes (the threadpool), finite but independent."},
    ],
    examples: [
      {"title":"Блок 6","code":"from anyio import to_thread\n\n@app.get(\"/report\")\nasync def report():\n    data = await to_thread.run_sync(expensive_blocking_call)\n    return data","explanation":"Пояснение не заполнено."},
    ],
  },
  {
    heading: "7. Structure: routers, lifespan, settings",
    blocks: [
      {"kind":"p","text":"A single `main.py` is fine until it isn't. The unit of modularity is `APIRouter`, which behaves like a mini-application you later mount:"},
      {"kind":"p","text":"`tags` group endpoints in the generated docs; `prefix` avoids repeating path segments. Routers nest, so you can build `/api/v1/items/...` by including a versioned router inside the app."},
      {"kind":"p","text":"For startup and shutdown work — opening a connection pool, loading an ML model, warming a cache — use the **lifespan context manager**. The older `@app.on_event(\"startup\")` decorators are deprecated:"},
      {"kind":"p","text":"Note the shape: it is the same acquire/yield/release pattern as a `yield` dependency, lifted from request scope to application scope. FastAPI is pleasingly consistent about this."},
      {"kind":"p","text":"Configuration belongs in `pydantic-settings`, which applies the same validate-at-the-boundary philosophy to environment variables:"},
      {"kind":"p","text":"Your app now crashes *at boot* with a clear message if `DATABASE_URL` is missing, rather than at 3 a.m. with an `AttributeError` on `None`. This is the same idea as request validation, applied to the process environment: **push failure to the earliest, loudest, cheapest point.**"},
    ],
    examples: [
      {"title":"Блок 7","code":"# app/routers/items.py\nfrom fastapi import APIRouter\n\nrouter = APIRouter(prefix=\"/items\", tags=[\"items\"])\n\n@router.get(\"/{item_id}\")\nasync def read_item(item_id: int): ...\n\n# app/main.py\nfrom fastapi import FastAPI\nfrom app.routers import items, users\n\napp = FastAPI(title=\"Inventory API\", version=\"1.2.0\")\napp.include_router(items.router)\napp.include_router(users.router)","explanation":"Пояснение не заполнено."},
      {"title":"Блок 8","code":"from contextlib import asynccontextmanager\n\n@asynccontextmanager\nasync def lifespan(app: FastAPI):\n    app.state.pool = await create_pool()   # startup\n    yield\n    await app.state.pool.close()           # shutdown\n\napp = FastAPI(lifespan=lifespan)","explanation":"Пояснение не заполнено."},
      {"title":"Блок 9","code":"from pydantic_settings import BaseSettings\nfrom functools import lru_cache\n\nclass Settings(BaseSettings):\n    database_url: str\n    jwt_secret: str\n    debug: bool = False\n    model_config = {\"env_file\": \".env\"}\n\n@lru_cache\ndef get_settings() -> Settings:\n    return Settings()\n\nSettingsDep = Annotated[Settings, Depends(get_settings)]","explanation":"Пояснение не заполнено."},
    ],
  },
  {
    heading: "8. Errors, middleware, and background work",
    blocks: [
      {"kind":"p","text":"**Errors.** Raise `HTTPException(status_code, detail)` for expected client-facing failures. For your own domain exceptions, register a handler once and let the rest of your code raise freely:"},
      {"kind":"p","text":"This keeps HTTP concerns at the edge and your business logic framework-agnostic — a boundary worth defending."},
      {"kind":"p","text":"**Middleware** wraps every request. The decorator form is convenient:"},
      {"kind":"p","text":"Be aware that this convenience form (`BaseHTTPMiddleware` underneath) has historically had rough edges with streaming responses and exception propagation. For anything performance-critical or subtle, write raw ASGI middleware — a callable taking `(scope, receive, send)`. It is lower-level but has no surprises."},
      {"kind":"p","text":"Order matters and is counterintuitive: middleware added *last* runs *first* (outermost). Think of each `add_middleware` call as wrapping another layer around the onion."},
      {"kind":"p","text":"**Background tasks** let you return a response immediately and do work after:"},
      {"kind":"p","text":"Crucial caveat: these run **in the same process, after the response is flushed**. There is no persistence, no retry, no visibility. If your server restarts, the task evaporates. Use `BackgroundTasks` for cheap, idempotent, loss-tolerant work (fire-and-forget logging, cache invalidation). For anything that *must* happen, use a real queue — Celery, Dramatiq, ARQ, or your cloud's equivalent."},
    ],
    examples: [
      {"title":"Блок 10","code":"class InsufficientStock(Exception):\n    def __init__(self, sku: str): self.sku = sku\n\n@app.exception_handler(InsufficientStock)\nasync def stock_handler(request: Request, exc: InsufficientStock):\n    return JSONResponse(status_code=409, content={\"sku\": exc.sku, \"error\": \"out_of_stock\"})","explanation":"Пояснение не заполнено."},
      {"title":"Блок 11","code":"@app.middleware(\"http\")\nasync def add_timing(request: Request, call_next):\n    start = time.perf_counter()\n    response = await call_next(request)\n    response.headers[\"X-Process-Time\"] = f\"{time.perf_counter() - start:.4f}\"\n    return response","explanation":"Пояснение не заполнено."},
      {"title":"Блок 12","code":"@app.post(\"/signup\")\nasync def signup(user: UserCreate, background: BackgroundTasks):\n    created = await db.create(user)\n    background.add_task(send_welcome_email, created.email)\n    return {\"id\": created.id}","explanation":"Пояснение не заполнено."},
    ],
  },
  {
    heading: "9. Testing",
    blocks: [
      {"kind":"p","text":"Testing is where FastAPI's design pays a dividend you can measure. Because handlers are ordinary typed functions and dependencies are overridable, tests are short."},
      {"kind":"p","text":"`TestClient` is synchronous (it runs an event loop internally) and is built on `httpx`. For genuinely async tests — needed when your fixtures are async — use `httpx.AsyncClient` with `ASGITransport`, which skips the network stack entirely and speaks ASGI directly to your app."},
      {"kind":"p","text":"That last assertion, `\"password\" not in r.json()`, is the kind of test that `response_model` makes almost redundant — but write it anyway. Testing your security boundary is never wasted."},
    ],
    examples: [
      {"title":"Блок 13","code":"from fastapi.testclient import TestClient\n\nclient = TestClient(app)\n\ndef test_rejects_short_password():\n    r = client.post(\"/users\", json={\"email\": \"a@b.co\", \"password\": \"x\", \"display_name\": \"A\"})\n    assert r.status_code == 422\n\ndef test_creates_user():\n    app.dependency_overrides[get_db] = lambda: FakeDB()\n    r = client.post(\"/users\", json={...})\n    assert r.status_code == 201\n    assert \"password\" not in r.json()\n    app.dependency_overrides.clear()","explanation":"Пояснение не заполнено."},
    ],
  },
  {
    heading: "10. Security: what FastAPI gives you and what it doesn't",
    blocks: [
      {"kind":"p","text":"FastAPI provides the *plumbing* for authentication — `OAuth2PasswordBearer`, `HTTPBearer`, `APIKeyHeader`, and the machinery to document these schemes in OpenAPI so the `/docs` page grows an \"Authorize\" button. It does **not** provide a user model, a password hasher, a session store, or a permissions system. That is deliberate: it's a framework for APIs, not a batteries-included application platform like Django."},
      {"kind":"p","text":"The canonical pattern is a bearer-token dependency that resolves to a user, with authorization expressed as further dependencies layered on top:"},
      {"kind":"p","text":"Note `require_role` is a *dependency factory* — a function returning a dependency — which is how you parameterize injected behavior. Use `passlib` or `argon2-cffi` for password hashing, never a bare hash function. And remember that `401` means \"I don't know who you are\" while `403` means \"I know, and no.\""},
    ],
    examples: [
      {"title":"Блок 14","code":"oauth2_scheme = OAuth2PasswordBearer(tokenUrl=\"auth/token\")\n\nasync def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]) -> User:\n    try:\n        payload = jwt.decode(token, settings.jwt_secret, algorithms=[\"HS256\"])\n    except JWTError:\n        raise HTTPException(401, \"Invalid token\", headers={\"WWW-Authenticate\": \"Bearer\"})\n    ...\n\ndef require_role(role: str):\n    async def checker(user: CurrentUser) -> User:\n        if role not in user.roles:\n            raise HTTPException(403, \"Forbidden\")\n        return user\n    return checker\n\n@app.delete(\"/items/{id}\", dependencies=[Depends(require_role(\"admin\"))])\nasync def delete_item(id: int): ...","explanation":"Пояснение не заполнено."},
    ],
  },
  {
    heading: "11. Deployment, briefly and honestly",
    blocks: [
      {"kind":"p","text":"FastAPI is an ASGI application object; it does not serve itself. **Uvicorn** is the standard server (built on `uvloop` and `httptools` in its fast configuration); **Hypercorn** and **Granian** are alternatives."},
      {"kind":"p","text":"In development: `fastapi dev main.py` or `uvicorn main:app --reload`."},
      {"kind":"p","text":"In production, you want multiple worker processes to use multiple cores — `uvicorn main:app --workers 4`, or a process supervisor, or (increasingly the preferred answer) one worker per container and let Kubernetes or your orchestrator handle replication. The older `gunicorn -k uvicorn.workers.UvicornWorker` recipe still works and gives you battle-tested process management."},
      {"kind":"p","text":"A rule of thumb on worker count: **CPU-bound workloads want roughly `n_cores` workers; I/O-bound async workloads need far fewer**, because each worker already multiplexes thousands of concurrent connections. Measure before you tune. Put a real reverse proxy (nginx, Caddy, Traefik, or a managed load balancer) in front for TLS termination, static files, and request buffering — and set `--proxy-headers` / `ProxyHeadersMiddleware` so your app sees the true client IP."},
      {"kind":"p","text":"On the \"Fast\" in FastAPI: the benchmark claims are real but narrowly scoped — they measure framework overhead, which in any realistic application is dwarfed by your database. FastAPI's genuine performance virtue is that **async I/O lets one process hold thousands of in-flight requests** that are mostly waiting. If your bottleneck is a slow `JOIN`, no framework will save you."},
    ],
  },
  {
    heading: "12. The pitfalls, collected",
    blocks: [
      {"kind":"p","text":"Learning a framework is substantially learning its failure modes. Here are the ones that account for most real-world pain:"},
      {"kind":"p","text":"**Blocking the event loop.** Covered above; it is the number one cause of \"FastAPI is slow\" bug reports. If you are unsure whether a library is async, assume it isn't."},
      {"kind":"p","text":"**One model for everything.** Input and output schemas should differ. ORM models should not be your API schemas. The moment you add a field to your database table, a shared model leaks it."},
      {"kind":"p","text":"**Mutable default arguments.** `def f(items: list = [])` is a Python footgun, not a FastAPI one, but FastAPI's heavy use of defaults makes it easy to hit. Use `Field(default_factory=list)` in Pydantic models."},
      {"kind":"p","text":"**Forgetting that validation is a boundary, not a sprinkle.** Validate once, at the edge, into a trusted type. Then stop re-checking inside your business logic. The entire point of a parsed type is that downstream code may assume it is valid. (Alexis King's slogan — *parse, don't validate* — is the clearest articulation of this, and FastAPI is one of the best mainstream implementations of it in any language.)"},
      {"kind":"p","text":"**Treating `BackgroundTasks` as a job queue.** It isn't one. See §8."},
      {"kind":"p","text":"**Global mutable state.** A module-level `current_user = None` will work perfectly in testing and corrupt data under concurrency. Per-request state belongs in dependencies or `request.state`; application state belongs in `app.state`, set during lifespan."},
      {"kind":"p","text":"**Skipping `response_model` because \"it works without it.\"** It does work — until the day it returns something it shouldn't."},
    ],
  },
  {
    heading: "13. A suggested path forward",
    blocks: [
      {"kind":"p","text":"Build one small, real thing — a URL shortener, a bookmark API, a job board — and insist on the following, in order: a `GET` with a path and a query parameter; a `POST` with a Pydantic body and a distinct response model; a database session as a `yield` dependency; an authenticated endpoint; a test suite with `dependency_overrides`; a Dockerfile. That sequence touches every concept in this lesson, and each step forces you to understand the previous one."},
      {"kind":"p","text":"Then, when it works, go read FastAPI's `routing.py` and `dependencies/utils.py`. You will find that the magic resolves into about two thousand lines of careful `inspect.signature` introspection and recursive resolution. The spell breaks, and what remains is better: you can now predict the framework's behavior rather than remember it."},
      {"kind":"p","text":"That's the real goal. Frameworks you can predict are frameworks you can trust at 3 a.m."},
    ],
  },
];;
