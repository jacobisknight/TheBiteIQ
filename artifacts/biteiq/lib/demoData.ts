import { buildPlan, todayKey } from "@/lib/nutrition";
import { makeId } from "@/lib/storage";
import type {
  CoachMessage,
  FoodItem,
  MealEntry,
  MealPlan,
  UserProfile,
  WeightEntry,
  WorkoutPlan,
} from "@/types";

export const DEMO_EMAIL =
  process.env.EXPO_PUBLIC_DEMO_EMAIL || "apple-review@biteiq.app";

export function isDemoEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === DEMO_EMAIL.trim().toLowerCase();
}

// NOTE: Dates and IDs are intentionally NOT deterministic across runs.
// We want every reviewer / screenshot session to land on a dashboard
// dated "today" relative to whenever the demo signs in, so the data
// always looks fresh. Determinism would mean the dashboard reads e.g.
// "logged 3 weeks ago" when Apple reviews next month.

function dateKey(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return todayKey(d);
}

function timeOnDay(daysAgo: number, hour: number, minute: number): number {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d.getTime();
}

function food(
  name: string,
  servingDescription: string,
  calories: number,
  protein: number,
  carbs: number,
  fat: number,
  extras: Partial<FoodItem> = {},
): FoodItem {
  return {
    id: makeId(),
    name,
    servingDescription,
    calories,
    protein,
    carbs,
    fat,
    ...extras,
  };
}

