import { defineFoods } from './define'

/** Eggs. Values per 100 g. */
export const EGG_FOODS = defineFoods('eggs', [
  {
    id: 'egg-large', name: 'Egg, whole, large',
    aka: ['egg', 'eggs', 'whole egg', 'raw egg', 'boiled egg'],
    n: [143, 12.6, 0.7, 9.5, 0, 0.4, 142], sv: [['1 large egg', 50], ['2 large eggs', 100], ['1 medium egg', 44], ['1 extra-large egg', 56]], k: 'pareve', al: ['egg'],
  },
  {
    id: 'egg-hard-boiled', name: 'Egg, hard-boiled',
    aka: ['hard boiled egg', 'boiled egg', 'hardboiled eggs'],
    n: [155, 12.6, 1.1, 10.6, 0, 1.1, 124], sv: [['1 large egg', 50], ['1 cup chopped', 136]], k: 'pareve', al: ['egg'],
  },
  {
    id: 'egg-white', name: 'Egg whites',
    aka: ['egg white', 'liquid egg whites', 'carton egg whites'],
    n: [52, 10.9, 0.7, 0.2, 0, 0.7, 166], sv: [['1 large egg white', 33], ['3 tbsp liquid', 46], ['1/2 cup', 122], ['1 cup', 243]], k: 'pareve', al: ['egg'],
  },
  {
    id: 'egg-yolk', name: 'Egg yolk',
    aka: ['yolk', 'egg yolks'],
    n: [322, 15.9, 3.6, 26.5, 0, 0.6, 48], sv: [['1 large yolk', 17]], k: 'pareve', al: ['egg'],
  },
  {
    id: 'egg-fried', name: 'Egg, fried',
    aka: ['fried egg', 'sunny side up', 'over easy egg'],
    n: [196, 13.6, 0.8, 14.8, 0, 0.4, 207], sv: [['1 large egg', 46], ['2 large eggs', 92]], k: 'pareve', al: ['egg'],
  },
  {
    id: 'egg-scrambled', name: 'Eggs, scrambled with milk',
    aka: ['scrambled eggs', 'scrambled egg'],
    n: [149, 10.0, 1.6, 11.0, 0, 1.4, 145], sv: [['1 egg, scrambled', 61], ['2 eggs, scrambled', 122], ['1 cup', 220]], k: 'dairy', al: ['egg', 'milk'],
  },
])

