const fs = require('fs');
const path = require('path');

const perfumeNames = [
  // Page 1 (43)
  '9PM Afnan', 'Absolu Armani', 'Acua De Profumo', 'Adidas', 'Afshan',
  'Ahmed Al Magribi Marj Super', 'Ahsas Al Arabia', 'Ajmal Blue', 'Ajmal Misk Rumman',
  'Al Fares', 'Al Hamd', 'Al Rehab Sharquiah', 'Al Zubra', 'Alf Zahra', 'Alisha',
  'Amber Aoud', 'Amber Noir', 'Amberwood Ajmal', 'Ameer Al Oud', 'Aqua 121',
  'Arabian White Oud', 'Armani Black Code', 'Armani Code', 'Armani Stronger With You',
  'Aro Magnet', 'Aroosha', 'Aseel', 'Atomick Oud', 'Attar Full', 'Axe', 'Axe Chocolate',
  'Azzaro Wanted', 'Baccarat Rouge', 'Badee Al Oud', 'Badee Al Oud Premium', 'Bakhour',
  'Barbara', 'Beautiful Touch', 'Best', 'Black Heart', 'Black Oud', 'Blue De Chanel', 'Blue Desire',

  // Page 2 (46)
  'Blue Lady', 'Blue Lomani', 'Blue Wave', 'Bukhari Oud', 'Bulgari Man',
  'Burberry Goddess', 'Bushra', 'Candy Aoud', 'Caramel Oud', 'Ch 212 Men',
  'Chairman', 'Chameli Full', 'Chanel No 5', 'Chelsea', 'Chocolate Musk',
  'Chocolate Venilla', 'Cinema Lcv', 'Ck-1', 'Classic', 'Cool Blue',
  'Cool Water (W)', 'Cool Water Man', 'CR7', 'Creed Aventus', 'Creed Viking',
  "D'Love", 'D&g Light Blue (M)', 'Dalal', 'Darbar', 'Dareej', 'Dark Oud',
  'David Beckham', 'Dehnal Oud', 'Dior Jadore', 'Dior Sauvage', 'Diptyque Tam Dao SPI',
  'Diptyque Tam Dao Super', 'Dirham', 'Dubai Gold', 'Dunhill Desire Blue',
  'Dunhill Desire Red', 'Dunhill Icon Absolute', 'Dunhill Icon Grey', 'Effective', 'Emir',

  // Page 3 (45)
  'Escada Moon Sparkle', 'Escada Sorbetto Rosso', 'Escape', 'Fanky Boquet',
  'Fantasia', 'Faraz', 'Fawakey (Surrati)', 'Gissah Imperial Valley', 'Gissah One And Only',
  'Givenchy Interdit', 'Givency Blue', 'Golden Power', 'Good Girl', 'Green Mango',
  'Gucci Bloom', 'Gucci Flora', 'Gucci Guilty', 'Gucci Intense Oudh', 'Gucci Oud',
  'Gucci Paris', 'Gule Lala', 'Habshish', 'Hajre Aswad', 'Hareem Al Sultan',
  'Havoc Silver', 'Hawas Ice Lc', 'Hawas XL', 'Honey Oud', 'Hudson Valley',
  'Hugo Boss', 'Ice Blue', 'Iceberg', 'Infiman', 'Infinity (W)', 'Invictus',
  'Invictus Victory', 'Jaguar Black', 'Jannatul Ferdous', 'Jass', 'Jawad Al Layl',
  'Jm Oud & Bergamot', 'Joopi', 'Kachi Beli', 'Kashmiri Oud', 'Kasturi',

  // Page 4 (45)
  'Kesar Chandan', 'Khasab Al Oud', 'Kiwi', 'KS Spark', 'La Vie Est Belle',
  'Labbaik Emirates', 'Lacost White Special', 'Lady Million', 'Lancome Oud',
  'Lavendar', 'Leather and Vanilla', 'Leril', 'Lord', 'Lord Blue Super',
  'Lovely', 'Lv Ombre Nomade (Premium)', 'Lv Pacific Chill', 'Lychee',
  'Madawi', 'Madina (Al Haramain)', 'Magnate-Asma', 'Mahir Black', 'Makhmaria',
  'Mancera Red Tobacco', 'Maxi', 'Memo Irsh Leather', 'Mukhallat Badar Lc',
  'Mukhallat Hind', 'Mukhallat Madina', 'Mukhallat Oud', 'Musk Al Tahara Blue',
  'Musk Al Tahara Brown', 'Musk Al Tahara Green', 'Musk Al Tahara Pink',
  'Musk Al Tahara Purple', 'Musk Al Tahara White', 'Musk Al Tahara Yellow',
  'Musk Fakher', 'Musk Makkah', 'Musk Rejaly', 'Musk Sapphire', 'Nazneen',
  'Neem', 'Nevia', 'Nevia V2',

  // Page 5 (45)
  'Noir Oud', 'Noora', 'Omber Leather', 'One Man Show', 'One Million',
  'One Million Elixir', 'One Million Lucky', 'Open V2', 'Orange', 'Oud Al Fursan',
  'Oud India', 'Oud Kerala', 'Oud Mood', 'Oud Pk Xx', 'Oud Sultani', 'Paradise',
  'Paris Hilton', 'Pdm Delina Exclusif', 'Pink Chiffon', 'Pink President',
  'Polo Blue', 'Polo Sport', 'Pomegrante Musk', 'Ponds', 'Purple Oud',
  'Qaeed Al Fursan', 'Qamar Al Layl', 'Rajnigandha (Keva)', 'Rajnigandha (S)',
  'Rasasi Hawas Ice', 'Rasasi Royal Blue', 'Rasha', 'Rasiq', 'Rawadha Saudi',
  'Real Rose', 'Red Door', 'Red Rose', 'Red Strawberry', 'Romance', 'Rose Isparta',
  'Rose Musk', 'Royal Bakhour', 'Royal Mirage', 'Royal Power', 'Royal Prophecy',

  // Page 6 (45)
  'Sabaya', 'Sadaf', 'Salma', 'Salma Basha', 'Salma- Saudi', 'Salted Caramel',
  'Sandal -BT', 'Sandal Rose', 'Sandaliyah 5 Star', 'Sautul Arab', 'Shadha',
  'Shaikhah', 'Shamama', 'Shuhrah', 'SRK', 'Silver', 'So Oud', 'Soft',
  'Spice Bomb Extreme', 'Strawberry', 'Stronger With You', 'Sukkar Banat',
  'Sultan', 'Sweet Magnum', 'Sweet Rose', 'Swiss Jannatul Ferdous', 'Taj Mahal',
  'Tea Rose', 'Terre De Hermes', 'Tom Ford Noir', 'Tom Ford Omber Leather',
  'Tom Ford Oud Wood', 'Tom Ford Tobacco Vanilla', 'Tom Ford Tuscan Leather',
  'Tom Ford Vanilla Sex', 'Tommy Girl', 'V& R Spicebomb', 'Valentino Uomo Intense',
  'Vampire Blood', 'Vampire Blood Spl', 'Versace Eros', 'Vickey',
  'Victoria Secret Beach Flower Pink', 'Victoria Secret Bombshell', 'Victoria Secret Bombshell Oud',

  // Page 7 (29)
  'Victoria Secret Pure Seduction', 'Victoria Secret Wild Flowers', 'Watermelon',
  'White London', 'White Oud M25 Series', 'White Oud Special', 'White Shamama Spl',
  'White Shamama Ga', 'Wild Berries', 'X-Original', 'Yara Candy', 'YSL Black Opium',
  'Zahoor Al Madina-Saudi', 'Zam Zam', 'Zatax', 'Al Harmain Opposite',
  'Bondage Hommee', 'Love In Franch', 'Lafatta Eclear', 'Lafatta Khamrah Qahwa',
  'Imagination', 'Ehas Al Arabia', 'Dehnal OUDH', 'Nexos', 'Aqua De Gio',
  'CK V2U', 'Don French', 'Invictus Aqua', 'Hawas Fire'
];

