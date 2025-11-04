export interface District {
  name: string;
  city: "Brazzaville" | "Pointe-Noire";
}

export const congoDistricts: District[] = [
  // Brazzaville districts (9 arrondissements)
  { name: "Makélékélé", city: "Brazzaville" },
  { name: "Bacongo", city: "Brazzaville" },
  { name: "Poto-Poto", city: "Brazzaville" },
  { name: "Moungali", city: "Brazzaville" },
  { name: "Ouenzé", city: "Brazzaville" },
  { name: "Talangaï", city: "Brazzaville" },
  { name: "Mfilou", city: "Brazzaville" },
  { name: "Madibou", city: "Brazzaville" },
  { name: "Djiri", city: "Brazzaville" },
  
  // Brazzaville popular areas
  { name: "Centre-ville", city: "Brazzaville" },
  { name: "Plateau des 15 ans", city: "Brazzaville" },
  { name: "La Glacière", city: "Brazzaville" },
  { name: "Base Aérienne", city: "Brazzaville" },
  { name: "Mpila", city: "Brazzaville" },
  { name: "Nkombo", city: "Brazzaville" },
  { name: "Vindoulou", city: "Brazzaville" },
  
  // Pointe-Noire districts (7 arrondissements)
  { name: "Lumumba", city: "Pointe-Noire" },
  { name: "Mvou-Mvou", city: "Pointe-Noire" },
  { name: "Tié-Tié", city: "Pointe-Noire" },
  { name: "Ngoyo", city: "Pointe-Noire" },
  { name: "Mongo-Mpoukou", city: "Pointe-Noire" },
  { name: "Mvoumvou", city: "Pointe-Noire" },
  { name: "Loandjili", city: "Pointe-Noire" },
  
  // Pointe-Noire popular areas
  { name: "Centre-ville", city: "Pointe-Noire" },
  { name: "La Base", city: "Pointe-Noire" },
  { name: "Océan", city: "Pointe-Noire" },
  { name: "Côte Sauvage", city: "Pointe-Noire" },
  { name: "Fouta", city: "Pointe-Noire" },
  { name: "Camp militaire", city: "Pointe-Noire" },
  { name: "Mpaka", city: "Pointe-Noire" },
];

export const cities = ["Brazzaville", "Pointe-Noire"] as const;

export const getDistrictsByCity = (city: "Brazzaville" | "Pointe-Noire") => {
  return congoDistricts.filter(d => d.city === city);
};
