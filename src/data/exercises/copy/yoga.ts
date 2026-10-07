import type { ExerciseCopy } from '../types'

/**
 * Coaching copy for Bloom's yoga poses, keyed by exercise id.
 *
 * Read aloud by text-to-speech, so it sticks to plain spoken English: no digits, symbols,
 * abbreviations, parentheses or slashes. The voice is warm and unhurried: invitations rather than
 * orders, and an easier option is always on offer.
 */
export const COPY_YOGA: Record<string, ExerciseCopy> = {
  // ---- Flows ----------------------------------------------------------------------------------
  'mountain-breath': {
    summary: 'A simple standing breath that links movement and breathing, waking up your shoulders and side body as your arms float up and down.',
    setup: ['Stand tall with your feet hip width apart, arms resting by your sides and your weight even across both feet.'],
    steps: [
      'Breathe in as you sweep your arms forward and up toward the ceiling.',
      'Breathe out as you float your arms back down to your sides.',
      'Let each breath set the pace, slow and smooth.',
    ],
    breathing: 'Breathe in through your nose as the arms rise, and breathe out slowly as they lower.',
    cues: ['Arms rise with the inhale', 'Soft shoulders, long neck', 'Feet rooted, crown lifting', 'Let the breath lead'],
    mistakes: [
      { text: 'You hold your breath or rush the arms.', fix: 'Slow down so one full breath carries each movement.' },
      { text: 'Your shoulders creep up to your ears.', fix: 'Reach your fingertips up while your shoulders stay soft and low.' },
    ],
    easier: 'Raise your arms only to shoulder height, or sit on a chair and do the same breath.',
    harder: 'Pause at the top for a full breath and lift gently onto the balls of your feet.',
  },

  'half-sun-salutation': {
    summary: 'A standing flow of reach, fold and halfway lift that warms your spine, hamstrings and shoulders without coming down to the floor.',
    setup: ['Stand at the front of your mat with your feet hip width apart and your palms together at your chest.'],
    steps: [
      'Breathe in and sweep your arms up overhead.',
      'Breathe out and fold forward from your hips, bending your knees as much as you like.',
      'Breathe in to a halfway lift with a long flat back and your hands on your shins, then breathe out and fold again.',
      'Breathe in and rise all the way up with your arms overhead, then bring your hands back to your heart.',
    ],
    breathing: 'Breathe in to lift and lengthen, and breathe out to fold. One movement for each breath.',
    cues: ['Bend your knees generously', 'Lead with your heart', 'Long flat back halfway', 'Move with your breath'],
    mistakes: [
      { text: 'You lock your knees and round your back to reach the floor.', fix: 'Bend your knees so your belly can rest on your thighs and your back stays long.' },
      { text: 'You rush through the shapes.', fix: 'Let each shape last a whole breath, in or out.' },
    ],
    easier: 'Keep your hands on your thighs instead of the floor, and fold only halfway.',
    harder: 'Hold the halfway lift for an extra breath and straighten your legs a little more.',
    safety: 'If you feel dizzy, rise up slowly with your head last.',
  },

  'sun-salutation-gentle': {
    summary: 'A gentle full sun salutation with your knees down: fold, lunge, lower to your belly, lift into a small cobra, rest in child’s pose and flow back up.',
    setup: ['Stand at the front of your mat with your palms together at your chest. Put a folded blanket under your knees if they like padding.'],
    steps: [
      'Reach up, fold forward, lift halfway, then plant your hands and step one foot back into a low lunge with the back knee down.',
      'Bring the other knee down, lower slowly all the way to your belly, then press gently into a small cobra.',
      'Push back to child’s pose for a breath, then lift your hips into downward dog.',
      'Step one foot forward between your hands, fold, and rise all the way up with your arms overhead.',
    ],
    breathing: 'Breathe in as you lift or open, and breathe out as you fold or lower.',
    cues: ['Knees down, take it slow', 'Lower all the way down', 'Small cobra, soft elbows', 'Rest in child’s pose', 'Step forward, then rise'],
    mistakes: [
      { text: 'You drop down to the floor in one go.', fix: 'Lower your chest slowly with your elbows hugging your ribs.' },
      { text: 'You force a big cobra and squeeze your lower back.', fix: 'Lift only as high as stays comfortable, using your back muscles more than your arms.' },
    ],
    easier: 'Skip downward dog and come back to standing from all fours, walking your hands toward your feet.',
    harder: 'Move to the classic sun salutation, stepping back to a full plank instead of your knees.',
    safety: 'If your wrists complain, make soft fists or rest your forearms on the mat during the floor part.',
  },

  'sun-salutation': {
    summary: 'The classic sun salutation: a flowing sequence of reach, fold, plank, cobra and downward dog that warms your whole body.',
    setup: ['Stand at the front of your mat with your feet hip width apart and your palms together at your chest.'],
    steps: [
      'Reach up, fold forward, lift halfway, then plant your hands and step back to a plank.',
      'Lower slowly all the way to the mat, then lift your chest into cobra.',
      'Press back into downward dog and stay for a few slow breaths.',
      'Step forward between your hands, lift halfway, fold, and rise up with your arms overhead.',
    ],
    breathing: 'Breathe in to lift or open, breathe out to fold or lower, and stay with steady breaths in downward dog.',
    cues: ['Step back, strong plank', 'Lower with control', 'Lift your heart in cobra', 'Hips high in downward dog', 'Step forward and rise'],
    mistakes: [
      { text: 'Your hips sag in the plank.', fix: 'Press the floor away and draw your belly in, or lower your knees.' },
      { text: 'You hold your breath in the hard parts.', fix: 'Keep the breath moving, and slow the whole flow down if you need to.' },
    ],
    easier: 'Lower your knees for the plank and the lowering, or go back to the gentle sun salutation.',
    harder: 'Hold each pose for one extra breath while keeping the flow smooth.',
    safety: 'Skip cobra if it pinches your lower back and simply rest on your belly instead.',
  },

  // ---- Standing ---------------------------------------------------------------------------------
  'warrior-2': {
    summary: 'A strong, steady standing pose with your legs wide, front knee bent and arms reaching long, building strength and focus in your legs.',
    setup: [
      'Step your feet wide apart. Turn your front foot to point forward and your back foot slightly in.',
      'Line up your front heel with the middle of your back foot.',
    ],
    steps: [
      'Bend your front knee so it points over your middle toes.',
      'Reach your arms out to the sides at shoulder height, palms down.',
      'Look gently past your front fingertips and stay, sinking a little lower on each breath out.',
    ],
    breathing: 'Breathe slowly and evenly, and let each breath out help you settle a little deeper.',
    cues: ['Front knee over your toes', 'Arms long, shoulders soft', 'Press into the back foot', 'Steady gaze, steady breath'],
    mistakes: [
      { text: 'Your front knee drifts in past your big toe.', fix: 'Guide the knee out so it points toward your little toes.' },
      { text: 'You lean your body over the front leg.', fix: 'Stack your shoulders over your hips, right in the middle.' },
    ],
    easier: 'Shorten your stance and bend the front knee only a little, or rest your hands on your hips.',
    harder: 'Widen your stance so the front thigh comes closer to parallel with the floor.',
  },

  'goddess-pose': {
    summary: 'A wide, grounded squat with knees and toes turned out, opening your hips while it strengthens your legs.',
    setup: ['Step your feet wide apart and turn your toes out on a gentle angle, heels in.'],
    steps: [
      'Bend your knees and lower your hips, keeping your knees in line with your toes.',
      'Lift your arms to a cactus shape with elbows bent and palms facing forward.',
      'Stay tall through your spine and breathe into your hips.',
    ],
    breathing: 'Breathe deeply into your belly and let your hips soften on each breath out.',
    cues: ['Knees track over your toes', 'Tailbone heavy, chest tall', 'Soft shoulders, open arms', 'Sink with each exhale'],
    mistakes: [
      { text: 'Your knees fall in toward each other.', fix: 'Press your knees back so they point the same way as your toes.' },
      { text: 'You tip your chest forward.', fix: 'Lift your chest and let your tailbone point down.' },
    ],
    easier: 'Bend your knees only a little and rest your hands on your thighs.',
    harder: 'Lower your hips until your thighs approach parallel, or lift your heels for a few breaths.',
  },

  'warrior-1': {
    summary: 'A lunge-like standing pose with your hips facing forward and arms reaching up, stretching the front of your back hip while it builds leg strength.',
    setup: ['From standing, step one foot back about a leg length. Turn the back foot out slightly and press the heel down.'],
    steps: [
      'Bend your front knee over your ankle while the back leg stays long.',
      'Square your hips toward the front of the mat.',
      'Sweep your arms up overhead, shoulder width apart, and lift through your chest.',
    ],
    breathing: 'Breathe in to lengthen up through your arms, and breathe out to soften into the front knee.',
    cues: ['Front knee over the ankle', 'Back heel grounded', 'Hips face forward', 'Reach up, shoulders soft'],
    mistakes: [
      { text: 'Your back heel lifts and the back knee bends.', fix: 'Shorten your stance a little and press the whole back foot down.' },
      { text: 'You arch your lower back to reach up.', fix: 'Draw your belly in gently and let your tailbone lengthen down.' },
    ],
    easier: 'Lift the back heel and come into a high lunge, or keep your hands on your hips.',
    harder: 'Bend the front knee deeper and press your palms together overhead.',
  },

  'chair-pose': {
    summary: 'A strengthening squat hold where you sit back as if into a chair with your arms reaching up, building heat in your legs and back.',
    setup: ['Stand with your feet together or hip width apart, toes pointing forward.'],
    steps: [
      'Bend your knees and sit your hips back as if lowering into a chair.',
      'Reach your arms up alongside your ears and lengthen your spine on a slight lean.',
      'Keep your weight in your heels and stay, breathing steadily.',
    ],
    breathing: 'Breathe steadily through your nose. If the legs burn, slow the breath out a little longer.',
    cues: ['Sit back into your heels', 'Knees behind your toes', 'Arms reach, shoulders soft', 'Long spine, steady breath'],
    mistakes: [
      { text: 'Your knees push far past your toes.', fix: 'Shift your hips back and let your weight settle into your heels.' },
      { text: 'Your shoulders hunch up as you reach.', fix: 'Widen your arms or lower them to shoulder height.' },
    ],
    easier: 'Bend your knees only a little, or rest your hands on your thighs.',
    harder: 'Sit lower, as if the chair seat were dropping, and hold a few breaths longer.',
  },

  'triangle-pose': {
    summary: 'A wide standing pose that tips your upper body over your front leg, stretching your hamstrings and side body while it builds steady legs.',
    setup: ['Step your feet wide apart, front toes forward and back foot slightly in, both legs straight but not locked.'],
    steps: [
      'Reach your front arm forward over the front leg, sliding your hips back.',
      'Lower that hand to your shin or a block and reach your other arm up to the sky.',
      'Open your chest toward the side wall and breathe.',
    ],
    breathing: 'Breathe into your top ribs, and let each breath out make a little more space.',
    cues: ['Long legs, soft knees', 'Reach long, then tip', 'Hand rests on your shin', 'Open your chest wide'],
    mistakes: [
      { text: 'You collapse your weight into the bottom hand.', fix: 'Keep the hand light and hold yourself up with your legs and core.' },
      { text: 'You reach for the floor and round your side.', fix: 'Rest your hand higher on your shin so both sides stay long.' },
    ],
    easier: 'Rest your bottom hand on your thigh and keep your top hand on your hip.',
    harder: 'Lower your hand to a block outside your front foot and lengthen your top arm toward your ear.',
    safety: 'If your neck feels strained, look straight ahead or down instead of up.',
  },

  'standing-side-bend': {
    summary: 'A gentle standing stretch that lengthens one side of your body and then the other, easing tight ribs, waist and shoulders.',
    setup: ['Stand tall with your feet hip width apart and reach your arms up overhead, palms together or holding opposite wrists.'],
    steps: [
      'Breathe in to grow tall, then breathe out and lean your upper body to one side.',
      'Stay for a breath, feeling the stretch along the opposite side.',
      'Breathe in to come back to center, then repeat on the other side.',
    ],
    breathing: 'Breathe in to lengthen up, and breathe out as you lean over.',
    cues: ['Grow tall first', 'Lean, don’t collapse', 'Hips stay steady', 'Breathe into your ribs'],
    mistakes: [
      { text: 'You twist forward as you lean.', fix: 'Keep your chest facing forward as if between two panes of glass.' },
      { text: 'Your hips swing far out to the side.', fix: 'Keep your hips over your feet and let the bend come from your waist.' },
    ],
    easier: 'Keep one hand on your hip and reach only the other arm up and over.',
    harder: 'Hold each side for three slow breaths and reach a little further.',
  },

  // ---- Balance ---------------------------------------------------------------------------------
  'tree-pose-kickstand': {
    summary: 'A beginner tree pose with your toes on the floor like a kickstand, training your balance and ankle strength with a safety net built in.',
    setup: ['Stand tall near a wall or chair. Shift your weight onto one foot.'],
    steps: [
      'Turn your other knee out and rest that heel against your standing ankle, toes on the floor.',
      'Bring your palms together at your chest and find a still point to look at.',
      'Stay for a few breaths, then switch sides.',
    ],
    breathing: 'Breathe slowly and evenly; a calm breath makes balance easier.',
    cues: ['Find a still point', 'Press down through the standing foot', 'Knee opens to the side', 'Wobbles are welcome'],
    mistakes: [
      { text: 'You hold your breath to stay steady.', fix: 'Keep breathing slowly, and let small wobbles happen.' },
      { text: 'Your standing hip juts out to the side.', fix: 'Draw that hip in so it sits right over your foot.' },
    ],
    easier: 'Keep a hand on a wall or chair the whole time.',
    harder: 'Lift your foot off the floor and rest it on your inner calf.',
  },

  'tree-pose': {
    summary: 'A classic balance with one foot resting on your inner calf and your knee opening to the side, building steady ankles and a calm mind.',
    setup: ['Stand tall and shift your weight onto one foot. Keep a wall nearby if you like.'],
    steps: [
      'Lift your other foot and rest the sole on your inner calf, below or above the knee but never on it.',
      'Press foot and leg into each other and bring your palms to your chest.',
      'Stay for a few breaths with your eyes on a still point, then switch sides.',
    ],
    breathing: 'Breathe slowly and smoothly, letting your belly soften as you balance.',
    cues: ['Foot and leg press together', 'Never on the knee', 'Steady gaze', 'Tall and soft'],
    mistakes: [
      { text: 'Your foot rests right on the side of your knee.', fix: 'Place it on your calf or thigh, above or below the knee.' },
      { text: 'You lock your standing knee.', fix: 'Keep a tiny softness in the standing knee.' },
    ],
    easier: 'Lower your heel to your ankle with your toes on the floor, or hold a wall.',
    harder: 'Place your foot on your inner thigh and grow your arms up like branches.',
    safety: 'If you are pregnant, stand next to a wall and keep a hand on it.',
  },

  'warrior-3-chair': {
    summary: 'A supported warrior three: hinge forward with your hands on a chair while one leg lifts behind you, building balance and strong glutes.',
    setup: ['Stand facing the back of a sturdy chair, about a leg length away, hands resting on the top.'],
    steps: [
      'Hinge forward from your hips and lengthen your spine toward the chair.',
      'Lift one leg straight back until your body makes a long line from head to heel.',
      'Keep your hips level and breathe, then lower the leg and switch sides.',
    ],
    breathing: 'Breathe steadily, and lengthen through your head and back heel on each breath out.',
    cues: ['Long line, head to heel', 'Hips stay level', 'Light hands on the chair', 'Press out through the heel'],
    mistakes: [
      { text: 'Your lifted hip opens up toward the ceiling.', fix: 'Point the lifted toes down toward the floor so your hips stay square.' },
      { text: 'You round your back to reach the chair.', fix: 'Move the chair closer and keep your spine long.' },
    ],
    easier: 'Lift the back leg only a little, with the toes hovering just off the floor.',
    harder: 'Lift your hands a few inches off the chair for a breath at a time.',
  },

  'tree-pose-full': {
    summary: 'Tree pose with your foot on your inner thigh and arms reaching up like branches, a balance that asks for focus and quiet breathing.',
    setup: ['Stand tall and shift your weight onto one foot, with a wall nearby if you like.'],
    steps: [
      'Place the sole of your other foot high on your inner thigh, knee opening to the side.',
      'Press foot and thigh into each other, then reach your arms up overhead.',
      'Stay steady for a few breaths, then lower with control and switch sides.',
    ],
    breathing: 'Breathe slowly through your nose and keep the breath smooth as you reach up.',
    cues: ['Foot presses, thigh presses back', 'Reach up like branches', 'Ribs soft, belly calm', 'Steady gaze'],
    mistakes: [
      { text: 'Your lifted foot keeps sliding down.', fix: 'Press foot and thigh firmly together, or place the foot on your calf.' },
      { text: 'Your ribs flare as your arms go up.', fix: 'Soften your front ribs down and widen your arms if needed.' },
    ],
    easier: 'Keep your hands at your chest, or rest your foot on your calf.',
    harder: 'Hold for a few more breaths, or try closing your eyes for a moment near a wall.',
  },

  'warrior-3': {
    summary: 'A free-standing balance where your body and one leg make a long line parallel to the floor, strengthening your glutes, back and focus.',
    setup: ['Stand on one leg with a soft standing knee and your arms reaching forward or resting on your hips.'],
    steps: [
      'Hinge forward from your hips as your other leg lifts straight back.',
      'Stop when your body and lifted leg form a long line, or earlier if you wobble.',
      'Keep both hips level, breathe, then rise slowly and switch sides.',
    ],
    breathing: 'Breathe steadily and keep the breath long as you reach in both directions.',
    cues: ['One long line', 'Toes point down', 'Soft standing knee', 'Reach forward and back'],
    mistakes: [
      { text: 'You tip forward too far and lose your balance.', fix: 'Hinge only as far as you can stay steady, even halfway.' },
      { text: 'Your lifted hip rolls open.', fix: 'Turn the lifted toes to the floor and level your hips.' },
    ],
    easier: 'Rest your hands on a chair back or wall, or keep the back toes touching the floor.',
    harder: 'Reach your arms forward alongside your ears and hold a few breaths longer.',
  },

  // ---- Hip openers -----------------------------------------------------------------------------
  'low-lunge': {
    summary: 'A kneeling lunge that sinks your hips forward and lifts your arms, opening the front of your back hip and thigh.',
    setup: ['From all fours, step one foot forward between your hands. Lower the back knee to the mat, padded if you like.'],
    steps: [
      'Stack your front knee over your ankle and lift your chest.',
      'Gently ease your hips forward until you feel a stretch at the front of the back hip.',
      'Reach your arms up and stay for a few breaths, then switch sides.',
    ],
    breathing: 'Breathe in to lift your chest, and breathe out to let your hips sink a little.',
    cues: ['Front knee over the ankle', 'Hips ease forward', 'Lift through your chest', 'Soft shoulders'],
    mistakes: [
      { text: 'You arch your lower back to go deeper.', fix: 'Draw your belly in and lengthen your tailbone down.' },
      { text: 'Your front knee shoots past your toes.', fix: 'Step the front foot further forward.' },
    ],
    easier: 'Keep your hands on your front thigh or on blocks beside your foot.',
    harder: 'Tuck the back toes and lift the back knee for a high lunge.',
    safety: 'Pad the back knee with a folded blanket if it feels sensitive.',
  },

  'lizard-lunge': {
    summary: 'A deep lunge with both hands inside your front foot, stretching your hip flexors and inner thighs.',
    setup: ['From a low lunge, place both hands on the floor inside your front foot. Keep the back knee down.'],
    steps: [
      'Walk your front foot slightly out to the side.',
      'Let your hips sink low and forward while your chest stays long.',
      'Stay and breathe, then switch sides.',
    ],
    breathing: 'Breathe slowly into your hips and let them soften on each breath out.',
    cues: ['Hands inside the front foot', 'Hips heavy', 'Long spine', 'Soften on the exhale'],
    mistakes: [
      { text: 'Your shoulders hunch and your back rounds.', fix: 'Put your hands on blocks or books to bring the floor closer.' },
      { text: 'You push into a sharp feeling in the hip.', fix: 'Back off to a gentle stretch you can breathe through.' },
    ],
    easier: 'Keep your hands on blocks and your hips higher.',
    harder: 'Lower onto your forearms if that feels good in your hips.',
  },

  'pigeon-pose': {
    summary: 'A seated hip opener with your front shin folded on the mat and your back leg long, stretching your outer hip and glutes.',
    setup: ['From all fours, bring one knee forward behind your wrist and angle the shin across the mat.', 'Slide your back leg straight behind you.'],
    steps: [
      'Square your hips toward the front, with a cushion under the front hip if it lifts.',
      'Rest your hands on the floor or your front leg and lift your chest tall.',
      'Breathe here, then switch sides.',
    ],
    breathing: 'Breathe deeply into the front hip and let each breath out soften it.',
    cues: ['Hips square and level', 'Cushion under the hip', 'Chest tall', 'Breathe into the hip'],
    mistakes: [
      { text: 'Your front hip floats up and you tip to one side.', fix: 'Slide a cushion or folded blanket under that hip.' },
      { text: 'You feel a pull in the front knee.', fix: 'Bring the front heel closer to you, or do the reclined pigeon on your back instead.' },
    ],
    easier: 'Lie on your back and cross one ankle over the opposite knee for a reclined pigeon.',
    harder: 'Fold forward over the front leg and rest on your forearms.',
    safety: 'Stop if you feel any pain in your knee.',
  },

  'sleeping-pigeon': {
    summary: 'Pigeon pose folded forward, a deep, restful stretch for your outer hips and glutes.',
    setup: ['Start in pigeon pose with your hips supported by a cushion if needed.'],
    steps: [
      'Walk your hands forward and fold over your front leg.',
      'Rest on your forearms or stack your hands under your forehead.',
      'Let your body get heavy and breathe slowly, then switch sides.',
    ],
    breathing: 'Breathe long and slow; each breath out is an invitation to let go a little more.',
    cues: ['Fold slowly forward', 'Rest your forehead', 'Hips heavy and even', 'Long, easy breaths'],
    mistakes: [
      { text: 'You force your chest to the floor.', fix: 'Stack your forearms or a pillow under your head so you can relax.' },
      { text: 'You hold your breath in the stretch.', fix: 'Back off until you can breathe slowly and easily.' },
    ],
    easier: 'Stay upright in pigeon, or do the reclined pigeon on your back.',
    harder: 'Stay a few breaths longer and let your arms reach forward.',
    safety: 'Stop if you feel any pain in your knee.',
  },

  'butterfly-pose': {
    summary: 'A seated hip opener with the soles of your feet together and knees falling open, easing your inner thighs and hips.',
    setup: ['Sit tall on the mat, or on a folded blanket, with the soles of your feet together and your knees open.'],
    steps: [
      'Hold your feet or ankles and lengthen up through your spine.',
      'Let your knees fall open without pushing them down.',
      'Breathe here, folding forward a little if it feels good.',
    ],
    breathing: 'Breathe into your belly and hips, and let your knees sink on each breath out.',
    cues: ['Sit tall on your sit bones', 'Knees fall open', 'Shoulders relaxed', 'Let gravity do the work'],
    mistakes: [
      { text: 'You press your knees down with your hands.', fix: 'Let gravity open your hips slowly instead.' },
      { text: 'Your lower back rounds and you slump.', fix: 'Sit on a folded blanket so your hips are higher than your knees.' },
    ],
    easier: 'Move your feet further from your body and put cushions under your knees.',
    harder: 'Draw your heels closer and fold forward with a long spine.',
  },

  // ---- Forward folds --------------------------------------------------------------------------
  'standing-forward-fold': {
    summary: 'A relaxing standing fold where your upper body hangs heavy, releasing your hamstrings, back and neck.',
    setup: ['Stand with your feet hip width apart and a generous bend in your knees.'],
    steps: [
      'Fold forward from your hips and let your belly rest toward your thighs.',
      'Let your head and arms hang heavy, or hold opposite elbows.',
      'Sway gently if you like, then roll up slowly with your head coming up last.',
    ],
    breathing: 'Breathe slowly and let each breath out release your neck and shoulders a little more.',
    cues: ['Bend your knees generously', 'Head hangs heavy', 'Belly toward thighs', 'Roll up slowly'],
    mistakes: [
      { text: 'You lock your knees to reach the floor.', fix: 'Keep your knees bent and let your back be the thing that relaxes.' },
      { text: 'You stand up too fast and feel dizzy.', fix: 'Roll up slowly, one part of your spine at a time.' },
    ],
    easier: 'Rest your hands on your thighs or a chair seat and fold only halfway.',
    harder: 'Straighten your legs a little more while keeping your belly close to your thighs.',
  },

  'seated-forward-fold': {
    summary: 'A calming seated fold over long legs that stretches your hamstrings and the back of your body.',
    setup: ['Sit tall with your legs straight out in front of you, knees soft. Sit on a folded blanket if your back rounds.'],
    steps: [
      'Breathe in to lengthen your spine and reach your arms up.',
      'Breathe out and fold forward from your hips, holding your shins, ankles or feet.',
      'Stay, letting your back round gently and your breath slow down.',
    ],
    breathing: 'Breathe in to lengthen, and breathe out to fold a little deeper without forcing.',
    cues: ['Lengthen, then fold', 'Soft knees are fine', 'Hold your shins', 'Slow, easy breaths'],
    mistakes: [
      { text: 'You yank yourself forward with your arms.', fix: 'Let the breath and gravity take you, resting your hands where they land.' },
      { text: 'You lock your knees and strain behind them.', fix: 'Bend your knees and rest a cushion underneath.' },
    ],
    easier: 'Bend your knees deeply and rest your chest on a pillow on your thighs.',
    harder: 'Loop a strap or towel around your feet and fold with a longer spine.',
  },

  'down-dog': {
    summary: 'An upside down V shape that stretches your hamstrings, calves and shoulders while it strengthens your arms and back.',
    setup: ['Start on hands and knees with your hands a little ahead of your shoulders, fingers spread wide.'],
    steps: [
      'Tuck your toes and lift your hips up and back.',
      'Keep your knees bent at first so your back can lengthen.',
      'Press the floor away, let your head hang between your arms, and breathe.',
    ],
    breathing: 'Breathe steadily, and send your hips up and back a little more each breath out.',
    cues: ['Spread your fingers wide', 'Hips up and back', 'Bend your knees', 'Head relaxed between arms'],
    mistakes: [
      { text: 'You force your heels down and round your back.', fix: 'Bend your knees so your spine can stay long.' },
      { text: 'Your weight dumps into your wrists.', fix: 'Press through your whole hand and send your weight back toward your legs.' },
    ],
    easier: 'Keep your knees deeply bent, or do puppy pose with your knees down.',
    harder: 'Pedal your feet, then slowly straighten your legs while your back stays long.',
    safety: 'Come down to child’s pose whenever you need a rest.',
  },

  'half-splits': {
    summary: 'A kneeling hamstring stretch with one leg long in front of you, folding forward to lengthen the back of the leg.',
    setup: ['From a low lunge, shift your hips back over your back knee and straighten your front leg, toes up.'],
    steps: [
      'Place your hands on the floor or blocks beside your front leg.',
      'Lengthen your spine, then fold forward over the straight leg.',
      'Stay and breathe, then switch sides.',
    ],
    breathing: 'Breathe in to lengthen your spine, and breathe out to fold a little further.',
    cues: ['Hips over the back knee', 'Flex the front foot', 'Lead with your chest', 'Soft front knee'],
    mistakes: [
      { text: 'You round your back to get your head down.', fix: 'Keep your spine long and use blocks under your hands.' },
      { text: 'You lock the front knee hard.', fix: 'Keep a small bend in the front knee.' },
    ],
    easier: 'Bend the front knee and keep your hands on blocks or books.',
    harder: 'Walk your hands forward and fold lower with a long spine.',
  },

  // ---- Backbends -----------------------------------------------------------------------------
  'sphinx-pose': {
    summary: 'A gentle backbend lying on your belly, propped on your forearms, that opens your chest and eases a stiff back.',
    setup: ['Lie on your belly with your legs long. Place your elbows under your shoulders and forearms forward.'],
    steps: [
      'Press your forearms down and lift your chest.',
      'Draw your shoulders back and away from your ears.',
      'Relax your legs and glutes and breathe into your chest.',
    ],
    breathing: 'Breathe slowly into your chest and belly, letting your lower back stay relaxed.',
    cues: ['Elbows under shoulders', 'Lift your heart', 'Shoulders away from ears', 'Legs relaxed'],
    mistakes: [
      { text: 'You sink your head between your shoulders.', fix: 'Press your forearms down and lengthen up through your neck.' },
      { text: 'You squeeze your glutes hard.', fix: 'Let your legs and hips relax heavy on the mat.' },
    ],
    easier: 'Slide your elbows further forward to lower your chest.',
    harder: 'Stay a few breaths longer, or move on to cobra.',
    safety: 'Rest flat on your belly if you feel any pinching in your lower back.',
  },

  'bridge-pose': {
    summary: 'A lying backbend where your hips lift toward the ceiling, strengthening your glutes and opening your chest and hips.',
    setup: ['Lie on your back with your knees bent and feet flat, hip width apart, close to your hips. Arms rest by your sides.'],
    steps: [
      'Press your feet into the floor and lift your hips up.',
      'Roll your shoulders under and let your chest lift toward your chin.',
      'Hold and breathe, then lower slowly, one part of your back at a time.',
    ],
    breathing: 'Breathe steadily while you hold, and breathe out as you lower down.',
    cues: ['Press through your feet', 'Knees point forward', 'Lift your hips', 'Lower slowly'],
    mistakes: [
      { text: 'Your knees splay apart.', fix: 'Keep your knees over your feet, as if holding a block between them.' },
      { text: 'You push up from your neck.', fix: 'Keep your neck long and still, with the weight on your shoulders.' },
    ],
    easier: 'Lift your hips only a little, or rest your lower back on a cushion.',
    harder: 'Interlace your hands under your back and lift a little higher.',
    safety: 'Keep your head still while your hips are lifted.',
  },

  'locust-pose': {
    summary: 'A belly-down backbend where your chest, arms and legs lift together, strengthening the whole back of your body.',
    setup: ['Lie on your belly with your arms by your sides, palms down, and your forehead resting on the mat.'],
    steps: [
      'Breathe in and lift your chest, arms and legs a little way off the mat.',
      'Reach your fingertips back toward your feet and keep your neck long.',
      'Hold for a breath, then lower slowly and rest.',
    ],
    breathing: 'Breathe in to lift, hold the breath moving softly, and breathe out to lower.',
    cues: ['Lift a little, not a lot', 'Reach back with your hands', 'Neck long', 'Lower with control'],
    mistakes: [
      { text: 'You crank your head up to look forward.', fix: 'Gaze at the floor just ahead of you.' },
      { text: 'You lift so high your lower back pinches.', fix: 'Lift less and lengthen more.' },
    ],
    easier: 'Lift only your chest, or only your legs, one at a time.',
    harder: 'Hold each lift for three slow breaths.',
  },

  // ---- Twist and rest ---------------------------------------------------------------------------
  'supine-twist': {
    summary: 'A restful twist lying on your back with your knees falling to one side, easing your spine and lower back.',
    setup: ['Lie on your back with your knees bent and feet on the mat. Open your arms wide in a T.'],
    steps: [
      'Let both knees fall slowly to one side.',
      'Turn your head the other way if your neck enjoys it.',
      'Rest and breathe, then bring your knees back through the middle to the other side.',
    ],
    breathing: 'Breathe slowly into your belly and ribs, and let the twist soften on each breath out.',
    cues: ['Knees drift to one side', 'Shoulders heavy on the mat', 'Belly soft', 'Slow, easy breaths'],
    mistakes: [
      { text: 'Your top shoulder lifts high off the floor.', fix: 'Put a pillow under your knees so your shoulder can stay down.' },
      { text: 'You force your knees to the floor.', fix: 'Let them rest wherever they land, supported if needed.' },
    ],
    easier: 'Rest your knees on a pillow or cushion.',
    harder: 'Straighten your top leg and hold the foot or a strap.',
  },

  'happy-baby': {
    summary: 'A playful lying hip opener where you hold your shins or feet and let your knees open toward your armpits.',
    setup: ['Lie on your back and draw your knees toward your chest.'],
    steps: [
      'Open your knees wider than your body and stack your ankles over your knees.',
      'Hold your shins, ankles or the outside of your feet.',
      'Gently draw your knees down toward the floor and rock side to side if you like.',
    ],
    breathing: 'Breathe into your lower belly and let your lower back sink on each breath out.',
    cues: ['Ankles over knees', 'Hold shins or feet', 'Lower back heavy', 'Gentle rocking'],
    mistakes: [
      { text: 'Your head and shoulders lift off the mat.', fix: 'Hold your shins instead of your feet so your head can rest.' },
      { text: 'You yank your knees down.', fix: 'Pull gently and let your hips open with time.' },
    ],
    easier: 'Hold one leg at a time, with the other foot on the floor.',
    harder: 'Hold the outer edges of your feet and press your feet up into your hands.',
  },

  'knees-to-chest': {
    summary: 'A soothing lying stretch where you hug your knees toward your chest, releasing your lower back.',
    setup: ['Lie on your back and draw both knees toward your chest.'],
    steps: [
      'Wrap your arms around your shins or hold behind your knees.',
      'Gently hug your knees in as you breathe out, and soften as you breathe in.',
      'Rock gently side to side if it feels good.',
    ],
    breathing: 'Breathe out to hug your knees in, and breathe in to let them float away a little.',
    cues: ['Hug your knees in', 'Head heavy on the mat', 'Soften your lower back', 'Rock gently'],
    mistakes: [
      { text: 'You lift your head and tense your neck.', fix: 'Keep your head resting on the mat.' },
      { text: 'You squeeze hard and hold your breath.', fix: 'Hug gently, in time with slow breaths.' },
    ],
    easier: 'Hug one knee at a time with the other foot on the floor.',
    harder: 'Stay longer and draw small circles with your knees.',
  },

  'reclined-butterfly': {
    summary: 'A restorative pose lying on your back with the soles of your feet together and knees falling open, gently opening your hips and chest.',
    setup: ['Lie on your back, bring the soles of your feet together and let your knees fall open. Rest a pillow under each knee if you like.'],
    steps: [
      'Rest your arms by your sides or place one hand on your belly and one on your heart.',
      'Let your hips and inner thighs soften.',
      'Stay, breathing slowly, for as long as it feels good.',
    ],
    breathing: 'Breathe slowly into your belly and feel it rise and fall under your hands.',
    cues: ['Knees fall open', 'Pillows under knees', 'Hands on belly and heart', 'Let everything soften'],
    mistakes: [
      { text: 'You feel a strain in your inner thighs.', fix: 'Support your knees with pillows so you can fully relax.' },
      { text: 'Your lower back arches off the mat.', fix: 'Slide your feet a little further from your hips.' },
    ],
    easier: 'Move your feet further away and support both knees well.',
    harder: 'Rest a pillow along your spine to open your chest a little more.',
  },

  'legs-up-the-wall': {
    summary: 'A deeply restful pose lying with your legs up a wall, calming your nervous system and easing tired legs.',
    setup: ['Sit sideways next to a wall, then lie back and swing your legs up the wall.', 'Shuffle your hips as close to the wall as feels easy.'],
    steps: [
      'Let your legs rest against the wall with your knees soft.',
      'Rest your arms by your sides, palms up.',
      'Close your eyes and stay, breathing slowly.',
    ],
    breathing: 'Breathe slowly and let your breath out be a little longer than your breath in.',
    cues: ['Legs rest on the wall', 'Arms heavy, palms up', 'Soft belly', 'Long, slow breath out'],
    mistakes: [
      { text: 'Your hamstrings pull and you can’t relax.', fix: 'Move your hips further from the wall and bend your knees.' },
      { text: 'Your feet tingle after a while.', fix: 'Bend your knees and place your feet on the wall, or come down to rest.' },
    ],
    easier: 'Rest your calves on a chair seat instead of the wall.',
    harder: 'Stay a few minutes longer and let your legs widen into a gentle V.',
    safety: 'If you are pregnant, rest on your side instead of lying flat for long.',
  },

  savasana: {
    summary: 'The final resting pose. Lie still and let your body absorb your practice while your breath and mind settle.',
    setup: ['Lie on your back with your legs long and slightly apart, arms resting a little away from your sides, palms up.'],
    steps: [
      'Close your eyes and let your whole body get heavy.',
      'Let your breath be natural, without changing it.',
      'Rest here, and when it’s time, roll to one side before you sit up slowly.',
    ],
    breathing: 'Let your breath come and go on its own, soft and easy.',
    cues: ['Let your body get heavy', 'Soften your face and jaw', 'Nothing to do', 'Just breathe'],
    mistakes: [
      { text: 'Your lower back aches when your legs are straight.', fix: 'Bend your knees, or slide a pillow under them.' },
      { text: 'You jump up as soon as it ends.', fix: 'Roll to your side first and sit up slowly.' },
    ],
    easier: 'Put a pillow under your knees and a folded towel under your head.',
    harder: 'Stay a little longer and gently scan from your toes to your head, relaxing each part.',
    safety: 'If you are pregnant, rest on your left side with a pillow between your knees instead.',
  },

  'easy-seat-breath': {
    summary: 'A comfortable cross-legged seat for arriving, settling your breath and noticing how you feel.',
    setup: ['Sit on the mat or a folded blanket with your legs crossed and your hands resting on your knees.'],
    steps: [
      'Lengthen up through your spine and relax your shoulders.',
      'Close your eyes or soften your gaze to the floor.',
      'Breathe slowly through your nose, letting each breath out be a little longer.',
    ],
    breathing: 'Breathe in through your nose, and breathe out slowly, a little longer than the breath in.',
    cues: ['Sit tall and soft', 'Shoulders melt down', 'Long breath out', 'Notice how you feel'],
    mistakes: [
      { text: 'You slump and your back aches.', fix: 'Sit on a folded blanket so your hips are higher than your knees.' },
      { text: 'Your knees float high and strain.', fix: 'Rest cushions under your knees.' },
    ],
    easier: 'Sit on a chair with your feet flat on the floor.',
    harder: 'Sit a little longer and count ten slow breaths, starting again if you lose count.',
  },

  // ---- Gentle mobility ---------------------------------------------------------------------------
  'neck-release': {
    summary: 'A seated release for a tight neck and shoulders: slow ear to shoulder tilts with soft, rolling shoulders.',
    setup: ['Sit tall on the mat or a chair, shoulders relaxed and hands resting on your knees.'],
    steps: [
      'Slowly tip your right ear toward your right shoulder and breathe.',
      'Bring your head back to center, then tip your left ear toward your left shoulder.',
      'Roll your shoulders back a few times between sides.',
    ],
    breathing: 'Breathe slowly and let your shoulders drop on each breath out.',
    cues: ['Ear toward shoulder', 'Shoulders stay low', 'Slow and gentle', 'Breathe into tight spots'],
    mistakes: [
      { text: 'You lift your shoulder to meet your ear.', fix: 'Let the shoulder drop away as your head tips.' },
      { text: 'You pull your head with your hand.', fix: 'Let the weight of your head do the work.' },
    ],
    easier: 'Make the movements smaller, staying where it feels easy.',
    harder: 'Rest the opposite hand on the floor beside you and reach it away a little.',
    safety: 'Move slowly and skip any position that causes tingling or pain.',
  },

  'seated-side-bend': {
    summary: 'A seated stretch that reaches one arm up and over, lengthening your side body and easing tight ribs and shoulders.',
    setup: ['Sit cross-legged or on a chair, tall through your spine.'],
    steps: [
      'Place one hand on the floor beside you and reach the other arm up.',
      'Breathe out and lean over toward the hand on the floor.',
      'Breathe in to come back up, then switch sides.',
    ],
    breathing: 'Breathe in to reach up, and breathe out as you lean over.',
    cues: ['Reach up, then over', 'Both sit bones grounded', 'Breathe into your ribs', 'Chest stays open'],
    mistakes: [
      { text: 'Your opposite hip lifts off the floor.', fix: 'Keep both sit bones heavy and lean a little less.' },
      { text: 'You collapse forward.', fix: 'Keep your chest facing forward and reach up before you reach over.' },
    ],
    easier: 'Keep the movement small and rest the top hand on your head.',
    harder: 'Hold each side for three slow breaths.',
  },

  'puppy-pose': {
    summary: 'A shoulder and upper back opener with your hips over your knees and your chest melting toward the mat.',
    setup: ['Start on hands and knees with your hips over your knees.'],
    steps: [
      'Walk your hands forward, keeping your hips stacked over your knees.',
      'Let your chest melt toward the mat and rest your forehead down.',
      'Breathe into your upper back and shoulders.',
    ],
    breathing: 'Breathe slowly into your upper back, and let your chest soften on each breath out.',
    cues: ['Hips over knees', 'Arms long', 'Chest melts down', 'Forehead rests'],
    mistakes: [
      { text: 'Your hips drift back toward your heels.', fix: 'Keep your hips right over your knees.' },
      { text: 'You crunch your lower back.', fix: 'Draw your belly in gently and let the stretch be in your shoulders.' },
    ],
    easier: 'Rest your forehead on a pillow, or slide back into child’s pose.',
    harder: 'Rest your chin on the mat if it feels comfortable for your neck.',
  },

  // ---- Gentle core -----------------------------------------------------------------------------
  'toe-taps': {
    summary: 'A gentle core exercise lying on your back, lowering one foot at a time to tap the mat while your back stays steady.',
    setup: ['Lie on your back with your knees bent over your hips and your shins parallel to the floor, arms by your sides.'],
    steps: [
      'Keep your lower back gently resting on the mat.',
      'Slowly lower one foot to tap the floor, keeping the knee bent.',
      'Bring it back up and tap with the other foot.',
    ],
    breathing: 'Breathe out as your foot lowers, and breathe in as it returns.',
    cues: ['Back rests on the mat', 'Lower slowly', 'Knee stays bent', 'Breathe out to tap'],
    mistakes: [
      { text: 'Your lower back arches off the mat.', fix: 'Make the movement smaller and draw your belly in.' },
      { text: 'You swing the leg quickly.', fix: 'Slow down so your core does the work.' },
    ],
    easier: 'Keep one foot on the floor and lift and lower the other.',
    harder: 'Tap with both feet together, or lower more slowly.',
  },

  'boat-pose-easy': {
    summary: 'A gentle core hold sitting tall, leaning back slightly with your feet on the floor and hands behind your thighs.',
    setup: ['Sit with your knees bent and feet flat on the floor, holding the backs of your thighs.'],
    steps: [
      'Sit tall and lean back slightly until your belly wakes up.',
      'Keep your chest lifted and your spine long.',
      'Hold and breathe, then rest.',
    ],
    breathing: 'Breathe steadily and keep your belly gently drawn in.',
    cues: ['Lift your chest', 'Lean back a little', 'Long spine', 'Steady breath'],
    mistakes: [
      { text: 'You round your back and slump.', fix: 'Lift your chest and lean back less.' },
      { text: 'You hold your breath.', fix: 'Keep breathing slowly through your nose.' },
    ],
    easier: 'Lean back only a little and keep your hands holding your legs.',
    harder: 'Lift your feet off the floor for a few breaths, moving toward boat pose.',
  },

  'boat-pose': {
    summary: 'A balancing core hold on your sit bones with your shins lifted and arms reaching forward, strengthening your belly and hip flexors.',
    setup: ['Sit with your knees bent and your hands behind your thighs.'],
    steps: [
      'Lean back and lift your feet until your shins are parallel to the floor.',
      'Reach your arms forward alongside your legs.',
      'Keep your chest lifted and breathe, then lower your feet to rest.',
    ],
    breathing: 'Breathe steadily, keeping the breath moving even as your belly works.',
    cues: ['Chest lifted', 'Shins parallel to the floor', 'Arms reach forward', 'Breathe steadily'],
    mistakes: [
      { text: 'Your back rounds and you sink.', fix: 'Hold your thighs and lift your chest.' },
      { text: 'You grip with your neck and shoulders.', fix: 'Soften your shoulders and keep your gaze forward.' },
    ],
    easier: 'Keep your toes on the floor, or hold your thighs.',
    harder: 'Straighten your legs a little while keeping your chest lifted.',
    safety: 'Rest whenever your lower back starts to work instead of your belly.',
  },
}
