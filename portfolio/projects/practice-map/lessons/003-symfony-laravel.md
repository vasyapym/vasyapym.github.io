# Symfony и Laravel с нуля до глубокого понимания

Вы написали обработчик, но судьба запроса решилась раньше: маршрут не совпал, проверка остановила выполнение или контейнер не смог собрать зависимость. Мы разберём эту невидимую часть на одном предметном примере — бронировании мест на события — в двух независимых приложениях с одинаковым HTTP-контрактом. Предполагается, что вы знаете HTTP, SQL и ООП; необходимые особенности PHP будут объясняться по ходу. Учебные базы: PHP 8.3, Symfony 7.4.x, Laravel 11.x, PostgreSQL 16, Composer 2 и PHPUnit; это зафиксированные версии, а не заявление об их актуальности для нового production-проекта.

## Часть 0. Зачем вообще существуют фреймворки (и почему их два)

### 0.1. От работающего PHP-файла к неуправляемому приложению

Первый список событий помещается в один PHP-файл: прочитать параметры, выполнить SQL, вывести JSON. Затем появляются создание бронирования, просмотр своих бронирований и отмена своей записи. Каждому обработчику нужны разбор входа, соединение с БД, проверка пользователя, обработка ошибок и формирование ответа.

Проблема возникает не от количества строк само́го по себе. Один файл проверяет пользователя до SQL, другой — после; один возвращает JSON при ошибке, другой печатает диагностическое сообщение. Порядок обязательных действий становится неявным, а ответственность за него распределяется между обработчиками.

Поэтому полезная инфраструктура должна не просто сокращать повторения, а закреплять порядок выполнения и владельца каждого решения. Иначе исправление одной операции ничего не гарантирует для остальных. Это болезнь организации приложения, а не доказательство непригодности PHP.

### 0.2. Symfony 2005 и Laravel 2011: две реакции на стоимость разработки

Symfony появился в 2005 году как ответ на повторное изобретение инфраструктуры веб-приложений. Устойчивые соглашения позволяли команде тратить меньше усилий на согласование устройства сложного проекта.

Laravel появился в 2011 году на фоне ограничений привычного для автора CodeIgniter-подхода: повседневные задачи разработки требовали более удобного API и встроенных решений. Выразительная запись типичных действий стала самостоятельной ценностью: часто выполняемая операция должна требовать меньше обслуживающего кода.

Это исторические направления, не описание сегодняшних реализаций. Нельзя приписывать первым версиям современные attributes, контейнеры или нынешнюю структуру каталогов. Оба проекта существенно изменились; Laravel также использует ряд компонентов Symfony, но не является приложением на Symfony Framework.

### 0.3. Что каждый подход отказывается делать за вас

Symfony чаще предлагает выразить устройство приложения через определения сервисов, типы и конфигурацию. Laravel чаще оптимизирует типичный путь через соглашения, выразительные API и **dynamic dispatch** — выбор вызываемого поведения во время выполнения. Различие влияет на то, где вы ищете причину вызова: в явной регистрации либо в соглашении и его реализации.

Это не абсолютное разделение: Symfony использует автоматическую настройку, Laravel позволяет явно связывать интерфейсы с реализациями. Ни один подход не определит за вас, когда место считается занятым, кто вправе отменять бронирование и что означает повтор с тем же ключом идемпотентности.

Наши сущности — Event с названием и доступными местами, Reservation с пользователем, событием, статусом и ключом идемпотентности, User. Приложения на портах 8001 и 8002 будут независимыми: общий контракт не означает общую библиотеку.

### 0.4. Общие свойства

Оба подхода опираются на пять оснований:

1. Единая точка входа и управляемый жизненный цикл запроса.
2. **Inversion of Control**, инверсия управления: инфраструктура вызывает ваш код; контейнер собирает его зависимости.
3. Декларативные метаданные и соглашения, по которым выбираются обработчики.
4. Управляемые границы HTTP, доступа к данным и обработки ошибок.
5. Экосистема Composer: пакеты, ограничения версий и загрузка классов.

Каждое основание переносит повторяемое решение из отдельного обработчика в проверяемый механизм. Цена — необходимость понимать этот механизм при отладке.

### 0.5. Ментальная модель №1: явный граф выполнения вместо «магии»

**М1 — граф выполнения**:

```text
вход → выбор обработчиков → вызовы зависимостей → побочные эффекты → ответ
```

Стрелка означает конкретное решение: кто, при каких условиях и с какими данными вызывает следующий участок. Если ваш метод не исполнился, изменение его тела не устранит причину.

Предсказание М1: чтобы изменить поведение, найдите механизм, решивший вызвать ваш код, а не только саму функцию. Предел модели: граф одного запроса не описывает конкуренцию запросов и стоимость операций. Сначала построим хотя бы первый непрерывный путь — от установленного проекта до HTTP-ответа.

---

## Часть 1. От Composer до первого HTTP-ответа

### 1.1. Какую проблему мы сейчас решаем

На вашем компьютере `/hello` отвечает, а у коллеги отсутствует класс или установлена другая версия пакета. Пока зависимости невоспроизводимы, обсуждать поведение контроллера рано: фактически вы запускаете разные программы.

Сначала докажем только путь «установленный проект → приложение → ответ». Выбор маршрута подробно разберём в части 3. База данных здесь не нужна; первоначальная SQLite-конфигурация Laravel не становится нашей предметной БД.

### 1.2. Как это устроено внутри

`composer.json` задаёт ограничения зависимостей. При разрешении версий Composer выбирает совместимый набор и записывает его в `composer.lock`. Последующий `composer install` устанавливает зафиксированный набор; `composer update` выполняет новое разрешение в пределах ограничений. **Autoloader**, автоматический загрузчик классов, связывает имена классов с файлами.

По **PSR-4** префикс `App\` соответствует `src/` в Symfony и `app/` в Laravel. `namespace` задаёт пространство имён, `use` сокращает запись имени: импорт имени сам по себе не загружает файл. Загрузка происходит, когда исполнению действительно нужен класс.

**Front controller**, единая входная PHP-точка, здесь — `public/index.php`. В Symfony 7.4 стандартный skeleton использует Symfony Runtime для запуска Kernel; в Laravel 11 входной файл загружает приложение из `bootstrap/app.php`. Инвариант цепочки: исполняемый код должен соответствовать зависимостям и конфигурации установленного проекта.

В PHP свойства и параметры могут иметь типы. В конструкторе ниже `private readonly string $greeting` одновременно объявляет и инициализирует свойство: это **constructor property promotion**. `strict_types=1` запрещает часть скалярных преобразований на границе вызовов из данного файла, но не проверяет HTTP-вход.

`#[Route(...)]` — **attribute**, метаданные: они действуют лишь потому, что инфраструктура их читает. Laravel-маршрут использует **closure**, анонимную функцию, переданную как обработчик.

При обычном PHP-FPM исполнение приложения начинается заново для каждого запроса, хотя процесс и OPcache могут жить дольше. Это не относится автоматически к долгоживущим worker-режимам.

### 1.3. Минимальный пример, который действительно что-то доказывает

Нужны PHP 8.3, Composer 2 и расширения `curl`, `dom`, `mbstring`, `xml`, `intl`, `pdo_sqlite`, `pdo_pgsql`. SQLite требуется стандартным установочным scripts Laravel; PostgreSQL подключим позже. Проверьте `php -v`, `php -m`, `composer --version`.

Из общего рабочего каталога:

```bash
composer create-project symfony/skeleton symfony-app "7.4.*"
composer create-project laravel/laravel laravel-app "11.*"
```

Composer также учитывает платформенные требования и политику безопасности. Если установленная версия Composer блокирует уязвимые пакеты, не отключайте защиту production-сборки ради старой учебной базы: сначала разберите диагностику.

Сгенерированные файлы сохраняем, перечисленные ниже создаём или полностью заменяем. Далее все пути отсчитываются от общего рабочего каталога.

`symfony-app/config/routes.yaml`:

```yaml
controllers:
    resource:
        path: ../src/Controller/
        namespace: App\Controller
    type: attribute
```

`symfony-app/config/services.yaml`:

```yaml
services:
    _defaults:
        autowire: true
        autoconfigure: true

    App\:
        resource: '../src/'
        exclude: '../src/{Kernel.php,Data}'
```

`symfony-app/src/Controller/HelloController.php`:

```php
<?php
declare(strict_types=1);

namespace App\Controller;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

final class HelloController
{
    public function __construct(
        private readonly string $greeting = 'Привет',
    ) {}

    #[Route('/hello', name: 'hello', methods: ['GET'])]
    public function __invoke(): JsonResponse
    {
        return new JsonResponse([
            'message' => $this->greeting,
            'framework' => 'Symfony',
        ]);
    }
}
```

В Laravel сразу используем stateless API-маршруты без префикса `/api`. Web-маршруты в этом учебном приложении не подключаем; session-аутентификации здесь пока нет.

`laravel-app/bootstrap/app.php`:

```php
<?php
declare(strict_types=1);

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        apiPrefix: '',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
    })
    ->withExceptions(function (Exceptions $exceptions): void {
    })
    ->create();
```

`laravel-app/routes/api.php`:

```php
<?php
declare(strict_types=1);

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Route;

Route::get('/hello', function (): JsonResponse {
    return response()->json([
        'message' => 'Привет',
        'framework' => 'Laravel',
    ]);
})->name('hello');
```

Запустите в двух отдельных терминалах:

```bash
cd symfony-app
php -S 127.0.0.1:8001 -t public public/index.php
```

```bash
cd laravel-app
php artisan serve --host=127.0.0.1 --port=8002
```

Из третьего терминала:

```bash
curl -i http://127.0.0.1:8001/hello
curl -i http://127.0.0.1:8002/hello
```

Ожидаются `200 OK`, JSON Content-Type и поле `"message":"Привет"`; Unicode может быть экранирован. Ответ означает, что зависимости загрузились, входная точка запустила приложение и обработчик вернул HTTP-объект.

**Вывод примера:** работоспособность обработчика доказана только вместе с цепочкой его загрузки.

### 1.4. Ловушка №1: исправлять зависимость внутри vendor

Плохой вариант — вручную исправить установленный пакет или выполнить бесконтрольный `composer update`. Предположение «рабочий каталог и есть источник истины» ломается: чистая установка стирает правку, а новый lockfile меняет больше зависимостей, чем ожидалось.

Исправляйте приложение или подключайте контролируемую версию пакета. Сохраняйте ограничения и lockfile; проверяйте чистую сборку через `composer install`.

### 1.5. Соглашения и опытное суждение

| Файл | Кто отвечает и что сохранять |
|---|---|
| `composer.json` | Команда: ограничения, scripts, autoload; хранить в Git |
| `composer.lock` | Composer формирует, команда проверяет; хранить в Git приложения |
| `vendor/` | Composer; не редактировать и не коммитить |
| `.env` | Настройки окружения; секреты не коммитить |

В Symfony `.env` обычно содержит версионируемые несекретные значения, а `.env.local` — локальные переопределения. В Laravel обычно версионируют `.env.example`, не `.env`.

**Как думают опытные.** Я сначала добиваюсь повторяемой установки, затем исследую HTTP. Но успешный `/hello` ещё не показывает, что произошло до обработчика и после него.

---

## Часть 2. Запрос проходит через ядро, а не сразу в контроллер

### 2.1. Какую проблему мы сейчас решаем

Вы поставили журналирование первой строкой контроллера, получили ошибку и не увидели записи. Контроллер не обязательно сломан: запрос мог быть остановлен раньше. И наоборот, выполненный action ещё не гарантирует, что клиент получит задуманный ответ.

Нам нужна наблюдаемая внешняя граница обработки, включая ранний отказ.

### 2.2. Как это устроено внутри

Общий механизм принимает **Request**, объект запроса, выбирает обработчики и формирует **Response**, объект статуса, заголовков и тела. Исключение должно попасть в обработчик ошибок, а не превратиться в произвольный вывод.

```text
Symfony 7.4:
boot Kernel → HttpKernel → kernel.request
→ разрешение controller → kernel.controller
→ разрешение аргументов → kernel.controller_arguments
→ controller → [kernel.view, если нужен] → kernel.response → Response

исключение внутри обработки → kernel.exception
→ обработчик создаёт Response → kernel.response
```

**Subscriber** — объект, подписанный на события. Приоритет определяет порядок слушателей одного события; слушатель `kernel.request` может установить Response и остановить обычный путь.

```text
Laravel 11:
bootstrap приложения и providers
→ global HTTP middleware
  → router → route middleware
    → controller dispatcher → controller
    ← Response
  ← обратный проход route middleware
← обратный проход global middleware
```

**Provider** регистрирует и настраивает сервисы. **Middleware** — обработчик вокруг следующего звена: он может вызвать `$next`, изменить ответ или вернуть ранний ответ. Laravel Pipeline также направляет исключения в обработчик ошибок.

События Symfony не являются другим названием middleware: это точки уведомления с приоритетами, а не обязательно вложенные вызовы. Поэтому выход в Symfony наблюдаем отдельной подпиской, в Laravel — кодом после `$next`.

Инвариант нашего наблюдения: каждый запрос, прошедший точку входа трассировки и получивший Response, имеет идентификатор и запись выхода. Обрыв процесса этим не покрывается.

**М5 — наблюдение границ выполнения.** Если есть «вход», но нет «контроллер», ищите решение между ними. Предел: журнал показывает отмеченные точки, а не доказывает отсутствие неотмеченных побочных эффектов.

### 2.3. Минимальный пример, который действительно что-то доказывает

Добавьте subscriber и middleware, затем замените оба `/hello` и Laravel bootstrap. Ожидаем заголовок `X-Request-Id` и порядок `вход → контроллер → выход`; с `?reject=1` — статус 400 без записи контроллера.

`symfony-app/src/EventSubscriber/TraceSubscriber.php`:

```php
<?php
declare(strict_types=1);

namespace App\EventSubscriber;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpKernel\KernelEvents;

final class TraceSubscriber implements EventSubscriberInterface
{
    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::REQUEST => ['onRequest', 256],
            KernelEvents::RESPONSE => ['onResponse', -256],
        ];
    }

    public static function record(Request $request, string $phase): void
    {
        file_put_contents(
            dirname(__DIR__, 2).'/var/trace.log',
            $request->attributes->get('_trace_id').' '.$phase.PHP_EOL,
            FILE_APPEND | LOCK_EX,
        );
    }

    public function onRequest(RequestEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $request = $event->getRequest();
        $request->attributes->set('_trace_id', bin2hex(random_bytes(8)));
        self::record($request, 'вход');

        if ($request->query->get('reject') === '1') {
            throw new HttpException(400, 'Ранний отказ');
        }
    }

    public function onResponse(ResponseEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $request = $event->getRequest();
        if (!$request->attributes->has('_trace_id')) {
            return;
        }

        $event->getResponse()->headers->set(
            'X-Request-Id',
            $request->attributes->get('_trace_id'),
        );
        self::record($request, 'выход');
    }
}
```

`symfony-app/src/Controller/HelloController.php`:

```php
<?php
declare(strict_types=1);

namespace App\Controller;

use App\EventSubscriber\TraceSubscriber;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

final class HelloController
{
    #[Route('/hello', name: 'hello', methods: ['GET'])]
    public function __invoke(Request $request): JsonResponse
    {
        TraceSubscriber::record($request, 'контроллер');

        return new JsonResponse([
            'message' => 'Привет',
            'framework' => 'Symfony',
        ]);
    }
}
```

`laravel-app/app/Http/Middleware/TraceRequest.php`:

```php
<?php
declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class TraceRequest
{
    public static function record(Request $request, string $phase): void
    {
        file_put_contents(
            storage_path('logs/trace.log'),
            $request->attributes->get('_trace_id').' '.$phase.PHP_EOL,
            FILE_APPEND | LOCK_EX,
        );
    }

    public function handle(Request $request, Closure $next): Response
    {
        $request->attributes->set('_trace_id', bin2hex(random_bytes(8)));
        self::record($request, 'вход');

        $response = $request->query('reject') === '1'
            ? response()->json(['error' => 'early_rejection'], 400)
            : $next($request);

        $response->headers->set(
            'X-Request-Id',
            $request->attributes->get('_trace_id'),
        );
        self::record($request, 'выход');

        return $response;
    }
}
```

`laravel-app/bootstrap/app.php`:

```php
<?php
declare(strict_types=1);

use App\Http\Middleware\TraceRequest;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        apiPrefix: '',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->append(TraceRequest::class);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
    })
    ->create();
```

`laravel-app/routes/api.php`:

```php
<?php
declare(strict_types=1);

use App\Http\Middleware\TraceRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/hello', function (Request $request): JsonResponse {
    TraceRequest::record($request, 'контроллер');

    return response()->json([
        'message' => 'Привет',
        'framework' => 'Laravel',
    ]);
})->name('hello');
```

Проверка из общего каталога:

```bash
rm -f symfony-app/var/trace.log laravel-app/storage/logs/trace.log

for port in 8001 8002; do
  curl -i "http://127.0.0.1:$port/hello"
  curl -i "http://127.0.0.1:$port/hello?reject=1"
done

cat symfony-app/var/trace.log
cat laravel-app/storage/logs/trace.log
```

В каждом журнале первые три строки имеют один ID, следующие две — другой:

```text
<ID первого запроса> вход
<ID первого запроса> контроллер
<ID первого запроса> выход
<ID второго запроса> вход
<ID второго запроса> выход
```

Здесь обозначены изменяющиеся идентификаторы, не буквальный вывод. Symfony превращает раннее исключение в Response; Laravel возвращает его непосредственно. Обе ветки достигают нашей точки выхода.

**Вывод примера:** отсутствие вызова контроллера совместимо с полностью обработанным HTTP-запросом.

### 2.4. Ловушка №2: считать контроллер началом и концом запроса

Плохой вариант — искать ранний отказ только в action или завершать его через `echo` и `exit`. Первое игнорирует предшествующие решения; второе обрывает управляемый проход ответа, включая наши заголовки и журналирование.

Возвращайте Response и проверяйте порядок инфраструктуры. Учебный `reject` — явный переключатель эксперимента, не механизм безопасности.

### 2.5. Соглашения и опытное суждение

| Ответственность | Предпочтительный слой здесь |
|---|---|
| Request ID, наблюдение HTTP | Subscriber / middleware |
| Разбор параметров операции | Контроллер и входной адаптер |
| Решение о бронировании | Application service |
| Представление непредвиденной ошибки | Общий exception handler |

**Как думают опытные.** Я ставлю наблюдение снаружи проверяемой области, а не только внутри неё. Следующий вопрос: какое решение вообще привело запрос в выбранный контроллер?

---

## Часть 3. Маршрут, контроллер и Response образуют HTTP-контракт

### 3.1. Какую проблему мы сейчас решаем

`GET /events/1` работает, но `POST` на тот же адрес неожиданно считается допустимой операцией, а отсутствующее событие возвращается с кодом 200. Клиент уже не может отличить найденный ресурс от ошибки без знания ваших внутренних соглашений.

Нужно разделить выбор операции, извлечение аргументов и смысл результата. Для проверки используем временный каталог в памяти, не БД.

### 3.2. Как это устроено внутри

Router сопоставляет HTTP-метод и путь с описанием маршрута. Параметр `{id}` сначала является извлечённым из URL значением. Ограничение маршрута проверяет его форму, но не существование события.

Если подходящего пути нет, результат — **404 Not Found**. Если путь подходит, но метод не поддерживается, — **405 Method Not Allowed**, обычно с `Allow`. После совпадения инфраструктура выбирает callable, подготавливает аргументы, вызывает его и получает Response.

Symfony читает attributes маршрутов, а **argument resolver** подбирает значения аргументов контроллера, включая Request и параметры маршрута. Laravel сопоставляет маршрут и использует dispatcher для вызова обработчика и его зависимостей. **Route model binding** Laravel — отдельный механизм связывания параметра с моделью; в этом примере он не применяется. Symfony argument resolver не является его синонимом.

Инвариант контракта: метод определяет допустимую операцию, а статус описывает её HTTP-исход. Поэтому синтаксически корректный ID всё ещё может привести к 404 после поиска ресурса.

Генерация URL по имени маршрута связывает ссылки с декларацией пути, а не с дублируемой строкой. Она защищает от части ошибок при переименовании адресов, но не проверяет существование объекта и право доступа.

### 3.3. Минимальный пример, который действительно что-то доказывает

Добавьте контроллеры и замените Laravel routes. ID ограничим положительными числами до девяти цифр: это учебная форма адреса, а не универсальное ограничение PostgreSQL.

`symfony-app/src/Controller/EventController.php`:

```php
<?php
declare(strict_types=1);

namespace App\Controller;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;

final class EventController
{
    #[Route(
        '/events/{id}',
        name: 'events.show',
        requirements: ['id' => '[1-9][0-9]{0,8}'],
        methods: ['GET'],
    )]
    public function __invoke(
        int $id,
        UrlGeneratorInterface $urls,
    ): JsonResponse {
        if ($id !== 1) {
            return new JsonResponse(['error' => 'event_not_found'], 404);
        }

        return new JsonResponse([
            'id' => 1,
            'title' => 'Встреча PHP',
            'available_seats' => 10,
            'url' => $urls->generate('events.show', ['id' => 1]),
        ]);
    }
}
```

`laravel-app/app/Http/Controllers/EventController.php`:

```php
<?php
declare(strict_types=1);

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;

final class EventController
{
    public function __invoke(string $id): JsonResponse
    {
        if ((int) $id !== 1) {
            return response()->json(['error' => 'event_not_found'], 404);
        }

        return response()->json([
            'id' => 1,
            'title' => 'Встреча PHP',
            'available_seats' => 10,
            'url' => route('events.show', ['id' => 1], false),
        ]);
    }
}
```

`laravel-app/routes/api.php`:

```php
<?php
declare(strict_types=1);

use App\Http\Controllers\EventController;
use App\Http\Middleware\TraceRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/hello', function (Request $request): JsonResponse {
    TraceRequest::record($request, 'контроллер');

    return response()->json([
        'message' => 'Привет',
        'framework' => 'Laravel',
    ]);
})->name('hello');

Route::get('/events/{id}', EventController::class)
    ->where('id', '[1-9][0-9]{0,8}')
    ->name('events.show');
```

Сначала проверяем зарегистрированное описание, затем наблюдаем HTTP:

```bash
(cd symfony-app && php bin/console debug:router)
(cd laravel-app && php artisan route:list)

for port in 8001 8002; do
  curl -i -H 'Accept: application/json' \
    "http://127.0.0.1:$port/events/1"
  curl -i -H 'Accept: application/json' \
    "http://127.0.0.1:$port/missing"
  curl -i -X POST -H 'Accept: application/json' \
    "http://127.0.0.1:$port/events/1"
  curl -i -H 'Accept: application/json' \
    "http://127.0.0.1:$port/events/2"
done
```

Ожидаемые статусы: 200, 404, 405, 404. У первого ответа — `"id":1`, `"available_seats":10`, `"url":"/events/1"`; у последнего — `"error":"event_not_found"`. Тела инфраструктурных ошибок могут различаться в зависимости от debug-режима и renderer; здесь проверяем их статусы, не формат.

Маршрут пропускает `2`, но каталог его не содержит. Значит, последние 404 и первый маршрутный 404 возникли на разных границах, хотя клиентский HTTP-смысл одинаков.

**Вывод примера:** совпадение маршрута выбирает операцию, но не доказывает существование ресурса.

### 3.4. Ловушка №3: принимать совпавший маршрут за проверенные данные

Плохое ожидание — считать `{id}` уже проверенным объектом. Следствие: поиск возвращает отсутствие записи, код обращается к ней как к объекту либо выдаёт `{"error":"not found"}` со статусом 200.

Исправление состоит из отдельных решений: ограничить форму ID, выполнить поиск, сопоставить отсутствие со статусом 404. Наш временный каталог уже следует этому порядку; ошибочный вариант в код не переносим.

### 3.5. Соглашения и опытное суждение

| Элемент контракта | Выбор здесь |
|---|---|
| GET | Читает, не изменяет предметное состояние |
| Неизвестный ресурс | 404, даже при совпавшем маршруте |
| Недопустимый метод | 405, решает router |
| Контроллер | Адаптирует HTTP, не хранит предметные правила |

**Как думают опытные.** Я проверяю отрицательные ответы так же рано, как успешный. Но маршрут ограничивает только часть входа: JSON-тело требует собственной границы проверки.

---

## Часть 4. Входные данные, DTO, валидация и границы ошибок

### 4.1. Какую проблему мы сейчас решаем

Клиент прислал `"quantity":"два"`, лишнее поле `status` или оборванный JSON. Если передать всё дальше, ошибка проявится рядом с SQL либо присваиванием свойства, уже без ясного объяснения для клиента.

Зафиксируем узкий учебный контракт `POST /events/1/reservations`: единственное поле — целое `quantity` от 1 до 10. Пользователь, идемпотентность и настоящее сохранение появятся позже; сейчас заглушка application service имитирует создание, явно возвращая `persisted: false`.

### 4.2. Как это устроено внутри

Последовательность такова: байты транспорта → декодирование JSON → нормализация формы → проверка полей → типизированная команда. Здесь нормализация переводит JSON-объект в набор полей, но намеренно не превращает строку `"2"` в число.