function buildDemoMeals(): MealEntry[] {
  const meals: MealEntry[] = [];

  // Day 0 (today) — full, pretty day
  meals.push({
    id: makeId(),
    date: dateKey(0),
    mealType: "breakfast",
    loggedAt: timeOnDay(0, 8, 12),
    source: "photo",
    items: [
      food(
        "Greek yogurt with berries and granola",
        "1 bowl (about 250 grams)",
        382,
        24,
        48,
        9,
        { fiber: 6, sugar: 22, saturatedFat: 2, sodium: 95 },
      ),
    ],
    note: "Loved this — felt full all morning.",
  });
  meals.push({
    id: makeId(),
    date: dateKey(0),
    mealType: "lunch",
    loggedAt: timeOnDay(0, 12, 35),
    source: "voice",
    items: [
      food(
        "Grilled chicken bowl with quinoa and vegetables",
        "1 large bowl",
        624,
        46,
        58,
        18,
        { fiber: 9, sugar: 7, saturatedFat: 4, sodium: 720 },
      ),
    ],
  });
  meals.push({
    id: makeId(),
    date: dateKey(0),
    mealType: "snack",
    loggedAt: timeOnDay(0, 15, 40),
    source: "search",
    items: [
      food(
        "Apple with almond butter",
        "1 medium apple, 1 tablespoon almond butter",
        212,
        4,
        28,
        10,
        { fiber: 5, sugar: 21, saturatedFat: 1, sodium: 0 },
      ),
    ],
  });
  meals.push({
    id: makeId(),
    date: dateKey(0),
    mealType: "dinner",
    loggedAt: timeOnDay(0, 19, 5),
    source: "photo",
    items: [
      food(
        "Salmon with roasted sweet potato",
        "150 grams salmon, 1 cup sweet potato, 1 cup asparagus",
        582,
        38,
        46,
        24,
        { fiber: 8, sugar: 12, saturatedFat: 5, sodium: 480 },
      ),
    ],
  });

  // Day 1 (yesterday)
  meals.push({
    id: makeId(),
    date: dateKey(1),
    mealType: "breakfast",
    loggedAt: timeOnDay(1, 7, 55),
    source: "voice",
    items: [
      food(
        "Two scrambled eggs and avocado toast",
        "2 eggs, 1 slice whole-grain toast, half avocado",
        445,
        21,
        28,
        27,
        { fiber: 8, sugar: 3, saturatedFat: 6, sodium: 540 },
      ),
    ],
  });
  meals.push({
    id: makeId(),
    date: dateKey(1),
    mealType: "lunch",
    loggedAt: timeOnDay(1, 13, 0),
    source: "search",
    items: [
      food(
        "Turkey and cheese sandwich with side salad",
        "1 sandwich, 1 small salad",
        560,
        36,
        52,
        18,
        { fiber: 6, sugar: 8, saturatedFat: 6, sodium: 980 },
      ),
    ],
  });
  meals.push({
    id: makeId(),
    date: dateKey(1),
    mealType: "dinner",
    loggedAt: timeOnDay(1, 19, 30),
    source: "photo",
    items: [
      food(
        "Stir-fried tofu with brown rice and broccoli",
        "1 plate (about 400 grams)",
        610,
        32,
        72,
        18,
        { fiber: 11, sugar: 9, saturatedFat: 3, sodium: 690 },
      ),
    ],
  });

  // Days 2..6 — single representative meal each so the streak counter shows 7
  const olderDays: { day: number; meal: MealEntry }[] = [
    {
      day: 2,
      meal: {
        id: makeId(),
        date: dateKey(2),
        mealType: "lunch",
        loggedAt: timeOnDay(2, 12, 45),
        source: "voice",
        items: [
          food(
            "Chicken Caesar salad",
            "1 large bowl",
            520,
            38,
            18,
            32,
            { fiber: 5, sugar: 4, saturatedFat: 7, sodium: 880 },
          ),
        ],
      },
    },
    {
      day: 3,
      meal: {
        id: makeId(),
        date: dateKey(3),
        mealType: "dinner",
        loggedAt: timeOnDay(3, 19, 15),
        source: "search",
        items: [
          food(
            "Spaghetti with turkey meatballs",
            "1.5 cups pasta, 4 meatballs",
            720,
            42,
            78,
            22,
            { fiber: 7, sugar: 11, saturatedFat: 7, sodium: 920 },
          ),
        ],
      },
    },
    {
      day: 4,
      meal: {
        id: makeId(),
        date: dateKey(4),
        mealType: "breakfast",
        loggedAt: timeOnDay(4, 8, 30),
        source: "photo",
        items: [
          food(
            "Oatmeal with banana and peanut butter",
            "1 cup oats, 1 banana, 1 tablespoon peanut butter",
            420,
            14,
            64,
            12,
            { fiber: 9, sugar: 18, saturatedFat: 2, sodium: 95 },
          ),
        ],
      },
    },
    {
      day: 5,
      meal: {
        id: makeId(),
        date: dateKey(5),
        mealType: "dinner",
        loggedAt: timeOnDay(5, 19, 45),
        source: "voice",
        items: [
          food(
            "Grilled steak with roasted vegetables",
            "180 grams steak, 1.5 cups vegetables",
            640,
            48,
            22,
            36,
            { fiber: 7, sugar: 10, saturatedFat: 12, sodium: 520 },
          ),
        ],
      },
    },
    {
      day: 6,
      meal: {
        id: makeId(),
        date: dateKey(6),
        mealType: "lunch",
        loggedAt: timeOnDay(6, 12, 30),
        source: "search",
        items: [
          food(
            "Burrito bowl with rice, beans, and salsa",
            "1 bowl",
            680,
            32,
            88,
            18,
            { fiber: 14, sugar: 6, saturatedFat: 4, sodium: 1100 },
          ),
        ],
      },
    },
  ];
  for (const { meal } of olderDays) meals.push(meal);

  return meals;
}

function buildDemoWeights(currentKg: number): WeightEntry[] {
  const out: WeightEntry[] = [];
  // 14 days of weights, gentle downward trend with noise (~ -1.5 kg total)
  for (let i = 13; i >= 0; i--) {
    const trend = currentKg + (i / 13) * 1.5;
    const noise = ((i * 37) % 7) / 10 - 0.3; // deterministic, small
    out.push({
      id: makeId(),
      date: dateKey(i),
      weightKg: Math.round((trend + noise) * 10) / 10,
      loggedAt: timeOnDay(i, 7, 30),
    });
  }
  return out;
}

