import { defineFoods } from './define'

/** Rice, grains, pasta, tortillas and cereals. Values per 100 g (cooked unless noted). */
export const GRAIN_FOODS = defineFoods('grains', [
  {
    id: 'white-rice-cooked', name: 'White rice, cooked',
    aka: ['rice', 'steamed rice', 'jasmine rice', 'basmati rice', 'long grain rice'],
    n: [130, 2.7, 28.2, 0.3, 0.4, 0.1, 1], sv: [['1 cup', 158], ['1/2 cup', 79]], k: 'pareve',
  },
  {
    id: 'brown-rice-cooked', name: 'Brown rice, cooked',
    aka: ['brown rice', 'whole grain rice'],
    n: [111, 2.6, 23.0, 0.9, 1.8, 0.4, 5], sv: [['1 cup', 195], ['1/2 cup', 98]], k: 'pareve',
  },
  {
    id: 'wild-rice-cooked', name: 'Wild rice, cooked',
    aka: ['wild rice'],
    n: [101, 4.0, 21.3, 0.3, 1.8, 0.7, 3], sv: [['1 cup', 164], ['1/2 cup', 82]], k: 'pareve',
  },
  {
    id: 'quinoa-cooked', name: 'Quinoa, cooked',
    aka: ['quinoa', 'keenwa'],
    n: [120, 4.4, 21.3, 1.9, 2.8, 0.9, 7], sv: [['1 cup', 185], ['1/2 cup', 93]], k: 'pareve',
  },
  {
    id: 'rolled-oats', name: 'Oats, rolled (dry)',
    aka: ['oats', 'oatmeal dry', 'old fashioned oats', 'quick oats', 'porridge oats'],
    n: [379, 13.2, 67.7, 6.5, 10.1, 1.0, 6], sv: [['1/2 cup dry', 40], ['1/3 cup dry', 27], ['1 cup dry', 81]], k: 'pareve',
  },
  {
    id: 'oatmeal-cooked', name: 'Oatmeal, cooked with water',
    aka: ['oatmeal', 'porridge', 'hot cereal', 'oats cooked'],
    n: [71, 2.5, 12.0, 1.5, 1.7, 0.3, 4], sv: [['1 cup', 234], ['1/2 cup', 117]], k: 'pareve',
  },
  {
    id: 'instant-oatmeal-maple', name: 'Instant oatmeal packet, maple brown sugar (dry)',
    aka: ['instant oatmeal', 'oatmeal packet', 'flavored oatmeal'],
    n: [372, 9.3, 74.4, 4.7, 7.0, 28.0, 605], sv: [['1 packet', 43]], k: 'pareve',
  },
  {
    id: 'pasta-cooked', name: 'Pasta, cooked',
    aka: ['pasta', 'spaghetti', 'penne', 'macaroni', 'noodles'],
    n: [158, 5.8, 30.9, 0.9, 1.8, 0.6, 1], sv: [['1 cup', 140], ['2 cups', 280]], k: 'pareve', al: ['wheat'],
  },
  {
    id: 'pasta-dry', name: 'Pasta, dry (uncooked)',
    aka: ['dry pasta', 'uncooked spaghetti', 'raw pasta'],
    n: [371, 13.0, 74.7, 1.5, 3.2, 2.7, 6], sv: [['2 oz dry', 56], ['1 lb box', 454]], k: 'pareve', al: ['wheat'],
  },
  {
    id: 'whole-wheat-pasta-cooked', name: 'Whole-wheat pasta, cooked',
    aka: ['whole wheat pasta', 'wholemeal pasta', 'whole grain spaghetti'],
    n: [149, 6.0, 30.1, 1.7, 3.9, 0.8, 4], sv: [['1 cup', 140]], k: 'pareve', al: ['wheat'],
  },
  {
    id: 'egg-noodles-cooked', name: 'Egg noodles, cooked',
    aka: ['egg noodles', 'lokshen'],
    n: [138, 4.5, 25.0, 2.1, 1.2, 0.4, 5], sv: [['1 cup', 160]], k: 'pareve', al: ['wheat', 'egg'],
  },
  {
    id: 'rice-noodles-cooked', name: 'Rice noodles, cooked',
    aka: ['rice noodles', 'pad thai noodles', 'vermicelli'],
    n: [108, 1.8, 24.0, 0.2, 1.0, 0.1, 19], sv: [['1 cup', 176]], k: 'pareve',
  },
  {
    id: 'soba-noodles-cooked', name: 'Soba noodles, cooked',
    aka: ['soba', 'buckwheat noodles'],
    n: [99, 5.1, 21.4, 0.1, 0, 0.5, 60], sv: [['1 cup', 114]], k: 'pareve', al: ['wheat'],
  },
  {
    id: 'couscous-cooked', name: 'Couscous, cooked',
    aka: ['couscous', 'ptitim', 'israeli couscous'],
    n: [112, 3.8, 23.2, 0.2, 1.4, 0.1, 5], sv: [['1 cup', 157], ['1/2 cup', 79]], k: 'pareve', al: ['wheat'],
  },
  {
    id: 'bulgur-cooked', name: 'Bulgur, cooked',
    aka: ['bulgur', 'bulgur wheat', 'cracked wheat'],
    n: [83, 3.1, 18.6, 0.2, 4.5, 0.1, 5], sv: [['1 cup', 182], ['1/2 cup', 91]], k: 'pareve', al: ['wheat'],
  },
  {
    id: 'barley-cooked', name: 'Barley, pearled, cooked',
    aka: ['barley', 'pearl barley'],
    n: [123, 2.3, 28.2, 0.4, 3.8, 0.3, 3], sv: [['1 cup', 157], ['1/2 cup', 79]], k: 'pareve',
  },
  {
    id: 'kasha-cooked', name: 'Buckwheat groats (kasha), cooked',
    aka: ['kasha', 'buckwheat', 'groats'],
    n: [92, 3.4, 19.9, 0.6, 2.7, 0.9, 4], sv: [['1 cup', 168], ['1/2 cup', 84]], k: 'pareve',
  },
  {
    id: 'corn-tortilla', name: 'Corn tortilla',
    aka: ['tortilla', 'corn tortillas', 'taco shell soft'],
    n: [218, 5.7, 44.6, 2.9, 6.3, 0.9, 45], sv: [['1 tortilla (6")', 26], ['2 tortillas', 52]], k: 'pareve',
  },
  {
    id: 'flour-tortilla', name: 'Flour tortilla',
    aka: ['tortilla', 'wrap', 'burrito wrap', 'flour wrap'],
    n: [304, 8.2, 50.5, 7.6, 3.3, 3.7, 600], sv: [['1 medium (8")', 49], ['1 large (10")', 72], ['1 small (6")', 32]], k: 'pareve', al: ['wheat'],
  },
  {
    id: 'whole-wheat-tortilla', name: 'Whole-wheat tortilla',
    aka: ['whole wheat wrap', 'wholemeal wrap', 'tortilla wrap'],
    n: [300, 9.0, 46.0, 8.0, 6.5, 2.0, 590], sv: [['1 medium (8")', 49], ['1 large (10")', 72]], k: 'pareve', al: ['wheat'],
  },
  {
    id: 'oat-rings-cereal', name: 'Cereal, toasted oat rings',
    aka: ['oat cereal', 'oat rings', 'o cereal', 'breakfast cereal'],
    n: [370, 12.0, 73.0, 6.5, 10.0, 4.4, 497], sv: [['1 cup', 28], ['1 1/2 cups', 42]], k: 'pareve',
  },
  {
    id: 'bran-flakes', name: 'Cereal, bran flakes',
    aka: ['bran cereal', 'bran flakes', 'breakfast cereal'],
    n: [340, 10.0, 80.0, 2.3, 15.0, 18.0, 610], sv: [['3/4 cup', 30], ['1 cup', 40]], k: 'pareve', al: ['wheat'],
  },
  {
    id: 'corn-flakes', name: 'Cereal, corn flakes',
    aka: ['cornflakes', 'breakfast cereal'],
    n: [357, 7.5, 84.1, 0.4, 3.3, 9.5, 729], sv: [['1 cup', 28]], k: 'pareve',
  },
  {
    id: 'granola', name: 'Granola',
    aka: ['granola cereal', 'crunchy oats', 'muesli clusters'],
    n: [489, 13.7, 53.9, 24.3, 8.9, 19.8, 26], sv: [['1/4 cup', 30], ['1/2 cup', 61]], k: 'pareve', diet: 'vegetarian', al: ['tree-nuts'],
  },
])

