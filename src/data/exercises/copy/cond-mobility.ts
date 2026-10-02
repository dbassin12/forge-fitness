import type { ExerciseCopy } from '../types'

/**
 * Coaching copy for the conditioning and mobility exercises, keyed by exercise id.
 *
 * This text is read aloud by text-to-speech and shown as captions, so it sticks to plain spoken
 * English: no digits, symbols, abbreviations, parentheses or slashes. High-impact moves point to a
 * quiet low-impact neighbor in `easier`, and the progression ladders are named explicitly:
 * march, step jacks, jumping jacks, high knees; and squat thrust, step back burpee, burpee.
 */
export const COPY_COND_MOBILITY: Record<string, ExerciseCopy> = {
  // ---- Conditioning -------------------------------------------------------------------------
  'march-in-place': {
    summary: 'A quiet, low impact warm up that raises your heart rate and wakes up your hips and legs without any jumping.',
    setup: ['Stand tall with your feet hip width apart, your shoulders relaxed, and your elbows bent at your sides.'],
    steps: [
      'Lift one knee toward hip height, then lower that foot and lift the other, as if you are walking in place.',
      'Swing the opposite arm forward with each knee and keep a brisk, steady beat.',
    ],
    breathing: 'Breathe in and out in a steady rhythm and let your pace set your breath.',
    cues: ['Stand tall, shoulders relaxed', 'Lift your knees, land softly', 'Swing your arms with your steps', 'Keep a steady beat'],
    mistakes: [
      { text: 'You lean back or slouch forward as your knees lift.', fix: 'Stack your shoulders over your hips and keep your chest proud.' },
      { text: 'You stomp each foot down hard.', fix: 'Lower each foot quietly, as if you do not want to wake the neighbors.' },
    ],
    easier: 'Slow your pace, lift your knees only a little, and rest a hand on a counter or the back of a chair for balance.',
    harder: 'Lift your knees higher and pump your arms faster, or move up to step jacks.',
  },

  'step-jacks': {
    summary: 'A quiet cousin of the jumping jack that warms up your shoulders, hips, and calves as you step out and sweep your arms overhead.',
    setup: ['Stand tall with your feet together and your arms down at your sides.'],
    steps: [
      'Step one foot out wide to the side as you sweep both arms up and overhead in a big arc.',
      'Step that foot back in as your arms float down to your sides.',
      'Repeat on the other side and keep alternating at a steady, bouncy pace.',
    ],
    breathing: 'Breathe out as your arms rise and breathe in as they lower, keeping a steady rhythm.',
    cues: ['Step wide, reach high', 'Arms all the way overhead', 'Stay light on your toes', 'Chest tall, shoulders down'],
    mistakes: [
      { text: 'Your arms stop at shoulder height.', fix: 'Reach all the way overhead, then lower your arms with control.' },
      { text: 'Your steps get small and rushed.', fix: 'Take a full, wide step each time and keep your pace steady.' },
    ],
    easier: 'Go back to marching in place, or keep your arms at shoulder height instead of reaching overhead.',
    harder: 'Speed up, then move on to jumping jacks by hopping both feet out and in at the same time.',
  },

  'jumping-jacks': {
    summary: 'The classic full body warm up that raises your heart rate and loosens your shoulders, hips, and calves as you jump your feet wide and sweep your arms overhead.',
    setup: ['Stand tall with your feet together, your arms at your sides, and your knees slightly soft.'],
    steps: [
      'Hop your feet out wider than your shoulders as you swing your arms up and overhead.',
      'Hop your feet back together as you bring your arms down to your sides.',
      'Stay light on the balls of your feet and keep a smooth, steady rhythm.',
    ],
    breathing: 'Breathe out as your feet jump apart and breathe in as they come back together.',
    cues: ['Land softly on your toes', 'Arms fully overhead', 'Quiet feet, light jumps', 'Stay tall, shoulders down'],
    mistakes: [
      { text: 'You land flat and heavy, which is loud and hard on your joints.', fix: 'Land softly on the balls of your feet with your knees slightly bent.' },
      { text: 'Your arms only reach shoulder height.', fix: 'Sweep your arms all the way overhead on every jump.' },
    ],
    easier: 'Switch to step jacks, the quiet low impact version, stepping one foot out at a time with no hopping.',
    harder: 'Speed up, or move on to high knees for an even bigger heart rate boost.',
    safety: 'Skip the hopping and do step jacks if your knees or ankles feel sore.',
  },

  'high-knees': {
    summary: 'A fast, springy run in place that spikes your heart rate and works your hip flexors, thighs, and calves.',
    setup: ['Stand tall with your feet hip width apart and your elbows bent, ready to run.'],
    steps: [
      'Run in place, driving each knee up toward hip height while the opposite arm swings forward.',
      'Stay on the balls of your feet and land softly, with your chest tall and your belly braced.',
      'Keep a quick, even rhythm and pump your arms to match.',
    ],
    breathing: 'Keep your breathing quick and steady, and never hold your breath.',
    cues: ['Knees to hip height', 'Tall chest, pump your arms', 'Light, quiet landings', 'Quick feet, steady beat'],
    mistakes: [
      { text: 'You lean back as your knees come up.', fix: 'Keep your chest over your hips and brace your belly.' },
      { text: 'You land flat footed and the floor shakes.', fix: 'Stay on the balls of your feet and land softly.' },
    ],
    easier: 'Switch to marching in place, the quiet low impact version, lifting your knees as high as feels comfortable.',
    harder: 'Drive your knees higher, speed up your feet, and pump your arms hard for the whole round.',
    safety: 'Skip the hopping and march instead if your knees, ankles, or hips feel sore.',
  },

  'butt-kicks': {
    summary: 'A light jog in place with your heels flicking up toward your glutes, which warms up your hamstrings and calves and gets your heart pumping.',
    setup: ['Stand tall with your feet hip width apart and your elbows bent, as if you are about to jog.'],
    steps: [
      'Jog in place and, with each step, kick your heel up behind you toward your glute.',
      'Keep your thighs pointing mostly straight down and let your lower legs do the work.',
      'Swing your arms in rhythm and stay light on the balls of your feet.',
    ],
    breathing: 'Keep your breathing relaxed and steady, and let your shoulders stay loose.',
    cues: ['Heels to glutes', 'Thighs stay pointing down', 'Tall chest, relaxed shoulders', 'Quick, light feet'],
    mistakes: [
      { text: 'Your knees drift forward and your chest leans.', fix: 'Keep your thighs pointing down and flick only your lower legs.' },
      { text: 'You slam your feet into the floor.', fix: 'Spring off the balls of your feet and land softly.' },
    ],
    easier: 'March in place and curl one heel up behind you at a time with no hopping, for a quiet low impact version.',
    harder: 'Speed up your feet while keeping your thighs still, and pump your arms to match.',
    safety: 'Skip the hopping if your knees or ankles feel sore.',
  },

  'fast-feet': {
    summary: 'Quick, tiny steps in place, like running on hot sand, that fire up your calves and thighs and raise your heart rate without big jumps.',
    setup: ['Stand with your feet hip width apart, your knees soft, and your weight on the balls of your feet.'],
    steps: [
      'Take quick, tiny steps in place, keeping your feet just above the floor.',
      'Stay on the balls of your feet and keep your knees soft and your chest tall.',
      'Bend your elbows and swing your arms in rhythm with your feet.',
    ],
    breathing: 'Take quick, even breaths and keep your shoulders relaxed.',
    cues: ['Tiny, quick steps', 'Stay on your toes', 'Knees soft, chest tall', 'Light and fast'],
    mistakes: [
      { text: 'You take big, slow steps.', fix: 'Make your steps tiny and fast, with your feet barely leaving the floor.' },
      { text: 'You stand flat footed and stiff.', fix: 'Rise onto the balls of your feet and keep your knees soft.' },
    ],
    easier: 'Slow down to a brisk march in place until you feel ready for more speed.',
    harder: 'Pick up the pace as fast as you can while staying light, or lift your knees a little higher.',
  },

  'mountain-climbers': {
    summary: 'A running plank that drives your knees toward your chest to raise your heart rate and challenge your core, shoulders, and hips.',
    setup: ['Start in a high plank with your hands under your shoulders and your body in one long line from head to heels.'],
    steps: [
      'Brace your belly, then drive one knee toward your chest.',
      'Switch legs quickly, as if you are running in place with your hands on the floor.',
      'Keep your hips level with your shoulders and your hands planted the whole time.',
    ],
    breathing: 'Take quick, steady breaths and never hold your breath.',
    cues: ['Shoulders over wrists', 'Drive knees to chest', 'Hips level, belly tight', 'Quick, quiet feet'],
    mistakes: [
      { text: 'Your hips rise up toward the ceiling.', fix: 'Lower your hips in line with your shoulders and squeeze your belly.' },
      { text: 'Your hips sag and your lower back arches.', fix: 'Tuck your tailbone slightly and brace your core.' },
    ],
    easier: 'Slow down to one step at a time, or put your hands on a sturdy table or counter to make it easier on your arms.',
    harder: 'Speed up, or drive each knee toward the opposite elbow to work your sides.',
    safety: 'If your wrists feel sore, shorten the round or pick a standing move instead.',
  },

  skaters: {
    summary: 'A side to side bound, like a speed skater gliding across the ice, that builds strong hips and thighs and raises your heart rate.',
    setup: ['Stand with your feet hip width apart and your knees soft, ready to bound to the side.'],
    steps: [
      'Bound to one side and land on that foot with a soft bend in your knee, as your other foot sweeps behind you.',
      'Swing your arms across your body for balance and lean slightly forward from your hips.',
      'Push off right away and bound to the other side, then keep alternating.',
    ],
    breathing: 'Breathe out each time you push off and breathe in as you land.',
    cues: ['Push off, land softly', 'Knee stays over your toes', 'Sweep the back foot behind', 'Swing your arms across'],
    mistakes: [
      { text: 'Your landing knee caves in or wobbles.', fix: 'Land with your knee over your toes and sink your hips back a little.' },
      { text: 'You bound farther than you can control.', fix: 'Take a shorter bound and pause for a moment on each landing.' },
    ],
    easier: 'Switch to quiet side steps, stepping wide to one side, tapping your other foot behind you, and then stepping to the other side with no jumping.',
    harder: 'Bound farther and hold each landing for a beat to challenge your balance and thighs.',
    safety: 'Clear a wide, grippy space, and skip the jumps if your knees or ankles feel unstable.',
  },

  'shadow-boxing': {
    summary: 'Light punches at an imaginary opponent that raise your heart rate, loosen your shoulders, and work your arms and waist, all quietly.',
    setup: ['Stand with your feet a little wider than your hips, one foot slightly ahead of the other, knees soft, and your fists up by your chin.'],
    steps: [
      'Throw a straight punch with your front hand, turning your fist and your hips a little as your arm extends.',
      'Snap that hand back to your chin and throw the other hand, then keep alternating.',
      'Bounce gently on your toes and keep your guard up between punches.',
    ],
    breathing: 'Breathe out sharply on each punch and breathe in as your fist returns.',
    cues: ['Fists up, chin down', 'Punch and snap back', 'Turn your hips with each punch', 'Stay light on your feet'],
    mistakes: [
      { text: 'You lock your elbow hard at the end of each punch.', fix: 'Stop just short of straight and snap your fist back quickly.' },
      { text: 'You let your guard hand drop.', fix: 'Keep your other fist up by your chin between every punch.' },
    ],
    easier: 'Slow the punches down, keep your feet planted, and throw smaller, easier punches until the rhythm feels natural.',
    harder: 'Speed up and string together combinations of two or three punches, adding a quick duck or side step.',
    safety: 'Check for lamps, shelves, and low ceiling fans before you start swinging.',
  },

  'squat-thrust': {
    summary: 'A burpee without the final jump, where you drop your hands to the floor, kick your feet back to a plank, and hop them in to work your legs, core, and shoulders.',
    setup: ['Stand tall with your feet hip width apart and some clear space behind you.'],
    steps: [
      'Squat down and place both hands flat on the floor just outside your feet.',
      'Kick both feet back to a high plank in one move, with your body in a straight line.',
      'Hop both feet in next to your hands, then stand up tall to finish.',
    ],
    breathing: 'Breathe out as you kick your feet back and breathe in as you hop them forward and stand.',
    cues: ['Hands down, kick back', 'Strong plank, belly tight', 'Hop in, stand tall', 'Land softly, stay smooth'],
    mistakes: [
      { text: 'Your hips sag when your feet land in the plank.', fix: 'Brace your belly and land with your body in one straight line.' },
      { text: 'You crash your feet down loudly.', fix: 'Land on the balls of your feet and take smaller, softer hops.' },
    ],
    easier: 'Step one foot back at a time instead of kicking both, which makes it a step back burpee, the quiet low impact version.',
    harder: 'Add a small jump at the top to turn it into a full burpee.',
    safety: 'If your wrists hurt in the plank, choose a standing move instead.',
  },

  'step-back-burpee': {
    summary: 'A quiet, low impact burpee where you step back to a plank and step in again, working your legs, core, and shoulders with no jumping.',
    setup: ['Stand tall with your feet hip width apart and some clear space behind you.'],
    steps: [
      'Bend your knees, hinge forward, and place both hands flat on the floor in front of you.',
      'Step one foot back, then the other, into a high plank with your body in a straight line.',
      'Step one foot in, then the other, between your hands, and stand up tall.',
    ],
    breathing: 'Breathe out as you step back to the plank and breathe in as you step forward and stand.',
    cues: ['Hands down, step back', 'Strong plank, belly tight', 'Step in, stand tall', 'Move smooth and quiet'],
    mistakes: [
      { text: 'Your hips sag or rise too high in the plank.', fix: 'Squeeze your belly and glutes so your body makes one straight line.' },
      { text: 'You rush and round your back as you stand.', fix: 'Slow down, press through your feet, and lift your chest as you rise.' },
    ],
    easier: 'Make it smaller by squatting to touch the floor and standing back up, or by placing your hands on a sturdy counter instead of the floor.',
    harder: 'Jump both feet back together as one move, which makes it a squat thrust, or speed up your steps.',
    safety: 'If your wrists hurt in the plank, choose a standing move instead.',
  },

  burpee: {
    summary: 'The full body classic, where you drop to a plank, hop your feet in, and leap up tall, working your legs, chest, shoulders, and core all at once.',
    setup: ['Stand tall with your feet hip width apart and clear some space around you.'],
    steps: [
      'Squat down, place your hands on the floor, and kick both feet back to a high plank.',
      'Hop your feet in next to your hands, landing softly.',
      'Jump up with your arms reaching overhead, then land softly with your knees bent.',
    ],
    breathing: 'Breathe out as you kick back and as you jump up, and breathe in as you hop your feet in.',
    cues: ['Hands down, kick back', 'Strong plank, belly tight', 'Land softly, bend your knees', 'Jump tall, arms overhead'],
    mistakes: [
      { text: 'Your hips sag in the plank and your lower back arches.', fix: 'Squeeze your belly and glutes so your body stays in one line.' },
      { text: 'You land the jump on stiff, straight legs.', fix: 'Bend your knees as you land and keep the jump small and quiet.' },
    ],
    easier: 'Switch to step back burpees, the quiet low impact version, stepping each foot back and in with no jumping.',
    harder: 'Add a push up when you reach the plank and jump a little higher at the top.',
    safety: 'Skip the jumps and do step back burpees if your knees, wrists, or ankles feel sore.',
  },

  'db-thruster': {
    summary: 'A squat that flows into an overhead press with two dumbbells, working your thighs, glutes, and shoulders together and keeping your heart rate high.',
    setup: ['Stand with your feet shoulder width apart and a dumbbell in each hand at shoulder height, palms facing each other.'],
    steps: [
      'Sit your hips back and down into a squat, keeping your chest tall and the weights at your shoulders.',
      'Drive through your whole foot to stand, and use that momentum to press the dumbbells straight overhead.',
      'Lower the weights to your shoulders with control as you sink into your next squat.',
    ],
    breathing: 'Breathe in as you squat down and breathe out forcefully as you stand and press.',
    cues: ['Chest tall, weights at shoulders', 'Sit back, knees over toes', 'Drive up and press', 'Ribs down, no arching'],
    mistakes: [
      { text: 'You arch your lower back as you press overhead.', fix: 'Squeeze your glutes and keep your ribs down as the weights go up.' },
      { text: 'Your heels lift or your knees cave inward in the squat.', fix: 'Keep your whole foot planted and push your knees out over your toes.' },
    ],
    easier: 'Do the squat and the press as two separate moves with a pause between them, or practice with no weights first.',
    harder: 'Squat a little deeper, then slow the lowering of the weights to a count of three.',
    safety: 'Check for low ceiling lights before you press, and skip the weights if your shoulders or knees feel unsteady.',
  },

  // ---- Mobility / warm-up / cool-down -------------------------------------------------------
  'arm-circles': {
    summary: 'A simple shoulder warm up where smooth arm circles loosen your shoulders and upper back before you train.',
    setup: ['Stand tall with your feet hip width apart and lift your arms straight out to your sides at shoulder height, palms down.'],
    steps: [
      'Draw small, smooth circles with your hands, moving from your shoulders and keeping your arms long.',
      'Let the circles grow bigger, then switch directions and gradually make them smaller again.',
    ],
    breathing: 'Breathe slowly and steadily, and let your shoulders stay loose as you circle.',
    cues: ['Shoulders low and relaxed', 'Reach long through your fingertips', 'Smooth, controlled circles', 'Stand tall, ribs down'],
    mistakes: [
      { text: 'Your shoulders shrug up toward your ears.', fix: 'Drop your shoulders down and keep your neck long.' },
      { text: 'You whip your arms around quickly.', fix: 'Slow down and make smooth, controlled circles.' },
    ],
    easier: 'Keep the circles small and slow, or rest your fingertips on your shoulders and circle your elbows instead.',
    harder: 'Make the circles bigger and a little faster while keeping your shoulders relaxed, or add extra time in each direction.',
    safety: 'Keep the movement pain free, and make the circles smaller if your shoulders pinch.',
  },

  'hip-circles': {
    summary: 'A gentle standing warm up where big hip circles loosen your hips and lower back before squats and lunges.',
    setup: ['Stand with your feet a little wider than your hips, your knees soft, and your hands resting on your hips.'],
    steps: [
      'Slowly push your hips to one side, then forward, to the other side, and back, drawing a big smooth circle.',
      'Keep your head and shoulders quiet so the movement comes from your hips.',
      'Halfway through, switch directions.',
    ],
    breathing: 'Breathe slowly and evenly, taking about one full breath for each circle.',
    cues: ['Big, slow hip circles', 'Soft knees, quiet shoulders', 'Feet stay flat on the floor', 'Keep your head still'],
    mistakes: [
      { text: 'You move your shoulders and head instead of your hips.', fix: 'Keep your chest quiet and imagine drawing a circle with your belt buckle.' },
      { text: 'You rush through small, jerky circles.', fix: 'Slow down and make each circle big and smooth.' },
    ],
    easier: 'Make the circles smaller and slower, or hold the back of a chair for balance.',
    harder: 'Draw bigger circles with a slightly deeper knee bend, keeping the pace slow and smooth.',
    safety: 'Stay in a comfortable range and ease off if you feel any pinching in your hips or back.',
  },

  'leg-swings': {
    summary: 'A dynamic warm up for your hips and hamstrings, where you hold a wall for balance and swing one leg forward and back like a pendulum.',
    setup: ['Stand sideways next to a wall and rest one hand on it for balance, with your chest tall and your standing knee soft.'],
    steps: [
      'Swing your outside leg forward and back, like a slow pendulum.',
      'Start with small swings and let them grow a little bigger each time, only as far as feels comfortable.',
      'Keep your chest tall and your hips facing forward, then turn around and swing the other leg.',
    ],
    breathing: 'Breathe slowly and evenly, and keep your body relaxed as the leg swings.',
    cues: ['Swing loose, like a pendulum', 'Chest tall, hips square', 'Soft standing knee', 'Smooth, controlled swings'],
    mistakes: [
      { text: 'You kick hard and your torso rocks back and forth.', fix: 'Keep your torso still and let your leg swing in a smooth, easy arc.' },
      { text: 'You swing farther than you can control.', fix: 'Start small and build slowly, keeping every swing smooth.' },
    ],
    easier: 'Keep the swings small and slow, and stay close to the wall for support.',
    harder: 'Let the swings grow a bit bigger while keeping your torso still, or add a few extra seconds.',
    safety: 'Stay within a comfortable range and never force or bounce the leg higher.',
  },

  'cat-cow': {
    summary: 'A gentle spinal wave on hands and knees that alternates rounding and arching your back to loosen your spine and wake up your core.',
    setup: ['Get on your hands and knees with your wrists under your shoulders and your knees under your hips.'],
    steps: [
      'Drop your belly toward the floor and lift your chest and tailbone to arch your back like a cow.',
      'Press the floor away and round your back toward the ceiling like a cat, tucking your chin.',
      'Keep flowing slowly between the two shapes, moving through your whole spine.',
    ],
    breathing: 'Breathe in as you arch like a cow and breathe out as you round like a cat.',
    cues: ['One slow breath per movement', 'Move your whole spine', 'Press the floor away', 'Wrists under shoulders'],
    mistakes: [
      { text: 'You rush and only move your lower back.', fix: 'Slow down and let the movement travel through your whole spine.' },
      { text: 'Your elbows collapse and your shoulders sink.', fix: 'Press the floor away and spread your fingers wide.' },
    ],
    easier: 'Make the movement smaller and slower, and pad your knees with a folded towel for comfort.',
    harder: 'Slow the flow down to one full breath for each shape, pausing briefly at each end.',
    safety: 'Move only within a pain free range, and stop if your wrists or back complain.',
  },

  inchworm: {
    summary: 'A walking warm up that folds you forward, walks your hands out to a plank, and walks back to stretch your hamstrings and wake up your shoulders and core.',
    setup: ['Stand tall with your feet hip width apart and your arms relaxed at your sides.'],
    steps: [
      'Hinge at your hips and fold forward, bending your knees as much as you need to place your hands on the floor.',
      'Walk your hands forward, one at a time, until you reach a high plank with your body in a straight line.',
      'Pause for a breath, then walk your hands back to your feet and slowly stand up tall.',
    ],
    breathing: 'Breathe out as you walk your hands forward and breathe in as you walk them back.',
    cues: ['Soft knees, hands to floor', 'Walk out with small steps', 'Brace your belly in the plank', 'Walk back, stand tall'],
    mistakes: [
      { text: 'Your hips sag when you reach the plank.', fix: 'Squeeze your belly and glutes and walk out only as far as you can hold a straight line.' },
      { text: 'You round your back and force your legs straight.', fix: 'Bend your knees as much as you like and fold from your hips.' },
    ],
    easier: 'Walk out only halfway instead of to a full plank, and keep your knees bent the whole time.',
    harder: 'Add a slow push up in the plank before you walk back, or pause there for a full breath.',
    safety: 'If your wrists or lower back feel uncomfortable, shorten the walk out or choose another warm up.',
  },

  'worlds-greatest-stretch': {
    summary: 'A full body stretch in one flowing move, where a deep lunge, a hand to the floor, and a reach to the ceiling open your hips, hamstrings, and upper back.',
    setup: ['Stand tall with your feet together and some clear space in front of you.'],
    steps: [
      'Step one foot far forward into a deep lunge and place both hands on the floor inside that foot.',
      'Rotate your chest toward your front leg, reach the arm on that side up to the ceiling, and look up at your hand.',
      'Lower your hand, step back to standing, and repeat, then switch legs.',
    ],
    breathing: 'Breathe in as you reach up to the ceiling and breathe out as you lower your hand and return.',
    cues: ['Long step, hips low', 'Hand down, then reach up', 'Eyes follow your top hand', 'Keep your back leg strong'],
    mistakes: [
      { text: 'Your step is short, so your hands cannot reach the floor.', fix: 'Take a longer step, or rest your back knee on the floor.' },
      { text: 'You twist your arm without turning your chest.', fix: 'Rotate your whole chest toward the ceiling and follow your hand with your eyes.' },
    ],
    easier: 'Rest your back knee on the floor and take a smaller step so your hand reaches the floor comfortably.',
    harder: 'Hold the reach for two or three slow breaths, and keep your back knee lifted the whole time.',
    safety: 'Move slowly and stop short of any pinching in your hips, knees, or back.',
  },

  'hip-flexor-stretch': {
    summary: 'A gentle kneeling stretch that opens the front of your hips, which can get tight from sitting.',
    setup: ['Kneel on one knee with your other foot flat in front of you, and pad your knee with a folded towel.'],
    steps: [
      'Tuck your tailbone under and squeeze the glute of your back leg, with your hands on your front thigh.',
      'Gently shift your hips forward until you feel a stretch along the front of your back hip.',
      'Stay tall and breathe slowly, then switch legs when time is up.',
    ],
    breathing: 'Breathe slowly and deeply, and let your hips sink a little more with each long exhale.',
    cues: ['Tuck your tailbone', 'Squeeze your back glute', 'Tall chest, ribs down', 'Ease forward, never force'],
    mistakes: [
      { text: 'You arch your lower back instead of stretching your hip.', fix: 'Tuck your tailbone under and squeeze the glute on your back leg.' },
      { text: 'You lunge too far and your front knee shoots past your toes.', fix: 'Keep your front shin upright and shift your hips forward only a little.' },
    ],
    easier: 'Shift your hips forward only a little and hold for a shorter time until the stretch feels comfortable.',
    harder: 'Reach the arm on the same side as your back knee overhead and lean gently away from that knee to deepen the stretch.',
    safety: 'Cushion your knee and stop if you feel any pinching in your knee or lower back.',
  },

  'hamstring-stretch': {
    summary: 'A simple standing stretch for the backs of your thighs, folding forward from your hips with long legs.',
    setup: ['Stand tall with your feet hip width apart and your knees soft, not locked.'],
    steps: [
      'Hinge forward from your hips, keeping your back long and your knees slightly bent.',
      'Let your hands slide down your thighs toward your shins, stopping where you feel a gentle stretch behind your legs.',
      'Hold still, relax your neck, and let your head hang heavy.',
    ],
    breathing: 'Breathe slowly and deeply, and relax a little more with each long exhale.',
    cues: ['Hinge from your hips', 'Long spine, soft knees', 'Relax your head and neck', 'Gentle stretch, never pain'],
    mistakes: [
      { text: 'You round your back to reach lower.', fix: 'Keep your spine long and fold from your hips, even if your hands stop at your knees.' },
      { text: 'You lock your knees or bounce to go deeper.', fix: 'Keep a soft bend in your knees and stay still.' },
    ],
    easier: 'Bend your knees more and rest your hands on your thighs or a counter.',
    harder: 'Straighten your legs a little more, only as far as it stays comfortable, and let your hands slide toward your ankles.',
    safety: 'Never bounce, and rise slowly when you finish.',
  },

  'cobra-stretch': {
    summary: 'A gentle stretch for the front of your body, where you lie face down and press your chest up to open your belly, chest, and the front of your hips.',
    setup: ['Lie face down with your legs long and your hands flat on the floor under your shoulders.'],
    steps: [
      'Press gently through your hands and slowly lift your chest, keeping your hips and thighs on the floor.',
      'Stop where you feel a mild stretch, with your elbows bent and close to your sides.',
      'Hold the position and breathe slowly, then lower yourself down with control.',
    ],
    breathing: 'Breathe slowly and deeply into your belly, and keep your shoulders relaxed away from your ears.',
    cues: ['Press the floor away gently', 'Shoulders low, neck long', 'Hips stay on the floor', 'Lift only as high as comfortable'],
    mistakes: [
      { text: 'You push up with straight arms and pinch your lower back.', fix: 'Keep your elbows bent and lift only as high as feels comfortable.' },
      { text: 'You shrug your shoulders up toward your ears.', fix: 'Draw your shoulders down your back and keep your neck long.' },
    ],
    easier: 'Come down onto your forearms with your elbows under your shoulders for a smaller, gentler lift.',
    harder: 'Press up a little higher with straighter arms, keeping your hips on the floor and staying within a comfortable range.',
    safety: 'Skip this one if it pinches your lower back, and never push into pain.',
  },

  'childs-pose': {
    summary: 'A restful stretch for your back, hips, and shoulders, where you sink your hips back toward your heels and let your breathing slow.',
    setup: ['Kneel on a mat or towel with your knees hip width apart and your hips resting back toward your heels.'],
    steps: [
      'Walk your hands forward along the floor and lower your chest toward your thighs.',
      'Rest your forehead on the floor with your arms long in front of you.',
      'Let your whole body soften and breathe slowly into your back.',
    ],
    breathing: 'Breathe slowly and deeply, feeling your back rise as you inhale and soften as you exhale.',
    cues: ['Hips back toward your heels', 'Reach long through your arms', 'Let your forehead get heavy', 'Soften with every exhale'],
    mistakes: [
      { text: 'You hold your shoulders tense by your ears.', fix: 'Walk your hands out wider and let your shoulders melt toward the floor.' },
      { text: 'Your hips lift away from your heels.', fix: 'Sit back toward your heels, using a cushion between your hips and heels if needed.' },
    ],
    easier: 'Put a pillow between your hips and heels and another under your forehead so you can relax fully.',
    harder: 'Walk both hands to the right to stretch your left side for a few breaths, then walk them to the left.',
    safety: 'If your knees feel pinched, pad them with a folded towel or skip this stretch.',
  },

  'figure-four-stretch': {
    summary: 'A lying glute stretch where you cross one ankle over your opposite knee and draw your thigh toward you to open your glutes and outer hip.',
    setup: ['Lie on your back with your knees bent and your feet flat on the floor, hip width apart.'],
    steps: [
      'Cross one ankle over your opposite thigh, just above the knee, and flex that foot to protect your knee.',
      'Lift your other foot off the floor, hold behind that thigh with both hands, and gently draw it toward your chest.',
      'Keep your head and shoulders relaxed on the floor and hold, then switch legs when time is up.',
    ],
    breathing: 'Breathe slowly and deeply, and let your hip soften with each long exhale.',
    cues: ['Flex the crossed foot', 'Pull your thigh in gently', 'Head and shoulders relaxed', 'Let your hip soften'],
    mistakes: [
      { text: 'You pull hard and feel it in your knee.', fix: 'Keep the top foot flexed and ease off until you feel the stretch in your hip.' },
      { text: 'You curl up off the floor to reach your leg.', fix: 'Keep your head down and loop a towel around your thigh to bring it closer.' },
    ],
    easier: 'Leave your bottom foot on the floor and gently press the crossed knee away with your hand.',
    harder: 'Draw your thigh a little closer and press the crossed knee away with your elbow, staying within a comfortable range.',
    safety: 'Keep the crossed foot flexed and stop if you feel any twinge in your knee.',
  },

  'chest-opener': {
    summary: 'A standing stretch for the front of your chest and shoulders, where reaching your hands behind you opens up that desk posture.',
    setup: ['Stand tall with your feet hip width apart and your knees soft, and clasp your hands behind your back.'],
    steps: [
      'Straighten your arms and lower your clasped hands toward the floor behind you.',
      'Lift your chest toward the ceiling and gently squeeze your shoulder blades together.',
      'Keep your chin level and your ribs down, then hold still and breathe slowly.',
    ],
    breathing: 'Breathe slowly and deeply into your chest, and let your shoulders relax with each exhale.',
    cues: ['Lift your chest gently', 'Squeeze your shoulder blades together', 'Ribs down, chin level', 'Shoulders down, away from ears'],
    mistakes: [
      { text: 'You flare your ribs and arch your lower back.', fix: 'Tuck your ribs down and tighten your belly gently as you lift your chest.' },
      { text: 'You shrug your shoulders up as you reach back.', fix: 'Roll your shoulders down and back, and lift only your chest.' },
    ],
    easier: 'Hold a towel behind you with your hands wide apart, and keep your elbows slightly bent.',
    harder: 'Hinge forward from your hips while lifting your clasped hands up behind you, only as far as feels comfortable.',
    safety: 'Keep the stretch gentle, and ease off if your shoulders pinch.',
  },

  'calf-stretch': {
    summary: 'A classic wall stretch for the back of your lower legs, great after jumping or a long day on your feet.',
    setup: [
      'Stand facing a wall and place both hands on it at about chest height.',
      'Step one foot back about one big stride, with both feet pointing straight ahead.',
    ],
    steps: [
      'Press your back heel into the floor and keep that leg straight.',
      'Bend your front knee and lean your hips toward the wall until you feel a stretch in your back calf.',
      'Hold steady and breathe slowly, then switch legs when time is up.',
    ],
    breathing: 'Breathe slowly and deeply, and let your calf soften with each long exhale.',
    cues: ['Back heel stays down', 'Back leg stays straight', 'Toes point straight ahead', 'Lean in slowly, no bouncing'],
    mistakes: [
      { text: 'Your back heel lifts off the floor.', fix: 'Take a shorter step back so your heel stays planted, then lean in.' },
      { text: 'Your back foot turns out to the side.', fix: 'Point your toes straight at the wall for a better stretch.' },
    ],
    easier: 'Step your back foot in closer to the wall and lean less for a milder stretch.',
    harder: 'Step your back foot a little farther from the wall, or soften the back knee to feel the lower calf.',
    safety: 'Ease in slowly and keep the stretch mild, with no bouncing or sharp pulling.',
  },

  'down-dog-cobra': {
    summary: 'A flowing yoga stretch that moves between downward dog and cobra to stretch your hamstrings, shoulders, belly, and spine.',
    setup: ['Start on your hands and knees, tuck your toes, and lift your hips high into a triangle shape.'],
    steps: [
      'Press your hips up and back, keeping your arms and back long, and let your heels reach toward the floor.',
      'Bend your elbows, glide your chest forward and down, and let your hips lower toward the floor.',
      'Lift your chest into cobra, with your shoulders away from your ears and your hips close to the floor.',
      'Press your hips back up into downward dog and repeat the flow slowly.',
    ],
    breathing: 'Breathe in as you lift into cobra and breathe out as you press back to downward dog.',
    cues: ['Press the floor away', 'Hips high in downward dog', 'Open your chest in cobra', 'Move slow with your breath'],
    mistakes: [
      { text: 'You dump your weight into your wrists and shoulders.', fix: 'Spread your fingers wide and press evenly through your whole hand.' },
      { text: 'You force your heels down and round your back.', fix: 'Bend your knees as much as you need and keep your spine long.' },
    ],
    easier: 'Bend your knees in downward dog and lift only a little in cobra, resting on your forearms if needed.',
    harder: 'Slow the flow down to a full breath in each position, and straighten your legs a little more in downward dog.',
    safety: 'Skip cobra if it pinches your lower back, and ease off if your wrists feel sore.',
  },
}