**DTO**, Data Transfer Object, переносит данные между границами, не обязан сохраняться в БД. В Symfony явный входной DTO проверяет компонент **Validator**. В Laravel **Form Request**, специализированный объект запроса, проходит подготовку и валидацию до вызова контроллера; затем контроллер явно строит команду.

Инвариант этой границы: дальше поступают только разрешённые поля с проверенной формой. PHP-типы поддерживают его после проверки, но не заменяют сообщения об ошибках ввода. Laravel-правило `integer` в этой версии допускает числовые строки, поэтому для одинакового строгого контракта используем собственную проверку `is_int`.

**М4 — инвариант требует точки принятия решения.** Из корректного `quantity=2` не следует наличие двух свободных мест. Предсказание: решение о доступности должно находиться там, где учитывается актуальное предметное состояние, а не только JSON. Предел: модель указывает владельца решения, но сама не обеспечивает атомарность при конкуренции.

Отдельно различаем испорченный транспорт — 400, недопустимые поля — 422, успешное создание — 201. Неожиданный технический сбой не становится ошибкой клиента.

### 4.3. Минимальный пример, который действительно что-то доказывает

Установите Validator:

```bash
(cd symfony-app && composer require 'symfony/validator:7.4.*')
```

Добавляем входной DTO, команду, заглушку и контроллер. Команды существуют отдельно в обоих проектах; общей библиотеки нет.

`symfony-app/src/Data/ReservationInput.php`:

```php
<?php
declare(strict_types=1);

namespace App\Data;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class ReservationInput
{
    public function __construct(
        #[Assert\Sequentially([
            new Assert\NotNull(),
            new Assert\Type(type: 'integer'),
            new Assert\Range(min: 1, max: 10),
        ])]
        public mixed $quantity,
    ) {}
}
```

`symfony-app/src/Data/ReserveSeats.php`:

```php
<?php
declare(strict_types=1);

namespace App\Data;

final readonly class ReserveSeats
{
    public function __construct(
        public int $eventId,
        public int $quantity,
    ) {}
}
```

`symfony-app/src/Application/ReservationCreator.php`:

```php
<?php
declare(strict_types=1);

namespace App\Application;

use App\Data\ReserveSeats;

final class ReservationCreator
{
    public function create(ReserveSeats $command): array
    {
        return [
            'id' => bin2hex(random_bytes(8)),
            'event_id' => $command->eventId,
            'quantity' => $command->quantity,
            'status' => 'pending',
            'persisted' => false,
        ];
    }
}
```

`symfony-app/src/Controller/ReservationController.php`:

```php
<?php
declare(strict_types=1);

namespace App\Controller;

use App\Application\ReservationCreator;
use App\Data\ReservationInput;
use App\Data\ReserveSeats;
use JsonException;
use stdClass;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

final class ReservationController
{
    public function __construct(
        private readonly ReservationCreator $creator,
    ) {}

    #[Route(
        '/events/{id}/reservations',
        name: 'reservations.create',
        requirements: ['id' => '[1-9][0-9]{0,8}'],
        methods: ['POST'],
    )]
    public function __invoke(
        Request $request,
        int $id,
        ValidatorInterface $validator,
    ): JsonResponse {
        try {
            $decoded = json_decode(
                $request->getContent(),
                false,
                512,
                JSON_THROW_ON_ERROR,
            );
        } catch (JsonException) {
            return new JsonResponse(['error' => 'invalid_json'], 400);
        }

        if (!$decoded instanceof stdClass) {
            return new JsonResponse(['error' => 'expected_json_object'], 400);
        }

        $data = (array) $decoded;
        if (array_diff(array_keys($data), ['quantity']) !== []) {
            return new JsonResponse(['error' => 'unknown_fields'], 422);
        }

        $input = new ReservationInput($data['quantity'] ?? null);
        if (count($validator->validate($input)) > 0) {
            return new JsonResponse(['error' => 'invalid_quantity'], 422);
        }

        if ($id !== 1) {
            return new JsonResponse(['error' => 'event_not_found'], 404);
        }

        $command = new ReserveSeats($id, $input->quantity);

        return new JsonResponse($this->creator->create($command), 201);
    }
}
```

`laravel-app/app/Data/ReserveSeats.php`:

```php
<?php
declare(strict_types=1);

namespace App\Data;

final readonly class ReserveSeats
{
    public function __construct(
        public int $eventId,
        public int $quantity,
    ) {}
}
```

`laravel-app/app/Application/ReservationCreator.php`:

```php
<?php
declare(strict_types=1);

namespace App\Application;

use App\Data\ReserveSeats;

final class ReservationCreator
{
    public function create(ReserveSeats $command): array
    {
        return [
            'id' => bin2hex(random_bytes(8)),
            'event_id' => $command->eventId,
            'quantity' => $command->quantity,
            'status' => 'pending',
            'persisted' => false,
        ];
    }
}
```

`laravel-app/app/Http/Requests/StoreReservationRequest.php`:

```php
<?php
declare(strict_types=1);

namespace App\Http\Requests;

use Closure;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use JsonException;
use stdClass;

final class StoreReservationRequest extends FormRequest
{
    private array $payload = [];

    public function authorize(): bool
    {
        return true; // Аутентификация и права будут добавлены отдельно.
    }

    protected function prepareForValidation(): void
    {
        try {
            $decoded = json_decode(
                $this->getContent(),
                false,
                512,
                JSON_THROW_ON_ERROR,
            );
        } catch (JsonException) {
            throw new HttpResponseException(
                response()->json(['error' => 'invalid_json'], 400),
            );
        }

        if (!$decoded instanceof stdClass) {
            throw new HttpResponseException(
                response()->json(['error' => 'expected_json_object'], 400),
            );
        }

        $this->payload = (array) $decoded;

        if (array_diff(array_keys($this->payload), ['quantity']) !== []) {
            throw new HttpResponseException(
                response()->json(['error' => 'unknown_fields'], 422),
            );
        }
    }

    public function validationData(): array
    {
        return $this->payload;
    }

    public function rules(): array
    {
        return [
            'quantity' => [
                'bail',
                'required',
                function (string $attribute, mixed $value, Closure $fail): void {
                    if (!is_int($value) || $value < 1 || $value > 10) {
                        $fail('Количество должно быть целым от 1 до 10.');
                    }
                },
            ],
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            response()->json(['error' => 'invalid_quantity'], 422),
        );
    }
}
```

`laravel-app/app/Http/Controllers/ReservationController.php`:

```php
<?php
declare(strict_types=1);

namespace App\Http\Controllers;

use App\Application\ReservationCreator;
use App\Data\ReserveSeats;
use App\Http\Requests\StoreReservationRequest;
use Illuminate\Http\JsonResponse;

final class ReservationController
{
    public function __construct(
        private readonly ReservationCreator $creator,
    ) {}

    public function __invoke(
        StoreReservationRequest $request,
        string $id,
    ): JsonResponse {
        if ((int) $id !== 1) {
            return response()->json(['error' => 'event_not_found'], 404);
        }

        $command = new ReserveSeats(
            (int) $id,
            $request->validated('quantity'),
        );

        return response()->json($this->creator->create($command), 201);
    }
}
```

`laravel-app/routes/api.php`:

```php
<?php
declare(strict_types=1);

use App\Http\Controllers\EventController;
use App\Http\Controllers\ReservationController;
use App\Http\Middleware\TraceRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/hello', function (Request $request): JsonResponse {
    TraceRequest::record($request, 'контроллер');

    return response()->json([
        'message' => 'Привет',
        'framework' => 'Laravel',
    ]);
})->name('hello');

Route::get('/events/{id}', EventController::class)
    ->where('id', '[1-9][0-9]{0,8}')
    ->name('events.show');

Route::post('/events/{id}/reservations', ReservationController::class)
    ->where('id', '[1-9][0-9]{0,8}')
    ->name('reservations.create');
```

Три запроса к каждому приложению:

```bash
for port in 8001 8002; do
  curl -i "http://127.0.0.1:$port/events/1/reservations" \
    -H 'Content-Type: application/json' -H 'Accept: application/json' \
    --data-binary '{"quantity":'

  curl -i "http://127.0.0.1:$port/events/1/reservations" \
    -H 'Content-Type: application/json' -H 'Accept: application/json' \
    --data-binary '{"quantity":0}'

  curl -i "http://127.0.0.1:$port/events/1/reservations" \
    -H 'Content-Type: application/json' -H 'Accept: application/json' \
    --data-binary '{"quantity":2}'
done
```

Ожидаются 400 с `invalid_json`, 422 с `invalid_quantity`, 201 с `"quantity":2,"status":"pending","persisted":false`. Первый запрос останавливает декодер, второй — валидатор, третий достигает сервиса. PostgreSQL не изменяется: 201 здесь проверяет будущий контракт на заглушке, а не доказывает долговечное создание Reservation.

**Вывод примера:** типизированная команда появляется только после успешного прохождения отдельных проверяемых границ.

### 4.4. Ловушка №4: валидировать всё одним catch

Плохой вариант — передать `$request->all()` глубже и любое `Throwable` преобразовать в 422. Он предполагает, что всякий сбой вызван клиентом. Тогда ошибка программирования или недоступная БД выглядит как невалидное количество, а посторонние поля получают шанс повлиять на состояние.

В рабочем варианте выбираются явные поля, ловится конкретная ошибка JSON, а технические исключения остаются общему обработчику как 500. В production debug-вывод должен быть выключен.

### 4.5. Соглашения и опытное суждение

| Ошибка | Владелец решения | Статус |
|---|---|---|
| Повреждённый JSON / неверная верхняя форма | HTTP-декодер | 400 |
| Недопустимые поля или количество | Входной валидатор | 422 |
| Событие отсутствует | Поиск ресурса | 404 |
| Мест уже недостаточно | Будущий предметный сервис | Выбираем 409 |
| Непредвиденный технический сбой | Exception handler | 500 |

**Как думают опытные.** Я не называю прошедший валидацию ввод разрешённой операцией. Теперь нужно выяснить, кто создаёт сервис, какие зависимости ему доверить и где принять настоящее решение о бронировании.

---

## Часть 5. Контейнер строит объектный граф: DI, autowiring и facades

### 5.1. Какую проблему мы сейчас решаем

Если время получается через `new DateTimeImmutable()` глубоко внутри операции, повторить результат теста трудно. Но замена конструктора обращением к контейнеру только переносит скрытую зависимость.


Ниже действуют условия PHP 8.3, Symfony 7.4.x и Laravel 11.x; команды выполняются из корня соответствующего приложения.

**DI**, внедрение зависимостей, означает получение готовых зависимостей извне. **Autowiring**, автоматическое связывание по типам, помогает контейнеру рекурсивно построить **объектный граф**: сначала зависимости, затем потребителя. Для интерфейса может потребоваться явная привязка; для скалярного `int` одного типа недостаточно.

Symfony компилирует определения контейнера до обработки прикладного запроса, обычно при прогреве кеша. Это компиляция способа построения, а не вечное существование объектов. Laravel обычно разрешает классы во время работы через reflection — исследование конструктора; `bind()` задаёт правило, `instance()` передаёт уже созданный объект.

### 5.2. Как это устроено внутри

Общие листинги устанавливаются в обеих программах: в Symfony под `src/`, в Laravel под `app/`. Команда здесь имеет поля `eventId` и `quantity`; прежняя входная граница продолжает создавать её после проверки JSON.

`src/Data/ReserveSeats.php` / `app/Data/ReserveSeats.php`:

```php
<?php

namespace App\Data;

final readonly class ReserveSeats
{
    public function __construct(
        public int $eventId,
        public int $quantity,
    ) {}
}
```

`src/Clock/Clock.php` / `app/Clock/Clock.php`:

```php
<?php

namespace App\Clock;

interface Clock
{
    public function now(): \DateTimeImmutable;
}
```

`src/Clock/SystemClock.php` / `app/Clock/SystemClock.php`:

```php
<?php

namespace App\Clock;

final class SystemClock implements Clock
{
    public function now(): \DateTimeImmutable
    {
        return new \DateTimeImmutable('now', new \DateTimeZone('UTC'));
    }
}
```

`src/Clock/FixedClock.php` / `app/Clock/FixedClock.php`:

```php
<?php

namespace App\Clock;

final class FixedClock implements Clock
{
    public function now(): \DateTimeImmutable
    {
        return new \DateTimeImmutable('2030-01-02T03:04:05+00:00');
    }
}
```

`src/Application/ReservationCreator.php` / `app/Application/ReservationCreator.php`:

```php
<?php

namespace App\Application;

use App\Clock\Clock;
use App\Data\ReserveSeats;

final class ReservationCreator
{
    public function __construct(private readonly Clock $clock) {}

    public function create(ReserveSeats $command): array
    {
        return [
            'event_id' => $command->eventId,
            'quantity' => $command->quantity,
            'persisted' => false,
            'created_at' => $this->clock->now()->format(DATE_ATOM),
        ];
    }
}
```

Symfony, `config/services.yaml`; окончательный вариант примера использует фиксированные часы:

```yaml
services:
    _defaults:
        autowire: true
        autoconfigure: true

    App\:
        resource: '../src/'
        exclude:
            - '../src/Data/'
            - '../src/Entity/'
            - '../src/Kernel.php'

    App\Clock\Clock:
        alias: App\Clock\FixedClock
```

Laravel, `app/Providers/AppServiceProvider.php`:

```php
<?php

namespace App\Providers;

use App\Clock\Clock;
use App\Clock\FixedClock;
use App\Clock\SystemClock;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(Clock::class, FixedClock::class);
    }

    public function boot(): void {}
}
```

Для обычного времени замените выбранную реализацию на `SystemClock`, затем верните `FixedClock`. Код операции не меняется.

### 5.3. Минимальный пример, который действительно что-то доказывает

Symfony позволяет проверить определение:

```bash
php bin/console debug:container 'App\Application\ReservationCreator' --show-arguments
php bin/console debug:container 'App\Clock\Clock'
```

Если временно удалить привязку `Clock`, в Symfony останутся две реализации, а Laravel не сможет создать интерфейс. Диагностика ниже **схематическая**, не буквальный текст конкретного патча:

```text
Symfony: cannot autowire $clock: interface Clock has no unambiguous service
Laravel: Target [App\Clock\Clock] is not instantiable while building ReservationCreator
```

После опыта восстановите показанные файлы. Для Symfony на порту 8001 и Laravel на 8002:

```bash
curl -i -X POST http://127.0.0.1:8001/events/1/reservations \
  -H 'Content-Type: application/json' -d '{"quantity":2}'

curl -i -X POST http://127.0.0.1:8002/events/1/reservations \
  -H 'Content-Type: application/json' -d '{"quantity":2}'
```

Ожидается прежний успешный статус заглушки, здесь `201`, и JSON:

```json
{"event_id":1,"quantity":2,"persisted":false,"created_at":"2030-01-02T03:04:05+00:00"}
```

**Вывод «Зависимость видна»:** время определяется привязкой, а не скрытым действием внутри операции.

### 5.4. Ловушка №5: спрятать service locator внутри бизнес-операции

**Нерабочий архитектурный вариант:** вызов `app(Clock::class)`, `$this->app->make(...)` либо поиск сервиса в контейнере внутри `create()`. Предположение «зависимости нет в конструкторе — значит, её нет» ломается в тесте: операция требует настроенного контейнера. Исправление уже показано — внедрение на прикладной границе.

Laravel **facade** — фасад-прокси со статически выглядящим вызовом, за которым находится реальный объект контейнера. При обращении фасад разрешает корневой объект, обычно кешируя разрешённый экземпляр; это не обязательно новое получение объекта при каждом вызове. Поэтому фасады оценивают по видимости зависимостей и контексту, а не запрещают ритуально.

### 5.5. Соглашения и опытное суждение

| Выбор | Когда оправдан | Цена |
|---|---|---|
| Конструктор | Прикладная операция | Зависимости нужно перечислить |
| Facade / lookup | Инфраструктурная сборка, адаптер | Связь менее заметна вызывающему |

**Ментальная модель №1 развивается:** объектный граф связан с графом вызовов; контейнер — механизм, решивший вызвать конструктор. **Как думают опытные:** я сначала ищу место выбора зависимости, а уже потом удобный синтаксис её получения.

---

## Часть 6. Конфигурация, загрузка приложения и время жизни сервисов

### 6.1. Какую проблему мы сейчас решаем

Вы изменили переменную окружения, но приложение продолжает применять старый лимит. Или сервис внезапно помнит предыдущего пользователя. Обе ошибки возникают, когда разные времена считают одним.


**Ментальная модель №2 — три времени:** настройка графа, создание объекта, выполнение операции. В Symfony конфигурация расширений пакетов формирует контейнер, а обычные `%env(...)%` остаются разрешаемыми при работе placeholders — заполнителями значений. В Laravel файлы конфигурации загружаются при bootstrap; `register()` задаёт привязки, `boot()` выполняется после регистрации провайдеров.

`config:cache` сохраняет итоговый массив конфигурации Laravel, но не экземпляры сервисов, результаты запросов или состояние пользователя.

### 6.2. Как это устроено внутри

Замените общий `ReservationCreator` целиком:

```php
<?php

namespace App\Application;

use App\Clock\Clock;
use App\Data\ReserveSeats;

final class ReservationCreator
{
    public function __construct(
        private readonly Clock $clock,
        private readonly int $maxQuantity,
    ) {
        if ($maxQuantity < 1) {
            throw new \InvalidArgumentException('Invalid booking limit');
        }
    }

    public function create(ReserveSeats $command): array
    {
        if ($command->quantity > $this->maxQuantity) {
            throw new \DomainException('Booking limit exceeded');
        }

        return [
            'event_id' => $command->eventId,
            'quantity' => $command->quantity,
            'persisted' => false,
            'created_at' => $this->clock->now()->format(DATE_ATOM),
            'max_quantity' => $this->maxQuantity,
        ];
    }
}
```

`DomainException` — прикладной отказ, не готовый HTTP-ответ. Здесь проверяем допустимое количество; преобразование такого отказа в публичную ошибку потребовало бы отдельного обработчика на HTTP-границе.

Symfony, полный `config/services.yaml`:

```yaml
parameters:
    env(BOOKING_MAX_QUANTITY): '5'
    booking.max_quantity: '%env(int:BOOKING_MAX_QUANTITY)%'

services:
    _defaults:
        autowire: true
        autoconfigure: true

    App\:
        resource: '../src/'
        exclude:
            - '../src/Data/'
            - '../src/Entity/'
            - '../src/Kernel.php'

    App\Clock\Clock:
        alias: App\Clock\FixedClock

    App\Application\ReservationCreator:
        arguments:
            $maxQuantity: '%booking.max_quantity%'
```

Laravel, `config/booking.php`:

```php
<?php

return [
    'max_quantity' => (int) env('BOOKING_MAX_QUANTITY', 5),
];
```

Laravel, полный `app/Providers/AppServiceProvider.php`:

```php
<?php

namespace App\Providers;

use App\Application\ReservationCreator;
use App\Clock\Clock;
use App\Clock\FixedClock;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(Clock::class, FixedClock::class);

        $this->app->bind(
            ReservationCreator::class,
            fn ($app) => new ReservationCreator(
                $app->make(Clock::class),
                (int) $app['config']->get('booking.max_quantity'),
            ),
        );
    }

    public function boot(): void {}
}
```

### 6.3. Минимальный пример, который действительно что-то доказывает

Команды запуска сервера выполняйте в отдельном терминале; перед следующим запуском останавливайте предыдущий. Symfony:

```bash
BOOKING_MAX_QUANTITY=5 php bin/console cache:clear
BOOKING_MAX_QUANTITY=2 php -S 127.0.0.1:8001 -t public public/index.php
```

Обычный env-placeholder не заморожен значением `5` при `cache:clear`: новый запуск получает `2`. Это не обещание для любых compiler passes, которые могут явно разрешать окружение при сборке.

Laravel:

```bash
BOOKING_MAX_QUANTITY=5 php artisan config:cache
BOOKING_MAX_QUANTITY=2 php artisan config:show booking
BOOKING_MAX_QUANTITY=2 php artisan serve --host=127.0.0.1 --port=8001
```

`config:show` показывает `max_quantity` равным `5`. Затем остановите сервер:

```bash
php artisan config:clear
BOOKING_MAX_QUANTITY=2 php artisan config:show booking
BOOKING_MAX_QUANTITY=2 php artisan serve --host=127.0.0.1 --port=8001
```

Теперь значение — `2`. Проверка HTTP:

```bash
curl -sS -X POST http://127.0.0.1:8001/events/1/reservations \
  -H 'Content-Type: application/json' -d '{"quantity":1}'
curl -sS -X POST http://127.0.0.1:8002/events/1/reservations \
  -H 'Content-Type: application/json' -d '{"quantity":1}'
```

При статусе `201` оба ответа после очистки:

```json
{"event_id":1,"quantity":1,"persisted":false,"created_at":"2030-01-02T03:04:05+00:00","max_quantity":2}
```

До очистки Laravel возвращает тот же JSON с `"max_quantity":5`.

**Вывод «Кеширует не всё»:** кеш Laravel фиксирует результат вычисления конфигурации, Symfony в показанном варианте сохраняет способ получения env-значения.

### 6.4. Ловушка №6: смешивать конфигурацию и состояние пользователя

**Нерабочий вариант:** `env()` внутри операции и поле `$currentUser` в разделяемом сервисе. После `config:cache` Laravel 11 не загружает `.env`; отсутствующая в окружении процесса переменная даст `null` либо переданный default. Это условное поведение, а не правило «любой `env()` всегда пуст»: системные переменные остаются доступны.

Исправление: конфигурация читается в установленной точке, пользователь передаётся явно на вызов либо получается из корректной области запроса. Долгоживущий worker делает утечку особенно заметной.

### 6.5. Соглашения и опытное суждение

| Источник / область | Symfony | Laravel | Граница |
|---|---|---|---|
| Конфигурация | Параметры, env, конфигурация расширений | `config/*`, env при загрузке | Обновление требует понимания кеша |
| Новое разрешение | `shared: false` | `bind` | Потребитель всё равно может удержать объект |
| Разделяемый экземпляр | По умолчанию внутри контейнера | `singleton` | Живёт вместе с владельцем |
| Область операции | Явный контекст, сброс сервисов в workers | `scoped` | Сброс зависит от поддержанного lifecycle |

**Как думают опытные:** слово singleton ничего не говорит о времени жизни процесса. М2 предсказывает эффект кеша, но точные границы нужно проверять для конкретного окружения.

---

## Часть 7. Doctrine и Eloquent: что означает «объект сохранён»

### 7.1. Какую проблему мы сейчас решаем

Вы изменили число мест и увидели новое значение в PHP. Другой запрос всё ещё читает старое. Это не обязательно проблема кеша: возможно, записи вообще не было.


В Doctrine **metadata** описывают соответствие классов таблицам; **hydration**, гидратация, превращает результат SQL в объекты. **Identity map**, карта идентичности, хранит один управляемый экземпляр для идентификатора в пределах EntityManager. **Unit of Work**, единица работы, отслеживает управляемые объекты; `flush()` вычисляет изменения и отправляет SQL.

В Eloquent модель хранит массив атрибутов, **casts** — преобразования типов, исходный снимок значений и определяет изменённые, **dirty**, атрибуты. `save()` непосредственно выполняет нужный `INSERT` или `UPDATE`. Общей карты идентичности и Doctrine-подобной Unit of Work здесь нет: повторное чтение обычно создаёт новый экземпляр.

### 7.2. Как это устроено внутри

Нужны Docker и расширение PHP `pdo_pgsql`. Используйте только учебные базы:

```bash
docker run --name booking-pg \
  -e POSTGRES_PASSWORD=app -p 5432:5432 -d postgres:16

until docker exec booking-pg pg_isready -U postgres; do sleep 1; done
docker exec booking-pg psql -U postgres \
  -c 'CREATE DATABASE laravel_booking'
```

Symfony:

```bash
composer require doctrine/doctrine-bundle doctrine/doctrine-migrations-bundle
composer require doctrine/orm:^3 doctrine/dbal:^4
```

`config/bundles.php` для используемого минимального приложения:

```php
<?php

return [
    Symfony\Bundle\FrameworkBundle\FrameworkBundle::class => ['all' => true],
    Doctrine\Bundle\DoctrineBundle\DoctrineBundle::class => ['all' => true],
    Doctrine\Bundle\MigrationsBundle\DoctrineMigrationsBundle::class => ['all' => true],
];
```

Symfony, `.env`:

```dotenv
APP_ENV=dev
APP_DEBUG=1
APP_SECRET=local-training-secret
BOOKING_MAX_QUANTITY=5
DATABASE_URL="postgresql://postgres:app@127.0.0.1:5432/symfony_booking?serverVersion=16&charset=utf8"
```

Symfony, `config/packages/doctrine.yaml`:

```yaml
doctrine:
    dbal:
        url: '%env(resolve:DATABASE_URL)%'
        server_version: '16'
    orm:
        auto_generate_proxy_classes: true
        mappings:
            App:
                is_bundle: false
                type: attribute
                dir: '%kernel.project_dir%/src/Entity'
                prefix: 'App\Entity'
```

Symfony, `config/packages/doctrine_migrations.yaml`:

```yaml
doctrine_migrations:
    migrations_paths:
        DoctrineMigrations: '%kernel.project_dir%/migrations'
```

`src/Entity/Event.php`:

