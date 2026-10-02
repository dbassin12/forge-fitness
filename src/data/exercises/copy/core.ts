import type { ExerciseCopy } from '../types'

/**
 * Coaching copy for the core exercises. Written to be read aloud by text to speech and shown as
 * captions: plain spoken English, second person, no symbols, parentheses, slashes or digits.
 */
export const COPY_CORE: Record<string, ExerciseCopy> = {
  'dead-bug': {
    summary: 'The dead bug teaches your core to stay braced and steady while your opposite arm and leg move.',
    setup: [
      'Lie on your back with your arms reaching toward the ceiling and your knees bent over your hips at a right angle.',
      'Press your lower back gently into the floor and keep it there.',
    ],
    steps: [
      'Slowly lower your right arm behind your head and straighten your left leg out long, stopping before your lower back lifts.',
      'Float them back to the start with control.',
      'Repeat with your left arm and right leg, and keep alternating.',
    ],
    breathing: 'Breathe out as you lower your arm and leg, and breathe in as you bring them back.',
    cues: ['Press your lower back down', 'Slow and controlled', 'Reach long through fingers and heel', 'Stop before your back arches'],
    mistakes: [
      { text: 'Your lower back arches away from the floor.', fix: 'Reach less far, and keep your back pressed down.' },
      { text: 'You rush the movement.', fix: 'Take about two seconds to lower and two seconds to return.' },
    ],
    easier: 'Keep your feet on the floor and slide one heel out at a time.',
    harder: 'Lower more slowly, taking three seconds each way, or move on to the tuck hollow hold.',
    safety: 'Stop if you feel pinching in your lower back, and shorten the reach.',
  },

  'knee-plank': {
    summary: 'The knee plank is a gentler plank that builds the core strength to hold your body in one straight line.',
    setup: [
      'Kneel on the floor, then lower onto your forearms with your elbows directly under your shoulders.',
      'Walk your knees back until your body makes a straight line from your knees to your head.',
    ],
    steps: [
      'Tuck your tailbone slightly and squeeze your glutes so your hips line up between your shoulders and knees.',
      'Press your forearms into the floor and push the floor away to keep your upper back wide.',
      'Hold that straight line for the whole time, and keep breathing.',
    ],
    breathing: 'Breathe slowly and steadily while you keep your belly braced, and never hold your breath.',
    cues: ['Ribs down, squeeze your glutes', 'Straight line, knees to head', 'Push the floor away', 'Eyes on the floor', 'Keep breathing'],
    mistakes: [
      { text: 'Your hips sag toward the floor.', fix: 'Squeeze your glutes and tuck your tailbone slightly.' },
      { text: 'Your hips pop up too high.', fix: 'Lower them until your body makes one straight line.' },
    ],
    easier: 'Hold for shorter bursts of about ten seconds, and rest between each one.',
    harder: 'Lift your knees off the floor and move on to the full forearm plank.',
    safety: 'Stop if you feel pinching in your lower back or strain in your shoulders.',
  },

  'forearm-plank': {
    summary: 'The forearm plank trains your core, shoulders, and glutes to hold your body in one straight line.',
    setup: [
      'Start on your hands and knees, then lower onto your forearms with your elbows right under your shoulders.',
      'Step your feet back one at a time until your legs are straight.',
    ],
    steps: [
      'Squeeze your glutes and thighs, tuck your tailbone slightly, and pull your ribs down.',
      'Make one straight line from your head to your heels, and push the floor away with your forearms.',
      'Hold it steady for the whole time, and keep breathing.',
    ],
    breathing: 'Breathe slowly and steadily through your nose while you keep your belly braced.',
    cues: ['Squeeze your glutes', 'Ribs down, belly tight', 'Long line, head to heels', 'Push the floor away', 'Keep breathing'],
    mistakes: [
      { text: 'Your hips sag toward the floor.', fix: 'Squeeze your glutes and pull your ribs down.', fault: 'hip-sag' },
      { text: 'Your hips rise too high toward the ceiling.', fix: 'Lower your hips until your body is one straight line.', fault: 'hip-pike' },
      { text: 'Your neck cranes up or your head droops.', fix: 'Look at the floor just past your hands, with your neck long.' },
    ],
    easier: 'Drop to your knees and hold the knee plank.',
    harder: 'Once you can hold sixty steady seconds, move on to plank shoulder taps.',
    safety: 'Stop if your lower back pinches or your shoulders hurt, and rest on your knees.',
  },

  'high-plank': {
    summary: 'The high plank trains your core and shoulders to hold a straight line, like the top of a push-up.',
    setup: [
      'Start on your hands and knees with your hands directly under your shoulders and your fingers spread wide.',
      'Step your feet back one at a time, about hip width apart, until your legs are straight.',
    ],
    steps: [
      'Squeeze your glutes and thighs, tuck your tailbone slightly, and pull your ribs down.',
      'Push the floor away so your upper back stays wide, and keep your head in line with your spine.',
      'Hold one straight line from your head to your heels, and keep breathing.',
    ],
    breathing: 'Breathe slowly and steadily while you keep your belly braced, and never hold your breath.',
    cues: ['Hands under shoulders', 'Squeeze your glutes', 'Long line, head to heels', 'Push the floor away', 'Ribs down, belly tight'],
    mistakes: [
      { text: 'Your hips sag toward the floor.', fix: 'Squeeze your glutes and pull your ribs down.' },
      { text: 'Your hips rise too high toward the ceiling.', fix: 'Lower your hips until your body is one straight line.' },
      { text: 'Your shoulders creep up toward your ears.', fix: 'Push the floor away and let your shoulder blades spread.' },
    ],
    easier: 'Drop your knees to the floor, or hold for shorter bursts with rest between.',
    harder: 'Move on to plank shoulder taps.',
    safety: 'Spread your fingers and press through your whole hand, and switch to a forearm plank if your wrists hurt.',
  },

  'bird-dog': {
    summary: 'The bird dog trains your lower back, glutes, and core to stay steady while one arm and the opposite leg reach out.',
    setup: [
      'Get on your hands and knees with your hands under your shoulders and your knees under your hips.',
      'Keep your back flat like a table and your neck long, with your eyes on the floor.',
    ],
    steps: [
      'Reach your right arm forward and your left leg straight back at the same time, until both are level with your body.',
      'Pause for one second without letting your hips twist or your back arch.',
      'Return with control, then reach with your left arm and right leg.',
    ],
    breathing: 'Breathe out as you reach, and breathe in as you bring your arm and leg back.',
    cues: ['Back flat like a table', 'Reach long, not high', 'Hips stay level', 'Squeeze your glutes', 'Slow and steady'],
    mistakes: [
      { text: 'Your hips twist open as your leg lifts.', fix: 'Point both hip bones at the floor and lift only to hip height.' },
      { text: 'You swing your leg high and arch your back.', fix: 'Reach long instead of high, and stop level with your hips.' },
    ],
    easier: 'Lift just your arm, or just your leg, one at a time.',
    harder: 'Hold each reach for three seconds, or move on to the bear plank hold.',
    safety: 'Keep the reach long rather than high so your lower back stays comfortable.',
  },

  'side-plank-knee': {
    summary: 'The knee side plank trains the sides of your waist to hold your body straight, with less load than the full side plank.',
    setup: [
      'Lie on your side with your knees bent, and prop yourself up on your bottom hand directly under your shoulder.',
      'Stack your shoulders and hips, and reach your top arm toward the ceiling.',
    ],
    steps: [
      'Lift your hips until your body makes one straight line from your knees to your head.',
      'Squeeze your glutes, push the floor away, and keep your neck long.',
      'Hold steady and keep breathing, then switch sides.',
    ],
    breathing: 'Breathe slowly and steadily, and never hold your breath.',
    cues: ['Hips high, body straight', 'Stack your hips and shoulders', 'Squeeze your glutes', 'Push the floor away', 'Keep breathing'],
    mistakes: [
      { text: 'Your hips sink toward the floor.', fix: 'Push the floor away and squeeze your glutes to lift them.' },
      { text: 'Your body rolls toward the floor or ceiling.', fix: 'Stack your shoulders and hips so your chest faces straight ahead.' },
    ],
    easier: 'Hold for shorter bursts of about ten seconds, and rest between each one.',
    harder: 'Straighten your legs for the full side plank.',
    safety: 'If your shoulder or wrist feels pinched, lower onto your forearm instead.',
  },

  'side-plank': {
    summary: 'The side plank trains your waist muscles, shoulders, and glutes to hold your body in one long, straight line.',
    setup: [
      'Lie on your side with your legs straight and your feet stacked, and prop yourself up on your bottom hand directly under your shoulder.',
      'Stack your shoulders and hips, and reach your top arm toward the ceiling.',
    ],
    steps: [
      'Lift your hips until your body makes one straight line from your head to your feet.',
      'Squeeze your glutes, push the floor away, and keep your neck long.',
      'Hold steady and keep breathing, then switch sides.',
    ],
    breathing: 'Breathe slowly and steadily, and never hold your breath.',
    cues: ['Hips high, body straight', 'Stack your hips and shoulders', 'Squeeze your glutes', 'Push the floor away', 'Keep breathing'],
    mistakes: [
      { text: 'Your hips sink toward the floor.', fix: 'Push the floor away and squeeze your glutes to lift them.' },
      { text: 'Your hips drift backward.', fix: 'Squeeze your glutes and press your hips forward until your body is straight.' },
    ],
    easier: 'Bend your knees and hold the side plank on knees.',
    harder: 'Lift your top leg a few inches while you hold, keeping your hips high.',
    safety: 'If your shoulder or wrist feels pinched, lower onto your forearm instead.',
  },

  'plank-shoulder-tap': {
    summary: 'Plank shoulder taps train your core to resist twisting while you shift your weight from one hand to the other.',
    setup: [
      'Start in a high plank with your hands under your shoulders and your feet a little wider than your hips.',
      'Squeeze your glutes and pull your ribs down so your body is one straight line.',
    ],
    steps: [
      'Lift your right hand and lightly tap your left shoulder, keeping your hips as still as you can.',
      'Return that hand to the floor, then tap your right shoulder with your left hand.',
      'Keep alternating at a pace slow enough that your hips never rock.',
    ],
    breathing: 'Breathe out as you tap each shoulder, and breathe in as your hand returns to the floor.',
    cues: ['Hips stay square to the floor', 'Tap lightly, no rocking', 'Squeeze your glutes', 'Wide feet, steady hips', 'Slow and controlled'],
    mistakes: [
      { text: 'Your hips rock from side to side.', fix: 'Widen your feet, squeeze your glutes, and slow the taps down.' },
      { text: 'Your hips sag or rise as you tap.', fix: 'Keep one straight line from your head to your heels.' },
    ],
    easier: 'Hold a plain high plank with your feet wide, or place your knees on the floor.',
    harder: 'Pause for two seconds with each tap, or move on to the hollow body hold.',
    safety: 'If your wrists hurt, rest and try the forearm plank instead.',
  },

  'bear-plank': {
    summary: 'The bear plank hold trains your core, shoulders, and thighs to stay braced while your knees hover just above the floor.',
    setup: [
      'Get on your hands and knees with your hands under your shoulders and your knees under your hips.',
      'Tuck your toes under and keep your back flat like a table.',
    ],
    steps: [
      'Press your hands into the floor and lift your knees about one inch off the floor.',
      'Keep your knees under your hips, your back flat, and your hips low.',
      'Hold it steady for the whole time, and keep breathing.',
    ],
    breathing: 'Breathe slowly and steadily through your nose while you keep your belly braced.',
    cues: ['Knees hover, back flat', 'Push the floor away', 'Ribs down, belly tight', 'Hips stay low', 'Keep breathing'],
    mistakes: [
      { text: 'Your hips rise up toward the ceiling.', fix: 'Lower your hips until your back is as flat as a table.' },
      { text: 'Your knees float too high.', fix: 'Keep them just an inch off the floor, right under your hips.' },
    ],
    easier: 'Rest your knees on the floor between shorter holds, or practice the bird dog.',
    harder: 'Move on to plank shoulder taps.',
    safety: 'If your wrists feel sore, rest and shorten the hold.',
  },

  'crunch': {
    summary: 'The crunch trains the front of your core by curling your head and shoulders up off the floor.',
    setup: [
      'Lie on your back with your knees bent and your feet flat on the floor, about hip width apart.',
      'Cross your arms over your chest.',
    ],
    steps: [
      'Tuck your chin slightly, breathe out, and curl your ribs toward your hips, lifting your head and shoulder blades off the floor.',
      'Pause for a moment at the top and squeeze your belly.',
      'Lower back down slowly, keeping your belly tight.',
    ],
    breathing: 'Breathe out as you curl up, and breathe in as you lower back down.',
    cues: ['Ribs toward hips', 'Lift with your belly', 'Squeeze at the top', 'Look at the ceiling', 'Lower slowly'],
    mistakes: [
      { text: 'You pull on your neck.', fix: 'Cross your arms over your chest and lift with your belly, not your neck.' },
      { text: 'You swing up with momentum.', fix: 'Take two seconds to curl up and two seconds to lower.' },
      { text: 'You sit all the way up.', fix: 'Lift only until your shoulder blades leave the floor.' },
    ],
    easier: 'Reach your hands toward your knees and lift just a few inches.',
    harder: 'Move on to the reverse crunch.',
    safety: 'Keep your neck relaxed, and stop if it feels strained.',
  },

  'reverse-crunch': {
    summary: 'The reverse crunch trains your lower belly by curling your hips up off the floor instead of lifting your shoulders.',
    setup: [
      'Lie on your back with your arms flat by your sides and your palms pressing down.',
      'Lift your knees over your hips, bent at a right angle.',
    ],
    steps: [
      'Breathe out, tighten your belly, and curl your knees toward your chest so your tailbone lifts an inch or two.',
      'Pause for a moment, then lower your hips back to the floor slowly.',
      'Keep it smooth, and let your belly do the work instead of momentum.',
    ],
    breathing: 'Breathe out as you curl your hips up, and breathe in as you lower back down.',
    cues: ['Curl your hips, not your legs', 'Lift just an inch or two', 'Squeeze your lower belly', 'Lower with control', 'No swinging'],
    mistakes: [
      { text: 'You swing your legs to build momentum.', fix: 'Slow down and move only your hips, keeping your knees bent.' },
      { text: 'You roll far up onto your shoulders.', fix: 'Curl up only until your tailbone lifts an inch or two.' },
    ],
    easier: 'Go back to the crunch, or curl up just an inch.',
    harder: 'Move on to the bicycle crunch.',
    safety: 'Stop if you feel any pinching in your lower back, and skip the swing.',
  },

  'bicycle-crunch': {
    summary: 'The bicycle crunch trains your belly and the sides of your waist by pairing a twist with a pedaling leg motion.',
    setup: [
      'Lie on your back with your fingertips lightly behind your head and your elbows wide.',
      'Lift your head and shoulders off the floor and bring your knees up.',
    ],
    steps: [
      'Bend your right knee toward your chest and straighten your left leg, then twist to bring your left elbow toward your right knee.',
      'Switch in a smooth pedaling motion, bringing your right elbow toward your left knee.',
      'Keep your shoulders off the floor and move slowly.',
    ],
    breathing: 'Breathe out steadily as you twist, and breathe in as you switch sides.',
    cues: ['Elbow to opposite knee', 'Shoulders stay off the floor', 'Slow, smooth pedaling', 'Twist from your ribs', 'Lower back stays down'],
    mistakes: [
      { text: 'You pull on your head with your hands.', fix: 'Keep your touch light and your elbows wide, and lift with your belly.' },
      { text: 'You race through the pedaling.', fix: 'Slow down and twist from your ribs, not just your elbows.' },
      { text: 'Your lower back arches as your leg extends.', fix: 'Raise the extended leg higher until your lower back stays down.' },
    ],
    easier: 'Go back to the reverse crunch, or keep your extended leg higher.',
    harder: 'Move on to the lying leg raise.',
    safety: 'Stop if your neck or lower back feels strained.',
  },

  'russian-twist': {
    summary: 'The Russian twist trains the muscles along the sides of your waist by rotating your torso from side to side.',
    setup: [
      'Sit on the floor with your knees bent, then lean back until you feel your belly working.',
      'Lift your heels just off the floor and clasp your hands in front of your chest.',
    ],
    steps: [
      'Keep your chest tall and your back long, then turn your ribs to the right, bringing your hands beside your hip.',
      'Turn smoothly through the middle to the left, and keep alternating.',
      'Move slowly, and turn your whole upper body, not just your arms.',
    ],
    breathing: 'Breathe out as you twist, and breathe in as you pass through the middle.',
    cues: ['Chest tall, back long', 'Turn your ribs, not just arms', 'Look at your hands', 'Slow and controlled', 'Squeeze your belly'],
    mistakes: [
      { text: 'You round your back as you lean.', fix: 'Lift your chest, lean back less, and keep your back long.' },
      { text: 'You only swing your arms side to side.', fix: 'Turn your ribs and shoulders so your whole upper body rotates.' },
    ],
    easier: 'Keep your heels on the floor and lean back less.',
    harder: 'Move on to the dumbbell Russian twist.',
    safety: 'Keep your back long, never rounded, and stop if your lower back feels sore.',
  },

  'db-russian-twist': {
    summary: 'The dumbbell Russian twist adds weight to the rotation, so the muscles along the sides of your waist work harder.',
    setup: [
      'Sit on the floor with your knees bent, holding one dumbbell in both hands in front of your chest.',
      'Lean back until you feel your belly working, and lift your heels just off the floor.',
    ],
    steps: [
      'Keep your chest tall and your back long, then turn your ribs to the right, bringing the dumbbell beside your hip.',
      'Turn smoothly through the middle to the left, and keep alternating.',
      'Keep the dumbbell close to your body and let your ribs move it, not just your arms.',
    ],
    breathing: 'Breathe out as you twist, and breathe in as you pass through the middle.',
    cues: ['Chest tall, back long', 'Turn your ribs, not just arms', 'Dumbbell stays close', 'Eyes on the dumbbell', 'Slow and controlled'],
    mistakes: [
      { text: 'You round your back and slump.', fix: 'Sit taller, lean back less, and keep your chest lifted.' },
      { text: 'You swing the weight with your arms.', fix: 'Hold the dumbbell close and turn your ribs to move it.' },
    ],
    easier: 'Go back to the Russian twist without a dumbbell, or keep your heels on the floor.',
    harder: 'Lift your heels higher off the floor, or slow each twist to two seconds.',
    safety: 'Choose a weight you can control, and stop if your lower back feels sore.',
  },

  'leg-raise': {
    summary: 'The lying leg raise trains your lower belly and hip muscles by lifting and lowering your straight legs with control.',
    setup: [
      'Lie on your back with your legs straight and your arms flat by your sides, palms down.',
      'Press your lower back gently into the floor.',
    ],
    steps: [
      'Keep your legs together and lift them toward the ceiling until your feet are over your hips.',
      'Lower them slowly, stopping a few inches above the floor before your lower back lifts.',
      'Keep your lower back pressed down the whole time.',
    ],
    breathing: 'Breathe out as you lift your legs, and breathe in as you lower them.',
    cues: ['Lower back stays down', 'Lift with your lower belly', 'Lower for three seconds', 'Stop before your back arches', 'Slow and controlled'],
    mistakes: [
      { text: 'Your lower back arches as your legs lower.', fix: 'Stop lowering sooner, or bend your knees a little.' },
      { text: 'You swing your legs up with momentum.', fix: 'Pause at the bottom, then lift smoothly.' },
    ],
    easier: 'Bend your knees as you lift, or go back to the bicycle crunch.',
    harder: 'Move on to the V-up.',
    safety: 'Skip this one if your lower back is sore, and stop if you feel any pinching there.',
  },

  'hollow-hold-tuck': {
    summary: 'The tuck hollow hold teaches your core to press your lower back down while your knees stay pulled in.',
    setup: [
      'Lie on your back, hug your knees toward your chest, and press your lower back into the floor.',
      'Reach your arms toward your knees.',
    ],
    steps: [
      'Lift your head and shoulder blades off the floor while your lower back stays pressed down.',
      'Keep your chin slightly tucked and your arms reaching toward your knees.',
      'Hold this curled shape for the whole time, and keep breathing.',
    ],
    breathing: 'Take small, steady breaths while you keep your lower back pressed down.',
    cues: ['Lower back glued to the floor', 'Ribs down, chin tucked', 'Reach long, knees in', 'Squeeze your whole belly', 'Small, steady breaths'],
    mistakes: [
      { text: 'Your lower back arches off the floor.', fix: 'Pull your knees closer to your chest until your back stays flat.' },
      { text: 'Your chin pokes toward the ceiling.', fix: 'Tuck your chin gently and look toward your knees.' },
    ],
    easier: 'Keep your head down on the floor and hold for shorter bursts of about ten seconds.',
    harder: 'Straighten your arms and legs into the full hollow body hold.',
    safety: 'Stop if your lower back lifts off the floor or feels pinched.',
  },

  'hollow-hold': {
    summary: 'The hollow body hold trains your entire front core by pressing your lower back down while your arms and legs stay long.',
    setup: [
      'Lie on your back with your legs straight and your arms stretched overhead beside your ears.',
      'Press your lower back firmly into the floor and point your toes.',
    ],
    steps: [
      'Lift your head, shoulders, arms, and legs a few inches off the floor, keeping your lower back pressed down.',
      'Shape your body like a shallow banana, with your ribs pulled down and your chin slightly tucked.',
      'Hold this shape for the whole time, and keep breathing.',
    ],
    breathing: 'Take small, steady breaths while you keep your belly braced and your lower back down.',
    cues: ['Lower back glued to the floor', 'Ribs down, chin tucked', 'Reach long through your fingers', 'Squeeze your legs together', 'Small, steady breaths'],
    mistakes: [
      { text: 'Your lower back arches off the floor.', fix: 'Raise your legs higher, or bend your knees, until your back stays flat.' },
      { text: 'Your chin pokes toward the ceiling.', fix: 'Tuck your chin gently and look toward your toes.' },
    ],
    easier: 'Bend your knees and go back to the tuck hollow hold.',
    harder: 'Lower your arms and legs closer to the floor, as long as your lower back stays down.',
    safety: 'Skip this one if your lower back is sore, and stop if you feel any pinching there.',
  },

  'v-up': {
    summary: 'The V-up trains your whole front core by lifting your arms and legs together so they meet over your hips.',
    setup: [
      'Lie on your back with your legs straight and your arms stretched overhead.',
      'Press your lower back into the floor and squeeze your legs together.',
    ],
    steps: [
      'Lift your legs and chest at the same time, reaching your hands toward your toes to make a V shape.',
      'Pause for a moment at the top with your belly squeezed.',
      'Lower back down slowly, keeping your legs straight and your belly tight.',
    ],
    breathing: 'Breathe out as you lift into the V, and breathe in as you lower back down.',
    cues: ['Hands and feet meet', 'Lift both ends together', 'Squeeze your belly hard', 'Lower slowly, no flopping', 'Keep your legs straight'],
    mistakes: [
      { text: 'You throw your arms to jerk yourself up.', fix: 'Squeeze your belly first, then lift slowly with control.' },
      { text: 'You drop back down quickly.', fix: 'Take three full seconds to lower, keeping your belly squeezed.' },
    ],
    easier: 'Bend your knees as you lift, or go back to the lying leg raise.',
    harder: 'Hold the top for two seconds, or slow each lowering to three seconds.',
    safety: 'Skip this one if your lower back is sore, and stop if you feel any pinching there.',
  },

  'superman': {
    summary: 'The Superman trains your lower back, glutes, and upper back by lifting your arms, chest, and legs off the floor.',
    setup: [
      'Lie face down with your legs straight and your arms stretched out in front of you.',
      'Keep your neck long, with your eyes on the floor.',
    ],
    steps: [
      'Squeeze your glutes and lift your arms, chest, and legs a few inches off the floor at the same time.',
      'Pause for one second at the top, reaching long through your fingers and toes.',
      'Lower back down slowly and reset before the next lift.',
    ],
    breathing: 'Breathe out as you lift, and breathe in as you lower back down.',
    cues: ['Squeeze your glutes', 'Eyes on the floor', 'Lift just a few inches', 'Reach long through fingers and toes', 'Lower slowly'],
    mistakes: [
      { text: 'You crank your neck up to look forward.', fix: 'Keep your eyes on the floor so your neck stays in line with your spine.' },
      { text: 'You lift as high as you can and strain your lower back.', fix: 'Lift only a few inches and squeeze your glutes.' },
      { text: 'You bounce up and down.', fix: 'Slow down and pause for one second at the top.' },
    ],
    easier: 'Keep your legs down and lift only your arms and chest, or lift only your legs.',
    harder: 'Pause for three seconds at the top and take three seconds to lower.',
    safety: 'Lift only a few inches, and stop if you feel any pinching in your lower back.',
  },
}
