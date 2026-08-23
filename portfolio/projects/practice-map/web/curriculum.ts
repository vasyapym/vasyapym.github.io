export type TopicStatus = "queued" | "in-progress" | "revisit" | "applied";

export type FeedbackKind =
  | "clear"
  | "too-broad"
  | "too-abstract"
  | "already-familiar"
  | "needs-example"
  | "needs-exercise";

export type TopicCard = {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly concepts: readonly string[];
  readonly practicePrompt: string;
  readonly checkPrompt: string;
  readonly tier?: number;
  readonly complexity?: number;
  readonly proofBrief?: string;
  readonly references?: readonly string[];
};

export type PracticeArea = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly topics: readonly TopicCard[];
  readonly tier?: number;
  readonly dependencies?: readonly string[];
};

export const FEEDBACK_LABELS: Readonly<Record<FeedbackKind, string>> = {
  clear: "Clear",
  "too-broad": "Too broad",
  "too-abstract": "Too abstract",
  "already-familiar": "Already familiar",
  "needs-example": "Needs an example",
  "needs-exercise": "Needs an exercise",
};

const dockerTopics: readonly TopicCard[] = [
  {
    id: "docker-images-containers",
    title: "Images and containers",
    summary: "Build a useful mental model for the difference between an image and a running container.",
    concepts: ["image", "container", "process"],
    practicePrompt: "Run a small container, inspect it, stop it, and start a new one from the same image.",
    checkPrompt: "Explain what an image provides and what changes when a container starts.",
  },
  {
    id: "dockerfile",
    title: "Dockerfile",
    summary: "Turn a short build description into an image you can run and inspect.",
    concepts: ["build context", "layers", "CMD"],
    practicePrompt: "Write a minimal Dockerfile for a tiny application and build it locally.",
    checkPrompt: "Point to the instructions that choose the base, copy files, and define the default process.",
  },
  {
    id: "docker-ports-networking",
    title: "Ports and networking",
    summary: "Separate a port inside a container from the port published on the host.",
    concepts: ["localhost", "port mapping", "network"],
    practicePrompt: "Run a small HTTP service and reach it from the host through a published port.",
    checkPrompt: "Explain why localhost inside a container is not the same place as localhost on the host.",
  },
  {
    id: "docker-volumes",
    title: "Volumes and persistence",
    summary: "Keep application data separate from the short-lived container that uses it.",
    concepts: ["volume", "mount", "persistence"],
    practicePrompt: "Write data to a mounted volume, remove the container, and read the data from a replacement.",
    checkPrompt: "Describe which data should survive a container replacement and where it lives.",
  },
  {
    id: "docker-compose",
    title: "Docker Compose",
    summary: "Describe several related services as one local environment.",
    concepts: ["service", "network", "compose file"],
    practicePrompt: "Run an application and its dependency with one Compose file and one command.",
    checkPrompt: "Explain the roles of services, networks, and volumes in the example.",
  },
  {
    id: "docker-configuration",
    title: "Environment and configuration",
    summary: "Keep runtime configuration out of the image so the same build can travel between environments.",
    concepts: ["environment variable", "runtime", "secret"],
    practicePrompt: "Pass a configuration value into a container and observe it from the running process.",
    checkPrompt: "Separate build-time inputs from runtime configuration and identify what should not enter source control.",
  },
  {
    id: "docker-logs-debugging",
    title: "Logs and debugging",
    summary: "Use container state, output, and exit codes to find the next useful clue.",
    concepts: ["logs", "exit code", "inspect"],
    practicePrompt: "Break a small container intentionally, then diagnose it from its status and logs.",
    checkPrompt: "Describe a short sequence for deciding whether the problem is the image, command, configuration, or dependency.",
  },
  {
    id: "docker-image-layers",
    title: "Image size and layers",
    summary: "See how Dockerfile order affects cache reuse and the amount of material in an image.",
    concepts: ["layer", "cache", "build context"],
    practicePrompt: "Build two versions of a small image and compare their layers and build behavior.",
    checkPrompt: "Explain one change that would improve cache reuse and one that would reduce unnecessary context.",
  },
];