```php
<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'events')]
class Event
{
    #[ORM\Id]
    #[ORM\GeneratedValue(strategy: 'IDENTITY')]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 200)]
    private string $title;

    #[ORM\Column(name: 'available_seats')]
    private int $availableSeats;

    public function __construct(string $title, int $availableSeats)
    {
        $this->title = $title;
        $this->availableSeats = $availableSeats;
    }

    public function getId(): ?int { return $this->id; }
    public function getTitle(): string { return $this->title; }
    public function getAvailableSeats(): int { return $this->availableSeats; }
    public function setAvailableSeats(int $value): void
    {
        $this->availableSeats = $value;
    }
}
```

`migrations/Version20300101000100.php`:

```php
<?php

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20300101000100 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create events';
    }

    public function up(Schema $schema): void
    {
        $this->addSql(
            'CREATE TABLE events (
                id INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                title VARCHAR(200) NOT NULL,
                available_seats INT NOT NULL
            )'
        );
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE events');
    }
}
```

Laravel, `.env`; ключ создаётся следующей командой, секреты учебные:

```dotenv
APP_NAME=Booking
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://127.0.0.1:8002
LOG_CHANNEL=stderr
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=laravel_booking
DB_USERNAME=postgres
DB_PASSWORD=app
SESSION_DRIVER=file
CACHE_STORE=file
QUEUE_CONNECTION=sync
BOOKING_MAX_QUANTITY=5
```

Laravel, `config/database.php`:

```php
<?php

return [
    'default' => env('DB_CONNECTION', 'pgsql'),
    'connections' => [
        'pgsql' => [
            'driver' => 'pgsql',
            'host' => env('DB_HOST', '127.0.0.1'),
            'port' => env('DB_PORT', '5432'),
            'database' => env('DB_DATABASE', 'laravel_booking'),
            'username' => env('DB_USERNAME', 'postgres'),
            'password' => env('DB_PASSWORD', ''),
            'charset' => 'utf8',
            'prefix' => '',
            'prefix_indexes' => true,
            'search_path' => 'public',
            'sslmode' => 'prefer',
        ],
    ],
    'migrations' => [
        'table' => 'migrations',
        'update_date_on_publish' => true,
    ],
];
```

`app/Models/Event.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    protected $table = 'events';
    public $timestamps = false;
    protected $fillable = ['title', 'available_seats'];

    protected function casts(): array
    {
        return ['available_seats' => 'integer'];
    }
}
```

`database/migrations/2030_01_01_000100_create_events_table.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('events', function (Blueprint $table): void {
            $table->increments('id');
            $table->string('title', 200);
            $table->integer('available_seats');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
```

Symfony:

```bash
php bin/console doctrine:database:create
php bin/console doctrine:migrations:migrate --no-interaction
```

Laravel:

```bash
php artisan config:clear
php artisan key:generate
php artisan migrate
```

### 7.3. Минимальный пример, который действительно что-то доказывает

Symfony, `src/Command/OrmProbeCommand.php`:

```php
<?php

namespace App\Command;

use App\Entity\Event;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(name: 'app:orm-probe')]
final class OrmProbeCommand extends Command
{
    public function __construct(private EntityManagerInterface $em)
    {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $event = new Event('Probe', 10);
        $this->em->persist($event);
        $this->em->flush();

        $id = $event->getId();
        $event->setAvailableSeats(9);
        $again = $this->em->find(Event::class, $id);
        $db = $this->em->getConnection();
        $before = $db->fetchOne(
            'SELECT available_seats FROM events WHERE id = ?', [$id]
        );

        $this->em->flush();
        $after = $db->fetchOne(
            'SELECT available_seats FROM events WHERE id = ?', [$id]
        );

        $output->writeln(sprintf(
            'same=%s memory=%d before=%d after=%d',
            $event === $again ? 'yes' : 'no',
            $event->getAvailableSeats(), $before, $after,
        ));

        return Command::SUCCESS;
    }
}
```

Laravel, автоматически обнаруживаемый `app/Console/Commands/OrmProbe.php`:

```php
<?php

namespace App\Console\Commands;

use App\Models\Event;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class OrmProbe extends Command
{
    protected $signature = 'app:orm-probe';
    protected $description = 'Compare model memory and database state';

    public function handle(): int
    {
        $event = Event::create(['title' => 'Probe', 'available_seats' => 10]);
        $event->available_seats = 9;
        $again = Event::findOrFail($event->id);
        $before = DB::table('events')
            ->where('id', $event->id)->value('available_seats');

        $event->save();
        $after = DB::table('events')
            ->where('id', $event->id)->value('available_seats');

        $this->line(sprintf(
            'same=%s memory=%d reread=%d before=%d after=%d',
            $event === $again ? 'yes' : 'no',
            $event->available_seats, $again->available_seats, $before, $after,
        ));

        return self::SUCCESS;
    }
}
```

```bash
# Symfony
php bin/console app:orm-probe
# Laravel
php artisan app:orm-probe
```

Ожидается:

```text
Symfony: same=yes memory=9 before=10 after=9
Laravel: same=no memory=9 reread=10 before=10 after=9
```

Обе базы получают новую строку `Probe` с итоговыми девятью местами. Значимый SQL — сначала `INSERT`, позднее `UPDATE`; точные имена параметров различаются. В этом опыте нет внешней транзакции: Doctrine завершает транзакцию `flush`, Eloquent использует PostgreSQL autocommit для отдельных записей.

**Вывод «Объект не строка»:** повторный `find` Doctrine подтверждает идентичность объекта, но не перечитывает значение из БД.

### 7.4. Ловушка №7: считать изменение объекта изменением базы

**Нерабочий вариант:** остановиться после setter или заменить Eloquent `save()` на Doctrine `persist()` и ожидать записи. `persist()` ставит новую сущность под управление; `flush()` синхронизирует изменения. Для уже управляемой сущности повторный `persist()` не нужен.

**Ментальная модель №3 — память объектов и БД: две связанные, но разные реальности.** Она предсказывает наблюдавшееся расхождение, но не описывает изоляцию транзакций и не делает ORM одинаковыми. При внешней транзакции успешный SQL ещё не означает окончательного commit.

### 7.5. Соглашения и опытное суждение

| Операция | Doctrine | Eloquent | Граница сравнения |
|---|---|---|---|
| `persist` | Регистрация новой сущности | Прямого аналога нет | Не запись сама по себе |
| `flush` | Синхронизация Unit of Work | Общего аналога нет | Может затронуть несколько объектов |
| `save` | Не метод сущности по умолчанию | Запись модели | Не общий flush |
| `refresh` | Перечитывание управляемой сущности | Перечитывание текущей модели | Незаписанные изменения могут потеряться |

**Как думают опытные:** я спрашиваю, кто отслеживает объект, где возникает SQL и кто подтверждает транзакцию. HTTP-заглушка пока честно сохраняет `persisted: false`: учебные записи создаёт только CLI.

---

## Часть 8. Чтение данных: связи, N+1, пагинация и форма SQL

### 8.1. Какую проблему мы сейчас решаем

Список из двадцати бронирований работает, но увеличение страницы резко замедляет ответ. Запрос списка выглядит невинно: дополнительные запросы спрятаны в чтении названия события.


**Lazy loading**, отложенная загрузка, получает связь при обращении. **Eager loading**, предварительная загрузка, меняет форму исполнения: Doctrine может использовать fetch JOIN, выбирающий связанную сущность вместе с основной; Eloquent `with()` обычно выполняет отдельный пакетный запрос. Одинаковая задача поэтому не обещает одинакового числа SQL.

### 8.2. Как это устроено внутри

Symfony, `migrations/Version20300101000200.php`:

```php
<?php

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20300101000200 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create reservations';
    }

    public function up(Schema $schema): void
    {
        $this->addSql(
            'CREATE TABLE reservations (
                id INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                event_id INT NOT NULL REFERENCES events(id),
                quantity INT NOT NULL
            )'
        );
        $this->addSql('CREATE INDEX reservations_event_idx ON reservations(event_id)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE reservations');
    }
}
```

`src/Entity/Reservation.php`:

```php
<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'reservations')]
class Reservation
{
    #[ORM\Id]
    #[ORM\GeneratedValue(strategy: 'IDENTITY')]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Event::class, fetch: 'LAZY')]
    #[ORM\JoinColumn(name: 'event_id', nullable: false)]
    private Event $event;

    #[ORM\Column]
    private int $quantity;

    public function getId(): ?int { return $this->id; }
    public function getEvent(): Event { return $this->event; }
}
```

Счётчик DBAL 4, `src/Diagnostics/SqlCounter.php`:

```php
<?php

namespace App\Diagnostics;

use Psr\Log\AbstractLogger;

final class SqlCounter extends AbstractLogger
{
    public array $sql = [];

    public function log($level, string|\Stringable $message, array $context = []): void
    {
        if (isset($context['sql'])) {
            $this->sql[] = (string) $context['sql'];
        }
    }

    public function reset(): void
    {
        $this->sql = [];
    }
}
```

Полный Symfony `config/services.yaml`:

```yaml
parameters:
    env(BOOKING_MAX_QUANTITY): '5'
    booking.max_quantity: '%env(int:BOOKING_MAX_QUANTITY)%'

services:
    _defaults:
        autowire: true
        autoconfigure: true

    App\:
        resource: '../src/'
        exclude:
            - '../src/Data/'
            - '../src/Entity/'
            - '../src/Kernel.php'

    App\Clock\Clock:
        alias: App\Clock\FixedClock

    App\Application\ReservationCreator:
        arguments:
            $maxQuantity: '%booking.max_quantity%'

    booking.sql_logging:
        class: Doctrine\DBAL\Logging\Middleware
        arguments:
            - '@App\Diagnostics\SqlCounter'
        tags:
            - { name: doctrine.middleware }
```

Laravel, `database/migrations/2030_01_01_000200_create_reservations_table.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('reservations', function (Blueprint $table): void {
            $table->increments('id');
            $table->integer('event_id');
            $table->integer('quantity');
            $table->foreign('event_id')->references('id')->on('events');
            $table->index('event_id', 'reservations_event_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reservations');
    }
};
```

`app/Models/Reservation.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Reservation extends Model
{
    public $timestamps = false;

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }
}
```

### 8.3. Минимальный пример, который действительно что-то доказывает

Следующие команды **удаляют данные обеих учебных таблиц** в своей базе. Они создают по пять бронирований на событие и измеряют холодное чтение без дополнительных listeners, observers и глобальных scopes.

Symfony, `src/Command/ReadProbeCommand.php`:

```php
<?php

namespace App\Command;

use App\Diagnostics\SqlCounter;
use App\Entity\Reservation;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(name: 'app:read-probe')]
final class ReadProbeCommand extends Command
{
    public function __construct(
        private EntityManagerInterface $em,
        private SqlCounter $counter,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addArgument('n', InputArgument::OPTIONAL, 'Rows: 1..200', '20');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $n = (int) $input->getArgument('n');
        if ($n < 1 || $n > 200) {
            throw new \InvalidArgumentException('n must be between 1 and 200');
        }
        $events = (int) ceil($n / 5);
        $db = $this->em->getConnection();
        $this->em->clear();
        $db->executeStatement('TRUNCATE reservations, events RESTART IDENTITY');
        $db->executeStatement(
            "INSERT INTO events(title, available_seats)
             SELECT 'Event ' || g, 100 FROM generate_series(1, $events) AS g"
        );
        $db->executeStatement(
            "INSERT INTO reservations(event_id, quantity)
             SELECT ((g - 1) / 5) + 1, 1 FROM generate_series(1, $n) AS g"
        );
        $db->executeStatement('ANALYZE events');
        $db->executeStatement('ANALYZE reservations');

        $read = function (bool $eager) use ($n): array {
            $this->em->clear();
            $this->counter->reset();
            $dql = $eager
                ? 'SELECT r, e FROM App\Entity\Reservation r JOIN r.event e ORDER BY r.id'
                : 'SELECT r FROM App\Entity\Reservation r ORDER BY r.id';
            $items = $this->em->createQuery($dql)->setMaxResults($n)->getResult();
            $rows = array_map(
                fn (Reservation $r) => [$r->getId(), $r->getEvent()->getTitle()],
                $items,
            );

            return [$rows, $this->counter->sql];
        };

        [$lazyRows, $lazySql] = $read(false);
        [$rows, $sql] = $read(true);
        if ($lazyRows !== $rows) {
            throw new \RuntimeException('Different read results');
        }

        $output->writeln(sprintf(
            'before=%d after=%d rows=%d first=%s',
            count($lazySql), count($sql), count($rows), $rows[0][1],
        ));
        $output->writeln('SQL: '.$sql[0]);
        $plan = $db->executeQuery(
            'EXPLAIN (ANALYZE, BUFFERS) '.$sql[0]
        )->fetchFirstColumn();
        $output->writeln($plan);

        return Command::SUCCESS;
    }
}
```

Laravel, `app/Console/Commands/ReadProbe.php`:

```php
<?php

namespace App\Console\Commands;

use App\Models\Reservation;
use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class ReadProbe extends Command
{
    protected $signature = 'app:read-probe {n=20}';
    protected $description = 'Measure lazy and eager reservation reads';

    public function handle(): int
    {
        $n = (int) $this->argument('n');
        if ($n < 1 || $n > 200) {
            throw new \InvalidArgumentException('n must be between 1 and 200');
        }
        $events = (int) ceil($n / 5);
        DB::statement('TRUNCATE reservations, events RESTART IDENTITY');
        DB::statement(
            "INSERT INTO events(title, available_seats)
             SELECT 'Event ' || g, 100 FROM generate_series(1, $events) AS g"
        );
        DB::statement(
            "INSERT INTO reservations(event_id, quantity)
             SELECT ((g - 1) / 5) + 1, 1 FROM generate_series(1, $n) AS g"
        );
        DB::statement('ANALYZE events');
        DB::statement('ANALYZE reservations');

        $previous = Model::preventsLazyLoading();
        Model::preventLazyLoading(false);
        DB::enableQueryLog();

        try {
            $read = function (bool $eager) use ($n): array {
                DB::flushQueryLog();
                $query = Reservation::query()->orderBy('id')->limit($n);
                if ($eager) {
                    $query->with('event');
                }
                $rows = $query->get()->map(
                    fn (Reservation $r) => [$r->id, $r->event->title],
                )->all();

                return [$rows, DB::getQueryLog()];
            };

            [$lazyRows, $lazySql] = $read(false);
            [$rows, $sql] = $read(true);
            if ($lazyRows !== $rows) {
                throw new \RuntimeException('Different read results');
            }
        } finally {
            DB::disableQueryLog();
            DB::flushQueryLog();
            Model::preventLazyLoading($previous);
        }

        $this->line(sprintf(
            'before=%d after=%d rows=%d first=%s',
            count($lazySql), count($sql), count($rows), $rows[0][1],
        ));
        $this->line('SQL: '.$sql[0]['query']);
        $plan = DB::select(
            'EXPLAIN (ANALYZE, BUFFERS) '.$sql[0]['query'],
            $sql[0]['bindings'],
        );
        foreach ($plan as $line) {
            $this->line($line->{'QUERY PLAN'});
        }

        return self::SUCCESS;
    }
}
```

```bash
# Symfony
php bin/console doctrine:migrations:migrate --no-interaction
php bin/console app:read-probe 20
php bin/console app:read-probe 200

# Laravel
php artisan migrate
php artisan app:read-probe 20
php artisan app:read-probe 200
```

Ожидаемые результаты **этого эксперимента**, не универсальные нормативы:

```text
Symfony, 20:  before=5 after=1 rows=20 first=Event 1
Symfony, 200: before=41 after=1 rows=200 first=Event 1
Laravel, 20:  before=21 after=2 rows=20 first=Event 1
Laravel, 200: before=201 after=2 rows=200 first=Event 1
```

Doctrine догружает четыре либо сорок разных событий: identity map исключает повторное чтение уже управляемого события. Eloquent без eager loading загружает связь отдельно для каждой модели бронирования. Исправленные варианты сохраняют одинаковый результат и постоянное число запросов.

Команды также печатают реальный SQL и `EXPLAIN` основного запроса. У Doctrine это JOIN; у Eloquent — список бронирований, после которого отдельно выполняется `WHERE id IN (...)` для событий. Поэтому планы сравнивают форму главного чтения, **не полную стоимость обеих операций**. PostgreSQL может выбрать последовательное сканирование маленьких таблиц; конкретные узлы, времена и buffers заранее не гарантированы. После последнего запуска каждая база содержит 40 событий и 200 бронирований.

**Вывод «Форма чтения измерима»:** устранение N+1 подтверждается SQL всей материализации результата, а не одним красивым запросом.

### 8.4. Ловушка №8: лечить N+1 тотальной eager loading

**Нерабочий вариант:** загрузить весь граф «на всякий случай». JOIN связи to-many размножает строки: десять бронирований и три метки могут дать тридцать строк до сборки объектов. Лимит таких строк — не лимит агрегатов.

Здесь связь to-one не размножает бронирования, поэтому `ORDER BY id` и `LIMIT` ограничивают именно их. Для to-many сначала выбирайте страницу идентификаторов корневых объектов, затем связи; используйте Doctrine Paginator с корректной настройкой либо пагинацию основного Eloquent-запроса с `with()`. Обычный `paginate()` добавит запрос подсчёта; keyset-переход по `id` может обходиться без него.

**Проекция**, выбор только нужных столбцов, — отдельный рычаг. Для списка достаточно:

```sql
SELECT r.id, e.title
FROM reservations r
JOIN events e ON e.id = r.event_id
ORDER BY r.id
LIMIT 20;
```

Это ограниченная модель чтения, а не приглашение создавать неполные управляемые сущности Doctrine. В Eloquent при сужении полей сохраняйте ключи, необходимые для сопоставления связей.

### 8.5. Соглашения и опытное суждение

| Приём | Что выигрываете | Цена |
|---|---|---|
| Lazy | Не загружаете неиспользуемую связь | SQL при доступе |
| Eager | Заранее ограничиваете догрузку | Дополнительная память |
| JOIN | Объединяете чтение | Размножение строк на to-many |
| Проекция | Меньше столбцов и объектов | Отдельная форма результата |

Практическая пара **М3 + М5** соединяет различие памяти и БД с наблюдением: **М5 — счётчик SQL как граница доказательства**. Он доказывает количество зарегистрированных запросов внутри выбранного интервала, но не отсутствие сетевых задержек или лишних объектов.

**Как думают опытные:** я считаю не только запросы, но и объём материализованных данных. Постоянные два запроса, возвращающие миллион строк, не становятся хорошими только благодаря числу два.

---

## Часть 9. Запись данных: транзакция, Unit of Work и внешний эффект

### 9.1. Какую проблему мы сейчас решаем

До сих пор успешный ответ доказывал только прохождение входной границы. Теперь он должен означать изменение PostgreSQL: место списано, бронирование записано. Если между этими действиями падает процесс, половина результата недопустима.

**Транзакция принадлежит соединению**, а не контроллеру, сущности или всему приложению. `BEGIN` открывает границу; `COMMIT` делает изменения окончательными; `ROLLBACK` отменяет незакоммиченные изменения этого соединения. Второе соединение автоматически в эту границу не попадает.

Наш **инвариант**: списание мест и появление соответствующего бронирования происходят вместе. Это важно потому, что клиент повторяет не отдельный SQL, а прикладную операцию. Следовательно, границу задаёт операция бронирования, а не каждый вызов репозитория отдельно. Здесь соединяются **М3 — представления и состояние** и **М4 — инвариант и владелец решения**.

### 9.2. Как это устроено внутри

Doctrine сначала регистрирует новую сущность в **Unit of Work**, то есть наборе отслеживаемых изменений. `persist()` ещё не означает `INSERT`; его выполнит `flush()`. Мы вызываем `flush()` внутри внешней транзакции того же соединения, где списали места.

Eloquent обычно отправляет `INSERT` или `UPDATE` непосредственно при `save()`. Отложенного общего `flush()` здесь нет. Поэтому несколько `save()` объединяет явно вызванный `DB::transaction()`.

В обоих случаях исключение должно выйти из транзакционного callback: тогда происходит откат. Перехватить ошибку внутри и вернуть «успех» — значит разрешить commit.

**Откат SQL не перематывает PHP-объекты.** В приведённом адаптере Doctrine после ошибки мы закрываем отдельный, предназначенный для этой операции `EntityManager`: его сущности становятся **detached**, отсоединёнными. Значения их полей не возвращаются к прежним автоматически. После успешного завершения этот короткоживущий менеджер тоже закрывается. Существующий менеджер приложения и прежние read probes мы не перенастраиваем.

### 9.3. Минимальный пример, который действительно что-то доказывает

Все команды далее выполняются из корня соответствующего приложения. Одинаковые файлы создайте в обоих проектах. Это изолированный учебный модуль; прежний обработчик POST замените новым, не оставляя два обработчика одного адреса. Существующие `/hello`, GET `/events/{id}` и трассировка остаются.

Добавим также `created_at` и `max_quantity` в запись: первая колонка хранит время создания, вторая позволяет впоследствии воспроизвести **тот же результат**, даже если конфигурационный предел изменится. Внешняя форма ответа остаётся прежней:

`{event_id, quantity, persisted, created_at, max_quantity}`.

Старые 200 бронирований получают технические значения при backfill. Старые усекáющие ORM probes после этого шага не запускайте без адаптации к новой обязательной схеме.

`database/steps/09.sql`:

```sql
CREATE TABLE users (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY
);
INSERT INTO users (id) VALUES (1);
SELECT setval(pg_get_serial_sequence('users', 'id'), 1, true);

ALTER TABLE reservations
    ADD COLUMN user_id BIGINT,
    ADD COLUMN status TEXT,
    ADD COLUMN idempotency_key TEXT,
    ADD COLUMN created_at TIMESTAMPTZ,
    ADD COLUMN max_quantity INTEGER;

UPDATE reservations
SET user_id = 1,
    status = 'confirmed',
    idempotency_key = 'legacy-' || id,
    created_at = TIMESTAMPTZ '2025-01-01 00:00:00+00',
    max_quantity = 5;

ALTER TABLE reservations
    ALTER COLUMN user_id SET NOT NULL,
    ALTER COLUMN status SET NOT NULL,
    ALTER COLUMN idempotency_key SET NOT NULL,
    ALTER COLUMN created_at SET NOT NULL,
    ALTER COLUMN max_quantity SET NOT NULL,
    ADD CONSTRAINT reservations_user_fk
        FOREIGN KEY (user_id) REFERENCES users(id);
```

Чтобы не дублировать тела SQL, новые миграции обоих проектов будут читать **свои локальные, неизменяемые после применения** SQL-файлы. Генератор создаёт полноценную миграцию соответствующего фреймворка.

`bin/new-step.sh`:

```sh
#!/bin/sh
set -eu
version="$1"
step="$2"
test -f "database/steps/$step.sql"

if test -f artisan; then
    target="database/migrations/${version}_booking_${step}.php"
    test ! -e "$target"
    cat > "$target" <<PHP
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        DB::unprepared(file_get_contents(database_path('steps/$step.sql')));
    }

    public function down(): void
    {
        throw new RuntimeException('Use a reviewed forward migration.');
    }
};
PHP
else
    mkdir -p migrations
    target="migrations/Version${version}.php"
    test ! -e "$target"
    cat > "$target" <<PHP
<?php

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version${version} extends AbstractMigration
{
    public function up(Schema \$schema): void
    {
        \$this->addSql(file_get_contents(
            dirname(__DIR__) . '/database/steps/$step.sql'
        ));
    }

    public function down(Schema \$schema): void
    {
        throw new \RuntimeException('Use a reviewed forward migration.');
    }
}
PHP
fi
```

```bash
sh bin/new-step.sh 20260901000900 09

# Symfony:
php bin/console doctrine:migrations:migrate --no-interaction

# Laravel:
php artisan migrate --force
```

Общие прикладные классы, `booking/Domain.php`:

