import { Lesson, LessonStore, drawLesson, finishLesson } from './lesson.model';

function memoryStore(seen: string[] = [], current: string | null = null): LessonStore {
  return {
    getSeen: () => seen,
    setSeen: (ids) => {
      seen = [...ids];
    },
    getCurrent: () => current,
    setCurrent: (id) => {
      current = id;
    },
  };
}

const deck: Lesson[] = [
  lesson('m1', 'movement'),
  lesson('y1', 'methodology'),
  lesson('b1', 'benchmark'),
  lesson('m2', 'movement'),
];

function lesson(id: string, kind: Lesson['kind']): Lesson {
  const question = {
    prompt: 'q',
    choices: ['a', 'b', 'c'] as [string, string, string],
    answer: 0 as const,
    notes: ['a', 'b', 'c'] as [string, string, string],
  };
  return {
    id,
    kind,
    title: id,
    body: id,
    questions: [question, question],
  };
}

describe('lesson picker', () => {
  it('draws a random card that has not been finished', () => {
    const store = memoryStore(['m1']);
    const drawn = drawLesson(deck, store, { random: () => 0 });
    expect(drawn.id).toBe('y1');
    expect(store.getCurrent()).toBe('y1');
  });

  it('re-roll skips the card on screen', () => {
    const store = memoryStore([], 'm1');
    const drawn = drawLesson(deck, store, { avoidId: 'm1', random: () => 0 });
    expect(drawn.id).not.toBe('m1');
    expect(drawn.id).toBe('y1');
  });

  it('starts a new cycle once every card has been finished', () => {
    const store = memoryStore(['m1', 'y1', 'b1', 'm2']);
    const drawn = drawLesson(deck, store, { avoidId: 'm2', random: () => 0 });
    expect(store.getSeen()).toEqual([]);
    expect(drawn.id).not.toBe('m2');
  });

  it('keeps a finished card out of the next draw', () => {
    const store = memoryStore();
    finishLesson('y1', store);
    const drawn = drawLesson(deck, store, { random: () => 0 });
    expect(drawn.id).toBe('m1');
    expect(drawn.id).not.toBe('y1');
  });
});
