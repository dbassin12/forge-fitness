import type { ExerciseCopy } from '../types'

/**
 * Coaching copy for the squat, lunge, hinge and bridge patterns, keyed by exercise id.
 * It is read aloud by text-to-speech and shown as captions, so it is plain spoken English:
 * second person, imperative, numbers spelled out, and no abbreviations, symbols or brackets.
 */
export const COPY_LEGS: Record<string, ExerciseCopy> = {
  // ---- Squat ----------------------------------------------------------------------------
  'box-squat': {
    summary: 'You sit back onto a chair and stand up with control, building leg and glute strength and a solid squat pattern.',
    setup: [
      'Place a sturdy chair behind you with its back against a wall so it cannot slide.',
      'Stand in front of it with your feet shoulder width apart and your toes turned out slightly.',
    ],
    steps: [
      'Reach your arms forward and push your hips back as if sitting down.',
      'Lower slowly until you lightly touch the seat, keeping your chest up and your knees over your toes.',
      'Press through your whole foot to stand all the way up, squeezing your glutes at the top.',
    ],
    breathing: 'Breathe in as you sit back, and breathe out as you stand up.',
    cues: ['Hips back first', "Tap the seat, don't plop", 'Chest tall, eyes forward', 'Push the floor away'],
    mistakes: [
      { text: 'You drop onto the chair.', fix: 'Lower for a slow count of two and only tap the seat before you stand.' },
      { text: 'Your knees drift inward.', fix: 'Push your knees out in line with your toes the whole way.' },
    ],
    easier: 'Stack a firm cushion on the seat to make it taller, or hold a countertop for balance.',
    harder: 'When this feels easy, move up to the bodyweight squat with no chair.',
    safety: 'Check that the chair is steady, and stop if your knees hurt.',
  },
  'bodyweight-squat': {
    summary: 'The classic squat builds strong thighs and glutes and lays the foundation for almost every standing leg move.',
    setup: [
      'Stand with your feet a little wider than your shoulders and your toes turned slightly out.',
      'Reach your arms forward for balance.',
    ],
    steps: [
      'Brace your belly, then push your hips back and bend your knees at the same time.',
      'Lower until your thighs are about parallel to the floor, or only as deep as feels comfortable.',
      'Keep your heels down and your chest tall, then drive through your whole foot to stand.',
    ],
    breathing: 'Breathe in as you lower, and breathe out as you stand.',
    cues: ["Sit back like there's a chair", 'Knees track over toes', 'Heels stay glued down', 'Chest tall, eyes forward'],
    mistakes: [
      { text: 'Your heels lift off the floor.', fix: 'Sit your hips back and only lower as far as your heels stay down.', fault: 'heels-up' },
      { text: 'Your back rounds.', fix: 'Lift your chest, look straight ahead, and keep your spine long.', fault: 'round-back' },
      { text: 'Your knees cave inward.', fix: 'Push your knees out over your toes, as if spreading the floor apart.', fault: 'knee-cave' },
    ],
    easier: 'Go back to the box squat to chair so you have a seat to aim for.',
    harder: 'Move up to the pause squat, then try the goblet squat.',
    safety: 'Stop if you feel sharp pain in your knees.',
  },
  'pause-squat': {
    summary: 'You squat and then pause at the bottom, building control, leg strength, and confidence in the deepest part of the movement.',
    setup: [
      'Stand with your feet a little wider than your shoulders and your toes turned slightly out.',
      'Reach your arms forward for balance.',
    ],
    steps: [
      'Push your hips back and lower slowly, taking about two seconds.',
      'Pause at the bottom for a slow count of two, staying tight with your chest tall and your knees over your toes.',
      'Drive through your whole foot to stand up smoothly.',
    ],
    breathing: 'Breathe in on the way down, keep breathing slowly during the pause, and breathe out as you stand.',
    cues: ['Slow down, hold the bottom', "Stay tight, don't sink", 'Knees track over toes', 'Chest tall, heels down'],
    mistakes: [
      { text: 'You relax and sink at the bottom.', fix: 'Stay tight during the pause, as if you could stand up at any moment.' },
      { text: 'You bounce out of the bottom.', fix: 'Stay still for the whole pause, then push up smoothly.' },
    ],
    easier: 'Skip the pause and do the regular bodyweight squat.',
    harder: 'Hold a dumbbell at your chest for the goblet squat.',
    safety: 'Stop short of any depth that pinches or hurts your knees.',
  },
  'goblet-squat': {
    summary: 'You squat while holding one dumbbell at your chest, building strong thighs and glutes as the weight helps you stay upright.',
    setup: [
      'Hold one dumbbell upright against your chest, your heavier one if you have it, with both hands cupped under the top end.',
      'Stand with your feet a little wider than your shoulders and your toes turned slightly out.',
    ],
    steps: [
      'Brace your belly, push your hips back, and bend your knees.',
      'Lower until your elbows brush the inside of your knees, or only as deep as feels comfortable.',
      'Keep the dumbbell close to your chest, then press through your whole foot to stand.',
    ],
    breathing: 'Breathe in as you lower, and breathe out as you stand.',
    cues: ['Elbows inside your knees', 'Chest tall, dumbbell close', 'Stay tall under the weight', 'Push the floor away'],
    mistakes: [
      { text: 'You lean forward as the dumbbell drifts away.', fix: 'Hug the dumbbell into your chest and keep your elbows pointing down.' },
      { text: 'Your heels lift.', fix: 'Sit your hips back and keep your whole foot pressed into the floor.' },
    ],
    easier: 'Go back to the pause squat with no weight.',
    harder: 'With only a twenty-pound dumbbell, lower for four slow seconds, or move up to the dumbbell front squat.',
    safety: 'Stop if you feel sharp pain in your knees or lower back.',
  },
  'db-front-squat': {
    summary: 'You squat with a dumbbell resting on each shoulder, challenging your thighs, glutes, and core while keeping your chest upright.',
    setup: [
      'Rest a dumbbell on each shoulder, with your elbows pointing forward and your palms facing in.',
      'Stand with your feet a little wider than your shoulders and your toes turned slightly out.',
    ],
    steps: [
      'Brace your belly, push your hips back, and bend your knees.',
      'Lower until your thighs are about parallel to the floor, keeping your elbows up and your chest tall.',
      'Drive through your whole foot to stand all the way up.',
    ],
    breathing: 'Breathe in as you lower, and breathe out as you stand.',
    cues: ['Elbows up, chest proud', 'Weights stay on your shoulders', 'Knees track over toes', 'Drive up through your feet'],
    mistakes: [
      { text: 'Your elbows drop and your chest folds forward.', fix: 'Lift your elbows and keep your chest tall the whole way.' },
      { text: 'Your heels lift.', fix: 'Sit your hips back and keep your whole foot planted.' },
    ],
    easier: 'Go back to the goblet squat with one dumbbell.',
    harder: 'Lower for four slow seconds and pause at the bottom for two.',
    safety: 'Keep the dumbbells snug on your shoulders, and stop if your knees hurt.',
  },
  'wall-sit': {
    summary: 'You hold a seated position against a wall with your thighs level with the floor, building thigh endurance and mental toughness.',
    setup: ['Lean your back flat against a wall and walk your feet a big step out in front of you, hip width apart.'],
    steps: [
      'Slide your back down the wall until your knees are bent to about ninety degrees.',
      'Check that your knees stack right over your ankles, and rest your hands on your hips.',
      'Press your lower back lightly into the wall and hold for the full time.',
    ],
    breathing: 'Breathe slowly and steadily the whole time, without holding your breath.',
    cues: ['Knees right over ankles', 'Press your back into the wall', "Keep breathing, don't hold it", 'Thighs level with the floor', 'Stay with it'],
    mistakes: [
      { text: 'Your feet sit too close to the wall.', fix: 'Walk your feet farther out until your knees stack over your ankles.' },
      { text: 'You slide lower than parallel.', fix: 'Stop with your thighs level with the floor, or a little higher if that feels better.' },
    ],
    easier: 'Slide down only partway so your knees bend less, and shorten the hold.',
    harder: 'Add a few seconds each session, or rest a dumbbell on your thighs.',
    safety: 'Stop if you feel sharp pain in your knees.',
  },
  'squat-jump': {
    summary: 'You squat down and explode into a jump, building leg power and sending your heart rate up fast.',
    setup: [
      'Stand on a firm, grippy floor in supportive shoes, with plenty of clear space around you.',
      'Place your feet shoulder width apart.',
    ],
    steps: [
      'Squat down quickly to a comfortable depth, swinging your arms back.',
      'Explode upward, swinging your arms forward and straightening your legs to leave the ground.',
      'Land softly on the balls of your feet, then let your heels settle and your knees bend to absorb the impact.',
    ],
    breathing: 'Breathe in as you squat down, and breathe out sharply as you jump.',
    cues: ['Land soft and quiet', 'Explode up, reach tall', 'Knees over toes on landing', 'Reset between jumps'],
    mistakes: [
      { text: 'You land on stiff, straight legs.', fix: 'Land softly with your hips back and your knees bent to absorb the impact.' },
      { text: 'Your knees cave in as you land.', fix: 'Keep your knees over your toes, and end the set when your form slips.' },
    ],
    easier: 'For a quiet, low-impact option, stand up fast from a bodyweight squat and rise onto your toes instead of jumping.',
    harder: 'Pause for one second at the bottom before each jump, then explode as high as you can.',
    safety: 'Skip the jumps if your knees or ankles are sore.',
  },

  // ---- Lunge / single leg ---------------------------------------------------------------
  'split-squat': {
    summary: 'You lower straight down in a staggered stance, building single-leg strength in your thighs and glutes and training your balance.',
    setup: [
      'Step one foot back about one big stride, with your back heel lifted and both feet pointing forward.',
      'Place your hands on your hips and stand tall.',
    ],
    steps: [
      'Bend both knees and lower your back knee straight down toward the floor.',
      'Stop just above the floor, with your front heel down and your torso upright.',
      'Press through your front foot to rise. Finish your reps, then switch legs.',
    ],
    breathing: 'Breathe in as you lower, and breathe out as you press up.',
    cues: ['Straight down, straight up', 'Front heel stays down', 'Tall chest, hips square', 'Front knee over middle toes'],
    mistakes: [
      { text: 'Your stance is too short and your front knee drifts far forward.', fix: 'Take a longer stride so your front shin stays close to upright.' },
      { text: 'You wobble from side to side.', fix: 'Widen your stance a little and fix your eyes on one spot.' },
    ],
    easier: 'Hold the back of a chair for balance and lower only halfway.',
    harder: 'Step back into the reverse lunge for more balance and control.',
    safety: 'Stop if your front knee hurts.',
  },
  'reverse-lunge': {
    summary: 'You step backward into a lunge and return to standing, building strong thighs and glutes and balance on one leg at a time.',
    setup: [
      'Stand tall with your feet hip width apart and your hands on your hips.',
      'Keep a wall or chair within reach if you want balance support.',
    ],
    steps: [
      'Step one foot back about one big stride, landing on the ball of that foot.',
      'Bend both knees and lower until your back knee hovers just above the floor.',
      'Push through your front foot to return to standing. Finish your reps, then switch legs.',
    ],
    breathing: 'Breathe in as you step back and lower, and breathe out as you drive up.',
    cues: ['Long step back', 'Drop your back knee straight down', 'Front heel stays heavy', 'Chest tall, hips square'],
    mistakes: [
      { text: 'You take too short a step.', fix: 'Step farther back so your front shin stays close to upright.' },
      { text: 'Your front knee collapses inward.', fix: 'Keep your front knee tracking over your middle toes.' },
      { text: 'Your torso tips forward.', fix: 'Stay tall and look straight ahead.' },
    ],
    easier: 'Go back to the split squat, where your feet stay planted.',
    harder: 'Hold a dumbbell in each hand for the dumbbell reverse lunge.',
    safety: 'Stop if your front knee hurts, and use a wall for balance if needed.',
  },
  'db-reverse-lunge': {
    summary: 'You step backward into a lunge while holding a dumbbell in each hand, building stronger thighs and glutes and challenging your grip.',
    setup: [
      'Hold a dumbbell in each hand at your sides, with your arms long and your shoulders relaxed.',
      'Stand tall with your feet hip width apart.',
    ],
    steps: [
      'Step one foot back about one big stride, landing on the ball of that foot.',
      'Bend both knees and lower until your back knee hovers just above the floor, with the dumbbells hanging still.',
      'Push through your front foot to return to standing. Finish your reps, then switch legs.',
    ],
    breathing: 'Breathe in as you step back and lower, and breathe out as you rise.',
    cues: ['Long step back', 'Dumbbells hang still', 'Chest tall, shoulders back', 'Front heel stays heavy'],
    mistakes: [
      { text: 'You swing the dumbbells or lean forward.', fix: 'Keep your arms long and your chest tall, and let the dumbbells hang.' },
      { text: 'Your back knee slams the floor.', fix: 'Lower under control and hover just above the floor.' },
    ],
    easier: 'Put the dumbbells down and do the reverse lunge.',
    harder: 'Slow the lowering to three seconds, or move up to the Bulgarian split squat.',
    safety: 'Pick a stride you can control, and stop if your front knee hurts.',
  },
  'forward-lunge': {
    summary: 'You step forward into a lunge and push back to the start, building strong thighs and glutes and control as you slow each step.',
    setup: [
      'Stand tall with your feet hip width apart and your hands on your hips.',
      'Clear a few feet of floor in front of you.',
    ],
    steps: [
      'Take a long step forward and plant your whole front foot.',
      'Lower straight down until your back knee hovers just above the floor and your front knee stays over your middle toes.',
      'Push firmly off your front foot to return to the start. Finish your reps, then switch legs.',
    ],
    breathing: 'Breathe in as you step and lower, and breathe out as you push back.',
    cues: ['Step long, land soft', 'Straight down, not forward', 'Front knee over middle toes', 'Push back to start'],
    mistakes: [
      { text: 'You take too short a step.', fix: 'Step farther so your front shin stays close to upright.' },
      { text: 'Your front knee caves inward.', fix: 'Track your front knee over your middle toes.' },
      { text: 'You stomp your front foot down.', fix: 'Land softly and control the descent.' },
    ],
    easier: 'Go back to the reverse lunge or the split squat, where your front foot stays planted.',
    harder: 'Slow the lowering to three seconds, or move up to the dumbbell reverse lunge.',
    safety: 'Stepping forward loads the front knee more, so choose the reverse lunge if your knees feel sensitive.',
  },
  'step-up': {
    summary: 'You step up onto a stair and lower back down with control, building single-leg strength in your thighs and glutes.',
    setup: [
      'Face a sturdy stair or low step, and hold the railing or wall if you want extra balance.',
      'Place one whole foot on the step with your hands on your hips.',
    ],
    steps: [
      'Press through your whole front foot and stand up tall, bringing your other foot up beside it.',
      'Lower your free foot slowly back to the floor, letting your working leg control the way down.',
      'Finish your reps, then switch legs.',
    ],
    breathing: 'Breathe out as you step up, and breathe in as you lower.',
    cues: ['Push through the whole foot', "Don't push off the back foot", 'Stand tall at the top', 'Lower slowly, stay in control'],
    mistakes: [
      { text: 'You push off your back foot.', fix: 'Keep most of your weight on the foot that is on the step.' },
      { text: 'You drop down fast.', fix: 'Lower for a slow count of three.' },
      { text: 'Your knee drifts inward.', fix: 'Keep your knee pointing over your middle toes.' },
    ],
    easier: 'Use a lower step and hold the railing for balance.',
    harder: 'Hold a dumbbell in each hand for the dumbbell step-up.',
    safety: 'Use a dry, stable step, and stop if your knee hurts or you feel unsteady.',
  },
  'db-step-up': {
    summary: 'You step up onto a stair while holding a dumbbell in each hand, building powerful thighs and glutes and challenging your balance and grip.',
    setup: [
      'Hold a dumbbell in each hand at your sides and face a sturdy stair or low step.',
      'Place one whole foot on the step.',
    ],
    steps: [
      'Press through your whole front foot and stand up tall, bringing your other foot up beside it.',
      'Keep your arms long and your chest up, without leaning back at the top.',
      'Lower your free foot slowly to the floor. Finish your reps, then switch legs.',
    ],
    breathing: 'Breathe out as you step up, and breathe in as you lower.',
    cues: ['Drive through the front heel', 'Dumbbells hang still', 'Stand tall at the top', 'Lower for three counts'],
    mistakes: [
      { text: 'You push off your back foot.', fix: 'Keep your weight on the step foot and let the back foot just tag along.' },
      { text: 'You lean back at the top.', fix: 'Stand tall with your ribs stacked over your hips.' },
    ],
    easier: 'Put the dumbbells down and do the step-up.',
    harder: 'Slow the lowering to four seconds, or move up to the dumbbell Bulgarian split squat.',
    safety: 'Use a dry, stable step, and stop if your knee hurts or you feel unsteady.',
  },
  'bulgarian-split-squat': {
    summary: 'You rest your back foot on a chair and lower into a split squat, building strong, balanced thighs and glutes one leg at a time.',
    setup: [
      'Set a sturdy chair against a wall and stand facing away from it, a long stride out.',
      'Rest the top of one foot on the seat behind you, and place your hands on your hips.',
    ],
    steps: [
      'Bend your front knee and lower your hips straight down, keeping your torso tall.',
      'Lower until your front thigh is about parallel to the floor, or only as far as feels comfortable.',
      'Press through your whole front foot to stand. Finish your reps, then switch legs.',
    ],
    breathing: 'Breathe in as you lower, and breathe out as you rise.',
    cues: ['Straight down, straight up', 'Weight on the front foot', 'Chest tall, hips square', 'Back foot is just a kickstand'],
    mistakes: [
      { text: 'You stand too close to the chair.', fix: 'Step farther out so your front heel stays down and your shin stays near upright.' },
      { text: 'You push off your back foot.', fix: 'Put most of your weight on your front leg.' },
      { text: 'Your front knee caves in.', fix: 'Track your front knee over your middle toes.' },
    ],
    easier: 'Go back to the dumbbell reverse lunge, where both feet stay on the floor.',
    harder: 'Hold a dumbbell in each hand for the dumbbell Bulgarian split squat.',
    safety: 'Make sure the chair is steady, and stop if your front knee hurts.',
  },
  'db-bulgarian-split-squat': {
    summary: 'You hold a dumbbell in each hand during a Bulgarian split squat, a demanding single-leg move that builds strong thighs and glutes.',
    setup: [
      'Set a sturdy chair against a wall and stand facing away from it, a long stride out, with a dumbbell in each hand.',
      'Rest the top of one foot on the seat behind you.',
    ],
    steps: [
      'Bend your front knee and lower your hips straight down, keeping your torso tall.',
      'Lower until your front thigh is about parallel to the floor, with your arms long and the dumbbells close to your sides.',
      'Press through your whole front foot to stand. Finish your reps, then switch legs.',
    ],
    breathing: 'Breathe in as you lower, and breathe out as you drive up.',
    cues: ['Straight down, straight up', 'Dumbbells stay at your sides', 'Weight on the front foot', 'Tall chest, steady hips'],
    mistakes: [
      { text: 'You lean forward over your front leg.', fix: 'Keep your chest up and the dumbbells at your sides.' },
      { text: 'You drop down too fast.', fix: 'Lower for a slow count of three.' },
      { text: 'You stand too close to the chair.', fix: 'Step farther out so your front heel stays down.' },
    ],
    easier: 'Put the dumbbells down and do the Bulgarian split squat.',
    harder: 'Slow the lowering to four seconds and pause for two at the bottom.',
    safety: 'Make sure the chair is steady, and stop if your front knee hurts or you lose balance.',
  },
  'lateral-lunge': {
    summary: 'You step wide to the side and sit back over one leg, building your glutes, quads, and inner thighs and training side to side movement.',
    setup: [
      'Stand tall with your feet together and your toes pointing forward.',
      'Hold your hands together in front of your chest.',
    ],
    steps: [
      'Take a big step out to the side and sit your hips back, bending that knee.',
      'Keep your other leg straight, both feet flat, and your chest tall.',
      'Push through your bent leg to return to the middle. Finish your reps, then switch sides.',
    ],
    breathing: 'Breathe in as you step and sit back, and breathe out as you push back to the middle.',
    cues: ['Step wide, sit back', 'Straight leg stays straight', 'Both feet stay flat', 'Chest tall, toes forward'],
    mistakes: [
      { text: 'Your bent knee caves inward.', fix: 'Point your toes forward and keep your knee tracking over them.' },
      { text: 'The heel of your bent leg lifts.', fix: 'Sit your hips back and keep your whole foot on the floor.' },
      { text: 'You lean far forward.', fix: 'Keep your chest tall and your hands in front.' },
    ],
    easier: 'Take a smaller step and sit back only partway.',
    harder: 'Move up to the Cossack squat for a wider, deeper side lunge.',
    safety: 'Stop if you feel sharp pain in your knee or inner thigh.',
  },
  'curtsy-lunge': {
    summary: 'You step one leg behind and across your body, working your glutes, thighs, and outer hips from a new angle.',
    setup: [
      'Stand tall with your feet hip width apart and your hands together in front of your chest.',
      'Keep a wall or chair nearby for balance.',
    ],
    steps: [
      'Step one foot back and across behind you, as if curtsying, and bend both knees.',
      'Lower until your front thigh is about parallel to the floor, keeping your hips and chest facing forward.',
      'Push through your front foot to return to the start. Finish your reps, then switch legs.',
    ],
    breathing: 'Breathe in as you step and lower, and breathe out as you rise.',
    cues: ['Cross behind, hips stay square', 'Front knee over middle toes', 'Chest tall, no twisting', 'Push through the front heel'],
    mistakes: [
      { text: 'Your front knee caves in.', fix: 'Press your front knee out over your middle toes.' },
      { text: 'You twist your torso.', fix: 'Keep your hips and chest facing forward.' },
      { text: 'You cross too far and lose balance.', fix: 'Step behind at a comfortable angle and hold a wall if needed.' },
    ],
    easier: 'Go back to the lateral lunge or the reverse lunge.',
    harder: 'Slow the lowering to three seconds, or move up to the Cossack squat.',
    safety: 'This angle can bother sensitive knees, so shrink the range or skip it if your knees hurt.',
  },
  'cossack-squat': {
    summary: 'You sink over one leg while the other stays straight, building your inner thighs, glutes, and quads along with hip mobility.',
    setup: [
      'Stand with your feet about twice shoulder width apart and your toes turned slightly out.',
      'Hold your hands together in front of your chest.',
    ],
    steps: [
      'Shift your weight onto one side and sit your hips back and down over that leg.',
      'Keep your other leg straight, and let its toes lift if you need to.',
      'Drive through your bent leg to slide back to the middle. Finish your reps, then switch sides.',
    ],
    breathing: 'Breathe in as you shift and sink, and breathe out as you push back to the middle.',
    cues: ['Sit back and down', 'Chest tall, hips low', 'Straight leg, toes up', 'Keep the bent heel down', 'Push back to the middle'],
    mistakes: [
      { text: 'The heel of your bent leg lifts.', fix: 'Widen your stance or shrink the depth until your heel stays down.' },
      { text: 'Your chest collapses forward.', fix: 'Keep your chest tall and your hands in front.' },
      { text: 'You force too much depth too soon.', fix: 'Go only as deep as feels comfortable, and add depth over time.' },
    ],
    easier: 'Go back to the lateral lunge, or hold a chair for support and use a smaller range.',
    harder: 'Pause for two seconds at the bottom, or slow the lowering to four seconds.',
    safety: 'Skip this move if your knees are bothering you, and stop if you feel sharp pain.',
  },
  'jump-lunge': {
    summary: 'You switch legs in the air between lunges, building leg power and endurance and raising your heart rate quickly.',
    setup: [
      'Stand on a firm, grippy floor in supportive shoes, with plenty of clear space around you.',
      'Start in a lunge with your front knee bent about ninety degrees and your arms ready to swing.',
    ],
    steps: [
      'Press explosively through both feet and jump straight up, swinging your arms.',
      'Switch your legs in the air so the opposite foot lands in front.',
      'Land softly with your knees bent and sink straight into the next lunge.',
    ],
    breathing: 'Breathe out as you jump, and breathe in as you land and sink.',
    cues: ['Jump tall, switch fast', 'Land soft, knees bent', 'Chest up, eyes forward', 'Quiet landings'],
    mistakes: [
      { text: 'You land on stiff legs.', fix: 'Land with your knees bent and let your heels settle to absorb the impact.' },
      { text: 'Your front knee caves in as you land.', fix: 'Keep it over your middle toes, and end the set when your form slips.' },
    ],
    easier: 'For a quiet, low-impact option, do alternating reverse lunges and keep both feet on the floor.',
    harder: 'Pause for one second at the bottom of each lunge before you jump.',
    safety: 'Skip the jumps if your knees or ankles are sore.',
  },

  // ---- Hinge ----------------------------------------------------------------------------
  'good-morning': {
    summary: 'You fold forward at the hips with a flat back, learning the hip hinge and building your hamstrings and glutes.',
    setup: [
      'Stand with your feet hip width apart and a soft bend in your knees.',
      'Cross your arms over your chest, or rest your fingertips lightly behind your head.',
    ],
    steps: [
      'Push your hips straight back, as if closing a car door with them, keeping your back flat.',
      'Tip your chest forward until you feel a stretch along the backs of your legs, then stop before your back rounds.',
      'Squeeze your glutes and drive your hips forward to stand tall.',
    ],
    breathing: 'Breathe in as you hinge, and breathe out as you stand.',
    cues: ['Hips back, spine long', "Soft knees, don't squat", 'Close the car door with your hips', 'Squeeze glutes to stand'],
    mistakes: [
      { text: 'Your back rounds.', fix: 'Keep your chest proud and stop the hinge when you feel a hamstring stretch.' },
      { text: 'You bend your knees into a squat.', fix: 'Keep your knees soft and send your hips back, not down.' },
      { text: 'You lean back at the top.', fix: 'Finish standing tall, with your hips under your shoulders.' },
    ],
    easier: 'Rest your hands on your thighs and slide them down only partway.',
    harder: 'Move up to the dumbbell Romanian deadlift.',
    safety: 'Keep your back flat, and stop if you feel any pain in your lower back.',
  },
  'db-rdl': {
    summary: 'You hinge at the hips with a dumbbell in each hand, building your hamstrings and glutes and learning a strong, flat back.',
    setup: [
      'Hold a dumbbell in each hand in front of your thighs, with your feet hip width apart.',
      'Soften your knees and pull your shoulders down and back.',
    ],
    steps: [
      'Push your hips straight back and let the dumbbells slide down your thighs and shins.',
      'Lower until you feel a strong stretch in your hamstrings, keeping your back flat.',
      'Squeeze your glutes and drive your hips forward to stand tall.',
    ],
    breathing: 'Breathe in as you hinge down, and breathe out as you stand.',
    cues: ['Hips back, back flat', 'Dumbbells brush your legs', 'Soft knees, long spine', 'Squeeze glutes to stand'],
    mistakes: [
      { text: 'Your back rounds.', fix: 'Lift your chest, pull your shoulders back, and stop the hinge before your spine curls.', fault: 'round-back' },
      { text: 'The dumbbells drift away from your legs.', fix: 'Keep them close, brushing your thighs and shins.' },
      { text: 'You squat down instead of hinging.', fix: 'Keep your knees soft and send your hips straight back.' },
    ],
    easier: 'Go back to the bodyweight good morning to practice the hinge.',
    harder: 'Move up to the single-leg Romanian deadlift, or slow the lowering to four seconds.',
    safety: 'Keep your back flat throughout, and stop if you feel pinching or pain in your lower back.',
  },
  'single-leg-rdl': {
    summary: 'You hinge at the hips on one leg, building your hamstrings and glutes and challenging your balance and core.',
    setup: [
      'Stand on one leg with a soft knee, and keep a wall or chair within reach.',
      'Pick a spot on the floor a few feet ahead and keep your eyes on it.',
    ],
    steps: [
      'Hinge forward from your hips, sliding your free leg straight back as your chest tips down.',
      'Keep your hips level and your back flat, and stop when your torso and free leg make a long line.',
      'Squeeze your glute and return to standing. Finish your reps, then switch legs.',
    ],
    breathing: 'Breathe in as you hinge, and breathe out as you stand.',
    cues: ['Long line, head to heel', 'Hips stay level', 'Soft knee, steady balance', 'Squeeze the glute to stand'],
    mistakes: [
      { text: 'Your hips twist open.', fix: 'Point your back toes at the floor and keep your hips square.' },
      { text: 'Your back rounds.', fix: 'Keep your chest proud and shorten the range of motion.' },
      { text: 'You lock your standing knee.', fix: 'Keep a soft bend in your standing knee.' },
    ],
    easier: 'Rest your fingertips on a wall for balance, or go back to the dumbbell Romanian deadlift.',
    harder: 'Hold a dumbbell for the dumbbell single-leg Romanian deadlift.',
    safety: 'Keep the move small if your balance feels shaky, and stay within reach of a wall.',
  },
  'db-single-leg-rdl': {
    summary: 'You hinge on one leg while holding a dumbbell, building your hamstrings and glutes and challenging your balance, grip, and core.',
    setup: [
      'Hold one dumbbell, your heavier one if you have it, with both hands in front of your thighs.',
      'Stand on one leg with a soft knee, near a wall for balance.',
    ],
    steps: [
      'Hinge from your hips, sending your free leg straight back as the dumbbell lowers toward the floor.',
      'Keep your back flat and your hips level, and stop when your torso and free leg make a long line.',
      'Squeeze your glute and stand tall. Finish your reps, then switch legs.',
    ],
    breathing: 'Breathe in as you hinge, and breathe out as you stand.',
    cues: ['Long line, head to heel', 'Hips level, back flat', 'Dumbbell stays close to your leg', 'Soft knee, steady balance'],
    mistakes: [
      { text: 'Your back rounds.', fix: 'Keep your chest proud and shorten the range until your back stays flat.' },
      { text: 'Your hips twist open.', fix: 'Point your back toes at the floor and keep your hips square.' },
      { text: 'You rush the lowering.', fix: 'Take about three seconds to hinge down.' },
    ],
    easier: 'Put the dumbbell down and do the single-leg Romanian deadlift.',
    harder: 'With only a twenty-pound dumbbell, lower for four slow seconds and pause at the bottom.',
    safety: 'Stay within reach of a wall, and stop if you feel pain in your lower back.',
  },
  'db-swing': {
    summary: 'You swing a dumbbell up to chest height with a sharp hip snap, building powerful glutes and hamstrings and getting your heart pumping.',
    setup: [
      'Hold one dumbbell, your heavier one if you have it, by one end with both hands so it hangs straight down.',
      'Stand with your feet a little wider than your shoulders, with clear space in front of you.',
    ],
    steps: [
      'Hinge your hips back and let the dumbbell swing between your legs, keeping your back flat.',
      'Snap your hips forward and stand tall, letting the dumbbell float up to about chest height.',
      'Let it fall and guide it into the next hinge, keeping your arms relaxed.',
    ],
    breathing: 'Breathe in as the dumbbell swings back, and breathe out sharply as your hips snap forward.',
    cues: ['Hips snap, arms float', "Hinge, don't squat", 'Stand tall, squeeze glutes', 'Flat back every rep', 'Arms are just ropes'],
    mistakes: [
      { text: 'You lift the dumbbell with your arms.', fix: 'Drive it with a sharp hip snap and keep your arms loose.' },
      { text: 'You squat instead of hinging.', fix: 'Push your hips back and keep your shins close to upright.' },
      { text: 'You lean back at the top.', fix: 'Finish standing tall, with your ribs stacked over your hips.' },
    ],
    easier: 'Swing lower and slower, or practice the hinge with the dumbbell Romanian deadlift.',
    harder: 'Swing your heavier dumbbell if you have one, or add reps with a twenty-pound one.',
    safety: 'Hold on tight, and skip swings if your lower back is sore.',
  },

  // ---- Bridge ---------------------------------------------------------------------------
  'glute-bridge': {
    summary: 'You lift your hips from the floor, building your glutes and hamstrings and gently waking up your hips.',
    setup: [
      'Lie on your back with your knees bent and your feet flat on the floor, hip width apart.',
      'Rest your arms by your sides, with your heels close enough to brush with your fingertips.',
    ],
    steps: [
      'Press through your whole foot and lift your hips until your body makes a straight line from your knees to your shoulders.',
      'Squeeze your glutes hard at the top, keeping your ribs down.',
      'Lower your hips slowly back to the floor.',
    ],
    breathing: 'Breathe out as you lift, and breathe in as you lower.',
    cues: ['Squeeze glutes at the top', 'Ribs down, hips up', 'Drive through your heels', 'Slow on the way down'],
    mistakes: [
      { text: 'You arch your lower back at the top.', fix: 'Tuck your ribs down and stop when your body makes a straight line.' },
      { text: 'Your knees fall apart.', fix: 'Keep your knees hip width apart, pointing straight up.' },
    ],
    easier: 'Lift your hips only partway and hold the top for a short count.',
    harder: 'Move up to the single-leg glute bridge, or pause for two seconds at the top.',
    safety: 'Stop if you feel pain in your lower back.',
  },
  'db-glute-bridge': {
    summary: 'You rest a dumbbell on your hips as you bridge, adding load that builds stronger glutes and hamstrings.',
    setup: [
      'Lie on your back with your knees bent and your feet flat, hip width apart.',
      'Rest your heavier dumbbell, or a twenty-pound one, across your hips and hold both ends.',
    ],
    steps: [
      'Press through your whole foot and lift your hips until your body makes a straight line from your knees to your shoulders.',
      'Squeeze your glutes hard at the top, keeping your ribs down.',
      'Lower slowly until your hips lightly touch the floor, then repeat.',
    ],
    breathing: 'Breathe out as you lift, and breathe in as you lower.',
    cues: ['Drive through your heels', 'Squeeze glutes at the top', 'Ribs down, hips up', 'Hold the dumbbell steady'],
    mistakes: [
      { text: 'You arch your lower back at the top.', fix: 'Tuck your ribs down and stop when your body makes a straight line.' },
      { text: 'The dumbbell rolls around.', fix: 'Hold both ends firmly and keep it low across your hips.' },
    ],
    easier: 'Put the dumbbell down and do the glute bridge.',
    harder: 'Pause for two seconds at the top and lower for four, or move up to the hip thrust.',
    safety: 'Pad the dumbbell with a folded towel if it presses on your hip bones.',
  },
  'single-leg-bridge': {
    summary: 'You bridge up on one leg, building glute strength and hip stability and showing you if one side is weaker.',
    setup: [
      'Lie on your back with your knees bent and your feet flat on the floor.',
      'Lift one foot and straighten that leg so it lines up with your other thigh.',
    ],
    steps: [
      'Press through the foot on the floor and lift your hips until your body makes a straight line from your shoulder to your knee.',
      'Keep your hips level and squeeze your glute at the top.',
      'Lower slowly. Finish your reps, then switch legs.',
    ],
    breathing: 'Breathe out as you lift, and breathe in as you lower.',
    cues: ['Hips level, no twisting', 'Press through the heel', 'Squeeze at the top', 'Ribs down, glute tight'],
    mistakes: [
      { text: 'One hip drops or twists.', fix: 'Square your hips to the ceiling and shorten the lift.' },
      { text: 'Your foot sits too far away and your hamstring takes over.', fix: 'Slide your foot closer to your hips and press through your heel.' },
    ],
    easier: 'Go back to the glute bridge with both feet down, or keep the other toes lightly on the floor.',
    harder: 'Move up to the hip thrust with your shoulders on a couch.',
    safety: 'Stop if you feel pain in your lower back.',
  },
  'hip-thrust': {
    summary: 'You lift your hips with your upper back on a couch, building stronger glutes through a longer range than the floor bridge.',
    setup: [
      'Push a sturdy couch or chair against a wall, then sit on the floor with your upper back against its edge.',
      'Bend your knees and place your feet flat on the floor, about hip width apart.',
    ],
    steps: [
      'Press through your feet and drive your hips up until your thighs and torso make a straight line.',
      'Tuck your chin and ribs, and squeeze your glutes hard at the top.',
      'Lower your hips toward the floor under control, then drive up again.',
    ],
    breathing: 'Breathe out as you thrust up, and breathe in as you lower.',
    cues: ['Chin tucked, ribs down', 'Drive through your heels', "Squeeze glutes, don't arch", 'Shins vertical at the top'],
    mistakes: [
      { text: 'You arch your lower back at the top.', fix: 'Tuck your ribs down and stop when your hips are level with your knees.' },
      { text: 'Your feet sit too far from your hips.', fix: 'Bring your heels closer so your shins are vertical at the top.' },
    ],
    easier: 'Go back to the single-leg glute bridge, or the regular glute bridge on the floor.',
    harder: 'Rest a dumbbell across your hips for the dumbbell hip thrust.',
    safety: 'Make sure the couch is steady, and stop if your lower back feels pinched.',
  },
  'db-hip-thrust': {
    summary: 'You add a dumbbell to the hip thrust, building strong, powerful glutes under real load.',
    setup: [
      'Push a sturdy couch or chair against a wall, then sit on the floor with your upper back against its edge.',
      'Rest your heavier dumbbell, or a twenty-pound one, across your hips and hold both ends.',
    ],
    steps: [
      'Press through your feet and drive your hips up until your thighs and torso make a straight line.',
      'Tuck your chin and ribs, and squeeze your glutes hard at the top.',
      'Lower slowly under control, then drive up again.',
    ],
    breathing: 'Breathe out as you thrust up, and breathe in as you lower.',
    cues: ['Chin tucked, ribs down', 'Squeeze glutes at the top', 'Shins vertical at the top', 'Hold the dumbbell steady'],
    mistakes: [
      { text: 'You arch your lower back too much.', fix: 'Tuck your ribs down and stop when your hips are level with your knees.' },
      { text: 'The dumbbell rolls around.', fix: 'Hold both ends and pad it with a folded towel.' },
      { text: 'Your feet sit too far away.', fix: 'Slide your feet closer so your shins are vertical at the top.' },
    ],
    easier: 'Put the dumbbell down and do the hip thrust.',
    harder: 'With only a twenty-pound dumbbell, pause for two seconds at the top and lower for four.',
    safety: 'Pad the dumbbell with a folded towel, and stop if your lower back feels pinched.',
  },
}