function getImageForPerfume(name) {
  const n = name.toLowerCase();
  if (n.includes('oud') || n.includes('aoud') || n.includes('wood') || n.includes('dark') || n.includes('leather')) {
    return 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=800';
  }
  if (n.includes('rose') || n.includes('bloom') || n.includes('flora') || n.includes('chameli') || n.includes('rajnigandha') || n.includes('pink') || n.includes('flower')) {
    return 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&q=80&w=800';
  }
  if (n.includes('blue') || n.includes('aqua') || n.includes('water') || n.includes('ice') || n.includes('cool') || n.includes('wave') || n.includes('sea') || n.includes('ocean')) {
    return 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&q=80&w=800';
  }
  if (n.includes('musk') || n.includes('white') || n.includes('silver') || n.includes('pure')) {
    return 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80&w=800';
  }
  if (n.includes('vanilla') || n.includes('chocolate') || n.includes('caramel') || n.includes('sugar') || n.includes('sweet') || n.includes('candy') || n.includes('honey')) {
    return 'https://images.unsplash.com/photo-1615634260167-c8cdede054de?auto=format&fit=crop&q=80&w=800';
  }
  if (n.includes('amber') || n.includes('gold') || n.includes('bakhour') || n.includes('saffron') || n.includes('spice') || n.includes('habshish')) {
    return 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&q=80&w=800';
  }
  if (n.includes('mango') || n.includes('orange') || n.includes('strawberry') || n.includes('watermelon') || n.includes('berry') || n.includes('kiwi') || n.includes('lychee') || n.includes('fruit')) {
    return 'https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?auto=format&fit=crop&q=80&w=800';
  }
  return 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&q=80&w=800';
}

