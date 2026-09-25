// Hypothetical phone reviews for the Flipkart-style aspect demo from the video
// ("Aster M1 5G"). Aspect scores are the pre-computed outputs our pseudo-JEV "returns":
// for every review × aspect we imitate two questions — mentioned? (noul) and satisfaction (score 1–5).

export const ASPECTS = [
  { key: "camera", label: "Camera", terms: ["camera", "photo", "photos", "video", "selfie", "night mode", "portrait"] },
  { key: "battery", label: "Battery", terms: ["battery", "charge", "charging", "backup", "drain", "drains", "sot"] },
  { key: "display", label: "Display", terms: ["display", "screen", "amoled", "brightness", "refresh", "120hz"] },
  { key: "design", label: "Design", terms: ["design", "looks", "colour", "color", "slim", "feel", "matte"] },
  { key: "performance", label: "Performance", terms: ["performance", "lag", "gaming", "fast", "smooth", "heats", "bgmi", "processor"] },
  { key: "build", label: "Build quality", terms: ["build", "plastic", "frame", "sturdy", "flimsy", "creak", "glass"] },
  { key: "value", label: "Value for money", terms: ["price", "value", "money", "worth", "budget", "overpriced", "₹"] },
] as const;

export type AspectKey = (typeof ASPECTS)[number]["key"];

export type Review = {
  id: number;
  author: string;
  rating: number;
  text: string;
  aspects: Partial<Record<AspectKey, number>>; // 1–5 satisfaction where the aspect is mentioned
};

export const REVIEWS: Review[] = [
  { id: 1, author: "Rohit K.", rating: 5, text: "The display is gorgeous, AMOLED with deep blacks. Battery easily lasts a full day. Totally worth the price.", aspects: { display: 5, battery: 4, value: 5 } },
  { id: 2, author: "Sneha P.", rating: 3, text: "Camera is okay in daylight but night photos are blurry. Performance is smooth for daily use.", aspects: { camera: 2, performance: 4 } },
  { id: 3, author: "Arjun M.", rating: 2, text: "Phone heats up while gaming and BGMI lags after 20 minutes. Battery drains fast too.", aspects: { performance: 1, battery: 2 } },
  { id: 4, author: "Priya S.", rating: 4, text: "Love the matte design and slim feel. The screen is bright even outdoors.", aspects: { design: 5, display: 4 } },
  { id: 5, author: "Imran A.", rating: 1, text: "Build quality feels flimsy, the frame creaks. Overpriced for what you get.", aspects: { build: 1, value: 1 } },
  { id: 6, author: "Kavya R.", rating: 4, text: "Selfie camera is great and portrait mode is impressive. Charging is quick, 0 to 80 in 40 minutes.", aspects: { camera: 4, battery: 4 } },
  { id: 7, author: "Vikram T.", rating: 3, text: "Average phone. Display is fine, camera is average, nothing special for the money.", aspects: { display: 3, camera: 3, value: 2 } },
  { id: 8, author: "Ananya D.", rating: 5, text: "Super smooth performance, apps open fast. 120Hz refresh makes scrolling a joy.", aspects: { performance: 5, display: 5 } },
  { id: 9, author: "Harsh V.", rating: 2, text: "Video recording has no stabilisation and photos look washed out. Disappointed with the camera.", aspects: { camera: 1 } },
  { id: 10, author: "Meera J.", rating: 4, text: "Battery backup is solid, 7 hours screen on time. Design looks premium in the green colour.", aspects: { battery: 5, design: 4 } },
  { id: 11, author: "Aditya N.", rating: 3, text: "Plastic frame but sturdy enough. Performance is decent, slight lag in heavy apps.", aspects: { build: 3, performance: 3 } },
  { id: 12, author: "Pooja L.", rating: 5, text: "Best budget phone! Camera takes crisp photos and the display is stunning. Great value.", aspects: { camera: 5, display: 5, value: 5 } },
  { id: 13, author: "Sahil G.", rating: 2, text: "Battery drains overnight on standby. Charging also gets hot.", aspects: { battery: 1 } },
  { id: 14, author: "Nisha B.", rating: 4, text: "Looks beautiful and feels good in hand. Glass back attracts fingerprints though.", aspects: { design: 4, build: 3 } },
  { id: 15, author: "Karan Z.", rating: 3, text: "Night mode on the camera is slow. Screen brightness is good. Price is fair.", aspects: { camera: 2, display: 4, value: 3 } },
  { id: 16, author: "Divya C.", rating: 1, text: "Screen started flickering in a week. Very poor quality, returned it.", aspects: { display: 1, build: 1 } },
  { id: 17, author: "Rahul I.", rating: 4, text: "Gaming is smooth on medium settings, no heating issue for me. Battery is good.", aspects: { performance: 4, battery: 4 } },
  { id: 18, author: "Tanvi O.", rating: 3, text: "The design is bland, looks like every other phone. Camera is decent.", aspects: { design: 2, camera: 3 } },
  { id: 19, author: "Manish E.", rating: 4, text: "For ₹17,999 this is a steal. Display and performance both beat the competition.", aspects: { value: 5, display: 4, performance: 4 } },
  { id: 20, author: "Ritika H.", rating: 2, text: "Build quality is cheap, the buttons wobble. Battery is the only good thing.", aspects: { build: 1, battery: 4 } },
  { id: 21, author: "Yash F.", rating: 5, text: "Photos are sharp, colours accurate, video is stable. Very happy with the camera.", aspects: { camera: 5 } },
  { id: 22, author: "Shreya W.", rating: 3, text: "Charging is slow compared to others. Screen is fine for Netflix.", aspects: { battery: 2, display: 3 } },
  { id: 23, author: "Deepak U.", rating: 4, text: "Sturdy frame, survived a drop without a scratch. Performance is snappy.", aspects: { build: 5, performance: 4 } },
  { id: 24, author: "Isha Q.", rating: 2, text: "Too expensive for a plastic phone and the camera is mediocre. Not worth the money.", aspects: { value: 1, build: 2, camera: 2 } },
];
