import { defineFoods } from './define'

/** Beans, lentils, edamame, hummus and falafel. Values per 100 g (cooked unless noted). */
export const LEGUME_FOODS = defineFoods('legumes', [
  {
    id: 'black-beans', name: 'Black beans, cooked',
    aka: ['black beans', 'canned black beans', 'frijoles negros', 'turtle beans'],
    n: [132, 8.9, 23.7, 0.5, 8.7, 0.3, 1], sv: [['1/2 cup', 86], ['1 cup', 172], ['1 can, drained', 260]], k: 'pareve',
  },
  {
    id: 'chickpeas', name: 'Chickpeas, cooked',
    aka: ['chickpeas', 'garbanzo beans', 'canned chickpeas', 'chick peas', 'hummus beans'],
    n: [164, 8.9, 27.4, 2.6, 7.6, 4.8, 7], sv: [['1/2 cup', 82], ['1 cup', 164], ['1 can, drained', 240]], k: 'pareve',
  },
  {
    id: 'lentils-cooked', name: 'Lentils, cooked',
    aka: ['lentils', 'red lentils', 'green lentils', 'brown lentils', 'dal'],
    n: [116, 9.0, 20.1, 0.4, 7.9, 1.8, 2], sv: [['1/2 cup', 99], ['1 cup', 198]], k: 'pareve',
  },
  {
    id: 'lentils-dry', name: 'Lentils, dry (uncooked)',
    aka: ['dry lentils', 'raw lentils'],
    n: [352, 24.6, 63.4, 1.1, 10.7, 2.0, 6], sv: [['1/4 cup dry', 48], ['1 cup dry', 192]], k: 'pareve',
  },
  {
    id: 'kidney-beans', name: 'Kidney beans, cooked',
    aka: ['kidney beans', 'red beans', 'canned kidney beans'],
    n: [127, 8.7, 22.8, 0.5, 6.4, 0.3, 2], sv: [['1/2 cup', 89], ['1 can, drained', 260]], k: 'pareve',
  },
  {
    id: 'pinto-beans', name: 'Pinto beans, cooked',
    aka: ['pinto beans', 'canned pinto beans'],
    n: [143, 9.0, 26.2, 0.7, 9.0, 0.3, 1], sv: [['1/2 cup', 86], ['1 can, drained', 260]], k: 'pareve',
  },
  {
    id: 'white-beans', name: 'White beans, cooked',
    aka: ['cannellini beans', 'navy beans', 'great northern beans', 'butter beans'],
    n: [139, 9.7, 25.1, 0.4, 6.3, 0.3, 6], sv: [['1/2 cup', 90], ['1 can, drained', 260]], k: 'pareve',
  },
  {
    id: 'black-eyed-peas', name: 'Black-eyed peas, cooked',
    aka: ['black eyed peas', 'cowpeas'],
    n: [116, 7.7, 20.8, 0.5, 6.5, 3.3, 4], sv: [['1/2 cup', 86]], k: 'pareve',
  },
  {
    id: 'split-peas', name: 'Split peas, cooked',
    aka: ['split pea', 'yellow split peas', 'green split peas'],
    n: [118, 8.3, 21.1, 0.4, 8.3, 2.9, 2], sv: [['1/2 cup', 98]], k: 'pareve',
  },
  {
    id: 'edamame', name: 'Edamame, shelled',
    aka: ['edamame', 'soybeans', 'green soybeans'],
    n: [121, 11.9, 8.9, 5.2, 5.2, 2.2, 6], sv: [['1/2 cup', 78], ['1 cup', 155]], k: 'pareve', al: ['soy'],
  },
  {
    id: 'hummus', name: 'Hummus',
    aka: ['houmous', 'humus', 'chickpea dip', 'hommus'],
    n: [166, 7.9, 14.3, 9.6, 6.0, 0.3, 379], sv: [['2 tbsp', 30], ['1/4 cup', 62]], k: 'pareve', al: ['sesame'],
  },
  {
    id: 'falafel', name: 'Falafel',
    aka: ['felafel', 'chickpea fritters'],
    n: [333, 13.3, 31.8, 17.8, 4.9, 2.0, 294], sv: [['1 falafel ball', 17], ['4 falafel balls', 68]], def: 1, k: 'pareve',
  },
  {
    id: 'refried-beans', name: 'Refried beans, vegetarian',
    aka: ['refried beans', 'frijoles refritos'],
    n: [91, 5.5, 15.3, 1.2, 5.3, 0.3, 449], sv: [['1/2 cup', 120]], k: 'pareve',
  },
  {
    id: 'baked-beans', name: 'Baked beans, vegetarian',
    aka: ['baked beans', 'beans in tomato sauce'],
    n: [94, 4.8, 21.1, 0.4, 4.1, 7.9, 343], sv: [['1/2 cup', 127]], k: 'pareve',
  },
])