```php
<?php

namespace Study\Booking;

interface Clock
{
    public function now(): \DateTimeImmutable;
}

final class FixedClock implements Clock
{
    public function now(): \DateTimeImmutable
    {
        return new \DateTimeImmutable('2025-01-01T00:00:00+00:00');
    }
}

final readonly class ReserveSeats
{
    public function __construct(
        public int $userId,
        public int $eventId,
        public int $quantity,
        public string $key,
    ) {}

    public static function http(int $eventId, array $input, string $key): self
    {
        $quantity = $input['quantity'] ?? null;
        if ($eventId < 1 || !is_int($quantity) || $quantity < 1
            || preg_match('/\A[A-Za-z0-9_-]{1,80}\z/', $key) !== 1) {
            throw new \InvalidArgumentException('Invalid booking input');
        }

        // Только учебная идентичность. Это не аутентификация.
        return new self(1, $eventId, $quantity, $key);
    }
}

final class Conflict extends \RuntimeException {}
final class UniqueCollision extends \RuntimeException {}

interface Store
{
    public function transaction(callable $operation): array;
    public function rows(string $sql, array $parameters = []): array;
    public function execute(string $sql, array $parameters = []): int;
    public function insert(array $record): void;
}

final class ReservationCreator
{
    public function __construct(
        private Store $store,
        private Clock $clock,
        private int $maxQuantity,
    ) {}

    public function reserve(
        ReserveSeats $command,
        bool $failAfterDebit = false,
        ?callable $beforeDecision = null,
    ): array {
        if ($command->quantity < 1) {
            throw new \InvalidArgumentException('Quantity must be positive');
        }

        try {
            $record = $this->store->transaction(function () use (
                $command, $failAfterDebit, $beforeDecision
            ): array {
                // Только диагностический hook для двух CLI-процессов.
                $beforeDecision?->__invoke();

                // Назначение блокировки подробно разбирается в части 10.
                $events = $this->store->rows(
                    'SELECT available_seats FROM events WHERE id = ? FOR UPDATE',
                    [$command->eventId]
                );

                $previous = $this->previous($command);
                if ($previous !== null) {
                    return $this->checkReplay($previous, $command);
                }

                if ($command->quantity > $this->maxQuantity) {
                    throw new \DomainException('Maximum quantity exceeded');
                }
                if ($events === []) {
                    throw new Conflict('Event does not exist');
                }
                if ((int) $events[0]['available_seats'] < $command->quantity) {
                    throw new Conflict('Not enough seats');
                }

                $this->store->execute(
                    'UPDATE events SET available_seats = available_seats - ? WHERE id = ?',
                    [$command->quantity, $command->eventId]
                );

                if ($failAfterDebit) {
                    throw new \RuntimeException('Artificial failure after debit');
                }

                $record = [
                    'user_id' => $command->userId,
                    'event_id' => $command->eventId,
                    'quantity' => $command->quantity,
                    'status' => 'confirmed',
                    'idempotency_key' => $command->key,
                    'created_at' => $this->clock->now()->format(DATE_ATOM),
                    'max_quantity' => $this->maxQuantity,
                ];
                $this->store->insert($record);

                return $record;
            });
        } catch (UniqueCollision $exception) {
            // Транзакция уже откачена. Читаем результат победителя.
            $previous = $this->previous($command);
            if ($previous === null) {
                throw $exception;
            }
            $record = $this->checkReplay($previous, $command);
        }

        return [
            'event_id' => (int) $record['event_id'],
            'quantity' => (int) $record['quantity'],
            'persisted' => true,
            'created_at' => (new \DateTimeImmutable(
                $record['created_at']
            ))->format(DATE_ATOM),
            'max_quantity' => (int) $record['max_quantity'],
        ];
    }

    private function previous(ReserveSeats $command): ?array
    {
        return $this->store->rows(
            'SELECT * FROM reservations WHERE user_id = ? AND idempotency_key = ?',
            [$command->userId, $command->key]
        )[0] ?? null;
    }

    private function checkReplay(array $record, ReserveSeats $command): array
    {
        if ((int) $record['event_id'] !== $command->eventId
            || (int) $record['quantity'] !== $command->quantity) {
            throw new Conflict('Idempotency key has different content');
        }

        return $record;
    }
}
```

Полная реализация уже содержит будущую блокировку и обработку повторов; гарантию уникальности включим миграцией в части 10. Это позволяет не держать промежуточный небезопасный HTTP-сервис.

**Symfony / Doctrine.** `booking/orm/StoredReservation.php`:

```php
<?php

namespace Study\Booking\Orm;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'reservations')]
final class StoredReservation
{
    #[ORM\Id, ORM\GeneratedValue, ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\Column(name: 'user_id', type: 'bigint')]
    public int $userId;

    #[ORM\Column(name: 'event_id', type: 'integer')]
    public int $eventId;

    #[ORM\Column(type: 'integer')]
    public int $quantity;

    #[ORM\Column(type: 'text')]
    public string $status;

    #[ORM\Column(name: 'idempotency_key', type: 'text')]
    public string $key;

    #[ORM\Column(name: 'created_at', type: 'datetimetz_immutable')]
    public \DateTimeImmutable $createdAt;

    #[ORM\Column(name: 'max_quantity', type: 'integer')]
    public int $maxQuantity;

    public function __construct(array $record)
    {
        $this->userId = $record['user_id'];
        $this->eventId = $record['event_id'];
        $this->quantity = $record['quantity'];
        $this->status = $record['status'];
        $this->key = $record['idempotency_key'];
        $this->createdAt = new \DateTimeImmutable($record['created_at']);
        $this->maxQuantity = $record['max_quantity'];
    }
}
```

`booking/SqlStore.php` в Symfony:

```php
<?php

namespace Study\Booking;

use Doctrine\DBAL\Connection;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use Doctrine\ORM\EntityManager;
use Doctrine\ORM\ORMSetup;
use Study\Booking\Orm\StoredReservation;

final class SqlStore implements Store
{
    private ?EntityManager $manager = null;

    public function __construct(private Connection $connection) {}

    public function transaction(callable $operation): array
    {
        $manager = new EntityManager(
            $this->connection,
            ORMSetup::createAttributeMetadataConfiguration(
                [__DIR__ . '/orm'], true
            )
        );
        $this->manager = $manager;
        $this->connection->beginTransaction();

        try {
            $this->connection->executeStatement(
                'SET TRANSACTION ISOLATION LEVEL READ COMMITTED'
            );
            $result = $operation();
            $manager->flush();
            $this->connection->commit();

            return $result;
        } catch (\Throwable $exception) {
            if ($this->connection->isTransactionActive()) {
                $this->connection->rollBack();
            }
            if ($exception instanceof UniqueConstraintViolationException) {
                throw new UniqueCollision('Unique collision', 0, $exception);
            }
            throw $exception;
        } finally {
            $manager->close();
            $this->manager = null;
        }
    }

    public function rows(string $sql, array $parameters = []): array
    {
        return $this->connection->fetchAllAssociative($sql, $parameters);
    }

    public function execute(string $sql, array $parameters = []): int
    {
        return (int) $this->connection->executeStatement($sql, $parameters);
    }

    public function insert(array $record): void
    {
        if ($this->manager === null) {
            throw new \LogicException('Insert requires the operation transaction');
        }
        $this->manager->persist(new StoredReservation($record));
    }
}
```

**Laravel / Eloquent.** Вместо двух Doctrine-файлов — `booking/SqlStore.php`:

```php
<?php

namespace Study\Booking;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;

final class StoredReservation extends Model
{
    protected $table = 'reservations';
    protected $guarded = [];
    public $timestamps = false;
}

final class SqlStore implements Store
{
    public function transaction(callable $operation): array
    {
        try {
            return DB::transaction(function () use ($operation): array {
                DB::statement('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
                return $operation();
            });
        } catch (QueryException $exception) {
            if (($exception->errorInfo[0] ?? null) === '23505') {
                throw new UniqueCollision('Unique collision', 0, $exception);
            }
            throw $exception;
        }
    }

    public function rows(string $sql, array $parameters = []): array
    {
        return array_map(
            static fn (object $row): array => (array) $row,
            DB::select($sql, $parameters)
        );
    }

    public function execute(string $sql, array $parameters = []): int
    {
        return DB::affectingStatement($sql, $parameters);
    }

    public function insert(array $record): void
    {
        $reservation = new StoredReservation($record);
        $reservation->save();
    }
}
```

Оба адаптера используют существующее подключение своего приложения. Транзакционные методы предназначены для верхней прикладной границы, не для вложенного вызова из другой транзакции.

Подключим классы через classmap, сохраняя прежний autoload:

```bash
php -r '
$p = json_decode(file_get_contents("composer.json"), true, 512, JSON_THROW_ON_ERROR);
$p["autoload"]["classmap"] ??= [];
if (!in_array("booking/", $p["autoload"]["classmap"], true)) {
    $p["autoload"]["classmap"][] = "booking/";
}
file_put_contents("composer.json", json_encode(
    $p, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES
) . PHP_EOL);
'
composer dump-autoload
```

В Symfony `booking/HttpController.php`:

```php
<?php

namespace Study\Booking;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

final class HttpController
{
    public function __construct(private ReservationCreator $creator) {}

    #[Route('/events/{id}/reservations', methods: ['POST'], priority: 100)]
    public function __invoke(int $id, Request $request): JsonResponse
    {
        try {
            $command = ReserveSeats::http(
                $id,
                $request->toArray(),
                $request->headers->get('Idempotency-Key', '')
            );

            return new JsonResponse($this->creator->reserve($command), 201);
        } catch (Conflict $exception) {
            return new JsonResponse(['error' => $exception->getMessage()], 409);
        } catch (\InvalidArgumentException $exception) {
            return new JsonResponse(['error' => $exception->getMessage()], 400);
        }
    }
}
```

`booking/BookingBundle.php`:

```php
<?php

namespace Study\Booking;

use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\DependencyInjection\Reference;
use Symfony\Component\HttpKernel\Bundle\Bundle;

final class BookingBundle extends Bundle
{
    public function build(ContainerBuilder $container): void
    {
        parent::build($container);
        $container->register(Clock::class, FixedClock::class);
        $container->register(Store::class, SqlStore::class)
            ->setArguments([new Reference('doctrine.dbal.default_connection')])
            ->setPublic(true);
        $container->register(ReservationCreator::class)
            ->setArguments([
                new Reference(Store::class),
                new Reference(Clock::class),
                5,
            ])
            ->setPublic(true);
        $container->register(HttpController::class)
            ->setArguments([new Reference(ReservationCreator::class)])
            ->addTag('controller.service_arguments')
            ->setPublic(true);
    }
}
```

`config/routes/booking.yaml`:

```yaml
booking_write:
    resource: ../../booking/HttpController.php
    type: attribute
```

```bash
php -r '
$f = "config/bundles.php";
$b = require $f;
$b[\Study\Booking\BookingBundle::class] = ["all" => true];
file_put_contents($f, "<?php\nreturn " . var_export($b, true) . ";\n");
'
```

В Laravel `booking/HttpController.php`:

```php
<?php

namespace Study\Booking;

use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\JsonResponse;

final class HttpController
{
    public function __construct(private ReservationCreator $creator) {}

    public function __invoke(Request $request, int $id): JsonResponse
    {
        try {
            $command = ReserveSeats::http(
                $id,
                $request->json()->all(),
                $request->header('Idempotency-Key', '')
            );

            return new JsonResponse($this->creator->reserve($command), 201);
        } catch (Conflict $exception) {
            return new JsonResponse(['error' => $exception->getMessage()], 409);
        } catch (\InvalidArgumentException $exception) {
            return new JsonResponse(['error' => $exception->getMessage()], 400);
        }
    }
}
```

`booking/BookingProvider.php`:

```php
<?php

namespace Study\Booking;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

final class BookingProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(Clock::class, FixedClock::class);
        $this->app->singleton(Store::class, SqlStore::class);
        $this->app->bind(ReservationCreator::class, fn ($app) =>
            new ReservationCreator(
                $app->make(Store::class),
                $app->make(Clock::class),
                5
            )
        );
    }

    public function boot(): void
    {
        // Учебный JSON endpoint без web-session/CSRF middleware.
        Route::post('/events/{id}/reservations', HttpController::class);
    }
}
```

```bash
php -r '
$f = "bootstrap/providers.php";
$p = require $f;
$p[] = \Study\Booking\BookingProvider::class;
file_put_contents($f, "<?php\nreturn " . var_export(array_unique($p), true) . ";\n");
'
```

Общий загрузчик для отдельных CLI-процессов, `booking/bootstrap.php`:

```php
<?php

use Study\Booking\ReservationCreator;
use Study\Booking\Store;

$root = dirname(__DIR__);
require $root . '/vendor/autoload.php';

if (is_file($root . '/artisan')) {
    $app = require $root . '/bootstrap/app.php';
    $app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

    return [$app->make(ReservationCreator::class), $app->make(Store::class)];
}

(new \Symfony\Component\Dotenv\Dotenv())->bootEnv($root . '/.env');
$kernel = new \App\Kernel($_SERVER['APP_ENV'] ?? 'dev', true);
$kernel->boot();
$container = $kernel->getContainer();

return [$container->get(ReservationCreator::class), $container->get(Store::class)];
```

`bin/booking.php`:

```php
<?php

use Study\Booking\ReserveSeats;

[$creator, $store] = require dirname(__DIR__) . '/booking/bootstrap.php';

try {
    $result = match ($argv[1] ?? '') {
        'reserve' => $creator->reserve(
            new ReserveSeats(1, (int) $argv[2], (int) $argv[4], $argv[3]),
            ($argv[5] ?? '') === 'fail'
        ),
        'sql' => $store->rows($argv[2]),
        'exec' => ['affected' => $store->execute($argv[2])],
        default => throw new InvalidArgumentException(
            'reserve EVENT KEY QUANTITY [fail] | sql SQL | exec SQL'
        ),
    };
    echo json_encode($result, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE), "\n";
} catch (Throwable $exception) {
    fwrite(STDERR, get_class($exception) . ': ' . $exception->getMessage() . "\n");
    exit(1);
}
```

Проверка выполняет прямой SQL, не читает результат из identity map. Она удаляет только бронирования события 1 в учебной базе.

```bash
composer dump-autoload
php bin/booking.php exec 'DELETE FROM reservations WHERE event_id = 1'
php bin/booking.php exec 'UPDATE events SET available_seats = 5 WHERE id = 1'

php bin/booking.php reserve 1 fail9 1 fail
# RuntimeException: Artificial failure after debit; exit code 1

php bin/booking.php sql \
'SELECT available_seats,
        (SELECT count(*) FROM reservations WHERE event_id = 1) AS reservations
 FROM events WHERE id = 1'
# [{"available_seats":5,"reservations":0}]
```

Числовые типы JSON из диагностического SQL могут зависеть от драйвера; значения — именно 5 и 0.

```bash
# Symfony:
BASE=http://localhost:8001
# Для той же проверки Laravel: BASE=http://localhost:8002

curl -i -X POST "$BASE/events/1/reservations" \
  -H 'Content-Type: application/json' \
  -H 'Idempotency-Key: ok9' \
  --data '{"quantity":1}'
```

Статус — **201**:

```json
{"event_id":1,"quantity":1,"persisted":true,"created_at":"2025-01-01T00:00:00+00:00","max_quantity":5}
```

В базе теперь 4 места и одно бронирование события 1. Искусственный сбой доступен только CLI; произвольный клиент включить его не может. Общую HTTP-конверсию `DomainException` по-прежнему не вводим.

**Вывод примера 9 — атомарность принадлежит прикладной границе:** непосредственный `UPDATE` и отложенный Doctrine `INSERT` откатываются вместе, как и два непосредственных запроса Eloquent.

### 9.4. Ловушка №9: принять последовательность save за атомарную операцию

Плохой порядок — списать место с autocommit, отправить письмо, затем записать бронь. Если последняя запись падает, место уже потеряно, а письмо уже ушло. Даже обёртывание всех трёх действий SQL-транзакцией исправит только первое: SMTP и внешний HTTP не участвуют в откате PostgreSQL.

Исправленный путь из примера «booking/Domain.php: нейтральный прикладной слой» не отправляет уведомлений внутри операции. Будущий вызов после возврата `reserve()` будет **после commit**, но это ещё **не гарантия доставки**: процесс способен упасть между commit и отправкой.

### 9.5. Соглашения и опытное суждение

| Требование | Граница и гарантия |
|---|---|
| Атомарные SQL-изменения | Одна транзакция одного соединения |
| Простое уведомление после commit | Нет сообщения о незакоммиченной броне; возможна потеря отправки |
| Надёжная постановка уведомления | Transactional outbox в той же БД; доставка и дедупликация требуют отдельного протокола |

**Как думают опытные.** Я сначала перечисляю ресурсы, которые операция изменяет. Если среди них есть чужой сервер, слово «атомарно» без уточнения границы уже подозрительно.

---

## Часть 10. Конкурирующие запросы: последнее место и повтор операции

### 10.1. Какую проблему мы сейчас решаем

Один запрос прошёл проверку — это ещё не означает, что два запроса смогут пройти её одновременно. При одном свободном месте оба процесса способны прочитать `1`, признать покупку допустимой и записать `0`. Отрицательного остатка нет, но продано два места.

Состояние теперь включает строку события, конкурирующие транзакции и ключ повторной операции. **Инвариант**: подтверждённые новые бронирования не превышают исходный остаток, а одна пара `(user_id, idempotency_key)` обозначает одну операцию с неизменным содержанием.

Почему это важно: таймаут ответа не сообщает клиенту, состоялся ли commit. Поэтому защита последнего места и обработка повторной доставки запроса — две разные обязанности. Первая предотвращает перепродажу, вторая предотвращает повторное выполнение уже принятой команды.

### 10.2. Как это устроено внутри

При PostgreSQL `READ COMMITTED` обычный `SELECT` не резервирует прочитанное значение. Возможное чередование выглядит так:

| Момент | Процесс A | Процесс B |
|---|---|---|
| 1 | Читает остаток 1 | |
| 2 | | Читает остаток 1 |
| 3 | Записывает вычисленный в PHP остаток 0 | |
| 4 | Commit | Записывает собственный устаревший 0 |
| 5 | | Commit |

Это **lost update**, потерянное обновление: блокировка самого `UPDATE` упорядочивает записи, но не пересчитывает устаревшее PHP-решение.

Инструментов несколько. Условный `UPDATE … WHERE available_seats >= :quantity` превращает число затронутых строк в результат решения. `SELECT … FOR UPDATE` блокирует строку до завершения транзакции. Оптимистическая проверка версии использует `UPDATE … WHERE version = :old` и классифицирует нулевой результат как конфликт.

Наш путь — блокировка строки события, затем проверка и списание. **М4 здесь формулируется полностью: инвариант требует общей точки принятия решения для конкурентов.** После ожидания блокировки PostgreSQL при выбранной изоляции возвращает актуальную версию строки.

Уникальность ключа решает отдельную гонку. Для одного события конкурентов уже сериализует блокировка; для разных событий одинаковый пользовательский ключ всё равно защищает `UNIQUE`. Проигравшая вставка откатывает и своё списание, после чего сервис читает запись победителя. Одинаковые событие и количество возвращают прежний результат; другое содержание — `Conflict`, HTTP **409**. Повтор сохраняет исходный **201** и прежнее тело: нового списания при этом нет.

### 10.3. Минимальный пример, который действительно что-то доказывает

`database/steps/10.sql` в обоих приложениях:

```sql
ALTER TABLE reservations
    ADD CONSTRAINT reservations_user_key_unique
    UNIQUE (user_id, idempotency_key);
```

```bash
sh bin/new-step.sh 20260901001000 10

# Symfony:
php bin/console doctrine:migrations:migrate --no-interaction
# Laravel:
php artisan migrate --force
```

Теперь полностью включён путь `ReservationCreator`, показанный в части 9. Проверим его **двумя ОС-процессами**, а не запросами к однопоточному dev server.

Временный `bin/race.php`:

```php
<?php

use Study\Booking\ReserveSeats;

[$creator, $store] = require dirname(__DIR__) . '/booking/bootstrap.php';

$mode = $argv[1];
$directory = $argv[2];
$key = $argv[3];

$barrier = static function () use ($directory, $key): void {
    touch($directory . '/' . $key);
    $deadline = microtime(true) + 10;

    while (count(glob($directory . '/*')) < 2) {
        if (microtime(true) > $deadline) {
            throw new RuntimeException('Barrier timeout');
        }
        usleep(10000);
    }
};

try {
    if ($mode === 'bad') {
        $result = $store->transaction(function () use ($store, $barrier, $key): array {
            $row = $store->rows(
                'SELECT available_seats FROM events WHERE id = 1'
            )[0];
            $barrier();

            if ((int) $row['available_seats'] < 1) {
                throw new RuntimeException('No seats');
            }

            $store->execute(
                'UPDATE events SET available_seats = ? WHERE id = 1',
                [(int) $row['available_seats'] - 1]
            );
            $store->insert([
                'user_id' => 1,
                'event_id' => 1,
                'quantity' => 1,
                'status' => 'confirmed',
                'idempotency_key' => $key,
                'created_at' => '2025-01-01T00:00:00+00:00',
                'max_quantity' => 5,
            ]);

            return ['accepted' => $key];
        });
    } elseif ($mode === 'good') {
        $result = $creator->reserve(
            new ReserveSeats(1, 1, 1, $key),
            false,
            static function () use ($store, $barrier): void {
                // Та же предварительная история чтений, но не основание решения.
                $store->rows(
                    'SELECT available_seats FROM events WHERE id = 1'
                );
                $barrier();
            }
        );
    } else {
        throw new InvalidArgumentException('Expected bad or good');
    }

    echo $key, ': ', json_encode($result, JSON_THROW_ON_ERROR), "\n";
} catch (Throwable $exception) {
    fwrite(STDERR, $key . ': ' . get_class($exception)
        . ': ' . $exception->getMessage() . "\n");
    exit(1);
}
```

Барьер гарантирует, что оба предварительных чтения завершились до записи. В исправленном варианте та же история доводится до барьера, но решение принимается **заново под блокировкой**. Барьер после захвата блокировки был бы ошибкой теста: первый процесс ожидал бы второй, которому сам запрещает пройти.

```bash
php bin/booking.php exec 'DELETE FROM reservations WHERE event_id = 1'
php bin/booking.php exec 'UPDATE events SET available_seats = 1 WHERE id = 1'

GATE=$(mktemp -d)
php bin/race.php bad "$GATE" A & A_PID=$!
php bin/race.php bad "$GATE" B & B_PID=$!
wait "$A_PID"
wait "$B_PID"
rm -rf "$GATE"

php bin/booking.php sql \
'SELECT available_seats,
        (SELECT count(*) FROM reservations WHERE event_id = 1) AS bookings
 FROM events WHERE id = 1'
# Значения: available_seats = 0, bookings = 2.
```

Обе транзакции успешны, но последнего места хватило двум покупателям. Уникальность не помогла: ключи разные.

Сразу удаляем результат плохого варианта и повторяем тот же запуск:

```bash
php bin/booking.php exec 'DELETE FROM reservations WHERE event_id = 1'
php bin/booking.php exec 'UPDATE events SET available_seats = 1 WHERE id = 1'

GATE=$(mktemp -d)
php bin/race.php good "$GATE" A & A_PID=$!
php bin/race.php good "$GATE" B & B_PID=$!
wait "$A_PID" || true
wait "$B_PID" || true
rm -rf "$GATE"

php bin/booking.php sql \
'SELECT available_seats,
        (SELECT count(*) FROM reservations WHERE event_id = 1) AS bookings
 FROM events WHERE id = 1'
# Значения: available_seats = 0, bookings = 1.
```

**Схематическая диагностика:** один процесс получает результат с `persisted: true`, другой — `Conflict: Not enough seats`. Победителем разрешено быть и A, и B; порядок строк вывода не фиксирован.

Получим ключ победителя и повторим команду новым процессом:

```bash
KEY=$(php bin/booking.php sql \
  'SELECT idempotency_key FROM reservations WHERE event_id = 1' |
  php -r '$r=json_decode(stream_get_contents(STDIN),true); echo $r[0]["idempotency_key"];')

php bin/booking.php reserve 1 "$KEY" 1

# Symfony; для Laravel используйте порт 8002.
curl -i -X POST http://localhost:8001/events/1/reservations \
  -H 'Content-Type: application/json' \
  -H "Idempotency-Key: $KEY" \
  --data '{"quantity":2}'

rm bin/race.php
```

CLI возвращает прежнее пятиэлементное тело. HTTP возвращает **409** и `{"error":"Idempotency key has different content"}`. В базе остаются ноль мест и одна бронь.

**Вывод примера 10 — транзакции нужно место решения:** блокировка защищает остаток, уникальное ограничение защищает идентичность операции, а код определяет смысл повтора.

### 10.4. Ловушка №10: считать транзакцию защитой от любой гонки

Плохой вариант тоже использовал транзакцию. Он сломался механически: между чтением и действием другое соединение изменило основание решения, а PHP продолжил использовать старое число.

Нельзя исправить это только повторной проверкой ключа в PHP. Два процесса могут одновременно не найти запись. Исправление из примера «Гонка исправленного варианта» сочетает блокировку, ограничение БД и классификацию результата после отката. Удаление записей идемпотентности также требует политики: после удаления ключ перестаёт защищать от позднего повтора.

### 10.5. Соглашения и опытное суждение

Условный `UPDATE` часто короче для одного счётчика; блокировка удобнее, когда решение включает несколько проверок состояния строки. Ни один вариант не разрешает бездумно держать транзакцию открытой во время внешнего HTTP-вызова.

**Как думают опытные.** Я спрашиваю: какая именно операция является точкой принятия решения для конкурентов? Если ответ — «мы перед этим проверили в PHP», общей точки, скорее всего, ещё нет.

---

## Часть 11. Схема БД, ограничения и миграции — часть программы

### 11.1. Какую проблему мы сейчас решаем

HTTP-валидатор не видит SQL-консоль, импорт и старый worker. Поэтому корректность не должна зависеть от единственного входа в систему. С другой стороны, новая обязательная колонка способна остановить приложение, если вы забыли о существующих строках.

Здесь участвуют текущая схема, история применённых миграций и уже накопленные данные. **Инвариант**: после каждой стадии развёртывания допустимы и существующие строки, и записи работающей версии приложения. Почему это важно: миграция выполняется не над картинкой из модели, а над живым состоянием; следовательно, её проверяют на предыдущем состоянии базы, а не только на пустой базе.

Это снова **М3**: класс, metadata ORM и таблица — разные представления. И **М4**: последнее слово о допустимости строки принадлежит PostgreSQL, если правило действительно закреплено ограничением.

### 11.2. Как это устроено внутри

Doctrine `doctrine:migrations:diff` сравнивает metadata настроенного менеджера с подключённой схемой и предлагает изменения. Он не знает делового смысла удаления колонки и не гарантирует безопасное развёртывание. В нашем модуле отдельный короткоживущий менеджер намеренно не включён в глобальный mapping: **нельзя принимать diff основного менеджера за полное описание этой схемы**.

