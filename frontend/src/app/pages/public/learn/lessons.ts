import { Lesson, LessonLink } from './lesson.model';

function watch(slug: string, label: string): LessonLink {
  return {
    label,
    href: `https://www.crossfit.com/essentials/${slug}`,
  };
}

export const lessons: Lesson[] = [
  {
    id: 'air-squat-depth',
    kind: 'movement',
    title: 'Air squat depth',
    body: 'A squat is at depth when the crease of the hip passes below the top of the knee. Thighs level with the floor are not there yet. Heels rising, or looking at the floor, are different faults. They do not decide this one.',
    link: watch('the-air-squat', 'Watch the air squat'),
    questions: [
      {
        prompt: 'The hip crease stops above the knee. What failed?',
        choices: [
          'Hip extension at the top',
          'Depth. The rep never broke parallel',
          'The heels, because the athlete looked down',
        ],
        answer: 1,
        notes: [
          'The top of the squat is a different standard.',
          'Depth is the hip crease passing below the knee.',
          'Gaze is not the depth check.',
        ],
      },
      {
        prompt: 'Which position meets the depth standard?',
        choices: [
          'Thighs level with the floor, heels down',
          'Hip crease below the knee, heels down',
          'Hip crease below the knee, heels off the floor',
        ],
        answer: 1,
        notes: [
          'Level thighs have not passed the knee.',
          'The crease is below the knee and the heels stay down.',
          'That rep is deep, and the heels are a separate fault.',
        ],
      },
    ],
  },
  {
    id: 'air-squat-lumbar',
    kind: 'movement',
    title: 'Air squat lumbar curve',
    body: 'At the bottom of a squat the lower back keeps a natural arch. Rounding it to get lower is the fault this card is about. A little less arch than standing is not the same as the back collapsing.',
    link: watch('the-air-squat', 'Watch the air squat'),
    questions: [
      {
        prompt: 'The lower back rounds at the bottom. What is the fault?',
        choices: [
          'The lumbar curve was lost',
          'The squat was too deep',
          'The heels stayed down',
        ],
        answer: 0,
        notes: [
          'The back should keep its natural arch.',
          'Depth is not the problem on this card.',
          'Heels down is part of a sound squat.',
        ],
      },
      {
        prompt: 'Which bottom keeps the standard?',
        choices: [
          'Hips below the knees, lower back rounded',
          'Hips below the knees, natural arch held',
          'An upright torso with the hips still above the knees',
        ],
        answer: 1,
        notes: [
          'Depth with a rounded back misses this standard.',
          'Depth and the arch are both there.',
          'The arch may be fine, but that rep is not at depth.',
        ],
      },
    ],
  },
  {
    id: 'air-squat-knees',
    kind: 'movement',
    title: 'Air squat knees',
    body: 'In the squat the knees travel in the same direction as the feet. They should not collapse inside the feet. Pressure stays toward the heels, not the toes.',
    link: watch('the-air-squat', 'Watch the air squat'),
    questions: [
      {
        prompt: 'The knees roll inside the feet on the way down. What failed?',
        choices: [
          'Nothing, if the hip crease is below the knee',
          'The knees left the line of the feet',
          'The athlete stood up too fast',
        ],
        answer: 1,
        notes: [
          'Depth does not excuse the knees collapsing.',
          'The knees should track the feet.',
          'Speed is not this standard.',
        ],
      },
      {
        prompt: 'Where does the pressure belong?',
        choices: ['On the toes', 'Toward the heels', 'On the outside of the knees only'],
        answer: 1,
        notes: [
          'Coming onto the toes is a fault.',
          'Heels stay down and take the pressure.',
          'The line of the feet is the guide, not a sideways shove.',
        ],
      },
    ],
  },
  {
    id: 'air-squat-finish',
    kind: 'movement',
    title: 'Finishing the air squat',
    body: 'The squat ends standing tall, with the hips and knees fully open. Stopping short of that, even after a deep bottom, leaves the rep unfinished.',
    link: watch('the-air-squat', 'Watch the air squat'),
    questions: [
      {
        prompt: 'The athlete stands most of the way up and starts the next rep. What failed?',
        choices: [
          'Depth',
          'The finish. The hips and knees never fully opened',
          'Knee tracking',
        ],
        answer: 1,
        notes: [
          'The bottom was not the problem described.',
          'The rep finishes only when the hips and knees are open.',
          'Nothing here says the knees collapsed.',
        ],
      },
      {
        prompt: 'Which finish counts?',
        choices: [
          'Hips still slightly bent, knees soft',
          'Hips and knees fully open, standing tall',
          'A jump that leaves the bottom early',
        ],
        answer: 1,
        notes: [
          'Soft knees mean the rep is not finished.',
          'Open hips and knees are the top of the squat.',
          'Leaving the ground does not replace standing tall.',
        ],
      },
    ],
  },
  {
    id: 'front-squat',
    kind: 'movement',
    title: 'Front squat rack',
    body: 'The front squat is an air squat with the load on the front of the shoulders. The elbows stay up so the bar or ball stays in that rack. Dropping the elbows to survive the bottom lets the load fall forward.',
    link: watch('the-front-squat', 'Watch the front squat'),
    questions: [
      {
        prompt: 'The elbows crash down in the bottom. What is at risk?',
        choices: [
          'The load stays secure on the shoulders',
          'The rack collapses and the load falls forward',
          'The heels automatically rise, which fixes it',
        ],
        answer: 1,
        notes: [
          'Low elbows do not secure the rack.',
          'Elbows up are what keep the load on the shoulders.',
          'Rising heels are another fault, not a fix.',
        ],
      },
      {
        prompt: 'What is the front squat, besides the rack?',
        choices: [
          'A partial squat to a box',
          'An air squat to depth, then standing tall',
          'A strict press',
        ],
        answer: 1,
        notes: [
          'The bottom is still below the knee, not a high box.',
          'Depth and a full stand still apply.',
          'The press is a different movement.',
        ],
      },
    ],
  },
  {
    id: 'overhead-squat',
    kind: 'movement',
    title: 'Overhead squat',
    body: 'In the overhead squat the load stays over the middle of the foot while you squat to depth and stand tall. The shoulders stay active so the bar does not drift forward. A bar that walks out in front is not a personal style. It is a miss.',
    link: watch('the-overhead-squat', 'Watch the overhead squat'),
    questions: [
      {
        prompt: 'The bar drifts forward of the feet at the bottom. What failed?',
        choices: [
          'Nothing. Bar path is style',
          'The load left the middle of the foot',
          'The elbows were too high',
        ],
        answer: 1,
        notes: [
          'Forward drift is a fault, not a signature.',
          'The bar belongs over the middle of the foot.',
          'This card is about where the load sits, not the front-rack elbows.',
        ],
      },
      {
        prompt: 'Which overhead squat meets the standard?',
        choices: [
          'Depth, bar over mid-foot, shoulders active',
          'Depth, bar in front of the toes',
          'A quarter squat with the bar overhead',
        ],
        answer: 0,
        notes: [
          'Depth, bar position, and active shoulders are together.',
          'The bar has left the middle of the foot.',
          'Overhead position without depth is not the squat.',
        ],
      },
    ],
  },
  {
    id: 'shoulder-press',
    kind: 'movement',
    title: 'Shoulder press',
    body: 'The shoulder press drives the bar from the shoulders to overhead with the arms only. There is no dip of the knees. The ribs stay down, and the bar finishes locked out over the body.',
    link: watch('the-shoulder-press', 'Watch the shoulder press'),
    questions: [
      {
        prompt: 'The athlete dips the knees to start the bar. What is that rep?',
        choices: [
          'A strict shoulder press',
          'Not a strict press. The legs joined in',
          'A push jerk',
        ],
        answer: 1,
        notes: [
          'A strict press has no knee dip.',
          'Once the legs drive, it is no longer a strict press.',
          'A jerk also receives the bar in a partial squat. A dip alone is not that.',
        ],
      },
      {
        prompt: 'Where does a finished press put the bar?',
        choices: [
          'In front of the face, elbows bent',
          'Locked out, over the body',
          'Behind the head, ribs flared',
        ],
        answer: 1,
        notes: [
          'Bent elbows mean it is not locked out.',
          'Lockout over the body is the finish.',
          'Flared ribs are a fault, not the finish position.',
        ],
      },
    ],
  },
  {
    id: 'push-press',
    kind: 'movement',
    title: 'Push press',
    body: 'The push press starts with a shallow dip and a drive. The torso stays vertical. The legs launch the bar, then the arms finish the lockout overhead. A forward lean is not the dip. Pressing the bar with no leg drive is a strict press.',
    link: watch('the-push-press', 'Watch the push press'),
    questions: [
      {
        prompt: 'Which dip belongs in a push press?',
        choices: [
          'Knees and hips bend slightly, torso stays vertical',
          'The chest dives forward over the bar',
          'No dip. The arms press from a standstill',
        ],
        answer: 0,
        notes: [
          'A short vertical dip is the start of the drive.',
          'Leaning forward is not the dip.',
          'No dip means the legs never helped. That is a strict press.',
        ],
      },
      {
        prompt: 'When do the arms take over?',
        choices: [
          'Before the legs have extended',
          'After the legs and hips have driven the bar up',
          'Only if the bar misses lockout',
        ],
        answer: 1,
        notes: [
          'The arms do not start the lift.',
          'The legs launch the bar, then the arms lock it out.',
          'The arms finish every correct rep, not only the misses.',
        ],
      },
    ],
  },
  {
    id: 'push-jerk',
    kind: 'movement',
    title: 'Push jerk',
    body: 'The push jerk uses the same dip and drive as a push press. The difference is the catch. After the drive, you drop into a partial squat and receive the bar overhead instead of pressing it out with the arms.',
    link: watch('the-push-jerk', 'Watch the push jerk'),
    questions: [
      {
        prompt: 'The athlete dip-drives and presses the bar out while staying tall. What was that?',
        choices: ['A push jerk', 'A push press', 'A snatch'],
        answer: 1,
        notes: [
          'A jerk receives the bar in a partial squat.',
          'Pressing it out from a tall stand is a push press.',
          'A snatch starts from the floor, or from the hang, in one pull.',
        ],
      },
      {
        prompt: 'What makes the lockout a jerk?',
        choices: [
          'The bar is received in a partial squat',
          'The arms press harder than in a push press',
          'The feet stay glued in a tall stand',
        ],
        answer: 0,
        notes: [
          'The receive under the bar is the jerk.',
          'Pressing harder is still a press.',
          'Staying tall is the push-press finish.',
        ],
      },
    ],
  },
  {
    id: 'deadlift',
    kind: 'movement',
    title: 'Deadlift',
    body: 'The deadlift stands a bar up from the floor. The hips and shoulders rise together while the bar is below the knees. The bar stays against the legs. The lower back stays neutral, and the arms stay straight.',
    link: watch('the-deadlift', 'Watch the deadlift'),
    questions: [
      {
        prompt: 'The hips shoot up and the chest stays down. What failed?',
        choices: [
          'The hips and shoulders did not rise together',
          'The arms bent too early, which is required',
          'The bar stayed on the legs',
        ],
        answer: 0,
        notes: [
          'Hips rising first changes the lift into a stiff-leg pull.',
          'The arms stay straight. Bending them is not the deadlift.',
          'A bar on the legs is what you want.',
        ],
      },
      {
        prompt: 'Which pull matches the standard?',
        choices: [
          'Bar swings out in front, back rounded',
          'Bar on the legs, back neutral, hips and shoulders together',
          'A curl at the top to finish the lockout',
        ],
        answer: 1,
        notes: [
          'A rounded back and a floating bar miss the lift.',
          'Close bar, neutral back, hips and shoulders together.',
          'The arms do not curl the bar to the finish.',
        ],
      },
    ],
  },
  {
    id: 'sdhp',
    kind: 'movement',
    title: 'Sumo deadlift high pull',
    body: 'The sumo deadlift high pull opens the hips before the arms bend. The legs and hips throw the bar up. An early arm pull, while the hips are still closed, skips the part that moves the bar.',
    link: watch('the-sumo-deadlift-high-pull', 'Watch the sumo deadlift high pull'),
    questions: [
      {
        prompt: 'The elbows bend while the hips are still sitting back. What failed?',
        choices: [
          'The arms waited too long',
          'The hips did not finish opening before the arms bent',
          'The stance was too wide',
        ],
        answer: 1,
        notes: [
          'The arms are supposed to bend after the hips open.',
          'Early arms replace the hip extension.',
          'A wide stance is part of the sumo setup.',
        ],
      },
      {
        prompt: 'What moves the bar?',
        choices: [
          'A biceps curl',
          'The hips opening, then the arms',
          'A shrug with soft knees',
        ],
        answer: 1,
        notes: [
          'Curling the bar skips the hips.',
          'Hips first, then the arms rise.',
          'A shrug does not open the hips.',
        ],
      },
    ],
  },
  {
    id: 'medicine-ball-clean',
    kind: 'movement',
    title: 'Medicine-ball clean',
    body: 'The medicine-ball clean is a teaching clean. The hips throw the ball up, and you catch it on the shoulders. It is not a biceps curl. The ball does not travel up the body by the arms alone.',
    link: watch('the-medicine-ball-clean', 'Watch the medicine-ball clean'),
    questions: [
      {
        prompt: 'An athlete curls the ball to the shoulders. What did they miss?',
        choices: [
          'The hip throw. The arms did the lift',
          'Nothing. A curl is a clean',
          'The catch, because the ball must stay at the hips',
        ],
        answer: 0,
        notes: [
          'The hips move the ball. The arms do not curl it.',
          'A curl is a different movement.',
          'The catch is on the shoulders, not at the hips.',
        ],
      },
      {
        prompt: 'Where is the ball caught?',
        choices: ['On the shoulders', 'Overhead', 'At arm’s length by the thighs'],
        answer: 0,
        notes: [
          'The clean finishes in the rack, on the shoulders.',
          'Overhead is a snatch or a jerk, not this catch.',
          'That is the start, not the catch.',
        ],
      },
    ],
  },
  {
    id: 'pull-up',
    kind: 'movement',
    title: 'Pull-up',
    body: 'A pull-up counts when the chin clears the bar. A kip, if you use one, starts at the hips. A knee whip that never gets the chin over the bar is not a rep.',
    link: watch('the-pull-up', 'Watch the pull-up'),
    questions: [
      {
        prompt: 'The chin stops just under the bar. Does the rep count?',
        choices: [
          'Yes, if the kip was big',
          'No. The chin has to clear the bar',
          'Yes, if the knees kicked',
        ],
        answer: 1,
        notes: [
          'A big kip does not replace the chin over the bar.',
          'Clearing the bar is the standard.',
          'A knee kick is not the rep.',
        ],
      },
      {
        prompt: 'Where does a kip start?',
        choices: ['At the hips', 'With a knee whip and a still torso', 'From the elbows only'],
        answer: 0,
        notes: [
          'The hips start the kip.',
          'Knees whipping under a quiet torso skips the hip.',
          'The elbows bend because the body moved. They do not start a kip.',
        ],
      },
    ],
  },
  {
    id: 'thruster',
    kind: 'movement',
    title: 'Thruster',
    body: 'A thruster is a front squat that drives straight into a push press. The bottom of the squat sends the bar overhead in one motion. A squat, a pause, and a separate press is two exercises, not a thruster.',
    link: watch('the-thruster', 'Watch the thruster'),
    questions: [
      {
        prompt: 'Which rep is a thruster?',
        choices: [
          'Front squat, stand, pause, then press',
          'Front squat driving straight into the press',
          'A push press with no squat',
        ],
        answer: 1,
        notes: [
          'The pause splits it into a squat plus a press.',
          'One motion from the bottom to overhead is the thruster.',
          'Without the squat it is only a push press.',
        ],
      },
      {
        prompt: 'What does the front-squat standard still require?',
        choices: [
          'Hip crease below the knee, elbows up',
          'A quarter squat is enough if the press is heavy',
          'The bar held on the back',
        ],
        answer: 0,
        notes: [
          'It is still a front squat at the bottom.',
          'Cutting depth changes the rep.',
          'The bar on the back is a back squat, not a thruster.',
        ],
      },
    ],
  },
  {
    id: 'muscle-up-scale',
    kind: 'movement',
    title: 'Scaling the muscle-up',
    body: 'Until the transition of a muscle-up is real, the substitute is a pull plus a dip. That keeps both jobs the muscle-up asks for. Skipping the pull, or skipping the dip, leaves half of the movement out.',
    link: watch('the-muscle-up', 'Watch the muscle-up'),
    questions: [
      {
        prompt: 'A workout calls for muscle-ups and the athlete cannot transition yet. What keeps the pattern?',
        choices: [
          'A pull plus a dip',
          'Only dips, because the top is the hard part',
          'Air squats, to keep moving',
        ],
        answer: 0,
        notes: [
          'Pull and dip are the two halves.',
          'Dips alone drop the pull.',
          'A squat does not replace a pull or a dip.',
        ],
      },
      {
        prompt: 'Why not jump straight to a different exercise?',
        choices: [
          'Because any hard movement is the same stimulus',
          'Because the pull and the dip are the muscle-up’s work',
          'Because scaling is not allowed on gymnastics',
        ],
        answer: 1,
        notes: [
          'Hard is not the same as the same pattern.',
          'The scale should still pull and still dip.',
          'Gymnastics scales. The pattern stays.',
        ],
      },
    ],
  },
  {
    id: 'what-fitness-is',
    kind: 'methodology',
    title: 'What fitness is',
    body: 'In this model, fitness is work capacity across broad time and modal domains. A big squat, or a fast 5 km, is one piece. It is not the whole thing. The point is to be capable at short, middle, and long efforts, and at more than one kind of movement.',
    questions: [
      {
        prompt: 'Which description matches this definition?',
        choices: [
          'The heaviest squat in the gym',
          'Useful output across different durations and movement types',
          'The fastest 5 km, regardless of anything else',
        ],
        answer: 1,
        notes: [
          'Strength is one domain, not the definition.',
          'Broad time and modal domains is the definition.',
          'A single endurance event is one domain.',
        ],
      },
      {
        prompt: 'An athlete only trains heavy deadlifts. What is missing?',
        choices: [
          'Nothing. Strength covers fitness',
          'Other time domains and other ways of moving',
          'A longer warm-up',
        ],
        answer: 1,
        notes: [
          'One lift does not cover broad domains.',
          'Time and modality both have to spread out.',
          'A warm-up does not add those domains.',
        ],
      },
    ],
  },
  {
    id: 'prescription',
    kind: 'methodology',
    title: 'The prescription',
    body: 'The prescription is constantly varied functional movements, done at high intensity. A fixed circuit of machines is a different idea. Variation is what prepares you for work you cannot predict.',
    questions: [
      {
        prompt: 'Which session follows the prescription?',
        choices: [
          'The same machine circuit every Monday',
          'Compound movements that change, done hard',
          'A long easy walk, always the same route',
        ],
        answer: 1,
        notes: [
          'Fixed machines miss both the movements and the variation.',
          'Varied functional movements at intensity is the line.',
          'Easy and unchanging misses intensity and variation.',
        ],
      },
      {
        prompt: 'Why vary the workouts?',
        choices: [
          'So the next challenge is not a specialty you rehearsed',
          'So you never repeat a movement enough to learn it',
          'So the clock can be ignored',
        ],
        answer: 0,
        notes: [
          'The aim is broad preparation, not a single event.',
          'Movements are practiced. The workouts change.',
          'Intensity still cares about time.',
        ],
      },
    ],
  },
  {
    id: 'functional-movement',
    kind: 'methodology',
    title: 'Functional movement',
    body: 'Functional movements are compound patterns you already use to move yourself or an object. They travel a long way, they can be loaded, and the power starts at the core and moves outward. A curl or a leg extension does not replace a pull-up or a squat.',
    questions: [
      {
        prompt: 'Which swap keeps a functional movement?',
        choices: [
          'Squat replaced by a leg extension',
          'Pull-up replaced by a lighter pull, still a pull',
          'Deadlift replaced by a biceps curl',
        ],
        answer: 1,
        notes: [
          'A leg extension is an isolation swap.',
          'A pull is still the pattern. The load changed.',
          'A curl is not a deadlift.',
        ],
      },
      {
        prompt: 'Where does the movement start?',
        choices: [
          'At the hands',
          'From the core outward',
          'At whichever muscle is sore',
        ],
        answer: 1,
        notes: [
          'The hands finish a pattern that started nearer the center.',
          'Core to extremity is the recruitment.',
          'Soreness is not the definition.',
        ],
      },
    ],
  },
  {
    id: 'intensity',
    kind: 'methodology',
    title: 'Intensity is power',
    body: 'Intensity here means power: work divided by time. The same reps and load done in less time are a higher intensity. A longer clock, more sweat, or more soreness does not, by itself, mean more intensity. A tidy workout that takes half an hour can be a low-power effort.',
    questions: [
      {
        prompt: 'Same reps, same load. One finish is 4 minutes, the other is 12. Who produced more intensity?',
        choices: [
          'The 12-minute athlete, because they worked longer',
          'The 4-minute athlete, because the same work took less time',
          'Neither. Identical work means identical intensity',
        ],
        answer: 1,
        notes: [
          'A longer clock is not higher power.',
          'Same work, less time, is more power.',
          'The work matches. The time does not, so the power does not.',
        ],
      },
      {
        prompt: 'Which change raises intensity without changing the movement?',
        choices: [
          'Resting longer between the same sets',
          'Finishing the same load and distance sooner',
          'Swapping the lift for an isolation exercise',
        ],
        answer: 1,
        notes: [
          'Extra rest lowers average power.',
          'Less time for the same work raises power.',
          'An isolation swap leaves the movement, which is a different question.',
        ],
      },
    ],
  },
  {
    id: 'pathways',
    kind: 'methodology',
    title: 'Three time domains',
    body: 'Very short efforts, efforts around a couple of minutes, and long efforts train different energy systems. A ten-second burst is not the same stimulus as a twenty-minute piece, even if both feel hard. Calling every hard workout cardio flattens that difference.',
    questions: [
      {
        prompt: 'Which pair is the same kind of stimulus?',
        choices: [
          'A 10-second max effort and a 20-minute piece',
          'Two workouts both meant to last about two minutes',
          'A long run and a heavy single',
        ],
        answer: 1,
        notes: [
          'Those sit at opposite ends of the time scale.',
          'Matching intended duration keeps the same pathway.',
          'A long run and a heavy single are different domains.',
        ],
      },
      {
        prompt: 'Fran is meant to last a few minutes. A 20-minute version is…',
        choices: [
          'The same stimulus, just slower',
          'A different time domain',
          'Proof the athlete is fitter',
        ],
        answer: 1,
        notes: [
          'Stretching the clock changes the pathway.',
          'A few minutes and twenty minutes are different stimuli.',
          'A longer finish is not the definition of fitness.',
        ],
      },
    ],
  },
  {
    id: 'ten-skills',
    kind: 'methodology',
    title: 'Ten physical skills',
    body: 'The ten skills are cardiovascular endurance, stamina, strength, flexibility, power, speed, coordination, agility, balance, and accuracy. A workout trains some of them. Being tired does not mean it trained all ten.',
    questions: [
      {
        prompt: 'A heavy deadlift day mostly asks for which of these?',
        choices: [
          'Strength and power',
          'All ten, because it was hard',
          'Accuracy and agility only',
        ],
        answer: 0,
        notes: [
          'A heavy pull is strength and power.',
          'Effort is not the same as every skill.',
          'Accuracy and agility are not the point of a heavy deadlift.',
        ],
      },
      {
        prompt: 'Which list is the ten?',
        choices: [
          'Endurance, stamina, strength, flexibility, power, speed, coordination, agility, balance, accuracy',
          'Chest, back, legs, arms, and core',
          'Cardio, weights, and rest',
        ],
        answer: 0,
        notes: [
          'Those are the ten general physical skills.',
          'Body parts are not the skill list.',
          'Three buckets are modalities, not the ten skills.',
        ],
      },
    ],
  },
  {
    id: 'modalities',
    kind: 'methodology',
    title: 'Three modalities',
    body: 'Workouts are built from three buckets. Monostructural work repeats a cycle: run, row, bike, jump rope. Gymnastics is bodyweight control. Weightlifting is an external load. A hard run is still monostructural. It does not become weightlifting because it hurt.',
    questions: [
      {
        prompt: 'A 400 m run in a workout is which modality?',
        choices: ['Weightlifting', 'Monostructural', 'Gymnastics'],
        answer: 1,
        notes: [
          'There is no external load.',
          'Running is cyclical monostructural work.',
          'Gymnastics is bodyweight skill, not a run.',
        ],
      },
      {
        prompt: 'Which trio is one of each?',
        choices: [
          'Run, pull-up, deadlift',
          'Back squat, front squat, deadlift',
          'Pull-up, push-up, air squat',
        ],
        answer: 0,
        notes: [
          'Run, gymnastics, and a loaded lift.',
          'Three lifts are all weightlifting.',
          'Three bodyweight movements are all gymnastics.',
        ],
      },
    ],
  },
  {
    id: 'couplet-triplet',
    kind: 'methodology',
    title: 'Couplet and triplet',
    body: 'A couplet is two movements. A triplet is three. The classic couplet is a fixed amount of work for time. The classic triplet is a fixed clock, and the score is rounds and reps. Two exercises are never a triplet.',
    questions: [
      {
        prompt: 'Thrusters and pull-ups, 21-15-9 for time. What is that?',
        choices: ['A triplet', 'A couplet', 'A single-element day'],
        answer: 1,
        notes: [
          'There are two movements, not three.',
          'Two movements for time is a couplet.',
          'A single element would be one movement.',
        ],
      },
      {
        prompt: 'Run, pull-ups, and thrusters for 20 minutes. What is that?',
        choices: ['A couplet', 'A triplet', 'Three couplets'],
        answer: 1,
        notes: [
          'A couplet has two movements.',
          'Three movements on a clock is a triplet.',
          'It is one workout of three parts, not three couplets.',
        ],
      },
    ],
  },
  {
    id: 'task-vs-time',
    kind: 'methodology',
    title: 'Task priority and time priority',
    body: 'Task priority means the work is fixed and the score is the time it takes. Time priority means the clock is fixed and the score is how much work you finish, usually rounds and reps. Fran is task priority. A 20-minute AMRAP is time priority.',
    questions: [
      {
        prompt: 'How is Fran scored?',
        choices: [
          'Rounds and reps in 20 minutes',
          'Time to finish 21-15-9 thrusters and pull-ups',
          'The heaviest thruster',
        ],
        answer: 1,
        notes: [
          'That would be time priority.',
          'The task is fixed, so the score is time.',
          'Fran is not a max-lift test.',
        ],
      },
      {
        prompt: 'Cindy is a 20-minute AMRAP. What do you write down?',
        choices: [
          'How long it took to finish 20 rounds',
          'Rounds and reps completed when the clock hits 20:00',
          'The load on the squats',
        ],
        answer: 1,
        notes: [
          'There is no fixed number of rounds.',
          'The clock is fixed. The score is the work.',
          'Cindy’s squats are air squats. Load is not the score.',
        ],
      },
    ],
  },
  {
    id: 'mechanics-first',
    kind: 'methodology',
    title: 'Mechanics, then intensity',
    body: 'The order is mechanics, then consistency, then intensity. The movement should be repeatable before load and speed are added. Loading a brand-new pattern on day one to make practice feel serious raises the chance of practicing the fault.',
    questions: [
      {
        prompt: 'An athlete has never front squatted. What comes first?',
        choices: [
          'A heavy single, to find a max',
          'Sound, repeatable reps, then load',
          'A 21-15-9 for time at the prescribed weight',
        ],
        answer: 1,
        notes: [
          'A max comes after the movement is consistent.',
          'Mechanics and consistency precede intensity.',
          'A timed workout at full load skips the order.',
        ],
      },
      {
        prompt: 'When is intensity added?',
        choices: [
          'After the movement is repeatable',
          'Before any practice, so the athlete learns under fatigue',
          'Only on benchmark day',
        ],
        answer: 0,
        notes: [
          'Speed and load follow a repeatable movement.',
          'Fatigue first practices the miss.',
          'Intensity belongs in ordinary training, once the movement holds.',
        ],
      },
    ],
  },
  {
    id: 'threshold',
    kind: 'methodology',
    title: 'Threshold',
    body: 'Speed is where faults show up. The way through is to repair the fault at that speed, not to live only at a pace where nothing ever breaks. Slowing down can restore a position. It does not, by itself, teach you to keep the position when you go fast again.',
    questions: [
      {
        prompt: 'The squat looks right slow and falls apart when the set speeds up. What is the next step?',
        choices: [
          'Stay at the slow pace forever',
          'Work at the faster pace and fix the fault there',
          'Add load so the fault matters less',
        ],
        answer: 1,
        notes: [
          'The slow pace never practices the fast rep.',
          'Fixing the fault at the speed where it appears is the idea.',
          'Load on a breaking rep hides the problem under more weight.',
        ],
      },
      {
        prompt: 'What does a fault at higher speed mean?',
        choices: [
          'The athlete should never go that fast',
          'That speed is where the position has to be rebuilt',
          'The standard changes once the clock starts',
        ],
        answer: 1,
        notes: [
          'The fast rep is the goal, with the position intact.',
          'Rebuild the position at the speed that broke it.',
          'The standard stays. The athlete has to meet it faster.',
        ],
      },
    ],
  },
  {
    id: 'preserve-stimulus',
    kind: 'methodology',
    title: 'Preserve the stimulus',
    body: 'Scale load first, then volume, then the movement. Keep the time window and the pattern. A movement swap is the last change, not the first. Fran should still finish in a few minutes. Cindy should still keep the athlete moving.',
    questions: [
      {
        prompt: 'Prescribed Fran would take about 15 minutes. What do you change first?',
        choices: [
          'Turn it into a 20-minute AMRAP',
          'Lower the load so it still takes a few minutes',
          'Replace both movements before touching the bar',
        ],
        answer: 1,
        notes: [
          'A new format is a different workout.',
          'Load is the first variable, and the clock stays short.',
          'The movement is the last thing to change.',
        ],
      },
      {
        prompt: 'Which scale keeps Cindy’s stimulus?',
        choices: [
          'A 10-minute AMRAP with easier pull-ups and push-ups',
          '100 pull-ups for time, then stop',
          'A heavy deadlift five by five',
        ],
        answer: 0,
        notes: [
          'Shorter clock, same pattern, athlete still moving.',
          'That becomes a chipper of one movement.',
          'A strength set is a different day.',
        ],
      },
    ],
  },
  {
    id: 'hip-extension',
    kind: 'methodology',
    title: 'Hip extension',
    body: 'Opening the hip is the engine of these movements. A clean, a high pull, a jump, and a throw start there. The arms finish the job. They do not replace the hips. If the hips stay closed, the arms end up doing a curl.',
    questions: [
      {
        prompt: 'On a medicine-ball clean, what should move the ball?',
        choices: ['The biceps', 'The hips opening', 'A shrug with the hips quiet'],
        answer: 1,
        notes: [
          'The arms receive and guide. They do not throw the ball.',
          'Hip extension is the throw.',
          'A quiet hip means the power never happened.',
        ],
      },
      {
        prompt: 'Which sentence matches the idea?',
        choices: [
          'Powerful hip extension is the athletic center of the lifts',
          'The arms are the engine, and the hips balance you',
          'Hip extension matters only in running',
        ],
        answer: 0,
        notes: [
          'The hips produce the movement.',
          'That reverses the order.',
          'The same hip extension shows up in the lifts.',
        ],
      },
    ],
  },
  {
    id: 'midline',
    kind: 'methodology',
    title: 'Midline',
    body: 'The trunk stays tight so the hips can produce the movement. A collapsing torso is not extra range of motion. It disconnects the hips from the load. In the squat, that shows up as a rounded lower back. In a pull, it shows up as the chest collapsing over the bar.',
    questions: [
      {
        prompt: 'The lower back rounds so the hands can reach lower. What was traded away?',
        choices: [
          'Nothing. More range is always better',
          'A stable trunk the hips can push from',
          'The arm bend, which the deadlift needs',
        ],
        answer: 1,
        notes: [
          'Range that collapses the trunk is not the position.',
          'The tight trunk is what lets the hips work.',
          'The deadlift keeps the arms straight.',
        ],
      },
      {
        prompt: 'Why keep the midline tight in a squat?',
        choices: [
          'So the hips can extend against a stable trunk',
          'So the knees can collapse more easily',
          'So you can look at the floor',
        ],
        answer: 0,
        notes: [
          'A stable trunk gives the hips something to push from.',
          'Knee collapse is a fault.',
          'Gaze is a separate point, and the floor is the wrong target.',
        ],
      },
    ],
  },
  {
    id: 'fran',
    kind: 'benchmark',
    title: 'Fran',
    body: 'Fran is 21-15-9 thrusters and pull-ups, for time. It is a couplet, and the score is the clock. It is meant to last a few minutes. If the prescribed bar and pull-ups would push a newer athlete toward 15 minutes, lower the thruster and scale the pull-up. Keep the rep scheme.',
    questions: [
      {
        prompt: 'How is Fran scored?',
        choices: [
          'Rounds and reps in 20 minutes',
          'Time to finish 21-15-9 thrusters and pull-ups',
          'The heaviest thruster you complete',
        ],
        answer: 1,
        notes: [
          'Fran is not an AMRAP.',
          'The task is fixed, so you record the time.',
          'Load is not the score.',
        ],
      },
      {
        prompt: 'A first attempt would take about 15 minutes as written. What keeps Fran?',
        choices: [
          'Keep the load and rest as long as you need',
          'Lower the thruster and scale the pull-up so it still takes a few minutes',
          'Turn it into a 20-minute AMRAP of the same two movements',
        ],
        answer: 1,
        notes: [
          'Long rest stretches the time domain.',
          'Load first, same reps, short clock.',
          'An AMRAP is a different workout.',
        ],
      },
    ],
  },
  {
    id: 'diane',
    kind: 'benchmark',
    title: 'Diane',
    body: 'Diane is 21-15-9 deadlifts and handstand push-ups, for time. The couplet is the same shape as Fran. The movements are not. Deadlifts and handstand push-ups are Diane. Thrusters and pull-ups are Fran.',
    questions: [
      {
        prompt: 'Which pair is Diane?',
        choices: [
          'Thrusters and pull-ups',
          'Deadlifts and handstand push-ups',
          'Cleans and ring dips',
        ],
        answer: 1,
        notes: [
          'That pair is Fran.',
          'Deadlifts and handstand push-ups are Diane.',
          'That pair is Elizabeth.',
        ],
      },
      {
        prompt: 'How is it scored?',
        choices: [
          'Time to finish 21-15-9 of each',
          'Rounds in 20 minutes',
          'Max deadlift',
        ],
        answer: 0,
        notes: [
          'The rep scheme is fixed, so the score is time.',
          'A 20-minute clock would be a different format.',
          'Diane is not a one-rep max.',
        ],
      },
    ],
  },
  {
    id: 'elizabeth',
    kind: 'benchmark',
    title: 'Elizabeth',
    body: 'Elizabeth is 21-15-9 cleans and ring dips, for time. Grace is 30 clean and jerks. If the workout is cleans and dips in a descending couplet, it is Elizabeth, not Grace.',
    questions: [
      {
        prompt: 'Which workout is Elizabeth?',
        choices: [
          '30 clean and jerks for time',
          '21-15-9 cleans and ring dips for time',
          '21-15-9 deadlifts and handstand push-ups',
        ],
        answer: 1,
        notes: [
          'Thirty clean and jerks is Grace.',
          'Cleans and ring dips, 21-15-9, is Elizabeth.',
          'That is Diane.',
        ],
      },
      {
        prompt: 'What do you record?',
        choices: ['The time to finish', 'Rounds and reps in 20 minutes', 'The heaviest clean'],
        answer: 0,
        notes: [
          'The task is fixed.',
          'There is no fixed clock.',
          'It is not a max.',
        ],
      },
    ],
  },
  {
    id: 'grace',
    kind: 'benchmark',
    title: 'Grace',
    body: 'Grace is 30 clean and jerks for time. It is one barbell movement, cycled, meant to be short. It is not a 20-minute triplet, and it is not a one-rep max.',
    questions: [
      {
        prompt: 'What is Grace?',
        choices: [
          '30 clean and jerks for time',
          '21-15-9 cleans and ring dips',
          'A 20-minute mix of three movements',
        ],
        answer: 0,
        notes: [
          'Thirty clean and jerks is the whole workout.',
          'That is Elizabeth.',
          'Grace is a single movement for time.',
        ],
      },
      {
        prompt: 'A clean without the jerk…',
        choices: [
          'Still counts, because the clean is the hard part',
          'Does not count. The rep is a clean and jerk',
          'Counts if you press it out later in the minute',
        ],
        answer: 1,
        notes: [
          'The jerk is half of the rep.',
          'Both the clean and the jerk have to happen.',
          'There is no later minute. It is 30 reps for time.',
        ],
      },
    ],
  },
  {
    id: 'isabel',
    kind: 'benchmark',
    title: 'Isabel',
    body: 'Isabel is 30 snatches for time. The score is how long those 30 reps take. It is not a one-rep max, and it is not a snatch session of heavy singles with long rest written down as load.',
    questions: [
      {
        prompt: 'How is Isabel scored?',
        choices: [
          'Heaviest snatch of the day',
          'Time to complete 30 snatches',
          'Rounds of snatches in 20 minutes',
        ],
        answer: 1,
        notes: [
          'Load is not the score.',
          'Thirty snatches, then you stop the clock.',
          'The clock is not fixed at 20 minutes.',
        ],
      },
      {
        prompt: 'Which description is Isabel?',
        choices: [
          '30 snatches for time',
          '30 clean and jerks for time',
          '21-15-9 snatches and pull-ups',
        ],
        answer: 0,
        notes: [
          'That is Isabel.',
          'That is Grace.',
          'Isabel is snatches only.',
        ],
      },
    ],
  },
  {
    id: 'cindy',
    kind: 'benchmark',
    title: 'Cindy',
    body: 'Cindy is a 20-minute AMRAP of 5 pull-ups, 10 push-ups, and 15 air squats. The clock is fixed. You record rounds and any extra reps. It is not a race to a set number of rounds.',
    questions: [
      {
        prompt: 'What do you write on the board for Cindy?',
        choices: [
          'Time to finish 20 rounds',
          'Rounds and reps at 20:00',
          'The heaviest squat',
        ],
        answer: 1,
        notes: [
          'There is no target round count.',
          'When the clock ends, you count the work.',
          'The squats are bodyweight.',
        ],
      },
      {
        prompt: 'Which rep scheme is Cindy?',
        choices: [
          '5 pull-ups, 10 push-ups, 15 air squats',
          '5 handstand push-ups, 10 pistols, 15 pull-ups',
          '5 pull-ups, 10 push-ups, 15 squats, every minute',
        ],
        answer: 0,
        notes: [
          'That is the Cindy triplet.',
          'That is Mary.',
          'Every minute on the minute is Chelsea.',
        ],
      },
    ],
  },
  {
    id: 'mary',
    kind: 'benchmark',
    title: 'Mary',
    body: 'Mary is a 20-minute AMRAP of 5 handstand push-ups, 10 pistols, and 15 pull-ups. The format matches Cindy. The movements do not. Calling Mary “Cindy with harder reps” hides which workout you actually did.',
    questions: [
      {
        prompt: 'Which triplet is Mary?',
        choices: [
          '5 pull-ups, 10 push-ups, 15 air squats',
          '5 handstand push-ups, 10 pistols, 15 pull-ups',
          '5 pull-ups, 10 push-ups, 15 squats every minute',
        ],
        answer: 1,
        notes: [
          'That is Cindy.',
          'Handstand push-ups, pistols, and pull-ups are Mary.',
          'That is Chelsea.',
        ],
      },
      {
        prompt: 'How is Mary scored?',
        choices: [
          'Rounds and reps in 20 minutes',
          'Time to 10 rounds',
          'Load on the pistols',
        ],
        answer: 0,
        notes: [
          'The clock is fixed at 20 minutes.',
          'There is no set number of rounds.',
          'Pistols are bodyweight.',
        ],
      },
    ],
  },
  {
    id: 'chelsea',
    kind: 'benchmark',
    title: 'Chelsea',
    body: 'Chelsea is every minute on the minute: 5 pull-ups, 10 push-ups, and 15 squats. You start each minute together. Whatever time is left in the minute is rest. It is not a sprint AMRAP that ignores the minute breaks.',
    questions: [
      {
        prompt: 'You finish the reps at 0:40. What happens to the remaining 20 seconds?',
        choices: [
          'You start the next round immediately',
          'You rest until the next minute starts',
          'You add extra squats',
        ],
        answer: 1,
        notes: [
          'Starting early turns it into an AMRAP.',
          'The leftover time is the rest.',
          'Extra reps are not the workout.',
        ],
      },
      {
        prompt: 'How is this different from Cindy?',
        choices: [
          'Cindy is 20 continuous minutes. Chelsea restarts each minute',
          'They are the same workout',
          'Chelsea is 21-15-9 for time',
        ],
        answer: 0,
        notes: [
          'The minute clock, and the rest inside it, is Chelsea.',
          'The movements match. The clock does not.',
          '21-15-9 is a couplet like Fran, not Chelsea.',
        ],
      },
    ],
  },
  {
    id: 'helen',
    kind: 'benchmark',
    title: 'Helen',
    body: 'Helen is 3 rounds for time of a 400 m run, 21 kettlebell swings, and 12 pull-ups. The run is part of the workout. Dropping it leaves a couplet, not Helen.',
    questions: [
      {
        prompt: 'What are the three pieces?',
        choices: [
          '400 m run, 21 kettlebell swings, 12 pull-ups',
          'Row, thrusters, and pull-ups',
          '21 kettlebell swings and 12 pull-ups only',
        ],
        answer: 0,
        notes: [
          'Run, swings, and pull-ups, three rounds.',
          'That is a different triplet.',
          'Without the run it is no longer Helen.',
        ],
      },
      {
        prompt: 'How is Helen scored?',
        choices: [
          'Time to finish 3 rounds',
          'Calories on the run',
          'Rounds in 20 minutes',
        ],
        answer: 0,
        notes: [
          'Three rounds are the task. The score is time.',
          'The run is 400 meters, not calories.',
          'The clock is not fixed.',
        ],
      },
    ],
  },
  {
    id: 'angie',
    kind: 'benchmark',
    title: 'Angie',
    body: 'Angie is 100 pull-ups, 100 push-ups, 100 sit-ups, and 100 squats, for time. It is a chipper: you finish one movement before the next. Splitting a movement into smaller sets is how you pace it. That split is not a different workout.',
    questions: [
      {
        prompt: 'How do you get through 100 pull-ups?',
        choices: [
          'Only as one unbroken set. Anything else is a different workout',
          'In sets you can repeat, then move on to the push-ups',
          'By skipping ahead to squats when the pull-ups slow down',
        ],
        answer: 1,
        notes: [
          'Partitioning a big set is pacing, not a new workout.',
          'Smaller sets still add up to 100, then you move on.',
          'Changing the order leaves Angie.',
        ],
      },
      {
        prompt: 'What is the score?',
        choices: [
          'Time to finish all 400 reps',
          'Rounds and reps in 20 minutes',
          'How many unbroken pull-ups you had',
        ],
        answer: 0,
        notes: [
          'The task is the four hundreds. The score is time.',
          'There is no 20-minute cap in the benchmark.',
          'Unbroken sets are a pacing choice, not the score.',
        ],
      },
    ],
  },
  {
    id: 'karen',
    kind: 'benchmark',
    title: 'Karen',
    body: 'Karen is 150 wall-ball shots for time. The target height is part of the rep. When you scale, change the ball or the target before you replace the wall ball with a different movement.',
    questions: [
      {
        prompt: 'What is the score?',
        choices: [
          'Time to 150 wall-ball shots',
          'Reps in 10 minutes',
          'Heaviest ball for one shot',
        ],
        answer: 0,
        notes: [
          'One hundred fifty shots, then stop the clock.',
          'The benchmark is not an AMRAP.',
          'It is not a max-height or max-load test.',
        ],
      },
      {
        prompt: 'The prescribed ball is too heavy. What do you change first?',
        choices: [
          'The ball or the target height',
          'Swap to air squats and call it Karen',
          'Do 150 thrusters instead',
        ],
        answer: 0,
        notes: [
          'Load and target stay inside the same movement.',
          'Air squats drop the throw and the target.',
          'Thrusters are a different movement.',
        ],
      },
    ],
  },
  {
    id: 'dt',
    kind: 'benchmark',
    title: 'DT',
    body: 'DT is 5 rounds for time of 12 deadlifts, 9 hang power cleans, and 6 push jerks. The clean is a hang power clean: it starts at the hang, and you catch it in a partial squat, not a full squat clean. Writing down full squat cleans and calling the workout DT changes the middle movement.',
    questions: [
      {
        prompt: 'What is the middle movement?',
        choices: [
          'Squat clean from the floor',
          'Hang power clean',
          'Power snatch',
        ],
        answer: 1,
        notes: [
          'A full squat clean from the floor is a different rep.',
          'Hang power cleans are the 9.',
          'DT does not include a snatch.',
        ],
      },
      {
        prompt: 'What is the rep scheme each round?',
        choices: [
          '12 deadlifts, 9 hang power cleans, 6 push jerks',
          '21 deadlifts, 15 cleans, 9 jerks',
          '5 deadlifts, 5 cleans, 5 jerks',
        ],
        answer: 0,
        notes: [
          '12, 9, and 6, five rounds.',
          '21-15-9 is a different couplet shape.',
          'Fives are not DT.',
        ],
      },
    ],
  },
  {
    id: 'murph',
    kind: 'benchmark',
    title: 'Murph',
    body: 'Murph is a 1 mile run, then 100 pull-ups, 200 push-ups, and 300 squats, then a 1 mile run. Splitting the middle work into smaller sets is allowed. A vest is the classic load. Doing the pull-ups, push-ups, and squats in one unbroken block is a pacing choice, not the only legal version.',
    questions: [
      {
        prompt: 'Which order is Murph?',
        choices: [
          'Run, 100 pull-ups, 200 push-ups, 300 squats, run',
          '100 pull-ups, 200 push-ups, 300 squats, then a run if you have time',
          'Run, 300 squats, 200 push-ups, 100 pull-ups, run',
        ],
        answer: 0,
        notes: [
          'The mile bookends the chipper, in that order.',
          'Both runs are part of the workout.',
          'The middle order is pull-ups, then push-ups, then squats.',
        ],
      },
      {
        prompt: 'You break the 100 pull-ups into sets of 5. Is that still Murph?',
        choices: [
          'No. It has to be unbroken',
          'Yes. Partitioning the middle is part of doing it',
          'Only if you skip the vest and both runs',
        ],
        answer: 1,
        notes: [
          'Unbroken is not required.',
          'Sets that add up to 100, 200, and 300 are still Murph.',
          'The runs stay. The vest is the classic load, not a reason to drop the runs.',
        ],
      },
    ],
  },
  {
    id: 'fight-gone-bad',
    kind: 'benchmark',
    title: 'Fight Gone Bad',
    body: 'Fight Gone Bad is three rounds of five stations, one minute each: wall balls, sumo deadlift high pulls, box jumps, push presses, and calories on the rower. One minute of rest separates the rounds. The score is total reps. You do not race the clock to a fixed amount of work.',
    questions: [
      {
        prompt: 'What is the score?',
        choices: [
          'Total reps across the stations',
          'Time to a set number of reps at each station',
          'The heaviest push press',
        ],
        answer: 0,
        notes: [
          'Every rep on every station adds up.',
          'The minutes are fixed. You do not finish early and move on.',
          'Load is prescribed. It is not the score.',
        ],
      },
      {
        prompt: 'The minute of wall balls ends. What happens?',
        choices: [
          'You move to the next station',
          'You rest for a minute before every station',
          'You keep throwing until you hit 50',
        ],
        answer: 0,
        notes: [
          'Stations run back to back. Rest is between rounds.',
          'The rest minute is after the five stations, not after each one.',
          'There is no rep target inside the minute.',
        ],
      },
    ],
  },
  {
    id: 'snatch',
    kind: 'movement',
    title: 'Snatch',
    body: 'In the snatch the bar stays close and the hips finish opening before you pull yourself under it. The catch is overhead, arms locked, in a squat. It is one pull from the floor or the hang to overhead, not a clean that you then press.',
    link: watch('the-snatch', 'Watch the snatch'),
    questions: [
      {
        prompt: 'When do you pull under the bar?',
        choices: [
          'After the hips have opened',
          'While the hips are still sitting back',
          'After you have cleaned it to the shoulders',
        ],
        answer: 0,
        notes: [
          'The hips throw the bar. Then you meet it overhead.',
          'Pulling under early skips the hip extension.',
          'A clean to the shoulders is a different lift.',
        ],
      },
      {
        prompt: 'Where does a snatch finish?',
        choices: [
          'On the shoulders',
          'Overhead, arms locked',
          'At the hips, with a shrug',
        ],
        answer: 1,
        notes: [
          'The shoulders are the clean.',
          'The bar is overhead with the arms locked out.',
          'A shrug is not the catch.',
        ],
      },
    ],
  },
  {
    id: 'wall-ball',
    kind: 'movement',
    title: 'Wall ball',
    body: 'A wall ball is a squat to depth, then a throw that hits the target. The ball comes back to the chest and you go again. Missing the target, or stopping the squat above the knee, means the rep did not happen.',
    link: watch('the-wall-ball-shot', 'Watch the wall ball'),
    questions: [
      {
        prompt: 'The ball hits below the target. Does the rep count?',
        choices: [
          'Yes, if the squat was deep',
          'No. The ball has to hit the target',
          'Yes, if you catch it cleanly',
        ],
        answer: 1,
        notes: [
          'Depth is required, and so is the target.',
          'The target is part of the rep.',
          'A clean catch does not replace the hit.',
        ],
      },
      {
        prompt: 'What is the squat in a wall ball?',
        choices: [
          'A full squat, hip crease below the knee',
          'A quarter squat, because the throw is the point',
          'Optional, if the ball is heavy',
        ],
        answer: 0,
        notes: [
          'The squat still has to reach depth.',
          'A short squat is not the movement.',
          'Load does not erase the depth standard.',
        ],
      },
    ],
  },
  {
    id: 'handstand-push-up',
    kind: 'movement',
    title: 'Handstand push-up',
    body: 'A handstand push-up lowers until the head touches the floor, then presses back to a locked-out handstand. The head has to actually touch. Stopping short, or never locking the elbows at the top, leaves the rep unfinished.',
    link: watch('the-handstand-push-up', 'Watch the handstand push-up'),
    questions: [
      {
        prompt: 'The head never reaches the floor. What failed?',
        choices: [
          'Nothing, if the kip was big',
          'The bottom of the rep',
          'The lockout, which happens at the bottom',
        ],
        answer: 1,
        notes: [
          'A kip does not replace the head touching.',
          'Depth here is the head on the floor.',
          'Lockout is at the top, in the handstand.',
        ],
      },
      {
        prompt: 'When is the rep finished?',
        choices: [
          'When the head leaves the floor',
          'When the elbows are locked out overhead',
          'When the heels touch the wall',
        ],
        answer: 1,
        notes: [
          'Leaving the floor is the start of the press, not the finish.',
          'Locked elbows in the handstand finish the rep.',
          'The wall is a setup, not the standard for the top.',
        ],
      },
    ],
  },
  {
    id: 'kettlebell-swing',
    kind: 'movement',
    title: 'Kettlebell swing',
    body: 'The CrossFit kettlebell swing is thrown by the hips, not lifted by the shoulders. The arms stay long until the bell floats. The finish is overhead, arms straight, hips and knees open. A front raise with bent elbows is a different exercise.',
    link: watch('the-kettlebell-swing', 'Watch the kettlebell swing'),
    questions: [
      {
        prompt: 'What moves the kettlebell?',
        choices: ['The hips opening', 'A shoulder raise', 'A biceps curl at the top'],
        answer: 0,
        notes: [
          'The hip snap is the swing.',
          'The shoulders do not lift the bell through the arc.',
          'The arms stay long. They do not curl.',
        ],
      },
      {
        prompt: 'Where does the swing finish?',
        choices: [
          'At chest height, elbows bent',
          'Overhead, arms straight, hips open',
          'On the shoulders, like a clean',
        ],
        answer: 1,
        notes: [
          'Bent elbows and a short arc miss the finish.',
          'Overhead, with the body tall, is the CrossFit swing.',
          'A rack position is a clean, not a swing.',
        ],
      },
    ],
  },
  {
    id: 'push-up',
    kind: 'movement',
    title: 'Push-up',
    body: 'In a push-up the body stays in one line. The chest reaches the floor, then the elbows lock out at the top. A sagging hip, or a rep that never gets the chest down, does not count.',
    link: watch('the-push-up', 'Watch the push-up'),
    questions: [
      {
        prompt: 'The hips drop on the way down. What failed?',
        choices: [
          'The body line',
          'Nothing. Extra range is the goal',
          'The lockout, which is at the bottom',
        ],
        answer: 0,
        notes: [
          'The torso and legs stay one line.',
          'A sag is not useful range.',
          'Lockout is at the top.',
        ],
      },
      {
        prompt: 'Which top position finishes the rep?',
        choices: [
          'Elbows still bent, chest off the floor',
          'Elbows locked, body in a line',
          'Hips piked up, arms straight',
        ],
        answer: 1,
        notes: [
          'Bent elbows mean you are not done.',
          'Locked elbows and a straight body are the top.',
          'Piking the hips is a different fault.',
        ],
      },
    ],
  },
  {
    id: 'box-jump',
    kind: 'movement',
    title: 'Box jump',
    body: 'A box jump lands you on the box, then you stand up to full hip and knee extension. Stepping down is fine. A step-up, where you never leave the ground, is a scale, not the jump itself.',
    link: watch('the-box-jump', 'Watch the box jump'),
    questions: [
      {
        prompt: 'You land on the box but stay in a squat. Does the rep count?',
        choices: [
          'Yes. Landing is the rep',
          'No. You still have to stand tall',
          'Yes, if you clap at the bottom',
        ],
        answer: 1,
        notes: [
          'The landing is not the finish.',
          'Hips and knees open on top of the box.',
          'A clap is not the standard.',
        ],
      },
      {
        prompt: 'Which version is still a box jump?',
        choices: [
          'Both feet leave the ground, then you stand on the box',
          'You step up one foot at a time and stand',
          'You touch the box with a hand and turn around',
        ],
        answer: 0,
        notes: [
          'The jump is both feet leaving the floor.',
          'A step-up is the scale when jumping is not the task.',
          'Touching the box is not a jump.',
        ],
      },
    ],
  },
  {
    id: 'double-under',
    kind: 'movement',
    title: 'Double-under',
    body: 'A double-under is one jump with the rope passing under the feet twice. Two single-unders are two jumps and two passes, and they are not one double-under. The rope has to clear twice before you land.',
    link: watch('the-double-under', 'Watch the double-under'),
    questions: [
      {
        prompt: 'The rope passes once per jump, twice in a row. How many double-unders is that?',
        choices: ['Two', 'One', 'Zero'],
        answer: 2,
        notes: [
          'Two singles are not two double-unders.',
          'One double-under needs two passes in the same jump.',
          'Each of those jumps was a single.',
        ],
      },
      {
        prompt: 'What makes the rep a double-under?',
        choices: [
          'Two rope passes in one jump',
          'A higher jump with one rope pass',
          'The rope hitting the shins twice',
        ],
        answer: 0,
        notes: [
          'Two passes, one jump.',
          'Jump height alone does not add a pass.',
          'Tripping on the rope is a miss, not a rep.',
        ],
      },
    ],
  },
  {
    id: 'ring-dip',
    kind: 'movement',
    title: 'Ring dip',
    body: 'A ring dip starts with the elbows locked and the shoulders down. You lower until the shoulders pass below the elbows, then press back to lockout. A short bend of the elbows is not the bottom.',
    link: watch('the-ring-dip', 'Watch the ring dip'),
    questions: [
      {
        prompt: 'How deep is the bottom?',
        choices: [
          'Elbows bent a little',
          'Shoulders below the elbows',
          'Rings touching the thighs',
        ],
        answer: 1,
        notes: [
          'A small bend never reaches the standard.',
          'The shoulders drop below the elbows.',
          'The rings do not have to reach the thighs.',
        ],
      },
      {
        prompt: 'What finishes the rep?',
        choices: [
          'Leaving the bottom',
          'Elbows locked out, shoulders down',
          'The rings swinging still',
        ],
        answer: 1,
        notes: [
          'The press has to finish.',
          'Lock the elbows and settle the shoulders.',
          'Still rings are nice. They are not the standard.',
        ],
      },
    ],
  },
  {
    id: 'abmat-sit-up',
    kind: 'movement',
    title: 'AbMat sit-up',
    body: 'An AbMat sit-up goes from the shoulder blades on the ground to sitting up until the hands reach the feet. A crunch that never gets the shoulder blades down, or never sits up, is not the rep.',
    link: watch('the-abmat-sit-up', 'Watch the AbMat sit-up'),
    questions: [
      {
        prompt: 'Which position is the bottom?',
        choices: [
          'Shoulder blades on the ground',
          'Halfway down, shoulder blades still off the floor',
          'Hands behind the head, torso upright',
        ],
        answer: 0,
        notes: [
          'The shoulder blades touch at the bottom.',
          'Stopping short skips the bottom.',
          'Upright is the top, not the bottom.',
        ],
      },
      {
        prompt: 'What finishes the sit-up?',
        choices: [
          'The shoulder blades lift off the floor',
          'The hands reach the feet',
          'The knees pull in',
        ],
        answer: 1,
        notes: [
          'Leaving the floor is the start of the sit-up.',
          'Reaching the feet is the top.',
          'The knees stay put. They do not finish the rep.',
        ],
      },
    ],
  },
  {
    id: 'muscle-up',
    kind: 'movement',
    title: 'Muscle-up',
    body: 'A muscle-up connects a pull and a dip in one motion on the rings. You pull until you are over the rings, transition, and press to a locked-out dip. A pull-up, a pause, and a separate dip is the scale, not the muscle-up.',
    link: watch('the-muscle-up', 'Watch the muscle-up'),
    questions: [
      {
        prompt: 'Which rep is a muscle-up?',
        choices: [
          'A pull-up, then you drop, then a dip',
          'A pull that passes straight into a locked-out dip',
          'A dip only, from a jump to support',
        ],
        answer: 1,
        notes: [
          'The pause splits it into two exercises.',
          'The transition joins the pull and the dip.',
          'Support without the pull is only a dip.',
        ],
      },
      {
        prompt: 'What is the top of the rep?',
        choices: [
          'The chin over the rings',
          'Elbows locked in a dip',
          'The feet leaving the floor',
        ],
        answer: 1,
        notes: [
          'The chin is the pull-up, not the muscle-up finish.',
          'The dip locks out overhead of the rings.',
          'Leaving the floor is the start.',
        ],
      },
    ],
  },
  {
    id: 'virtuosity',
    kind: 'methodology',
    title: 'Virtuosity',
    body: 'Virtuosity is doing a common movement unusually well. The air squat, the press, and the deadlift are the practice. Collecting harder skills before those are sound is not the same thing.',
    questions: [
      {
        prompt: 'Which session matches the idea?',
        choices: [
          'Slow air squats that meet every point of performance',
          'A new max snatch on the first day you see the lift',
          'A machine circuit you already know by heart',
        ],
        answer: 0,
        notes: [
          'The ordinary squat, done to standard, is the work.',
          'A max on a new lift skips the common movement.',
          'A machine circuit is not the movement.',
        ],
      },
      {
        prompt: 'What is being mastered?',
        choices: [
          'The simple movement, held to a clear standard',
          'Whichever skill looks the most advanced',
          'How long you can move with poor positions',
        ],
        answer: 0,
        notes: [
          'Common, done uncommonly well.',
          'Advanced appearance is not the definition.',
          'Endurance in a bad position practices the fault.',
        ],
      },
    ],
  },
  {
    id: 'safety-efficacy-efficiency',
    kind: 'methodology',
    title: 'Safety, efficacy, efficiency',
    body: 'Technique is how a movement stays safe, gets the result, and wastes less energy. A fast rep that misses the position spends energy and does less useful work. The same standard serves all three.',
    questions: [
      {
        prompt: 'Two athletes move the same load. One keeps the positions, one rounds through them. Who did more useful work?',
        choices: [
          'The one who kept the positions',
          'The one who moved faster, regardless of position',
          'They match, because the load was the same',
        ],
        answer: 0,
        notes: [
          'The position is what turns effort into work you can use.',
          'Speed without the position spends energy and raises the risk.',
          'The same load in two positions is not the same work.',
        ],
      },
      {
        prompt: 'Why does the standard matter for safety?',
        choices: [
          'A missed position is how these lifts go wrong',
          'Safety is a separate warm-up, not the rep',
          'Only heavy singles can hurt you',
        ],
        answer: 0,
        notes: [
          'The position is the safety.',
          'The rep itself is where it holds or fails.',
          'Light reps with a bad position still teach the fault.',
        ],
      },
    ],
  },
  {
    id: 'relative-intensity',
    kind: 'methodology',
    title: 'Relative intensity',
    body: 'Intensity is relative to the athlete. Two people can use different loads and still get the same kind of workout, if each is working hard inside the same time window. The number on the board is not the only way to be intense.',
    questions: [
      {
        prompt: 'A newer athlete uses less load and finishes Fran in four minutes. An experienced athlete uses more and also finishes in four minutes. What matches?',
        choices: [
          'Only the heavier workout was intense',
          'Both can be the same stimulus for the person doing it',
          'Neither was intense, because four minutes is short',
        ],
        answer: 1,
        notes: [
          'Heavier is not automatically more intense for that athlete.',
          'Same window, hard relative to each person.',
          'A short clock is the point of Fran, not a reason it was easy.',
        ],
      },
      {
        prompt: 'What do you keep the same when the loads differ?',
        choices: [
          'The time window and the movement pattern',
          'The exact weight on the bar',
          'The rest periods, stretched as needed',
        ],
        answer: 0,
        notes: [
          'Time and pattern are the shared stimulus.',
          'The weight is what changes.',
          'Extra rest changes the window.',
        ],
      },
    ],
  },
  {
    id: 'no-rep',
    kind: 'methodology',
    title: 'A no-rep',
    body: 'A rep that misses the standard is not counted. Effort does not replace the line you had to cross. You do the rep again, or it never happened. The score is the reps that met the standard.',
    questions: [
      {
        prompt: 'The chin stops under the bar. The set felt hard. What gets counted?',
        choices: [
          'The rep, because of the effort',
          'Nothing for that rep',
          'Half a rep',
        ],
        answer: 1,
        notes: [
          'Effort is not the standard.',
          'The chin never cleared the bar, so it is a no-rep.',
          'There is no half rep on the board.',
        ],
      },
      {
        prompt: 'What do you do with a no-rep?',
        choices: [
          'Leave it in the score and move on',
          'Repeat it to the standard, or do not count it',
          'Add load so the next one matters more',
        ],
        answer: 1,
        notes: [
          'A missed rep does not go on the board.',
          'Redo it, or it stays off the score.',
          'Load does not repair the rep you already missed.',
        ],
      },
    ],
  },
  {
    id: 'whiteboard',
    kind: 'methodology',
    title: 'What goes on the board',
    body: 'The workout tells you what to write down. For time, you write a clock. For an AMRAP, you write rounds and the extra reps. For a heavy day, you write the load. How you felt is not the score.',
    questions: [
      {
        prompt: 'Cindy is a 20-minute AMRAP. What is the score?',
        choices: [
          'A time',
          'Rounds and reps',
          'The load you used',
        ],
        answer: 1,
        notes: [
          'The clock was fixed. Time is not the result.',
          'You record how much work the clock allowed.',
          'Cindy does not change the load.',
        ],
      },
      {
        prompt: 'Grace is 30 clean and jerks for time. What is the score?',
        choices: [
          'The time to finish',
          'Rounds and reps in 20 minutes',
          'How many reps felt heavy',
        ],
        answer: 0,
        notes: [
          'The task is fixed, so the score is the clock.',
          'There is no open-ended clock.',
          'A feeling is not a score.',
        ],
      },
    ],
  },
  {
    id: 'continuum',
    kind: 'methodology',
    title: 'Sickness, wellness, fitness',
    body: 'In this model, health and fitness sit on one line. One end is sick, the middle is ordinary, and the far end is better than ordinary. The same qualities, such as strength or blood pressure, can land in any of the three. Training is aimed at the far end, not at “normal.”',
    questions: [
      {
        prompt: 'Where does this model want the athlete?',
        choices: [
          'At ordinary, and then stop',
          'Past ordinary, on the fitness end of the line',
          'Only concerned with disease, not capacity',
        ],
        answer: 1,
        notes: [
          'Normal is the middle, not the goal.',
          'Fitness is better than ordinary on the same measures.',
          'Avoiding disease is the near end. Capacity is the far end.',
        ],
      },
      {
        prompt: 'A strong squat and a healthy blood pressure are treated as…',
        choices: [
          'Unrelated topics',
          'Points on the same continuum',
          'Things that only matter after 60',
        ],
        answer: 1,
        notes: [
          'The model does not split health off from fitness.',
          'Both can be sick, ordinary, or exceptional.',
          'The line applies at any age.',
        ],
      },
    ],
  },
  {
    id: 'fuel',
    kind: 'methodology',
    title: 'What to eat',
    body: 'The simple plate is meat and vegetables, nuts and seeds, some fruit, little starch, and no sugar. That is the whole card. Block counting and supplement lists are a different subject, and they are not required to use this rule.',
    questions: [
      {
        prompt: 'Which plate matches the rule?',
        choices: [
          'Meat, vegetables, some fruit, nuts, little starch',
          'A sports drink and a pastry before every workout',
          'Only fruit, as much as you want',
        ],
        answer: 0,
        notes: [
          'That is the plate.',
          'Sugar is the thing this rule takes out.',
          'Fruit is “some,” not the whole meal.',
        ],
      },
      {
        prompt: 'What does this card leave out on purpose?',
        choices: [
          'Weighing food into blocks',
          'Vegetables',
          'The idea of skipping sugar',
        ],
        answer: 0,
        notes: [
          'Blocks are a later tool, not this lesson.',
          'Vegetables are in the rule.',
          'No sugar is part of the sentence.',
        ],
      },
    ],
  },
  {
    id: 'barbara',
    kind: 'benchmark',
    title: 'Barbara',
    body: 'Barbara is five rounds for time of 20 pull-ups, 30 push-ups, 40 sit-ups, and 50 squats. You rest three minutes between rounds. The rest is part of the workout. The score is the time to finish all five rounds.',
    questions: [
      {
        prompt: 'What happens between rounds?',
        choices: [
          'You start the next round immediately',
          'You rest three minutes',
          'You row 500 meters',
        ],
        answer: 1,
        notes: [
          'Immediate starts would be a different piece.',
          'Three minutes of rest is written into Barbara.',
          'There is no row.',
        ],
      },
      {
        prompt: 'What is the score?',
        choices: [
          'Time to finish five rounds, rests included',
          'Rounds in 20 minutes',
          'How many unbroken pull-ups you held',
        ],
        answer: 0,
        notes: [
          'The task is five rounds. The clock includes the rests.',
          'The clock is not capped at 20 minutes.',
          'Unbroken sets are pacing, not the score.',
        ],
      },
    ],
  },
  {
    id: 'jackie',
    kind: 'benchmark',
    title: 'Jackie',
    body: 'Jackie is for time: a 1,000 meter row, then 50 thrusters, then 30 pull-ups. The row is first and it counts. Dropping it leaves a couplet, not Jackie. The score is the time to finish all three pieces.',
    questions: [
      {
        prompt: 'What is the order?',
        choices: [
          '1,000 meter row, 50 thrusters, 30 pull-ups',
          '50 thrusters, 30 pull-ups, then row if time is left',
          '21-15-9 thrusters and pull-ups',
        ],
        answer: 0,
        notes: [
          'Row, then thrusters, then pull-ups.',
          'The row is not optional.',
          '21-15-9 is Fran.',
        ],
      },
      {
        prompt: 'How is Jackie scored?',
        choices: [
          'Time to finish',
          'Calories on the rower',
          'Rounds and reps in 20 minutes',
        ],
        answer: 0,
        notes: [
          'The work is fixed, so you stop the clock at the end.',
          'The row is 1,000 meters, not calories.',
          'There is no fixed clock.',
        ],
      },
    ],
  },
  {
    id: 'nancy',
    kind: 'benchmark',
    title: 'Nancy',
    body: 'Nancy is five rounds for time of a 400 meter run and 15 overhead squats. The overhead squat still has to reach depth with the bar over the middle of the foot. The run stays in. The score is the time.',
    questions: [
      {
        prompt: 'What is one round of Nancy?',
        choices: [
          '400 meter run and 15 overhead squats',
          '400 meter run and 15 thrusters',
          '15 overhead squats only',
        ],
        answer: 0,
        notes: [
          'Run, then overhead squats, five times.',
          'Thrusters are a different movement.',
          'Without the run it is not Nancy.',
        ],
      },
      {
        prompt: 'A high squat with the bar overhead…',
        choices: [
          'Counts, because the bar was overhead',
          'Does not count. Depth still applies',
          'Counts as two reps if the bar was heavy',
        ],
        answer: 1,
        notes: [
          'Overhead position is not the only standard.',
          'The hip crease still has to pass the knee.',
          'Load does not double a missed rep.',
        ],
      },
    ],
  },
  {
    id: 'annie',
    kind: 'benchmark',
    title: 'Annie',
    body: 'Annie is 50-40-30-20-10 reps of double-unders and sit-ups, for time. A double-under is two rope passes in one jump. Singles do not add up to the same rep. The score is the time to finish the descending ladder.',
    questions: [
      {
        prompt: 'What is the rep scheme?',
        choices: [
          '50-40-30-20-10 double-unders and sit-ups',
          '21-15-9 double-unders and sit-ups',
          '20 minutes of double-unders',
        ],
        answer: 0,
        notes: [
          'The ladder is 50 down to 10.',
          '21-15-9 is a different couplet.',
          'Annie is for time, not an AMRAP.',
        ],
      },
      {
        prompt: 'You do not have double-unders yet. What do you change first?',
        choices: [
          'The rope skill, toward two passes, before you delete the jump',
          'Swap the rope for a row and call it Annie',
          'Turn it into a 20-minute AMRAP of sit-ups',
        ],
        answer: 0,
        notes: [
          'Practice the passes. Single-unders are the step toward the same movement.',
          'A row replaces the pattern.',
          'Sit-ups alone drop half the workout and change the clock.',
        ],
      },
    ],
  },
  {
    id: 'linda',
    kind: 'benchmark',
    title: 'Linda',
    body: 'Linda is 10-9-8-7-6-5-4-3-2-1 reps of three lifts: a deadlift at one and a half times bodyweight, a bench press at bodyweight, and a clean at three-quarters bodyweight. It is for time. The loads are set from the athlete, which is why people call it the three bars of death.',
    questions: [
      {
        prompt: 'How is the load chosen?',
        choices: [
          'From the athlete’s bodyweight',
          'The same bar for everyone',
          'Whatever is on the closest rack',
        ],
        answer: 0,
        notes: [
          'Each lift is a fraction of bodyweight.',
          'A fixed bar would be a different workout.',
          'The loads are prescribed, not improvised.',
        ],
      },
      {
        prompt: 'What is the rep scheme?',
        choices: [
          '10 down to 1, of all three lifts',
          '21-15-9 of the three lifts',
          'Five heavy singles of each',
        ],
        answer: 0,
        notes: [
          'The ladder runs from 10 to 1.',
          '21-15-9 is not Linda.',
          'The sets get lighter in reps, not a max-out.',
        ],
      },
    ],
  },
  {
    id: 'kelly',
    kind: 'benchmark',
    title: 'Kelly',
    body: 'Kelly is five rounds for time of a 400 meter run, 30 box jumps, and 30 wall balls. All three stay in the round. The wall ball still has to hit the target from a full squat. The score is the time.',
    questions: [
      {
        prompt: 'What is one round?',
        choices: [
          '400 meter run, 30 box jumps, 30 wall balls',
          '400 meter run and 21 kettlebell swings',
          '30 wall balls only',
        ],
        answer: 0,
        notes: [
          'Run, box jumps, wall balls.',
          'That mix is closer to Helen.',
          'The run and the jumps are part of the round.',
        ],
      },
      {
        prompt: 'How many rounds?',
        choices: ['Five', 'Three', 'Twenty minutes, as many as possible'],
        answer: 0,
        notes: [
          'Kelly is five rounds for time.',
          'Three rounds would be a different piece.',
          'The score is not an AMRAP.',
        ],
      },
    ],
  },
  {
    id: 'jt',
    kind: 'benchmark',
    title: 'JT',
    body: 'JT is 21-15-9 reps of handstand push-ups, ring dips, and push-ups, for time. It is a gymnastics triplet in the same rep scheme as Fran. The movements are not Fran’s. The score is the time.',
    questions: [
      {
        prompt: 'Which triplet is JT?',
        choices: [
          'Handstand push-ups, ring dips, and push-ups',
          'Thrusters and pull-ups',
          'Deadlifts, hang power cleans, and push jerks',
        ],
        answer: 0,
        notes: [
          'Three gymnastics movements, 21-15-9.',
          'That is Fran, and it is two movements.',
          'That is DT.',
        ],
      },
      {
        prompt: 'How is it scored?',
        choices: [
          'Time to finish 21-15-9 of each',
          'Rounds in 20 minutes',
          'The heaviest dip',
        ],
        answer: 0,
        notes: [
          'The reps are fixed. You record the clock.',
          'There is no 20-minute cap.',
          'JT is not a max.',
        ],
      },
    ],
  },
  {
    id: 'randy',
    kind: 'benchmark',
    title: 'Randy',
    body: 'Randy is 75 power snatches for time. The snatch is a power snatch: you catch it overhead in a partial squat, not a full squat snatch. The score is how long the 75 reps take.',
    questions: [
      {
        prompt: 'What is Randy?',
        choices: [
          '75 power snatches for time',
          '30 squat snatches for time',
          'A one-rep max snatch',
        ],
        answer: 0,
        notes: [
          'Seventy-five power snatches, then stop the clock.',
          'Thirty snatches is Isabel, and it does not specify a power catch.',
          'Randy is a cycling workout, not a max.',
        ],
      },
      {
        prompt: 'Which catch is the power snatch?',
        choices: [
          'Overhead in a partial squat',
          'In a full squat, hips below the knees',
          'On the shoulders',
        ],
        answer: 0,
        notes: [
          'Power means the catch is above parallel.',
          'Hips below the knees is a squat snatch.',
          'The shoulders are a clean.',
        ],
      },
    ],
  },
  {
    id: 'josh',
    kind: 'benchmark',
    title: 'Josh',
    body: 'Josh is 21-15-9 overhead squats and pull-ups, for time. It has Fran’s rep scheme and a different couplet. The overhead squat still needs depth and a bar over the middle of the foot. The score is the time.',
    questions: [
      {
        prompt: 'What are the two movements?',
        choices: [
          'Overhead squats and pull-ups',
          'Thrusters and pull-ups',
          'Overhead squats and handstand push-ups',
        ],
        answer: 0,
        notes: [
          'That is Josh.',
          'Thrusters and pull-ups are Fran.',
          'There is no handstand push-up in Josh.',
        ],
      },
      {
        prompt: 'An overhead squat that stays above parallel…',
        choices: [
          'Counts if the pull-up was strict',
          'Is a no-rep',
          'Counts as a thruster',
        ],
        answer: 1,
        notes: [
          'The other movement does not repair this one.',
          'Depth is still required.',
          'A high squat is not a thruster.',
        ],
      },
    ],
  },
  {
    id: 'nate',
    kind: 'benchmark',
    title: 'Nate',
    body: 'Nate is a 20-minute AMRAP of 2 muscle-ups, 4 handstand push-ups, and 8 kettlebell swings. The clock is fixed. You write rounds and any extra reps. It is not a race to a set number of muscle-ups.',
    questions: [
      {
        prompt: 'What is the score?',
        choices: [
          'Rounds and reps at 20:00',
          'Time to 10 rounds',
          'The heaviest kettlebell',
        ],
        answer: 0,
        notes: [
          'Twenty minutes is the clock. The work is the score.',
          'There is no target round count.',
          'The bell is prescribed. It is not the result.',
        ],
      },
      {
        prompt: 'What is the triplet each round?',
        choices: [
          '2 muscle-ups, 4 handstand push-ups, 8 kettlebell swings',
          '5 pull-ups, 10 push-ups, 15 squats',
          '21-15-9 handstand push-ups, ring dips, and push-ups',
        ],
        answer: 0,
        notes: [
          'That is Nate.',
          'That is Cindy.',
          'That is JT, and it is for time.',
        ],
      },
    ],
  },
  {
    id: 'badger',
    kind: 'benchmark',
    title: 'Badger',
    body: 'Badger is three rounds for time of 30 squat cleans, 30 pull-ups, and an 800 meter run. The clean is a squat clean, caught in a full squat. The run stays in every round. The score is the time.',
    questions: [
      {
        prompt: 'What is one round?',
        choices: [
          '30 squat cleans, 30 pull-ups, 800 meter run',
          '30 power cleans and a 400 meter run',
          '12 deadlifts, 9 hang power cleans, 6 push jerks',
        ],
        answer: 0,
        notes: [
          'Squat cleans, pull-ups, and the 800.',
          'The clean is a squat clean, and the run is 800 meters.',
          'That is DT.',
        ],
      },
      {
        prompt: 'A clean caught in a partial squat…',
        choices: [
          'Is the rep Badger asks for',
          'Is a power clean, not the squat clean in this workout',
          'Counts double',
        ],
        answer: 1,
        notes: [
          'Badger’s clean goes to a full squat.',
          'Above parallel is a power catch.',
          'A different catch is not two reps.',
        ],
      },
    ],
  },
  {
    id: 'filthy-fifty',
    kind: 'benchmark',
    title: 'Filthy Fifty',
    body: 'Filthy Fifty is a chipper: 50 reps of each of ten movements, in order, for time. You finish a movement before you start the next. The score is the time, not how many of the ten you reached.',
    questions: [
      {
        prompt: 'How do you move through it?',
        choices: [
          'Finish each block of 50, then go on',
          'Cycle all ten movements in small sets from the start',
          'Do whichever 50 feels best and stop',
        ],
        answer: 0,
        notes: [
          'A chipper clears one movement, then the next.',
          'Mixing them from the start is a different workout.',
          'All ten blocks are the task.',
        ],
      },
      {
        prompt: 'What is the score?',
        choices: [
          'Time to finish every block of 50',
          'How many movements you completed in 20 minutes',
          'The movement that slowed you down',
        ],
        answer: 0,
        notes: [
          'The work is fixed. You record the clock.',
          'There is no 20-minute cap in the benchmark.',
          'The limiter is not the score.',
        ],
      },
    ],
  },
];
