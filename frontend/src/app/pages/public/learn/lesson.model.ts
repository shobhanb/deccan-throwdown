export type LessonKind = 'movement' | 'methodology' | 'benchmark';

export interface LessonLink {
  label: string;
  href: string;
  /** Looping demonstration shown above the link. */
  image?: string;
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
  /** Movement cards name the points of performance for that lift. */
  points?: string[];
  link?: LessonLink;
  questions: [LessonQuestion, LessonQuestion];
}

export interface LessonStore {
  getSeen(): string[];
  setSeen(ids: string[]): void;
  getCurrent(): string | null;
  setCurrent(id: string | null): void;
}

export function findLesson(lessons: Lesson[], id: string | null | undefined): Lesson | null {
  if (!id) {
    return null;
  }
  return lessons.find((lesson) => lesson.id === id) ?? null;
}

export function drawLesson(
  lessons: Lesson[],
  store: LessonStore,
  options: { avoidId?: string | null; kind?: LessonKind | null; random?: () => number } = {},
): Lesson {
  const random = options.random ?? Math.random;
  const avoidId = options.avoidId ?? null;
  const kind = options.kind ?? null;
  const inCategory = (lesson: Lesson) => !kind || lesson.kind === kind;
  const known = new Set(lessons.map((lesson) => lesson.id));
  let seen = store.getSeen().filter((id) => known.has(id));

  let pool = lessons.filter(
    (lesson) => inCategory(lesson) && !seen.includes(lesson.id) && lesson.id !== avoidId,
  );
  if (pool.length === 0) {
    const categoryIds = new Set(lessons.filter(inCategory).map((lesson) => lesson.id));
    seen = seen.filter((id) => !categoryIds.has(id));
    store.setSeen(seen);
    pool = lessons.filter((lesson) => inCategory(lesson) && lesson.id !== avoidId);
  }
  if (pool.length === 0) {
    pool = lessons.filter(inCategory);
  }
  if (pool.length === 0) {
    pool = lessons;
  }

  const index = Math.min(pool.length - 1, Math.floor(random() * pool.length));
  const lesson = pool[index];
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