Laravel `make:migration` создаёт заготовку, а Schema Builder обычно заполняет разработчик. Он сам выбирает колонки и ограничения. Происхождение текста различается, ответственность за SQL и сохранность данных — нет.

`NOT NULL` запрещает отсутствие значения; FK проверяет существование связанной строки; `UNIQUE` исключает дубликат ключа; `CHECK` проверяет выражение для строки. Обычный индекс ускоряет определённые планы доступа и сам по себе уникальность не обеспечивает.

`CHECK (available_seats >= 0)` не доказывает отсутствие перепродажи из части 10: там остаток был нулевым. Он также не выражает произвольное равенство между остатком события и суммой строк другой таблицы. **Строчное ограничение не заменяет межтабличный протокол изменения.**

### 11.3. Минимальный пример, который действительно что-то доказывает

`UNIQUE(user_id, idempotency_key)` уже добавлен новой миграцией части 10: повторно создавать его не следует. Проверим наличие, затем добавим `CHECK` и проведём трёхстадийное расширение непустой таблицы.

```bash
php bin/booking.php sql \
"SELECT conname, pg_get_constraintdef(oid) AS definition
 FROM pg_constraint
 WHERE conrelid = 'reservations'::regclass
   AND conname = 'reservations_user_key_unique'"
```

Ожидается одна строка с определением `UNIQUE (user_id, idempotency_key)`.

`database/steps/11a.sql` в обоих приложениях:

```sql
ALTER TABLE events
    ADD CONSTRAINT events_available_seats_nonnegative
    CHECK (available_seats >= 0);

ALTER TABLE reservations ADD COLUMN origin TEXT;

-- SET DEFAULT не переписывает старые NULL:
-- он обеспечивает совместимость новых INSERT старой версии приложения.
ALTER TABLE reservations ALTER COLUMN origin SET DEFAULT 'application';
```

```bash
sh bin/new-step.sh 20260901001101 11a

# Symfony:
php bin/console doctrine:migrations:migrate --no-interaction
# Laravel:
php artisan migrate --force

php bin/booking.php sql \
'SELECT count(*) AS awaiting_backfill FROM reservations WHERE origin IS NULL'
```

Результат больше нуля: предыдущее упражнение оставило как минимум одну бронь. Колонка пока nullable; новые вставки нашего сервиса её не указывают и получают `application`.

Вторая миграция исполняет отдельный идемпотентный backfill-скрипт, `database/steps/11b.sql`:

```sql
UPDATE reservations SET origin = 'legacy' WHERE origin IS NULL;
```

```bash
sh bin/new-step.sh 20260901001102 11b

# Symfony:
php bin/console doctrine:migrations:migrate --no-interaction
# Laravel:
php artisan migrate --force

php bin/booking.php sql \
'SELECT count(*) AS awaiting_backfill FROM reservations WHERE origin IS NULL'
# Значение: 0.
```

Для учебного объёма достаточно одного `UPDATE`. На большой таблице backfill делают порциями с наблюдением за блокировками, нагрузкой и возможностью продолжения.

Третья миграция, `database/steps/11c.sql`:

```sql
ALTER TABLE reservations ALTER COLUMN origin SET NOT NULL;
```

```bash
sh bin/new-step.sh 20260901001103 11c

# Symfony:
php bin/console doctrine:migrations:migrate --no-interaction
# Laravel:
php artisan migrate --force
```

Генератор из части 9 создаёт для каждого шага самостоятельный Doctrine migration либо Laravel migration. `CHECK` записан PostgreSQL SQL явно; обёртка Laravel исполняет его через `DB::unprepared`, не выдавая это за универсальную возможность Schema Builder.

Теперь обойдём оба приложения:

```bash
php bin/booking.php exec \
'UPDATE events SET available_seats = -1 WHERE id = 1'

php bin/booking.php exec \
"INSERT INTO reservations
 (user_id, event_id, quantity, status, idempotency_key, created_at, max_quantity)
 SELECT user_id, event_id, quantity, status, idempotency_key, created_at, max_quantity
 FROM reservations WHERE event_id = 1 LIMIT 1"

php bin/booking.php exec \
'UPDATE reservations SET origin = NULL WHERE event_id = 1'
```

**Схематическая диагностика PostgreSQL**, независимо от обёртки исключения:

```text
23514: violates check constraint "events_available_seats_nonnegative"
23505: violates unique constraint "reservations_user_key_unique"
23502: null value in column "origin" violates not-null constraint
```

Каждый оператор отвергнут целиком. Остаток события 1 — по-прежнему 0, бронь одна, её `origin` не `NULL`. Неудачные прямые записи не требуют «ремонта» данных.

**Вывод примера 11 — схема исполняет часть программы:** ограничения работают при обходе PHP, а последовательные миграции переводят существующее состояние, не только создают новое.

### 11.4. Ловушка №11: доверить целостность только валидатору или автодиффу

Проверка уникальности через `SELECT` оставляет временное окно до `INSERT`. Редактирование уже применённой миграции не меняет базу: runner видит её номер в истории и не исполняет заново. Непрочитанный diff способен удалить данные, потому что исчезнувший mapping выглядит как намерение удалить объект схемы.

Исправление — новая проверенная миграция, ограничение в PostgreSQL и прогон перехода на копии предыдущего состояния. SQL-файлы нашей обёртки тоже часть неизменяемой истории; переносить их или исправлять задним числом нельзя.

### 11.5. Соглашения и опытное суждение

| Механизм | Его работа |
|---|---|
| Валидация | Ранняя понятная ошибка на входе |
| Ограничение БД | Отказ недопустимой записи независимо от клиента |
| Индекс | Стоимость доступа; уникальность — только если индекс уникальный |
| Миграция | Воспроизводимый переход схемы и, когда необходимо, данных |

**Как думают опытные.** Я проверяю не только финальную схему, но и промежуточные состояния: что запишет старая версия приложения между добавлением колонки и `NOT NULL`? Здесь ответ обеспечен default, а не надеждой на мгновенный deploy.

---

## Часть 12. Twig и Blade: представление без скрытого доступа к данным

### 12.1. Какую проблему мы сейчас решаем

Страница списка может выглядеть невинно, пока каждая строка незаметно загружает связь из базы, а «починка HTML» через `raw` превращает пользовательский заголовок в исполняемую разметку.

В механизме участвуют подготовленный контекст, шаблон и скомпилированный код. **Инвариант** нашего примера: рендер получает только скалярные данные, не выполняет SQL и выводит заголовок как текст. Это важно, потому что визуальное изменение шаблона не должно незаметно менять ни план доступа к данным, ни границу доверия.

### 12.2. Как это устроено внутри

Twig разбирает шаблон и компилирует его в PHP; Blade также преобразует свои директивы в PHP. **Кэш компиляции — не кэш страницы**: сохранён код, который при следующем рендере снова получает контекст и строит HTML.

Наследование задаёт каркас, partial — повторяемый фрагмент. Ни то ни другое не требует ORM-объектов. Это **М1**, путь выполнения запроса, и **М3**, отдельное представление уже прочитанных данных.

Автоэкранирование подходит для текста HTML, но контексты различаются. HTML-body, JavaScript-строка, URL и значение атрибута требуют разных правил; экранирование кавычек не запрещает опасную URL-схему.

### 12.3. Минимальный пример, который действительно что-то доказывает

Добавим счётчик **реально исполненных SQL**, а не вызовов read service. Общий `booking/RenderCounter.php`:

```php
<?php

namespace Study\Booking;

final class RenderCounter
{
    public int $queries = 0;
}
```

Symfony, `booking/ViewIntegration.php`:

```php
<?php

namespace Study\Booking;

use Doctrine\DBAL\Logging\Middleware;
use Psr\Log\AbstractLogger;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\DependencyInjection\Reference;
use Symfony\Component\HttpKernel\Bundle\Bundle;

final class SqlCountingLogger extends AbstractLogger
{
    public function __construct(private RenderCounter $counter) {}

    public function log(
        $level,
        string|\Stringable $message,
        array $context = [],
    ): void {
        if (isset($context['sql'])) {
            ++$this->counter->queries;
        }
    }
}

final class ViewBundle extends Bundle
{
    public function build(ContainerBuilder $container): void
    {
        parent::build($container);
        $container->register(RenderCounter::class);
        $container->register(SqlCountingLogger::class)
            ->setArguments([new Reference(RenderCounter::class)]);
        $container->register('booking.sql_counter', Middleware::class)
            ->setArguments([new Reference(SqlCountingLogger::class)])
            ->addTag('doctrine.middleware');
        $container->register(ViewController::class)
            ->setArguments([
                new Reference(Store::class),
                new Reference('twig'),
                new Reference(RenderCounter::class),
            ])
            ->addTag('controller.service_arguments')
            ->setPublic(true);
    }
}
```

`booking/ViewController.php` в Symfony:

```php
<?php

namespace Study\Booking;

use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Twig\Environment;

final class ViewController
{
    public function __construct(
        private Store $store,
        private Environment $twig,
        private RenderCounter $counter,
    ) {}

    #[Route('/booking-events', methods: ['GET'])]
    public function __invoke(): Response
    {
        $events = $this->store->rows(
            'SELECT id, title FROM events ORDER BY id LIMIT 2'
        );
        $before = $this->counter->queries;
        $html = $this->twig->render('booking/events.html.twig', [
            'events' => $events,
        ]);

        return new Response($html, 200, [
            'X-Render-SQL' => (string) ($this->counter->queries - $before),
        ]);
    }
}
```

`config/routes/booking_view.yaml`:

```yaml
booking_view:
    resource: ../../booking/ViewController.php
    type: attribute
```

`templates/booking/layout.html.twig`:

```twig
<!doctype html>
<html lang="ru">
<head><meta charset="utf-8"><title>События</title></head>
<body>{% block content %}{% endblock %}</body>
</html>
```

`templates/booking/events.html.twig`:

```twig
{% extends 'booking/layout.html.twig' %}
{% block content %}
<ul>
{% for event in events %}
    {% include 'booking/_event.html.twig' with {event: event} only %}
{% endfor %}
</ul>
{% endblock %}
```

`templates/booking/_event.html.twig`:

```twig
<li>{{ event.title }}</li>
```

```bash
composer dump-autoload
php -r '
$f = "config/bundles.php";
$b = require $f;
$b[\Study\Booking\ViewBundle::class] = ["all" => true];
file_put_contents($f, "<?php\nreturn " . var_export($b, true) . ";\n");
'
php bin/console cache:clear
```

Laravel, `booking/ViewProvider.php`:

```php
<?php

namespace Study\Booking;

use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

final class ViewProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(RenderCounter::class);
    }

    public function boot(): void
    {
        DB::listen(function (QueryExecuted $event): void {
            ++$this->app->make(RenderCounter::class)->queries;
        });
        Route::get('/booking-events', ViewController::class);
    }
}
```

`booking/ViewController.php` в Laravel:

```php
<?php

namespace Study\Booking;

use Symfony\Component\HttpFoundation\Response;

final class ViewController
{
    public function __construct(
        private Store $store,
        private RenderCounter $counter,
    ) {}

    public function __invoke(): Response
    {
        $events = $this->store->rows(
            'SELECT id, title FROM events ORDER BY id LIMIT 2'
        );
        $before = $this->counter->queries;
        $html = view('booking.events', ['events' => $events])->render();

        return new Response($html, 200, [
            'Content-Type' => 'text/html; charset=UTF-8',
            'X-Render-SQL' => (string) ($this->counter->queries - $before),
        ]);
    }
}
```

`resources/views/booking/layout.blade.php`:

```blade
<!doctype html>
<html lang="ru">
<head><meta charset="utf-8"><title>События</title></head>
<body>@yield('content')</body>
</html>
```

`resources/views/booking/events.blade.php`:

```blade
@extends('booking.layout')
@section('content')
<ul>
@foreach ($events as $event)
    @include('booking._event', ['event' => $event])
@endforeach
</ul>
@endsection
```

`resources/views/booking/_event.blade.php`:

```blade
<li>{{ $event['title'] }}</li>
```

```bash
composer dump-autoload
php -r '
$f = "bootstrap/providers.php";
$p = require $f;
$p[] = \Study\Booking\ViewProvider::class;
file_put_contents($f, "<?php\nreturn " . var_export(array_unique($p), true) . ";\n");
'
php artisan optimize:clear
```

В каждом проекте подготовьте одинаковый заголовок:

```bash
php bin/booking.php exec \
"UPDATE events SET title = '<b>Последнее место</b>' WHERE id = 1"
```

```bash
curl -sS -D /tmp/symfony-view.headers \
  http://localhost:8001/booking-events -o /tmp/symfony-view.html
curl -sS -D /tmp/laravel-view.headers \
  http://localhost:8002/booking-events -o /tmp/laravel-view.html

grep -i 'x-render-sql' /tmp/symfony-view.headers /tmp/laravel-view.headers
grep -F '&lt;b&gt;Последнее место&lt;/b&gt;' \
  /tmp/symfony-view.html /tmp/laravel-view.html
```

Оба статуса — **200**, оба заголовка — `X-Render-SQL: 0`; HTML содержит экранированный текст. Запрос подготовки списка выполнялся **до** измеряемого участка. Второй заголовок зависит от имеющихся данных и здесь не выдумывается.

**Вывод примера 12 — представление потребляет готовый контекст:** компиляция и рендер не требуют доступа к ORM, а недоверенный заголовок остаётся текстом.

### 12.4. Ловушка №12: лечить отображение с помощью raw и запросов в шаблоне

`raw` в Twig или `{!! … !!}` в Blade отключает защиту именно там, где пользовательское поле может стать HTML. Обращение к незагруженной связи внутри цикла механически вызывает lazy loading — либо исключение, если он запрещён, либо дополнительные запросы.

Исправленный вариант передаёт массивы и использует стандартное экранирование. Доверенный HTML допустим только при отдельно обоснованном происхождении и политике очистки, не как универсальное исправление отображения.

### 12.5. Соглашения и опытное суждение

| Контроллер / read service | Шаблон |
|---|---|
| Выборка, права доступа, связи, подготовленные значения | Разметка, layout, повторяемые фрагменты |
| Данные без скрытых SQL-возможностей | Контекстно корректный вывод |

**Как думают опытные.** Я не переношу гарантию HTML-экранирования на JavaScript, URL или произвольный атрибут. Безопасность определяется местом вставки значения, а не одним удачно выбранным фильтром.

---

## Часть 13. Сессия, аутентификация, авторизация и CSRF

### 13.1. Какую проблему мы сейчас решаем

Знание идентификатора бронирования не должно давать право отменить его. Однако после добавления login легко оставить опасный обработчик: «пользователь вошёл — загрузим строку по переданному id и изменим статус».

Разделим три вопроса. **Аутентификация** устанавливает, кто действует. **Авторизация** определяет, разрешено ли этому пользователю действие над объектом. **CSRF-защита** проверяет запрос, использующий автоматически прикрепляемые браузером cookie; она не проверяет владельца бронирования.

Наш **инвариант**: отменить бронь через браузер может только её владелец, предъявивший действительный CSRF-токен. Это сочетание **М1 — путь запроса** и **М4 — место принятия решения**: успешная предыдущая проверка не заменяет следующую.

В показанной части 9 был создан только пользователь 1. Поэтому пользователя 2 добавим новой миграцией, а не будем считать существующим. Login ниже намеренно учебный: общий фиксированный секрет, два заранее созданных пользователя, только локальный сервер. **Хранение и хеширование настоящих паролей, регистрация и восстановление здесь не демонстрируются.**

### 13.2. Как это устроено внутри

Браузер отправляет cookie с идентификатором сессии. Сервер читает **server-side session**, серверное состояние сессии, восстанавливает пользователя и только потом проверяет доступ.

В Symfony **firewall** — конфигурационная граница обработки безопасности; **authenticator** проверяет предъявленную идентичность; **voter**, объект решения о доступе, проверяет конкретное действие. В Laravel **guard** определяет способ аутентификации, **provider** загружает пользователя, middleware `auth` требует входа, а **policy** принимает решение над объектом.

CSRF-токен не доказывает ни собственность, ни корректность количества мест. Он противодействует подделанному браузерному действию с cookie жертвы. Действительный токен пользователя 1 не разрешает ему отменять бронь пользователя 2.

В учебной модели отмена меняет только `status`. Возврат мест не добавляем молча: для него потребовались бы отдельные бизнес-правила и согласованный порядок блокировок.

### 13.3. Минимальный пример, который действительно что-то доказывает

Общие новые файлы создайте в обоих приложениях.

`database/steps/13.sql`:

```sql
INSERT INTO users (id) VALUES (2) ON CONFLICT (id) DO NOTHING;
SELECT setval(
    pg_get_serial_sequence('users', 'id'),
    (SELECT max(id) FROM users),
    true
);
```

```bash
sh bin/new-step.sh 20260901001300 13

# Symfony:
composer require symfony/security-bundle:^7.4 symfony/security-csrf:^7.4
php bin/console doctrine:migrations:migrate --no-interaction

# Laravel:
php artisan migrate --force
```

`booking/Cancellation.php`:

```php
<?php

namespace Study\Booking;

final class CancellationRule
{
    public function allows(int $userId, array $reservation): bool
    {
        return $userId === (int) $reservation['user_id'];
    }
}

final class Cancellation
{
    public function __construct(
        private Store $store,
        private CancellationRule $rule,
    ) {}

    public function find(int $id): ?array
    {
        return $this->store->rows(
            'SELECT * FROM reservations WHERE id = ?', [$id]
        )[0] ?? null;
    }

    public function cancel(int $id, int $userId): array
    {
        return $this->store->transaction(function () use ($id, $userId): array {
            $row = $this->store->rows(
                'SELECT * FROM reservations WHERE id = ? FOR UPDATE', [$id]
            )[0] ?? null;

            // Защита и для будущего небраузерного вызывающего кода.
            if ($row === null || !$this->rule->allows($userId, $row)) {
                throw new \LogicException('Cancellation not authorized');
            }

            $this->store->execute(
                "UPDATE reservations SET status = 'cancelled' WHERE id = ?",
                [$id]
            );

            return ['status' => 'cancelled'];
        });
    }
}

final class Forms
{
    public static function login(string $token): string
    {
        $token = htmlspecialchars($token, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

        return <<<HTML
<!doctype html><html lang="ru"><meta charset="utf-8">
<form method="post" action="/study/login">
<input type="hidden" name="_token" value="$token">
<label>Учебный пользователь <input name="user_id" value="1"></label>
<label>Учебный секрет <input name="secret" type="password"></label>
<button>Войти</button>
</form></html>
HTML;
    }

    public static function cancel(int $id, string $token): string
    {
        $token = htmlspecialchars($token, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

        return <<<HTML
<!doctype html><html lang="ru"><meta charset="utf-8">
<form method="post" action="/reservations/$id/cancel">
<input type="hidden" name="_token" value="$token">
<button>Отменить бронирование</button>
</form></html>
HTML;
    }
}
```

**Symfony.** Здесь и далее новые bundles добавляются после уже зарегистрированных модулей.

`config/packages/security.yaml`:

```yaml
security:
    providers:
        study_users:
            memory:
                users:
                    '1': { roles: [ROLE_USER] }
                    '2': { roles: [ROLE_USER] }

    firewalls:
        dev:
            pattern: ^/(_(profiler|wdt)|css|images|js)/
            security: false
        main:
            lazy: true
            provider: study_users
            custom_authenticators:
                - Study\Booking\StudyAuthenticator
            entry_point: Study\Booking\StudyAuthenticator

    access_control:
        - { path: ^/study/login$, roles: PUBLIC_ACCESS }
        - { path: ^/reservations/, roles: ROLE_USER }
        - { path: '^/events/\d+/reservations$', roles: ROLE_USER }
```

`config/packages/study_session.yaml`:

```yaml
framework:
    secret: '%env(APP_SECRET)%'
    csrf_protection: true
    session:
        handler_id: null
        cookie_httponly: true
        cookie_samesite: lax
        cookie_secure: auto
```

`booking/StudyAuthenticator.php`:

```php
<?php

namespace Study\Booking;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Core\Exception\CustomUserMessageAuthenticationException;
use Symfony\Component\Security\Http\Authenticator\AbstractAuthenticator;
use Symfony\Component\Security\Http\Authenticator\Passport\Badge\CsrfTokenBadge;
use Symfony\Component\Security\Http\Authenticator\Passport\Badge\UserBadge;
use Symfony\Component\Security\Http\Authenticator\Passport\Passport;
use Symfony\Component\Security\Http\Authenticator\Passport\SelfValidatingPassport;
use Symfony\Component\Security\Http\EntryPoint\AuthenticationEntryPointInterface;

final class StudyAuthenticator extends AbstractAuthenticator implements AuthenticationEntryPointInterface
{
    public function __construct(private Store $store) {}

    public function supports(Request $request): ?bool
    {
        return $request->getPathInfo() === '/study/login'
            && $request->isMethod('POST');
    }

    public function authenticate(Request $request): Passport
    {
        $id = (string) $request->request->get('user_id', '');
        $secret = (string) $request->request->get('secret', '');

        if (!in_array($id, ['1', '2'], true)
            || !hash_equals('study-only', $secret)
            || $this->store->rows('SELECT id FROM users WHERE id = ?', [$id]) === []) {
            throw new CustomUserMessageAuthenticationException('Invalid study login');
        }

        return new SelfValidatingPassport(new UserBadge($id), [
            new CsrfTokenBadge(
                'study-login',
                (string) $request->request->get('_token', '')
            ),
        ]);
    }

    public function onAuthenticationSuccess(
        Request $request,
        TokenInterface $token,
        string $firewallName,
    ): ?Response {
        return new RedirectResponse('/booking-events', 303);
    }

    public function onAuthenticationFailure(
        Request $request,
        AuthenticationException $exception,
    ): ?Response {
        return new JsonResponse(['error' => 'Login rejected'], 401);
    }

    public function start(
        Request $request,
        ?AuthenticationException $authException = null,
    ): Response {
        return new RedirectResponse('/study/login', 302);
    }
}
```

`booking/CancellationVoter.php`:

```php
<?php

namespace Study\Booking;

use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

final class CancellationVoter extends Voter
{
    public function __construct(private CancellationRule $rule) {}

    protected function supports(string $attribute, mixed $subject): bool
    {
        return $attribute === 'CANCEL_RESERVATION' && is_array($subject);
    }

    protected function voteOnAttribute(
        string $attribute,
        mixed $subject,
        TokenInterface $token,
    ): bool {
        $user = $token->getUser();

        return $user !== null
            && $this->rule->allows((int) $user->getUserIdentifier(), $subject);
    }
}
```

`booking/SessionController.php`:

```php
<?php

namespace Study\Booking;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Csrf\CsrfToken;
use Symfony\Component\Security\Csrf\CsrfTokenManagerInterface;

final class SessionController extends AbstractController
{
    public function __construct(
        private Cancellation $cancellation,
        private CsrfTokenManagerInterface $csrf,
        private Security $security,
    ) {}

    #[Route('/study/login', methods: ['GET', 'POST'])]
    public function login(): Response
    {
        return new Response(Forms::login(
            $this->csrf->getToken('study-login')->getValue()
        ));
    }

    #[Route('/study/token', methods: ['GET'])]
    public function token(): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_USER');

        return new JsonResponse([
            'token' => $this->csrf->getToken('booking-write')->getValue(),
        ]);
    }

    #[Route('/reservations/{id}/cancel', methods: ['GET', 'POST'])]
    public function cancel(int $id, Request $request): Response
    {
        $row = $this->cancellation->find($id);
        if ($row === null) {
            throw $this->createNotFoundException();
        }

        $this->denyAccessUnlessGranted('CANCEL_RESERVATION', $row);

        if ($request->isMethod('GET')) {
            return new Response(Forms::cancel(
                $id,
                $this->csrf->getToken('cancel-' . $id)->getValue()
            ));
        }

        if (!$this->csrf->isTokenValid(new CsrfToken(
            'cancel-' . $id,
            (string) $request->request->get('_token', '')
        ))) {
            throw new AccessDeniedHttpException('CSRF rejected');
        }

        return new JsonResponse($this->cancellation->cancel(
            $id,
            (int) $this->security->getUser()->getUserIdentifier()
        ));
    }
}
```

Заменяем прежний `booking/HttpController.php`: идентичность теперь берётся из сессии, а не из учебного значения внутри `ReserveSeats::http()`.

```php
<?php

namespace Study\Booking;

use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Csrf\CsrfToken;
use Symfony\Component\Security\Csrf\CsrfTokenManagerInterface;

final class HttpController
{
    public function __construct(
        private ReservationCreator $creator,
        private Security $security,
        private CsrfTokenManagerInterface $csrf,
    ) {}

    #[Route('/events/{id}/reservations', methods: ['POST'], priority: 100)]
    public function __invoke(int $id, Request $request): JsonResponse
    {
        if (!$this->csrf->isTokenValid(new CsrfToken(
            'booking-write',
            $request->headers->get('X-CSRF-TOKEN', '')
        ))) {
            throw new AccessDeniedHttpException('CSRF rejected');
        }

        try {
            $input = ReserveSeats::http(
                $id,
                $request->toArray(),
                $request->headers->get('Idempotency-Key', '')
            );
            $command = new ReserveSeats(
                (int) $this->security->getUser()->getUserIdentifier(),
                $input->eventId,
                $input->quantity,
                $input->key
            );

            return new JsonResponse($this->creator->reserve($command), 201);
        } catch (Conflict $exception) {
            return new JsonResponse(['error' => $exception->getMessage()], 409);
        } catch (\InvalidArgumentException $exception) {
            return new JsonResponse(['error' => $exception->getMessage()], 400);
        }
    }
}
```