/** Breads, bagels, pitas and matzo. Values per 100 g. */
export const BREAD_FOODS = defineFoods('bread', [
  {
    id: 'whole-wheat-bread', name: 'Whole-wheat bread',
    aka: ['whole wheat bread', 'wholemeal bread', 'brown bread', 'toast'],
    n: [252, 12.4, 42.7, 3.5, 6.0, 4.4, 455], sv: [['1 slice', 32], ['2 slices', 64]], k: 'pareve', al: ['wheat'],
  },
  {
    id: 'white-bread', name: 'White bread',
    aka: ['sandwich bread', 'white toast', 'toast'],
    n: [266, 8.9, 49.4, 3.3, 2.7, 5.7, 490], sv: [['1 slice', 27], ['2 slices', 54]], k: 'pareve', al: ['wheat'],
  },
  {
    id: 'sourdough-bread', name: 'Sourdough bread',
    aka: ['sourdough', 'french bread', 'country loaf'],
    n: [272, 10.8, 51.9, 3.0, 2.2, 2.5, 602], sv: [['1 slice', 50]], k: 'pareve', al: ['wheat'],
  },
  {
    id: 'multigrain-bread', name: 'Multigrain bread',
    aka: ['multi-grain bread', 'seeded bread', 'grain bread'],
    n: [265, 13.4, 43.3, 4.2, 7.4, 6.4, 381], sv: [['1 slice', 26], ['2 slices', 52]], k: 'pareve', al: ['wheat'],
  },
  {
    id: 'rye-bread', name: 'Rye bread',
    aka: ['rye', 'jewish rye', 'deli rye', 'seeded rye'],
    n: [259, 8.5, 48.3, 3.3, 5.8, 3.9, 603], sv: [['1 slice', 32], ['2 slices', 64]], k: 'pareve', al: ['wheat'],
  },
  {
    id: 'pumpernickel-bread', name: 'Pumpernickel bread',
    aka: ['pumpernickel', 'dark rye'],
    n: [250, 8.7, 47.5, 3.1, 6.5, 0.5, 596], sv: [['1 slice', 32]], k: 'pareve', al: ['wheat'],
  },
  {
    id: 'sprouted-grain-bread', name: 'Sprouted whole-grain bread',
    aka: ['sprouted bread', 'flourless bread', 'sprouted grain'],
    n: [235, 11.8, 44.1, 1.5, 8.8, 0, 220], sv: [['1 slice', 34], ['2 slices', 68]], k: 'pareve', al: ['wheat', 'soy'],
  },
  {
    id: 'bagel-plain', name: 'Bagel, plain',
    aka: ['bagel', 'bagels', 'everything bagel', 'sesame bagel'],
    n: [257, 10.0, 50.5, 1.6, 2.1, 5.0, 450], sv: [['1 medium bagel', 105], ['1 large bakery bagel', 131], ['1 mini bagel', 26]], k: 'pareve', al: ['wheat'],
  },
  {
    id: 'pita-white', name: 'Pita bread, white',
    aka: ['pita', 'pitta', 'pita pocket'],
    n: [275, 9.1, 55.7, 1.2, 2.2, 1.3, 536], sv: [['1 pita (6.5")', 60], ['1 mini pita', 28]], k: 'pareve', al: ['wheat'],
  },
  {
    id: 'pita-whole-wheat', name: 'Pita bread, whole-wheat',
    aka: ['whole wheat pita', 'wholemeal pitta'],
    n: [262, 9.8, 55.0, 2.6, 7.4, 0.8, 527], sv: [['1 pita (6.5")', 64]], k: 'pareve', al: ['wheat'],
  },
  {
    id: 'english-muffin', name: 'English muffin',
    aka: ['english muffins', 'breakfast muffin'],
    n: [227, 8.9, 44.2, 1.7, 3.5, 3.5, 420], sv: [['1 muffin', 57]], k: 'pareve', al: ['wheat'],
  },
  {
    id: 'challah', name: 'Challah (egg bread)',
    aka: ['challah', 'hallah', 'egg bread', 'shabbat bread'],
    n: [287, 9.5, 47.8, 6.0, 2.3, 1.7, 491], sv: [['1 slice', 40], ['1 thick slice', 60]], k: 'pareve', al: ['wheat', 'egg'],
  },
  {
    id: 'matzo', name: 'Matzo',
    aka: ['matzah', 'matza', 'matzoh', 'passover cracker'],
    n: [395, 10.0, 83.7, 1.4, 3.0, 0.3, 2], sv: [['1 sheet', 28]], k: 'pareve', al: ['wheat'],
  },
  {
    id: 'matzo-whole-wheat', name: 'Matzo, whole-wheat',
    aka: ['whole wheat matzah', 'whole grain matzo'],
    n: [351, 13.1, 78.9, 1.5, 11.8, 0.3, 2], sv: [['1 sheet', 28]], k: 'pareve', al: ['wheat'],
  },
  {
    id: 'hamburger-bun', name: 'Hamburger bun',
    aka: ['burger bun', 'hot dog bun', 'bun', 'roll'],
    n: [279, 9.5, 49.4, 4.3, 2.1, 5.6, 491], sv: [['1 bun', 44]], k: 'pareve', al: ['wheat'],
  },
  {
    id: 'croissant', name: 'Croissant, butter',
    aka: ['croissant', 'butter croissant', 'pastry'],
    n: [406, 8.2, 45.8, 21.0, 2.6, 11.3, 467], sv: [['1 medium', 57]], k: 'dairy', al: ['wheat', 'milk', 'egg'],
  },
])
