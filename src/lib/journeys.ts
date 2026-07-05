export type JourneyStep =
  | { kind: "conversation"; speaker: "citizen" | "saarthi"; text: string }
  | { kind: "profile"; facts: [string, string][] }
  | { kind: "recommendations"; items: { name: string; why: string; benefit: string }[] }
  | { kind: "documents"; items: string[] }
  | { kind: "guidance"; steps: string[] }
  | { kind: "outcome"; text: string; unlocked: string };

export type Journey = {
  slug: string;
  emoji: string;
  name: string;
  role: string;
  tagline: string;
  location: string;
  hero: string;
  language: string;
  steps: JourneyStep[];
};

export const JOURNEYS: Journey[] = [
  {
    slug: "lakshmi-devi",
    emoji: "👵",
    name: "Lakshmi Devi",
    role: "Senior Citizen",
    tagline: "68-year-old widow who unlocked a monthly pension and free health cover.",
    location: "Karnataka · Rural",
    hero: "I lived alone after my husband passed. I didn't know I could get help every month.",
    language: "Kannada",
    steps: [
      { kind: "conversation", speaker: "citizen", text: "ನಾನು 68 ವರ್ಷದ ವಿಧವೆ. ನನಗೆ ಸಹಾಯ ಬೇಕು." },
      { kind: "conversation", speaker: "saarthi", text: "ನಾನು ನಿಮ್ಮ ಸಾಥಿ. ನೀವು ಗ್ರಾಮದಲ್ಲಿ ವಾಸಿಸುತ್ತೀರಾ?" },
      { kind: "conversation", speaker: "citizen", text: "ಹೌದು, ನಾನು ಹಳ್ಳಿಯಲ್ಲಿ ವಾಸಿಸುತ್ತೇನೆ." },
      { kind: "profile", facts: [["Age", "68"], ["Gender", "Female"], ["Marital status", "Widow"], ["State", "Karnataka"], ["Household", "Rural"], ["Income", "Below ₹5,000/mo"]] },
      {
        kind: "recommendations",
        items: [
          { name: "Indira Gandhi National Widow Pension (IGNWPS)", why: "Widow, 40+, low income household", benefit: "₹300/month + state top-up" },
          { name: "IGNOAPS Old Age Pension", why: "Above 60, BPL household", benefit: "₹200–₹500/month" },
          { name: "Ayushman Bharat PM-JAY", why: "SECC-eligible household", benefit: "₹5 lakh/year free hospital cover" },
        ],
      },
      { kind: "documents", items: ["Aadhaar", "Widow certificate", "Bank passbook", "BPL ration card"] },
      { kind: "guidance", steps: ["Visit nearest Gram Panchayat with documents", "Submit combined application via SSP Karnataka", "SAARTHI reminds you to check status in 21 days"] },
      { kind: "outcome", text: "Lakshmi now receives ₹1,200/month combined pension and used PMJAY for a free cataract surgery.", unlocked: "₹14,400/year + free surgery worth ₹35,000" },
    ],
  },
  {
    slug: "ramesh",
    emoji: "👨‍🌾",
    name: "Ramesh Kumar",
    role: "Small Farmer",
    tagline: "Small landholder who got PM-KISAN + crop insurance + soil health card.",
    location: "Uttar Pradesh · Rural",
    hero: "The forms were too much. SAARTHI asked me questions like a friend.",
    language: "Hindi",
    steps: [
      { kind: "conversation", speaker: "citizen", text: "मैं किसान हूँ, मेरे पास 1.2 हेक्टेयर ज़मीन है।" },
      { kind: "conversation", speaker: "saarthi", text: "बहुत अच्छा। आपके परिवार में कौन-कौन खेती करता है?" },
      { kind: "conversation", speaker: "citizen", text: "मैं और मेरी पत्नी।" },
      { kind: "profile", facts: [["Age", "34"], ["Occupation", "Farmer"], ["Landholding", "Small (<2 ha)"], ["State", "Uttar Pradesh"], ["Household", "Rural"]] },
      {
        kind: "recommendations",
        items: [
          { name: "PM-KISAN", why: "Small/marginal farmer, land in own name", benefit: "₹6,000/year direct transfer" },
          { name: "Pradhan Mantri Fasal Bima Yojana", why: "Notified crop, farmer registration", benefit: "Insurance up to sum insured" },
          { name: "Soil Health Card", why: "Every farmer eligible", benefit: "Free soil analysis" },
        ],
      },
      { kind: "documents", items: ["Aadhaar", "Bank passbook", "Land records (Khasra/Khatauni)", "Mobile linked to Aadhaar"] },
      { kind: "guidance", steps: ["Register on pmkisan.gov.in with CSC help", "Enrol crop with local bank before sowing window", "SAARTHI tracks each ₹2,000 installment"] },
      { kind: "outcome", text: "Ramesh receives PM-KISAN quarterly and insured his kharif crop.", unlocked: "₹6,000/year + insurance safety net" },
    ],
  },
  {
    slug: "rahul",
    emoji: "🎓",
    name: "Rahul",
    role: "Student",
    tagline: "First-generation learner who got scholarship + free laptop.",
    location: "Maharashtra · Urban",
    hero: "I was the first in my family to apply. SAARTHI showed me why I qualified.",
    language: "Marathi",
    steps: [
      { kind: "conversation", speaker: "citizen", text: "I'm in Class 12 and want to study engineering." },
      { kind: "conversation", speaker: "saarthi", text: "Wonderful. What's your family's approximate yearly income?" },
      { kind: "conversation", speaker: "citizen", text: "Around ₹1.8 lakh." },
      { kind: "profile", facts: [["Age", "17"], ["Occupation", "Student"], ["Category", "OBC"], ["Family income", "₹1.8 L/yr"], ["State", "Maharashtra"]] },
      {
        kind: "recommendations",
        items: [
          { name: "Post Matric Scholarship (OBC)", why: "OBC, income ≤ ₹1.5 lakh…₹2 lakh depending on state", benefit: "Tuition + maintenance" },
          { name: "AICTE Pragati Scholarship", why: "Girl / merit + income cap", benefit: "₹50,000/year" },
          { name: "PM YASASVI", why: "OBC/EBC top scorers", benefit: "Coaching & scholarship" },
        ],
      },
      { kind: "documents", items: ["Aadhaar", "Class 10 & 12 marksheets", "Income certificate", "Caste certificate", "Bank passbook"] },
      { kind: "guidance", steps: ["Apply on National Scholarship Portal (NSP)", "Get institution verification within window", "SAARTHI notifies you of renewal date each year"] },
      { kind: "outcome", text: "Rahul secured post-matric scholarship for his engineering seat.", unlocked: "₹42,000/year tuition + maintenance" },
    ],
  },
  {
    slug: "asha",
    emoji: "👩",
    name: "Asha",
    role: "Women Entrepreneur",
    tagline: "Vegetable-vendor turned micro-entrepreneur with Mudra + PM SVANidhi.",
    location: "West Bengal · Urban",
    hero: "I only needed a small loan to buy a cart. Now I earn double.",
    language: "Bengali",
    steps: [
      { kind: "conversation", speaker: "citizen", text: "আমি সবজি বিক্রি করি রাস্তায়। একটা ছোট লোন চাই।" },
      { kind: "conversation", speaker: "saarthi", text: "আপনার কি ব্যাঙ্ক অ্যাকাউন্ট আছে?" },
      { kind: "conversation", speaker: "citizen", text: "হ্যাঁ, জন ধন অ্যাকাউন্ট আছে।" },
      { kind: "profile", facts: [["Age", "41"], ["Gender", "Female"], ["Occupation", "Street vendor"], ["State", "West Bengal"], ["Household", "Urban"], ["Income", "₹9,000/mo"]] },
      {
        kind: "recommendations",
        items: [
          { name: "PM SVANidhi", why: "Street vendor with vending certificate", benefit: "₹10,000 → ₹20,000 → ₹50,000 loans" },
          { name: "PM Mudra Yojana (Shishu)", why: "Micro-enterprise, no collateral", benefit: "Up to ₹50,000 loan" },
          { name: "PM Matru Vandana Yojana", why: "First live birth, if applicable", benefit: "₹5,000 maternity" },
        ],
      },
      { kind: "documents", items: ["Aadhaar", "Jan Dhan passbook", "Vending certificate/LOR from ULB", "Mobile linked to Aadhaar"] },
      { kind: "guidance", steps: ["Get vending certificate at ULB", "Apply for SVANidhi via SBI/BoB or CSC", "SAARTHI reminds you to repay on time for higher loans"] },
      { kind: "outcome", text: "Asha now runs a stall with a proper cart and repays on time.", unlocked: "₹10,000 loan + interest subsidy + digital cashback" },
    ],
  },
  {
    slug: "ravi",
    emoji: "♿",
    name: "Ravi",
    role: "Person with Disability",
    tagline: "Locomotor disability — got disability pension, aid appliance & housing help.",
    location: "Tamil Nadu · Rural",
    hero: "Voice made all the difference. I could speak, not type, and SAARTHI understood.",
    language: "Tamil",
    steps: [
      { kind: "conversation", speaker: "citizen", text: "எனக்கு 80% மாற்றுத்திறன் உள்ளது." },
      { kind: "conversation", speaker: "saarthi", text: "நன்றி பகிர்ந்ததற்காக. உங்களுக்கு UDID அட்டை உள்ளதா?" },
      { kind: "conversation", speaker: "citizen", text: "ஆம், UDID இருக்கு." },
      { kind: "profile", facts: [["Age", "29"], ["Gender", "Male"], ["Disability", "Locomotor 80%"], ["State", "Tamil Nadu"], ["Household", "Rural"], ["Category", "SC"]] },
      {
        kind: "recommendations",
        items: [
          { name: "IGNDPS Disability Pension", why: "PwD 80%+, BPL", benefit: "₹300/month + state top-up" },
          { name: "ADIP Scheme (Aids & Appliances)", why: "Locomotor disability", benefit: "Free/subsidised assistive device" },
          { name: "PMAY-G (Housing)", why: "SC + PwD priority", benefit: "₹1.2 L housing assistance" },
        ],
      },
      { kind: "documents", items: ["Aadhaar", "UDID card", "Income certificate", "Caste certificate", "Bank passbook"] },
      { kind: "guidance", steps: ["Apply combined at Taluk office", "ADIP camp scheduled by SAARTHI", "PMAY-G application through Gram Sabha"] },
      { kind: "outcome", text: "Ravi received a motorised tricycle and disability pension.", unlocked: "₹3,600/year + tricycle worth ₹35,000 + housing pipeline" },
    ],
  },
];

export function findJourney(slug: string): Journey | undefined {
  return JOURNEYS.find((j) => j.slug === slug);
}