`booking/SessionBundle.php`:

```php
<?php

namespace Study\Booking;

use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\HttpKernel\Bundle\Bundle;

final class SessionBundle extends Bundle
{
    public function build(ContainerBuilder $container): void
    {
        parent::build($container);

        foreach ([
            CancellationRule::class,
            Cancellation::class,
            StudyAuthenticator::class,
            CancellationVoter::class,
            SessionController::class,
            HttpController::class,
        ] as $class) {
            $container->register($class)
                ->setAutowired(true)
                ->setAutoconfigured(true)
                ->setPublic(true);
        }
    }
}
```

`config/routes/study_session.yaml`:

```yaml
study_session:
    resource: ../../booking/SessionController.php
    type: attribute
```

**Laravel.** `booking/StudyUser.php`:

```php
<?php

namespace Study\Booking;

use Illuminate\Foundation\Auth\User as Authenticatable;

final class StudyUser extends Authenticatable
{
    protected $table = 'users';
    public $timestamps = false;
    protected $guarded = [];
}
```

`booking/CancellationPolicy.php`:

```php
<?php

namespace Study\Booking;

final class CancellationPolicy
{
    public function __construct(private CancellationRule $rule) {}

    public function cancel(StudyUser $user, array $reservation): bool
    {
        return $this->rule->allows((int) $user->getAuthIdentifier(), $reservation);
    }
}
```

Для реальной CSRF-проверки также в тестах введём middleware, не отключающее её в тестовом окружении.

`booking/BrowserCsrf.php`:

```php
<?php

namespace Study\Booking;

use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;

final class BrowserCsrf extends ValidateCsrfToken
{
    protected function runningUnitTests()
    {
        return false;
    }
}
```

`booking/SessionController.php`:

```php
<?php

namespace Study\Booking;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpFoundation\Response;

final class SessionController
{
    public function __construct(private Cancellation $cancellation) {}

    public function loginForm(): Response
    {
        return response(Forms::login(csrf_token()));
    }

    public function login(Request $request): Response
    {
        $id = (string) $request->input('user_id', '');
        abort_unless(
            in_array($id, ['1', '2'], true)
            && hash_equals('study-only', (string) $request->input('secret', '')),
            401
        );
        abort_unless(Auth::guard('study')->loginUsingId((int) $id), 401);
        $request->session()->regenerate();

        return redirect('/booking-events', 303);
    }

    public function token(): Response
    {
        return response()->json(['token' => csrf_token()]);
    }

    public function cancel(Request $request, int $id): Response
    {
        $row = $this->cancellation->find($id);
        abort_if($row === null, 404);

        Gate::forUser($request->user('study'))
            ->authorize('study-cancel', [$row]);

        if ($request->isMethod('GET')) {
            return response(Forms::cancel($id, csrf_token()));
        }

        return response()->json($this->cancellation->cancel(
            $id,
            (int) $request->user('study')->getAuthIdentifier()
        ));
    }
}
```

`booking/HttpController.php`:

```php
<?php

namespace Study\Booking;

use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\JsonResponse;

final class HttpController
{
    public function __construct(private ReservationCreator $creator) {}

    public function __invoke(Request $request, int $id): JsonResponse
    {
        try {
            $input = ReserveSeats::http(
                $id,
                $request->json()->all(),
                $request->header('Idempotency-Key', '')
            );
            $command = new ReserveSeats(
                (int) $request->user('study')->getAuthIdentifier(),
                $input->eventId,
                $input->quantity,
                $input->key
            );

            return new JsonResponse($this->creator->reserve($command), 201);
        } catch (Conflict $exception) {
            return new JsonResponse(['error' => $exception->getMessage()], 409);
        } catch (\InvalidArgumentException $exception) {
            return new JsonResponse(['error' => $exception->getMessage()], 400);
        }
    }
}
```

Заменяем `booking/BookingProvider.php`, убирая прежнюю незащищённую регистрацию POST:

```php
<?php

namespace Study\Booking;

use Illuminate\Support\ServiceProvider;

final class BookingProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(Clock::class, FixedClock::class);
        $this->app->singleton(Store::class, SqlStore::class);
        $this->app->bind(ReservationCreator::class, fn ($app) =>
            new ReservationCreator(
                $app->make(Store::class),
                $app->make(Clock::class),
                5
            )
        );
    }
}
```

`booking/SessionProvider.php`:

```php
<?php

namespace Study\Booking;

use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

final class SessionProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app['config']->set('auth.guards.study', [
            'driver' => 'session',
            'provider' => 'study',
        ]);
        $this->app['config']->set('auth.providers.study', [
            'driver' => 'eloquent',
            'model' => StudyUser::class,
        ]);
    }

    public function boot(): void
    {
        Gate::define('study-cancel', [CancellationPolicy::class, 'cancel']);

        Route::middleware(['web', BrowserCsrf::class])->group(function (): void {
            Route::get('/study/login', [SessionController::class, 'loginForm'])
                ->name('login');
            Route::post('/study/login', [SessionController::class, 'login']);

            Route::middleware('auth:study')->group(function (): void {
                Route::get('/study/token', [SessionController::class, 'token']);
                Route::match(
                    ['GET', 'POST'],
                    '/reservations/{id}/cancel',
                    [SessionController::class, 'cancel']
                );
                Route::post('/events/{id}/reservations', HttpController::class);
            });
        });
    }
}
```

Для Laravel установите `SESSION_DRIVER=file` в локальном `.env`: отдельную таблицу сессий этот пример не требует.

Чтобы последующие регистрации были воспроизводимыми, общий `bin/register-study.php`:

```php
<?php

require dirname(__DIR__) . '/vendor/autoload.php';

$root = dirname(__DIR__);
$class = $argv[1] ?? throw new InvalidArgumentException('Class required');

if (!class_exists($class)) {
    throw new RuntimeException('Run composer dump-autoload first');
}

if (is_file($root . '/artisan')) {
    $file = $root . '/bootstrap/providers.php';
    $items = require $file;
    $items[] = $class;
    $items = array_values(array_unique($items));
} else {
    $file = $root . '/config/bundles.php';
    $items = require $file;
    $items[$class] = ['all' => true];
}

file_put_contents($file, "<?php\nreturn " . var_export($items, true) . ";\n");
```

```bash
composer dump-autoload

# Symfony:
php bin/register-study.php 'Study\Booking\SessionBundle'
php bin/console cache:clear

# Laravel:
php bin/register-study.php 'Study\Booking\SessionProvider'
php artisan optimize:clear
```

Подготовим одинаковые данные. Команды удаляют только учебные бронирования события 1.

```bash
php bin/booking.php exec 'DELETE FROM reservations WHERE event_id = 1'
php bin/booking.php exec 'UPDATE events SET available_seats = 5 WHERE id = 1'
php bin/booking.php reserve 1 own13 1
php bin/booking.php reserve 1 foreign13 1
php bin/booking.php exec \
"UPDATE reservations SET user_id = 2 WHERE idempotency_key = 'foreign13'"

OWN=$(php bin/booking.php sql \
"SELECT id FROM reservations WHERE idempotency_key = 'own13'" |
php -r '$x=json_decode(stream_get_contents(STDIN),true); echo $x[0]["id"];')
FOREIGN=$(php bin/booking.php sql \
"SELECT id FROM reservations WHERE idempotency_key = 'foreign13'" |
php -r '$x=json_decode(stream_get_contents(STDIN),true); echo $x[0]["id"];')
```

Общий `bin/form-token.php`:

```php
<?php

$html = stream_get_contents(STDIN);
if (!preg_match('/name="_token" value="([^"]+)"/', $html, $matches)) {
    throw new RuntimeException('Token not found');
}
echo html_entity_decode($matches[1], ENT_QUOTES | ENT_HTML5, 'UTF-8');
```

```bash
BASE=http://localhost:8001
# Для Laravel повторите с BASE=http://localhost:8002.

TOKEN=$(curl -sS -c /tmp/booking.cookies "$BASE/study/login" |
php bin/form-token.php)

curl -i -b /tmp/booking.cookies -c /tmp/booking.cookies \
  --data-urlencode "_token=$TOKEN" \
  --data-urlencode 'user_id=1' \
  --data-urlencode 'secret=study-only' "$BASE/study/login"
# 303, Location: /booking-events

TOKEN=$(curl -sS -b /tmp/booking.cookies -c /tmp/booking.cookies \
  "$BASE/reservations/$OWN/cancel" | php bin/form-token.php)

curl -i -b /tmp/booking.cookies \
  --data-urlencode "_token=$TOKEN" "$BASE/reservations/$FOREIGN/cancel"
# 403: отказ авторизации.

curl -i -b /tmp/booking.cookies -X POST "$BASE/reservations/$OWN/cancel"
# Symfony: 403; Laravel: 419 — отказ CSRF.

curl -i -b /tmp/booking.cookies \
  --data-urlencode "_token=$TOKEN" "$BASE/reservations/$OWN/cancel"
# 200, {"status":"cancelled"}
```

В Symfony сначала выполняется voter, поэтому чужая бронь получает отказ независимо от токена другого действия. В Laravel токен сессии действителен и для этого POST, но policy всё равно запрещает чужую бронь. **403 и 419 здесь — поведение выбранной интеграции фреймворков, не универсальное правило HTTP для всех систем.**

SQL подтверждает: `own13` — `cancelled`, `foreign13` — `confirmed`. Ответ создания брони по-прежнему имеет прежние пять полей и статус **201**.

**Вывод примера 13 — вход не даёт права на объект:** сессия, владелец и CSRF проверены независимо.

### 13.4. Ловушка №13: считать вошедшего пользователя уполномоченным

Плохой обработчик проверяет login, затем меняет произвольный id. Он проваливается не из-за слабого CSRF-токена: в нём вообще отсутствует сравнение пользователя с владельцем.

Исправленный путь содержит voter/policy и отдельную CSRF-проверку. Подменять одно другим нельзя; порядок проверок влияет на наблюдаемый отказ, но не должен оставлять разрешённым запрещённое действие.

### 13.5. Соглашения и опытное суждение

| Проверка | Что она доказывает |
|---|---|
| Authentication | У запроса установлена идентичность |
| Authorization | Этой идентичности разрешено действие |
| CSRF | Пройден протокол защиты cookie-аутентифицированного действия |
| Validation | Вход соответствует ожидаемой форме и ограничениям |

**Как думают опытные.** Безопасность — набор разных доказательств, а не один middleware. Я проверяю каждое отдельно и не называю учебный login готовой системой учётных записей.

---

## Часть 14. Композиция приложения: события, bundles и packages

### 14.1. Какую проблему мы сейчас решаем

Форматирование подтверждения удобно использовать в двух приложениях. Но перенос класса в Composer-пакет сам по себе не регистрирует сервис и не подключает обработчик события.

**Composer устанавливает код** и строит autoload. **Интеграция фреймворка** регистрирует объекты, настройки и точки расширения. В Symfony для этого подходят bundle, его extension и compiler passes; в Laravel — пакетный service provider. Нашему небольшому модулю достаточно регистрации сервисов без отдельного языка конфигурации.

Инвариант остаётся прежним: списание и вставка принадлежат явной операции бронирования. Дополнительный слушатель не должен стать скрытым владельцем обязательной части сценария. Это **М1** и **М2 — граф сборки приложения**.

### 14.2. Как это устроено внутри

**Синхронное событие** — дополнительные вызовы в том же PHP-процессе. Dispatcher вызывает listener и ждёт завершения. Это не очередь, не фоновая доставка и не автоматическое устранение зависимостей.

Мы отправим событие после возврата транзакционного адаптера, только для новой записи. Повтор идемпотентной команды не публикует его повторно. Если listener выбросит исключение, SQL уже останется закоммиченным, а вызывающий код получит ошибку. Если процесс упадёт перед dispatch, событие потеряется. Это честная гарантия **best effort после commit**, а не outbox.

Почему это важно: иначе клиент увидит ошибку и разработчик ошибочно решит, что брони нет. Повтор с прежним ключом вернёт сохранённый результат, но не восстановит потерянное уведомление.

### 14.3. Минимальный пример, который действительно что-то доказывает

В каждом приложении создайте одинаковый локальный пакет.

`packages/confirmation-formatter/composer.json`:

```json
{
  "name": "study/confirmation-formatter",
  "type": "library",
  "require": {
    "php": "^8.3"
  },
  "autoload": {
    "psr-4": {
      "Study\\Confirmation\\": "src/"
    }
  }
}
```

`packages/confirmation-formatter/src/Confirmation.php`:

```php
<?php

namespace Study\Confirmation;

final readonly class Confirmation
{
    public function __construct(
        public int $eventId,
        public int $quantity,
    ) {}
}
```

`packages/confirmation-formatter/src/Formatter.php`:

```php
<?php

namespace Study\Confirmation;

final class Formatter
{
    public function format(Confirmation $confirmation): string
    {
        return sprintf(
            'Бронирование подтверждено: событие %d, мест %d.',
            $confirmation->eventId,
            $confirmation->quantity
        );
    }
}
```

```bash
composer config repositories.confirmation \
'{"type":"path","url":"packages/confirmation-formatter","options":{"symlink":true}}'
composer require 'study/confirmation-formatter:@dev'
```

Приложение получило одну новую пакетную зависимость. Пакет содержит **value object**, неизменяемое значение подтверждения, и чистый форматтер; он не зависит от ORM или dispatcher.

Общий `booking/CreatedEvents.php`:

```php
<?php

namespace Study\Booking;

final readonly class ReservationCreated
{
    public function __construct(public array $record) {}
}

interface CreatedEvents
{
    public function publish(ReservationCreated $event): void;
}
```

Добавим в существующий сервис зависимость и dispatch после commit. Вместо неточного «вставьте где-нибудь» используем одноразовый проверяемый преобразователь полного файла.

`bin/enable-created-events.php`:

```php
<?php

$file = dirname(__DIR__) . '/booking/Domain.php';
$source = file_get_contents($file);

$replacements = [
    'private int $maxQuantity,' =>
        "private int \$maxQuantity,\n        private ?CreatedEvents \$events = null,",

    "        try {\n            \$record = \$this->store->transaction" =>
        "        \$created = false;\n        try {\n            \$record = \$this->store->transaction",

    '$command, $failAfterDebit, $beforeDecision' =>
        '$command, $failAfterDebit, $beforeDecision, &$created',

    '$this->store->insert($record);' =>
        "\$this->store->insert(\$record);\n                \$created = true;",

    '} catch (UniqueCollision $exception) {' =>
        " } catch (UniqueCollision \$exception) {\n            \$created = false;",

    "        return [\n            'event_id' => (int) \$record['event_id']," =>
        "        if (\$created) {\n"
        . "            \$this->events?->publish(new ReservationCreated(\$record));\n"
        . "        }\n\n"
        . "        return [\n            'event_id' => (int) \$record['event_id'],",
];

foreach ($replacements as $before => $after) {
    if (substr_count($source, $before) !== 1) {
        throw new RuntimeException('Unexpected Domain.php; review before changing');
    }
    $source = str_replace($before, $after, $source);
}

file_put_contents($file, $source);
```

```bash
php bin/enable-created-events.php
php -l booking/Domain.php
```

Преобразователь запускается один раз и отказывается работать при несовпадении исходника. Исключение из транзакции, отличное от обработанной уникальности, не доходит до публикации.

**Symfony.** Установим штатную интеграцию логирования:

```bash
composer require symfony/monolog-bundle:^3.0
```

`booking/ConfirmationIntegration.php`:

```php
<?php

namespace Study\Booking;

use Psr\Log\LoggerInterface;
use Study\Confirmation\Confirmation;
use Study\Confirmation\Formatter;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\DependencyInjection\Reference;
use Symfony\Component\HttpKernel\Bundle\Bundle;
use Symfony\Contracts\EventDispatcher\EventDispatcherInterface;

final class SymfonyCreatedEvents implements CreatedEvents
{
    public function __construct(private EventDispatcherInterface $dispatcher) {}

    public function publish(ReservationCreated $event): void
    {
        $this->dispatcher->dispatch($event);
    }
}

final class ConfirmationListener
{
    public function __construct(
        private Formatter $formatter,
        private LoggerInterface $logger,
    ) {}

    public function __invoke(ReservationCreated $event): void
    {
        $this->logger->info('booking.confirmation', [
            'phase' => 'after_commit',
            'pid' => getmypid(),
            'message' => $this->formatter->format(new Confirmation(
                (int) $event->record['event_id'],
                (int) $event->record['quantity']
            )),
        ]);
    }
}

final class ConfirmationBundle extends Bundle
{
    public function build(ContainerBuilder $container): void
    {
        parent::build($container);
        $container->register(Formatter::class);
        $container->register(CreatedEvents::class, SymfonyCreatedEvents::class)
            ->setArguments([new Reference('event_dispatcher')]);
        $container->register(ConfirmationListener::class)
            ->setArguments([
                new Reference(Formatter::class),
                new Reference('logger'),
            ])
            ->addTag('kernel.event_listener', [
                'event' => ReservationCreated::class,
                'method' => '__invoke',
            ]);

        $container->getDefinition(ReservationCreator::class)
            ->setArgument(3, new Reference(CreatedEvents::class));
    }
}
```

**Laravel.** `booking/ConfirmationIntegration.php`:

```php
<?php

namespace Study\Booking;

use Illuminate\Contracts\Events\Dispatcher;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\ServiceProvider;
use Study\Confirmation\Confirmation;
use Study\Confirmation\Formatter;

final class LaravelCreatedEvents implements CreatedEvents
{
    public function __construct(private Dispatcher $dispatcher) {}

    public function publish(ReservationCreated $event): void
    {
        $this->dispatcher->dispatch($event);
    }
}

final class ConfirmationListener
{
    public function __construct(private Formatter $formatter) {}

    public function handle(ReservationCreated $event): void
    {
        Log::info('booking.confirmation', [
            'phase' => 'after_commit',
            'pid' => getmypid(),
            'message' => $this->formatter->format(new Confirmation(
                (int) $event->record['event_id'],
                (int) $event->record['quantity']
            )),
        ]);
    }
}

final class ConfirmationProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(Formatter::class);
        $this->app->bind(CreatedEvents::class, LaravelCreatedEvents::class);
        $this->app->bind(ReservationCreator::class, fn ($app) =>
            new ReservationCreator(
                $app->make(Store::class),
                $app->make(Clock::class),
                5,
                $app->make(CreatedEvents::class)
            )
        );
    }

    public function boot(Dispatcher $dispatcher): void
    {
        $dispatcher->listen(
            ReservationCreated::class,
            [ConfirmationListener::class, 'handle']
        );
    }
}
```

Bundle/provider здесь — адаптеры приложения к нейтральной библиотеке. Переносить их внутрь пакета и объявлять зависимости от обоих фреймворков для одного форматтера пока незачем.

```bash
composer dump-autoload

# Symfony:
php bin/register-study.php 'Study\Booking\ConfirmationBundle'
php bin/console cache:clear

# Laravel:
php bin/register-study.php 'Study\Booking\ConfirmationProvider'
php artisan optimize:clear

# В обоих проектах:
php bin/booking.php exec 'DELETE FROM reservations WHERE event_id = 1'
php bin/booking.php exec 'UPDATE events SET available_seats = 3 WHERE id = 1'
php bin/booking.php reserve 1 event14 1
php bin/booking.php reserve 1 event14 1
php bin/booking.php reserve 1 failed14 1 fail
```

Первые две команды создания возвращают одинаковое тело с `persisted: true`; третья завершается искусственной ошибкой. В базе остаток 2, одна бронь. Среди новых лог-записей — **ровно одна** `booking.confirmation`.

```bash
# Symfony:
grep 'booking.confirmation' var/log/dev.log
# Laravel:
grep 'booking.confirmation' storage/logs/laravel.log
```

**Схематическая диагностика**, pid и оформление зависят от запуска:

```text
booking.confirmation phase=after_commit pid=<тот же PHP-процесс>
message="Бронирование подтверждено: событие 1, мест 1."
```

Запись выполняется до возврата `reserve()` клиенту, но после commit адаптера.

**Вывод примера 14 — событие расширяет завершённую операцию:** установка пакета, сборка сервисов и доставка события имеют разные обязанности.

### 14.4. Ловушка №14: распределить обязательный инвариант по listeners

Если один listener списывает место, второй вставляет бронь, а третий проверяет ограничение, порядок регистрации становится скрытой бизнес-программой. Исключение или отключение подписчика меняет её смысл.

В исправленном варианте обязательные SQL-действия остаются в `ReservationCreator`. Слушатель форматирует и журналирует уже принятый результат; его порядок и отказ после commit названы явно.

### 14.5. Соглашения и опытное суждение

| Граница | Что в ней уместно |
|---|---|
| Библиотека | Переносимый алгоритм и значения |
| Bundle / пакетный provider | Регистрация, конфигурация, расширения фреймворка |
| Application module | Прикладной сценарий и его инварианты |

**Как думают опытные.** Возможность вынести код в пакет ещё не доказывает полезность разделения. Я ищу самостоятельный контракт, а не только новую директорию.

---

## Часть 15. Тесты проверяют разные границы, а не процент уверенности

### 15.1. Какую проблему мы сейчас решаем

Мок, ожидающий `save()`, способен пройти даже тогда, когда настоящий `INSERT` падает из-за ограничения PostgreSQL. Поэтому вопрос «сколько у нас тестов?» менее полезен, чем «какую неисправность каждый обнаруживает?».

**М5 — граница доказательства наблюдения**: вывод теста распространяется на реально пройденный механизм и выбранные наблюдения, а не на заменённые зависимости.

Инвариант проверки: искусственный сбой после списания оставляет исходный остаток и ноль новых броней. Его невозможно доказать вызовом замоканного ORM. Нужны реальная транзакция, PostgreSQL 16 и чтение базы после завершения операции.

### 15.2. Как это устроено внутри

Unit-тест не поднимает kernel. Контейнерный тест проверяет сборку зависимостей. HTTP-тест включает маршрутизацию, вход и преобразование ответа. Интеграционный тест проходит реальную границу БД.

Symfony предоставляет `KernelTestCase` и `WebTestCase`; последний добавляет тестовый HTTP-клиент. Laravel поднимает приложение через свой `Tests\TestCase`; замена binding влияет на последующие разрешения контейнера, а замена facade должна учитывать её уже разрешённый корневой объект. Ни одна такая замена не доказывает поведение заменённой системы.

Наши DB-тесты **не используют** `RefreshDatabase`, `DatabaseTransactions` или внешнюю тестовую транзакцию. Иначе commit сервиса может оказаться лишь вложенной границей, а второй процесс не увидит фикстуру.

### 15.3. Минимальный пример, который действительно что-то доказывает

Используйте отдельные базы, содержащие копию учебного состояния после части 14. Следующий скрипт создаёт файл окружения из действующей конфигурации приложения, сохраняя его способ подключения.

Общий `bin/test-environment.php`:

```php
<?php

require dirname(__DIR__) . '/booking/bootstrap.php';

$root = dirname(__DIR__);
if (isset($app)) {
    $p = $app->make('db')->connection()->getConfig();
    $host = $p['host'];
    $port = $p['port'] ?? 5432;
    $user = $p['username'];
    $password = $p['password'];
    $database = 'booking_laravel_test';
    $file = $root . '/.env.testing';
    $prefix = file_get_contents($root . '/.env');
} else {
    $p = $container->get('doctrine.dbal.default_connection')->getParams();
    $host = $p['host'] ?? '127.0.0.1';
    $port = $p['port'] ?? 5432;
    $user = $p['user'];
    $password = $p['password'] ?? '';
    $database = 'booking_symfony_test';
    $file = $root . '/.env.test.local';
    $prefix = "APP_ENV=test\nAPP_DEBUG=1\n";
}

$url = sprintf(
    'postgresql://%s:%s@%s:%s/%s?serverVersion=16&charset=utf8',
    rawurlencode($user),
    rawurlencode($password),
    $host,
    $port,
    $database
);

if (isset($app)) {
    $text = $prefix . "\nAPP_ENV=testing\nSESSION_DRIVER=file\n"
        . 'DB_URL="' . $url . "\"\n"
        . 'DB_DATABASE="' . $database . "\"\n";
} else {
    $text = $prefix . 'DATABASE_URL="' . $url . "\"\n";
}

file_put_contents($file, $text);
chmod($file, 0600);
echo $database, "\n";
```

Этот вариант рассчитан на используемое в примере TCP-подключение без дополнительных TLS-параметров. Файл содержит секрет подключения: не добавляйте его в Git.

```bash
# Остановите dev server. Выполняйте из каждого приложения.
SOURCE=$(php bin/booking.php sql 'SELECT current_database() AS name' |
php -r '$x=json_decode(stream_get_contents(STDIN),true); echo $x[0]["name"];')
OWNER=$(php bin/booking.php sql 'SELECT current_user AS name' |
php -r '$x=json_decode(stream_get_contents(STDIN),true); echo $x[0]["name"];')
TARGET=$(php bin/test-environment.php)
ADMIN=$(docker exec booking-pg sh -c 'printf %s "${POSTGRES_USER:-postgres}"')

docker exec booking-pg createdb -U "$ADMIN" -O "$OWNER" "$TARGET"
docker exec booking-pg pg_dump -U "$ADMIN" "$SOURCE" |
docker exec -i booking-pg psql -X -v ON_ERROR_STOP=1 -U "$ADMIN" "$TARGET"
```

