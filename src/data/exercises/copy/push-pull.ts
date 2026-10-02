import type { ExerciseCopy } from '../types'

/**
 * Coaching copy for the push, pull and arm exercises (patterns h_push, v_push, h_pull, v_pull, arms).
 * Everything here is read aloud by text-to-speech and shown as captions, so it is plain spoken English:
 * no digits, symbols, parentheses, slashes or abbreviations.
 */
export const COPY_PUSH_PULL: Record<string, ExerciseCopy> = {
  // ---- Horizontal push ----------------------------------------------------------------
  'wall-pushup': {
    summary: 'A standing push-up against a wall that teaches the movement while building your chest, triceps and shoulders.',
    setup: [
      'Stand facing a wall, about one arm length away, with your feet hip width apart.',
      'Place your hands on the wall at shoulder height, a little wider than your shoulders.',
    ],
    steps: [
      'Brace your stomach and squeeze your glutes so your body is one straight line from your head to your heels.',
      'Bend your elbows and lean your chest toward the wall, with your elbows angled back about forty-five degrees.',
      'Press the wall away until your arms are straight.',
    ],
    breathing: 'Breathe in as you lean toward the wall, and breathe out as you push away.',
    cues: ['Body stays one straight line', 'Elbows at forty-five degrees', 'Chest to the wall', 'Push the wall away'],
    mistakes: [
      { text: 'Your hips push back and your body folds.', fix: 'Squeeze your glutes and stay in one straight line as you lean.' },
      { text: 'Your elbows flare straight out to the sides.', fix: 'Angle your elbows back toward your ribs, about forty-five degrees.' },
    ],
    easier: 'Stand closer to the wall and lean in only halfway, building up a little more each session.',
    harder: 'Step your feet farther back, or move on to the incline push-up with your hands on a sturdy chair.',
  },

  'incline-pushup': {
    summary: 'A push-up with your hands on a sturdy chair, which lightens the load while building your chest, triceps and shoulders.',
    setup: [
      "Place a sturdy chair with no wheels against a wall, back to the wall, so it can't slide.",
      'Put your hands on the front edge of the seat, a little wider than your shoulders, and walk your feet back until your body is one slanted line.',
    ],
    steps: [
      'Squeeze your glutes and brace your stomach so your body stays one straight line from head to heels.',
      'Bend your elbows and lower your chest toward the seat, with your elbows angled back about forty-five degrees.',
      'Press the chair away until your arms are straight.',
    ],
    breathing: 'Breathe in as you lower your chest, and breathe out as you press away.',
    cues: ['One straight line, head to heels', 'Elbows at forty-five degrees', 'Chest to the seat', 'Squeeze your glutes', 'Push the chair away'],
    mistakes: [
      { text: 'Your hips sag toward the floor.', fix: 'Squeeze your glutes and brace your stomach so your body stays in one straight line.', fault: 'hip-sag' },
      { text: 'Your elbows flare out wide.', fix: 'Angle them back toward your ribs, about forty-five degrees.' },
    ],
    easier: 'Move to the wall push-up, or press from a higher surface such as a sturdy kitchen counter.',
    harder: 'Progress to the knee push-up on the floor, or slow your lowering to three seconds.',
  },

  'knee-pushup': {
    summary: 'A floor push-up from your knees that cuts the load, building your chest, triceps and shoulders on your way to full push-ups.',
    setup: [
      'Kneel on a mat or folded towel with your hands under your shoulders, a little wider than shoulder width.',
      'Walk your knees back until your body makes one straight line from your knees to your head.',
    ],
    steps: [
      "Brace your stomach and squeeze your glutes so your hips don't sag or pike up.",
      'Bend your elbows and lower your chest toward the floor, with your elbows angled back about forty-five degrees.',
      'Press the floor away until your arms are straight.',
    ],
    breathing: 'Breathe in as you lower your chest, and breathe out as you press up.',
    cues: ['Straight line, knees to head', 'Elbows at forty-five degrees', 'Chest toward the floor', 'Squeeze your glutes', 'Push the floor away'],
    mistakes: [
      { text: 'Your hips shift back toward your heels.', fix: 'Keep your hips in line with your shoulders and knees, and squeeze your glutes.' },
      { text: 'You only lower a few inches.', fix: 'Lower until your chest is just above the floor, then press up.' },
    ],
    easier: 'Switch to the incline push-up with your hands on a sturdy chair.',
    harder: 'Move on to the full push-up on your toes, or lower for three slow seconds.',
    safety: 'If your wrists feel sore, spread your fingers wide and press through your whole hand. Stop if you feel sharp pain.',
  },

  'pushup': {
    summary: 'The classic full push-up, a bodyweight staple that builds your chest, triceps, shoulders and core.',
    setup: [
      'Start with your hands on the floor under your shoulders, a touch wider than shoulder width, and your feet hip width apart.',
      'Rise onto your hands and toes so your body is one straight line from your head to your heels.',
    ],
    steps: [
      'Squeeze your glutes, brace your stomach, and look at a spot on the floor just ahead of your hands.',
      'Bend your elbows and lower your chest toward the floor, with your elbows angled back about forty-five degrees.',
      'Press the floor away until your arms are straight, moving your chest and hips together.',
    ],
    breathing: 'Breathe in as you lower your chest, and breathe out as you press up.',
    cues: ['One straight line, head to heels', 'Elbows at forty-five degrees', 'Chest toward the floor', 'Eyes on the floor ahead', 'Push the floor away'],
    mistakes: [
      { text: 'Your hips sag toward the floor.', fix: 'Squeeze your glutes and brace your stomach so your body stays one straight line.', fault: 'hip-sag' },
      { text: 'Your head drops toward the floor.', fix: 'Keep your neck long and look at a spot just ahead of your hands.', fault: 'head-drop' },
    ],
    easier: 'Drop to the knee push-up, or put your hands on a sturdy chair for the incline push-up.',
    harder: 'Try the diamond push-up, or lower for three slow seconds and pause at the bottom.',
    safety: 'Stop if you feel sharp pain in your wrists or shoulders.',
  },

  'diamond-pushup': {
    summary: 'A push-up with your hands close together that shifts more of the work onto your triceps while still training your chest and shoulders.',
    setup: [
      'Start in a push-up position with your hands together under your chest, thumbs and index fingers forming a small diamond.',
      'Set your feet a little wider than hip width for balance, with your body in one straight line.',
    ],
    steps: [
      'Squeeze your glutes and brace your stomach so your body stays one straight line.',
      'Lower your chest toward your hands, keeping your elbows close and pointing back.',
      'Press the floor away until your arms are straight.',
    ],
    breathing: 'Breathe in as you lower your chest, and breathe out as you press up.',
    cues: ['Hands under your chest', 'Elbows brush your sides', 'One straight line, head to heels', 'Slow and in control'],
    mistakes: [
      { text: 'Your hips sag or pike up.', fix: 'Squeeze your glutes and brace your stomach so your body stays one straight line.' },
      { text: 'Your elbows swing out to the sides.', fix: 'Keep your elbows pointing back and close to your ribs.' },
    ],
    easier: 'Spread your hands a little wider, or go back to the regular push-up.',
    harder: 'Move on to the decline push-up with your feet on a chair, or lower for three slow seconds.',
    safety: 'This hand position stresses your wrists and elbows. Stop if you feel sharp pain.',
  },

  'decline-pushup': {
    summary: 'A push-up with your feet raised on a chair, which shifts more of the load onto your upper chest and shoulders.',
    setup: [
      "Place a sturdy chair with no wheels against a wall, back to the wall, so it can't slide.",
      'Put your toes on the seat and your hands on the floor under your shoulders, a touch wider than shoulder width.',
    ],
    steps: [
      'Squeeze your glutes and brace your stomach so your body is one straight line from your head to your heels.',
      'Bend your elbows and lower your chest toward the floor, with your elbows angled back about forty-five degrees.',
      'Press the floor away until your arms are straight.',
    ],
    breathing: 'Breathe in as you lower your chest, and breathe out as you press up.',
    cues: ['One straight line, head to heels', 'Elbows at forty-five degrees', 'Squeeze your glutes', 'Eyes on the floor ahead', 'Push the floor away'],
    mistakes: [
      { text: 'Your hips pike up toward the ceiling.', fix: 'Squeeze your glutes and lower your hips until your body is one straight, slanted line.' },
      { text: 'Your lower back sags and arches.', fix: 'Brace your stomach hard and tuck your tailbone slightly.' },
    ],
    easier: 'Put your feet back on the floor for the regular push-up.',
    harder: 'Lower for four slow seconds and pause at the bottom of every rep.',
    safety: 'Keep the chair braced so it cannot slide. Stop if you feel sharp pain in your wrists or shoulders.',
  },

  'db-floor-press': {
    summary: 'A dumbbell press lying on the floor that builds your chest, triceps and shoulders, with the floor protecting your shoulders at the bottom.',
    setup: [
      'Lie on your back with your knees bent and your feet flat, holding a dumbbell in each hand.',
      'Press the dumbbells straight up over your chest, with your palms facing your feet.',
    ],
    steps: [
      'Lower the dumbbells slowly until your upper arms lightly touch the floor, with your elbows about forty-five degrees from your sides.',
      'Pause for a beat without relaxing, keeping your wrists straight.',
      'Press the dumbbells back up over your chest until your arms are straight.',
    ],
    breathing: 'Breathe in as you lower the dumbbells, and breathe out as you press them up.',
    cues: ['Wrists straight over your elbows', 'Shoulder blades pinned to the floor', 'Elbows at forty-five degrees', 'Lower slowly, press smoothly'],
    mistakes: [
      { text: 'Your elbows flare straight out to the sides.', fix: 'Angle them to about forty-five degrees from your body.' },
      { text: 'You let your arms crash onto the floor.', fix: 'Lower under control, touch lightly, pause for a beat, then press.' },
    ],
    easier: 'Press one dumbbell at a time, or try the incline push-up if the weight feels like too much.',
    harder: 'Lower for four slow seconds and pause on the floor, or hold a glute bridge while you press.',
  },

  // ---- Vertical push ------------------------------------------------------------------
  'db-overhead-press': {
    summary: 'A standing press that drives two dumbbells overhead, building your shoulders and triceps while your core and upper back keep you steady.',
    setup: [
      'Stand with your feet hip width apart, holding a dumbbell in each hand at shoulder height with your palms facing forward.',
      'Squeeze your glutes and brace your stomach so your ribs stay down.',
    ],
    steps: [
      'Press both dumbbells straight up until your arms are fully straight, with your biceps near your ears.',
      'Pause for a moment, keeping your ribs down and your back from arching.',
      'Lower the dumbbells slowly back to shoulder height.',
    ],
    breathing: 'Breathe in at the bottom, and breathe out as you press the dumbbells up.',
    cues: ['Ribs down, glutes tight', 'Wrists stacked over your elbows', 'Press straight up', 'Biceps by your ears', 'Lower with control'],
    mistakes: [
      { text: 'You lean back and arch your lower back.', fix: 'Squeeze your glutes, brace your stomach, and keep your ribs down.' },
      { text: 'The dumbbells drift out in front of you.', fix: 'Keep your wrists over your elbows and press straight up beside your ears.' },
    ],
    easier: 'Sit on a chair with your back upright, or press one arm at a time.',
    harder: 'Lower for four slow seconds, or move on to the Arnold press, which adds a rotation.',
    safety: 'If your shoulders feel pinched, press only as high as feels comfortable. Stop if you feel sharp pain.',
  },

  'arnold-press': {
    summary: 'A rotating dumbbell press that builds your shoulders and triceps through a longer, smoother range of motion.',
    setup: [
      'Stand with your feet hip width apart, holding the dumbbells at chest height with your palms facing you and your elbows in front.',
      'Squeeze your glutes and brace your stomach so your ribs stay down.',
    ],
    steps: [
      'Press the dumbbells up and, as they rise, turn your palms to face forward.',
      'Finish with your arms straight overhead and your palms facing forward.',
      'Reverse the motion slowly, turning your palms back toward you as you lower to your chest.',
    ],
    breathing: 'Breathe in at the bottom, and breathe out as you press overhead.',
    cues: ['Rotate smoothly as you press', 'Ribs down, glutes tight', 'Finish tall, arms straight', 'Slow on the way down'],
    mistakes: [
      { text: 'You arch your back as the dumbbells rise.', fix: 'Squeeze your glutes, brace your stomach, and keep your ribs down.' },
      { text: 'You rush the turn and swing the dumbbells.', fix: 'Slow down so the rotation flows smoothly through the whole press.' },
    ],
    easier: 'Go back to the dumbbell overhead press, keeping your palms facing forward the whole time.',
    harder: 'Pause for two seconds halfway up, or take four seconds to lower the dumbbells.',
    safety: 'If the rotation pinches your shoulders, use the regular overhead press instead. Stop if you feel sharp pain.',
  },

  'pike-pushup': {
    summary: 'A bodyweight shoulder press from an upside-down V position, building your shoulders, triceps and upper back.',
    setup: [
      'Start on your hands and feet with your hips high, so your body makes an upside-down V.',
      'Set your hands a little wider than your shoulders, and walk your feet in until your hips are stacked high above your shoulders.',
    ],
    steps: [
      'Keep your hips high and your legs nearly straight.',
      'Bend your elbows and lower the top of your head toward the floor, just in front of your hands.',
      'Press the floor away until your arms are straight and your hips are high again.',
    ],
    breathing: 'Breathe in as you lower your head, and breathe out as you press back up.',
    cues: ['Hips high, upside-down V', 'Head lands just ahead of your hands', 'Elbows point back, not out', 'Push the floor away', 'Brace your stomach'],
    mistakes: [
      { text: 'Your hips drop and it turns into a regular push-up.', fix: 'Walk your feet closer so your hips stay high above your shoulders.' },
      { text: 'Your elbows flare out wide.', fix: 'Point them back toward your hips, close to your body.' },
    ],
    easier: 'Lower only halfway, or build strength with the dumbbell overhead press.',
    harder: 'Put your feet on a chair for the elevated pike push-up.',
    safety: 'Lower under control so your head never bumps the floor. Stop if you feel sharp pain in your wrists or shoulders.',
  },

  'elevated-pike-pushup': {
    summary: 'A harder pike push-up with your feet on a chair, putting more of your body weight over your shoulders to build serious shoulder and triceps strength.',
    setup: [
      'Place a sturdy chair with no wheels against a wall, back to the wall, and rest your toes on the seat.',
      'Set your hands a little wider than your shoulders, and walk them back until your hips are high in an upside-down V.',
    ],
    steps: [
      'Keep your hips high and your legs nearly straight.',
      'Bend your elbows and lower the top of your head toward the floor, just in front of your hands.',
      'Press the floor away until your arms are straight and your hips are high again.',
    ],
    breathing: 'Breathe in as you lower your head, and breathe out as you press back up.',
    cues: ['Hips stay high above your shoulders', 'Head lands just ahead of your hands', 'Elbows point back, not out', 'Push the floor away'],
    mistakes: [
      { text: 'Your hips sink and your body flattens out.', fix: 'Walk your hands closer to the chair so your hips stay high above your shoulders.' },
      { text: 'You drop quickly and bump your head.', fix: 'Lower for a slow count of two and stop just above the floor.' },
    ],
    easier: 'Put your feet back on the floor for the pike push-up.',
    harder: 'Lower for four slow seconds, or train toward the wall handstand hold.',
    safety: 'Make sure the chair cannot slide. Stop if you feel dizzy or have sharp pain in your wrists or shoulders.',
  },

  'wall-handstand': {
    summary: 'A supported handstand hold with your heels on the wall, building powerful shoulders, steady triceps and a tight core.',
    setup: [
      'Clear the space around you, use a non-slip floor, and have someone nearby for your first tries.',
      'Stand with your back to the wall, bend forward, and plant your hands on the floor shoulder width apart, with your fingers spread.',
    ],
    steps: [
      'Kick up one leg at a time until both heels rest against the wall.',
      'Press the floor away, squeeze your glutes, pull your ribs in, and point your toes.',
      'Hold for your target time, breathing steadily, then lower one foot at a time to step down.',
    ],
    breathing: 'Breathe slowly and steadily, and do not hold your breath.',
    cues: ['Press the floor away', 'Ribs in, glutes tight', 'Legs together, toes pointed', 'Look between your hands', 'Breathe slowly'],
    mistakes: [
      { text: 'Your back arches like a banana.', fix: 'Squeeze your glutes, pull your ribs down, and tuck your tailbone slightly.' },
      { text: 'Your shoulders collapse and your elbows bend.', fix: 'Push the floor away and reach tall through your shoulders.' },
    ],
    easier: 'Hold the top of the elevated pike push-up with your feet on a chair.',
    harder: 'Add a few seconds each session, and press tall so the wall carries less of your weight.',
    safety: 'Practice stepping down safely first. Come down right away if you feel dizzy or have sharp pain in your wrists or shoulders.',
  },

  'lateral-raise': {
    summary: 'A standing dumbbell raise out to the sides that targets the sides of your shoulders, building strength and width.',
    setup: [
      'Stand tall with your feet hip width apart and a dumbbell in each hand at your sides, palms facing in.',
      'Soften your knees, brace your stomach, and bend your elbows very slightly.',
    ],
    steps: [
      'Raise both arms out to your sides, leading with your elbows, until your hands reach shoulder height.',
      'Pause for a moment at the top without shrugging.',
      'Lower the dumbbells slowly back to your sides.',
    ],
    breathing: 'Breathe out as you raise your arms, and breathe in as you lower them.',
    cues: ['Lead with your elbows', 'Stop at shoulder height', 'Shoulders down, away from ears', 'Slow and controlled', 'No swinging'],
    mistakes: [
      { text: 'You swing the dumbbells up with momentum.', fix: 'Keep your torso still and slow down, resting longer between reps if you need to.' },
      { text: 'You shrug your shoulders toward your ears.', fix: 'Press your shoulders down and think about lifting your elbows, not your hands.' },
    ],
    easier: 'Raise only halfway, or step back to the front raise using a single dumbbell.',
    harder: 'Lower for four slow seconds, or pause for two seconds at the top of every rep.',
    safety: 'Lift only to shoulder height. Stop if you feel a pinch or sharp pain in your shoulders.',
  },

  'front-raise': {
    summary: 'A standing raise with one dumbbell held in both hands, building the front of your shoulders and upper chest.',
    setup: [
      'Stand tall with your feet hip width apart, holding one dumbbell in both hands in front of your thighs.',
      'Soften your knees, brace your stomach, and keep your elbows slightly bent.',
    ],
    steps: [
      'Raise the dumbbell straight out in front of you to shoulder height, keeping your arms nearly straight.',
      'Pause for a moment at the top without leaning back.',
      'Lower the dumbbell slowly to your thighs.',
    ],
    breathing: 'Breathe out as you raise the dumbbell, and breathe in as you lower it.',
    cues: ['Lift to shoulder height only', 'Stay tall, no leaning back', 'Ribs down, stomach braced', 'Slow on the way down', 'Shoulders away from your ears'],
    mistakes: [
      { text: 'You lean back and swing the dumbbell up.', fix: 'Squeeze your glutes, brace your stomach, and stop at shoulder height.' },
      { text: 'You lift above shoulder height and shrug.', fix: 'Stop when your arms are level with the floor and keep your shoulders down.' },
    ],
    easier: 'Lift only to chest height and move slowly, building up a bit more each session.',
    harder: 'Lower for four slow seconds, or move on to the lateral raise with a dumbbell in each hand.',
    safety: 'Stop if you feel a pinch or sharp pain in your shoulders.',
  },

  // ---- Horizontal pull ----------------------------------------------------------------
  'prone-ytw': {
    summary: 'A gentle floor exercise where you lift your arms into a Y, a T and a W, waking up your upper back and shoulder blade muscles.',
    setup: [
      'Lie face down on a mat or carpet with your legs straight and your neck long, looking at the floor.',
      'Reach your arms overhead in a wide Y, with your thumbs pointing up.',
    ],
    steps: [
      'Lift your arms a few inches off the floor in the Y and hold for a second.',
      'Sweep your arms out to a T, squeezing your shoulder blades together, and hold for a second.',
      'Bend your elbows into a W, pulling them toward your ribs, hold for a second, then reach back to the Y for one rep.',
    ],
    breathing: 'Breathe slowly through each shape, and do not hold your breath.',
    cues: ['Thumbs up, arms light', 'Squeeze your shoulder blades', 'Neck long, eyes down', 'Lift from your upper back', 'Slow and smooth'],
    mistakes: [
      { text: 'You crank your head up and strain your neck.', fix: 'Keep looking at the floor and lift only your arms and a little of your chest.' },
      { text: 'You shrug your shoulders toward your ears.', fix: 'Slide your shoulder blades down your back before each lift.' },
    ],
    easier: 'Lift your arms only an inch or two, and hold each shape for less time.',
    harder: 'Hold each shape for three seconds, or move on to the reverse snow angel.',
    safety: 'Skip any shape that pinches your shoulders or lower back. Stop if you feel sharp pain.',
  },

  'reverse-snow-angel': {
    summary: 'A floor exercise where you sweep your arms in a big arc like a snow angel, building your upper back, rear shoulders and posture.',
    setup: [
      'Lie face down with your legs straight, your neck long, and your arms resting by your sides with your palms down.',
      'Squeeze your glutes lightly and keep your eyes on the floor.',
    ],
    steps: [
      'Lift your arms and chest slightly, with your thumbs pointing up.',
      'Sweep your arms out and overhead in a wide arc, keeping them off the floor.',
      'Sweep them back down to your hips along the same path, squeezing your shoulder blades together.',
    ],
    breathing: 'Breathe in as your arms sweep overhead, and breathe out as they return to your sides.',
    cues: ['Arms hover, never drag', 'Big, slow arc', 'Squeeze your shoulder blades', 'Neck long, eyes down', 'Lift from your upper back'],
    mistakes: [
      { text: 'Your arms drop and drag on the floor.', fix: 'Keep them hovering just above the floor, even if that means a smaller arc.' },
      { text: 'You lift your head and arch your lower back.', fix: 'Look at the floor, squeeze your glutes, and keep the lift small.' },
    ],
    easier: 'Let your hands brush the floor lightly as you sweep, or step back to the prone Y, T and W raise.',
    harder: 'Slow each sweep to three seconds, or move on to the dumbbell bent-over row.',
    safety: 'Keep the lift small if your lower back feels tight. Stop if you feel sharp pain.',
  },

  'db-bent-row': {
    summary: 'A two-arm dumbbell row that builds your upper back, lats and biceps while you hold a strong, flat-backed position.',
    setup: [
      'Hold a dumbbell in each hand, soften your knees, and hinge forward from your hips until your back is flat and your chest angles toward the floor.',
      'Let your arms hang straight down beneath your shoulders.',
    ],
    steps: [
      'Pull both elbows back toward your hips, keeping the dumbbells close to your body.',
      'Squeeze your shoulder blades together at the top for a beat.',
      'Lower the dumbbells slowly until your arms are straight, without letting your back round.',
    ],
    breathing: 'Breathe out as you row the dumbbells up, and breathe in as you lower them.',
    cues: ['Elbows to your back pockets', 'Flat back, long spine', 'Squeeze your shoulder blades', 'Hips back, chest forward', 'Lower with control'],
    mistakes: [
      { text: 'Your back rounds as you pull.', fix: 'Push your hips back, lift your chest, and look at the floor a few feet ahead.' },
      { text: 'You stand up a little with every rep to heave the dumbbells.', fix: 'Hold your torso angle still and let only your arms move.' },
    ],
    easier: 'Step back to the reverse snow angel, or row with a shorter pull and a slower pace.',
    harder: 'Pause for two seconds at the top of each rep, or move on to the one-arm dumbbell row.',
    safety: 'Keep your back flat the whole time. Stop if you feel strain in your lower back or sharp pain.',
  },

  'one-arm-db-row': {
    summary: 'A chair-supported one-arm row that builds your lats, upper back and biceps while sparing your lower back.',
    setup: [
      'Place a sturdy chair with no wheels against a wall, back to the wall, and stand facing it.',
      'Rest one hand on the seat and hinge forward until your back is flat, with a dumbbell in your other hand hanging below your shoulder.',
    ],
    steps: [
      'Pull the dumbbell toward your hip, leading with your elbow and keeping your arm close to your side.',
      'Squeeze your shoulder blade toward your spine at the top, without twisting your torso.',
      'Lower the dumbbell slowly until your arm is straight. Finish all your reps, then switch sides.',
    ],
    breathing: 'Breathe out as you row the dumbbell up, and breathe in as you lower it.',
    cues: ['Elbow to your back pocket', 'Flat back, hips square', 'Squeeze your shoulder blade', 'No twisting, no heaving', 'Lower slowly, arm fully straight'],
    mistakes: [
      { text: 'You twist your torso to heave the dumbbell up.', fix: 'Keep your shoulders square to the floor and let only your arm move.' },
      { text: 'Your elbow flares out and you pull with your hand.', fix: 'Think about driving your elbow back toward your hip.' },
    ],
    easier: 'Step back to the two-arm dumbbell bent-over row, or shorten the pull.',
    harder: 'Use your heavier dumbbell if you have one, or lower a twenty-pound dumbbell for three seconds, and try the table inverted row when ready.',
  },

  'table-row-bent': {
    summary: 'A bodyweight row under a sturdy table, pulling your chest up to its edge to build your upper back, lats and biceps.',
    setup: [
      'Use a heavy, sturdy table that cannot slide or tip, and test it with a firm pull first.',
      'Lie under the table edge and grip it with both hands, a little wider than your shoulders, with your knees bent and your feet flat.',
      'Lift your hips until your body is one straight line from your shoulders to your knees.',
    ],
    steps: [
      'Pull your chest up to the table edge, leading with your elbows and squeezing your shoulder blades together.',
      'Lower yourself slowly until your arms are straight, keeping your hips lifted.',
    ],
    breathing: 'Breathe out as you pull your chest up, and breathe in as you lower.',
    cues: ['Chest to the table edge', 'Hips up, body in one line', 'Squeeze your shoulder blades', 'Pull with your elbows', 'Lower with control'],
    mistakes: [
      { text: 'Your hips sag toward the floor.', fix: 'Squeeze your glutes and keep one straight line from your shoulders to your knees.' },
      { text: 'Your shoulders shrug up toward your ears as you pull.', fix: 'Start each rep by squeezing your shoulder blades back and down.' },
    ],
    easier: 'Step back to the dumbbell bent-over row, or pull only partway up and build your range over time.',
    harder: 'Straighten your legs and rest on your heels for the full table inverted row.',
    safety: 'Check the table every time. Stop if it shifts or tips, or if you feel sharp pain.',
  },

  'table-row': {
    summary: 'A full bodyweight row under a sturdy table with your legs straight, building your upper back, lats and biceps.',
    setup: [
      'Use a heavy, sturdy table that cannot slide or tip, and test it with a firm pull first.',
      'Lie under the table edge and grip it with both hands, a little wider than your shoulders.',
      'Straighten your legs, rest on your heels, and lift your hips into one straight line from your heels to your shoulders.',
    ],
    steps: [
      'Pull your chest up to the table edge, leading with your elbows and squeezing your shoulder blades together.',
      'Keep your glutes tight so your hips stay in line with your body.',
      'Lower yourself slowly until your arms are straight.',
    ],
    breathing: 'Breathe out as you pull your chest up, and breathe in as you lower.',
    cues: ['Chest to the table edge', 'Body stays one stiff plank', 'Squeeze your shoulder blades', 'Pull with your elbows', 'Lower with control'],
    mistakes: [
      { text: 'Your hips sag toward the floor.', fix: 'Squeeze your glutes and keep your body in one straight line from heels to shoulders.' },
      { text: 'You only pull halfway up.', fix: 'Bring your chest all the way to the table edge before you lower.' },
    ],
    easier: 'Step back to the table inverted row with your knees bent and your feet flat on the floor.',
    harder: 'Pause for two seconds with your chest at the table edge, or move on to the renegade row.',
    safety: 'Check the table every time. Stop if it shifts or tips, or if you feel sharp pain.',
  },

  'renegade-row': {
    summary: 'A plank-position row with a dumbbell in each hand that builds your lats, upper back and core as you fight to keep your hips still.',
    setup: [
      'Set the dumbbells on the floor shoulder width apart, grip the handles in a push-up position, and spread your feet wide for balance.',
      'Squeeze your glutes and brace your stomach so your body is one straight line from your head to your heels.',
    ],
    steps: [
      'Press the floor away with your left hand and row the right dumbbell toward your hip, keeping your hips level.',
      'Lower the dumbbell back to the floor with control, then row with the other arm.',
      'Keep alternating sides, moving slowly, until you finish your reps on both arms.',
    ],
    breathing: 'Breathe out as you row the dumbbell up, and breathe in as you lower it.',
    cues: ['Hips stay square to the floor', 'Spread your feet wide', 'Elbow to your hip', 'Squeeze your glutes', 'Press the floor away'],
    mistakes: [
      { text: 'Your hips twist open as you row.', fix: 'Widen your feet, brace your stomach, and keep your hips pointing at the floor.' },
      { text: 'Your hips sag or pike up.', fix: 'Squeeze your glutes to keep your body in one straight line.' },
    ],
    easier: 'Step back to the table inverted row, or do the rows with your knees on the floor.',
    harder: 'Pause for two seconds at the top of every row, or lower for three slow seconds.',
    safety: 'Use dumbbells that will not roll away, and stop if you feel sharp pain in your wrists.',
  },

  // ---- Vertical pull (no bar) ---------------------------------------------------------
  'prone-w-pull': {
    summary: 'A face-down exercise that copies a pulldown, training your lats and upper back with no equipment.',
    setup: [
      'Lie face down with your legs straight and your neck long, looking at the floor.',
      'Reach your arms overhead in a wide Y, with your thumbs pointing up.',
    ],
    steps: [
      'Lift your arms and chest slightly off the floor.',
      'Pull your elbows down toward your hips, bending them into a W as you squeeze your shoulder blades together.',
      'Reach back out to the Y with control, keeping your arms off the floor.',
    ],
    breathing: 'Breathe out as you pull your elbows down, and breathe in as you reach out.',
    cues: ['Pull elbows toward your hips', 'Squeeze your shoulder blades', 'Neck long, eyes down', 'Arms stay off the floor', 'Slow and smooth'],
    mistakes: [
      { text: 'You crane your neck to look forward.', fix: 'Keep your eyes on the floor and lift only a little.' },
      { text: 'You shrug your shoulders toward your ears.', fix: 'Slide your shoulder blades down your back as you pull.' },
    ],
    easier: 'Keep your chest and forehead on the floor and lift only your arms.',
    harder: 'Hold the W for three seconds, or move on to the dumbbell pullover.',
    safety: 'Keep the lift small if your lower back feels pinched. Stop if you feel sharp pain.',
  },

  'db-pullover': {
    summary: 'A lying dumbbell pullover that strengthens and stretches your lats and chest, giving you a pulling move without a bar.',
    setup: [
      'Lie on your back on the floor with your knees bent and your feet flat.',
      'Hold one dumbbell firmly with both hands over your chest, arms up, with a soft bend in your elbows.',
    ],
    steps: [
      'Keep your elbows softly bent and lower the dumbbell in a smooth arc back behind your head.',
      'Stop when you feel a stretch along your sides, before your ribs flare or your lower back arches.',
      'Squeeze your lats to arc the dumbbell back up over your chest.',
    ],
    breathing: 'Breathe in as the dumbbell travels back overhead, and breathe out as you pull it over your chest.',
    cues: ['Soft elbows, smooth wide arc', 'Ribs down, lower back flat', 'Pull with your lats', 'Slow and controlled'],
    mistakes: [
      { text: 'Your ribs flare and your lower back arches.', fix: 'Brace your stomach, press your lower back toward the floor, and shorten the arc.' },
      { text: 'You bend and straighten your elbows like a triceps extension.', fix: 'Hold a soft, steady bend and move from your shoulders.' },
    ],
    easier: 'Step back to the prone W pull, or shorten the arc so the dumbbell stays over your chest.',
    harder: 'Use your heavier dumbbell if you have one, or lower a twenty-pound dumbbell for four seconds.',
    safety: 'Grip the dumbbell firmly so it cannot slip. Stop if your shoulders pinch or you feel sharp pain.',
  },

  // ---- Arms ---------------------------------------------------------------------------
  'db-curl': {
    summary: 'A classic standing curl with a dumbbell in each hand, building your biceps and forearms.',
    setup: [
      'Stand tall with your feet hip width apart, a dumbbell in each hand, arms down at your sides and palms facing forward.',
      'Pin your elbows to your sides and brace your stomach.',
    ],
    steps: [
      'Curl both dumbbells up toward your shoulders, keeping your elbows pinned beside your ribs.',
      'Squeeze your biceps at the top for a beat.',
      'Lower the dumbbells slowly until your arms are fully straight.',
    ],
    breathing: 'Breathe out as you curl the dumbbells up, and breathe in as you lower them.',
    cues: ['Elbows glued to your sides', 'No swinging your body', 'Squeeze at the top', 'Slow on the way down', 'Full stretch at the bottom'],
    mistakes: [
      { text: 'You swing your body to heave the dumbbells up.', fix: 'Brace your stomach, squeeze your glutes, and slow down so only your arms move.' },
      { text: 'Your elbows drift forward.', fix: 'Pin them beside your ribs and curl only as high as you can keep them still.' },
    ],
    easier: 'Alternate arms, resting one while the other curls, or curl only halfway up.',
    harder: 'Take four seconds to lower the dumbbells, or pause for two seconds halfway up.',
  },

  'hammer-curl': {
    summary: 'A curl with your palms facing each other that builds your biceps and the forearm muscles you use to grip.',
    setup: [
      'Stand tall with your feet hip width apart, a dumbbell in each hand, arms at your sides and palms facing your thighs.',
      'Pin your elbows to your sides and keep your wrists straight.',
    ],
    steps: [
      'Curl both dumbbells up toward your shoulders, keeping your palms facing each other as if you were holding hammers.',
      'Squeeze at the top for a beat, with your elbows still beside your ribs.',
      'Lower the dumbbells slowly until your arms are straight.',
    ],
    breathing: 'Breathe out as you curl the dumbbells up, and breathe in as you lower them.',
    cues: ['Palms face each other', 'Elbows glued to your sides', 'Wrists straight and strong', 'Slow, no swinging', 'Squeeze at the top'],
    mistakes: [
      { text: 'Your wrists bend or twist.', fix: 'Keep your wrists straight and your palms facing each other all the way up.' },
      { text: 'You swing your body to help.', fix: 'Brace your stomach and squeeze your glutes so only your arms move.' },
    ],
    easier: 'Alternate arms, resting one while the other curls, or curl only halfway up.',
    harder: 'Take four seconds to lower the dumbbells, or pause for two seconds halfway up.',
  },

  'overhead-triceps': {
    summary: 'A standing overhead extension with one dumbbell that builds the back of your upper arms, your triceps.',
    setup: [
      'Stand tall with your feet hip width apart, holding one dumbbell upright with both hands cupped under the top end.',
      'Press it overhead until your arms are straight, with your upper arms close to your ears.',
    ],
    steps: [
      'Keeping your upper arms still, bend your elbows to lower the dumbbell behind your head.',
      'Lower until you feel a stretch along the back of your arms.',
      'Straighten your elbows to press the dumbbell back overhead, squeezing your triceps at the top.',
    ],
    breathing: 'Breathe in as you lower the dumbbell, and breathe out as you press it overhead.',
    cues: ['Elbows point at the ceiling', 'Upper arms stay by your ears', 'Ribs down, stomach braced', 'Slow and controlled', 'Squeeze your triceps at the top'],
    mistakes: [
      { text: 'Your elbows flare out to the sides.', fix: 'Keep them pointing at the ceiling, close to your ears, and bend only at the elbow.' },
      { text: 'You arch your back and your ribs pop forward.', fix: 'Squeeze your glutes, brace your stomach, and keep your ribs down.' },
    ],
    easier: 'Sit on a chair with your back upright to steady your body, or lower the dumbbell only halfway.',
    harder: 'Use your heavier dumbbell if you have one, or lower a twenty-pound dumbbell for four seconds.',
    safety: 'Keep a firm two-handed grip so the dumbbell cannot slip. Stop if you feel sharp pain in your elbows or shoulders.',
  },

  'skull-crusher': {
    summary: 'A lying extension with a dumbbell in each hand that isolates the back of your upper arms, your triceps.',
    setup: [
      'Lie on your back with your knees bent and your feet flat, holding a dumbbell in each hand.',
      'Press the dumbbells straight up over your shoulders, with your palms facing each other.',
    ],
    steps: [
      'Keeping your upper arms still, bend your elbows to lower the dumbbells toward the floor beside your ears.',
      'Straighten your elbows to press the dumbbells back up over your shoulders.',
    ],
    breathing: 'Breathe in as you lower the dumbbells, and breathe out as you press them up.',
    cues: ['Upper arms stay still', 'Elbows point at the ceiling', 'Lower beside your ears', 'Slow and in control', 'Squeeze your triceps to finish'],
    mistakes: [
      { text: 'Your elbows flare out wide.', fix: 'Keep them pointing at the ceiling, about shoulder width apart.' },
      { text: 'Your upper arms swing back and forth, turning it into a press.', fix: 'Hold your upper arms still and let only your forearms move.' },
    ],
    easier: 'Lower only partway, and go a little deeper each session.',
    harder: 'Take four seconds to lower the dumbbells, and pause for a second near the bottom.',
    safety: 'The dumbbells travel near your head, so move slowly and keep a firm grip. Stop if you feel sharp pain in your elbows.',
  },

  'chair-dip': {
    summary: 'A bodyweight dip on a sturdy chair that builds the back of your arms, with help from your chest and shoulders.',
    setup: [
      'Place a sturdy chair with no wheels against a wall, back to the wall.',
      'Sit on the front edge with your hands beside your hips, then slide your hips off the seat, with your knees bent and your heels on the floor.',
    ],
    steps: [
      'Bend your elbows straight back to lower your hips toward the floor, keeping your back close to the chair.',
      'Stop when your elbows are bent about ninety degrees, no deeper.',
      'Press through your palms until your arms are straight.',
    ],
    breathing: 'Breathe in as you lower, and breathe out as you press up.',
    cues: ['Elbows point straight back', 'Back close to the chair', 'Shoulders down, away from ears', 'Stop at ninety degrees', 'Press through your palms'],
    mistakes: [
      { text: 'Your elbows flare out to the sides.', fix: 'Point them straight back, keeping your arms close to your ribs.' },
      { text: 'You drop too deep and your shoulders roll forward.', fix: 'Stop at ninety degrees and keep your chest tall.' },
    ],
    easier: 'Keep your feet closer to the chair, or lower only partway.',
    harder: 'Straighten your legs out with your heels on the floor, or take four seconds to lower.',
    safety: 'Keep your shoulders away from your ears. Stop if you feel pinching or sharp pain.',
  },

  'db-shrug': {
    summary: 'A simple standing shrug that builds the traps across the top of your shoulders, plus a stronger grip.',
    setup: [
      'Stand tall with your feet hip width apart, a dumbbell in each hand, arms straight at your sides and palms facing in.',
    ],
    steps: [
      'Lift your shoulders straight up toward your ears.',
      'Pause for one second at the top and squeeze.',
      'Lower your shoulders slowly all the way down.',
    ],
    breathing: 'Breathe out as you lift your shoulders, and breathe in as you lower them.',
    cues: ['Straight up, no rolling', 'Pause and squeeze at the top', 'Arms stay long and straight', 'Lower slowly', 'Chin level, neck relaxed'],
    mistakes: [
      { text: 'You roll your shoulders in circles.', fix: 'Lift straight up and lower straight down.' },
      { text: 'You bend your elbows to lift the dumbbells.', fix: 'Keep your arms long and let only your shoulders move.' },
    ],
    easier: 'Lift only partway up, and rest between reps.',
    harder: 'Pause for three seconds at the top, or take four seconds to lower.',
  },
}
