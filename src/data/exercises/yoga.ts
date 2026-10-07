import * as Y from '@/anim/families/yoga'
import type { ExerciseDef } from './types'

/**
 * Bloom's yoga poses (Michal's app). Holds are timed in seconds; flows count rounds. Everything is
 * low impact. `avoidIf: ['pregnancy']` keeps belly-down poses, deep twists and core work on the
 * back out of a pregnant practice; `cautionIf` adds a spoken note instead.
 */
export const YOGA_DEFS: ExerciseDef[] = [
  // ---- Flows ----------------------------------------------------------------------------------
  {
    id: 'mountain-breath', name: 'Mountain breath', pattern: 'flow', level: 1,
    muscles: { primary: ['shoulders', 'upper_back'], secondary: ['abs'] },
    equipment: [], measure: 'reps', range: [4, 8], met: 2.0, impact: 'none', apps: ['bloom'],
    tags: ['quiet', 'warmup'], motion: () => Y.mountainBreath(),
  },
  {
    id: 'half-sun-salutation', name: 'Half sun salutation', pattern: 'flow', level: 2,
    muscles: { primary: ['hamstrings', 'upper_back'], secondary: ['shoulders', 'calves'] },
    equipment: [], measure: 'reps', range: [2, 5], met: 2.8, impact: 'none', apps: ['bloom'], cautionIf: ['lower_back'],
    tags: ['quiet', 'warmup'], motion: () => Y.halfSunSalutation(),
  },
  {
    id: 'sun-salutation-gentle', name: 'Gentle sun salutation', pattern: 'flow', level: 3,
    muscles: { primary: ['hamstrings', 'shoulders', 'abs'], secondary: ['chest', 'hip_flexors', 'lower_back'] },
    equipment: [], measure: 'reps', range: [1, 3], met: 3.0, impact: 'none', apps: ['bloom'],
    avoidIf: ['pregnancy'], cautionIf: ['wrists', 'knees', 'lower_back'],
    tags: ['quiet'], motion: () => Y.sunSalutation({ gentle: true }),
  },
  {
    id: 'sun-salutation', name: 'Sun salutation', pattern: 'flow', level: 5,
    muscles: { primary: ['hamstrings', 'shoulders', 'abs'], secondary: ['chest', 'triceps', 'hip_flexors'] },
    equipment: [], measure: 'reps', range: [1, 4], met: 3.3, impact: 'none', apps: ['bloom'],
    avoidIf: ['pregnancy', 'wrists'], cautionIf: ['shoulders', 'lower_back'],
    tags: ['quiet'], motion: () => Y.sunSalutation(),
  },

  // ---- Standing -------------------------------------------------------------------------------
  {
    id: 'warrior-2', name: 'Warrior II', pattern: 'standing', level: 2,
    muscles: { primary: ['quads', 'glutes'], secondary: ['shoulders', 'adductors'] },
    equipment: [], measure: 'time', perSide: true, range: [20, 45], met: 2.8, impact: 'none', apps: ['bloom'], cautionIf: ['knees'],
    tags: ['quiet', 'isometric'], motion: () => Y.warrior2(),
  },
  {
    id: 'goddess-pose', name: 'Goddess pose', pattern: 'standing', level: 3,
    muscles: { primary: ['quads', 'adductors'], secondary: ['glutes', 'shoulders'] },
    equipment: [], measure: 'time', range: [20, 45], met: 3.0, impact: 'none', apps: ['bloom'], cautionIf: ['knees'],
    tags: ['quiet', 'isometric'], motion: () => Y.goddess(),
  },
  {
    id: 'warrior-1', name: 'Warrior I', pattern: 'standing', level: 3,
    muscles: { primary: ['quads', 'hip_flexors'], secondary: ['glutes', 'shoulders'] },
    equipment: [], measure: 'time', perSide: true, range: [20, 45], met: 2.8, impact: 'none', apps: ['bloom'], cautionIf: ['knees', 'shoulders'],
    tags: ['quiet', 'isometric'], motion: () => Y.warrior1(),
  },
  {
    id: 'chair-pose', name: 'Chair pose', pattern: 'standing', level: 3,
    muscles: { primary: ['quads', 'glutes'], secondary: ['shoulders', 'abs'] },
    equipment: [], measure: 'time', range: [15, 40], met: 3.0, impact: 'none', apps: ['bloom'], cautionIf: ['knees', 'shoulders'],
    tags: ['quiet', 'isometric'], motion: () => Y.chairPose(),
  },
  {
    id: 'triangle-pose', name: 'Triangle pose', pattern: 'standing', level: 4,
    muscles: { primary: ['hamstrings', 'obliques'], secondary: ['adductors', 'shoulders'] },
    equipment: [], measure: 'time', perSide: true, range: [20, 40], met: 2.5, impact: 'none', apps: ['bloom'], cautionIf: ['lower_back', 'neck'],
    tags: ['quiet'], motion: () => Y.triangle(),
  },
  {
    id: 'standing-side-bend', name: 'Standing side stretch', pattern: 'mobility', level: 1,
    muscles: { primary: ['obliques', 'lats'], secondary: ['shoulders'] },
    equipment: [], measure: 'reps', perSide: true, range: [2, 4], met: 2.0, impact: 'none', apps: ['bloom'], cautionIf: ['shoulders'],
    tags: ['quiet', 'warmup', 'snack'], motion: () => Y.standingSideBend(),
  },

  // ---- Balance --------------------------------------------------------------------------------
  {
    id: 'tree-pose-kickstand', name: 'Tree pose, toes down', pattern: 'balance', level: 1,
    muscles: { primary: ['glutes', 'calves'], secondary: ['abs', 'adductors'] },
    equipment: [], measure: 'time', perSide: true, range: [15, 40], met: 2.3, impact: 'none', apps: ['bloom'],
    tags: ['quiet', 'isometric', 'snack'], motion: () => Y.treePose('kickstand'),
  },
  {
    id: 'tree-pose', name: 'Tree pose', pattern: 'balance', level: 2,
    muscles: { primary: ['glutes', 'calves'], secondary: ['abs', 'adductors'] },
    equipment: [], measure: 'time', perSide: true, range: [15, 45], met: 2.3, impact: 'none', apps: ['bloom'], cautionIf: ['pregnancy'],
    tags: ['quiet', 'isometric'], motion: () => Y.treePose('calf'),
  },
  {
    id: 'warrior-3-chair', name: 'Warrior III at a chair', pattern: 'balance', level: 3,
    muscles: { primary: ['glutes', 'hamstrings'], secondary: ['lower_back', 'abs'] },
    equipment: ['chair'], measure: 'time', perSide: true, range: [15, 30], met: 2.8, impact: 'none', apps: ['bloom'], cautionIf: ['lower_back', 'pregnancy'],
    tags: ['quiet', 'isometric'], motion: () => Y.warrior3({ chair: true }),
  },
  {
    id: 'tree-pose-full', name: 'Tree pose, arms up', pattern: 'balance', level: 4,
    muscles: { primary: ['glutes', 'calves'], secondary: ['abs', 'shoulders', 'adductors'] },
    equipment: [], measure: 'time', perSide: true, range: [15, 45], met: 2.5, impact: 'none', apps: ['bloom'], cautionIf: ['shoulders', 'pregnancy'],
    tags: ['quiet', 'isometric'], motion: () => Y.treePose('thigh'),
  },
  {
    id: 'warrior-3', name: 'Warrior III', pattern: 'balance', level: 6,
    muscles: { primary: ['glutes', 'hamstrings'], secondary: ['lower_back', 'abs', 'shoulders'] },
    equipment: [], measure: 'time', perSide: true, range: [10, 30], met: 3.0, impact: 'none', apps: ['bloom'],
    avoidIf: ['pregnancy'], cautionIf: ['lower_back'],
    tags: ['quiet', 'isometric'], motion: () => Y.warrior3(),
  },

  // ---- Hip openers ------------------------------------------------------------------------------
  {
    id: 'low-lunge', name: 'Low lunge', pattern: 'hip', level: 2,
    muscles: { primary: ['hip_flexors', 'quads'], secondary: ['glutes', 'shoulders'] },
    equipment: [], measure: 'time', perSide: true, range: [20, 45], met: 2.3, impact: 'none', apps: ['bloom'], cautionIf: ['knees'],
    tags: ['quiet'], motion: () => Y.lowLunge(),
  },
  {
    id: 'lizard-lunge', name: 'Lizard lunge', pattern: 'hip', level: 4,
    muscles: { primary: ['hip_flexors', 'adductors'], secondary: ['hamstrings', 'glutes'] },
    equipment: [], measure: 'time', perSide: true, range: [20, 45], met: 2.3, impact: 'none', apps: ['bloom'], cautionIf: ['knees', 'wrists'],
    tags: ['quiet'], motion: () => Y.lizardLunge(),
  },
  {
    id: 'pigeon-pose', name: 'Pigeon pose', pattern: 'hip', level: 5,
    muscles: { primary: ['glutes', 'hip_flexors'], secondary: ['lower_back'] },
    equipment: [], measure: 'time', perSide: true, range: [30, 60], met: 2.0, impact: 'none', apps: ['bloom'], avoidIf: ['knees'],
    tags: ['quiet', 'cooldown'], motion: () => Y.pigeon(),
  },
  {
    id: 'sleeping-pigeon', name: 'Sleeping pigeon', pattern: 'hip', level: 6,
    muscles: { primary: ['glutes'], secondary: ['lower_back', 'hip_flexors'] },
    equipment: [], measure: 'time', perSide: true, range: [30, 75], met: 1.8, impact: 'none', apps: ['bloom'], avoidIf: ['knees', 'pregnancy'],
    tags: ['quiet', 'cooldown'], motion: () => Y.pigeon({ fold: true }),
  },
  {
    id: 'butterfly-pose', name: 'Butterfly', pattern: 'hip', level: 1,
    muscles: { primary: ['adductors', 'hip_flexors'], secondary: ['lower_back'] },
    equipment: [], measure: 'time', range: [30, 60], met: 1.8, impact: 'none', apps: ['bloom'], cautionIf: ['knees'],
    tags: ['quiet', 'cooldown'], motion: () => Y.butterfly(),
  },

  // ---- Forward folds ----------------------------------------------------------------------------
  {
    id: 'standing-forward-fold', name: 'Standing forward fold', pattern: 'fold', level: 1,
    muscles: { primary: ['hamstrings', 'lower_back'], secondary: ['calves'] },
    equipment: [], measure: 'time', range: [20, 45], met: 2.0, impact: 'none', apps: ['bloom'], cautionIf: ['lower_back'],
    tags: ['quiet', 'snack'], motion: () => Y.standingFold(),
  },
  {
    id: 'seated-forward-fold', name: 'Seated forward fold', pattern: 'fold', level: 2,
    muscles: { primary: ['hamstrings', 'lower_back'], secondary: ['calves'] },
    equipment: [], measure: 'time', range: [30, 60], met: 1.8, impact: 'none', apps: ['bloom'], cautionIf: ['lower_back', 'pregnancy'],
    tags: ['quiet', 'cooldown'], motion: () => Y.seatedForwardFold(),
  },
  {
    id: 'down-dog', name: 'Downward-facing dog', pattern: 'fold', level: 3,
    muscles: { primary: ['hamstrings', 'shoulders'], secondary: ['calves', 'upper_back'] },
    equipment: [], measure: 'time', range: [20, 45], met: 2.8, impact: 'none', apps: ['bloom'], cautionIf: ['wrists', 'shoulders'],
    tags: ['quiet'], motion: () => Y.downDog(),
  },
  {
    id: 'half-splits', name: 'Half splits', pattern: 'fold', level: 4,
    muscles: { primary: ['hamstrings'], secondary: ['calves', 'hip_flexors'] },
    equipment: [], measure: 'time', perSide: true, range: [20, 45], met: 1.8, impact: 'none', apps: ['bloom'], cautionIf: ['knees'],
    tags: ['quiet', 'cooldown'], motion: () => Y.halfSplits(),
  },

  // ---- Backbends ------------------------------------------------------------------------------
  {
    id: 'sphinx-pose', name: 'Sphinx pose', pattern: 'backbend', level: 1,
    muscles: { primary: ['lower_back', 'abs'], secondary: ['chest', 'shoulders'] },
    equipment: [], measure: 'time', range: [30, 60], met: 1.8, impact: 'none', apps: ['bloom'], avoidIf: ['pregnancy'], cautionIf: ['lower_back'],
    tags: ['quiet', 'cooldown'], motion: () => Y.sphinx(),
  },
  {
    id: 'bridge-pose', name: 'Bridge pose', pattern: 'backbend', level: 2,
    muscles: { primary: ['glutes', 'hamstrings'], secondary: ['lower_back', 'quads', 'chest'] },
    equipment: [], measure: 'time', range: [20, 45], met: 2.8, impact: 'none', apps: ['bloom'], cautionIf: ['neck', 'pregnancy'],
    tags: ['quiet', 'isometric'], motion: () => Y.bridgeHold(),
  },
  {
    id: 'locust-pose', name: 'Locust pose', pattern: 'backbend', level: 3,
    muscles: { primary: ['lower_back', 'glutes'], secondary: ['upper_back', 'hamstrings'] },
    equipment: [], measure: 'reps', range: [3, 6], met: 2.8, impact: 'none', apps: ['bloom'], avoidIf: ['pregnancy'], cautionIf: ['lower_back', 'neck'],
    tags: ['quiet'], motion: () => Y.locust(),
  },

  // ---- Twist and rest ---------------------------------------------------------------------------
  {
    id: 'supine-twist', name: 'Reclined twist', pattern: 'twist', level: 1,
    muscles: { primary: ['obliques', 'lower_back'], secondary: ['chest', 'glutes'] },
    equipment: [], measure: 'time', perSide: true, range: [30, 60], met: 1.7, impact: 'none', apps: ['bloom'], avoidIf: ['pregnancy'], cautionIf: ['lower_back'],
    tags: ['quiet', 'cooldown'], motion: () => Y.supineTwist(),
  },
  {
    id: 'happy-baby', name: 'Happy baby', pattern: 'restore', level: 1,
    muscles: { primary: ['glutes', 'adductors'], secondary: ['lower_back', 'hamstrings'] },
    equipment: [], measure: 'time', range: [30, 60], met: 1.7, impact: 'none', apps: ['bloom'], cautionIf: ['knees', 'pregnancy'],
    tags: ['quiet', 'cooldown'], motion: () => Y.happyBaby(),
  },
  {
    id: 'knees-to-chest', name: 'Knees to chest', pattern: 'restore', level: 1,
    muscles: { primary: ['lower_back', 'glutes'], secondary: ['hamstrings'] },
    equipment: [], measure: 'time', range: [30, 60], met: 1.7, impact: 'none', apps: ['bloom'], avoidIf: ['pregnancy'],
    tags: ['quiet', 'cooldown'], motion: () => Y.kneesToChest(),
  },
  {
    id: 'reclined-butterfly', name: 'Reclined butterfly', pattern: 'restore', level: 1,
    muscles: { primary: ['adductors', 'hip_flexors'], secondary: ['chest'] },
    equipment: [], measure: 'time', range: [45, 180], met: 1.6, impact: 'none', apps: ['bloom'], cautionIf: ['knees', 'pregnancy'],
    tags: ['quiet', 'cooldown'], motion: () => Y.reclinedButterfly(),
  },
  {
    id: 'legs-up-the-wall', name: 'Legs up the wall', pattern: 'restore', level: 1,
    muscles: { primary: ['hamstrings', 'calves'], secondary: ['lower_back'] },
    equipment: ['wall'], measure: 'time', range: [60, 300], met: 1.6, impact: 'none', apps: ['bloom'], cautionIf: ['pregnancy'],
    tags: ['quiet', 'cooldown'], motion: () => Y.legsUpWall(),
  },
  {
    id: 'savasana', name: 'Resting pose', pattern: 'restore', level: 1,
    muscles: { primary: ['lower_back', 'shoulders'], secondary: ['abs'] },
    equipment: [], measure: 'time', range: [60, 600], met: 1.6, impact: 'none', apps: ['bloom'], cautionIf: ['pregnancy', 'lower_back'],
    tags: ['quiet', 'cooldown'], motion: () => Y.savasana(),
    youtube: 'savasana corpse pose for beginners',
  },
  {
    id: 'easy-seat-breath', name: 'Easy seat breathing', pattern: 'restore', level: 1,
    muscles: { primary: ['abs'], secondary: ['lower_back', 'shoulders'] },
    equipment: [], measure: 'time', range: [30, 300], met: 1.6, impact: 'none', apps: ['bloom'], cautionIf: ['knees', 'hips'],
    tags: ['quiet', 'warmup', 'cooldown', 'snack'], motion: () => Y.easySeat(),
    youtube: 'sukhasana easy seat breathing',
  },

  // ---- Gentle mobility --------------------------------------------------------------------------
  {
    id: 'neck-release', name: 'Neck and shoulder release', pattern: 'mobility', level: 1,
    muscles: { primary: ['traps', 'shoulders'], secondary: ['upper_back'] },
    equipment: [], measure: 'time', range: [30, 60], met: 1.7, impact: 'none', apps: ['bloom'], cautionIf: ['neck'],
    tags: ['quiet', 'warmup', 'snack'], motion: () => Y.neckRelease(),
  },
  {
    id: 'seated-side-bend', name: 'Seated side bend', pattern: 'mobility', level: 1,
    muscles: { primary: ['obliques', 'lats'], secondary: ['shoulders'] },
    equipment: [], measure: 'reps', perSide: true, range: [2, 4], met: 1.8, impact: 'none', apps: ['bloom'],
    tags: ['quiet', 'warmup', 'snack'], motion: () => Y.seatedSideBend(),
  },
  {
    id: 'puppy-pose', name: 'Puppy pose', pattern: 'mobility', level: 2,
    muscles: { primary: ['shoulders', 'lats'], secondary: ['upper_back', 'lower_back'] },
    equipment: [], measure: 'time', range: [30, 60], met: 1.8, impact: 'none', apps: ['bloom'], cautionIf: ['knees', 'shoulders'],
    tags: ['quiet', 'cooldown'], motion: () => Y.puppyPose(),
  },

  // ---- Gentle core ------------------------------------------------------------------------------
  {
    id: 'toe-taps', name: 'Toe taps', pattern: 'core', level: 1,
    muscles: { primary: ['abs'], secondary: ['hip_flexors'] },
    equipment: [], measure: 'reps', perSide: true, range: [5, 12], met: 2.8, impact: 'none', apps: ['bloom'], avoidIf: ['pregnancy'],
    tags: ['quiet'], motion: () => Y.toeTaps(),
  },
  {
    id: 'boat-pose-easy', name: 'Boat pose, feet down', pattern: 'core', level: 2,
    muscles: { primary: ['abs', 'hip_flexors'], secondary: ['lower_back'] },
    equipment: [], measure: 'time', range: [15, 30], met: 2.8, impact: 'none', apps: ['bloom'], avoidIf: ['pregnancy'], cautionIf: ['lower_back'],
    tags: ['quiet', 'isometric'], motion: () => Y.boat({ easy: true }),
  },
  {
    id: 'boat-pose', name: 'Boat pose', pattern: 'core', level: 4,
    muscles: { primary: ['abs', 'hip_flexors'], secondary: ['quads', 'lower_back'] },
    equipment: [], measure: 'time', range: [10, 30], met: 3.0, impact: 'none', apps: ['bloom'], avoidIf: ['pregnancy'], cautionIf: ['lower_back'],
    tags: ['quiet', 'isometric'], motion: () => Y.boat(),
  },
]

/**
 * Forge exercises that also suit Bloom's gentle practice (both apps list them). Pregnancy limits
 * for them are added in ./index.ts.
 */
export const SHARED_WITH_BLOOM = new Set([
  'cat-cow',
  'childs-pose',
  'cobra-stretch',
  'down-dog-cobra',
  'figure-four-stretch',
  'hip-flexor-stretch',
  'chest-opener',
  'glute-bridge',
  'bird-dog',
  'dead-bug',
  'knee-plank',
  'forearm-plank',
  'side-plank-knee',
  'wall-pushup',
  'box-squat',
  'march-in-place',
])

/** Shared moves a pregnant practice should skip (on the belly, or core work lying on the back). */
export const SHARED_AVOID_IN_PREGNANCY = new Set(['cobra-stretch', 'down-dog-cobra', 'dead-bug', 'forearm-plank'])