/** Milk, yogurt, cheese and plant milks. Milks and drinkable kefir are per 100 ml. */
export const DAIRY_FOODS = defineFoods('dairy', [
  // ---- Milk -------------------------------------------------------------------------
  {
    id: 'milk-skim', name: 'Milk, skim (nonfat)',
    aka: ['skim milk', 'fat free milk', 'nonfat milk', 'milk'],
    n: [35, 3.5, 5.1, 0.1, 0, 5.1, 43], ml: true, sv: [['1 cup', 240], ['1/2 cup', 120], ['1 tbsp', 15]], k: 'dairy', al: ['milk'],
  },
  {
    id: 'milk-1', name: 'Milk, 1% low-fat',
    aka: ['1% milk', 'low fat milk', 'milk'],
    n: [43, 3.5, 5.1, 1.0, 0, 5.1, 45], ml: true, sv: [['1 cup', 240], ['1/2 cup', 120]], k: 'dairy', al: ['milk'],
  },
  {
    id: 'milk-2', name: 'Milk, 2% reduced-fat',
    aka: ['2% milk', 'reduced fat milk', 'milk'],
    n: [52, 3.4, 4.9, 2.0, 0, 4.9, 48], ml: true, sv: [['1 cup', 240], ['1/2 cup', 120], ['1 tbsp', 15]], k: 'dairy', al: ['milk'],
  },
  {
    id: 'milk-whole', name: 'Milk, whole',
    aka: ['whole milk', 'full fat milk', 'milk', '3.25% milk'],
    n: [63, 3.2, 4.9, 3.4, 0, 4.9, 44], ml: true, sv: [['1 cup', 240], ['1/2 cup', 120], ['1 tbsp', 15]], k: 'dairy', al: ['milk'],
  },
  {
    id: 'chocolate-milk', name: 'Chocolate milk, 1% low-fat',
    aka: ['chocolate milk', 'choc milk', 'cocoa milk'],
    n: [64, 3.3, 10.8, 1.0, 0.8, 10.0, 63], ml: true, sv: [['1 cup', 240], ['1 bottle (14 fl oz)', 414]], k: 'dairy', al: ['milk'],
  },
  {
    id: 'kefir', name: 'Kefir, plain low-fat',
    aka: ['kefir', 'cultured milk', 'drinkable yogurt'],
    n: [43, 3.9, 4.6, 1.0, 0, 4.6, 42], ml: true, sv: [['1 cup', 240], ['1/2 cup', 120]], k: 'dairy', al: ['milk'],
  },
  // ---- Yogurt -----------------------------------------------------------------------
  {
    id: 'greek-yogurt-nonfat', name: 'Greek yogurt, plain nonfat',
    aka: ['greek yogurt', 'nonfat greek yogurt', '0% greek yogurt', 'strained yogurt', 'yoghurt'],
    n: [59, 10.2, 3.6, 0.4, 0, 3.2, 36], sv: [['3/4 cup', 170], ['1 single-serve cup', 150], ['1 cup', 227], ['2 tbsp', 30]], k: 'dairy', al: ['milk'],
  },
  {
    id: 'greek-yogurt-2', name: 'Greek yogurt, plain 2%',
    aka: ['2% greek yogurt', 'low fat greek yogurt', 'yoghurt'],
    n: [73, 10.0, 3.9, 1.9, 0, 3.6, 34], sv: [['3/4 cup', 170], ['1 single-serve cup', 150], ['1 cup', 227]], k: 'dairy', al: ['milk'],
  },
  {
    id: 'greek-yogurt-whole', name: 'Greek yogurt, plain whole milk',
    aka: ['full fat greek yogurt', '5% greek yogurt', 'yoghurt'],
    n: [97, 9.0, 4.0, 5.0, 0, 4.0, 35], sv: [['3/4 cup', 170], ['1 cup', 227]], k: 'dairy', al: ['milk'],
  },
  {
    id: 'greek-yogurt-vanilla', name: 'Greek yogurt, vanilla nonfat',
    aka: ['vanilla greek yogurt', 'flavored greek yogurt'],
    n: [78, 8.6, 10.5, 0.2, 0, 9.5, 33], sv: [['1 single-serve cup', 150], ['3/4 cup', 170]], k: 'dairy', al: ['milk'],
  },
  {
    id: 'yogurt-plain-lowfat', name: 'Yogurt, plain low-fat',
    aka: ['plain yogurt', 'low fat yogurt', 'yoghurt'],
    n: [63, 5.3, 7.0, 1.6, 0, 7.0, 70], sv: [['1 cup', 245], ['3/4 cup', 170]], k: 'dairy', al: ['milk'],
  },
  {
    id: 'yogurt-plain-whole', name: 'Yogurt, plain whole milk',
    aka: ['whole milk yogurt', 'full fat yogurt', 'yoghurt'],
    n: [61, 3.5, 4.7, 3.3, 0, 4.7, 46], sv: [['1 cup', 245], ['3/4 cup', 170]], k: 'dairy', al: ['milk'],
  },
  {
    id: 'yogurt-fruit', name: 'Yogurt, fruit-flavored low-fat',
    aka: ['fruit yogurt', 'strawberry yogurt', 'flavored yogurt', 'yoghurt'],
    n: [99, 4.0, 18.6, 1.2, 0, 18.6, 53], sv: [['1 container (6 oz)', 170]], k: 'dairy', al: ['milk'],
  },
  // ---- Cottage cheese & soft cheese -------------------------------------------------
  {
    id: 'cottage-cheese-lowfat', name: 'Cottage cheese, low-fat 2%',
    aka: ['cottage cheese', 'low fat cottage cheese', 'curds'],
    n: [81, 10.5, 4.8, 2.3, 0, 4.0, 308], sv: [['1/2 cup', 113], ['1 cup', 226], ['1 single-serve cup', 150]], k: 'dairy', al: ['milk'],
  },
  {
    id: 'cottage-cheese-full-fat', name: 'Cottage cheese, full-fat 4%',
    aka: ['full fat cottage cheese', 'creamed cottage cheese'],
    n: [98, 11.1, 3.4, 4.3, 0, 2.7, 364], sv: [['1/2 cup', 113], ['1 cup', 226]], k: 'dairy', al: ['milk'],
  },
  {
    id: 'cottage-cheese-nonfat', name: 'Cottage cheese, nonfat',
    aka: ['fat free cottage cheese', 'dry curd cottage cheese'],
    n: [72, 10.3, 6.7, 0.3, 0, 1.9, 330], sv: [['1/2 cup', 113], ['1 cup', 226]], k: 'dairy', al: ['milk'],
  },
  {
    id: 'ricotta-part-skim', name: 'Ricotta, part-skim',
    aka: ['ricotta', 'ricotta cheese'],
    n: [138, 11.4, 5.1, 7.9, 0, 0.3, 99], sv: [['1/4 cup', 62], ['1/2 cup', 124]], k: 'dairy', al: ['milk'],
  },
  {
    id: 'cream-cheese', name: 'Cream cheese',
    aka: ['schmear', 'cream cheese spread'],
    n: [342, 5.9, 4.1, 34.2, 0, 3.2, 321], sv: [['1 tbsp', 15], ['2 tbsp', 29], ['1 oz', 28]], def: 1, k: 'dairy', al: ['milk'],
  },
  {
    id: 'cream-cheese-light', name: 'Cream cheese, light (Neufchâtel)',
    aka: ['light cream cheese', 'neufchatel', 'reduced fat cream cheese', 'schmear'],
    n: [253, 9.2, 3.6, 22.8, 0, 3.2, 334], sv: [['1 tbsp', 15], ['2 tbsp', 30]], def: 1, k: 'dairy', al: ['milk'],
  },
  {
    id: 'goat-cheese', name: 'Goat cheese, soft',
    aka: ['chevre', 'goats cheese'],
    n: [264, 18.5, 0.9, 21.1, 0, 0.9, 459], sv: [['1 oz', 28]], k: 'dairy', al: ['milk'],
  },
  {
    id: 'feta', name: 'Feta cheese',
    aka: ['feta', 'crumbled feta', 'bulgarian cheese', 'salty cheese'],
    n: [264, 14.2, 4.1, 21.3, 0, 4.1, 917], sv: [['1 oz', 28], ['1/4 cup crumbled', 38]], k: 'dairy', al: ['milk'],
  },
  // ---- Hard & sliced cheese ---------------------------------------------------------
  {
    id: 'cheddar', name: 'Cheddar cheese',
    aka: ['cheddar', 'cheese', 'shredded cheese', 'sharp cheddar'],
    n: [403, 24.9, 1.3, 33.1, 0, 0.5, 621], sv: [['1 oz', 28], ['1 slice', 21], ['1/4 cup shredded', 28]], k: 'dairy', al: ['milk'],
  },
  {
    id: 'mozzarella-part-skim', name: 'Mozzarella, part-skim',
    aka: ['mozzarella', 'shredded mozzarella', 'pizza cheese'],
    n: [254, 24.3, 2.8, 15.9, 0, 1.1, 619], sv: [['1 oz', 28], ['1/4 cup shredded', 28]], k: 'dairy', al: ['milk'],
  },
  {
    id: 'mozzarella-whole', name: 'Mozzarella, whole milk',
    aka: ['fresh mozzarella', 'mozzarella ball', 'buffalo mozzarella'],
    n: [300, 22.2, 2.2, 22.4, 0, 1.0, 627], sv: [['1 oz', 28], ['1 slice', 20]], k: 'dairy', al: ['milk'],
  },
  {
    id: 'string-cheese', name: 'String cheese',
    aka: ['cheese stick', 'mozzarella stick', 'snack cheese'],
    n: [254, 24.3, 2.8, 15.9, 0, 1.1, 619], sv: [['1 stick', 28]], k: 'dairy', al: ['milk'],
  },
  {
    id: 'parmesan', name: 'Parmesan cheese, grated',
    aka: ['parmesan', 'parmigiano', 'grated cheese'],
    n: [431, 38.5, 4.1, 28.6, 0, 0.9, 1529], sv: [['1 tbsp', 5], ['2 tbsp', 10], ['1/4 cup', 25]], k: 'dairy', al: ['milk'],
  },
  {
    id: 'swiss-cheese', name: 'Swiss cheese',
    aka: ['swiss', 'emmental', 'sliced swiss'],
    n: [393, 27.0, 1.4, 31.0, 0, 0.3, 187], sv: [['1 slice (1 oz)', 28]], k: 'dairy', al: ['milk'],
  },
  {
    id: 'american-cheese', name: 'American cheese slice',
    aka: ['american cheese', 'processed cheese', 'cheese single', 'yellow cheese'],
    n: [371, 18.1, 7.4, 30.7, 0, 3.7, 1500], sv: [['1 slice', 21]], k: 'dairy', al: ['milk'],
  },
  // ---- Cream & butter ---------------------------------------------------------------
  {
    id: 'butter', name: 'Butter, salted',
    aka: ['butter', 'salted butter'],
    n: [717, 0.9, 0.1, 81.1, 0, 0.1, 643], sv: [['1 tsp', 5], ['1 tbsp', 14]], k: 'dairy', al: ['milk'],
  },
  {
    id: 'heavy-cream', name: 'Heavy cream',
    aka: ['whipping cream', 'double cream', 'heavy whipping cream'],
    n: [345, 2.1, 2.8, 37.0, 0, 2.8, 38], sv: [['1 tbsp', 15], ['1/4 cup', 60]], k: 'dairy', al: ['milk'],
  },
  {
    id: 'half-and-half', name: 'Half-and-half',
    aka: ['half and half', 'coffee cream', 'creamer', 'light cream'],
    n: [130, 3.1, 4.3, 11.5, 0, 4.1, 41], sv: [['1 tbsp', 15], ['2 tbsp', 30]], k: 'dairy', al: ['milk'],
  },
  {
    id: 'sour-cream', name: 'Sour cream',
    aka: ['soured cream', 'smetana'],
    n: [198, 2.4, 4.6, 19.4, 0, 3.4, 31], sv: [['1 tbsp', 12], ['2 tbsp', 24]], k: 'dairy', al: ['milk'],
  },
  // ---- Plant milks (not dairy: pareve) ----------------------------------------------
  {
    id: 'almond-milk', name: 'Almond milk, unsweetened',
    aka: ['almond milk', 'almond beverage', 'nut milk', 'dairy-free milk'],
    n: [15, 0.6, 0.6, 1.2, 0.2, 0, 72], ml: true, sv: [['1 cup', 240], ['1/2 cup', 120]], k: 'pareve', al: ['tree-nuts'],
  },
  {
    id: 'oat-milk', name: 'Oat milk',
    aka: ['oat milk', 'oat beverage', 'dairy-free milk'],
    n: [50, 1.3, 6.7, 2.1, 0.8, 2.9, 42], ml: true, sv: [['1 cup', 240], ['1/2 cup', 120]], k: 'pareve',
  },
  {
    id: 'soy-milk', name: 'Soy milk, unsweetened',
    aka: ['soy milk', 'soya milk', 'soymilk', 'dairy-free milk'],
    n: [33, 2.9, 1.7, 1.7, 0.4, 0.4, 31], ml: true, sv: [['1 cup', 240], ['1/2 cup', 120]], k: 'pareve', al: ['soy'],
  },
  {
    id: 'coconut-milk-beverage', name: 'Coconut milk beverage, unsweetened',
    aka: ['coconut milk', 'coconut beverage', 'dairy-free milk'],
    n: [19, 0.2, 0.6, 1.9, 0, 0, 19], ml: true, sv: [['1 cup', 240]], k: 'pareve',
  },
])
