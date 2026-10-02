import { defineFoods } from './define'

/** Packaged and quick snacks. Values per 100 g. */
export const SNACK_FOODS = defineFoods('snacks', [
  {
    id: 'popcorn-air-popped', name: 'Popcorn, air-popped',
    aka: ['popcorn', 'plain popcorn'],
    n: [387, 12.9, 77.8, 4.5, 14.5, 0.9, 8], sv: [['3 cups popped', 24], ['1 cup popped', 8]], k: 'pareve',
  },
  {
    id: 'popcorn-microwave', name: 'Popcorn, microwave (butter flavor)',
    aka: ['microwave popcorn', 'butter popcorn', 'movie popcorn'],
    n: [500, 8.0, 57.0, 27.0, 10.0, 0.5, 750], sv: [['1 cup popped', 11], ['3 cups popped', 33]], def: 1, k: 'dairy', al: ['milk'],
  },
  {
    id: 'pretzels', name: 'Pretzels, hard salted',
    aka: ['pretzel', 'pretzel twists', 'pretzel sticks'],
    n: [380, 10.3, 79.8, 2.9, 2.8, 1.8, 1240], sv: [['1 oz (about 17 mini twists)', 28]], k: 'pareve', al: ['wheat'],
  },
  {
    id: 'potato-chips', name: 'Potato chips',
    aka: ['chips', 'crisps', 'potato crisps'],
    n: [536, 7.0, 53.0, 34.6, 4.4, 0.4, 525], sv: [['1 oz bag (about 15 chips)', 28]], k: 'pareve',
  },
  {
    id: 'tortilla-chips', name: 'Tortilla chips',
    aka: ['corn chips', 'nachos', 'chips'],
    n: [489, 7.0, 64.0, 23.0, 5.0, 0.9, 420], sv: [['1 oz (about 10 chips)', 28]], k: 'pareve',
  },
  {
    id: 'pita-chips', name: 'Pita chips',
    aka: ['baked pita chips'],
    n: [460, 11.0, 67.0, 17.0, 3.5, 2.0, 820], sv: [['1 oz (about 10 chips)', 28]], k: 'pareve', al: ['wheat'],
  },
  {
    id: 'rice-cakes', name: 'Rice cakes, brown rice',
    aka: ['rice cake', 'puffed rice cake'],
    n: [387, 8.2, 81.5, 2.8, 4.2, 0.9, 326], sv: [['1 rice cake', 9], ['2 rice cakes', 18]], k: 'pareve',
  },
  {
    id: 'crackers-whole-wheat', name: 'Crackers, whole-wheat',
    aka: ['crackers', 'wheat crackers', 'woven wheat crackers'],
    n: [435, 10.0, 69.0, 14.5, 10.0, 1.0, 640], sv: [['6 crackers', 28]], k: 'pareve', al: ['wheat'],
  },
  {
    id: 'saltines', name: 'Saltine crackers',
    aka: ['saltines', 'soda crackers', 'crackers'],
    n: [418, 9.5, 74.0, 8.6, 2.8, 1.3, 940], sv: [['5 crackers', 15]], k: 'pareve', al: ['wheat'],
  },
  {
    id: 'graham-crackers', name: 'Graham crackers',
    aka: ['graham cracker', 'grahams'],
    n: [430, 6.7, 77.7, 10.6, 3.4, 24.5, 459], sv: [['1 sheet (2 squares)', 14], ['2 sheets', 28]], k: 'pareve', diet: 'vegetarian', al: ['wheat'],
  },
  {
    id: 'protein-bar', name: 'Protein bar',
    aka: ['protein bars', 'nutrition bar', 'high protein bar'],
    n: [380, 32.0, 42.0, 11.0, 6.0, 18.0, 330], sv: [['1 bar', 60]], k: 'dairy', al: ['milk', 'soy'],
  },
  {
    id: 'granola-bar', name: 'Granola bar, crunchy oats & honey',
    aka: ['granola bar', 'oat bar', 'cereal bar'],
    n: [471, 10.1, 64.4, 19.8, 5.3, 29.4, 294], sv: [['1 bar', 21], ['2-bar pouch', 42]], def: 1, k: 'pareve', diet: 'vegetarian', al: ['soy'],
  },
  {
    id: 'fruit-nut-bar', name: 'Fruit and nut bar (date-based)',
    aka: ['date bar', 'energy bar', 'fruit bar', 'nut bar'],
    n: [444, 11.1, 51.1, 24.4, 8.0, 38.0, 5], sv: [['1 bar', 45]], k: 'pareve', al: ['tree-nuts'],
  },
  {
    id: 'dark-chocolate', name: 'Dark chocolate, 70-85% cacao',
    aka: ['dark chocolate', 'bittersweet chocolate', 'chocolate'],
    n: [598, 7.8, 45.9, 42.6, 10.9, 24.0, 20], sv: [['1 oz', 28], ['1 square', 10]], k: 'pareve',
  },
  {
    id: 'beef-jerky', name: 'Beef jerky',
    aka: ['jerky', 'dried beef', 'biltong'],
    n: [282, 37.0, 20.0, 5.0, 1.0, 16.0, 1800], sv: [['1 oz', 28]], k: 'meat', al: ['soy', 'wheat'],
  },
  {
    id: 'trail-mix', name: 'Trail mix (nuts, seeds and raisins)',
    aka: ['trail mix', 'gorp', 'student mix', 'nut and fruit mix'],
    n: [462, 13.8, 44.9, 29.4, 5.0, 22.0, 229], sv: [['1/4 cup', 38], ['1 oz', 28]], k: 'pareve', al: ['peanuts', 'tree-nuts'],
  },
  {
    id: 'peanut-puffs', name: 'Peanut puffs',
    aka: ['peanut butter puffs', 'peanut snack', 'corn peanut puffs'],
    n: [541, 15.5, 41.0, 35.0, 3.5, 1.0, 400], sv: [['1 small bag', 25], ['1 large bag', 80]], k: 'pareve', al: ['peanuts'],
  },
])

