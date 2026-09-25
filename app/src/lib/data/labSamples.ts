// Hand-labelled demo set for the BERT vs JEV benchmark (1–5 stars, Moodify's 5 classes).
// Deliberately mixed: plain English, sarcasm, negation, mixed aspects and romanised Hinglish —
// the cases where a fine-tuned 2019-era classifier and a world-knowledge decision model differ.
// Replace or extend with your own CSV (text + label/rating columns) from the lab UI.

export type LabeledSample = { text: string; stars: 1 | 2 | 3 | 4 | 5; tag: string };

export const LAB_SAMPLES: LabeledSample[] = [
  { text: "Absolutely love this phone, the display is stunning and battery lasts two days.", stars: 5, tag: "plain" },
  { text: "Best purchase this year. Fast delivery, premium build, zero complaints.", stars: 5, tag: "plain" },
  { text: "Worst product ever. Stopped working in 3 days and support ignored me.", stars: 1, tag: "plain" },
  { text: "Complete waste of money, the screen cracked on its own.", stars: 1, tag: "plain" },
  { text: "It's fine. Does the job, nothing more, nothing less.", stars: 3, tag: "plain" },
  { text: "Good phone overall, camera could be better in low light.", stars: 4, tag: "mixed" },
  { text: "Decent performance but it heats up a lot while charging.", stars: 3, tag: "mixed" },
  { text: "Battery is great but the camera is honestly disappointing.", stars: 3, tag: "mixed" },
  { text: "Pretty good value for the price, though the speakers are weak.", stars: 4, tag: "mixed" },
  { text: "Not bad at all, actually better than I expected.", stars: 4, tag: "negation" },
  { text: "I wouldn't say it's terrible, but I wouldn't buy it again.", stars: 2, tag: "negation" },
  { text: "Not the worst phone I've owned, not the best either.", stars: 3, tag: "negation" },
  { text: "Never had a single issue in six months. Rock solid.", stars: 5, tag: "negation" },
  { text: "Oh great, another update that drains my battery by noon. Just what I needed.", stars: 1, tag: "sarcasm" },
  { text: "Wow, it only took four replacements to get one that works. Amazing service.", stars: 1, tag: "sarcasm" },
  { text: "Love how the 'premium' phone creaks every time I hold it.", stars: 2, tag: "sarcasm" },
  { text: "Phone ekdum badhiya hai, camera mast hai, full paisa vasool.", stars: 5, tag: "hinglish" },
  { text: "Bakwas product, battery 4 ghante bhi nahi chalti.", stars: 1, tag: "hinglish" },
  { text: "Theek thaak hai, is price mein chal jayega.", stars: 3, tag: "hinglish" },
  { text: "Display accha hai but heating issue bahut hai.", stars: 3, tag: "hinglish" },
  { text: "Delivery late thi but phone zabardast nikla.", stars: 4, tag: "hinglish" },
  { text: "Bilkul bekaar, paise barbaad ho gaye.", stars: 1, tag: "hinglish" },
  { text: "The packaging was damaged but the product inside works perfectly.", stars: 4, tag: "mixed" },
  { text: "Returned it. The fingerprint sensor fails half the time.", stars: 2, tag: "plain" },
  { text: "Five stars for the display, one star for the software. Average it out.", stars: 3, tag: "mixed" },
  { text: "Could have been great if it didn't lag so much.", stars: 2, tag: "negation" },
  { text: "Genuinely impressed. Smooth, fast and the camera punches above its price.", stars: 5, tag: "plain" },
  { text: "Meh. Bought it on sale, would not pay full price.", stars: 3, tag: "plain" },
  { text: "The phone is good but customer care is the worst I've dealt with.", stars: 2, tag: "mixed" },
  { text: "Perfect for my parents, big fonts, simple, reliable.", stars: 5, tag: "plain" },
  { text: "Kya phone hai yaar, gaming mein bhi koi lag nahi.", stars: 5, tag: "hinglish" },
  { text: "Screen flickers at low brightness, very annoying.", stars: 2, tag: "plain" },
];