function getFragranceType(name) {
  const n = name.toLowerCase();
  if (n.includes('attar') || n.includes('misk') || n.includes('musk') || n.includes('dehnal') || n.includes('shamama') || n.includes('jannatul') || n.includes('kasturi')) {
    return 'Concentrated Perfume Oil / Attar';
  }
  return 'Extrait de Parfum';
}

function slugify(name) {
  return 'prod-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const products = perfumeNames.map((name, index) => {
  const id = slugify(name) + '-' + (index + 1);
  const fType = getFragranceType(name);
  const img = getImageForPerfume(name);

  return {
    id,
    name,
    image: img,
    fragranceType: fType,
    longevity: '10-14+ Hours',
    fragranceNotes: name + ' signature blend notes and concentrated essence.',
    description: 'Authentic artisanal ' + name + ' formulated with pure concentrated fragrance oils for maximum projection and enduring sillage.',
    stockStatus: 'In Stock',
    startingPrice: 0,
    wholesalePrice50ml: 0,
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
    sizes: [
      { id: id + '-3ml', productId: id, sizeLabel: '3 ml', price: 0, isAvailable: true },
      { id: id + '-6ml', productId: id, sizeLabel: '6 ml', price: 0, isAvailable: true },
      { id: id + '-12ml', productId: id, sizeLabel: '12 ml', price: 0, isAvailable: true },
      { id: id + '-50ml', productId: id, sizeLabel: '50 ml', price: 0, isAvailable: true },
    ]
  };
});

const fileContent = 'import { Product } from "../types/index.ts";\n\n' +
  '// Extracted 297 Perfume & Attar catalog from official wholesale price list\n' +
  'export const INITIAL_PRODUCTS: Product[] = ' + JSON.stringify(products, null, 2) + ';\n';

fs.writeFileSync(path.join(__dirname, '../src/data/initialProducts.ts'), fileContent, 'utf8');
console.log('Successfully generated src/data/initialProducts.ts with ' + products.length + ' products');

const dbPath = path.join(__dirname, '../data/database.json');
if (fs.existsSync(dbPath)) {
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  db.products = products;
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
  console.log('Successfully synced data/database.json with ' + products.length + ' products');
}