/** Drinks. Values per 100 ml. */
export const BEVERAGE_FOODS = defineFoods('beverages', [
  {
    id: 'coffee-black', name: 'Coffee, black',
    aka: ['coffee', 'black coffee', 'drip coffee', 'americano', 'espresso'],
    n: [1, 0.1, 0, 0, 0, 0, 2], ml: true, sv: [['1 cup (8 fl oz)', 240], ['1 mug (12 fl oz)', 355]], k: 'pareve',
  },
  {
    id: 'coffee-with-milk', name: 'Coffee with milk',
    aka: ['white coffee', 'coffee with cream', 'cafe au lait'],
    n: [10, 0.7, 0.8, 0.4, 0, 0.8, 9], ml: true, sv: [['1 cup (8 fl oz)', 240], ['1 mug (12 fl oz)', 355]], k: 'dairy', al: ['milk'],
  },
  {
    id: 'coffee-milk-sugar', name: 'Coffee with milk and sugar',
    aka: ['sweet coffee', 'regular coffee', 'coffee light and sweet'],
    n: [23, 0.7, 4.1, 0.4, 0, 4.1, 9], ml: true, sv: [['1 cup (8 fl oz)', 240], ['1 mug (12 fl oz)', 355]], k: 'dairy', al: ['milk'],
  },
  {
    id: 'latte', name: 'Latte (2% milk)',
    aka: ['caffe latte', 'cappuccino', 'flat white'],
    n: [40, 2.7, 4.0, 1.5, 0, 3.8, 37], ml: true, sv: [['12 fl oz', 355], ['16 fl oz', 473]], def: 1, k: 'dairy', al: ['milk'],
  },
  {
    id: 'tea', name: 'Tea, unsweetened',
    aka: ['black tea', 'green tea', 'herbal tea', 'iced tea unsweetened'],
    n: [1, 0, 0.3, 0, 0, 0, 3], ml: true, sv: [['1 cup (8 fl oz)', 240]], k: 'pareve',
  },
  {
    id: 'hot-chocolate', name: 'Hot chocolate made with milk',
    aka: ['hot cocoa', 'cocoa'],
    n: [80, 3.6, 11.1, 2.4, 1.0, 10.0, 46], ml: true, sv: [['1 mug (8 fl oz)', 240]], k: 'dairy', al: ['milk'],
  },
  {
    id: 'orange-juice', name: 'Orange juice',
    aka: ['oj', 'fresh orange juice', 'juice'],
    n: [47, 0.7, 10.8, 0.2, 0.2, 8.7, 1], ml: true, sv: [['1 cup (8 fl oz)', 240], ['1 small glass (6 fl oz)', 180]], k: 'pareve',
  },
  {
    id: 'apple-juice', name: 'Apple juice',
    aka: ['juice', 'apple cider'],
    n: [48, 0.1, 11.7, 0.1, 0.2, 10.0, 4], ml: true, sv: [['1 cup (8 fl oz)', 240], ['1 juice box', 200]], k: 'pareve',
  },
  {
    id: 'grape-juice', name: 'Grape juice',
    aka: ['juice', 'kiddush grape juice', 'concord grape juice'],
    n: [63, 0.4, 15.5, 0.1, 0.2, 14.9, 5], ml: true, sv: [['1 cup (8 fl oz)', 240], ['1 kiddush cup (4 fl oz)', 118]], k: 'pareve',
  },
  {
    id: 'lemonade', name: 'Lemonade',
    aka: ['lemon drink'],
    n: [42, 0.1, 10.6, 0, 0, 10.0, 4], ml: true, sv: [['1 cup (8 fl oz)', 240]], k: 'pareve',
  },
  {
    id: 'cola', name: 'Cola soda',
    aka: ['soda', 'soft drink', 'pop', 'cola'],
    n: [42, 0, 10.6, 0, 0, 10.6, 12], ml: true, sv: [['1 can (12 fl oz)', 355], ['1 bottle (20 fl oz)', 591]], k: 'pareve',
  },
  {
    id: 'diet-soda', name: 'Diet soda (zero sugar)',
    aka: ['zero soda', 'sugar free soda', 'diet cola', 'light soda'],
    n: [0, 0, 0, 0, 0, 0, 12], ml: true, sv: [['1 can (12 fl oz)', 355], ['1 bottle (20 fl oz)', 591]], k: 'pareve',
  },
  {
    id: 'sparkling-water', name: 'Sparkling water, unsweetened',
    aka: ['seltzer', 'soda water', 'club soda', 'carbonated water'],
    n: [0, 0, 0, 0, 0, 0, 2], ml: true, sv: [['1 can (12 fl oz)', 355]], k: 'pareve',
  },
  {
    id: 'sports-drink', name: 'Sports drink',
    aka: ['electrolyte drink', 'isotonic drink'],
    n: [24, 0, 6.0, 0, 0, 5.7, 46], ml: true, sv: [['1 bottle (20 fl oz)', 591], ['1 cup', 240]], k: 'pareve',
  },
  {
    id: 'energy-drink', name: 'Energy drink',
    aka: ['energy drink', 'caffeinated drink'],
    n: [45, 0, 11.0, 0, 0, 11.0, 42], ml: true, sv: [['1 small can (8.4 fl oz)', 250], ['1 large can (16 fl oz)', 473]], k: 'pareve',
  },
  {
    id: 'kombucha', name: 'Kombucha',
    aka: ['fermented tea'],
    n: [13, 0, 3.2, 0, 0, 2.5, 4], ml: true, sv: [['1 bottle (16 fl oz)', 473]], k: 'pareve',
  },
  {
    id: 'coconut-water', name: 'Coconut water',
    aka: ['coconut juice'],
    n: [19, 0.7, 3.7, 0.2, 1.1, 2.6, 105], ml: true, sv: [['1 cup', 240], ['1 carton (11 fl oz)', 330]], k: 'pareve',
  },
  {
    id: 'fruit-smoothie', name: 'Fruit smoothie with yogurt',
    aka: ['smoothie', 'fruit shake', 'strawberry banana smoothie'],
    n: [65, 1.8, 13.5, 0.6, 1.2, 11.0, 20], ml: true, sv: [['12 fl oz', 355], ['16 fl oz', 473]], k: 'dairy', al: ['milk'],
  },
  {
    id: 'protein-shake-rtd', name: 'Protein shake, ready-to-drink',
    aka: ['protein shake', 'protein drink', 'shake'],
    n: [47, 8.8, 1.5, 0.9, 0.3, 0.3, 60], ml: true, sv: [['1 bottle (11.5 fl oz)', 340]], k: 'dairy', al: ['milk'],
  },
  {
    id: 'beer', name: 'Beer, regular',
    aka: ['beer', 'lager', 'ale'],
    n: [43, 0.5, 3.6, 0, 0, 0, 4], alc: 3.9, ml: true, sv: [['1 bottle or can (12 fl oz)', 355], ['1 pint', 473]], k: 'pareve',
  },
  {
    id: 'beer-light', name: 'Beer, light',
    aka: ['light beer', 'lite beer'],
    n: [29, 0.2, 1.6, 0, 0, 0, 4], alc: 2.9, ml: true, sv: [['1 bottle or can (12 fl oz)', 355]], k: 'pareve',
  },
  {
    id: 'wine-red', name: 'Wine, red',
    aka: ['red wine', 'cabernet', 'merlot', 'wine'],
    n: [84, 0.1, 2.6, 0, 0, 0.6, 4], alc: 10.5, ml: true, sv: [['1 glass (5 fl oz)', 148], ['1 bottle', 750]], k: 'pareve', diet: 'vegetarian',
  },
  {
    id: 'wine-white', name: 'Wine, white',
    aka: ['white wine', 'chardonnay', 'sauvignon blanc', 'wine'],
    n: [81, 0.1, 2.6, 0, 0, 1.0, 5], alc: 10.2, ml: true, sv: [['1 glass (5 fl oz)', 148], ['1 bottle', 750]], k: 'pareve', diet: 'vegetarian',
  },
  {
    id: 'wine-sweet-kiddush', name: 'Sweet red wine (kiddush)',
    aka: ['kiddush wine', 'concord wine', 'sweet wine', 'sacramental wine'],
    n: [122, 0.1, 15.0, 0, 0, 15.0, 5], alc: 8.7, ml: true, sv: [['1 kiddush cup (4 fl oz)', 118], ['1 glass (5 fl oz)', 148]], k: 'pareve', diet: 'vegetarian',
  },
  {
    id: 'liquor', name: 'Liquor, 80 proof (vodka, whiskey, rum, gin)',
    aka: ['vodka', 'whiskey', 'rum', 'gin', 'tequila', 'spirits', 'shot'],
    n: [220, 0, 0, 0, 0, 0, 1], alc: 31.7, ml: true, sv: [['1 shot (1.5 fl oz)', 44]], k: 'pareve',
  },
])
