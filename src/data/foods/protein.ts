import { defineFoods } from './define'

/** Meat, poultry, fish and plant proteins. Values per 100 g (USDA FoodData Central, SR Legacy where available). */
export const PROTEIN_FOODS = defineFoods('protein', [
  // ---- Poultry ----------------------------------------------------------------------
  {
    id: 'chicken-breast-cooked', name: 'Chicken breast, cooked (skinless)',
    aka: ['chicken', 'grilled chicken', 'baked chicken', 'roast chicken breast', 'chicken breasts', 'boneless skinless chicken'],
    n: [165, 31.0, 0, 3.6, 0, 0, 74], sv: [['4 oz', 113], ['3 oz', 85], ['1 breast', 172], ['1 cup diced', 140]], k: 'meat',
  },
  {
    id: 'chicken-breast-raw', name: 'Chicken breast, raw (skinless)',
    aka: ['raw chicken', 'uncooked chicken breast', 'chicken cutlets'],
    n: [120, 22.5, 0, 2.6, 0, 0, 45], sv: [['4 oz', 113], ['1 breast', 230], ['1 lb', 454]], k: 'meat',
  },
  {
    id: 'chicken-thigh-cooked', name: 'Chicken thigh, cooked (skinless)',
    aka: ['chicken thighs', 'dark meat chicken', 'boneless thigh'],
    n: [209, 26.0, 0, 10.9, 0, 0, 95], sv: [['1 boneless thigh', 75], ['3 oz', 85], ['4 oz', 113]], k: 'meat',
  },
  {
    id: 'chicken-thigh-raw', name: 'Chicken thigh, raw (skinless)',
    aka: ['raw chicken thighs', 'boneless skinless thighs'],
    n: [121, 19.7, 0, 4.1, 0, 0, 95], sv: [['1 boneless thigh', 110], ['1 lb', 454]], k: 'meat',
  },
  {
    id: 'chicken-drumstick-cooked', name: 'Chicken drumstick, roasted (meat only)',
    aka: ['drumsticks', 'chicken leg'],
    n: [172, 28.3, 0, 5.7, 0, 0, 95], sv: [['1 drumstick', 44], ['3 oz', 85]], k: 'meat',
  },
  {
    id: 'rotisserie-chicken', name: 'Rotisserie chicken (meat and skin)',
    aka: ['store-bought chicken', 'roast chicken', 'whole roasted chicken'],
    n: [205, 25.5, 0.1, 11.4, 0, 0, 350], sv: [['3 oz', 85], ['1 cup shredded', 140], ['1/4 chicken', 180]], k: 'meat',
  },
  {
    id: 'ground-turkey-cooked', name: 'Ground turkey 93% lean, cooked',
    aka: ['turkey mince', 'lean ground turkey', 'turkey crumbles'],
    n: [213, 27.1, 0, 11.6, 0, 0, 94], sv: [['4 oz', 113], ['3 oz', 85], ['1 cup crumbles', 125]], k: 'meat',
  },
  {
    id: 'ground-turkey-raw', name: 'Ground turkey 93% lean, raw',
    aka: ['raw ground turkey', 'turkey mince raw'],
    n: [150, 18.7, 0, 8.3, 0, 0, 69], sv: [['4 oz', 113], ['1 lb package', 454]], k: 'meat',
  },
  {
    id: 'turkey-breast-roasted', name: 'Turkey breast, roasted',
    aka: ['roast turkey', 'thanksgiving turkey', 'white meat turkey'],
    n: [147, 30.1, 0, 2.1, 0, 0, 99], sv: [['3 oz', 85], ['4 oz', 113], ['1 slice', 28]], k: 'meat',
  },
  {
    id: 'turkey-deli', name: 'Turkey breast, deli sliced',
    aka: ['deli turkey', 'sliced turkey', 'lunch meat', 'cold cuts', 'oven roasted turkey'],
    n: [104, 17.1, 4.2, 1.7, 0, 3.5, 1015], sv: [['2 oz', 56], ['1 slice', 14]], k: 'meat',
  },
  // ---- Beef & lamb ------------------------------------------------------------------
  {
    id: 'ground-beef-90-cooked', name: 'Ground beef 90% lean, cooked',
    aka: ['lean ground beef', 'beef mince', 'hamburger meat', 'beef crumbles'],
    n: [217, 26.4, 0, 11.7, 0, 0, 72], sv: [['4 oz', 113], ['3 oz', 85], ['1 cup crumbles', 125]], k: 'meat',
  },
  {
    id: 'ground-beef-90-raw', name: 'Ground beef 90% lean, raw',
    aka: ['raw lean ground beef', 'beef mince raw'],
    n: [176, 20.0, 0, 10.0, 0, 0, 66], sv: [['4 oz', 113], ['1 lb', 454]], k: 'meat',
  },
  {
    id: 'ground-beef-80-cooked', name: 'Ground beef 80% lean, cooked',
    aka: ['regular ground beef', 'burger patty', 'beef patty'],
    n: [272, 27.4, 0, 17.2, 0, 0, 89], sv: [['3 oz', 85], ['1 patty (from 4 oz raw)', 85], ['4 oz', 113]], k: 'meat',
  },
  {
    id: 'sirloin-steak-cooked', name: 'Sirloin steak, cooked (lean)',
    aka: ['steak', 'top sirloin', 'grilled steak', 'beef steak'],
    n: [180, 29.5, 0, 6.6, 0, 0, 58], sv: [['4 oz', 113], ['6 oz steak', 170], ['3 oz', 85]], k: 'meat',
  },
  {
    id: 'sirloin-steak-raw', name: 'Sirloin steak, raw (lean)',
    aka: ['raw steak', 'raw sirloin', 'stir-fry beef'],
    n: [143, 22.0, 0, 6.0, 0, 0, 54], sv: [['4 oz', 113], ['8 oz steak', 227], ['1 lb', 454]], k: 'meat',
  },
  {
    id: 'ribeye-steak-cooked', name: 'Ribeye steak, cooked',
    aka: ['rib eye', 'ribeye', 'steak'],
    n: [291, 23.8, 0, 21.8, 0, 0, 54], sv: [['6 oz steak', 170], ['3 oz', 85], ['10 oz steak', 283]], k: 'meat',
  },
  {
    id: 'brisket-braised', name: 'Beef brisket, braised',
    aka: ['brisket', 'pot roast', 'shabbat brisket'],
    n: [247, 28.0, 0, 14.2, 0, 0, 62], sv: [['3 oz', 85], ['4 oz', 113], ['1 slice', 45]], k: 'meat',
  },
  {
    id: 'corned-beef', name: 'Corned beef, cooked',
    aka: ['deli corned beef', 'salt beef'],
    n: [251, 18.2, 0.5, 19.0, 0, 0, 973], sv: [['3 oz', 85], ['2 oz', 56]], k: 'meat',
  },
  {
    id: 'beef-hot-dog', name: 'Hot dog, all-beef',
    aka: ['frankfurter', 'beef frank', 'wiener', 'hotdog'],
    n: [322, 11.7, 2.9, 29.0, 0, 1.0, 975], sv: [['1 hot dog', 49], ['1 jumbo hot dog', 57]], k: 'meat',
  },
  {
    id: 'lamb-leg-roasted', name: 'Lamb leg, roasted (lean)',
    aka: ['lamb', 'roast lamb', 'leg of lamb'],
    n: [191, 28.3, 0, 7.7, 0, 0, 68], sv: [['3 oz', 85], ['4 oz', 113]], k: 'meat',
  },
  // ---- Fish -------------------------------------------------------------------------
  {
    id: 'tuna-canned-light', name: 'Tuna, light, canned in water (drained)',
    aka: ['canned tuna', 'tuna fish', 'chunk light tuna', 'tin of tuna'],
    n: [116, 25.5, 0, 0.8, 0, 0, 338], sv: [['1 can, drained', 113], ['3 oz', 85], ['1/2 cup', 77]], k: 'fish', al: ['fish'],
  },
  {
    id: 'tuna-canned-albacore', name: 'Tuna, albacore, canned in water (drained)',
    aka: ['white tuna', 'solid white tuna', 'albacore'],
    n: [128, 23.6, 0, 3.0, 0, 0, 377], sv: [['1 can, drained', 113], ['3 oz', 85]], k: 'fish', al: ['fish'],
  },
  {
    id: 'tuna-steak-cooked', name: 'Tuna steak, cooked',
    aka: ['ahi tuna', 'yellowfin tuna', 'seared tuna'],
    n: [130, 29.2, 0, 0.6, 0, 0, 54], sv: [['4 oz', 113], ['1 steak (6 oz)', 170]], k: 'fish', al: ['fish'],
  },
  {
    id: 'salmon-cooked', name: 'Salmon, Atlantic, cooked',
    aka: ['salmon', 'baked salmon', 'grilled salmon', 'salmon fillet'],
    n: [206, 22.1, 0, 12.4, 0, 0, 61], sv: [['1 fillet (6 oz)', 170], ['4 oz', 113], ['3 oz', 85]], def: 1, k: 'fish', al: ['fish'],
  },
  {
    id: 'salmon-raw', name: 'Salmon, Atlantic, raw',
    aka: ['raw salmon', 'fresh salmon fillet'],
    n: [208, 20.4, 0, 13.4, 0, 0, 59], sv: [['1 fillet (6 oz)', 170], ['4 oz', 113], ['1 lb', 454]], k: 'fish', al: ['fish'],
  },
  {
    id: 'salmon-sockeye-cooked', name: 'Salmon, wild sockeye, cooked',
    aka: ['wild salmon', 'sockeye', 'red salmon'],
    n: [169, 26.5, 0, 6.7, 0, 0, 92], sv: [['1 fillet', 155], ['4 oz', 113]], def: 1, k: 'fish', al: ['fish'],
  },
  {
    id: 'salmon-canned', name: 'Salmon, canned (drained)',
    aka: ['canned salmon', 'pink salmon', 'tinned salmon'],
    n: [136, 23.1, 0, 4.9, 0, 0, 399], sv: [['3 oz', 85], ['1 small can, drained', 120]], k: 'fish', al: ['fish'],
  },
  {
    id: 'tilapia-cooked', name: 'Tilapia, cooked',
    aka: ['tilapia', 'white fish', 'baked tilapia'],
    n: [128, 26.2, 0, 2.7, 0, 0, 56], sv: [['1 fillet', 87], ['4 oz', 113]], k: 'fish', al: ['fish'],
  },
  {
    id: 'tilapia-raw', name: 'Tilapia, raw',
    aka: ['raw tilapia', 'tilapia fillets'],
    n: [96, 20.1, 0, 1.7, 0, 0, 52], sv: [['1 fillet', 116], ['4 oz', 113], ['1 lb', 454]], k: 'fish', al: ['fish'],
  },
  {
    id: 'cod-cooked', name: 'Cod, cooked',
    aka: ['cod', 'baked cod', 'white fish', 'cod fillet'],
    n: [105, 22.8, 0, 0.9, 0, 0, 78], sv: [['4 oz', 113], ['1 fillet', 180]], k: 'fish', al: ['fish'],
  },
  {
    id: 'cod-raw', name: 'Cod, raw',
    aka: ['raw cod', 'cod fillets'],
    n: [82, 17.8, 0, 0.7, 0, 0, 54], sv: [['4 oz', 113], ['1 fillet (6 oz)', 170], ['1 lb', 454]], k: 'fish', al: ['fish'],
  },
  {
    id: 'halibut-cooked', name: 'Halibut, cooked',
    aka: ['halibut', 'halibut fillet'],
    n: [111, 22.5, 0, 1.6, 0, 0, 82], sv: [['4 oz', 113], ['1/2 fillet', 159]], k: 'fish', al: ['fish'],
  },
  {
    id: 'trout-cooked', name: 'Trout, rainbow, cooked',
    aka: ['trout', 'rainbow trout'],
    n: [168, 23.8, 0, 7.4, 0, 0, 61], sv: [['1 fillet', 71], ['4 oz', 113]], def: 1, k: 'fish', al: ['fish'],
  },
  {
    id: 'sardines-canned', name: 'Sardines, canned in oil (drained)',
    aka: ['sardines', 'tinned sardines'],
    n: [208, 24.6, 0, 11.5, 0, 0, 307], sv: [['1 can (3.75 oz), drained', 92], ['2 sardines', 24]], k: 'fish', al: ['fish'],
  },
  {
    id: 'herring-pickled', name: 'Herring, pickled',
    aka: ['pickled herring', 'herring in wine sauce', 'schmaltz herring'],
    n: [262, 14.2, 9.6, 18.0, 0, 7.7, 870], sv: [['2 oz', 56], ['1 piece', 15]], k: 'fish', al: ['fish'],
  },
  // ---- Not kosher (for completeness of logging) ------------------------------------------
  {
    id: 'shrimp-cooked', name: 'Shrimp, cooked',
    aka: ['shrimp', 'prawns', 'grilled shrimp'],
    n: [99, 24.0, 0.2, 0.3, 0, 0, 111], sv: [['3 oz', 85], ['4 oz', 113], ['1 large shrimp', 6]], k: 'nonkosher', al: ['shellfish'],
  },
  {
    id: 'pork-tenderloin', name: 'Pork tenderloin, roasted',
    aka: ['pork', 'pork loin'],
    n: [143, 26.2, 0, 3.5, 0, 0, 57], sv: [['3 oz', 85], ['4 oz', 113]], k: 'nonkosher',
  },
  {
    id: 'bacon', name: 'Bacon, pan-fried',
    aka: ['pork bacon', 'bacon strips', 'rashers'],
    n: [541, 37.0, 1.4, 41.8, 0, 0, 1717], sv: [['1 slice', 8], ['3 slices', 24]], k: 'nonkosher',
  },
  {
    id: 'ham-deli', name: 'Ham, deli sliced',
    aka: ['ham', 'sliced ham', 'lunch meat ham'],
    n: [163, 16.6, 3.8, 8.6, 0, 0, 1143], sv: [['2 oz', 56], ['1 slice', 28]], k: 'nonkosher',
  },
  // ---- Plant proteins ----------------------------------------------------------------
  {
    id: 'tofu-firm', name: 'Tofu, firm',
    aka: ['tofu', 'bean curd', 'extra firm tofu'],
    n: [144, 17.3, 2.8, 8.7, 2.3, 0.6, 14], sv: [['1/4 block', 99], ['1/2 block', 198], ['1/2 cup cubes', 126]], k: 'pareve', al: ['soy'],
  },
  {
    id: 'tofu-silken', name: 'Tofu, silken (soft)',
    aka: ['silken tofu', 'soft tofu'],
    n: [61, 6.6, 1.8, 3.7, 0.2, 0.7, 8], sv: [['1/2 cup', 124], ['1/4 package', 85]], k: 'pareve', al: ['soy'],
  },
  {
    id: 'tempeh', name: 'Tempeh',
    aka: ['tempe', 'fermented soybean cake'],
    n: [192, 20.3, 7.6, 10.8, 4.0, 0, 9], sv: [['1/2 package (4 oz)', 113], ['3 oz', 85]], k: 'pareve', al: ['soy'],
  },
  {
    id: 'seitan', name: 'Seitan',
    aka: ['wheat gluten', 'wheat meat', 'vital wheat gluten'],
    n: [120, 21.0, 5.0, 1.5, 0.6, 0.5, 290], sv: [['3 oz', 85], ['1/2 package', 113]], k: 'pareve', al: ['wheat'],
  },
  {
    id: 'whey-protein', name: 'Whey protein powder',
    aka: ['protein powder', 'whey', 'whey isolate', 'protein scoop'],
    n: [400, 80.0, 8.0, 5.0, 0, 5.0, 300], sv: [['1 scoop', 30]], k: 'dairy', al: ['milk'],
  },
  {
    id: 'plant-protein', name: 'Plant protein powder (pea/rice)',
    aka: ['vegan protein powder', 'pea protein', 'plant-based protein'],
    n: [380, 72.0, 10.0, 6.0, 4.0, 1.0, 800], sv: [['1 scoop', 33]], k: 'pareve',
  },
  {
    id: 'veggie-burger', name: 'Veggie burger patty',
    aka: ['vegetarian burger', 'soy burger', 'meatless burger', 'garden burger'],
    n: [177, 15.7, 14.3, 6.3, 4.9, 1.0, 569], sv: [['1 patty', 71]], k: 'pareve', al: ['soy', 'wheat', 'egg'],
  },
])