Создание существующей тестовой базы намеренно завершается ошибкой: скрипт не удаляет неизвестные данные автоматически.

Общие тестовые файлы:

`tests/Study/CancellationRuleTest.php`:

```php
<?php

namespace Study\Tests;

use PHPUnit\Framework\TestCase;
use Study\Booking\CancellationRule;

final class CancellationRuleTest extends TestCase
{
    public function testOwnerIsRequired(): void
    {
        $rule = new CancellationRule();
        self::assertTrue($rule->allows(1, ['user_id' => 1]));
        self::assertFalse($rule->allows(1, ['user_id' => 2]));
    }
}
```

`tests/Study/DatabaseChecks.php`:

```php
<?php

namespace Study\Tests;

use PHPUnit\Framework\Attributes\Group;
use Study\Booking\ReservationCreator;
use Study\Booking\ReserveSeats;
use Study\Booking\Store;

trait DatabaseChecks
{
    abstract protected function service(string $id): object;

    protected function fixture(): Store
    {
        $store = $this->service(Store::class);
        $database = $store->rows('SELECT current_database() AS name')[0]['name'];

        if (!str_ends_with($database, '_test')) {
            throw new \RuntimeException('Refusing to change a non-test database');
        }
        if ($store->rows('SELECT id FROM events WHERE id = 1') === []) {
            throw new \RuntimeException('Copy the established fixture database first');
        }

        $store->execute('DELETE FROM reservations WHERE event_id = 1');
        $store->execute('UPDATE events SET available_seats = 5 WHERE id = 1');

        return $store;
    }

    public function testCreatorWiring(): void
    {
        self::assertInstanceOf(
            ReservationCreator::class,
            $this->service(ReservationCreator::class)
        );
    }

    public function testRealRollback(): void
    {
        $store = $this->fixture();
        $creator = $this->service(ReservationCreator::class);

        try {
            $creator->reserve(new ReserveSeats(1, 1, 1, 'rollback15'), true);
            self::fail('Artificial failure was not raised');
        } catch (\RuntimeException $exception) {
            self::assertSame(
                'Artificial failure after debit',
                $exception->getMessage()
            );
        }

        self::assertSame(5, (int) $store->rows(
            'SELECT available_seats FROM events WHERE id = 1'
        )[0]['available_seats']);
        self::assertSame(0, (int) $store->rows(
            'SELECT count(*) AS n FROM reservations WHERE event_id = 1'
        )[0]['n']);
    }

    #[Group('race')]
    public function testTwoProcessesAndReplay(): void
    {
        $store = $this->fixture();
        $store->execute('UPDATE events SET available_seats = 1 WHERE id = 1');
        $directory = sys_get_temp_dir() . '/booking-race-' . bin2hex(random_bytes(8));
        mkdir($directory, 0700);

        $processes = [];
        try {
            foreach (['A', 'B'] as $key) {
                $pipes = [];
                $process = proc_open(
                    [PHP_BINARY, 'bin/test-race-worker.php', $directory, $key],
                    [
                        0 => ['pipe', 'r'],
                        1 => ['pipe', 'w'],
                        2 => ['pipe', 'w'],
                    ],
                    $pipes,
                    dirname(__DIR__, 2)
                );
                if (!is_resource($process)) {
                    throw new \RuntimeException('Cannot start worker');
                }
                fclose($pipes[0]);
                $processes[] = [$process, $pipes];
            }

            $codes = [];
            foreach ($processes as [$process, $pipes]) {
                $out = stream_get_contents($pipes[1]);
                $err = stream_get_contents($pipes[2]);
                fclose($pipes[1]);
                fclose($pipes[2]);
                $code = proc_close($process);
                self::assertContains($code, [0, 10], $out . $err);
                $codes[] = $code;
            }
            sort($codes);
            self::assertSame([0, 10], $codes);

            $rows = $store->rows(
                'SELECT idempotency_key FROM reservations WHERE event_id = 1'
            );
            self::assertCount(1, $rows);
            self::assertSame(0, (int) $store->rows(
                'SELECT available_seats FROM events WHERE id = 1'
            )[0]['available_seats']);

            $pipes = [];
            $process = proc_open(
                [
                    PHP_BINARY, 'bin/booking.php', 'reserve', '1',
                    $rows[0]['idempotency_key'], '1',
                ],
                [
                    0 => ['pipe', 'r'],
                    1 => ['pipe', 'w'],
                    2 => ['pipe', 'w'],
                ],
                $pipes,
                dirname(__DIR__, 2)
            );
            self::assertIsResource($process);
            fclose($pipes[0]);
            $json = stream_get_contents($pipes[1]);
            $error = stream_get_contents($pipes[2]);
            fclose($pipes[1]);
            fclose($pipes[2]);
            self::assertSame(0, proc_close($process), $error);
            self::assertTrue(json_decode($json, true, 512, JSON_THROW_ON_ERROR)['persisted']);
            self::assertSame(1, (int) $store->rows(
                'SELECT count(*) AS n FROM reservations WHERE event_id = 1'
            )[0]['n']);
        } finally {
            foreach (glob($directory . '/*') as $file) {
                unlink($file);
            }
            rmdir($directory);
        }
    }
}
```

`bin/test-race-worker.php`:

```php
<?php

use Study\Booking\Conflict;
use Study\Booking\ReserveSeats;

[$creator, $store] = require dirname(__DIR__) . '/booking/bootstrap.php';

$database = $store->rows('SELECT current_database() AS name')[0]['name'];
if (!str_ends_with($database, '_test')) {
    throw new RuntimeException('Test database required');
}

$directory = $argv[1];
$key = $argv[2];

try {
    $result = $creator->reserve(
        new ReserveSeats(1, 1, 1, $key),
        false,
        static function () use ($store, $directory, $key): void {
            $store->rows('SELECT available_seats FROM events WHERE id = 1');
            touch($directory . '/' . $key);
            $deadline = microtime(true) + 10;

            while (count(glob($directory . '/*')) < 2) {
                if (microtime(true) > $deadline) {
                    throw new RuntimeException('Barrier timeout');
                }
                usleep(10000);
            }
        }
    );
    echo json_encode($result, JSON_THROW_ON_ERROR), "\n";
} catch (Conflict $exception) {
    fwrite(STDERR, $exception->getMessage() . "\n");
    exit(10);
}
```

**Symfony.**

```bash
composer require --dev phpunit/phpunit:^11 \
  symfony/browser-kit:^7.4 symfony/css-selector:^7.4
```

`bin/phpunit`:

```php
#!/usr/bin/env php
<?php

require dirname(__DIR__) . '/vendor/phpunit/phpunit/phpunit';
```

`tests/bootstrap.php`:

```php
<?php

require dirname(__DIR__) . '/vendor/autoload.php';

(new Symfony\Component\Dotenv\Dotenv())->bootEnv(dirname(__DIR__) . '/.env');
```

`config/packages/test/study.yaml`:

```yaml
framework:
    test: true
    session:
        storage_factory_id: session.storage.factory.mock_file
```

`phpunit.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<phpunit bootstrap="tests/bootstrap.php" colors="true">
    <php>
        <env name="APP_ENV" value="test" force="true"/>
        <env name="APP_DEBUG" value="1" force="true"/>
        <env name="KERNEL_CLASS" value="App\Kernel"/>
    </php>
    <testsuites>
        <testsuite name="study">
            <directory>tests/Study</directory>
        </testsuite>
    </testsuites>
</phpunit>
```

`tests/Study/ApplicationTest.php`:

```php
<?php

namespace Study\Tests;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

require_once __DIR__ . '/DatabaseChecks.php';

final class ApplicationTest extends WebTestCase
{
    use DatabaseChecks;

    protected function service(string $id): object
    {
        return static::getContainer()->get($id);
    }

    public function testHttpReplayConflictWithCsrf(): void
    {
        $client = static::createClient();
        $this->fixture();

        $crawler = $client->request('GET', '/study/login');
        $token = $crawler->filter('input[name="_token"]')->attr('value');
        $client->request('POST', '/study/login', [
            '_token' => $token,
            'user_id' => '1',
            'secret' => 'study-only',
        ]);
        self::assertResponseStatusCodeSame(303);

        $client->request('GET', '/study/token');
        $token = json_decode(
            $client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR
        )['token'];

        $server = [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_IDEMPOTENCY_KEY' => 'http15',
            'HTTP_X_CSRF_TOKEN' => $token,
        ];

        $client->request(
            'POST', '/events/1/reservations', [], [], $server, '{"quantity":1}'
        );
        self::assertResponseStatusCodeSame(201);

        $client->request(
            'POST', '/events/1/reservations', [], [], $server, '{"quantity":2}'
        );
        self::assertResponseStatusCodeSame(409);

        unset($server['HTTP_X_CSRF_TOKEN']);
        $client->request(
            'POST', '/events/1/reservations', [], [], $server, '{"quantity":1}'
        );
        self::assertResponseStatusCodeSame(403);
    }
}
```

**Laravel.**

```bash
composer require --dev phpunit/phpunit:^11
```

`tests/TestCase.php`:

```php
<?php

namespace Tests;

abstract class TestCase extends \Illuminate\Foundation\Testing\TestCase
{
}
```

`phpunit.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<phpunit bootstrap="vendor/autoload.php" colors="true">
    <php>
        <env name="APP_ENV" value="testing" force="true"/>
    </php>
    <testsuites>
        <testsuite name="study">
            <directory>tests/Study</directory>
        </testsuite>
    </testsuites>
</phpunit>
```

`tests/Study/ApplicationTest.php`:

```php
<?php

namespace Study\Tests;

use Study\Booking\StudyUser;
use Tests\TestCase;

require_once __DIR__ . '/DatabaseChecks.php';

final class ApplicationTest extends TestCase
{
    use DatabaseChecks;

    protected function service(string $id): object
    {
        return $this->app->make($id);
    }

    public function testHttpReplayConflictWithCsrf(): void
    {
        $this->fixture();

        $this->actingAs(StudyUser::findOrFail(1), 'study')
            ->withSession(['_token' => 'test-csrf-15']);

        $headers = [
            'Idempotency-Key' => 'http15',
            'X-CSRF-TOKEN' => 'test-csrf-15',
        ];

        $this->postJson(
            '/events/1/reservations', ['quantity' => 1], $headers
        )->assertStatus(201);

        $this->postJson(
            '/events/1/reservations', ['quantity' => 2], $headers
        )->assertStatus(409);

        $this->postJson(
            '/events/1/reservations',
            ['quantity' => 1],
            ['Idempotency-Key' => 'http15']
        )->assertStatus(419);
    }
}
```

```bash
# Symfony:
php bin/phpunit --exclude-group race
php bin/phpunit --group race

# Laravel:
php artisan config:clear
php artisan test --exclude-group race
php artisan test --group race
```

Основной запуск содержит четыре проверки: правило, сборка, HTTP-граница, откат. Отдельная группа — конкурентный запуск и повтор новым процессом. Победитель гонки не фиксирован; допустимы A или B, но итог всегда один: остаток 0, одна бронь.

**Вывод примера 15 — тест доказывает пройденную границу:** чистое правило, контейнер, HTTP и PostgreSQL требуют разных наблюдений.

### 15.4. Ловушка №15: замокать ORM и объявить запись проверенной

Замоканные `save()` и `flush()` подтверждают только взаимодействие с двойником. SQLite не воспроизводит выбранную блокировку PostgreSQL. Happy path не проверяет откат после первого изменения.

Исправленный набор оставляет unit-тест маленьким, но критическую запись проверяет настоящим соединением. Внешняя тестовая транзакция здесь не ускорение без последствий: она меняет видимость данных и смысл commit.

### 15.5. Соглашения и опытное суждение

| Риск | Минимально достаточная граница |
|---|---|
| Ошибка правила владельца | Unit |
| Неверный binding | Контейнер |
| Неверный статус / CSRF-путь | HTTP |
| Частичная запись | PostgreSQL integration |
| Перепродажа последнего места | Независимые процессы и соединения |

**Как думают опытные.** Тест должен ломаться при том дефекте, от которого обещает защищать. Если удалить транзакцию, проверка отката обязана перестать проходить.

---

## Часть 16. Диагностика и инструменты: от симптома к проверяемой причине

### 16.1. Какую проблему мы сейчас решаем

Медленная страница и HTTP 500 — симптомы, а не диагнозы. Очистка всех кэшей иногда меняет проявление, но уничтожает полезное свидетельство и не объясняет причину.

Нам нужны запрос, его корреляционный идентификатор из части 2, наблюдения SQL и путь исключения к обработчику. **Инвариант диагностики**: объяснение опирается на наблюдение нужной границы, а ответ без debug не раскрывает внутренности приложения.

Это **М1** и **М5**: сначала определяем, где событие произошло, затем — что выбранный инструмент действительно позволяет заключить.

### 16.2. Как это устроено внутри

Исключение поднимается до обработчика ошибок. Лог сохраняет безопасный контекст; profiler собирает сведения конкретного запроса: маршрут, время, SQL и конфигурацию. Symfony profiler и Laravel Telescope не объявляем полными аналогами. Telescope здесь не устанавливаем: уже имеющегося `DB::listen`, логирования и Artisan достаточно.

Счётчик запросов показывает количество, но не доказывает причину долгого выполнения каждого SQL. Контейнерная диагностика показывает регистрацию, но окончательно совместимость зависимости проверяется при создании объекта.

Почему это важно: неправильный инструмент легко даёт правдивое наблюдение с ложным выводом. `X-Render-SQL: 0` не означает, что контроллер до рендера не выполнил N+1.

### 16.3. Минимальный пример, который действительно что-то доказывает

Добавим диагностический read service, общий для двух приложений.

`booking/EventListReader.php`:

```php
<?php

namespace Study\Booking;

final class EventListReader
{
    public function __construct(private Store $store) {}

    public function read(bool $bad): array
    {
        if (!$bad) {
            return $this->store->rows(
                'SELECT e.id, e.title,
                    (SELECT count(*) FROM reservations r WHERE r.event_id = e.id)
                        AS reservation_count
                 FROM events e ORDER BY e.id LIMIT 2'
            );
        }

        $events = $this->store->rows(
            'SELECT id, title FROM events ORDER BY id LIMIT 2'
        );
        foreach ($events as &$event) {
            $event['reservation_count'] = $this->store->rows(
                'SELECT count(*) AS n FROM reservations WHERE event_id = ?',
                [$event['id']]
            )[0]['n'];
        }
        unset($event);

        return $events;
    }
}
```

Плохая ветвь намеренно воспроизводит форму N+1 из части 8. Это диагностический переключатель, не пользовательский параметр.

Заменяем `booking/ViewController.php` в Symfony:

```php
<?php

namespace Study\Booking;

use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Twig\Environment;

final class ViewController
{
    public function __construct(
        private Store $store,
        private Environment $twig,
        private RenderCounter $counter,
    ) {}

    #[Route('/booking-events', methods: ['GET'])]
    public function __invoke(): Response
    {
        $start = $this->counter->queries;
        $events = (new EventListReader($this->store))->read(
            getenv('STUDY_N_PLUS_ONE') === '1'
        );
        $beforeRender = $this->counter->queries;
        $html = $this->twig->render('booking/events.html.twig', [
            'events' => $events,
        ]);

        return new Response($html, 200, [
            'X-Read-SQL' => (string) ($beforeRender - $start),
            'X-Render-SQL' => (string) ($this->counter->queries - $beforeRender),
        ]);
    }
}
```

В Laravel:

```php
<?php

namespace Study\Booking;

use Symfony\Component\HttpFoundation\Response;

final class ViewController
{
    public function __construct(
        private Store $store,
        private RenderCounter $counter,
    ) {}

    public function __invoke(): Response
    {
        $start = $this->counter->queries;
        $events = (new EventListReader($this->store))->read(
            getenv('STUDY_N_PLUS_ONE') === '1'
        );
        $beforeRender = $this->counter->queries;
        $html = view('booking.events', ['events' => $events])->render();

        return new Response($html, 200, [
            'Content-Type' => 'text/html; charset=UTF-8',
            'X-Read-SQL' => (string) ($beforeRender - $start),
            'X-Render-SQL' => (string) ($this->counter->queries - $beforeRender),
        ]);
    }
}
```

Для второй неисправности добавим ограниченный диагностический endpoint и безопасное журналирование.

Общий `booking/RequestCorrelation.php`:

```php
<?php

namespace Study\Booking;

final class RequestCorrelation
{
    public static function id(mixed $existing, ?string $header): string
    {
        foreach ([$existing, $header] as $candidate) {
            if (is_string($candidate)
                && preg_match('/\A[A-Za-z0-9_-]{1,80}\z/', $candidate) === 1) {
                return $candidate;
            }
        }

        return bin2hex(random_bytes(16));
    }
}
```

Используем уже установленный атрибут `request_id`, если он есть; иначе валидированный заголовок либо новый идентификатор. Пароли, cookie, CSRF-токены и тело запроса в контекст не попадают.

**Symfony.** `booking/Diagnostics.php`:

```php
<?php

namespace Study\Booking;

use Psr\Log\LoggerInterface;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\DependencyInjection\Reference;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Bundle\Bundle;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\Routing\Attribute\Route;

final class FaultController
{
    public function __construct(private ReservationCreator $creator) {}

    #[Route('/study/fault', methods: ['GET'])]
    public function __invoke(): JsonResponse
    {
        return new JsonResponse(['resolved' => true]);
    }
}

final class FaultListener
{
    public function __construct(
        private LoggerInterface $logger,
        private bool $debug,
    ) {}

    public function onException(ExceptionEvent $event): void
    {
        $request = $event->getRequest();
        if ($request->getPathInfo() !== '/study/fault') {
            return;
        }

        $id = RequestCorrelation::id(
            $request->attributes->get('request_id'),
            $request->headers->get('X-Request-ID')
        );
        $request->attributes->set('request_id', $id);

        $this->logger->error('booking.request_failed', [
            'request_id' => $id,
            'exception_type' => get_class($event->getThrowable()),
        ]);

        if (!$this->debug) {
            $event->setResponse(new JsonResponse(
                ['error' => 'Internal server error', 'request_id' => $id],
                500,
                ['X-Request-ID' => $id]
            ));
        }
    }
}

final class DiagnosticsBundle extends Bundle
{
    public function build(ContainerBuilder $container): void
    {
        parent::build($container);

        if (getenv('STUDY_BAD_CLOCK') === '1') {
            $container->register(Clock::class, \stdClass::class);
        }

        $container->register(FaultController::class)
            ->setArguments([new Reference(ReservationCreator::class)])
            ->addTag('controller.service_arguments')
            ->setPublic(true);

        $container->register(FaultListener::class)
            ->setArguments([
                new Reference('logger'),
                '%kernel.debug%',
            ])
            ->addTag('kernel.event_listener', [
                'event' => 'kernel.exception',
                'method' => 'onException',
                'priority' => 100,
            ]);
    }
}
```

`config/routes/study_diagnostics.yaml`:

```yaml
study_diagnostics:
    resource: ../../booking/Diagnostics.php
    type: attribute
```

**Laravel.** `booking/Diagnostics.php`:

```php
<?php

namespace Study\Booking;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

final class FaultBoundary
{
    public function handle(Request $request, Closure $next)
    {
        try {
            return $next($request);
        } catch (\Throwable $exception) {
            $id = RequestCorrelation::id(
                $request->attributes->get('request_id'),
                $request->header('X-Request-ID')
            );
            $request->attributes->set('request_id', $id);

            Log::error('booking.request_failed', [
                'request_id' => $id,
                'exception_type' => get_class($exception),
            ]);

            if (config('app.debug')) {
                throw $exception;
            }

            return response()->json(
                ['error' => 'Internal server error', 'request_id' => $id],
                500,
                ['X-Request-ID' => $id]
            );
        }
    }
}

final class DiagnosticsProvider extends ServiceProvider
{
    public function register(): void
    {
        if (getenv('STUDY_BAD_CLOCK') === '1') {
            $this->app->bind(Clock::class, fn () => new \stdClass());
        }
    }

    public function boot(): void
    {
        Route::get('/study/fault', function () {
            app(ReservationCreator::class);

            return response()->json(['resolved' => true]);
        })->middleware(FaultBoundary::class);
    }
}
```

```bash
composer dump-autoload

# Symfony:
php bin/register-study.php 'Study\Booking\DiagnosticsBundle'
# Laravel:
php bin/register-study.php 'Study\Booking\DiagnosticsProvider'
```

Остановите прежний сервер. Запускайте каждый опыт в отдельном терминале; после проверки остановите его через Ctrl+C.

```bash
# Symfony:
STUDY_N_PLUS_ONE=1 APP_ENV=dev APP_DEBUG=1 \
php -S 127.0.0.1:8001 -t public public/index.php

# Laravel:
STUDY_N_PLUS_ONE=1 APP_DEBUG=true \
php -S 127.0.0.1:8002 -t public public/index.php
```

```bash
curl -sS -D - http://localhost:8001/booking-events -o /dev/null
curl -sS -D - http://localhost:8002/booking-events -o /dev/null
```

**Гипотеза:** на каждый элемент списка приходится дополнительный SQL. **Наблюдение:** у двух существующих событий `X-Read-SQL: 3`, но `X-Render-SQL: 0`. **Исправление:** перезапустите без `STUDY_N_PLUS_ONE`; теперь `X-Read-SQL: 1`. Это устраняет round trips, но само по себе не доказывает оптимальность SQL-плана.

Второй опыт: **гипотеза** — `Clock` связан с объектом неправильного типа. Проверяем сборку и запрос, не меняя данные.

```bash
# Symfony: отдельное окружение, чтобы не менять рабочий dev-контейнер.
STUDY_BAD_CLOCK=1 APP_ENV=diagnostic APP_DEBUG=0 \
php bin/console debug:container 'Study\Booking\Clock' --show-arguments

STUDY_BAD_CLOCK=1 APP_ENV=diagnostic APP_DEBUG=0 \
php -S 127.0.0.1:8001 -t public public/index.php

# Laravel: конфигурационный кэш должен быть выключен для этого env-опыта.
php artisan config:clear
STUDY_BAD_CLOCK=1 APP_DEBUG=false \
php -S 127.0.0.1:8002 -t public public/index.php
```

```bash
curl -i -H 'X-Request-ID: fault16' http://localhost:8001/study/fault
curl -i -H 'X-Request-ID: fault16' http://localhost:8002/study/fault
```

Для показанного неверного binding ожидается **500** без stack trace:

```json
{"error":"Internal server error","request_id":"fault16"}
```

```bash
# Symfony: Monolog может писать production-подобное окружение в stderr;
# сохраните вывод сервера либо проверьте настроенный файловый handler.
grep 'fault16' var/log/diagnostic.log

# Laravel:
grep 'fault16' storage/logs/laravel.log
```

**Схематическое свидетельство:**

```text
booking.request_failed request_id=fault16 exception_type=TypeError
```

Если конфигурация контейнера обнаружит несовместимость ещё при компиляции, это более ранний допустимый отказ: HTTP-обработчик тогда не запустится. Для HTTP-опыта нужно использовать лениво разрешаемую фабрику неправильного объекта, а не выдавать ошибку сборки за выполненный запрос.

Исправление — убрать `STUDY_BAD_CLOCK` и пересобрать только диагностический контейнер Symfony, поскольку именно он сохранил неверную регистрацию:

```bash
# После остановки серверов:
APP_ENV=diagnostic APP_DEBUG=0 php bin/console cache:clear

# Затем обычные запуски без STUDY_BAD_CLOCK:
# Symfony: APP_ENV=diagnostic APP_DEBUG=0 php -S 127.0.0.1:8001 -t public public/index.php
# Laravel: APP_DEBUG=false php -S 127.0.0.1:8002 -t public public/index.php
```

Теперь `/study/fault` возвращает **200**, `{"resolved":true}`. Диагностические endpoints и переключатели не публикуйте во внешней среде.

**Вывод примера 16 — причина проверяется адресным наблюдением:** счётчик отделил чтение от рендера, а корреляция связала безопасный ответ с ошибкой сборки зависимости.

### 16.4. Ловушка №16: лечить симптом очисткой всех кешей

Случайный `cache:clear` не исправляет ошибочную регистрацию: при следующей сборке она повторится. Debug в production раскрывает детали, а логирование всего запроса способно раскрыть секреты.

Исправленный маршрут сохраняет свидетельство, формулирует гипотезу и меняет установленную причину. Очистка конкретного контейнерного кэша после изменения регистрации имеет объяснение; ритуальное удаление всех кэшей — нет.

### 16.5. Соглашения и опытное суждение

| Вопрос | Инструмент | Чего он не доказывает |
|---|---|---|
| Где появился лишний SQL? | Счётчик, `DB::listen`, DBAL middleware, profiler | Оптимальность каждого плана |
| Как собран сервис? | `debug:container`, разрешение Laravel container | Правильность бизнес-алгоритма |
| Какой запрос упал? | Коррелированный лог | Полноту всех исполнений |
| Что увидел клиент? | HTTP-проверка с выключенным debug | Отсутствие утечек во всех других маршрутах |

