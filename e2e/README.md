# Tests End-to-End (E2E) avec Playwright

## Installation

```bash
# Installer Playwright
npx playwright install

# Ou avec les dépendances système
npx playwright install --with-deps
```

## Structure des tests

```
e2e/
├── auth.spec.ts       # Tests d'authentification (login, signup)
├── home.spec.ts       # Tests de la page d'accueil
├── restaurants.spec.ts # Tests de la liste des restaurants
├── order-flow.spec.ts # Tests du flux de commande
├── navigation.spec.ts # Tests de navigation
└── performance.spec.ts # Tests de performance et accessibilité
```

## Exécution des tests

```bash
# Exécuter tous les tests
npx playwright test

# Exécuter en mode UI (interactif)
npx playwright test --ui

# Exécuter un fichier spécifique
npx playwright test e2e/auth.spec.ts

# Exécuter avec rapport HTML
npx playwright test --reporter=html

# Exécuter en mode debug
npx playwright test --debug

# Exécuter sur mobile uniquement
npx playwright test --project="Mobile Chrome"
```

## Flux testés

### 1. Authentification
- Affichage des pages de login (customer, restaurant, delivery)
- Validation du format de téléphone congolais
- Navigation entre login et signup

### 2. Page d'accueil
- Chargement des éléments principaux
- Navigation vers restaurants
- Affichage des catégories de nourriture

### 3. Restaurants
- Affichage de la liste
- Recherche et filtres
- Navigation vers détail restaurant

### 4. Flux de commande
- Affichage des items du menu
- Ajout au panier
- Checkout (requiert authentification)

### 5. Performance
- Temps de chargement < 5 secondes
- Lazy loading des images
- Service Worker PWA
- Mode offline

### 6. Accessibilité
- Hiérarchie des titres (h1, h2...)
- Alt text sur les images
- Navigation au clavier

## Configuration

Le fichier `playwright.config.ts` configure :
- **Navigateurs** : Chrome desktop + Mobile Chrome
- **Server** : Démarre `npm run dev` automatiquement
- **Base URL** : `http://localhost:8080`
- **Screenshots** : Capturés en cas d'échec
- **Traces** : Activées au premier retry

## Bonnes pratiques

1. **data-testid** : Les éléments clés ont des attributs `data-testid` pour les sélecteurs stables
2. **Attentes explicites** : Utiliser `waitForLoadState` et timeouts appropriés
3. **Isolation** : Chaque test est indépendant
4. **Mobile-first** : Tests sur desktop ET mobile

## Optimisations Performance

Le build Vite est optimisé pour le contexte africain :
- **Code splitting** : Chunks séparés pour vendor libs
- **Compression** : Minification agressive
- **Lazy loading** : Images avec Intersection Observer
- **PWA** : Cache Service Worker pour mode offline
