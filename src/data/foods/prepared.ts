import { defineFoods } from './define'

/**
 * Restaurant, deli, takeout and home-cooked dishes. Values per 100 g, from USDA FNDDS / SR Legacy
 * mixed-dish entries or computed from typical recipes.
 */
export const PREPARED_FOODS = defineFoods('prepared', [
  // ---- Pizza, burgers, sandwiches ---------------------------------------------------
  {
    id: 'pizza-cheese', name: 'Pizza, cheese',
    aka: ['cheese pizza', 'pizza slice', 'margherita pizza', 'plain pizza'],
    n: [266, 11.4, 33.3, 9.7, 2.3, 3.6, 598], sv: [['1 slice (14" pie)', 107], ['2 slices', 214]], k: 'dairy', al: ['wheat', 'milk'],
  },
  {
    id: 'pizza-pepperoni', name: 'Pizza, pepperoni',
    aka: ['pepperoni pizza', 'pizza slice'],
    n: [298, 12.2, 32.5, 13.0, 2.3, 3.6, 683], sv: [['1 slice (14" pie)', 113], ['2 slices', 226]], k: 'nonkosher', al: ['wheat', 'milk'],
  },
  {
    id: 'cheeseburger', name: 'Cheeseburger (fast food)',
    aka: ['cheese burger', 'burger with cheese'],
    n: [263, 13.6, 27.0, 11.4, 1.3, 6.0, 620], sv: [['1 cheeseburger', 120]], k: 'nonkosher', al: ['wheat', 'milk'],
  },
  {
    id: 'hamburger', name: 'Hamburger on a bun',
    aka: ['burger', 'beef burger', 'hamburger sandwich'],
    n: [254, 13.0, 29.0, 9.5, 1.3, 6.0, 500], sv: [['1 burger', 110]], k: 'meat', al: ['wheat'],
  },
  {
    id: 'hot-dog-in-bun', name: 'Hot dog in a bun',
    aka: ['hot dog sandwich', 'frank in a bun'],
    n: [301, 10.7, 26.0, 16.7, 1.0, 3.5, 736], sv: [['1 hot dog', 93]], k: 'meat', al: ['wheat'],
  },
  {
    id: 'turkey-sandwich', name: 'Turkey sandwich on whole wheat',
    aka: ['deli sandwich', 'turkey sub', 'sandwich'],
    n: [140, 12.5, 17.5, 2.1, 2.5, 3.0, 660], sv: [['1 sandwich', 185]], k: 'meat', al: ['wheat'],
  },
  {
    id: 'pastrami-sandwich', name: 'Pastrami sandwich on rye',
    aka: ['deli sandwich', 'pastrami on rye', 'corned beef sandwich'],
    n: [220, 14.0, 15.0, 11.5, 1.5, 1.0, 900], sv: [['1 sandwich', 250]], k: 'meat', al: ['wheat'],
  },
  {
    id: 'grilled-cheese', name: 'Grilled cheese sandwich',
    aka: ['toasted cheese', 'cheese toastie', 'grilled cheese'],
    n: [340, 12.1, 29.0, 19.8, 1.3, 4.0, 980], sv: [['1 sandwich', 120]], k: 'dairy', al: ['wheat', 'milk'],
  },
  {
    id: 'pbj-sandwich', name: 'Peanut butter and jelly sandwich',
    aka: ['pb&j', 'pbj', 'peanut butter sandwich'],
    n: [349, 13.8, 40.9, 15.8, 5.1, 13.4, 383], sv: [['1 sandwich', 116]], k: 'pareve', al: ['wheat', 'peanuts'],
  },
  {
    id: 'bagel-cream-cheese', name: 'Bagel with cream cheese',
    aka: ['bagel and schmear', 'bagel with schmear'],
    n: [276, 9.1, 40.1, 8.9, 1.6, 4.5, 406], sv: [['1 bagel', 135]], k: 'dairy', al: ['wheat', 'milk'],
  },
  {
    id: 'bagel-lox', name: 'Bagel with lox and cream cheese',
    aka: ['lox and bagel', 'bagel and lox', 'smoked salmon bagel'],
    n: [240, 11.2, 31.0, 7.8, 1.3, 3.6, 493], sv: [['1 bagel', 175]], k: 'dairy', diet: 'neither', al: ['wheat', 'milk', 'fish'],
  },
  {
    id: 'quesadilla-cheese', name: 'Cheese quesadilla',
    aka: ['quesadilla'],
    n: [348, 15.5, 29.0, 18.8, 1.8, 1.5, 610], sv: [['1 quesadilla (8")', 128]], k: 'dairy', al: ['wheat', 'milk'],
  },
  {
    id: 'burrito-bean-cheese', name: 'Burrito, bean and cheese',
    aka: ['bean burrito', 'burrito'],
    n: [190, 7.4, 27.0, 6.0, 4.5, 1.5, 520], sv: [['1 burrito', 200]], k: 'dairy', al: ['wheat', 'milk'],
  },
  {
    id: 'burrito-chicken', name: 'Burrito, chicken with rice and beans (no cheese)',
    aka: ['chicken burrito', 'burrito'],
    n: [170, 10.0, 22.0, 4.5, 2.8, 1.0, 450], sv: [['1 burrito', 300]], k: 'meat', al: ['wheat'],
  },
  {
    id: 'chicken-shawarma', name: 'Chicken shawarma (meat only)',
    aka: ['shawarma', 'shwarma', 'chicken gyro meat'],
    n: [205, 24.0, 2.0, 11.5, 0.3, 0.5, 500], sv: [['1 portion (5 oz)', 140], ['4 oz', 113]], k: 'meat',
  },
  {
    id: 'shawarma-pita', name: 'Chicken shawarma in pita with tahini',
    aka: ['shawarma sandwich', 'shawarma pita', 'chicken pita'],
    n: [210, 13.0, 17.0, 10.0, 1.8, 2.0, 480], sv: [['1 pita sandwich', 300]], k: 'meat', al: ['wheat', 'sesame'],
  },
  {
    id: 'chicken-nuggets', name: 'Chicken nuggets',
    aka: ['nuggets', 'chicken tenders', 'chicken fingers'],
    n: [296, 15.3, 15.5, 19.5, 0.9, 0.2, 600], sv: [['6 nuggets', 96], ['1 nugget', 16]], k: 'meat', al: ['wheat'],
  },
  {
    id: 'chicken-schnitzel', name: 'Chicken schnitzel (breaded, fried)',
    aka: ['schnitzel', 'breaded chicken cutlet', 'chicken cutlet'],
    n: [255, 24.0, 10.5, 13.0, 0.5, 0.5, 400], sv: [['1 cutlet', 150]], k: 'meat', al: ['wheat', 'egg'],
  },
  // ---- Salads -----------------------------------------------------------------------
  {
    id: 'caesar-salad', name: 'Caesar salad',
    aka: ['caesar', 'romaine salad with dressing'],
    n: [183, 4.8, 10.1, 14.5, 1.6, 1.8, 437], sv: [['1 side salad', 155], ['1 entree salad', 300]], k: 'dairy', diet: 'neither', al: ['milk', 'egg', 'fish', 'wheat'],
  },
  {
    id: 'chicken-salad', name: 'Chicken salad (with mayo)',
    aka: ['chicken mayo', 'chicken salad sandwich filling'],
    n: [230, 15.5, 3.5, 17.0, 0.3, 1.5, 400], sv: [['1/2 cup', 110]], k: 'meat', al: ['egg'],
  },
  {
    id: 'tuna-salad', name: 'Tuna salad (with mayo)',
    aka: ['tuna mayo', 'tuna fish salad'],
    n: [187, 16.0, 9.4, 9.3, 0, 2.0, 402], sv: [['1/2 cup', 102]], k: 'fish', al: ['fish', 'egg'],
  },
  {
    id: 'egg-salad', name: 'Egg salad',
    aka: ['egg mayo', 'egg salad sandwich filling'],
    n: [220, 9.5, 1.5, 19.5, 0, 1.0, 330], sv: [['1/2 cup', 110]], k: 'pareve', al: ['egg'],
  },
  {
    id: 'israeli-salad', name: 'Israeli salad (cucumber-tomato)',
    aka: ['chopped salad', 'shirazi salad', 'cucumber tomato salad'],
    n: [50, 0.8, 4.0, 3.5, 1.0, 2.2, 150], sv: [['1 cup', 150]], k: 'pareve', produce: true,
  },
  {
    id: 'tabbouleh', name: 'Tabbouleh',
    aka: ['tabouli', 'tabouleh', 'parsley bulgur salad'],
    n: [120, 2.0, 11.0, 7.6, 2.5, 1.5, 250], sv: [['1/2 cup', 80], ['1 cup', 160]], k: 'pareve', al: ['wheat'],
  },
  {
    id: 'coleslaw', name: 'Coleslaw',
    aka: ['cole slaw', 'slaw', 'cabbage salad'],
    n: [150, 1.0, 12.0, 11.0, 1.8, 9.5, 230], sv: [['1/2 cup', 95]], k: 'pareve', al: ['egg'],
  },
  // ---- Soups & stews ----------------------------------------------------------------
  {
    id: 'chicken-soup', name: 'Chicken soup with vegetables (homemade)',
    aka: ['chicken soup', 'jewish penicillin', 'chicken vegetable soup'],
    n: [36, 3.0, 2.6, 1.4, 0.5, 1.0, 300], sv: [['1 cup', 245], ['1 bowl (1.5 cups)', 370]], k: 'meat',
  },
  {
    id: 'chicken-noodle-soup', name: 'Chicken noodle soup',
    aka: ['chicken noodle', 'noodle soup'],
    n: [38, 2.6, 4.4, 1.1, 0.4, 0.4, 340], sv: [['1 cup', 245], ['1 bowl (1.5 cups)', 370]], k: 'meat', al: ['wheat', 'egg'],
  },
  {
    id: 'matzo-ball-soup', name: 'Matzo ball soup',
    aka: ['matzah ball soup', 'kneidlach', 'knaidel soup'],
    n: [57, 2.6, 6.0, 2.5, 0.3, 0.5, 380], sv: [['1 bowl (2 matzo balls)', 360], ['1 cup', 245]], k: 'meat', al: ['wheat', 'egg'],
  },
  {
    id: 'chicken-broth', name: 'Chicken broth',
    aka: ['chicken stock', 'bone broth', 'consomme'],
    n: [6, 0.6, 0.4, 0.2, 0, 0.2, 343], sv: [['1 cup', 240]], k: 'meat',
  },
  {
    id: 'vegetable-broth', name: 'Vegetable broth',
    aka: ['vegetable stock', 'veggie broth'],
    n: [5, 0.2, 0.9, 0.1, 0, 0.4, 300], sv: [['1 cup', 240], ['1 carton (32 fl oz)', 960]], k: 'pareve',
  },
  {
    id: 'lentil-soup', name: 'Lentil soup',
    aka: ['lentil stew', 'red lentil soup', 'dal soup'],
    n: [70, 4.3, 10.8, 1.3, 3.5, 1.5, 260], sv: [['1 cup', 245], ['1 bowl (1.5 cups)', 370]], k: 'pareve',
  },
  {
    id: 'vegetable-soup', name: 'Vegetable soup',
    aka: ['veggie soup', 'minestrone'],
    n: [35, 1.3, 6.0, 0.8, 1.4, 2.0, 280], sv: [['1 cup', 245], ['1 bowl (1.5 cups)', 370]], k: 'pareve',
  },
  {
    id: 'chili-bean-vegetarian', name: 'Bean chili (vegetarian)',
    aka: ['vegetarian chili', 'vegan chili', 'three bean chili'],
    n: [90, 4.6, 14.0, 1.8, 4.5, 3.0, 330], sv: [['1 cup', 250]], k: 'pareve',
  },
  {
    id: 'chili-beef', name: 'Beef chili with beans',
    aka: ['chili con carne', 'chili', 'beef chili'],
    n: [105, 7.5, 10.5, 3.8, 3.0, 2.5, 400], sv: [['1 cup', 250]], k: 'meat',
  },
  {
    id: 'cholent', name: 'Cholent (beef, bean and potato stew)',
    aka: ['chulent', 'hamin', 'shabbat stew', 'dafina'],
    n: [150, 8.5, 15.0, 6.0, 3.5, 1.5, 300], sv: [['1 cup', 250]], k: 'meat',
  },
  // ---- Pasta, rice & mains ----------------------------------------------------------
  {
    id: 'spaghetti-marinara', name: 'Spaghetti with marinara sauce',
    aka: ['pasta with tomato sauce', 'spaghetti', 'pasta marinara'],
    n: [108, 3.7, 20.1, 1.2, 1.8, 2.6, 210], sv: [['1 cup', 250], ['1 restaurant plate', 450]], k: 'pareve', al: ['wheat'],
  },
  {
    id: 'spaghetti-meatballs', name: 'Spaghetti and meatballs',
    aka: ['pasta with meatballs', 'meatball spaghetti'],
    n: [140, 7.0, 16.0, 5.2, 1.5, 3.0, 330], sv: [['1 cup', 250], ['1 restaurant plate', 450]], k: 'meat', al: ['wheat', 'egg'],
  },
  {
    id: 'lasagna-cheese', name: 'Lasagna, cheese (meatless)',
    aka: ['vegetarian lasagna', 'lasagne', 'cheese lasagna'],
    n: [134, 7.4, 15.0, 5.0, 1.3, 3.0, 380], sv: [['1 piece', 250]], k: 'dairy', al: ['wheat', 'milk', 'egg'],
  },
  {
    id: 'lasagna-meat', name: 'Lasagna with meat and cheese',
    aka: ['meat lasagna', 'lasagne bolognese', 'beef lasagna'],
    n: [140, 8.5, 13.5, 5.8, 1.2, 3.0, 400], sv: [['1 piece', 250]], k: 'nonkosher', al: ['wheat', 'milk', 'egg'],
  },
  {
    id: 'mac-and-cheese', name: 'Macaroni and cheese',
    aka: ['mac n cheese', 'mac and cheese', 'macaroni cheese'],
    n: [174, 6.9, 21.5, 6.8, 1.0, 2.0, 430], sv: [['1 cup', 200]], k: 'dairy', al: ['wheat', 'milk'],
  },
  {
    id: 'fried-rice-vegetable', name: 'Vegetable fried rice with egg',
    aka: ['fried rice', 'egg fried rice'],
    n: [174, 4.2, 27.5, 5.2, 1.2, 1.0, 400], sv: [['1 cup', 160]], k: 'pareve', al: ['egg', 'soy', 'wheat'],
  },
  {
    id: 'fried-rice-chicken', name: 'Chicken fried rice',
    aka: ['fried rice with chicken'],
    n: [175, 7.5, 22.5, 6.0, 1.0, 1.0, 450], sv: [['1 cup', 160]], k: 'meat', al: ['egg', 'soy', 'wheat'],
  },
  {
    id: 'sushi-salmon-avocado', name: 'Sushi roll, salmon avocado',
    aka: ['sushi', 'salmon roll', 'maki'],
    n: [148, 6.2, 21.5, 4.0, 1.0, 3.0, 330], sv: [['1 roll (8 pieces)', 220], ['1 piece', 28]], k: 'fish', al: ['fish'],
  },
  {
    id: 'sushi-vegetable', name: 'Sushi roll, vegetable (cucumber avocado)',
    aka: ['veggie sushi', 'avocado roll', 'cucumber roll', 'maki'],
    n: [140, 2.8, 26.0, 2.8, 1.5, 3.0, 300], sv: [['1 roll (8 pieces)', 200], ['1 piece', 25]], k: 'pareve',
  },
  {
    id: 'shakshuka', name: 'Shakshuka',
    aka: ['shakshouka', 'eggs in tomato sauce', 'eggs in purgatory'],
    n: [104, 5.2, 4.5, 7.4, 1.3, 2.8, 280], sv: [['1 serving (2 eggs)', 300], ['1 cup', 240]], k: 'pareve', al: ['egg'],
  },
  {
    id: 'gefilte-fish', name: 'Gefilte fish',
    aka: ['gefilte', 'gefillte fish', 'fish balls'],
    n: [84, 9.1, 7.4, 1.7, 0, 3.0, 524], sv: [['1 piece', 42], ['2 pieces', 84]], k: 'fish', al: ['fish', 'egg'],
  },
  {
    id: 'lox', name: 'Smoked salmon (lox)',
    aka: ['lox', 'nova', 'smoked salmon', 'nova lox'],
    n: [117, 18.3, 0, 4.3, 0, 0, 784], sv: [['2 oz', 57], ['1 oz', 28]], k: 'fish', al: ['fish'],
  },
  {
    id: 'chopped-liver', name: 'Chopped liver',
    aka: ['chicken liver pate', 'gehakte leber'],
    n: [190, 13.0, 4.0, 13.5, 0.4, 1.5, 300], sv: [['1/4 cup', 56]], k: 'meat', al: ['egg'],
  },
  {
    id: 'potato-kugel', name: 'Potato kugel',
    aka: ['kugel', 'potato pudding', 'potato casserole'],
    n: [165, 3.5, 17.0, 9.5, 1.5, 1.0, 350], sv: [['1 piece', 120]], k: 'pareve', al: ['egg'],
  },
  {
    id: 'noodle-kugel', name: 'Noodle kugel (sweet, dairy)',
    aka: ['lokshen kugel', 'kugel', 'noodle pudding'],
    n: [200, 6.5, 22.0, 9.5, 0.6, 10.0, 180], sv: [['1 piece', 130]], k: 'dairy', al: ['wheat', 'egg', 'milk'],
  },
  {
    id: 'latkes', name: 'Latkes (potato pancakes)',
    aka: ['latke', 'potato pancakes', 'potato fritters', 'levivot'],
    n: [268, 6.1, 27.8, 14.8, 3.3, 2.0, 497], sv: [['1 latke', 50], ['3 latkes', 150]], k: 'pareve', al: ['egg', 'wheat'],
  },
  {
    id: 'matzo-brei', name: 'Matzo brei',
    aka: ['matzah brei', 'fried matzo'],
    n: [210, 9.0, 18.0, 11.0, 0.8, 0.5, 200], sv: [['1 serving', 150]], k: 'pareve', al: ['egg', 'wheat'],
  },
  {
    id: 'cheese-blintzes', name: 'Cheese blintzes',
    aka: ['blintz', 'blintzes', 'cheese crepes'],
    n: [190, 8.0, 20.0, 8.5, 0.5, 8.0, 230], sv: [['1 blintz', 70], ['2 blintzes', 140]], def: 1, k: 'dairy', al: ['wheat', 'egg', 'milk'],
  },
  {
    id: 'cheese-bureka', name: 'Cheese bureka',
    aka: ['burekas', 'bourekas', 'borek', 'cheese pastry'],
    n: [330, 9.0, 30.0, 19.5, 1.2, 2.0, 520], sv: [['1 bureka', 90]], k: 'dairy', al: ['wheat', 'milk', 'egg'],
  },
  // ---- Breakfast & sides ------------------------------------------------------------
  {
    id: 'pancakes', name: 'Pancakes',
    aka: ['pancake', 'hotcakes', 'flapjacks'],
    n: [227, 6.4, 28.3, 9.7, 0.9, 5.0, 439], sv: [['1 pancake (4")', 38], ['3 pancakes', 114]], def: 1, k: 'dairy', al: ['wheat', 'egg', 'milk'],
  },
  {
    id: 'waffle-frozen', name: 'Waffle, frozen (toasted)',
    aka: ['waffle', 'waffles', 'toaster waffle'],
    n: [309, 7.0, 48.0, 9.5, 2.4, 5.0, 640], sv: [['1 waffle', 35], ['2 waffles', 70]], def: 1, k: 'dairy', al: ['wheat', 'egg', 'milk'],
  },
  {
    id: 'french-toast', name: 'French toast',
    aka: ['eggy bread', 'challah french toast'],
    n: [229, 7.7, 25.0, 10.8, 1.0, 4.0, 479], sv: [['1 slice', 65], ['2 slices', 130]], k: 'dairy', al: ['wheat', 'egg', 'milk'],
  },
  {
    id: 'mashed-potatoes', name: 'Mashed potatoes (milk and butter)',
    aka: ['mashed potato', 'mash', 'potato puree'],
    n: [113, 1.9, 16.8, 4.2, 1.5, 1.4, 333], sv: [['1 cup', 210], ['1/2 cup', 105]], k: 'dairy', al: ['milk'],
  },
  {
    id: 'french-fries', name: 'French fries',
    aka: ['fries', 'chips', 'potato fries', 'chips (uk)'],
    n: [312, 3.4, 41.4, 14.7, 3.8, 0.3, 210], sv: [['1 medium order', 117], ['1 small order', 71], ['1 large order', 154]], k: 'pareve',
  },
])
