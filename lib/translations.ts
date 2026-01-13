export type Language = "en" | "ur"

export type TranslationKey =
  | "tagline"
  | "description"
  | "orderNow"
  | "whyChoose"
  | "fastDelivery"
  | "fastDeliveryDesc"
  | "freshIngredients"
  | "freshIngredientsDesc"
  | "topRated"
  | "topRatedDesc"

export const translations: Record<Language, Record<TranslationKey, string>> = {
  en: {
    tagline: "Delicious Food, Fast Delivery",
    description: "Order from the best restaurants in your area and enjoy delicious meals delivered to your doorstep.",
    orderNow: "Order Now",
    whyChoose: "Why Choose Swirly?",
    fastDelivery: "Fast Delivery",
    fastDeliveryDesc: "Get your food delivered in 30 minutes or less",
    freshIngredients: "Fresh Ingredients",
    freshIngredientsDesc: "We only use the freshest and highest quality ingredients",
    topRated: "Top Rated",
    topRatedDesc: "Trusted by thousands of customers across the city",
  },
  ur: {
    tagline: "لذيذ کھانہ، تیز رفتار ڈیلیوری",
    description: "اپنے علاقے کی بہترین ریستوران سے آرڈر کریں اور اپنے دروازے پر لذيذ کھانہ پائیں۔",
    orderNow: "اب آرڈر کریں",
    whyChoose: "سوئرلی کیوں منتخب کریں؟",
    fastDelivery: "تیز رفتار ڈیلیوری",
    fastDeliveryDesc: "30 منٹ یا اس سے کم میں اپنا کھانہ حاصل کریں",
    freshIngredients: "تازہ اجزاء",
    freshIngredientsDesc: "ہم صرف تازہ اور اعلیٰ معیار کے اجزاء استعمال کرتے ہیں",
    topRated: "سب سے زیادہ درجہ بندی",
    topRatedDesc: "شہر بھر میں ہزاروں گاہکوں سے معتبر",
  },
}
