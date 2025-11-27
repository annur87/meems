export interface PhilosophicalQuote {
    id: string;
    text: string;
    speaker: string;
    source: string;
    year?: string;
    tags: string[];
}

export const PHILOSOPHY_QUOTES: PhilosophicalQuote[] = [
    // Classical Philosophy
    {
        id: "socrates-apology",
        text: "The unexamined life is not worth living.",
        speaker: "Socrates",
        source: "Plato, Apology (38a)",
        tags: ["classical", "ethics"]
    },
    {
        id: "aristotle-ethics",
        text: "We are what we repeatedly do. Excellence, then, is not an act but a habit.",
        speaker: "Aristotle",
        source: "Nicomachean Ethics",
        tags: ["classical", "ethics"]
    },
    {
        id: "plato-republic",
        text: "The beginning is the most important part of the work.",
        speaker: "Plato",
        source: "The Republic",
        tags: ["classical", "education"]
    },
    {
        id: "confucius",
        text: "The man who moves a mountain begins by carrying away small stones.",
        speaker: "Confucius",
        source: "The Analects",
        tags: ["classical", "perseverance"]
    },
    {
        id: "laozi",
        text: "A journey of a thousand miles begins beneath one's feet.",
        speaker: "Laozi",
        source: "Tao Te Ching",
        tags: ["daoism", "journey"]
    },
    {
        id: "sun-tzu",
        text: "In the midst of chaos, there is also opportunity.",
        speaker: "Sun Tzu",
        source: "The Art of War",
        tags: ["strategy", "mindset"]
    },

    // Stoicism
    {
        id: "epictetus-enchiridion",
        text: "People are disturbed not by things, but by the views they take of them.",
        speaker: "Epictetus",
        source: "Enchiridion",
        tags: ["stoic", "mindset"]
    },
    {
        id: "marcus-aurelius-meditations",
        text: "The happiness of your life depends upon the quality of your thoughts.",
        speaker: "Marcus Aurelius",
        source: "Meditations",
        tags: ["stoic", "mindset"]
    },
    {
        id: "seneca-time",
        text: "It is not that we have a short time to live, but that we waste much of it.",
        speaker: "Seneca",
        source: "On the Shortness of Life",
        tags: ["stoic", "time"]
    },

    // Modern Philosophy
    {
        id: "descartes-discourse",
        text: "I think, therefore I am.",
        speaker: "René Descartes",
        source: "Discourse on the Method",
        tags: ["modern", "epistemology"]
    },
    {
        id: "kant-practical",
        text: "Act only according to that maxim whereby you can at the same time will that it should become a universal law.",
        speaker: "Immanuel Kant",
        source: "Groundwork of the Metaphysics of Morals",
        tags: ["deontology", "ethics"]
    },
    {
        id: "nietzsche-gay-science",
        text: "He who has a why to live for can bear almost any how.",
        speaker: "Friedrich Nietzsche",
        source: "Twilight of the Idols",
        tags: ["existential", "purpose"]
    },
    {
        id: "nietzsche-monsters",
        text: "Whoever fights monsters should see to it that in the process he does not become a monster. And if you gaze long enough into an abyss, the abyss will gaze back into you.",
        speaker: "Friedrich Nietzsche",
        source: "Beyond Good and Evil",
        tags: ["modern", "existential"]
    },
    {
        id: "nietzsche-chaos",
        text: "You must have chaos within you to give birth to a dancing star.",
        speaker: "Friedrich Nietzsche",
        source: "Thus Spoke Zarathustra",
        tags: ["modern", "creativity"]
    },
    {
        id: "nietzsche-music",
        text: "Without music, life would be a mistake.",
        speaker: "Friedrich Nietzsche",
        source: "Twilight of the Idols",
        tags: ["modern", "art"]
    },
    {
        id: "nietzsche-god-dead",
        text: "God is dead. God remains dead. And we have killed him.",
        speaker: "Friedrich Nietzsche",
        source: "The Gay Science",
        tags: ["modern", "nihilism"]
    },
    {
        id: "schopenhauer-compassion",
        text: "Compassion is the basis of morality.",
        speaker: "Arthur Schopenhauer",
        source: "On the Basis of Morality",
        tags: ["modern", "ethics"]
    },
    {
        id: "schopenhauer-talent",
        text: "Talent hits a target no one else can hit. Genius hits a target no one else can see.",
        speaker: "Arthur Schopenhauer",
        source: "Parerga and Paralipomena",
        tags: ["modern", "genius"]
    },

    // Existentialism
    {
        id: "camus-myth",
        text: "One must imagine Sisyphus happy.",
        speaker: "Albert Camus",
        source: "The Myth of Sisyphus",
        tags: ["absurdism", "existential"]
    },
    {
        id: "sartre-existentialism",
        text: "Man is condemned to be free.",
        speaker: "Jean-Paul Sartre",
        source: "Existentialism Is a Humanism",
        tags: ["existential", "freedom"]
    },
    {
        id: "sartre-hell",
        text: "Hell is other people.",
        speaker: "Jean-Paul Sartre",
        source: "No Exit",
        tags: ["existential", "relationships"]
    },
    {
        id: "kierkegaard-anxiety",
        text: "Anxiety is the dizziness of freedom.",
        speaker: "Søren Kierkegaard",
        source: "The Concept of Anxiety",
        tags: ["existential", "anxiety"]
    },
    {
        id: "kierkegaard-life-backwards",
        text: "Life can only be understood backwards; but it must be lived forwards.",
        speaker: "Søren Kierkegaard",
        source: "Journals",
        tags: ["existential", "life"]
    },
    {
        id: "simone-beauvoir",
        text: "One is not born, but rather becomes, a woman.",
        speaker: "Simone de Beauvoir",
        source: "The Second Sex",
        tags: ["feminism", "existential"]
    },

    // Literature
    {
        id: "dostoevsky-k",
        text: "If there is no God, everything is permitted.",
        speaker: "Fyodor Dostoevsky",
        source: "The Brothers Karamazov",
        tags: ["literature", "ethics"]
    },
    {
        id: "dostoevsky-beauty",
        text: "Beauty will save the world.",
        speaker: "Fyodor Dostoevsky",
        source: "The Idiot",
        tags: ["literature", "beauty"]
    },
    {
        id: "dostoevsky-secret",
        text: "The secret of human existence lies not only in living, but in knowing what to live for.",
        speaker: "Fyodor Dostoevsky",
        source: "The Brothers Karamazov",
        tags: ["literature", "purpose"]
    },
    {
        id: "dostoevsky-pain",
        text: "Pain and suffering are always inevitable for a large intelligence and a deep heart. The really great men must, I think, have great sadness on earth.",
        speaker: "Fyodor Dostoevsky",
        source: "The Brothers Karamazov",
        tags: ["literature", "suffering"]
    },
    {
        id: "kafka-metamorphosis",
        text: "I cannot make you understand. I can't make anyone understand what is happening inside of me. I cannot even explain it to myself.",
        speaker: "Franz Kafka",
        source: "The Metamorphosis",
        tags: ["literature", "isolation"]
    },
    {
        id: "kafka-trial-logic",
        text: "Logic may indeed be unshakeable, but it cannot hold out against a man who wants to live.",
        speaker: "Franz Kafka",
        source: "The Trial",
        tags: ["literature", "absurdity"]
    },
    {
        id: "kafka-castle",
        text: "It's often better to be in chains than to be free.",
        speaker: "Franz Kafka",
        source: "The Castle",
        tags: ["literature", "freedom"]
    },
    {
        id: "atticus",
        text: "You never really understand a person until you consider things from his point of view.",
        speaker: "Atticus Finch",
        source: "Harper Lee, To Kill a Mockingbird",
        tags: ["literature", "empathy"]
    },
    {
        id: "thoreau",
        text: "Rather than love, than money, than fame, give me truth.",
        speaker: "Henry David Thoreau",
        source: "Walden",
        tags: ["transcendental", "ethics"]
    },
    {
        id: "beckett",
        text: "Ever tried. Ever failed. No matter. Try again. Fail again. Fail better.",
        speaker: "Samuel Beckett",
        source: "Worstward Ho",
        tags: ["literature", "resilience"]
    },

    // Fantasy & Sci-Fi
    {
        id: "gandalf",
        text: "All we have to decide is what to do with the time that is given us.",
        speaker: "Gandalf",
        source: "J. R. R. Tolkien, The Fellowship of the Ring",
        tags: ["fantasy", "literature"]
    },
    {
        id: "dumbledore",
        text: "It is our choices, Harry, that show what we truly are, far more than our abilities.",
        speaker: "Albus Dumbledore",
        source: "J. K. Rowling, Harry Potter and the Chamber of Secrets",
        tags: ["fantasy", "character"]
    },
    {
        id: "yoda",
        text: "Do or do not. There is no try.",
        speaker: "Yoda",
        source: "Star Wars: The Empire Strikes Back",
        tags: ["film", "focus"]
    },
    {
        id: "spock",
        text: "The needs of the many outweigh the needs of the few.",
        speaker: "Spock",
        source: "Star Trek II: The Wrath of Khan",
        tags: ["film", "ethics", "sci-fi"]
    },
    {
        id: "morpheus",
        text: "What is real? How do you define real?",
        speaker: "Morpheus",
        source: "The Matrix",
        tags: ["film", "reality", "sci-fi"]
    },
    {
        id: "neo",
        text: "I know you're out there. I can feel you now. I know that you're afraid. You're afraid of change.",
        speaker: "Neo",
        source: "The Matrix",
        tags: ["film", "change", "sci-fi"]
    },
    {
        id: "interstellar",
        text: "We used to look up at the sky and wonder at our place in the stars. Now we just look down and worry about our place in the dirt.",
        speaker: "Cooper",
        source: "Interstellar",
        tags: ["film", "exploration", "sci-fi"]
    },
    {
        id: "blade-runner",
        text: "All those moments will be lost in time, like tears in rain.",
        speaker: "Roy Batty",
        source: "Blade Runner",
        tags: ["film", "mortality", "sci-fi"]
    },
    {
        id: "dune-fear",
        text: "I must not fear. Fear is the mind-killer.",
        speaker: "Paul Atreides",
        source: "Frank Herbert, Dune",
        tags: ["sci-fi", "courage", "literature"]
    },
    {
        id: "ender",
        text: "In the moment when I truly understand my enemy, understand him well enough to defeat him, then in that very moment I also love him.",
        speaker: "Ender Wiggin",
        source: "Orson Scott Card, Ender's Game",
        tags: ["sci-fi", "empathy", "literature"]
    },

    // Video Games
    {
        id: "bioshock-choice",
        text: "A man chooses. A slave obeys.",
        speaker: "Andrew Ryan",
        source: "BioShock",
        tags: ["game", "freedom", "choice"]
    },
    {
        id: "bioshock-constants",
        text: "There's always a lighthouse. There's always a man. There's always a city.",
        speaker: "Elizabeth",
        source: "BioShock Infinite",
        tags: ["game", "destiny", "philosophy"]
    },
    {
        id: "witcher-evil",
        text: "Evil is evil. Lesser, greater, middling, it's all the same.",
        speaker: "Geralt of Rivia",
        source: "The Witcher 3",
        tags: ["game", "morality"]
    },
    {
        id: "last-of-us",
        text: "When you're lost in the darkness, look for the light.",
        speaker: "Joel",
        source: "The Last of Us",
        tags: ["game", "hope"]
    },
    {
        id: "god-of-war",
        text: "We must be better than this.",
        speaker: "Kratos",
        source: "God of War (2018)",
        tags: ["game", "growth", "redemption"]
    },
    {
        id: "mass-effect",
        text: "Stand amongst the ashes of a trillion dead souls and ask the ghosts if honor matters. The silence is your answer.",
        speaker: "Javik",
        source: "Mass Effect 3",
        tags: ["game", "pragmatism", "sci-fi"]
    },
    {
        id: "dark-souls",
        text: "Don't you dare go hollow.",
        speaker: "Laurentius",
        source: "Dark Souls",
        tags: ["game", "perseverance"]
    },
    {
        id: "undertale",
        text: "Despite everything, it's still you.",
        speaker: "Narrator",
        source: "Undertale",
        tags: ["game", "identity"]
    },
    {
        id: "hades",
        text: "There is no escape.",
        speaker: "Hades",
        source: "Hades",
        tags: ["game", "fate"]
    },
    {
        id: "portal",
        text: "The Enrichment Center reminds you that the Weighted Companion Cube will never threaten to stab you and, in fact, cannot speak.",
        speaker: "GLaDOS",
        source: "Portal",
        tags: ["game", "humor", "sci-fi"]
    },
    {
        id: "spec-ops",
        text: "The truth is that you're here because you wanted to feel like something you're not: a hero.",
        speaker: "John Konrad",
        source: "Spec Ops: The Line",
        tags: ["game", "war", "morality"]
    },

    // TV Series
    {
        id: "breaking-bad",
        text: "I am not in danger, Skyler. I am the danger.",
        speaker: "Walter White",
        source: "Breaking Bad",
        tags: ["tv", "transformation"]
    },
    {
        id: "true-detective",
        text: "Time is a flat circle.",
        speaker: "Rust Cohle",
        source: "True Detective",
        tags: ["tv", "time", "philosophy"]
    },
    {
        id: "westworld",
        text: "These violent delights have violent ends.",
        speaker: "Dr. Robert Ford",
        source: "Westworld",
        tags: ["tv", "consciousness", "sci-fi"]
    },
    {
        id: "bojack",
        text: "It gets easier. Every day it gets a little easier. But you gotta do it every day — that's the hard part.",
        speaker: "Jogging Baboon",
        source: "BoJack Horseman",
        tags: ["tv", "growth", "perseverance"]
    },
    {
        id: "avatar-iroh",
        text: "Pride is not the opposite of shame, but its source. True humility is the only antidote to shame.",
        speaker: "Uncle Iroh",
        source: "Avatar: The Last Airbender",
        tags: ["tv", "wisdom", "character"]
    },
    {
        id: "avatar-iroh-2",
        text: "It is important to draw wisdom from many different places. If we take it from only one place, it becomes rigid and stale.",
        speaker: "Uncle Iroh",
        source: "Avatar: The Last Airbender",
        tags: ["tv", "wisdom", "learning"]
    },
    {
        id: "doctor-who",
        text: "We're all stories in the end. Just make it a good one.",
        speaker: "The Doctor",
        source: "Doctor Who",
        tags: ["tv", "legacy", "sci-fi"]
    },
    {
        id: "mr-robot",
        text: "Control is an illusion.",
        speaker: "Mr. Robot",
        source: "Mr. Robot",
        tags: ["tv", "control", "reality"]
    },

    // Films
    {
        id: "black-panther",
        text: "In times of crisis, the wise build bridges while the foolish build barriers.",
        speaker: "King T'Challa",
        source: "Black Panther",
        tags: ["film", "leadership"]
    },
    {
        id: "batman-begins",
        text: "It's not who I am underneath, but what I do that defines me.",
        speaker: "Batman",
        source: "Batman Begins",
        tags: ["film", "action", "identity"]
    },
    {
        id: "dark-knight",
        text: "You either die a hero, or you live long enough to see yourself become the villain.",
        speaker: "Harvey Dent",
        source: "The Dark Knight",
        tags: ["film", "morality", "corruption"]
    },
    {
        id: "fight-club",
        text: "It's only after we've lost everything that we're free to do anything.",
        speaker: "Tyler Durden",
        source: "Fight Club",
        tags: ["film", "freedom", "nihilism"]
    },
    {
        id: "shawshank",
        text: "Get busy living, or get busy dying.",
        speaker: "Andy Dufresne",
        source: "The Shawshank Redemption",
        tags: ["film", "hope", "choice"]
    },
    {
        id: "forrest-gump",
        text: "Life is like a box of chocolates. You never know what you're gonna get.",
        speaker: "Forrest Gump",
        source: "Forrest Gump",
        tags: ["film", "uncertainty", "life"]
    },
    {
        id: "inception",
        text: "What is the most resilient parasite? An idea.",
        speaker: "Cobb",
        source: "Inception",
        tags: ["film", "ideas", "influence"]
    },
    {
        id: "v-vendetta",
        text: "People should not be afraid of their governments. Governments should be afraid of their people.",
        speaker: "V",
        source: "V for Vendetta",
        tags: ["film", "politics", "power"]
    },

    // Historical & Activist Figures
    {
        id: "luther-king",
        text: "The arc of the moral universe is long, but it bends toward justice.",
        speaker: "Martin Luther King Jr.",
        source: "March on Washington Speech",
        tags: ["civil-rights", "justice"]
    },
    {
        id: "malcolm-x",
        text: "Education is the passport to the future, for tomorrow belongs to those who prepare for it today.",
        speaker: "Malcolm X",
        source: "Speech at the Founding Rally of the Organization of Afro-American Unity",
        tags: ["education", "activism"]
    },
    {
        id: "mandela",
        text: "It always seems impossible until it's done.",
        speaker: "Nelson Mandela",
        source: "Various speeches",
        tags: ["perseverance", "activism"]
    },
    {
        id: "gandhi",
        text: "Be the change that you wish to see in the world.",
        speaker: "Mahatma Gandhi",
        source: "Attributed",
        tags: ["action", "change"]
    }
];