/** Nuts, seeds and nut butters. Values per 100 g. */
export const NUT_SEED_FOODS = defineFoods('nuts-seeds', [
  {
    id: 'almonds', name: 'Almonds',
    aka: ['almond', 'raw almonds', 'roasted almonds'],
    n: [579, 21.2, 21.6, 49.9, 12.5, 4.4, 1], sv: [['1 oz (23 almonds)', 28], ['10 almonds', 12], ['1/4 cup', 36]], k: 'pareve', al: ['tree-nuts'],
  },
  {
    id: 'walnuts', name: 'Walnuts',
    aka: ['walnut', 'walnut halves'],
    n: [654, 15.2, 13.7, 65.2, 6.7, 2.6, 2], sv: [['1 oz (14 halves)', 28], ['1/4 cup chopped', 30], ['1 tbsp chopped', 7]], k: 'pareve', al: ['tree-nuts'],
  },
  {
    id: 'cashews', name: 'Cashews',
    aka: ['cashew', 'cashew nuts'],
    n: [553, 18.2, 30.2, 43.9, 3.3, 5.9, 12], sv: [['1 oz (18 cashews)', 28]], k: 'pareve', al: ['tree-nuts'],
  },
  {
    id: 'pistachios', name: 'Pistachios',
    aka: ['pistachio', 'pistachio nuts'],
    n: [560, 20.2, 27.2, 45.3, 10.6, 7.7, 1], sv: [['1 oz (49 kernels)', 28]], k: 'pareve', al: ['tree-nuts'],
  },
  {
    id: 'pecans', name: 'Pecans',
    aka: ['pecan', 'pecan halves'],
    n: [691, 9.2, 13.9, 72.0, 9.6, 4.0, 0], sv: [['1 oz (19 halves)', 28]], k: 'pareve', al: ['tree-nuts'],
  },
  {
    id: 'hazelnuts', name: 'Hazelnuts',
    aka: ['hazelnut', 'filberts'],
    n: [628, 15.0, 16.7, 60.8, 9.7, 4.3, 0], sv: [['1 oz', 28]], k: 'pareve', al: ['tree-nuts'],
  },
  {
    id: 'macadamia-nuts', name: 'Macadamia nuts',
    aka: ['macadamia', 'macadamias'],
    n: [718, 7.9, 13.8, 75.8, 8.6, 4.6, 5], sv: [['1 oz', 28]], k: 'pareve', al: ['tree-nuts'],
  },
  {
    id: 'brazil-nuts', name: 'Brazil nuts',
    aka: ['brazil nut'],
    n: [659, 14.3, 11.7, 67.1, 7.5, 2.3, 3], sv: [['1 oz (6 nuts)', 28], ['1 nut', 5]], k: 'pareve', al: ['tree-nuts'],
  },
  {
    id: 'mixed-nuts', name: 'Mixed nuts, dry roasted',
    aka: ['mixed nuts', 'nut mix', 'deluxe nuts'],
    n: [594, 17.3, 25.4, 51.5, 9.0, 4.6, 12], sv: [['1 oz', 28], ['1/4 cup', 34]], k: 'pareve', al: ['tree-nuts', 'peanuts'],
  },
  {
    id: 'peanuts', name: 'Peanuts, dry roasted',
    aka: ['peanut', 'roasted peanuts', 'groundnuts'],
    n: [585, 23.7, 21.5, 49.7, 8.0, 4.2, 6], sv: [['1 oz', 28], ['1/4 cup', 37]], k: 'pareve', al: ['peanuts'],
  },
  {
    id: 'peanut-butter', name: 'Peanut butter',
    aka: ['pb', 'peanut butter smooth', 'crunchy peanut butter', 'natural peanut butter'],
    n: [588, 25.1, 19.6, 50.4, 6.0, 9.2, 459], sv: [['1 tbsp', 16], ['2 tbsp', 32]], def: 1, k: 'pareve', al: ['peanuts'],
  },
  {
    id: 'powdered-peanut-butter', name: 'Powdered peanut butter',
    aka: ['peanut butter powder', 'pb powder', 'defatted peanut flour'],
    n: [450, 50.0, 33.0, 12.5, 8.0, 17.0, 780], sv: [['2 tbsp', 12]], k: 'pareve', al: ['peanuts'],
  },
  {
    id: 'almond-butter', name: 'Almond butter',
    aka: ['almond spread', 'nut butter'],
    n: [614, 21.0, 18.8, 55.5, 10.3, 4.4, 7], sv: [['1 tbsp', 16], ['2 tbsp', 32]], k: 'pareve', al: ['tree-nuts'],
  },
  {
    id: 'chia-seeds', name: 'Chia seeds',
    aka: ['chia', 'chia seed'],
    n: [486, 16.5, 42.1, 30.7, 34.4, 0, 16], sv: [['1 tbsp', 12], ['2 tbsp', 24]], k: 'pareve',
  },
  {
    id: 'flaxseed-ground', name: 'Flaxseed, ground',
    aka: ['flax', 'flax meal', 'linseed', 'ground flaxseed'],
    n: [534, 18.3, 28.9, 42.2, 27.3, 1.6, 30], sv: [['1 tbsp', 7], ['2 tbsp', 14]], k: 'pareve',
  },
  {
    id: 'hemp-seeds', name: 'Hemp seeds, hulled',
    aka: ['hemp hearts', 'hemp seed'],
    n: [553, 31.6, 8.7, 48.8, 4.0, 1.5, 5], sv: [['3 tbsp', 30], ['1 tbsp', 10]], k: 'pareve',
  },
  {
    id: 'pumpkin-seeds', name: 'Pumpkin seeds, roasted',
    aka: ['pepitas', 'pumpkin seed kernels'],
    n: [574, 29.8, 14.7, 49.1, 6.5, 1.3, 7], sv: [['1/4 cup', 30], ['1 tbsp', 8]], k: 'pareve',
  },
  {
    id: 'sunflower-seeds', name: 'Sunflower seeds, roasted',
    aka: ['sunflower seed kernels', 'garinim'],
    n: [582, 19.3, 24.1, 49.8, 11.1, 2.7, 3], sv: [['1/4 cup', 32], ['1 tbsp', 8]], k: 'pareve',
  },
  {
    id: 'sesame-seeds', name: 'Sesame seeds',
    aka: ['sesame', 'toasted sesame seeds'],
    n: [573, 17.7, 23.5, 49.7, 11.8, 0.3, 11], sv: [['1 tbsp', 9], ['1 tsp', 3]], k: 'pareve', al: ['sesame'],
  },
])

