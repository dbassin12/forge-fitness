import { defineFoods } from './define'

/** Sauces, dressings, spreads and sweeteners. Values per 100 g. */
export const CONDIMENT_FOODS = defineFoods('condiments', [
  {
    id: 'ketchup', name: 'Ketchup',
    aka: ['catsup', 'tomato ketchup'],
    n: [101, 1.0, 27.4, 0.1, 0.3, 22.8, 907], sv: [['1 tbsp', 17], ['1 packet', 9]], k: 'pareve',
  },
  {
    id: 'mustard', name: 'Mustard, yellow',
    aka: ['mustard', 'deli mustard', 'dijon'],
    n: [60, 3.7, 5.8, 3.3, 4.0, 0.9, 1104], sv: [['1 tsp', 5], ['1 tbsp', 15]], k: 'pareve',
  },
  {
    id: 'hot-sauce', name: 'Hot sauce',
    aka: ['pepper sauce', 'chili sauce', 'buffalo sauce'],
    n: [11, 0.5, 1.8, 0.4, 0.3, 1.3, 2643], sv: [['1 tsp', 5]], k: 'pareve',
  },
  {
    id: 'sriracha', name: 'Sriracha',
    aka: ['chili garlic sauce', 'rooster sauce'],
    n: [93, 1.9, 19.2, 0.9, 2.2, 15.4, 2124], sv: [['1 tsp', 6]], k: 'pareve',
  },
  {
    id: 'soy-sauce', name: 'Soy sauce',
    aka: ['shoyu', 'tamari'],
    n: [53, 8.1, 4.9, 0.6, 0.8, 0.4, 5493], sv: [['1 tbsp', 16], ['1 tsp', 5]], k: 'pareve', al: ['soy', 'wheat'],
  },
  {
    id: 'teriyaki-sauce', name: 'Teriyaki sauce',
    aka: ['teriyaki'],
    n: [89, 5.9, 15.6, 0, 0.1, 14.2, 3833], sv: [['1 tbsp', 18]], k: 'pareve', al: ['soy', 'wheat'],
  },
  {
    id: 'bbq-sauce', name: 'Barbecue sauce',
    aka: ['bbq sauce', 'barbeque sauce'],
    n: [172, 0.8, 40.8, 0.6, 0.9, 33.2, 1027], sv: [['2 tbsp', 34], ['1 tbsp', 17]], k: 'pareve',
  },
  {
    id: 'salsa', name: 'Salsa',
    aka: ['pico de gallo', 'tomato salsa', 'salsa roja'],
    n: [36, 1.5, 6.6, 0.2, 1.9, 4.0, 711], sv: [['2 tbsp', 32], ['1/4 cup', 64]], k: 'pareve',
  },
  {
    id: 'marinara', name: 'Marinara sauce',
    aka: ['pasta sauce', 'spaghetti sauce', 'tomato basil sauce'],
    n: [51, 1.4, 8.1, 1.5, 2.2, 5.0, 437], sv: [['1/2 cup', 125], ['1 cup', 250]], k: 'pareve',
  },
  {
    id: 'pesto', name: 'Pesto',
    aka: ['basil pesto', 'pesto sauce'],
    n: [418, 5.0, 4.0, 42.6, 1.5, 1.0, 600], sv: [['1 tbsp', 16], ['1/4 cup', 63]], k: 'dairy', al: ['milk', 'tree-nuts'],
  },
  {
    id: 'guacamole', name: 'Guacamole',
    aka: ['guac', 'avocado dip'],
    n: [150, 1.9, 8.5, 13.3, 6.0, 0.8, 300], sv: [['2 tbsp', 30], ['1/4 cup', 60]], k: 'pareve',
  },
  {
    id: 'tzatziki', name: 'Tzatziki',
    aka: ['yogurt dip', 'cucumber yogurt sauce', 'raita'],
    n: [80, 4.0, 4.0, 5.4, 0.2, 3.0, 230], sv: [['2 tbsp', 30], ['1/4 cup', 60]], k: 'dairy', al: ['milk'],
  },
  {
    id: 'ranch-dressing', name: 'Ranch dressing',
    aka: ['ranch', 'ranch dip'],
    n: [430, 1.3, 5.9, 44.5, 0, 4.7, 901], sv: [['2 tbsp', 30], ['1 tbsp', 15]], k: 'dairy', al: ['milk', 'egg'],
  },
  {
    id: 'caesar-dressing', name: 'Caesar dressing',
    aka: ['caesar salad dressing'],
    n: [542, 2.2, 3.3, 57.9, 0, 2.9, 1209], sv: [['2 tbsp', 30], ['1 tbsp', 15]], k: 'dairy', diet: 'neither', al: ['milk', 'egg', 'fish'],
  },
  {
    id: 'balsamic-vinaigrette', name: 'Balsamic vinaigrette',
    aka: ['vinaigrette', 'salad dressing', 'italian dressing'],
    n: [290, 0.3, 10.0, 28.0, 0.1, 8.5, 620], sv: [['2 tbsp', 31], ['1 tbsp', 15]], k: 'pareve',
  },
  {
    id: 'balsamic-vinegar', name: 'Balsamic vinegar',
    aka: ['balsamic', 'balsamic glaze'],
    n: [88, 0.5, 17.0, 0, 0, 15.0, 23], sv: [['1 tbsp', 16]], k: 'pareve',
  },
  {
    id: 'apple-cider-vinegar', name: 'Apple cider vinegar',
    aka: ['vinegar', 'cider vinegar', 'acv'],
    n: [21, 0, 0.9, 0, 0, 0.4, 5], sv: [['1 tbsp', 15]], k: 'pareve',
  },
  {
    id: 'lemon-juice', name: 'Lemon juice',
    aka: ['fresh lemon juice', 'lime juice', 'citrus juice'],
    n: [22, 0.4, 6.9, 0.2, 0.3, 2.5, 1], sv: [['1 tbsp', 15], ['juice of 1 lemon', 48]], k: 'pareve',
  },
  {
    id: 'pickles', name: 'Pickles, kosher dill',
    aka: ['pickle', 'dill pickle', 'gherkins', 'pickled cucumbers'],
    n: [12, 0.5, 2.4, 0.4, 1.0, 1.1, 875], sv: [['1 spear', 35], ['1 medium pickle', 65]], k: 'pareve',
  },
  {
    id: 'honey', name: 'Honey',
    aka: ['raw honey', 'clover honey'],
    n: [304, 0.3, 82.4, 0, 0.2, 82.1, 4], sv: [['1 tbsp', 21], ['1 tsp', 7]], k: 'pareve', diet: 'vegetarian',
  },
  {
    id: 'maple-syrup', name: 'Maple syrup',
    aka: ['syrup', 'pure maple syrup', 'pancake syrup'],
    n: [260, 0, 67.0, 0.1, 0, 60.5, 12], sv: [['1 tbsp', 20], ['1/4 cup', 80]], k: 'pareve',
  },
  {
    id: 'jam', name: 'Jam or preserves',
    aka: ['jelly', 'jam', 'preserves', 'fruit spread'],
    n: [278, 0.4, 68.9, 0.1, 1.1, 48.5, 32], sv: [['1 tbsp', 20]], k: 'pareve',
  },
  {
    id: 'sugar', name: 'Sugar, white',
    aka: ['sugar', 'granulated sugar', 'table sugar', 'cane sugar'],
    n: [387, 0, 100, 0, 0, 99.8, 1], sv: [['1 tsp', 4], ['1 tbsp', 12.5]], k: 'pareve',
  },
  {
    id: 'salt', name: 'Salt',
    aka: ['table salt', 'sea salt', 'kosher salt'],
    n: [0, 0, 0, 0, 0, 0, 38758], sv: [['1/4 tsp', 1.5], ['1 tsp', 6]], k: 'pareve',
  },
])

