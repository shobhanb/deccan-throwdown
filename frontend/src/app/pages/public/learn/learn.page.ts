import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { IonButton, IonContent, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { shareOutline } from 'ionicons/icons';
import { PageHeaderComponent } from 'src/app/shared/page-header/page-header.component';
import { PageToolbarComponent } from 'src/app/shared/page-toolbar/page-toolbar.component';
import { ToastService } from 'src/app/services/toast.service';
import {
  browserLessonStore,
  drawLesson,
  findLesson,
  finishLesson,
  Lesson,
  LessonKind,
} from './lesson.model';
import { lessons } from './lessons';

type Step = 'teach' | 'ask' | 'reveal';
type Category = LessonKind | 'random';

const CATEGORY_KEY = 'dt-learn-category';

@Component({
  selector: 'app-learn',
  templateUrl: './learn.page.html',
  styleUrls: ['./learn.page.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    PageToolbarComponent,
    PageHeaderComponent,
    IonContent,
    IonButton,
    IonIcon,
  ],
})
export class LearnPage implements OnInit {
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  readonly started = signal(false);
  readonly category = signal<Category>('random');
  readonly lesson = signal<Lesson | null>(null);
  readonly step = signal<Step>('teach');
  readonly picks = signal<(number | null)[]>([null, null]);

  constructor() {
    addIcons({ shareOutline });
  }

  ngOnInit(): void {
    this.activatedRoute.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => this.applyLessonId(params.get('lessonId')));
  }

  start(category: Category): void {
    this.category.set(category);
    this.storeCategory(category);
    this.draw();
  }

  reroll(): void {
    this.draw(this.lesson()?.id ?? null);
  }

  private applyLessonId(lessonId: string | null): void {
    if (!lessonId) {
      this.showIntro();
      return;
    }
    const found = findLesson(lessons, lessonId);
    if (!found) {
      this.toastService.showError('That lesson was not found');
      void this.router.navigate(['/learn'], { replaceUrl: true });
      return;
    }
    if (this.lesson()?.id === found.id && this.started()) {
      return;
    }
    this.category.set(this.storedCategory() === 'random' ? 'random' : found.kind);
    this.showLesson(found);
  }

  private draw(avoidId?: string | null): void {
    const store = browserLessonStore();
    if (!store) {
      return;
    }
    const category = this.category();
    const lesson = drawLesson(lessons, store, {
      avoidId,
      kind: category === 'random' ? null : category,
    });
    this.showLesson(lesson);
    void this.router.navigate(['/learn', lesson.id], { replaceUrl: true });
  }

  private showLesson(lesson: Lesson): void {
    browserLessonStore()?.setCurrent(lesson.id);
    this.lesson.set(lesson);
    this.step.set('teach');
    this.picks.set([null, null]);
    this.started.set(true);
  }

  private showIntro(): void {
    this.started.set(false);
    this.lesson.set(null);
    this.storeCategory(null);
  }

  private storeCategory(category: Category | null): void {
    if (typeof sessionStorage === 'undefined') {
      return;
    }
    if (category) {
      sessionStorage.setItem(CATEGORY_KEY, category);
    } else {
      sessionStorage.removeItem(CATEGORY_KEY);
    }
  }

  private storedCategory(): Category | null {
    if (typeof sessionStorage === 'undefined') {
      return null;
    }
    const value = sessionStorage.getItem(CATEGORY_KEY);
    if (
      value === 'random' ||
      value === 'movement' ||
      value === 'methodology' ||
      value === 'benchmark'
    ) {
      return value;
    }
    return null;
  }

  kindLabel(kind: Lesson['kind']): string {
    if (kind === 'movement') {
      return 'Movement';
    }
    if (kind === 'methodology') {
      return 'Methodology';
    }
    return 'Benchmark';
  }

  toQuestions(): void {
    this.step.set('ask');
  }

  choose(questionIndex: number, choiceIndex: number): void {
    this.picks.update((picks) => {
      const next = [...picks];
      next[questionIndex] = choiceIndex;
      return next;
    });
  }

  bothAnswered(): boolean {
    return this.picks().every((pick) => pick !== null);
  }

  showAnswers(): void {
    const lesson = this.lesson();
    const store = browserLessonStore();
    if (!lesson || !store || !this.bothAnswered()) {
      return;
    }
    finishLesson(lesson.id, store);
    this.step.set('reveal');
  }

  done(): void {
    this.showIntro();
    void this.router.navigate(['/learn'], { replaceUrl: true });
  }

  async shareCard(): Promise<void> {
    const lesson = this.lesson();
    if (!lesson || typeof window === 'undefined') {
      return;
    }
    const url = `${window.location.origin}/learn/${lesson.id}`;
    const title = lesson.title;
    const text = `While you wait: ${lesson.title}`;
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      this.toastService.showSuccess('Link copied');
    } catch {
      this.toastService.showError('Could not copy the link');
    }
  }
}