function buildDemoWorkoutPlan(): WorkoutPlan {
  return {
    createdAt: Date.now(),
    summary:
      "A simple 5-day plan you can do at home with no equipment. Two short upper-body days, two short lower-body days, and one easy mobility day. Each session is between 25 and 35 minutes including a warm-up and cool-down.",
    days: [
      {
        day: "Monday",
        focus: "Upper body push",
        durationMin: 30,
        exercises: [
          {
            name: "Marching in place",
            sets: "1 round of 90 seconds",
            notes: "Tip: lift your knees a little higher each round.",
            howTo:
              "1. Stand tall with your arms relaxed.\n2. Lift one knee up toward your chest, then lower it.\n3. Repeat with the other leg in a steady, comfortable rhythm.",
            whyItHelps:
              "Warms up your heart and legs gently so you are ready for the harder exercises.",
          },
          {
            name: "Wall push-ups",
            sets: "3 rounds of 12 repetitions",
            notes: "Tip: keep your body in one straight line.",
            howTo:
              "1. Stand about an arm's length away from a wall.\n2. Place your palms flat on the wall at shoulder height.\n3. Bend your elbows and bring your chest toward the wall.\n4. Push back to the starting position.",
            whyItHelps:
              "Builds strength in your chest, shoulders, and arms in a way that is easy on your joints.",
          },
          {
            name: "Seated shoulder press with water bottles",
            sets: "3 rounds of 10 repetitions",
            notes: "Tip: use whatever weight feels light but not too easy.",
            howTo:
              "1. Sit upright on a chair holding a water bottle in each hand at shoulder height.\n2. Press both bottles straight up over your head.\n3. Slowly lower them back to your shoulders.",
            whyItHelps:
              "Strengthens your shoulders so daily lifting and reaching feel easier.",
          },
          {
            name: "Standing arm circles",
            sets: "2 rounds of 30 seconds in each direction",
            notes: "Tip: keep the circles small and controlled.",
            howTo:
              "1. Stand with your arms stretched out to the sides.\n2. Make small circles with your arms going forward.\n3. After 30 seconds, switch and circle backward for another 30 seconds.",
            whyItHelps:
              "Cools down your shoulders and improves the way they move.",
          },
        ],
      },
      {
        day: "Tuesday",
        focus: "Lower body",
        durationMin: 30,
        exercises: [
          {
            name: "Slow walking in place",
            sets: "1 round of 90 seconds",
            notes: "",
            howTo:
              "1. Walk in place at a relaxed pace.\n2. Swing your arms gently to warm up your whole body.",
            whyItHelps:
              "Gets blood flowing to your legs before the harder work begins.",
          },
          {
            name: "Chair squats",
            sets: "3 rounds of 12 repetitions",
            notes: "Tip: tap the chair with your hips, then stand back up.",
            howTo:
              "1. Stand in front of a sturdy chair with your feet about shoulder width apart.\n2. Lower yourself down by bending your knees and pushing your hips back.\n3. Lightly touch the chair with your hips, then stand back up.",
            whyItHelps:
              "Builds the leg strength you need for stairs, standing up, and walking longer distances.",
          },
          {
            name: "Step-back lunges",
            sets: "3 rounds of 10 repetitions on each leg",
            notes: "Tip: hold a wall or chair if you need more balance.",
            howTo:
              "1. Stand tall with your feet together.\n2. Take a long step backward with one foot.\n3. Bend both knees until your back knee almost touches the floor.\n4. Push through your front foot to return to the starting position.",
            whyItHelps:
              "Strengthens your legs one side at a time, which improves balance.",
          },
          {
            name: "Standing calf raises",
            sets: "3 rounds of 15 repetitions",
            notes: "",
            howTo:
              "1. Stand with your feet flat on the floor.\n2. Slowly rise up onto the balls of your feet.\n3. Hold for one second, then lower back down.",
            whyItHelps:
              "Strengthens your calves and ankles, which helps prevent slips and falls.",
          },
        ],
      },
      {
        day: "Wednesday",
        focus: "Mobility and stretching",
        durationMin: 25,
        exercises: [
          {
            name: "Neck rolls",
            sets: "2 rounds of 5 slow circles in each direction",
            notes: "",
            howTo:
              "1. Sit or stand tall.\n2. Slowly drop your chin toward your chest.\n3. Roll your head in a half circle to one shoulder, then the other.",
            whyItHelps:
              "Releases tension in the neck and shoulders from sitting at a desk.",
          },
          {
            name: "Cat and cow stretch",
            sets: "2 rounds of 10 repetitions",
            notes: "",
            howTo:
              "1. Get on your hands and knees with your back flat.\n2. Slowly arch your back up toward the ceiling and tuck your chin.\n3. Then drop your belly toward the floor and look slightly up.",
            whyItHelps:
              "Loosens the spine and reduces lower back stiffness.",
          },
          {
            name: "Standing forward fold",
            sets: "2 rounds of 30 seconds",
            notes: "Tip: bend your knees as much as you need.",
            howTo:
              "1. Stand with your feet about hip width apart.\n2. Slowly fold forward from your hips and let your arms hang.\n3. Hold and breathe deeply.",
            whyItHelps:
              "Stretches the back of your legs and your lower back.",
          },
        ],
      },
      {
        day: "Thursday",
        focus: "Upper body pull",
        durationMin: 30,
        exercises: [
          {
            name: "Arm swings",
            sets: "1 round of 60 seconds",
            notes: "",
            howTo:
              "1. Stand tall with your feet shoulder width apart.\n2. Swing both arms forward and backward in a relaxed motion.",
            whyItHelps: "Warms up your shoulders and upper back.",
          },
          {
            name: "Bent-over rows with water bottles",
            sets: "3 rounds of 10 repetitions",
            notes: "Tip: keep your back flat, not rounded.",
            howTo:
              "1. Hold a water bottle in each hand and bend forward slightly at the hips.\n2. Pull both bottles up toward your ribs by squeezing your shoulder blades together.\n3. Slowly lower them back down.",
            whyItHelps:
              "Strengthens your upper back and improves posture.",
          },
          {
            name: "Door-frame chest stretch",
            sets: "2 rounds of 30 seconds on each side",
            notes: "",
            howTo:
              "1. Stand in a doorway and place one forearm on the door frame.\n2. Step forward gently with the same side foot until you feel a stretch across your chest.",
            whyItHelps:
              "Opens up the chest and counters slouching.",
          },
        ],
      },
      {
        day: "Friday",
        focus: "Full body",
        durationMin: 35,
        exercises: [
          {
            name: "Light marching with arm raises",
            sets: "1 round of 90 seconds",
            notes: "",
            howTo:
              "1. March in place at a comfortable pace.\n2. Raise your arms overhead every few steps and lower them back down.",
            whyItHelps:
              "Warms up your whole body and gets your heart rate up.",
          },
          {
            name: "Chair squats",
            sets: "3 rounds of 12 repetitions",
            notes: "",
            howTo:
              "1. Stand in front of a chair with feet shoulder width apart.\n2. Sit back and lower yourself until your hips just tap the chair.\n3. Stand back up.",
            whyItHelps: "Builds leg strength you use every single day.",
          },
          {
            name: "Wall push-ups",
            sets: "3 rounds of 12 repetitions",
            notes: "",
            howTo:
              "1. Stand an arm's length from a wall.\n2. Place your palms on the wall at shoulder height.\n3. Bend your elbows to bring your chest toward the wall, then push back.",
            whyItHelps: "Strengthens chest, shoulders, and arms gently.",
          },
          {
            name: "Slow standing twists",
            sets: "2 rounds of 30 seconds",
            notes: "",
            howTo:
              "1. Stand with feet shoulder width apart and arms relaxed.\n2. Slowly rotate your upper body to one side, then the other.",
            whyItHelps:
              "Cools down your body and loosens your lower back.",
          },
        ],
      },
    ],
  };
}