/** Desserts, baked goods and candy. Values per 100 g. */
export const SWEET_FOODS = defineFoods('sweets', [
  {
    id: 'cookie-chocolate-chip', name: 'Chocolate chip cookie',
    aka: ['cookie', 'cookies', 'choc chip cookie'],
    n: [488, 5.4, 64.4, 24.7, 2.4, 33.0, 360], sv: [['1 medium cookie', 16], ['1 large bakery cookie', 60]], k: 'dairy', al: ['wheat', 'milk', 'egg', 'soy'],
  },
  {
    id: 'chocolate-sandwich-cookies', name: 'Chocolate sandwich cookies',
    aka: ['sandwich cookies', 'cream-filled cookies', 'cookies'],
    n: [471, 4.2, 70.0, 19.6, 2.5, 41.0, 400], sv: [['3 cookies', 34], ['1 cookie', 11]], k: 'dairy', al: ['wheat', 'soy', 'milk'],
  },
  {
    id: 'brownie', name: 'Brownie',
    aka: ['brownies', 'chocolate brownie'],
    n: [405, 4.8, 63.9, 16.3, 2.1, 36.6, 285], sv: [['1 brownie (2" square)', 56]], k: 'pareve', al: ['wheat', 'egg'],
  },
  {
    id: 'chocolate-cake', name: 'Chocolate cake with frosting',
    aka: ['cake', 'birthday cake', 'chocolate layer cake'],
    n: [367, 4.1, 54.6, 16.4, 2.8, 36.0, 334], sv: [['1 slice', 64]], k: 'dairy', al: ['wheat', 'milk', 'egg'],
  },
  {
    id: 'honey-cake', name: 'Honey cake',
    aka: ['lekach', 'rosh hashanah cake'],
    n: [330, 4.5, 55.0, 10.0, 1.0, 32.0, 260], sv: [['1 slice', 70]], k: 'pareve', al: ['wheat', 'egg'],
  },
  {
    id: 'cheesecake', name: 'Cheesecake',
    aka: ['new york cheesecake', 'cheese cake'],
    n: [321, 5.5, 25.5, 22.5, 0.4, 21.8, 438], sv: [['1 slice', 80]], k: 'dairy', al: ['milk', 'egg', 'wheat'],
  },
  {
    id: 'apple-pie', name: 'Apple pie',
    aka: ['pie', 'fruit pie'],
    n: [237, 1.9, 34.0, 11.0, 1.6, 15.0, 266], sv: [['1 slice (1/8 pie)', 125]], k: 'pareve', diet: 'vegetarian', al: ['wheat'],
  },
  {
    id: 'muffin-blueberry', name: 'Blueberry muffin',
    aka: ['muffin', 'bakery muffin'],
    n: [377, 4.4, 54.7, 15.6, 1.6, 30.0, 340], sv: [['1 medium muffin', 113], ['1 mini muffin', 17]], k: 'dairy', al: ['wheat', 'milk', 'egg'],
  },
  {
    id: 'donut-glazed', name: 'Donut, glazed',
    aka: ['doughnut', 'donut', 'sufganiyah'],
    n: [403, 6.4, 44.3, 22.9, 1.2, 19.0, 342], sv: [['1 medium donut', 60]], k: 'dairy', al: ['wheat', 'milk', 'egg', 'soy'],
  },
  {
    id: 'rugelach', name: 'Rugelach',
    aka: ['rugelah', 'rugalach', 'crescent cookies'],
    n: [430, 5.5, 50.0, 23.5, 1.8, 25.0, 200], sv: [['1 piece', 28], ['2 pieces', 56]], k: 'dairy', al: ['wheat', 'milk', 'egg', 'tree-nuts'],
  },
  {
    id: 'ice-cream-vanilla', name: 'Ice cream, vanilla',
    aka: ['ice cream', 'vanilla ice cream'],
    n: [207, 3.5, 23.6, 11.0, 0.7, 21.2, 80], sv: [['1/2 cup', 66], ['1 cup', 132]], k: 'dairy', al: ['milk'],
  },
  {
    id: 'ice-cream-chocolate', name: 'Ice cream, chocolate',
    aka: ['chocolate ice cream'],
    n: [216, 3.8, 28.2, 11.0, 1.2, 25.4, 76], sv: [['1/2 cup', 66], ['1 cup', 132]], k: 'dairy', al: ['milk'],
  },
  {
    id: 'frozen-yogurt', name: 'Frozen yogurt, vanilla',
    aka: ['froyo', 'soft serve yogurt'],
    n: [159, 4.0, 24.2, 5.6, 0, 21.0, 87], sv: [['1/2 cup', 72], ['1 cup', 144]], k: 'dairy', al: ['milk'],
  },
  {
    id: 'sorbet', name: 'Sorbet',
    aka: ['fruit sorbet', 'sorbetto', 'pareve ice cream'],
    n: [120, 0.2, 30.0, 0.1, 0.5, 26.0, 15], sv: [['1/2 cup', 90]], k: 'pareve',
  },
  {
    id: 'milk-chocolate', name: 'Milk chocolate',
    aka: ['chocolate bar', 'candy bar', 'chocolate'],
    n: [535, 7.7, 59.4, 29.7, 3.4, 51.5, 79], sv: [['1 bar (1.55 oz)', 44], ['1 oz', 28]], k: 'dairy', al: ['milk', 'soy'],
  },
  {
    id: 'peanut-butter-cups', name: 'Peanut butter cups',
    aka: ['peanut butter cup', 'chocolate peanut butter cups', 'candy'],
    n: [515, 10.2, 57.0, 30.5, 3.0, 47.0, 357], sv: [['1 package (2 cups)', 42], ['1 cup', 21]], k: 'dairy', al: ['milk', 'peanuts', 'soy'],
  },
  {
    id: 'jelly-beans', name: 'Jelly beans',
    aka: ['candy', 'jellybeans', 'sweets'],
    n: [375, 0, 93.6, 0.1, 0.2, 55.0, 50], sv: [['10 large jelly beans', 28]], k: 'pareve', diet: 'vegetarian',
  },
  {
    id: 'halva', name: 'Halva',
    aka: ['halvah', 'halawa', 'sesame candy'],
    n: [469, 12.0, 60.0, 21.5, 4.5, 45.0, 190], sv: [['1 oz', 28], ['1 slice', 40]], k: 'pareve', al: ['sesame'],
  },
  {
    id: 'chocolate-hazelnut-spread', name: 'Chocolate hazelnut spread',
    aka: ['hazelnut spread', 'chocolate spread'],
    n: [539, 6.3, 57.5, 30.9, 3.4, 56.3, 41], sv: [['1 tbsp', 19], ['2 tbsp', 37]], k: 'dairy', al: ['milk', 'tree-nuts', 'soy'],
  },
])
