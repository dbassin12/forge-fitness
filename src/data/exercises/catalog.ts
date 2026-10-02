import { squat, squatFront } from '@/anim/families/squat'
import { forearmPlank, pikePushUp, pushUp, wallHandstand } from '@/anim/families/pushup'
import { hinge, swing } from '@/anim/families/hinge'
import { bulgarian, jumpLunge, lateralLunge, lunge, stepUp } from '@/anim/families/lunge'
import {
  bearPlank,
  birdDog,
  bridge,
  catCow,
  childsPose,
  cobra,
  crunch,
  deadBug,
  hollowHold,
  proneRaise,
  russianTwist,
  sidePlank,
  superman,
  supineDb,
} from '@/anim/families/floor'
import { bentRow, chairDip, invertedRow, lateralRaise, standingDb } from '@/anim/families/upper'
import { burpee, jumpingJack, runInPlace, shadowBox, skaters } from '@/anim/families/cardio'
import {
  armCircles,
  calfStretch,
  chestOpener,
  dogToCobra,
  figureFour,
  hamstringStretch,
  hipCircles,
  hipFlexorStretch,
  inchworm,
  legSwings,
  worldsGreatest,
} from '@/anim/families/stretch'
import type { ExerciseDef } from './types'

/**
 * The structural exercise catalog: what each movement trains, what it needs, how hard it is and
 * how it animates. Coaching copy lives in ./copy.ts (keyed by id).
 */
