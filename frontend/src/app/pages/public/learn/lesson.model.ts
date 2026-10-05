export type LessonKind = 'movement' | 'methodology' | 'benchmark';

export interface LessonLink {
  label: string;
  href: string;
}

export interface LessonQuestion {
  prompt: string;
  choices: [string, string, string];
  answer: 0 | 1 | 2;
  notes: [string, string, string];
}

export interface Lesson {
  id: string;
  kind: LessonKind;
  title: string;
  body: string;
  link?: LessonLink;
  questions: [LessonQuestion, LessonQuestion];
}

export interface LessonStore {
  getSeen(): string[];
  setSeen(ids: string[]): void;
  getCurrent(): string | null;
  setCurrent(id: string | null): void;
}

const KIND_ORDER: LessonKind[] = ['movement', 'methodology', 'benchmark'];

export function nextLesson(lessons: Lesson[], seenIds: string[]): Lesson {
  const lastId = seenIds[seenIds.length - 1];
  const last = lessons.find((lesson) => lesson.id === lastId);
  let pool = lessons.filter((lesson) => !seenIds.includes(lesson.id));
  if (pool.length === 0) {
    pool = lastId ? lessons.filter((lesson) => lesson.id !== lastId) : lessons;
  }
  if (pool.length === 0) {
    pool = lessons;
  }
  const start = last ? (KIND_ORDER.indexOf(last.kind) + 1) % KIND_ORDER.length : 0;
  for (let offset = 0; offset < KIND_ORDER.length; offset++) {
    const kind = KIND_ORDER[(start + offset) % KIND_ORDER.length];
    const match = pool.find((lesson) => lesson.kind === kind);
    if (match) {
      return match;
    }
  }
  return pool[0];
}

export function resolveLesson(lessons: Lesson[], store: LessonStore): Lesson {
  const current = lessons.find((lesson) => lesson.id === store.getCurrent());
  if (current) {
    return current;
  }

  const known = new Set(lessons.map((lesson) => lesson.id));
  const seen = store.getSeen().filter((id) => known.has(id));
  const finishedAll = lessons.every((lesson) => seen.includes(lesson.id));
  const workingSeen = finishedAll ? seen.slice(-1) : seen;
  if (workingSeen.length !== store.getSeen().length || finishedAll) {
    store.setSeen(workingSeen);
  }

  const lesson = nextLesson(lessons, workingSeen);
  store.setCurrent(lesson.id);
  return lesson;
}

export function finishLesson(id: string, store: LessonStore): void {
  const seen = store.getSeen();
  if (!seen.includes(id)) {
    store.setSeen([...seen, id]);
  }
  if (store.getCurrent() === id) {
    store.setCurrent(null);
  }
}

const SEEN_KEY = 'dt-learn-seen';
const CURRENT_KEY = 'dt-learn-current';

export function browserLessonStore(): LessonStore | null {
  if (typeof localStorage === 'undefined' || typeof sessionStorage === 'undefined') {
    return null;
  }
  return {
    getSeen(): string[] {
      try {
        const parsed = JSON.parse(localStorage.getItem(SEEN_KEY) ?? '[]') as unknown;
        if (!Array.isArray(parsed)) {
          return [];
        }
        return parsed.filter((id): id is string => typeof id === 'string');
      } catch {
        return [];
      }
    },
    setSeen(ids: string[]): void {
      localStorage.setItem(SEEN_KEY, JSON.stringify(ids));
    },
    getCurrent(): string | null {
      return sessionStorage.getItem(CURRENT_KEY);
    },
    setCurrent(id: string | null): void {
      if (id) {
        sessionStorage.setItem(CURRENT_KEY, id);
      } else {
        sessionStorage.removeItem(CURRENT_KEY);
      }
    },
  };
}
