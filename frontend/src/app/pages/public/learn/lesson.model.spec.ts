import { Lesson, finishLesson, nextLesson, resolveLesson } from './lesson.model';
import { LessonStore } from './lesson.model';

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
  it('rotates kind and skips cards already seen', () => {
    expect(nextLesson(deck, []).kind).toBe('movement');
    expect(nextLesson(deck, ['m1']).id).toBe('y1');
    expect(nextLesson(deck, ['m1', 'y1']).id).toBe('b1');
    expect(nextLesson(deck, ['m1', 'y1', 'b1']).id).toBe('m2');
  });

  it('keeps the in-progress card, then advances after it is finished', () => {
    const store = memoryStore([], 'y1');
    expect(resolveLesson(deck, store).id).toBe('y1');
    finishLesson('y1', store);
    expect(resolveLesson(deck, store).id).toBe('b1');
  });

  it('starts a new cycle without repeating the last card', () => {
    const store = memoryStore(['m1', 'y1', 'b1', 'm2']);
    expect(resolveLesson(deck, store).id).not.toBe('m2');
    expect(store.getSeen()).toEqual(['m2']);
  });
});
