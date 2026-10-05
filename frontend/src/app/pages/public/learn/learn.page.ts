import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { IonButton, IonContent, ViewWillEnter } from '@ionic/angular';
import { PageHeaderComponent } from 'src/app/shared/page-header/page-header.component';
import { PageToolbarComponent } from 'src/app/shared/page-toolbar/page-toolbar.component';
import {
  browserLessonStore,
  finishLesson,
  Lesson,
  resolveLesson,
} from './lesson.model';
import { lessons } from './lessons';

type Step = 'teach' | 'ask' | 'reveal';

@Component({
  selector: 'app-learn',
  templateUrl: './learn.page.html',
  styleUrls: ['./learn.page.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [PageToolbarComponent, PageHeaderComponent, IonContent, IonButton],
})
export class LearnPage implements OnInit, ViewWillEnter {
  readonly started = signal(false);
  readonly lesson = signal<Lesson | null>(null);
  readonly step = signal<Step>('teach');
  readonly picks = signal<(number | null)[]>([null, null]);

  ngOnInit(): void {
    this.showIntro();
  }

  ionViewWillEnter(): void {
    this.showIntro();
  }

  start(): void {
    const store = browserLessonStore();
    if (!store) {
      return;
    }
    this.lesson.set(resolveLesson(lessons, store));
    this.step.set('teach');
    this.picks.set([null, null]);
    this.started.set(true);
  }

  private showIntro(): void {
    this.started.set(false);
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
  }
}