const linuxTopics: readonly TopicCard[] = [
  {
    id: "linux-process-model",
    title: "Модель процессов, lifecycle и job control",
    summary: "Разобраться, как процесс появляется, меняет программу и завершается, чтобы читать process tree, а не гадать по симптомам.",
    concepts: ["fork", "exec", "wait", "PID", "zombie", "orphan"],
    practicePrompt: "Собери в disposable environment process tree с hung child, zombie и orphan и объясни его состояние через ps, /proc, pstree и kill.",
    checkPrompt: "Покажи, какие доказательства отличают hung process, zombie и orphan, и кто отвечает за каждый lifecycle transition.",
    tier: 1,
    complexity: 2,
    proofBrief: "Диагностический отчёт по process tree: команды, наблюдения, гипотеза, подтверждение и безопасное завершение процессов.",
    references: ["The Linux Programming Interface — Michael Kerrisk", "man 2 fork; man 2 execve; man 7 signal"],
  },
  {
    id: "linux-files-descriptors-io",
    title: "Файлы, file descriptors и I/O model",
    summary: "Отделить файл от file descriptor и понять, как open-file descriptions, offsets и inheritance живут вокруг процесса.",
    concepts: ["open", "read", "write", "dup2", "close", "stdin/stdout/stderr"],
    practicePrompt: "Проследи shell pipeline и объясни каждый file descriptor до и после exec; добавь маленький диагностический код для намеренной descriptor leak.",
    checkPrompt: "Объясни разницу между descriptor и open-file description и покажи, где именно возникает leak.",
    tier: 1,
    complexity: 2,
    proofBrief: "Trace-документ pipeline плюс маленькая программа, которая показывает открытые descriptors до и после запуска дочернего процесса.",
    references: ["The Linux Programming Interface — Michael Kerrisk", "man 2 open; man 2 dup"],
  },
  {
    id: "linux-syscalls-boundary",
    title: "Syscalls и граница user/kernel",
    summary: "Увидеть, где заканчивается user space, зачем нужен libc и как syscall возвращает ошибку или блокируется.",
    concepts: ["syscall", "libc", "errno", "ABI", "blocking", "strace"],
    practicePrompt: "Напиши небольшой C-пример с прямыми file/socket syscalls и сравни его с вариантом через libc в strace.",
    checkPrompt: "Разбери одну строку strace: аргументы, результат, errno и возможное blocking behavior.",
    tier: 1,
    complexity: 3,
    proofBrief: "Два эквивалентных C-варианта с annotated strace и коротким объяснением цены libc boundary.",
    references: ["The Linux Programming Interface — Michael Kerrisk", "man 2 syscalls"],
  },
  {
    id: "linux-shell-engineering",
    title: "Shell как engineering interface",
    summary: "Писать Bash/POSIX shell так, чтобы пробелы, пустые значения, ошибки и необычные имена файлов не меняли смысл программы.",
    concepts: ["quoting", "expansion", "pipeline", "trap", "set -euo pipefail"],
    practicePrompt: "Преврати хрупкий 20-line deployment script в устойчивую shell-программу с safe quoting, cleanup, проверкой ошибок и dry-run.",
    checkPrompt: "Покажи, какой input ломает исходный script, и почему исправление защищает именно эту границу.",
    tier: 1,
    complexity: 2,
    proofBrief: "Production-like shell script с тестовыми входами для spaces, empty values, failed commands и unusual filenames.",
    references: ["How Linux Works — Brian Ward", "Bash Reference Manual"],
  },
  {
    id: "linux-pipes-composable-tools",
    title: "Pipes, redirection и composable Unix tools",
    summary: "Понимать pipeline как набор concurrent processes и знать, когда композиция делает диагностику яснее, а когда прячет ошибку.",
    concepts: ["pipe", "tee", "process substitution", "here-document", "PIPESTATUS"],
    practicePrompt: "Собери diagnostic pipeline, который сохраняет failure middle stage и выдаёт human-readable и machine-readable результат.",
    checkPrompt: "Объясни порядок запуска процессов и как не потерять exit status внутри pipeline.",
    tier: 1,
    complexity: 2,
    proofBrief: "Многоступенчатый diagnostic pipeline с намеренно падающим этапом и проверкой итогового exit status.",
    references: ["POSIX Shell Command Language", "man bash"],
  },
  {
    id: "linux-permissions-identity",
    title: "Permissions, ownership и Unix identity",
    summary: "Разделять UID/GID процесса и permissions файловой системы, не лечить каждую проблему через chmod 777.",
    concepts: ["UID", "GID", "groups", "umask", "setuid", "sticky bit"],
    practicePrompt: "Создай service user с least-privilege доступом к shared application directory и зафиксируй, зачем нужна каждая permission.",
    checkPrompt: "По симптомам permission denied восстанови identity процесса, effective groups и проверяемый permission bit.",
    tier: 1,
    complexity: 2,
    proofBrief: "Минимальный multi-user каталог с documented access matrix и демонстрацией отказа без ослабления permissions.",
    references: ["man 7 credentials", "man 5 passwd; man 2 chmod"],
  },
  {
    id: "linux-environment-path",
    title: "Environment, PATH и process configuration",
    summary: "Понять, как environment наследуется и почему команда, работающая в интерактивной shell, ломается под systemd или CI.",
    concepts: ["environment", "PATH", "locale", "HOME", "systemd", "CI"],
    practicePrompt: "Воспроизведи приложение, которое работает вручную и падает в clean environment, затем исправь явный configuration contract.",
    checkPrompt: "Раздели interactive-shell configuration, service environment и reproducible application configuration.",
    tier: 1,
    complexity: 2,
    proofBrief: "Reproducible environment fixture с diff переменных и исправленным запуском вне интерактивной shell.",
    references: ["man 7 environ", "systemd Environment= documentation"],
  },
  {
    id: "linux-text-processing",
    title: "Text processing: grep, sed, awk",
    summary: "Использовать grep для selection, sed для transformations и awk для structured text processing, не подменяя parser хрупким scraping.",
    concepts: ["grep", "sed", "awk", "regex", "records", "fields"],
    practicePrompt: "Преобразуй большой log file в aggregate report стандартными Unix tools и явно обработай malformed lines.",
    checkPrompt: "Объясни, где regex достаточно, а где structured interface безопаснее текстового разбора.",
    tier: 1,
    complexity: 2,
    proofBrief: "Командный pipeline с reproducible sample input, aggregate output и отдельным счётчиком malformed records.",
    references: ["POSIX Utilities", "man grep; man sed; man awk"],
  },
  {
    id: "linux-graceful-shutdown",
    title: "Processes, signals и graceful shutdown",
    summary: "Сделать shutdown частью application contract: SIGTERM даёт работе завершиться, SIGKILL ничего не обещает.",
    concepts: ["SIGTERM", "SIGINT", "SIGHUP", "SIGKILL", "SIGCHLD", "signal handler"],
    practicePrompt: "Собери программу, которая drains work по SIGTERM, и покажи отдельный сценарий, где SIGKILL обрывает shutdown.",
    checkPrompt: "Объясни, что допустимо делать в signal handler и где должен находиться основной shutdown orchestration.",
    tier: 1,
    complexity: 3,
    proofBrief: "Небольшой worker service с observable shutdown timeline и тестом на незавершённую работу при SIGKILL.",
    references: ["The Linux Programming Interface — Michael Kerrisk", "man 7 signal"],
  },
  {
    id: "linux-proc-sys-runtime",
    title: "/proc, /sys и runtime kernel state",
    summary: "Читать procfs и sysfs как diagnostic instrumentation: состояние процессов, CPU, memory, devices и topology.",
    concepts: ["/proc", "/sys", "procfs", "sysfs", "kernel state", "diagnostics"],
    practicePrompt: "Исследуй CPU, memory, block device и process information только через /proc и /sys и составь incident-style report.",
    checkPrompt: "Для каждого вывода укажи источник, единицы измерения и пределы достоверности наблюдения.",
    tier: 1,
    complexity: 3,
    proofBrief: "Evidence-backed runtime report без сторонних monitoring agents: команда, raw evidence, interpretation и caveat.",
    references: ["Linux kernel documentation", "man 5 proc"],
  },
  {
    id: "linux-boot-architecture",
    title: "Linux boot process и system architecture",
    summary: "Локализовать boot failure по цепочке firmware → bootloader → kernel → initramfs → PID 1 → services.",
    concepts: ["firmware", "bootloader", "kernel", "initramfs", "PID 1", "kernel command line"],
    practicePrompt: "В disposable VM сломай boot dependency и восстанови систему с консоли, зафиксировав границу сбоя и recovery steps.",
    checkPrompt: "По доступному симптому определи, на каком звене boot chain искать доказательства в первую очередь.",
    tier: 1,
    complexity: 3,
    proofBrief: "Recovery runbook для одной искусственной boot failure с точными наблюдениями и обратимыми действиями.",
    references: ["How Linux Works — Brian Ward", "Linux kernel boot documentation"],
  },
  {
    id: "linux-systemd-lifecycle",
    title: "systemd units, dependencies и service lifecycle",
    summary: "Управлять units, ordering, restart policy, sandboxing и resource controls вместо набора ad-hoc shell commands.",
    concepts: ["unit", "target", "Requires", "Wants", "After", "Restart"],
    practicePrompt: "Оформи приложение как production-quality systemd service с least privilege, restart policy, health behavior и resource limits.",
    checkPrompt: "Различи Requires, Wants и After на конкретной dependency graph и объясни, что произойдёт при сбое dependency.",
    tier: 1,
    complexity: 3,
    proofBrief: "Unit file, override и verification transcript для service lifecycle, включая controlled failure и recovery.",
    references: ["systemd documentation", "man systemd.unit"],
  },
  {
    id: "linux-journald-logging",
    title: "journald и Linux logging model",
    summary: "Использовать structured journal metadata, priority, boot boundaries и retention для диагностики service lifecycle.",
    concepts: ["journald", "journalctl", "priority", "boot", "unit", "PID"],
    practicePrompt: "Диагностируй failing service только по journal metadata и logs; отдельно укажи, какого сигнала не хватает.",
    checkPrompt: "Составь фильтр journalctl, который отделяет один unit, PID, boot и временной интервал без чтения всего журнала.",
    tier: 1,
    complexity: 2,
    proofBrief: "Incident note с несколькими journalctl queries, timeline и честным разделением фактов и гипотез.",
    references: ["man journald.conf", "man journalctl"],
  },
  {
    id: "linux-sockets-networking",
    title: "Networking fundamentals: sockets, IP и ports",
    summary: "Связать application socket с kernel networking state и отличать connection refused, timeout и address already in use.",
    concepts: ["socket", "IP", "TCP", "UDP", "listen", "accept", "connect"],
    practicePrompt: "Проследи client/server connection от процесса к socket и packet и объясни каждую точку отказа на маленьком service.",
    checkPrompt: "Для каждого симптома назови минимальное наблюдение, которое отличит application failure от kernel или network failure.",
    tier: 1,
    complexity: 3,
    proofBrief: "Маленький client/server service и evidence map: process → socket → port → connection outcome.",
    references: ["The Linux Programming Interface — Michael Kerrisk", "man 7 socket; man 7 tcp"],
  },
  {
    id: "linux-dns-resolution",
    title: "DNS resolution в Linux",
    summary: "Разобраться с /etc/hosts, resolver, search domains, cache и различием между DNS, routing, firewall и application failure.",
    concepts: ["/etc/hosts", "resolv.conf", "resolver", "search domain", "cache", "record"],
    practicePrompt: "Диагностируй hostname, который по-разному разрешается для shell и application process, и зафиксируй resolver path.",
    checkPrompt: "Покажи, на каком слое возникла ошибка: имя, resolver, route, firewall или application protocol.",
    tier: 1,
    complexity: 3,
    proofBrief: "DNS troubleshooting note с несколькими независимыми источниками evidence и объяснением порядка проверки.",
    references: ["man 5 resolv.conf", "systemd-resolved documentation"],
  },
  {
    id: "linux-routing-iproute2",
    title: "Routing, interfaces и iproute2",
    summary: "Читать interfaces, routes, gateways и longest-prefix matching через evidence из iproute2, а не через догадки.",
    concepts: ["ip addr", "ip link", "ip route", "namespace", "gateway", "prefix"],
    practicePrompt: "Создай второй network namespace со своим interface и routing path, затем докажи route selection и isolation.",
    checkPrompt: "По destination address вычисли выбранный route и объясни, почему более общий route не победил.",
    tier: 1,
    complexity: 3,
    proofBrief: "Два namespace, минимальная topology diagram и набор iproute2 commands, доказывающих connectivity boundary.",
    references: ["man 8 ip", "Linux kernel networking documentation"],
  },
  {
    id: "linux-tcp-troubleshooting",
    title: "TCP troubleshooting с ss и tcpdump",
    summary: "Коррелировать TCP states, retransmissions, queues и socket ownership с симптомами приложения и пакетами.",
    concepts: ["ss", "tcpdump", "SYN", "retransmission", "listen queue", "TCP state"],
    practicePrompt: "Диагностируй намеренно созданные SYN, listener и application-timeout проблемы через bounded capture и evidence timeline.",
    checkPrompt: "Отличи отсутствие listener, firewall drop, stalled accept и application timeout по socket state и capture.",
    tier: 1,
    complexity: 3,
    proofBrief: "Ограниченный pcap плюс таблица корреляции: timestamp, TCP state, owning process, вывод.",
    references: ["man 8 ss", "man 8 tcpdump; man 7 tcp"],
  },
  {
    id: "linux-storage-filesystems",
    title: "Storage fundamentals: block devices, mounts и filesystems",
    summary: "Разделять device capacity, filesystem capacity и inode exhaustion и безопасно разбирать mount/unmount failures.",
    concepts: ["block device", "partition", "filesystem", "mount", "namespace", "/etc/fstab"],
    practicePrompt: "Создай virtual disk, partition, filesystem и mount, затем восстанови систему после ошибки в fstab внутри disposable VM.",
    checkPrompt: "Определи, закончились blocks, inodes или доступ к mount point, и выбери безопасную проверку.",
    tier: 1,
    complexity: 3,
    proofBrief: "Reproducible storage lab с recovery runbook и evidence до/после исправления fstab.",
    references: ["UNIX and Linux System Administration Handbook", "man 8 mount"],
  },
  {
    id: "linux-acls-xattrs",
    title: "Filesystem permissions, ACLs и extended attributes",
    summary: "Понять POSIX ACLs, default ACLs и xattrs, когда обычного ls -l недостаточно для объяснения доступа.",
    concepts: ["ACL", "default ACL", "xattr", "SELinux", "mode bits", "effective access"],
    practicePrompt: "Создай ACL-based shared workspace без изменения ordinary ownership и проверь доступ от нескольких identities.",
    checkPrompt: "Разбери effective access, когда mode bits, ACL и xattr дают неполную картину по отдельности.",
    tier: 1,
    complexity: 3,
    proofBrief: "Access matrix для нескольких identities с командами проверки ACL/xattr и объяснением least privilege.",
    references: ["man 5 acl", "man 5 attr; man 7 xattr"],
  },
  {
    id: "linux-package-management",
    title: "Package management и reproducible host state",
    summary: "Относиться к package state как к части инфраструктуры: repositories, dependencies, verification и rollback.",
    concepts: ["package manager", "repository", "dependency", "manifest", "verification", "rollback"],
    practicePrompt: "Собери minimal reproducible VM bootstrap из package manifests и покажи, как проверить или откатить host state.",
    checkPrompt: "Различи desired state, installed state и installation history и объясни, какое доказательство нужно для rollback.",
    tier: 1,
    complexity: 2,
    proofBrief: "Повторяемый bootstrap script/manifest с verification output и documented rollback path.",
    references: ["Debian Administrator's Handbook", "Red Hat documentation"],
  },
];

export const curriculum: readonly PracticeArea[] = [
  {
    id: "docker",
    title: "Docker",
    description: "A practical map of images, containers, local services, and the boundaries between them.",
    topics: dockerTopics,
  },
  {
    id: "linux",
    title: "Linux",
    description: "Операционная система как инженерная поверхность: процессы, shell, сеть, storage и диагностика production-сервисов.",
    tier: 1,
    dependencies: [],
    topics: linuxTopics,
  },
];