export const EXERCISE_DEFS: ExerciseDef[] = [
  // ---- Horizontal push --------------------------------------------------------------
  {
    id: 'wall-pushup', name: 'Wall push-up', pattern: 'h_push', level: 1,
    muscles: { primary: ['chest', 'triceps'], secondary: ['shoulders', 'abs'] },
    equipment: ['wall'], measure: 'reps', range: [10, 20], met: 2.8, impact: 'none',
    tags: ['quiet', 'snack'], motion: () => pushUp({ surface: 'wall' }),
  },
  {
    id: 'incline-pushup', name: 'Incline push-up', pattern: 'h_push', level: 2,
    muscles: { primary: ['chest', 'triceps'], secondary: ['shoulders', 'abs'] },
    equipment: ['chair'], measure: 'reps', range: [8, 15], met: 3.8, impact: 'none',
    tags: ['quiet', 'snack'], motion: () => pushUp({ surface: 'chair' }),
    faults: [{ id: 'hip-sag', label: 'Hips sagging', motion: () => pushUp({ surface: 'chair', fault: 'hipSag' }) }],
  },
  {
    id: 'knee-pushup', name: 'Knee push-up', pattern: 'h_push', level: 3,
    muscles: { primary: ['chest', 'triceps'], secondary: ['shoulders', 'abs'] },
    equipment: [], measure: 'reps', range: [8, 15], met: 3.8, impact: 'none', cautionIf: ['wrists'],
    tags: ['quiet'], motion: () => pushUp({ knees: true }),
  },
  {
    id: 'pushup', name: 'Push-up', pattern: 'h_push', level: 4,
    muscles: { primary: ['chest', 'triceps'], secondary: ['shoulders', 'abs'] },
    equipment: [], measure: 'reps', range: [6, 15], met: 3.8, impact: 'none', cautionIf: ['wrists', 'shoulders'],
    tags: ['quiet', 'snack'], motion: () => pushUp(),
    faults: [
      { id: 'hip-sag', label: 'Hips sagging', motion: () => pushUp({ fault: 'hipSag' }) },
      { id: 'head-drop', label: 'Head dropping', motion: () => pushUp({ fault: 'headDrop' }) },
    ],
  },
  {
    id: 'diamond-pushup', name: 'Diamond push-up', pattern: 'h_push', level: 6,
    muscles: { primary: ['triceps', 'chest'], secondary: ['shoulders', 'abs'] },
    equipment: [], measure: 'reps', range: [5, 12], met: 4.5, impact: 'none', avoidIf: ['wrists'],
    tags: ['quiet'], motion: () => pushUp({ narrow: true }),
  },
  {
    id: 'decline-pushup', name: 'Decline push-up', pattern: 'h_push', level: 7,
    muscles: { primary: ['chest', 'shoulders'], secondary: ['triceps', 'abs'] },
    equipment: ['chair'], measure: 'reps', range: [5, 12], met: 4.5, impact: 'none', avoidIf: ['wrists', 'shoulders'],
    tags: ['quiet'], motion: () => pushUp({ feetOn: 'chair' }),
  },
  {
    id: 'db-floor-press', name: 'Dumbbell floor press', pattern: 'h_push', level: 3,
    muscles: { primary: ['chest', 'triceps'], secondary: ['shoulders'] },
    equipment: ['db_pair'], measure: 'reps', range: [8, 15], met: 3.5, impact: 'none',
    tags: ['quiet'], motion: () => supineDb('press'),
  },

  // ---- Vertical push ----------------------------------------------------------------
  {
    id: 'db-overhead-press', name: 'Dumbbell overhead press', pattern: 'v_push', level: 3,
    muscles: { primary: ['shoulders', 'triceps'], secondary: ['traps', 'abs'] },
    equipment: ['db_pair'], measure: 'reps', range: [8, 12], met: 3.5, impact: 'none', cautionIf: ['shoulders', 'lower_back'],
    tags: ['quiet'], motion: () => standingDb('press'),
  },
  {
    id: 'arnold-press', name: 'Arnold press', pattern: 'v_push', level: 5,
    muscles: { primary: ['shoulders'], secondary: ['triceps', 'chest'] },
    equipment: ['db_pair'], measure: 'reps', range: [6, 12], met: 3.5, impact: 'none', avoidIf: ['shoulders'],
    tags: ['quiet'], motion: () => standingDb('arnold'),
  },
  {
    id: 'pike-pushup', name: 'Pike push-up', pattern: 'v_push', level: 5,
    muscles: { primary: ['shoulders', 'triceps'], secondary: ['traps', 'abs'] },
    equipment: [], measure: 'reps', range: [5, 12], met: 4.0, impact: 'none', avoidIf: ['wrists', 'shoulders'],
    tags: ['quiet', 'skill'], motion: () => pikePushUp(),
  },
  {
    id: 'elevated-pike-pushup', name: 'Elevated pike push-up', pattern: 'v_push', level: 7,
    muscles: { primary: ['shoulders', 'triceps'], secondary: ['traps', 'abs'] },
    equipment: ['chair'], measure: 'reps', range: [4, 10], met: 4.5, impact: 'none', avoidIf: ['wrists', 'shoulders'],
    tags: ['quiet', 'skill'], motion: () => pikePushUp({ elevated: true }),
  },
  {
    id: 'wall-handstand', name: 'Wall handstand hold', pattern: 'v_push', level: 9,
    muscles: { primary: ['shoulders'], secondary: ['triceps', 'abs', 'traps'] },
    equipment: ['wall'], measure: 'time', range: [10, 40], met: 4.0, impact: 'low', avoidIf: ['wrists', 'shoulders'],
    tags: ['skill', 'isometric'], motion: () => wallHandstand(),
  },
  {
    id: 'lateral-raise', name: 'Dumbbell lateral raise', pattern: 'v_push', level: 5,
    muscles: { primary: ['shoulders'], secondary: ['traps'] },
    equipment: ['db_pair'], measure: 'reps', range: [6, 12], met: 3.0, impact: 'none', cautionIf: ['shoulders'],
    tags: ['quiet'], motion: () => lateralRaise(),
  },
  {
    id: 'front-raise', name: 'Dumbbell front raise', pattern: 'v_push', level: 3,
    muscles: { primary: ['shoulders'], secondary: ['chest', 'abs'] },
    equipment: ['db_single'], measure: 'reps', range: [8, 12], met: 3.0, impact: 'none', cautionIf: ['shoulders'],
    tags: ['quiet'], motion: () => standingDb('frontRaise'),
  },

  // ---- Horizontal pull --------------------------------------------------------------
  {
    id: 'prone-ytw', name: 'Prone Y-T-W raise', pattern: 'h_pull', level: 1,
    muscles: { primary: ['upper_back', 'shoulders'], secondary: ['traps', 'lower_back'] },
    equipment: [], measure: 'reps', range: [5, 10], met: 2.8, impact: 'none',
    tags: ['quiet', 'warmup'], motion: () => proneRaise('ytw'),
  },
  {
    id: 'reverse-snow-angel', name: 'Reverse snow angel', pattern: 'h_pull', level: 2,
    muscles: { primary: ['upper_back', 'shoulders'], secondary: ['traps', 'lower_back'] },
    equipment: [], measure: 'reps', range: [8, 12], met: 2.8, impact: 'none',
    tags: ['quiet', 'warmup'], motion: () => proneRaise('snowAngel'),
  },
  {
    id: 'db-bent-row', name: 'Dumbbell bent-over row', pattern: 'h_pull', level: 3,
    muscles: { primary: ['upper_back', 'lats'], secondary: ['biceps', 'lower_back', 'traps'] },
    equipment: ['db_pair'], measure: 'reps', range: [8, 15], met: 3.5, impact: 'none', cautionIf: ['lower_back'],
    tags: ['quiet'], motion: () => bentRow(),
  },
  {
    id: 'one-arm-db-row', name: 'One-arm dumbbell row', pattern: 'h_pull', level: 4,
    muscles: { primary: ['lats', 'upper_back'], secondary: ['biceps', 'traps'] },
    equipment: ['db_heavy', 'chair'], measure: 'reps', perSide: true, range: [8, 15], met: 3.5, impact: 'none',
    tags: ['quiet'], motion: () => bentRow({ oneArm: true }),
  },
  {
    id: 'table-row-bent', name: 'Table inverted row (knees bent)', pattern: 'h_pull', level: 5,
    muscles: { primary: ['upper_back', 'lats'], secondary: ['biceps', 'abs'] },
    equipment: ['table'], measure: 'reps', range: [5, 12], met: 4.0, impact: 'none',
    tags: ['quiet'], motion: () => invertedRow({ bentKnees: true }),
  },
  {
    id: 'table-row', name: 'Table inverted row', pattern: 'h_pull', level: 6,
    muscles: { primary: ['upper_back', 'lats'], secondary: ['biceps', 'abs', 'glutes'] },
    equipment: ['table'], measure: 'reps', range: [5, 12], met: 4.5, impact: 'none',
    tags: ['quiet'], motion: () => invertedRow(),
  },
  {
    id: 'renegade-row', name: 'Renegade row', pattern: 'h_pull', level: 7,
    muscles: { primary: ['lats', 'upper_back', 'abs'], secondary: ['chest', 'triceps', 'obliques'] },
    equipment: ['db_pair'], measure: 'reps', perSide: true, range: [5, 10], met: 5.0, impact: 'none', avoidIf: ['wrists'],
    tags: ['quiet'], motion: () => pushUp({ mode: 'renegade' }),
  },

  // ---- Vertical pull (no bar) ---------------------------------------------------------
  {
    id: 'prone-w-pull', name: 'Prone W pull', pattern: 'v_pull', level: 1,
    muscles: { primary: ['lats', 'upper_back'], secondary: ['shoulders', 'lower_back'] },
    equipment: [], measure: 'reps', range: [8, 15], met: 2.8, impact: 'none',
    tags: ['quiet', 'warmup'], motion: () => proneRaise('wPull'),
  },
  {
    id: 'db-pullover', name: 'Dumbbell pullover', pattern: 'v_pull', level: 3,
    muscles: { primary: ['lats', 'chest'], secondary: ['triceps', 'abs'] },
    equipment: ['db_heavy'], measure: 'reps', range: [8, 15], met: 3.5, impact: 'none', cautionIf: ['shoulders'],
    tags: ['quiet'], motion: () => supineDb('pullover'),
  },

  // ---- Squat --------------------------------------------------------------------------
  {
    id: 'box-squat', name: 'Box squat to chair', pattern: 'squat', level: 1,
    muscles: { primary: ['quads', 'glutes'], secondary: ['hamstrings', 'abs'] },
    equipment: ['chair'], measure: 'reps', range: [8, 15], met: 3.5, impact: 'none',
    tags: ['quiet', 'snack'], motion: () => squat({ box: true, depth: 0.82 }),
  },
  {
    id: 'bodyweight-squat', name: 'Bodyweight squat', pattern: 'squat', level: 2,
    muscles: { primary: ['quads', 'glutes'], secondary: ['hamstrings', 'abs', 'calves'] },
    equipment: [], measure: 'reps', range: [10, 20], met: 5.0, impact: 'none', cautionIf: ['knees'],
    tags: ['quiet', 'snack', 'warmup'], motion: () => squat(),
    faults: [
      { id: 'heels-up', label: 'Heels lifting', motion: () => squat({ fault: 'heelsUp' }) },
      { id: 'round-back', label: 'Rounding the back', motion: () => squat({ fault: 'roundBack' }) },
      { id: 'knee-cave', label: 'Knees caving in', motion: () => squatFront({ fault: 'kneeCave' }) },
    ],
  },
  {
    id: 'pause-squat', name: 'Pause squat', pattern: 'squat', level: 3,
    muscles: { primary: ['quads', 'glutes'], secondary: ['hamstrings', 'abs'] },
    equipment: [], measure: 'reps', range: [8, 15], met: 5.0, impact: 'none', cautionIf: ['knees'],
    tags: ['quiet'], motion: () => squat({ tempo: [2.2, 1.6, 1.0, 0.4] }),
  },
  {
    id: 'goblet-squat', name: 'Goblet squat', pattern: 'squat', level: 4,
    muscles: { primary: ['quads', 'glutes'], secondary: ['abs', 'upper_back'] },
    equipment: ['db_heavy'], measure: 'reps', range: [8, 15], met: 5.0, impact: 'none', cautionIf: ['knees'],
    tags: ['quiet'], motion: () => squat({ arms: 'goblet' }),
  },
  {
    id: 'db-front-squat', name: 'Dumbbell front squat', pattern: 'squat', level: 5,
    muscles: { primary: ['quads', 'glutes'], secondary: ['abs', 'upper_back'] },
    equipment: ['db_pair'], measure: 'reps', range: [8, 12], met: 5.5, impact: 'none', cautionIf: ['knees'],
    tags: ['quiet'], motion: () => squat({ arms: 'rack' }),
  },
  {
    id: 'wall-sit', name: 'Wall sit', pattern: 'squat', level: 2,
    muscles: { primary: ['quads'], secondary: ['glutes', 'calves'] },
    equipment: ['wall'], measure: 'time', range: [20, 60], met: 3.0, impact: 'none', cautionIf: ['knees'],
    tags: ['quiet', 'isometric', 'finisher'], motion: () => squat({ wall: true, hold: 0.95 }),
  },
  {
    id: 'squat-jump', name: 'Squat jump', pattern: 'squat', level: 6,
    muscles: { primary: ['quads', 'glutes', 'calves'], secondary: ['hamstrings'] },
    equipment: [], measure: 'reps', range: [6, 12], met: 8.0, impact: 'high', avoidIf: ['knees'],
    tags: ['power', 'finisher'], motion: () => squat({ jump: true }),
  },

  // ---- Lunge / single leg ------------------------------------------------------------
  {
    id: 'split-squat', name: 'Split squat', pattern: 'lunge', level: 2,
    muscles: { primary: ['quads', 'glutes'], secondary: ['hamstrings', 'adductors'] },
    equipment: [], measure: 'reps', perSide: true, range: [8, 12], met: 4.0, impact: 'none', cautionIf: ['knees'],
    tags: ['quiet'], motion: () => lunge({ kind: 'split' }),
  },
  {
    id: 'reverse-lunge', name: 'Reverse lunge', pattern: 'lunge', level: 3,
    muscles: { primary: ['quads', 'glutes'], secondary: ['hamstrings', 'adductors', 'calves'] },
    equipment: [], measure: 'reps', perSide: true, range: [8, 12], met: 4.0, impact: 'none', cautionIf: ['knees'],
    tags: ['quiet'], motion: () => lunge(),
  },
  {
    id: 'db-reverse-lunge', name: 'Dumbbell reverse lunge', pattern: 'lunge', level: 4,
    muscles: { primary: ['quads', 'glutes'], secondary: ['hamstrings', 'forearms', 'traps'] },
    equipment: ['db_pair'], measure: 'reps', perSide: true, range: [8, 12], met: 4.5, impact: 'none', cautionIf: ['knees'],
    tags: ['quiet'], motion: () => lunge({ arms: 'pair' }),
  },
  {
    id: 'forward-lunge', name: 'Forward lunge', pattern: 'lunge', level: 4,
    muscles: { primary: ['quads', 'glutes'], secondary: ['hamstrings', 'calves'] },
    equipment: [], measure: 'reps', perSide: true, range: [8, 12], met: 4.0, impact: 'low', avoidIf: ['knees'],
    motion: () => lunge({ kind: 'forward' }),
  },
  {
    id: 'step-up', name: 'Step-up', pattern: 'lunge', level: 3,
    muscles: { primary: ['quads', 'glutes'], secondary: ['hamstrings', 'calves'] },
    equipment: ['stairs'], measure: 'reps', perSide: true, range: [8, 12], met: 4.5, impact: 'none', cautionIf: ['knees'],
    tags: ['quiet'], motion: () => stepUp({ arms: 'hips' }),
  },
  {
    id: 'db-step-up', name: 'Dumbbell step-up', pattern: 'lunge', level: 5,
    muscles: { primary: ['quads', 'glutes'], secondary: ['hamstrings', 'forearms'] },
    equipment: ['stairs', 'db_pair'], measure: 'reps', perSide: true, range: [8, 12], met: 5.0, impact: 'none', cautionIf: ['knees'],
    tags: ['quiet'], motion: () => stepUp({ arms: 'pair' }),
  },
  {
    id: 'bulgarian-split-squat', name: 'Bulgarian split squat', pattern: 'lunge', level: 5,
    muscles: { primary: ['quads', 'glutes'], secondary: ['hamstrings', 'adductors', 'hip_flexors'] },
    equipment: ['chair'], measure: 'reps', perSide: true, range: [6, 12], met: 5.0, impact: 'none', cautionIf: ['knees'],
    tags: ['quiet'], motion: () => bulgarian(),
  },
  {
    id: 'db-bulgarian-split-squat', name: 'Dumbbell Bulgarian split squat', pattern: 'lunge', level: 6,
    muscles: { primary: ['quads', 'glutes'], secondary: ['hamstrings', 'adductors', 'forearms'] },
    equipment: ['chair', 'db_pair'], measure: 'reps', perSide: true, range: [6, 12], met: 5.5, impact: 'none', cautionIf: ['knees'],
    tags: ['quiet'], motion: () => bulgarian({ arms: 'pair' }),
  },
  {
    id: 'lateral-lunge', name: 'Lateral lunge', pattern: 'lunge', level: 3,
    muscles: { primary: ['glutes', 'adductors', 'quads'], secondary: ['hamstrings'] },
    equipment: [], measure: 'reps', perSide: true, range: [8, 12], met: 4.0, impact: 'none', cautionIf: ['knees'],
    tags: ['quiet', 'warmup'], motion: () => lateralLunge(),
  },
  {
    id: 'curtsy-lunge', name: 'Curtsy lunge', pattern: 'lunge', level: 4,
    muscles: { primary: ['glutes', 'quads'], secondary: ['adductors'] },
    equipment: [], measure: 'reps', perSide: true, range: [8, 12], met: 4.0, impact: 'none', avoidIf: ['knees'],
    tags: ['quiet'], motion: () => lateralLunge({ kind: 'curtsy' }),
  },
  {
    id: 'cossack-squat', name: 'Cossack squat', pattern: 'lunge', level: 6,
    muscles: { primary: ['adductors', 'quads', 'glutes'], secondary: ['hamstrings', 'hip_flexors'] },
    equipment: [], measure: 'reps', perSide: true, range: [5, 10], met: 4.0, impact: 'none', avoidIf: ['knees'],
    tags: ['quiet', 'skill'], motion: () => lateralLunge({ kind: 'cossack' }),
  },
  {
    id: 'jump-lunge', name: 'Jump lunge', pattern: 'lunge', level: 7,
    muscles: { primary: ['quads', 'glutes', 'calves'], secondary: ['hamstrings'] },
    equipment: [], measure: 'reps', range: [6, 12], met: 8.0, impact: 'high', avoidIf: ['knees'],
    tags: ['power', 'finisher'], motion: () => jumpLunge(),
  },

  // ---- Hinge ----------------------------------------------------------------------------
  {
    id: 'good-morning', name: 'Bodyweight good morning', pattern: 'hinge', level: 1,
    muscles: { primary: ['hamstrings', 'glutes'], secondary: ['lower_back'] },
    equipment: [], measure: 'reps', range: [10, 15], met: 3.0, impact: 'none',
    tags: ['quiet', 'warmup'], motion: () => hinge({ load: 'none', hands: 'cross' }),
  },
  {
    id: 'db-rdl', name: 'Dumbbell Romanian deadlift', pattern: 'hinge', level: 3,
    muscles: { primary: ['hamstrings', 'glutes'], secondary: ['lower_back', 'forearms', 'traps'] },
    equipment: ['db_pair'], measure: 'reps', range: [8, 15], met: 4.0, impact: 'none', cautionIf: ['lower_back'],
    tags: ['quiet'], motion: () => hinge({ load: 'pair' }),
    faults: [{ id: 'round-back', label: 'Rounding the back', motion: () => hinge({ load: 'pair', fault: 'roundBack' }) }],
  },
  {
    id: 'single-leg-rdl', name: 'Single-leg Romanian deadlift', pattern: 'hinge', level: 4,
    muscles: { primary: ['hamstrings', 'glutes'], secondary: ['lower_back', 'abs'] },
    equipment: [], measure: 'reps', perSide: true, range: [6, 12], met: 3.5, impact: 'none',
    tags: ['quiet', 'skill'], motion: () => hinge({ singleLeg: true, load: 'none' }),
  },
  {
    id: 'db-single-leg-rdl', name: 'Dumbbell single-leg RDL', pattern: 'hinge', level: 6,
    muscles: { primary: ['hamstrings', 'glutes'], secondary: ['lower_back', 'abs', 'forearms'] },
    equipment: ['db_heavy'], measure: 'reps', perSide: true, range: [6, 12], met: 4.0, impact: 'none', cautionIf: ['lower_back'],
    tags: ['quiet'], motion: () => hinge({ singleLeg: true, load: 'pair' }),
  },
  {
    id: 'db-swing', name: 'Dumbbell swing', pattern: 'hinge', level: 5,
    muscles: { primary: ['glutes', 'hamstrings'], secondary: ['lower_back', 'shoulders', 'abs'] },
    equipment: ['db_heavy'], measure: 'reps', range: [12, 20], met: 7.0, impact: 'low', avoidIf: ['lower_back'],
    tags: ['power', 'finisher'], motion: () => swing(),
  },

  // ---- Bridge -----------------------------------------------------------------------------
  {
    id: 'glute-bridge', name: 'Glute bridge', pattern: 'bridge', level: 1,
    muscles: { primary: ['glutes'], secondary: ['hamstrings', 'abs'] },
    equipment: [], measure: 'reps', range: [10, 20], met: 3.0, impact: 'none',
    tags: ['quiet', 'warmup'], motion: () => bridge(),
  },
  {
    id: 'db-glute-bridge', name: 'Dumbbell glute bridge', pattern: 'bridge', level: 3,
    muscles: { primary: ['glutes'], secondary: ['hamstrings', 'abs'] },
    equipment: ['db_heavy'], measure: 'reps', range: [10, 20], met: 3.5, impact: 'none',
    tags: ['quiet'], motion: () => bridge({ loaded: true }),
  },
  {
    id: 'single-leg-bridge', name: 'Single-leg glute bridge', pattern: 'bridge', level: 3,
    muscles: { primary: ['glutes'], secondary: ['hamstrings', 'abs'] },
    equipment: [], measure: 'reps', perSide: true, range: [8, 15], met: 3.5, impact: 'none',
    tags: ['quiet'], motion: () => bridge({ single: true }),
  },
  {
    id: 'hip-thrust', name: 'Hip thrust (shoulders on couch)', pattern: 'bridge', level: 4,
    muscles: { primary: ['glutes'], secondary: ['hamstrings', 'quads'] },
    equipment: ['chair'], measure: 'reps', range: [10, 20], met: 3.5, impact: 'none',
    tags: ['quiet'], motion: () => bridge({ thrust: true }),
  },
  {
    id: 'db-hip-thrust', name: 'Dumbbell hip thrust', pattern: 'bridge', level: 5,
    muscles: { primary: ['glutes'], secondary: ['hamstrings', 'quads'] },
    equipment: ['chair', 'db_heavy'], measure: 'reps', range: [8, 15], met: 4.0, impact: 'none',
    tags: ['quiet'], motion: () => bridge({ thrust: true, loaded: true }),
  },

  // ---- Core --------------------------------------------------------------------------------
  {
    id: 'dead-bug', name: 'Dead bug', pattern: 'core', level: 1,
    muscles: { primary: ['abs'], secondary: ['obliques', 'hip_flexors'] },
    equipment: [], measure: 'reps', perSide: true, range: [6, 12], met: 2.8, impact: 'none',
    tags: ['quiet', 'warmup'], motion: () => deadBug(),
  },
  {
    id: 'knee-plank', name: 'Forearm plank on knees', pattern: 'core', level: 1,
    muscles: { primary: ['abs'], secondary: ['shoulders', 'obliques'] },
    equipment: [], measure: 'time', range: [20, 45], met: 3.0, impact: 'none',
    tags: ['quiet', 'isometric'], motion: () => forearmPlank({ knees: true }),
  },
  {
    id: 'forearm-plank', name: 'Forearm plank', pattern: 'core', level: 2,
    muscles: { primary: ['abs'], secondary: ['shoulders', 'obliques', 'glutes'] },
    equipment: [], measure: 'time', range: [20, 60], met: 3.8, impact: 'none',
    tags: ['quiet', 'isometric', 'finisher', 'snack'], motion: () => forearmPlank(),
    faults: [
      { id: 'hip-sag', label: 'Hips sagging', motion: () => forearmPlank({ fault: 'hipSag' }) },
      { id: 'hip-pike', label: 'Hips too high', motion: () => forearmPlank({ fault: 'hipPike' }) },
    ],
  },
  {
    id: 'high-plank', name: 'High plank', pattern: 'core', level: 2,
    muscles: { primary: ['abs', 'shoulders'], secondary: ['chest', 'triceps'] },
    equipment: [], measure: 'time', range: [20, 60], met: 3.8, impact: 'none', cautionIf: ['wrists'],
    tags: ['quiet', 'isometric'], motion: () => pushUp({ mode: 'hold' }),
  },
  {
    id: 'bird-dog', name: 'Bird dog', pattern: 'core', level: 1,
    muscles: { primary: ['lower_back', 'glutes', 'abs'], secondary: ['shoulders'] },
    equipment: [], measure: 'reps', perSide: true, range: [6, 12], met: 2.8, impact: 'none',
    tags: ['quiet', 'warmup'], motion: () => birdDog(),
  },
  {
    id: 'side-plank-knee', name: 'Side plank on knees', pattern: 'core', level: 2,
    muscles: { primary: ['obliques'], secondary: ['abs', 'shoulders', 'glutes'] },
    equipment: [], measure: 'time', perSide: true, range: [15, 40], met: 3.0, impact: 'none', cautionIf: ['shoulders'],
    tags: ['quiet', 'isometric'], motion: () => sidePlank({ knees: true }),
  },
  {
    id: 'side-plank', name: 'Side plank', pattern: 'core', level: 4,
    muscles: { primary: ['obliques'], secondary: ['abs', 'shoulders', 'glutes'] },
    equipment: [], measure: 'time', perSide: true, range: [15, 45], met: 3.5, impact: 'none', cautionIf: ['shoulders', 'wrists'],
    tags: ['quiet', 'isometric'], motion: () => sidePlank(),
  },
  {
    id: 'plank-shoulder-tap', name: 'Plank shoulder taps', pattern: 'core', level: 4,
    muscles: { primary: ['abs', 'obliques'], secondary: ['shoulders', 'chest'] },
    equipment: [], measure: 'reps', perSide: true, range: [8, 16], met: 4.0, impact: 'none', cautionIf: ['wrists'],
    tags: ['quiet'], motion: () => pushUp({ mode: 'taps' }),
  },
  {
    id: 'bear-plank', name: 'Bear plank hold', pattern: 'core', level: 3,
    muscles: { primary: ['abs', 'quads'], secondary: ['shoulders', 'obliques'] },
    equipment: [], measure: 'time', range: [15, 45], met: 3.5, impact: 'none', cautionIf: ['wrists'],
    tags: ['quiet', 'isometric'], motion: () => bearPlank(),
  },
  {
    id: 'crunch', name: 'Crunch', pattern: 'core', level: 1,
    muscles: { primary: ['abs'], secondary: ['obliques'] },
    equipment: [], measure: 'reps', range: [10, 20], met: 2.8, impact: 'none',
    tags: ['quiet'], motion: () => crunch(),
  },
  {
    id: 'reverse-crunch', name: 'Reverse crunch', pattern: 'core', level: 2,
    muscles: { primary: ['abs'], secondary: ['hip_flexors', 'obliques'] },
    equipment: [], measure: 'reps', range: [8, 15], met: 3.0, impact: 'none',
    tags: ['quiet'], motion: () => crunch('reverse'),
  },
  {
    id: 'bicycle-crunch', name: 'Bicycle crunch', pattern: 'core', level: 3,
    muscles: { primary: ['obliques', 'abs'], secondary: ['hip_flexors'] },
    equipment: [], measure: 'reps', perSide: true, range: [8, 16], met: 3.8, impact: 'none',
    tags: ['quiet'], motion: () => crunch('bicycle'),
  },
  {
    id: 'russian-twist', name: 'Russian twist', pattern: 'core', level: 3,
    muscles: { primary: ['obliques'], secondary: ['abs', 'hip_flexors'] },
    equipment: [], measure: 'reps', perSide: true, range: [8, 16], met: 3.5, impact: 'none', avoidIf: ['lower_back'],
    tags: ['quiet'], motion: () => russianTwist(),
  },
  {
    id: 'db-russian-twist', name: 'Dumbbell Russian twist', pattern: 'core', level: 5,
    muscles: { primary: ['obliques'], secondary: ['abs', 'hip_flexors'] },
    equipment: ['db_single'], measure: 'reps', perSide: true, range: [8, 14], met: 4.0, impact: 'none', avoidIf: ['lower_back'],
    tags: ['quiet'], motion: () => russianTwist({ db: true }),
  },
  {
    id: 'leg-raise', name: 'Lying leg raise', pattern: 'core', level: 4,
    muscles: { primary: ['abs', 'hip_flexors'], secondary: ['obliques'] },
    equipment: [], measure: 'reps', range: [8, 15], met: 3.5, impact: 'none', avoidIf: ['lower_back'],
    tags: ['quiet'], motion: () => crunch('legRaise'),
  },
  {
    id: 'hollow-hold-tuck', name: 'Tuck hollow hold', pattern: 'core', level: 4,
    muscles: { primary: ['abs'], secondary: ['hip_flexors', 'obliques'] },
    equipment: [], measure: 'time', range: [15, 40], met: 3.5, impact: 'none',
    tags: ['quiet', 'isometric', 'skill'], motion: () => hollowHold({ tuck: true }),
  },
  {
    id: 'hollow-hold', name: 'Hollow body hold', pattern: 'core', level: 6,
    muscles: { primary: ['abs'], secondary: ['hip_flexors', 'obliques', 'quads'] },
    equipment: [], measure: 'time', range: [15, 40], met: 3.8, impact: 'none', avoidIf: ['lower_back'],
    tags: ['quiet', 'isometric', 'skill'], motion: () => hollowHold(),
  },
  {
    id: 'v-up', name: 'V-up', pattern: 'core', level: 7,
    muscles: { primary: ['abs', 'hip_flexors'], secondary: ['obliques', 'quads'] },
    equipment: [], measure: 'reps', range: [6, 12], met: 4.5, impact: 'none', avoidIf: ['lower_back'],
    tags: ['quiet'], motion: () => crunch('vup'),
  },
  {
    id: 'superman', name: 'Superman', pattern: 'core', level: 1,
    muscles: { primary: ['lower_back', 'glutes'], secondary: ['upper_back', 'hamstrings'] },
    equipment: [], measure: 'reps', range: [8, 15], met: 2.8, impact: 'none',
    tags: ['quiet', 'warmup'], motion: () => superman(),
  },

  // ---- Conditioning ------------------------------------------------------------------------
  {
    id: 'march-in-place', name: 'March in place', pattern: 'cond', level: 1,
    muscles: { primary: ['hip_flexors', 'quads'], secondary: ['calves', 'abs'] },
    equipment: [], measure: 'time', range: [30, 60], met: 3.5, impact: 'none',
    tags: ['quiet', 'warmup', 'snack'], motion: () => runInPlace('march'),
  },
  {
    id: 'step-jacks', name: 'Step jacks', pattern: 'cond', level: 2,
    muscles: { primary: ['shoulders', 'calves'], secondary: ['glutes', 'adductors'] },
    equipment: [], measure: 'time', range: [30, 45], met: 4.5, impact: 'none',
    tags: ['quiet', 'warmup', 'snack'], motion: () => jumpingJack({ step: true }),
  },
  {
    id: 'jumping-jacks', name: 'Jumping jacks', pattern: 'cond', level: 3,
    muscles: { primary: ['calves', 'shoulders'], secondary: ['glutes', 'adductors'] },
    equipment: [], measure: 'time', range: [30, 45], met: 7.7, impact: 'high', avoidIf: ['knees'],
    tags: ['warmup', 'finisher', 'snack'], motion: () => jumpingJack(),
  },
  {
    id: 'high-knees', name: 'High knees', pattern: 'cond', level: 4,
    muscles: { primary: ['hip_flexors', 'quads', 'calves'], secondary: ['abs'] },
    equipment: [], measure: 'time', range: [20, 40], met: 8.0, impact: 'high', avoidIf: ['knees'],
    tags: ['finisher'], motion: () => runInPlace('highKnees'),
  },
  {
    id: 'butt-kicks', name: 'Butt kicks', pattern: 'cond', level: 3,
    muscles: { primary: ['hamstrings', 'calves'], secondary: ['quads'] },
    equipment: [], measure: 'time', range: [20, 40], met: 7.0, impact: 'high', avoidIf: ['knees'],
    tags: ['warmup'], motion: () => runInPlace('buttKicks'),
  },
  {
    id: 'fast-feet', name: 'Fast feet', pattern: 'cond', level: 3,
    muscles: { primary: ['calves', 'quads'], secondary: ['hip_flexors'] },
    equipment: [], measure: 'time', range: [15, 30], met: 7.0, impact: 'low',
    tags: ['finisher'], motion: () => runInPlace('fastFeet'),
  },
  {
    id: 'mountain-climbers', name: 'Mountain climbers', pattern: 'cond', level: 5,
    muscles: { primary: ['abs', 'hip_flexors', 'shoulders'], secondary: ['quads', 'chest'] },
    equipment: [], measure: 'time', range: [20, 40], met: 8.0, impact: 'low', avoidIf: ['wrists'],
    tags: ['finisher'], motion: () => pushUp({ mode: 'climbers' }),
  },
  {
    id: 'skaters', name: 'Skaters', pattern: 'cond', level: 5,
    muscles: { primary: ['glutes', 'quads'], secondary: ['adductors', 'calves'] },
    equipment: [], measure: 'time', range: [20, 40], met: 7.5, impact: 'high', avoidIf: ['knees'],
    tags: ['finisher'], motion: () => skaters(),
  },
  {
    id: 'shadow-boxing', name: 'Shadow boxing', pattern: 'cond', level: 2,
    muscles: { primary: ['shoulders', 'obliques'], secondary: ['chest', 'calves'] },
    equipment: [], measure: 'time', range: [30, 60], met: 6.0, impact: 'none',
    tags: ['quiet', 'finisher', 'snack'], motion: () => shadowBox(),
  },
  {
    id: 'squat-thrust', name: 'Squat thrust', pattern: 'cond', level: 5,
    muscles: { primary: ['quads', 'abs', 'shoulders'], secondary: ['chest', 'hip_flexors'] },
    equipment: [], measure: 'reps', range: [6, 12], met: 8.0, impact: 'low', avoidIf: ['wrists'],
    tags: ['finisher'], motion: () => burpee('thrust'),
  },
  {
    id: 'step-back-burpee', name: 'Step-back burpee', pattern: 'cond', level: 4,
    muscles: { primary: ['quads', 'abs', 'shoulders'], secondary: ['chest', 'glutes'] },
    equipment: [], measure: 'reps', range: [6, 10], met: 6.5, impact: 'none', avoidIf: ['wrists'],
    tags: ['quiet', 'finisher'], motion: () => burpee('stepBack'),
  },
  {
    id: 'burpee', name: 'Burpee', pattern: 'cond', level: 7,
    muscles: { primary: ['quads', 'chest', 'shoulders', 'abs'], secondary: ['glutes', 'calves', 'triceps'] },
    equipment: [], measure: 'reps', range: [6, 12], met: 8.0, impact: 'high', avoidIf: ['wrists', 'knees'],
    tags: ['power', 'finisher'], motion: () => burpee('full'),
  },
  {
    id: 'db-thruster', name: 'Dumbbell thruster', pattern: 'cond', level: 6,
    muscles: { primary: ['quads', 'glutes', 'shoulders'], secondary: ['triceps', 'abs'] },
    equipment: ['db_pair'], measure: 'reps', range: [8, 12], met: 7.0, impact: 'none', cautionIf: ['knees', 'shoulders'],
    tags: ['quiet', 'finisher'], motion: () => squat({ arms: 'press' }),
  },

  // ---- Arms ---------------------------------------------------------------------------------
  {
    id: 'db-curl', name: 'Dumbbell curl', pattern: 'arms', level: 2,
    muscles: { primary: ['biceps'], secondary: ['forearms'] },
    equipment: ['db_pair'], measure: 'reps', range: [8, 15], met: 3.0, impact: 'none',
    tags: ['quiet'], motion: () => standingDb('curl'),
  },
  {
    id: 'hammer-curl', name: 'Hammer curl', pattern: 'arms', level: 2,
    muscles: { primary: ['biceps', 'forearms'], secondary: [] },
    equipment: ['db_pair'], measure: 'reps', range: [8, 15], met: 3.0, impact: 'none',
    tags: ['quiet'], motion: () => standingDb('hammer'),
  },
  {
    id: 'overhead-triceps', name: 'Overhead triceps extension', pattern: 'arms', level: 3,
    muscles: { primary: ['triceps'], secondary: ['shoulders'] },
    equipment: ['db_heavy'], measure: 'reps', range: [8, 15], met: 3.0, impact: 'none', cautionIf: ['shoulders'],
    tags: ['quiet'], motion: () => standingDb('triceps'),
  },
  {
    id: 'skull-crusher', name: 'Lying triceps extension', pattern: 'arms', level: 3,
    muscles: { primary: ['triceps'], secondary: [] },
    equipment: ['db_pair'], measure: 'reps', range: [8, 15], met: 3.0, impact: 'none',
    tags: ['quiet'], motion: () => supineDb('skull'),
  },
  {
    id: 'chair-dip', name: 'Chair dip', pattern: 'arms', level: 4,
    muscles: { primary: ['triceps'], secondary: ['chest', 'shoulders'] },
    equipment: ['chair'], measure: 'reps', range: [6, 15], met: 3.8, impact: 'none', avoidIf: ['shoulders', 'wrists'],
    tags: ['quiet'], motion: () => chairDip(),
  },
  {
    id: 'db-shrug', name: 'Dumbbell shrug', pattern: 'arms', level: 1,
    muscles: { primary: ['traps'], secondary: ['forearms'] },
    equipment: ['db_pair'], measure: 'reps', range: [12, 20], met: 2.8, impact: 'none',
    tags: ['quiet'], motion: () => standingDb('shrug'),
  },

  // ---- Mobility / warm-up / cool-down -------------------------------------------------------
  {
    id: 'arm-circles', name: 'Arm circles', pattern: 'mobility', level: 1,
    muscles: { primary: ['shoulders'], secondary: ['upper_back'] },
    equipment: [], measure: 'time', range: [20, 40], met: 2.5, impact: 'none',
    tags: ['quiet', 'warmup'], motion: () => armCircles(),
  },
  {
    id: 'hip-circles', name: 'Hip circles', pattern: 'mobility', level: 1,
    muscles: { primary: ['hip_flexors', 'glutes'], secondary: ['lower_back'] },
    equipment: [], measure: 'time', range: [20, 40], met: 2.3, impact: 'none',
    tags: ['quiet', 'warmup'], motion: () => hipCircles(),
  },
  {
    id: 'leg-swings', name: 'Leg swings', pattern: 'mobility', level: 1,
    muscles: { primary: ['hip_flexors', 'hamstrings'], secondary: ['glutes'] },
    equipment: ['wall'], measure: 'time', perSide: true, range: [20, 30], met: 2.5, impact: 'none',
    tags: ['quiet', 'warmup'], motion: () => legSwings(),
  },
  {
    id: 'cat-cow', name: 'Cat-cow', pattern: 'mobility', level: 1,
    muscles: { primary: ['lower_back', 'upper_back'], secondary: ['abs'] },
    equipment: [], measure: 'time', range: [30, 45], met: 2.3, impact: 'none',
    tags: ['quiet', 'warmup', 'cooldown'], motion: () => catCow(),
  },
  {
    id: 'inchworm', name: 'Inchworm', pattern: 'mobility', level: 2,
    muscles: { primary: ['hamstrings', 'shoulders', 'abs'], secondary: ['chest'] },
    equipment: [], measure: 'reps', range: [4, 8], met: 3.5, impact: 'none', cautionIf: ['lower_back', 'wrists'],
    tags: ['quiet', 'warmup'], motion: () => inchworm(),
  },
  {
    id: 'worlds-greatest-stretch', name: "World's greatest stretch", pattern: 'mobility', level: 2,
    muscles: { primary: ['hip_flexors', 'hamstrings', 'upper_back'], secondary: ['glutes', 'adductors'] },
    equipment: [], measure: 'reps', perSide: true, range: [3, 5], met: 2.8, impact: 'none',
    tags: ['quiet', 'warmup'], motion: () => worldsGreatest(),
  },
  {
    id: 'hip-flexor-stretch', name: 'Half-kneeling hip-flexor stretch', pattern: 'mobility', level: 1,
    muscles: { primary: ['hip_flexors'], secondary: ['quads', 'abs'] },
    equipment: [], measure: 'time', perSide: true, range: [20, 40], met: 2.3, impact: 'none', cautionIf: ['knees'],
    tags: ['quiet', 'cooldown'], motion: () => hipFlexorStretch(),
  },
  {
    id: 'hamstring-stretch', name: 'Standing hamstring stretch', pattern: 'mobility', level: 1,
    muscles: { primary: ['hamstrings'], secondary: ['calves', 'lower_back'] },
    equipment: [], measure: 'time', range: [20, 40], met: 2.3, impact: 'none',
    tags: ['quiet', 'cooldown'], motion: () => hamstringStretch(),
  },
  {
    id: 'cobra-stretch', name: 'Cobra stretch', pattern: 'mobility', level: 1,
    muscles: { primary: ['abs', 'lower_back'], secondary: ['chest', 'hip_flexors'] },
    equipment: [], measure: 'time', range: [20, 40], met: 2.3, impact: 'none', cautionIf: ['lower_back'],
    tags: ['quiet', 'cooldown'], motion: () => cobra(),
  },
  {
    id: 'childs-pose', name: "Child's pose", pattern: 'mobility', level: 1,
    muscles: { primary: ['lower_back', 'lats'], secondary: ['glutes', 'shoulders'] },
    equipment: [], measure: 'time', range: [30, 60], met: 2.0, impact: 'none', cautionIf: ['knees'],
    tags: ['quiet', 'cooldown'], motion: () => childsPose(),
  },
  {
    id: 'figure-four-stretch', name: 'Figure-4 glute stretch', pattern: 'mobility', level: 1,
    muscles: { primary: ['glutes'], secondary: ['hip_flexors', 'lower_back'] },
    equipment: [], measure: 'time', perSide: true, range: [20, 40], met: 2.0, impact: 'none',
    tags: ['quiet', 'cooldown'], motion: () => figureFour(),
  },
  {
    id: 'chest-opener', name: 'Chest opener', pattern: 'mobility', level: 1,
    muscles: { primary: ['chest', 'shoulders'], secondary: ['upper_back'] },
    equipment: [], measure: 'time', range: [20, 40], met: 2.0, impact: 'none',
    tags: ['quiet', 'cooldown', 'snack'], motion: () => chestOpener(),
  },
  {
    id: 'calf-stretch', name: 'Wall calf stretch', pattern: 'mobility', level: 1,
    muscles: { primary: ['calves'], secondary: ['hamstrings'] },
    equipment: ['wall'], measure: 'time', perSide: true, range: [20, 40], met: 2.0, impact: 'none',
    tags: ['quiet', 'cooldown'], motion: () => calfStretch(),
  },
  {
    id: 'down-dog-cobra', name: 'Down dog to cobra', pattern: 'mobility', level: 2,
    muscles: { primary: ['hamstrings', 'shoulders', 'abs'], secondary: ['calves', 'chest', 'lower_back'] },
    equipment: [], measure: 'reps', range: [4, 8], met: 2.8, impact: 'none', cautionIf: ['wrists', 'lower_back'],
    tags: ['quiet', 'warmup', 'cooldown'], motion: () => dogToCobra(),
  },
]
