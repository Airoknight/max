export interface LessonQuestion {
  id: number;
  setNumber: number;
  setTitle: string;
  sentence: string;
  targetAnswers: string[];
  rationale: string;
}

export const LESSON_DATA: LessonQuestion[] = [
  // Set 1: High-Frequency Workplace & Daily Routine
  {
    id: 1,
    setNumber: 1,
    setTitle: "High-Frequency Workplace & Daily Routine",
    sentence: "Please remember to _______ off the projector before leaving the seminar hall.",
    targetAnswers: ["turn", "switch"],
    rationale: "Phrasal verb: turn/switch off [device]"
  },
  {
    id: 2,
    setNumber: 1,
    setTitle: "High-Frequency Workplace & Daily Routine",
    sentence: "He had to cancel his ticket because an urgent emergency _______ up.",
    targetAnswers: ["came"],
    rationale: "Phrasal verb in past tense: came up"
  },
  {
    id: 3,
    setNumber: 1,
    setTitle: "High-Frequency Workplace & Daily Routine",
    sentence: "She carried an umbrella because the sky looked _______ this morning.",
    targetAnswers: ["cloudy", "dark"],
    rationale: "Predicate adjective describing rainy weather"
  },
  {
    id: 4,
    setNumber: 1,
    setTitle: "High-Frequency Workplace & Daily Routine",
    sentence: "Could you please _______ me a glass of water?",
    targetAnswers: ["bring", "get", "give"],
    rationale: "Imperative request verb taking double object"
  },
  {
    id: 5,
    setNumber: 1,
    setTitle: "High-Frequency Workplace & Daily Routine",
    sentence: "The manager asked everyone to _______ down their mobile phones during the client call.",
    targetAnswers: ["put", "turn"],
    rationale: "Phrasal verb collocation: put/turn down"
  },
  {
    id: 6,
    setNumber: 1,
    setTitle: "High-Frequency Workplace & Daily Routine",
    sentence: "He could not enter the lab because he _______ his identity badge at home.",
    targetAnswers: ["left", "forgot"],
    rationale: "Past perfect / simple past transitive verb"
  },
  {
    id: 7,
    setNumber: 1,
    setTitle: "High-Frequency Workplace & Daily Routine",
    sentence: "The bus was so crowded that several passengers had to _______ all the way.",
    targetAnswers: ["stand"],
    rationale: "Verb indicating physical posture on transit"
  },
  {
    id: 8,
    setNumber: 1,
    setTitle: "High-Frequency Workplace & Daily Routine",
    sentence: "She set an alarm for five o'clock so she would not _______ her morning train.",
    targetAnswers: ["miss"],
    rationale: "Transitive verb paired with transit: miss the train"
  },
  {
    id: 9,
    setNumber: 1,
    setTitle: "High-Frequency Workplace & Daily Routine",
    sentence: "The supervisor asked him to send an email to _______ the meeting date.",
    targetAnswers: ["confirm", "verify"],
    rationale: "Infinitive of purpose: confirm a date"
  },
  {
    id: 10,
    setNumber: 1,
    setTitle: "High-Frequency Workplace & Daily Routine",
    sentence: "He bought a new pair of running shoes because his old ones were _______ out.",
    targetAnswers: ["worn"],
    rationale: "Past participle in phrasal adjective: worn out"
  },

  // Set 2: Campus, Academic & Technical Contexts
  {
    id: 11,
    setNumber: 2,
    setTitle: "Campus, Academic & Technical Contexts",
    sentence: "Students must _______ their final project reports before five o'clock on Friday.",
    targetAnswers: ["submit", "hand"],
    rationale: "Transitive academic verb: submit a report"
  },
  {
    id: 12,
    setNumber: 2,
    setTitle: "Campus, Academic & Technical Contexts",
    sentence: "The laptop stopped working because the battery was completely _______.",
    targetAnswers: ["dead", "drained", "empty"],
    rationale: "Predicate adjective describing discharged battery"
  },
  {
    id: 13,
    setNumber: 2,
    setTitle: "Campus, Academic & Technical Contexts",
    sentence: "Did you _______ down the professor's contact number on your notebook?",
    targetAnswers: ["write", "note", "jot"],
    rationale: "Bare infinitive phrasal verb: write/note down"
  },
  {
    id: 14,
    setNumber: 2,
    setTitle: "Campus, Academic & Technical Contexts",
    sentence: "The printer ran _______ of paper while printing the examination notices.",
    targetAnswers: ["out"],
    rationale: "Idiomatic phrasal preposition: run out of"
  },
  {
    id: 15,
    setNumber: 2,
    setTitle: "Campus, Academic & Technical Contexts",
    sentence: "All team members were present, but nobody had _______ the project slides.",
    targetAnswers: ["prepared", "made"],
    rationale: "Past participle governed by past perfect had"
  },
  {
    id: 16,
    setNumber: 2,
    setTitle: "Campus, Academic & Technical Contexts",
    sentence: "Please check your network settings if you are unable to _______ to the Wi-Fi.",
    targetAnswers: ["connect"],
    rationale: "Infinitive verb taking preposition to: connect to"
  },
  {
    id: 17,
    setNumber: 2,
    setTitle: "Campus, Academic & Technical Contexts",
    sentence: "The classroom was so noisy that the teacher had to _______ his voice.",
    targetAnswers: ["raise"],
    rationale: "Transitive verb: raise one's voice (not rise)"
  },
  {
    id: 18,
    setNumber: 2,
    setTitle: "Campus, Academic & Technical Contexts",
    sentence: "He spent the entire weekend studying in order to _______ his backlog exams.",
    targetAnswers: ["clear", "pass"],
    rationale: "Collocation with academic tests: clear an exam"
  },
  {
    id: 19,
    setNumber: 2,
    setTitle: "Campus, Academic & Technical Contexts",
    sentence: "The external evaluator asked the candidate to _______ the logic behind the code.",
    targetAnswers: ["explain", "describe"],
    rationale: "Transitive reporting verb followed by direct object"
  },
  {
    id: 20,
    setNumber: 2,
    setTitle: "Campus, Academic & Technical Contexts",
    sentence: "She could not borrow the handbook because her library card was _______.",
    targetAnswers: ["expired", "invalid"],
    rationale: "Participial adjective describing card validity"
  },

  // Set 3: Travel, Transit & Public Encounters
  {
    id: 21,
    setNumber: 3,
    setTitle: "Travel, Transit & Public Encounters",
    sentence: "The passengers were told to fasten their seatbelts before the plane could _______ off.",
    targetAnswers: ["take"],
    rationale: "Phrasal verb for aviation: take off"
  },
  {
    id: 22,
    setNumber: 3,
    setTitle: "Travel, Transit & Public Encounters",
    sentence: "He had to pay a fine because he parked his vehicle in a _______ zone.",
    targetAnswers: ["no-parking", "restricted", "noparking"],
    rationale: "Compound noun/adjective describing forbidden area"
  },
  {
    id: 23,
    setNumber: 3,
    setTitle: "Travel, Transit & Public Encounters",
    sentence: "The train was delayed by thirty minutes due to heavy _______ along the coastal tracks.",
    targetAnswers: ["rain", "flooding", "fog"],
    rationale: "Uncountable noun indicating weather impediment"
  },
  {
    id: 24,
    setNumber: 3,
    setTitle: "Travel, Transit & Public Encounters",
    sentence: "Please hold _______ to the handrail while the escalator is moving.",
    targetAnswers: ["on"],
    rationale: "Prepositional phrase: hold on to"
  },
  {
    id: 25,
    setNumber: 3,
    setTitle: "Travel, Transit & Public Encounters",
    sentence: "She stood in line at the counter to _______ in her luggage.",
    targetAnswers: ["check"],
    rationale: "Phrasal verb for transit registration: check in"
  },
  {
    id: 26,
    setNumber: 3,
    setTitle: "Travel, Transit & Public Encounters",
    sentence: "He missed the announcement because he was _______ earphones.",
    targetAnswers: ["wearing"],
    rationale: "Past continuous participle: wearing earphones"
  },
  {
    id: 27,
    setNumber: 3,
    setTitle: "Travel, Transit & Public Encounters",
    sentence: "The security guard asked the visitors to show their _______ before entering.",
    targetAnswers: ["passes", "tickets", "ids", "id"],
    rationale: "Plural countable noun required by context"
  },
  {
    id: 28,
    setNumber: 3,
    setTitle: "Travel, Transit & Public Encounters",
    sentence: "The flight attendant handed each passenger a bottle of _______.",
    targetAnswers: ["water"],
    rationale: "Mass noun collocated with flight refreshments"
  },
  {
    id: 29,
    setNumber: 3,
    setTitle: "Travel, Transit & Public Encounters",
    sentence: "We should leave early tomorrow morning to _______ the heavy traffic.",
    targetAnswers: ["avoid", "beat"],
    rationale: "Infinitive of purpose: avoid traffic"
  },
  {
    id: 30,
    setNumber: 3,
    setTitle: "Travel, Transit & Public Encounters",
    sentence: "The taxi driver asked the passenger which _______ of the city he wanted to visit.",
    targetAnswers: ["part", "side", "area"],
    rationale: "Countable noun denoting geographical sector"
  },

  // Set 4: Food, Dining & Social Situations
  {
    id: 31,
    setNumber: 4,
    setTitle: "Food, Dining & Social Situations",
    sentence: "The soup was so hot that he had to wait for it to _______ down.",
    targetAnswers: ["cool"],
    rationale: "Phrasal verb: cool down"
  },
  {
    id: 32,
    setNumber: 4,
    setTitle: "Food, Dining & Social Situations",
    sentence: "Could you please pass the _______ so I can season my salad?",
    targetAnswers: ["salt", "pepper"],
    rationale: "Table condiment noun"
  },
  {
    id: 33,
    setNumber: 4,
    setTitle: "Food, Dining & Social Situations",
    sentence: "They decided to split the restaurant _______ equally among all four friends.",
    targetAnswers: ["bill", "check"],
    rationale: "Collocation: split the bill"
  },
  {
    id: 34,
    setNumber: 4,
    setTitle: "Food, Dining & Social Situations",
    sentence: "She drank a tall glass of cold water to quench her _______.",
    targetAnswers: ["thirst"],
    rationale: "Fixed idiomatic collocation: quench one's thirst"
  },
  {
    id: 35,
    setNumber: 4,
    setTitle: "Food, Dining & Social Situations",
    sentence: "He ordered a fruit salad because he wanted a _______ dessert.",
    targetAnswers: ["healthy", "light"],
    rationale: "Attributive adjective matching fruit salad"
  },
  {
    id: 36,
    setNumber: 4,
    setTitle: "Food, Dining & Social Situations",
    sentence: "The bread was left uncovered on the counter and became _______.",
    targetAnswers: ["stale", "dry", "hard"],
    rationale: "Sensory adjective describing aged bread"
  },
  {
    id: 37,
    setNumber: 4,
    setTitle: "Food, Dining & Social Situations",
    sentence: "Please taste the curry to check if it has enough _______.",
    targetAnswers: ["salt", "spice"],
    rationale: "Mass noun tested by tasting"
  },
  {
    id: 38,
    setNumber: 4,
    setTitle: "Food, Dining & Social Situations",
    sentence: "They reserved a table in advance because the cafe is always _______ on weekends.",
    targetAnswers: ["crowded", "full", "busy"],
    rationale: "Predicate adjective indicating high occupancy"
  },
  {
    id: 39,
    setNumber: 4,
    setTitle: "Food, Dining & Social Situations",
    sentence: "The tea was too bitter, so she added a spoonful of _______.",
    targetAnswers: ["sugar", "honey"],
    rationale: "Sweetener noun to counteract bitterness"
  },
  {
    id: 40,
    setNumber: 4,
    setTitle: "Food, Dining & Social Situations",
    sentence: "He gave a generous _______ to the waiter for providing quick service.",
    targetAnswers: ["tip"],
    rationale: "Countable noun for restaurant gratuity"
  },

  // Set 5: Health, Home Maintenance & Utilities
  {
    id: 41,
    setNumber: 5,
    setTitle: "Health, Home Maintenance & Utilities",
    sentence: "The doctor advised him to take these pills twice a _______ after meals.",
    targetAnswers: ["day"],
    rationale: "Time-frequency noun phrase: twice a day"
  },
  {
    id: 42,
    setNumber: 5,
    setTitle: "Health, Home Maintenance & Utilities",
    sentence: "She applied ice to her ankle to reduce the _______ after slipping on the stairs.",
    targetAnswers: ["swelling", "pain"],
    rationale: "Gerund/noun denoting physical trauma response"
  },
  {
    id: 43,
    setNumber: 5,
    setTitle: "Health, Home Maintenance & Utilities",
    sentence: "The plumber was called to fix a leaking _______ in the washroom.",
    targetAnswers: ["pipe", "tap", "faucet"],
    rationale: "Concrete countable noun repaired by a plumber"
  },
  {
    id: 44,
    setNumber: 5,
    setTitle: "Health, Home Maintenance & Utilities",
    sentence: "Don't touch the iron while it is plugged in because it is very _______.",
    targetAnswers: ["hot"],
    rationale: "Temperature adjective indicating danger"
  },
  {
    id: 45,
    setNumber: 5,
    setTitle: "Health, Home Maintenance & Utilities",
    sentence: "He went to bed early last night because he had a terrible _______.",
    targetAnswers: ["headache", "fever"],
    rationale: "Countable ailment noun preceded by a"
  },
  {
    id: 46,
    setNumber: 5,
    setTitle: "Health, Home Maintenance & Utilities",
    sentence: "Remember to lock the front _______ before you go to sleep.",
    targetAnswers: ["door"],
    rationale: "Domestic security collocation: lock the door"
  },
  {
    id: 47,
    setNumber: 5,
    setTitle: "Health, Home Maintenance & Utilities",
    sentence: "The room was pitch black until she switched on the _______.",
    targetAnswers: ["light", "lamp"],
    rationale: "Electrical fixture noun relieving darkness"
  },
  {
    id: 48,
    setNumber: 5,
    setTitle: "Health, Home Maintenance & Utilities",
    sentence: "The technician told us that the air conditioner needs more _______ to cool properly.",
    targetAnswers: ["gas", "refrigerant"],
    rationale: "Mass noun representing AC coolant"
  },
  {
    id: 49,
    setNumber: 5,
    setTitle: "Health, Home Maintenance & Utilities",
    sentence: "She wore sunglasses during her afternoon drive to protect her eyes from the bright _______.",
    targetAnswers: ["sun", "sunlight", "glare"],
    rationale: "Environmental source of optical glare"
  },
  {
    id: 50,
    setNumber: 5,
    setTitle: "Health, Home Maintenance & Utilities",
    sentence: "He had to call an electrician because all the power in his house suddenly went _______.",
    targetAnswers: ["out"],
    rationale: "Phrasal predicate adjective: power went out"
  }
];