/** Oils, spreads and fat-dense whole foods. Values per 100 g. */
export const FAT_OIL_FOODS = defineFoods('fats-oils', [
  {
    id: 'olive-oil', name: 'Olive oil',
    aka: ['extra virgin olive oil', 'evoo', 'oil'],
    n: [884, 0, 0, 100, 0, 0, 2], sv: [['1 tbsp', 13.5], ['1 tsp', 4.5]], k: 'pareve',
  },
  {
    id: 'canola-oil', name: 'Canola or vegetable oil',
    aka: ['vegetable oil', 'canola', 'cooking oil', 'sunflower oil', 'oil'],
    n: [884, 0, 0, 100, 0, 0, 0], sv: [['1 tbsp', 14], ['1 tsp', 4.7]], k: 'pareve',
  },
  {
    id: 'avocado-oil', name: 'Avocado oil',
    aka: ['oil'],
    n: [884, 0, 0, 100, 0, 0, 0], sv: [['1 tbsp', 14], ['1 tsp', 4.7]], k: 'pareve',
  },
  {
    id: 'coconut-oil', name: 'Coconut oil',
    aka: ['virgin coconut oil'],
    n: [892, 0, 0, 99.1, 0, 0, 0], sv: [['1 tbsp', 13.6], ['1 tsp', 4.5]], k: 'pareve',
  },
  {
    id: 'sesame-oil', name: 'Sesame oil',
    aka: ['toasted sesame oil'],
    n: [884, 0, 0, 100, 0, 0, 0], sv: [['1 tsp', 4.5], ['1 tbsp', 13.6]], k: 'pareve', al: ['sesame'],
  },
  {
    id: 'cooking-spray', name: 'Cooking spray',
    aka: ['oil spray', 'nonstick spray', 'pan spray'],
    n: [884, 0, 0, 100, 0, 0, 0], sv: [['1-second spray', 0.25], ['3-second spray', 0.75]], k: 'pareve',
  },
  {
    id: 'margarine', name: 'Plant-based butter (pareve margarine)',
    aka: ['margarine', 'vegan butter', 'pareve margarine', 'spread'],
    n: [717, 0.2, 0.7, 80.7, 0, 0, 751], sv: [['1 tsp', 5], ['1 tbsp', 14]], k: 'pareve',
  },
  {
    id: 'avocado', name: 'Avocado',
    aka: ['avocados', 'hass avocado', 'avo'],
    n: [160, 2.0, 8.5, 14.7, 6.7, 0.7, 7], sv: [['1/2 avocado', 68], ['1/3 avocado', 45], ['1 avocado', 136], ['1 cup sliced', 146]], k: 'pareve', produce: true,
  },
  {
    id: 'olives', name: 'Olives',
    aka: ['black olives', 'green olives', 'kalamata olives'],
    n: [115, 0.8, 6.3, 10.7, 3.2, 0, 735], sv: [['5 olives', 20], ['10 olives', 40]], k: 'pareve',
  },
  {
    id: 'mayonnaise', name: 'Mayonnaise',
    aka: ['mayo', 'regular mayonnaise'],
    n: [680, 1.0, 0.6, 74.9, 0, 0.6, 635], sv: [['1 tbsp', 14], ['1 tsp', 5]], k: 'pareve', al: ['egg'],
  },
  {
    id: 'mayonnaise-light', name: 'Mayonnaise, light',
    aka: ['light mayo', 'reduced fat mayonnaise', 'lite mayo'],
    n: [238, 0.4, 9.2, 22.2, 0, 2.6, 827], sv: [['1 tbsp', 15], ['2 tbsp', 30]], k: 'pareve', al: ['egg'],
  },
  {
    id: 'tahini', name: 'Tahini',
    aka: ['tahina', 'sesame paste', 'tahini sauce'],
    n: [595, 17.0, 21.2, 53.8, 9.3, 0.5, 115], sv: [['1 tbsp', 15], ['2 tbsp', 30]], k: 'pareve', al: ['sesame'],
  },
])
