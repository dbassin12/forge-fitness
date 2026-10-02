import { defineFoods } from './define'

/** Fresh, frozen and dried fruit. Values per 100 g (raw unless noted). */
export const FRUIT_FOODS = defineFoods('fruit', [
  {
    id: 'apple', name: 'Apple',
    aka: ['apples', 'red apple', 'green apple', 'gala', 'fuji'],
    n: [52, 0.3, 13.8, 0.2, 2.4, 10.4, 1], sv: [['1 medium', 182], ['1 small', 149], ['1 large', 223], ['1 cup sliced', 109]], k: 'pareve', produce: true,
  },
  {
    id: 'banana', name: 'Banana',
    aka: ['bananas', 'banannas'],
    n: [89, 1.1, 22.8, 0.3, 2.6, 12.2, 1], sv: [['1 medium', 118], ['1 small', 101], ['1 large', 136], ['1 cup sliced', 150]], k: 'pareve', produce: true,
  },
  {
    id: 'orange', name: 'Orange',
    aka: ['oranges', 'navel orange'],
    n: [47, 0.9, 11.8, 0.1, 2.4, 9.4, 0], sv: [['1 medium', 131], ['1 large', 184]], k: 'pareve', produce: true,
  },
  {
    id: 'clementine', name: 'Clementine',
    aka: ['clementines', 'mandarin', 'tangerine', 'easy peeler'],
    n: [47, 0.9, 12.0, 0.2, 1.7, 9.2, 1], sv: [['1 clementine', 74], ['2 clementines', 148]], k: 'pareve', produce: true,
  },
  {
    id: 'grapefruit', name: 'Grapefruit',
    aka: ['pink grapefruit', 'ruby red grapefruit'],
    n: [42, 0.8, 10.7, 0.1, 1.6, 6.9, 0], sv: [['1/2 grapefruit', 123]], k: 'pareve', produce: true,
  },
  {
    id: 'strawberries', name: 'Strawberries',
    aka: ['strawberry', 'berries'],
    n: [32, 0.7, 7.7, 0.3, 2.0, 4.9, 1], sv: [['1 cup halves', 152], ['1 cup whole', 144], ['5 berries', 60]], k: 'pareve', produce: true,
  },
  {
    id: 'blueberries', name: 'Blueberries',
    aka: ['blueberry', 'berries'],
    n: [57, 0.7, 14.5, 0.3, 2.4, 10.0, 1], sv: [['1 cup', 148], ['1/2 cup', 74]], k: 'pareve', produce: true,
  },
  {
    id: 'raspberries', name: 'Raspberries',
    aka: ['raspberry', 'berries'],
    n: [52, 1.2, 11.9, 0.7, 6.5, 4.4, 1], sv: [['1 cup', 123], ['1/2 cup', 62]], k: 'pareve', produce: true,
  },
  {
    id: 'blackberries', name: 'Blackberries',
    aka: ['blackberry', 'berries'],
    n: [43, 1.4, 9.6, 0.5, 5.3, 4.9, 1], sv: [['1 cup', 144], ['1/2 cup', 72]], k: 'pareve', produce: true,
  },
  {
    id: 'mixed-berries-frozen', name: 'Mixed berries, frozen (unsweetened)',
    aka: ['frozen berries', 'frozen fruit', 'berry blend', 'smoothie berries'],
    n: [48, 0.7, 11.5, 0.4, 3.0, 7.0, 1], sv: [['1 cup', 140], ['1/2 cup', 70]], k: 'pareve', produce: true,
  },
  {
    id: 'grapes', name: 'Grapes',
    aka: ['grape', 'red grapes', 'green grapes', 'seedless grapes'],
    n: [69, 0.7, 18.1, 0.2, 0.9, 15.5, 2], sv: [['1 cup', 151], ['10 grapes', 49]], k: 'pareve', produce: true,
  },
  {
    id: 'cherries', name: 'Cherries, sweet',
    aka: ['cherry', 'cherries', 'bing cherries'],
    n: [63, 1.1, 16.0, 0.2, 2.1, 12.8, 0], sv: [['1 cup', 138], ['10 cherries', 68]], k: 'pareve', produce: true,
  },
  {
    id: 'mango', name: 'Mango',
    aka: ['mangoes', 'mangos'],
    n: [60, 0.8, 15.0, 0.4, 1.6, 13.7, 1], sv: [['1 cup sliced', 165], ['1 mango', 200]], k: 'pareve', produce: true,
  },
  {
    id: 'pineapple', name: 'Pineapple',
    aka: ['pineapple chunks', 'ananas'],
    n: [50, 0.5, 13.1, 0.1, 1.4, 9.9, 1], sv: [['1 cup chunks', 165], ['1 slice', 84]], k: 'pareve', produce: true,
  },
  {
    id: 'papaya', name: 'Papaya',
    aka: ['papayas', 'pawpaw'],
    n: [43, 0.5, 10.8, 0.3, 1.7, 7.8, 8], sv: [['1 cup cubes', 145]], k: 'pareve', produce: true,
  },
  {
    id: 'kiwi', name: 'Kiwi',
    aka: ['kiwifruit', 'kiwis'],
    n: [61, 1.1, 14.7, 0.5, 3.0, 9.0, 3], sv: [['1 kiwi', 69], ['2 kiwis', 138]], k: 'pareve', produce: true,
  },
  {
    id: 'watermelon', name: 'Watermelon',
    aka: ['melon', 'watermelons'],
    n: [30, 0.6, 7.6, 0.2, 0.4, 6.2, 1], sv: [['1 cup diced', 152], ['1 wedge', 286]], k: 'pareve', produce: true,
  },
  {
    id: 'cantaloupe', name: 'Cantaloupe',
    aka: ['melon', 'rockmelon', 'muskmelon'],
    n: [34, 0.8, 8.2, 0.2, 0.9, 7.9, 16], sv: [['1 cup cubes', 160]], k: 'pareve', produce: true,
  },
  {
    id: 'honeydew', name: 'Honeydew melon',
    aka: ['honeydew', 'melon'],
    n: [36, 0.5, 9.1, 0.1, 0.8, 8.1, 18], sv: [['1 cup cubes', 170]], k: 'pareve', produce: true,
  },
  {
    id: 'pear', name: 'Pear',
    aka: ['pears', 'bartlett pear'],
    n: [57, 0.4, 15.2, 0.1, 3.1, 9.8, 1], sv: [['1 medium', 178]], k: 'pareve', produce: true,
  },
  {
    id: 'peach', name: 'Peach',
    aka: ['peaches'],
    n: [39, 0.9, 9.5, 0.3, 1.5, 8.4, 0], sv: [['1 medium', 150]], k: 'pareve', produce: true,
  },
  {
    id: 'nectarine', name: 'Nectarine',
    aka: ['nectarines'],
    n: [44, 1.1, 10.6, 0.3, 1.7, 7.9, 0], sv: [['1 medium', 142]], k: 'pareve', produce: true,
  },
  {
    id: 'plum', name: 'Plum',
    aka: ['plums'],
    n: [46, 0.7, 11.4, 0.3, 1.4, 9.9, 0], sv: [['1 plum', 66], ['2 plums', 132]], k: 'pareve', produce: true,
  },
  {
    id: 'apricot', name: 'Apricot',
    aka: ['apricots', 'fresh apricot'],
    n: [48, 1.4, 11.1, 0.4, 2.0, 9.2, 1], sv: [['1 apricot', 35], ['3 apricots', 105]], k: 'pareve', produce: true,
  },
  {
    id: 'pomegranate-arils', name: 'Pomegranate arils',
    aka: ['pomegranate', 'pomegranate seeds'],
    n: [83, 1.7, 18.7, 1.2, 4.0, 13.7, 3], sv: [['1/2 cup', 87]], k: 'pareve', produce: true,
  },
  {
    id: 'fig-fresh', name: 'Fig, fresh',
    aka: ['figs', 'fresh figs'],
    n: [74, 0.8, 19.2, 0.3, 2.9, 16.3, 1], sv: [['1 medium fig', 50]], k: 'pareve', produce: true,
  },
  {
    id: 'lemon', name: 'Lemon',
    aka: ['lemons'],
    n: [29, 1.1, 9.3, 0.3, 2.8, 2.5, 2], sv: [['1 lemon', 58]], k: 'pareve', produce: true,
  },
  {
    id: 'lime', name: 'Lime',
    aka: ['limes'],
    n: [30, 0.7, 10.5, 0.2, 2.8, 1.7, 2], sv: [['1 lime', 67]], k: 'pareve', produce: true,
  },
  {
    id: 'applesauce', name: 'Applesauce, unsweetened',
    aka: ['apple sauce', 'apple puree'],
    n: [42, 0.2, 11.3, 0.1, 1.1, 9.4, 2], sv: [['1 snack cup', 113], ['1/2 cup', 122]], k: 'pareve', produce: true,
  },
  // ---- Dried fruit --------------------------------------------------------------------
  {
    id: 'dates-medjool', name: 'Dates, Medjool',
    aka: ['dates', 'medjool dates', 'dried dates'],
    n: [277, 1.8, 75.0, 0.2, 6.7, 66.5, 1], sv: [['1 date', 24], ['3 dates', 72]], k: 'pareve', produce: true,
  },
  {
    id: 'raisins', name: 'Raisins',
    aka: ['raisin', 'sultanas', 'dried grapes'],
    n: [299, 3.1, 79.2, 0.5, 3.7, 59.2, 11], sv: [['1 small box', 43], ['1/4 cup', 41]], k: 'pareve', produce: true,
  },
  {
    id: 'apricots-dried', name: 'Apricots, dried',
    aka: ['dried apricots'],
    n: [241, 3.4, 62.6, 0.5, 7.3, 53.4, 10], sv: [['1/4 cup', 33], ['5 halves', 18]], k: 'pareve', produce: true,
  },
  {
    id: 'cranberries-dried', name: 'Cranberries, dried (sweetened)',
    aka: ['dried cranberries', 'sweetened dried cranberries'],
    n: [308, 0.2, 82.4, 1.4, 5.7, 65.0, 3], sv: [['1/4 cup', 40], ['1 tbsp', 10]], k: 'pareve', produce: true,
  },
  {
    id: 'figs-dried', name: 'Figs, dried',
    aka: ['dried figs'],
    n: [249, 3.3, 63.9, 0.9, 9.8, 47.9, 10], sv: [['1 dried fig', 8], ['1/4 cup', 37]], k: 'pareve', produce: true,
  },
])