**Как думают опытные.** Сначала сохраните свидетельство неисправности, затем исправляйте её. Иначе вы получите работающую систему без проверенного объяснения, почему она перестала ломаться.

---

## Часть 17. Заблуждения, ловушки, антипаттерны — сводка

Эта часть не вводит нового материала. Она собирает вместе то, что уже было разобрано на трассах, измерениях и тестах, чтобы к сводке можно было возвращаться без перечитывания всего урока. Каждая строка таблиц ссылается на часть, где утверждение проверялось наблюдением, а не рассуждением.

### 17.1. Таблица заблуждений: утверждение, механизм, контрпример

| Заблуждение | Механизм и контрпример | Где разобрано |
|---|---|---|
| 1. Правку зависимости можно сделать в `vendor/` | `composer install` восстанавливает дерево из lock-файла; правка исчезает у второго разработчика | Часть 1 (ловушка №1) |
| 2. Запрос начинается в контроллере | До контроллера отрабатывают фронт-контроллер, ядро и middleware; запрос может завершиться, не дойдя до метода | Часть 2 (ловушка №2) |
| 3. Совпавший маршрут даёт проверенные данные | Маршрут проверяет форму пути, не смысл значения: `{id}` совпал, события нет — нужен 404, а не 500 | Часть 3 (ловушка №3) |
| 4. Всё можно провалидировать одним `catch` | Отсутствие ресурса, неверный ввод и отказ БД требуют разных ответов; один `catch` превращает 500 в 400 | Часть 4 (ловушка №4) |
| 5. Локатор внутри операции — это тоже DI | Зависимость перестаёт быть видимой в сигнатуре, граф выполнения перестаёт читаться | Часть 5 (ловушка №5) |
| 6. Конфигурация может хранить состояние пользователя | Настройка живёт дольше запроса; в worker и после кеширования конфигурации состояние протекает между запросами | Часть 6 (ловушка №6) |
| 7. Изменение объекта — это изменение базы | Изменение попадает в БД на flush/commit; до этого память и БД расходятся | Часть 7 (ловушка №7) |
| 8. N+1 лечится тотальной жадной загрузкой | Замер SQL показывает: один запрос заменяется несколькими тяжёлыми, объём выборки растёт | Часть 8 (ловушка №8) |
| 9. Последовательность `save` атомарна | Сбой между двумя записями оставляет половину результата; нужна явная граница транзакции | Часть 9 (ловушка №9) |
| 10. Транзакция защищает от любой гонки | Два процесса читают одинаковое `available_seats`; нужна блокировка строки или ограничение БД | Часть 10 (ловушка №10) |
| 11. Целостность обеспечит валидатор или автодифф миграций | Валидатор работает в одном процессе; автодифф не знает о непустых данных — нужны `UNIQUE`, `CHECK`, поэтапный `NOT NULL` | Часть 11 (ловушка №11) |
| 12. Отображение чинится `raw` и запросом в шаблоне | `raw` открывает XSS, запрос в шаблоне возвращает N+1 в слое, где его не измеряют | Часть 12 (ловушка №12) |
| 13. Вошедший пользователь уполномочен | Пользователь 2 успешно входит и пытается отменить бронь пользователя 1; нужна проверка владения | Часть 13 (ловушка №13) |
| 14. Обязательный инвариант можно разложить по listeners | Слушатель может быть не зарегистрирован или отработать вне транзакции; обязательное остаётся в операции | Часть 14 (ловушка №14) |
| 15. Замоканный ORM доказывает запись | Мок подтверждает вызов, а не сохранение; реальный откат ловит то, что мок пропускает | Часть 15 (ловушка №15) |
| 16. Симптом лечится очисткой всех кешей | Очистка стирает наблюдаемые следы; дефект возвращается, а причина не установлена | Часть 16 (ловушка №16) |

Сравнительные заблуждения — без номеров, потому что это не ловушки кода, а искажения картины двух фреймворков. Symfony не лишён соглашений и автоматизма: автоконфигурация сервисов, атрибуты маршрутов и рецепты Flex делают за разработчика значительную часть работы. Laravel не исключает явных зависимостей и архитектурных границ: конструктор класса, привязки в провайдере и отдельный прикладной сервис в нём столь же законны, как фасад. Фасад — не «статический глобальный объект» в бытовом смысле: это статический прокси к записи контейнера, что и позволяет подменять его в тестах. Laravel использует компоненты Symfony (HttpFoundation, Routing, Console и другие), но не повторяет Symfony Framework целиком: ядро, контейнер и конфигурация у него свои. Наконец, Data Mapper сам по себе не обеспечивает «чистый домен» — сущность легко превращается в анемичную структуру с логикой в контроллере; Active Record сам по себе не запрещает прикладные сервисы — `ReservationCreator` из части 9 остаётся уместным и там.

### 17.2. Сквозные ловушки №1–16

| Ловушка | Симптом | Причина | Проверка / исправление | Часть |
|---|---|---|---|---|
| №1 исправлять зависимость внутри vendor | «У меня работает» | Правка вне lock-файла | `git status`, форк или патч-пакет | 1 |
| №2 считать контроллер началом и концом запроса | Ответ без входа в метод | Ранний выход в middleware | Трасса ядра, профайлер | 2 |
| №3 принимать совпавший маршрут за проверенные данные | 500 вместо 404 | Форма пути ≠ существование | Тест на несуществующий id | 3 |
| №4 валидировать всё одним catch | Отказ БД как 400 | Смешение классов ошибок | Три разных ответа | 4 |
| №5 спрятать service locator внутри бизнес-операции | Тест требует контейнер | Неявная зависимость | Зависимости в конструкторе | 5 |
| №6 смешивать конфигурацию и состояние пользователя | Чужие данные в ответе | Долгоживущий singleton | Проверка в worker/после кеша | 6 |
| №7 считать изменение объекта изменением базы | «Сохранил», а в БД пусто | Нет flush/commit | `X-Read-SQL`, чтение из БД | 7 |
| №8 лечить N+1 тотальной eager loading | Медленный список | Жадность вместо выборки | Счётчик и текст SQL | 8 |
| №9 принять последовательность save за атомарную операцию | Полурезультат после сбоя | Нет границы транзакции | Искусственный сбой в середине | 9 |
| №10 считать транзакцию защитой от любой гонки | Мест меньше нуля | Чтение без блокировки | Два процесса + `FOR UPDATE` | 10 |
| №11 доверить целостность только валидатору или автодиффу | Дубли, отрицательные места | Нет ограничений в схеме | `UNIQUE`, `CHECK`, поэтапный `NOT NULL` | 11 |
| №12 лечить отображение с помощью raw и запросов в шаблоне | XSS, всплеск SQL | Логика в представлении | Экранирование, `X-Render-SQL` | 12 |
| №13 считать вошедшего пользователя уполномоченным | Отмена чужой брони | Аутентификация вместо авторизации | Voter/policy, тест пользователя 2 | 13 |
| №14 распределить обязательный инвариант по listeners | Иногда не выполняется | Опциональная цепь | Обязательное — в операции | 14 |
| №15 замокать ORM и объявить запись проверенной | Зелёные тесты, битые данные | Проверен вызов, не результат | Реальная PostgreSQL и откат | 15 |
| №16 лечить симптом очисткой всех кешей | Возврат дефекта | Стёрты наблюдения | Корреляция по request-id | 16 |

### 17.3. Антипаттерны, которые возникают из сочетания ловушек

**Толстый контроллер** (№2 + №3 + №9) выглядит разумно: вся операция видна в одном месте. Ущерб накапливается, когда ту же операцию нужно вызвать из консоли или очереди, а границу транзакции приходится дублировать. Замена — прикладной сервис вроде `ReservationCreator`, контроллер оставляет себе разбор входа и выбор ответа.

**Скрытый service locator** (№5 + №15) кажется способом не «загромождать» конструктор. Со временем ни один тест не запускается без контейнера, а состав зависимостей известен только по коду метода. Замена — явные параметры конструктора и интерфейсы.

**ORM в шаблоне** (№8 + №12) удобно на первой странице. Дальше рост числа запросов не виден там, где его измеряют, а часть данных экранируется, часть — нет. Замена — подготовка данных в контроллере или в объекте представления, `X-Render-SQL` как порог.

**Обязательная операция через цепь событий** (№14 + №9) выглядит «слабой связанностью». Ущерб — операция иногда не выполняется, и причину не найти. Замена — обязательное выполняется внутри границы транзакции, `ReservationCreated` остаётся для необязательного, синхронно после commit.

**Mock-only persistence tests** (№15 + №7 + №11) дают быструю зелёную сборку. Накапливается ложная уверенность: ни ограничения схемы, ни откат не проверены. Замена — уровень тестов на реальной PostgreSQL, включая проверку отката.

**Конфигурация как пользовательское состояние** (№6 + №16) выглядит экономией: «положим текущего пользователя в сервис». Ущерб проявляется только в worker или после кеширования конфигурации и лечится «очисткой кешей». Замена — состояние передаётся аргументом, настройка остаётся неизменяемой.

### 17.4. Диагностический чек-лист перед усложнением архитектуры

1. **Где вход?** Какой фронт-контроллер, какие middleware, доходит ли запрос до метода (часть 2).
2. **Кто создаёт объект?** Контейнер, фабрика или `new` в методе; видна ли зависимость в сигнатуре (часть 5).
3. **Когда выполняется SQL?** В момент изменения объекта или на flush/commit; сколько запросов на страницу (части 7–8).
4. **Где commit?** Какая операция целиком атомарна и что происходит при сбое в середине (часть 9).
5. **Кто может выполнить операцию одновременно?** Есть ли блокировка строки, ограничение БД, ключ идемпотентности (части 10–11).
6. **Каким наблюдением проверяется предположение?** Тест на реальной БД, замер SQL, заголовки диагностики и request-id (части 15–16).

---

## Часть 18. Как думают великие (ментальные модели)

### 18.1. Граф выполнения: кто решил вызвать этот код

**Определение.** Код никогда не «запускается сам»: у каждого вызова есть вызывающий, и цепочку от точки входа до метода можно выписать целиком.

Модель уже предсказала две вещи: что ответ может вернуться без входа в контроллер (часть 2) и что зарегистрированный слушатель `ReservationCreated` — часть графа, а не магия события (часть 14). **Новый вопрос:** если middleware завершает запрос до контроллера, где в вашем приложении зафиксирован request-id, по которому этот запрос вообще можно найти?

**Предел применимости.** Граф перестаёт быть однонаправленным там, где выполнение уходит в другой процесс: команда, поставленная в очередь, продолжится в worker с другой конфигурацией и другим временем жизни объектов — там нужна модель М2, а не продолжение той же трассы.

### 18.2. Три времени: настройка графа, создание объекта, выполнение операции

**Определение.** Разделяйте момент, когда описывается, как строить объект; момент, когда объект строится; и момент, когда над ним выполняется операция.

Модель объяснила, почему состояние пользователя в сервисе-одиночке протекает (часть 6) и почему регистрация локального пакета `study/confirmation-formatter` относится к настройке, а вызов форматтера — к выполнению (часть 14). **Новый вопрос:** что изменится в вашем приложении после `config:cache`, если значение читается из окружения не в момент настройки, а внутри метода?

**Предел применимости.** В долгоживущем worker граница между «созданием» и «выполнением» размывается: один экземпляр обслуживает сотни задач, и то, что в HTTP-запросе было безопасным полем, становится общим состоянием.

### 18.3. Память объектов и база данных — две разные реальности

**Определение.** Объект в памяти и строка в БД синхронны только в моменты записи и чтения; между ними они расходятся.

Модель предсказала, что изменение сущности без flush не видно другому процессу (часть 7) и что число запросов на странице определяется стратегией загрузки, а не числом объектов (часть 8). **Новый вопрос:** после `rollback` объект брони остаётся в памяти заполненным — какой ваш код примет его за сохранённый?

**Предел применимости.** Модель молчит о репликации: строка, зафиксированная на первичном узле, может не читаться с реплики; «БД» здесь перестаёт быть одной реальностью.

### 18.4. Инвариант требует точки принятия решения

**Определение.** Правило соблюдается не там, где оно записано, а там, где кто-то один принимает решение с достаточными гарантиями.

Модель показала, почему `available_seats >= 0` нужен и в коде, и в `CHECK` (часть 11) и почему проверку владения нельзя заменить фактом входа (часть 13). **Новый вопрос:** в гонке за последнее место кто у вас принимает решение — прочитанное значение в PHP или строка, удерживаемая `FOR UPDATE`?

**Предел применимости.** Для инвариантов, охватывающих две системы (бронь и внешний платёж), одной точки решения не существует — там появляются компенсация и повторная попытка, а не транзакция.

### 18.5. Граница доказательства: что именно подтвердил тест или profiler

**Определение.** Всякое наблюдение доказывает узкое утверждение; расширять его на соседние вопросы нельзя.

Модель объяснила, почему счётчик запросов доказывает N+1, но не корректность данных (часть 8), и почему групповой тест на двух процессах доказывает поведение при конфликте, а не отсутствие гонок вообще (часть 15). **Новый вопрос:** зелёный тест с моком репозитория — какое именно утверждение он подтвердил, если проверка отката на реальной PostgreSQL не запускалась?

**Предел применимости.** Диагностические заголовки `X-Read-SQL`/`X-Render-SQL` измеряют один процесс: под нагрузкой они не покажут ни ожидание блокировки, ни исчерпание пула соединений.

---

## Часть 19. Упражнения и проекты

### 19.1. Уровень 1: базовые сущности

**«Фильтр событий по дате».** Добавьте к списку событий параметр запроса с датой. Нормализуйте значение к единому формату и часовому поясу; недопустимое значение должно давать ответ об ошибке ввода, а не пустой список и не 500. В отчёт вынесите фактический SQL выборки — покажите, что фильтр выполняется в базе, а не в PHP после загрузки всех строк.

**«JSON- и HTML-представление одного ресурса».** Отдайте одно и то же событие в двух представлениях. Условие: прикладная операция (поиск и подготовка данных) не дублируется — оба контроллера вызывают один сервис, различаются только формированием ответа. Проверьте, что при отсутствии события оба формата дают согласованный статус.

### 19.2. Уровень 2: абстракции, ошибки и тесты

**«Clock и правило срока отмены».** Введите правило: отмена возможна не позднее чем за N часов до начала события. Время берите только через `Clock`. Тестами докажите три случая — до границы, ровно на границе и после неё; тест не должен зависеть от реального системного времени.

**«Три ответа об ошибках».** Реализуйте и покажите три разных исхода: несуществующее событие, неверный ввод, недоступная база данных. Требование — технический сбой не маскируется под пользовательскую ошибку: недоступность БД не должна приходить клиенту как 400 с текстом о неверном поле. В отчёт включите, где именно каждый случай превращается в ответ.

### 19.3. Уровень 3: трудная центральная область

**«Гонка за последнее место двумя способами».** Реализуйте защиту последнего места двумя вариантами: блокировкой строки (`FOR UPDATE`) и ограничением базы (`CHECK` плюс обработка нарушения). Запустите два конкурирующих процесса, сравните тексты SQL и поведение при конфликте: кто ждёт, кто получает ошибку, каким становится ответ клиенту.

**«Идемпотентность создания».** На `POST /events/{id}/reservations` с ключом идемпотентности проверьте два сценария: одновременный повтор одинакового запроса (второй должен получить тот же результат, а не 500 от `UNIQUE(user_id, idempotency_key)`) и повтор того же ключа с другим содержимым (должен быть явно отклонён, а не молча воспроизведён).

**«Схема непустой БД».** На базе с данными добавьте новое обязательное поле и новое ограничение. Требование: прошлые данные сохранены, новые ограничения действуют, миграция выполняется поэтапно (nullable → заполнение → `NOT NULL`) и откатывается. Покажите проверку на копии наполненной базы.

### 19.4. Уровень 4: портфолио-проекты

**«Сервис бронирования» (один фреймворк).** Полный вертикальный срез: HTTP-контракт со статусами 201/409/400, HTML-страницы с экранированием, сессионный вход и права владельца, транзакционная операция создания, повторы по ключу идемпотентности, интеграционные тесты на реальной PostgreSQL и отчёт о числе и тексте SQL-запросов на ключевых страницах.
*Критерии приёмки:* конкурирующие процессы не создают отрицательный остаток; повтор не создаёт вторую бронь; чужая бронь не отменяется; после отката в БД нет частичных данных.
*Команды проверки:* установка из lock-файла, миграции на пустой и на наполненной базе, прогон групп тестов (включая гоночную), запрос с диагностическими заголовками.
*Журнал решений:* 5–10 записей вида «решение — альтернатива — почему отвергнута».

**«Мини-сервис складского резерва» (второй фреймворк).** Один трудный срез: резерв товара с конкурентным списанием и идемпотентным повтором. Обязательна записка: какие решения перенеслись буквально (границы операции, ключ идемпотентности, ограничения схемы), а какие пришлось изменить из-за различий ORM и контейнера (момент записи, способ регистрации зависимостей, форма тестового отката). Критерии приёмки и команды проверки — те же по смыслу, объём меньше.

### 19.5. Вызовы на понимание

Ответ на каждый — короткое объяснение плюс наблюдение, которое его подтверждает.

1. Почему метод контроллера не был вызван, хотя маршрут совпал?
2. Когда именно изменение entity попадёт в БД и что произойдёт, если процесс завершится раньше?
3. Почему `with()` не означает один JOIN и как это увидеть?
4. Почему транзакция не защитила последнее место?
5. Что изменится в поведении приложения после кеширования конфигурации?
6. Почему после `rollback` объект в памяти вводит в заблуждение?
7. Какую ошибку скрыл мок репозитория?
8. Почему действительный CSRF-токен не даёт права отменять чужую бронь?

---

## Часть 20. Ресурсы

Каждая позиция сопровождается формулой «читать для такого вопроса; не ожидать ответа на такой». Ссылки вне `symfony.com/doc/7.4` и `laravel.com/docs/11.x` проверены при миграции (2026-09-11); для Doctrine ORM и PHPUnit указаны ветки учебной базы.

### 20.1. Обязательный минимум

| Источник | Читать для вопроса | Не ожидать ответа на |
|---|---|---|
| Symfony 7.4 Documentation — https://symfony.com/doc/7.4/index.html | состав и версии возможностей фреймворка | выбор архитектуры вашего домена |
| HttpKernel Component — https://symfony.com/doc/7.4/components/http_kernel.html | порядок событий от запроса до ответа | причины конкретной задержки |
| Service Container — https://symfony.com/doc/7.4/service_container.html | как объявляются и собираются зависимости | когда уместен локатор |
| Databases and Doctrine — https://symfony.com/doc/7.4/doctrine.html | момент flush, связи, миграции | стратегию против гонок |
| Testing — https://symfony.com/doc/7.4/testing.html | виды тестов и клиент ядра | границу доказательства вашего теста |
| Laravel 11 Documentation — https://laravel.com/docs/11.x | обзор возможностей | сравнение с Symfony |
| Request Lifecycle — https://laravel.com/docs/11.x/lifecycle | что происходит до контроллера | поведение в очереди |
| Service Container — https://laravel.com/docs/11.x/container | привязки, singleton, разрешение | последствия долгоживущего worker |
| Configuration — https://laravel.com/docs/11.x/configuration | порядок чтения и `config:cache` | хранение пользовательского состояния |
| Eloquent — https://laravel.com/docs/11.x/eloquent | Active Record, отношения, `with()` | число запросов в вашем шаблоне |
| Database Transactions — https://laravel.com/docs/11.x/database | границы транзакции и блокировки | уровни изоляции PostgreSQL |
| Testing — https://laravel.com/docs/11.x/testing | тестовая база и откат | ценность мока |

### 20.2. Книги

Martin Fowler, *Patterns of Enterprise Application Architecture* — https://martinfowler.com/books/eaa.html (проверено 2026-09-11). Читать для вопроса: чем Data Mapper отличается от Active Record и зачем нужен Unit of Work. Не ожидать: пошагового руководства по Symfony 7.4 и Laravel 11.

Второй современной книги, привязанной именно к этим версиям, здесь не зафиксировано. Честнее оставить раздел коротким, чем заполнять его изданиями по устаревшим веткам.

### 20.3. Статьи и доклады

- Data Mapper — https://martinfowler.com/eaaCatalog/dataMapper.html (проверено 2026-09-11). Читать: зачем отделять модель от хранения; не ожидать: рецептов Doctrine.
- Active Record — https://martinfowler.com/eaaCatalog/activeRecord.html (проверено 2026-09-11). Читать: где паттерн выигрывает; не ожидать: критики Eloquent.
- Unit of Work — https://martinfowler.com/eaaCatalog/unitOfWork.html (проверено 2026-09-11). Читать: почему запись откладывается; не ожидать: поведения flush в вашей версии.
- Inversion of Control Containers and the Dependency Injection pattern — https://martinfowler.com/articles/injection.html (проверено 2026-09-11). Читать: различие DI и локатора; не ожидать: конфигурации контейнеров этих фреймворков.

Подходящего доклада под выбранные версии не подобрано — раздел оставлен без наполнения.

### 20.4. Практика

- Create your own PHP Framework — https://symfony.com/doc/7.4/create_framework/index.html. Читать: из чего складывается цикл запроса; не ожидать: готовой архитектуры приложения.
- Laravel Validation — https://laravel.com/docs/11.x/validation. Читать: формы правил и ответы; не ожидать: разделения классов ошибок.
- Laravel Authorization — https://laravel.com/docs/11.x/authorization. Читать: policy и проверка владения; не ожидать: модели угроз.

Основная практика — задания части 19; перечисленное служит опорой к ним.

### 20.5. Инструменты

- Symfony Profiler — https://symfony.com/doc/7.4/profiler.html. Читать: трасса и запросы одного обращения; не ожидать: поведения под нагрузкой.
- Laravel Telescope — https://laravel.com/docs/11.x/telescope (опционально). Читать: наблюдение запросов и задач; не ожидать: замены тестов.
- Composer Basic Usage — https://getcomposer.org/doc/01-basic-usage.md (проверено 2026-09-11). Читать: роль lock-файла; не ожидать: политики версий вашей команды.
- PHP Manual — https://www.php.net/manual/en/ (проверено 2026-09-11). Читать: поведение языка и типов; не ожидать: практик фреймворков.
- Doctrine ORM Documentation — https://www.doctrine-project.org/projects/doctrine-orm/en/3.8/index.html (проверено 2026-09-11; ORM 3.x — сверяйте ветку с версией из composer.lock). Читать: состояния сущностей и flush; не ожидать: рекомендаций по гонкам.
- PostgreSQL 16 Transaction Isolation — https://www.postgresql.org/docs/16/transaction-iso.html (проверено 2026-09-11). Читать: что гарантирует уровень изоляции; не ожидать: рецептов ORM.
- PHPUnit — https://docs.phpunit.de/en/11.5/ (проверено 2026-09-11; ветка 11.x). Читать: устройство тестов и групп; не ожидать: границы доказательства вашего набора.

---

## Заключение: план на 8 недель

План рассчитан на 8–10 часов в неделю: примерно треть — чтение, две трети — код и наблюдения. Темп можно менять свободно, но не за счёт проверки понимания: если наблюдение недели не получено (трасса не снята, гонка не воспроизведена, откат не проверен), лучше растянуть неделю на две, чем идти дальше с непроверенным предположением. Обратный ход тоже допустим — повтор частей 7–16 на восьмой неделе заложен в план намеренно.

| Неделя | Части урока | Практика | Проверяемый результат |
|---|---|---|---|
| 1 | 0–1 | Два проекта из lock-файлов возвращают `/hello` | Путь от Composer autoload до front controller объяснён |
| 2 | 2–4 | Трасса запроса, маршрут ресурса, входной контракт | Набор `curl`-проверок различает ранний отказ, 404/405, неверный JSON и ошибку валидации |
| 3 | 5–6 | `Clock` и конфигурация через управляемые зависимости | Подмена часов воспроизводима; поведение конфигурационного кеша документировано |
| 4 | 7–8 | Сущности сохраняются в PostgreSQL; журнал момента записи и идентичности объектов | N+1 устранён в обоих приложениях, число запросов измерено |
| 5 | 9–11 | Бронирование с искусственным сбоем, двумя конкурирующими процессами и повтором | Ограничения БД и миграции проверены на существующих данных |
| 6 | 12–14 | HTML с экранированием, сессионный вход, права владельца; локальный пакет | Порядок синхронного события показан в журнале |
| 7 | 15–18 | Тесты разных границ; диагностический отчёт по двум внесённым дефектам | Для каждой ментальной модели приведены предсказание и предел |
| 8 | 19–20; повтор 7–16 | Портфолио-проект и трудный срез во втором фреймворке | README содержит команды проверки, гарантии, ограничения и объяснение непереносимых решений |

Разница между «знает» и «владеет» проверяется одним признаком: владеющий предсказывает, а не угадывает. Знающий помнит, что `with()` уменьшает число запросов, и повторяет это как правило. Владеющий знает устройство (когда ORM выполняет SQL), ограничения (что именно доказал замер) и причины (почему выборка распалась на N+1) — и потому способен объяснить поведение в случае, который ему ещё не встречался: в новой версии, в чужом проекте, в третьем фреймворке. Этому и служили шестнадцать ловушек и пять моделей: они переносятся туда, где конкретные имена классов уже не помогут.

---

