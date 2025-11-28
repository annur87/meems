export interface CardPAO {
  card: string;      // e.g. "AH", "9C", "KD", "Joker"
  person: string;
  action: string;
  object: string;
}

export const cardPaoList: CardPAO[] = [
  // ♠ Spades (S = Spades → often linked to dark/strong characters)
  { card: "AS", person: "Albert Einstein",    action: "writing",      object: "E=mc² on blackboard" },
  { card: "2S", person: "Baby Yoda",           action: "lifting",      object: "X-wing" },
  { card: "3S", person: "Charlie Chaplin",     action: "twirling",     object: "cane" },
  { card: "4S", person: "Darth Vader",         action: "choking",      object: "officer" },
  { card: "5S", person: "Elvis Presley",       action: "swiveling",    object: "hips" },
  { card: "6S", person: "Freddie Mercury",     action: "singing",      object: "microphone" },
  { card: "7S", person: "James Bond",          action: "shooting",     object: "Walther PPK" },
  { card: "8S", person: "Homer Simpson",       action: "eating",       object: "donut" },
  { card: "9S", person: "Indiana Jones",       action: "whipping",     object: "whip" },
  { card: "10S", person: "Iron Man (Tony Stark)", action: "flying",   object: "suit" },
  { card: "JS", person: "Jack Sparrow",        action: "running",      object: "rum" },
  { card: "QS", person: "Queen Elizabeth",     action: "waving",       object: "handbag" },
  { card: "KS", person: "Keanu Reeves (John Wick)", action: "shooting", object: "pencil" },

  // ♥ Hearts
  { card: "AH", person: "Angelina Jolie",      action: "kicking",      object: "enemy" },
  { card: "2H", person: "Beyoncé",             action: "dancing",      object: "Single Ladies hand" },
  { card: "3H", person: "Cupid",               action: "shooting",     object: "arrow" },
  { card: "4H", person: "Deadpool",            action: "breaking",     object: "fourth wall" },
  { card: "5H", person: "Elton John",          action: "playing",      object: "piano" },
  { card: "6H", person: "Harry Potter",        action: "casting",      object: "wand" },
  { card: "7H", person: "Hermione Granger",    action: "reading",      object: "spellbook" },
  { card: "8H", person: "Hulk",                action: "smashing",     object: "car" },
  { card: "9H", person: "Han Solo",            action: "shooting",     object: "blaster" },
  { card: "10H", person: "Heisenberg",         action: "cooking",      object: "blue meth" },
  { card: "JH", person: "Jack Nicholson (Joker)", action: "laughing",  object: "card" },
  { card: "QH", person: "Queen of Hearts (Alice)", action: "shouting", object: "Off with their heads!" },
  { card: "KH", person: "King Leonidas",       action: "kicking",      object: "Persian into pit" },

  // ♦ Diamonds
  { card: "AD", person: "Austin Powers",       action: "dancing",      object: "groovy baby" },
  { card: "2D", person: "Donald Duck",         action: "quacking",     object: "money vault" },
  { card: "3D", person: "Dolly Parton",        action: "singing",      object: "guitar" },
  { card: "4D", person: "Dracula",             action: "biting",       object: "neck" },
  { card: "5D", person: "Dwayne Johnson",      action: "lifting",      object: "rock" },
  { card: "6D", person: "Drake",               action: "hotline blinging", object: "phone" },
  { card: "7D", person: "David Bowie",         action: "ziggy stardusting", object: "guitar" },
  { card: "8D", person: "Donald Trump",        action: "building",     object: "wall" },
  { card: "9D", person: "Daenerys Targaryen",  action: "riding",       object: "dragon" },
  { card: "10D", person: "Dexter",             action: "stabbing",     object: "slide" },
  { card: "JD", person: "Jackie Chan",         action: "kicking",      object: "ladder" },
  { card: "QD", person: "Daenerys (again)",    action: "burning",      object: "King’s Landing" },
  { card: "KD", person: "King Kong",           action: "climbing",     object: "Empire State Building" },

  // ♣ Clubs
  { card: "AC", person: "Ace Ventura",         action: "talking",      object: "out of butt" },
  { card: "2C", person: "Batman",              action: "grappling",    object: "hook" },
  { card: "3C", person: "Charlie Brown",       action: "kicking",      object: "football (misses)" },
  { card: "4C", person: "Captain America",     action: "throwing",     object: "shield" },
  { card: "5C", person: "Chuck Norris",        action: "roundhouse-kicking", object: "everyone" },
  { card: "6C", person: "Conan O'Brien",       action: "string-dancing", object: "desk" },
  { card: "7C", person: "Clint Eastwood",      action: "squinting",    object: "cigar" },
  { card: "8C", person: "Catwoman",            action: "whipping",     object: "whip" },
  { card: "9C", person: "Captain Jack Sparrow",action: "stealing",     object: "ship" },
  { card: "10C", person: "Chewbacca",          action: "roaring",      object: "bowcaster" },
  { card: "JC", person: "Jesus Christ",        action: "walking",      object: "on water" },
  { card: "QC", person: "Cleopatra",           action: "bathing",      object: "milk" },
  { card: "KC", person: "King Arthur",         action: "pulling",      object: "Excalibur" },

  // Optional Jokers
  { card: "BJ", person: "Black Joker (The Joker)", action: "laughing maniacally", object: "joker card" },
  { card: "RJ", person: "Red Joker (Harley Quinn)", action: "smashing", object: "baseball bat" },
];

// Helper to get PAO by card code
export const getCardPAO = (card: string): CardPAO | undefined => {
  return cardPaoList.find(c => c.card === card.toUpperCase());
};
