// Quartiers officiels du Congo (Brazzaville et Pointe-Noire)
export const congoDistricts = {
  brazzaville: [
    "Makélékélé",
    "Bacongo",
    "Poto-Poto",
    "Moungali",
    "Ouenzé",
    "Talangaï",
    "Mfilou",
    "Madibou",
    "Djiri",
  ],
  pointeNoire: [
    "Lumumba",
    "Tié-Tié",
    "Mongo-Mpoukou",
    "Ngoyo",
    "Mvoumvou",
    "Loandjili",
    "Vindoulou",
    "Tchinouka",
    "Tchimbamba",
    "Mvou-Mvou",
  ],
};

export const allDistricts = [
  ...congoDistricts.brazzaville.map((d) => ({ city: "Brazzaville", district: d })),
  ...congoDistricts.pointeNoire.map((d) => ({ city: "Pointe-Noire", district: d })),
];