function buildDemoMealPlan(): MealPlan {
  return {
    createdAt: Date.now(),
    summary:
      "A balanced day around 2,200 calories with plenty of protein, fiber, and vegetables. Each meal is simple to prepare with common grocery store ingredients.",
    meals: [
      {
        mealType: "breakfast",
        name: "Greek yogurt parfait",
        description: "Plain Greek yogurt layered with mixed berries and granola.",
        calories: 380,
        protein: 24,
        carbs: 48,
        fat: 9,
        fiber: 6,
        sugar: 22,
        saturatedFat: 2,
        sodium: 95,
      },
      {
        mealType: "lunch",
        name: "Chicken and quinoa bowl",
        description:
          "Grilled chicken breast with quinoa, roasted vegetables, and a lemon vinaigrette.",
        calories: 620,
        protein: 46,
        carbs: 58,
        fat: 18,
        fiber: 9,
        sugar: 7,
        saturatedFat: 4,
        sodium: 720,
      },
      {
        mealType: "snack",
        name: "Apple and almond butter",
        description: "One medium apple sliced with a tablespoon of almond butter.",
        calories: 210,
        protein: 4,
        carbs: 28,
        fat: 10,
        fiber: 5,
        sugar: 21,
        saturatedFat: 1,
        sodium: 0,
      },
      {
        mealType: "dinner",
        name: "Salmon with sweet potato and asparagus",
        description:
          "Baked salmon fillet with roasted sweet potato wedges and steamed asparagus.",
        calories: 580,
        protein: 38,
        carbs: 46,
        fat: 24,
        fiber: 8,
        sugar: 12,
        saturatedFat: 5,
        sodium: 480,
      },
    ],
  };
}