/** Vegetables and herbs. Values per 100 g (raw unless noted). */
export const VEGETABLE_FOODS = defineFoods('vegetables', [
  {
    id: 'broccoli-raw', name: 'Broccoli, raw',
    aka: ['broccoli', 'broccoli florets'],
    n: [34, 2.8, 6.6, 0.4, 2.6, 1.7, 33], sv: [['1 cup chopped', 91], ['1 cup florets', 71]], k: 'pareve', produce: true,
  },
  {
    id: 'broccoli-cooked', name: 'Broccoli, steamed or boiled',
    aka: ['cooked broccoli', 'steamed broccoli'],
    n: [35, 2.4, 7.2, 0.4, 3.3, 1.4, 41], sv: [['1 cup chopped', 156], ['1/2 cup', 78]], k: 'pareve', produce: true,
  },
  {
    id: 'cauliflower', name: 'Cauliflower',
    aka: ['cauliflower rice', 'riced cauliflower', 'cauliflower florets'],
    n: [25, 1.9, 5.0, 0.3, 2.0, 1.9, 30], sv: [['1 cup chopped or riced', 107]], k: 'pareve', produce: true,
  },
  {
    id: 'spinach-raw', name: 'Spinach, raw',
    aka: ['spinach', 'baby spinach', 'leafy greens'],
    n: [23, 2.9, 3.6, 0.4, 2.2, 0.4, 79], sv: [['1 cup', 30], ['3 cups', 90]], k: 'pareve', produce: true,
  },
  {
    id: 'spinach-cooked', name: 'Spinach, cooked',
    aka: ['cooked spinach', 'sauteed spinach', 'wilted spinach'],
    n: [23, 3.0, 3.8, 0.3, 2.4, 0.4, 70], sv: [['1/2 cup', 90], ['1 cup', 180]], k: 'pareve', produce: true,
  },
  {
    id: 'kale', name: 'Kale, raw',
    aka: ['kale', 'curly kale', 'lacinato kale'],
    n: [49, 4.3, 8.8, 0.9, 3.6, 2.3, 38], sv: [['1 cup chopped', 21], ['3 cups chopped', 63]], k: 'pareve', produce: true,
  },
  {
    id: 'romaine', name: 'Lettuce, romaine',
    aka: ['romaine', 'cos lettuce', 'lettuce', 'salad'],
    n: [17, 1.2, 3.3, 0.3, 2.1, 1.2, 8], sv: [['1 cup shredded', 47], ['2 cups shredded', 94]], k: 'pareve', produce: true,
  },
  {
    id: 'iceberg-lettuce', name: 'Lettuce, iceberg',
    aka: ['iceberg', 'lettuce'],
    n: [14, 0.9, 3.0, 0.1, 1.2, 2.0, 10], sv: [['1 cup shredded', 72]], k: 'pareve', produce: true,
  },
  {
    id: 'mixed-greens', name: 'Mixed salad greens',
    aka: ['spring mix', 'salad mix', 'mesclun', 'leafy greens', 'salad'],
    n: [15, 1.4, 2.9, 0.2, 1.3, 0.8, 28], sv: [['1 cup', 28], ['1 bowl (3 cups)', 85]], k: 'pareve', produce: true,
  },
  {
    id: 'arugula', name: 'Arugula',
    aka: ['rocket', 'roquette'],
    n: [25, 2.6, 3.7, 0.7, 1.6, 2.1, 27], sv: [['1 cup', 20], ['2 cups', 40]], k: 'pareve', produce: true,
  },
  {
    id: 'carrots', name: 'Carrots',
    aka: ['carrot', 'shredded carrot'],
    n: [41, 0.9, 9.6, 0.2, 2.8, 4.7, 69], sv: [['1 medium', 61], ['1 cup chopped', 128]], k: 'pareve', produce: true,
  },
  {
    id: 'baby-carrots', name: 'Baby carrots',
    aka: ['carrot sticks', 'snack carrots'],
    n: [35, 0.6, 8.2, 0.1, 2.9, 4.8, 78], sv: [['8 baby carrots', 85], ['1 baby carrot', 10]], k: 'pareve', produce: true,
  },
  {
    id: 'cucumber', name: 'Cucumber',
    aka: ['cucumbers', 'persian cucumber', 'english cucumber', 'cuke'],
    n: [15, 0.7, 3.6, 0.1, 0.5, 1.7, 2], sv: [['1 cup sliced', 104], ['1 mini cucumber', 90], ['1/2 large cucumber', 150]], k: 'pareve', produce: true,
  },
  {
    id: 'tomato', name: 'Tomato',
    aka: ['tomatoes', 'roma tomato', 'sliced tomato'],
    n: [18, 0.9, 3.9, 0.2, 1.2, 2.6, 5], sv: [['1 medium', 123], ['1 slice', 20], ['1 cup chopped', 180]], k: 'pareve', produce: true,
  },
  {
    id: 'cherry-tomatoes', name: 'Cherry tomatoes',
    aka: ['grape tomatoes', 'cherry tomato'],
    n: [18, 0.9, 3.9, 0.2, 1.2, 2.6, 5], sv: [['1 cup', 149], ['5 cherry tomatoes', 85]], k: 'pareve', produce: true,
  },
  {
    id: 'bell-pepper-red', name: 'Bell pepper, red',
    aka: ['red pepper', 'capsicum', 'sweet pepper', 'bell pepper'],
    n: [31, 1.0, 6.0, 0.3, 2.1, 4.2, 4], sv: [['1 medium', 119], ['1 cup chopped', 149]], k: 'pareve', produce: true,
  },
  {
    id: 'bell-pepper-green', name: 'Bell pepper, green',
    aka: ['green pepper', 'capsicum', 'bell pepper'],
    n: [20, 0.9, 4.6, 0.2, 1.7, 2.4, 3], sv: [['1 medium', 119], ['1 cup chopped', 149]], k: 'pareve', produce: true,
  },
  {
    id: 'jalapeno', name: 'Jalapeño pepper',
    aka: ['jalapeno', 'chili pepper', 'hot pepper'],
    n: [29, 0.9, 6.5, 0.4, 2.8, 4.1, 3], sv: [['1 pepper', 14]], k: 'pareve', produce: true,
  },
  {
    id: 'onion', name: 'Onion',
    aka: ['onions', 'yellow onion', 'red onion', 'white onion'],
    n: [40, 1.1, 9.3, 0.1, 1.7, 4.2, 4], sv: [['1 medium', 110], ['1 cup chopped', 160], ['1/4 cup chopped', 40]], k: 'pareve', produce: true,
  },
  {
    id: 'green-onion', name: 'Green onion',
    aka: ['scallion', 'scallions', 'spring onion'],
    n: [32, 1.8, 7.3, 0.2, 2.6, 2.3, 16], sv: [['1 stalk', 15], ['1/4 cup chopped', 25]], k: 'pareve', produce: true,
  },
  {
    id: 'garlic', name: 'Garlic',
    aka: ['garlic clove', 'minced garlic'],
    n: [149, 6.4, 33.1, 0.5, 2.1, 1.0, 17], sv: [['1 clove', 3], ['1 tbsp minced', 9]], k: 'pareve',
  },
  {
    id: 'ginger', name: 'Ginger root, fresh',
    aka: ['ginger', 'fresh ginger', 'grated ginger'],
    n: [80, 1.8, 17.8, 0.8, 2.0, 1.7, 13], sv: [['1 tsp grated', 2], ['1 tbsp grated', 6]], k: 'pareve',
  },
  {
    id: 'parsley', name: 'Parsley, fresh',
    aka: ['parsley', 'flat-leaf parsley', 'herbs'],
    n: [36, 3.0, 6.3, 0.8, 3.3, 0.9, 56], sv: [['1/4 cup chopped', 15], ['1 tbsp chopped', 4]], k: 'pareve',
  },
  {
    id: 'cilantro', name: 'Cilantro, fresh',
    aka: ['coriander leaves', 'coriander', 'herbs'],
    n: [23, 2.1, 3.7, 0.5, 2.8, 0.9, 46], sv: [['1/4 cup', 4], ['1 tbsp', 1]], k: 'pareve',
  },
  {
    id: 'zucchini', name: 'Zucchini',
    aka: ['courgette', 'summer squash', 'zoodles'],
    n: [17, 1.2, 3.1, 0.3, 1.0, 2.5, 8], sv: [['1 medium', 196], ['1 cup sliced', 113]], k: 'pareve', produce: true,
  },
  {
    id: 'eggplant', name: 'Eggplant',
    aka: ['aubergine', 'eggplants'],
    n: [25, 1.0, 5.9, 0.2, 3.0, 3.5, 2], sv: [['1 cup cubes', 82], ['1 medium eggplant', 458]], k: 'pareve', produce: true,
  },
  {
    id: 'mushrooms', name: 'Mushrooms, white',
    aka: ['mushroom', 'button mushrooms', 'cremini'],
    n: [22, 3.1, 3.3, 0.3, 1.0, 2.0, 5], sv: [['1 cup sliced', 70], ['5 medium mushrooms', 90]], k: 'pareve', produce: true,
  },
  {
    id: 'green-beans', name: 'Green beans',
    aka: ['string beans', 'snap beans', 'haricots verts'],
    n: [31, 1.8, 7.0, 0.2, 2.7, 3.3, 6], sv: [['1 cup', 100]], k: 'pareve', produce: true,
  },
  {
    id: 'snap-peas', name: 'Snap peas',
    aka: ['sugar snap peas', 'snow peas', 'pea pods'],
    n: [42, 2.8, 7.6, 0.2, 2.6, 4.0, 4], sv: [['1 cup', 63]], k: 'pareve', produce: true,
  },
  {
    id: 'peas', name: 'Green peas, cooked',
    aka: ['peas', 'frozen peas', 'garden peas'],
    n: [78, 5.2, 14.3, 0.3, 4.5, 3.2, 72], sv: [['1/2 cup', 80], ['1 cup', 160]], k: 'pareve', produce: true,
  },
  {
    id: 'corn', name: 'Corn, sweet, cooked',
    aka: ['sweet corn', 'corn on the cob', 'corn kernels', 'maize'],
    n: [96, 3.4, 21.0, 1.5, 2.4, 4.5, 1], sv: [['1 ear', 90], ['1/2 cup kernels', 82]], k: 'pareve', produce: true,
  },
  {
    id: 'asparagus', name: 'Asparagus',
    aka: ['asparagus spears'],
    n: [20, 2.2, 3.9, 0.1, 2.1, 1.9, 2], sv: [['6 spears', 96], ['1 cup', 134]], k: 'pareve', produce: true,
  },
  {
    id: 'brussels-sprouts', name: 'Brussels sprouts',
    aka: ['brussel sprouts', 'sprouts'],
    n: [43, 3.4, 9.0, 0.3, 3.8, 2.2, 25], sv: [['1 cup', 88]], k: 'pareve', produce: true,
  },
  {
    id: 'cabbage', name: 'Cabbage, green',
    aka: ['cabbage', 'white cabbage'],
    n: [25, 1.3, 5.8, 0.1, 2.5, 3.2, 18], sv: [['1 cup shredded', 70]], k: 'pareve', produce: true,
  },
  {
    id: 'red-cabbage', name: 'Cabbage, red',
    aka: ['red cabbage', 'purple cabbage'],
    n: [31, 1.4, 7.4, 0.2, 2.1, 3.8, 27], sv: [['1 cup shredded', 70]], k: 'pareve', produce: true,
  },
  {
    id: 'bok-choy', name: 'Bok choy',
    aka: ['pak choi', 'chinese cabbage', 'baby bok choy'],
    n: [13, 1.5, 2.2, 0.2, 1.0, 1.2, 65], sv: [['1 cup shredded', 70]], k: 'pareve', produce: true,
  },
  {
    id: 'celery', name: 'Celery',
    aka: ['celery sticks', 'celery stalk'],
    n: [16, 0.7, 3.0, 0.2, 1.6, 1.3, 80], sv: [['1 stalk', 40], ['1 cup chopped', 101]], k: 'pareve', produce: true,
  },
  {
    id: 'radishes', name: 'Radishes',
    aka: ['radish'],
    n: [16, 0.7, 3.4, 0.1, 1.6, 1.9, 39], sv: [['5 radishes', 23], ['1 cup sliced', 116]], k: 'pareve', produce: true,
  },
  {
    id: 'beets', name: 'Beets, cooked',
    aka: ['beetroot', 'beet', 'roasted beets'],
    n: [44, 1.7, 10.0, 0.2, 2.0, 8.0, 77], sv: [['1/2 cup slices', 85], ['1 beet', 50]], k: 'pareve', produce: true,
  },
  {
    id: 'sweet-potato-baked', name: 'Sweet potato, baked',
    aka: ['sweet potato', 'yam', 'baked sweet potato'],
    n: [90, 2.0, 20.7, 0.2, 3.3, 6.5, 36], sv: [['1 medium', 130], ['1 cup mashed', 200]], k: 'pareve', produce: true,
  },
  {
    id: 'sweet-potato-raw', name: 'Sweet potato, raw',
    aka: ['raw sweet potato', 'yam'],
    n: [86, 1.6, 20.1, 0.1, 3.0, 4.2, 55], sv: [['1 medium', 130], ['1 cup cubes', 133]], k: 'pareve', produce: true,
  },
  {
    id: 'potato-baked', name: 'Potato, baked (with skin)',
    aka: ['potato', 'baked potato', 'jacket potato', 'russet potato'],
    n: [93, 2.5, 21.2, 0.1, 2.2, 1.2, 10], sv: [['1 medium', 173], ['1 small', 138], ['1 large', 299]], k: 'pareve', produce: true,
  },
  {
    id: 'butternut-squash', name: 'Butternut squash, baked',
    aka: ['butternut', 'winter squash', 'roasted squash'],
    n: [40, 0.9, 10.5, 0.1, 3.2, 2.0, 4], sv: [['1 cup cubes', 205]], k: 'pareve', produce: true,
  },
  {
    id: 'spaghetti-squash', name: 'Spaghetti squash, cooked',
    aka: ['spaghetti squash'],
    n: [27, 0.7, 6.5, 0.3, 1.4, 2.5, 18], sv: [['1 cup', 155]], k: 'pareve', produce: true,
  },
  {
    id: 'pumpkin-canned', name: 'Pumpkin purée, canned',
    aka: ['pumpkin', 'pumpkin puree', 'canned pumpkin'],
    n: [34, 1.1, 8.1, 0.3, 2.9, 3.3, 5], sv: [['1/2 cup', 122]], k: 'pareve', produce: true,
  },
  {
    id: 'mixed-vegetables-frozen', name: 'Mixed vegetables, frozen (cooked)',
    aka: ['frozen vegetables', 'mixed veggies', 'stir-fry vegetables', 'peas and carrots'],
    n: [65, 2.9, 13.1, 0.2, 4.4, 3.1, 35], sv: [['1 cup', 182], ['1/2 cup', 91]], k: 'pareve', produce: true,
  },
  {
    id: 'canned-tomatoes', name: 'Tomatoes, canned (diced or crushed)',
    aka: ['canned tomatoes', 'diced tomatoes', 'crushed tomatoes', 'tinned tomatoes'],
    n: [17, 0.8, 3.5, 0.3, 1.0, 2.4, 140], sv: [['1 cup', 240], ['1 can (14.5 oz)', 411]], k: 'pareve', produce: true,
  },
  {
    id: 'tomato-sauce', name: 'Tomato sauce, canned',
    aka: ['tomato sauce', 'passata'],
    n: [24, 1.2, 5.3, 0.3, 1.5, 3.6, 474], sv: [['1/2 cup', 122]], k: 'pareve', produce: true,
  },
  {
    id: 'tomato-paste', name: 'Tomato paste',
    aka: ['tomato concentrate'],
    n: [82, 4.3, 18.9, 0.5, 4.1, 12.2, 59], sv: [['1 tbsp', 16], ['2 tbsp', 32]], k: 'pareve',
  },
])