function buildDemoCoachMessages(): CoachMessage[] {
  const now = Date.now();
  return [
    {
      id: makeId(),
      role: "user",
      content: "What should I focus on this week to lose a little weight?",
      createdAt: now - 1000 * 60 * 60 * 26,
    },
    {
      id: makeId(),
      role: "assistant",
      content:
        "Three small changes will move the needle without feeling restrictive: add a palm-sized portion of protein to every meal, swap one snack a day for a piece of fruit, and walk for 20 minutes after dinner. Stick with that for the week and your dashboard will tell the story.",
      createdAt: now - 1000 * 60 * 60 * 26 + 4000,
    },
    {
      id: makeId(),
      role: "user",
      content: "I am traveling on Friday — any tips for eating out?",
      createdAt: now - 1000 * 60 * 60 * 4,
    },
    {
      id: makeId(),
      role: "assistant",
      content:
        "Order a protein you recognize (grilled chicken, salmon, steak) plus a vegetable side, and ask for any sauces on the side. If the portion looks larger than your hand, plan to take half home. Log the meal with the photo button — even a rough estimate is better than skipping it.",
      createdAt: now - 1000 * 60 * 60 * 4 + 3000,
    },
  ];
}

export interface DemoBundle {
  user: UserProfile;
  meals: MealEntry[];
  weights: WeightEntry[];
  workoutPlan: WorkoutPlan;
  mealPlan: MealPlan;
  coachMessages: CoachMessage[];
}

export function buildDemoBundle(): DemoBundle {
  const baseProfile = {
    name: "Alex",
    age: 32,
    sex: "male" as const,
    heightCm: 178,
    weightKg: 80.5,
    activity: "moderate" as const,
    goal: "lose" as const,
    glp1Mode: false,
  };
  const plan = buildPlan(baseProfile);
  const user: UserProfile = {
    ...baseProfile,
    ...plan,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 21, // joined 3 weeks ago
  };
  return {
    user,
    meals: buildDemoMeals(),
    weights: buildDemoWeights(baseProfile.weightKg),
    workoutPlan: buildDemoWorkoutPlan(),
    mealPlan: buildDemoMealPlan(),
    coachMessages: buildDemoCoachMessages(),
  };
}
