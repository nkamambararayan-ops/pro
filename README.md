# 📸 PhotoRetouch Pro

Plateforme e-commerce statique, moderne et responsive, dédiée à la vente de services de retouche photo professionnelle en ligne. Design "Luxury Studio" (noir / or / blanc), pensée mobile-first.

🔥 **Base de données : Firebase** (Firestore + Storage + Authentication) — voir section [🔥 Configuration Firebase](#-configuration-firebase) ci-dessous.

## 🎯 Objectif du projet

Permettre aux clients de :
- Découvrir les services de retouche photo proposés
- Uploader leur photo directement depuis le navigateur
- Choisir un type de retouche et un délai de livraison
- Voir le prix se recalculer automatiquement selon le délai choisi
- Valider leur commande et recevoir les instructions de paiement (Orange Money / MTN Mobile Money)

Et à l'administrateur (**nkamambararayan@gmail.com**) de :
- Consulter toutes les commandes reçues dans un tableau de bord
- Changer le statut de chaque commande (En attente / En cours / Terminée)
- Télécharger la photo envoyée par le client
- Uploader et télécharger la photo retouchée
- Modifier dynamiquement la grille tarifaire par délai

---

## ✅ Fonctionnalités actuellement implémentées

### Site public
- **Page d'accueil (`index.html`)** : hero premium avec image de studio, services populaires mis en avant, **nouvelle section "Effets tendance & réseaux sociaux"** (LEGO, statue dorée, avatar 3D, néon...), section "Avant / Après" avec slider interactif (glisser pour comparer), section "Pourquoi nous choisir", étapes du processus, témoignages, CTA.
- **Catalogue de services (`services.html`)** : les 8 services classiques demandés + **10 nouveaux effets tendance** inspirés des réalisations fournies (LEGO, statue dorée, avatar 3D cartoon, néon, fisheye 360°, photobooth, poster éditorial mode, maillot sportif, mini-planète 360°, poster reveal dramatique). Chaque service affiche nom, description, image, sélecteur de délai en temps réel et lien direct vers la commande pré-remplie. Filtres par catégorie (Tous / Populaires / Classiques / Tendance) + tableau de la grille tarifaire complète.
- **Page de commande (`order.html`)** :
  - Formulaire client (nom, téléphone, email)
  - Sélection du service
  - Sélection du délai via **boutons radio** avec **mise à jour du prix en temps réel**
  - Zone d'upload de photo (drag & drop + sélection fichier), avec aperçu
  - Récapitulatif dynamique (service, délai, prix total)
  - Validation de commande → **photo uploadée sur Firebase Storage** + commande enregistrée dans **Firestore** (collection `orders`)
  - Modal de confirmation avec référence de commande et redirection vers le paiement
- **Page paiement (`payment.html`)** : instructions détaillées Orange Money et MTN Mobile Money, rappel du montant à régler, consignes de confirmation.
- **Panneau Administration (`admin-login.html` + `admin.html`)** :
  - Connexion protégée par **Firebase Authentication** (email/mot de passe réel, plus sécurisé qu'un simple mot de passe codé en dur)
  - Tableau de bord avec statistiques (total, en attente, en cours, terminées, revenu estimé)
  - Table complète des commandes avec recherche et filtre par statut
  - Vue détaillée d'une commande (infos client, photo originale, upload de la photo retouchée, changement de statut)
  - Téléchargement des photos clients et des photos retouchées (hébergées sur Firebase Storage)
  - Gestion des tarifs par délai (grille modifiable, stockée dans Firestore, appliquée instantanément sur tout le site)
  - Suppression de commandes

### 🔥 Nouveaux effets tendance (basés sur vos réalisations)
Une catégorie dédiée a été ajoutée avec 10 services inspirés des exemples fournis par la designer :
| Service | Description |
|---|---|
| Effet figurine LEGO | Transformation en minifigure LEGO personnalisée |
| Effet statue dorée | Portrait sculpté façon statue dorée/bronze |
| Effet fisheye 360° | Rendu grand-angle immersif pour selfies/groupes |
| Avatar 3D cartoon | Style Pixar / dessin animé 3D |
| Effet néon Light Control | Ambiance néon colorée et maîtrise de la lumière |
| Bande photobooth | Bande photo façon photomaton vintage |
| Poster mode éditorial | Mise en page façon magazine street style |
| Poster maillot sportif | Maillot personnalisé avec nom/numéro |
| Effet mini-planète 360° | Rendu panoramique "little planet" |
| Poster reveal dramatique | Affiche façon "character reveal" de film, fond rouge |

Ces services sont accessibles depuis `services.html` (filtre "Effets tendance 🔥"), la page d'accueil (section dédiée), et le menu déroulant de commande (`order.html`, groupe "🔥 Effets tendance").

### Système de tarification dynamique (implémenté comme demandé)
| Délai | Prix par défaut |
|---|---|
| 7 jours | 1 500 FCFA |
| 5 jours | 2 000 FCFA |
| 3 jours | 2 500 FCFA |
| 48 heures | 3 000 FCFA |
| 24 heures | 3 500 FCFA |
| 12 heures | 4 000 FCFA |

Ces tarifs sont stockés dans **Firestore** (document `settings/delay_pricing`) et modifiables depuis l'admin (section "Délais & Tarifs"). Ils sont chargés dynamiquement sur `index.html`, `services.html` et `order.html`.

---

## 🔥 Configuration Firebase

Ce site utilise **Firebase** comme base de données et système d'authentification (à la place de l'API Table générique). Voici la configuration actuellement en place dans `js/firebase-config.js` :

```js
const firebaseConfig = {
  apiKey: "AIzaSyA3DNdHOAsPj1Lw0eOZf1b-axdMDREXo0A",
  authDomain: "agrimaster-1c248.firebaseapp.com",
  projectId: "agrimaster-1c248",
  storageBucket: "agrimaster-1c248.firebasestorage.app",
  messagingSenderId: "741664844765",
  appId: "1:741664844765:web:e172d74fc333f9a600e434",
  measurementId: "G-D48HJNSX7J"
};
```

### Services Firebase utilisés
| Service | Usage sur le site |
|---|---|
| **Firestore** | Stockage des commandes (`orders`) et de la grille tarifaire (`settings/delay_pricing`) |
| **Firebase Storage** | Hébergement des photos clients et des photos retouchées (bucket `agrimaster-1c248.firebasestorage.app`) |
| **Firebase Authentication** | Connexion sécurisée de l'administrateur (email + mot de passe réel, plus fiable qu'un mot de passe codé en dur côté client) |
| **Analytics** *(optionnel)* | Statistiques de fréquentation du site (chargé de façon non bloquante) |

### ⚙️ Étapes à réaliser une seule fois dans la Console Firebase
Ce site se connecte au projet Firebase **`agrimaster-1c248`**. Avant utilisation en production, l'administrateur doit effectuer ces réglages depuis [console.firebase.google.com](https://console.firebase.google.com/) :

1. **Activer Firestore Database**
   - Firestore Database → Créer une base de données → mode production.
2. **Activer Firebase Storage**
   - Storage → Commencer → conserver le bucket par défaut (`agrimaster-1c248.firebasestorage.app`).
3. **Activer l'authentification par email/mot de passe**
   - Authentication → Sign-in method → activer le fournisseur **Email/Mot de passe**.
4. **Créer le compte administrateur**
   - Authentication → Users → "Add user" → email `nkamambararayan@gmail.com` + choisir un mot de passe fort.
   - C'est ce compte (et uniquement celui-ci, vérifié via `ADMIN_EMAIL` dans `js/data.js`) qui pourra se connecter sur `admin-login.html`.
5. **Configurer les règles de sécurité Firestore** (Firestore → Règles) :
   ```js
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Les commandes : tout le monde peut en créer (formulaire client),
       // mais seul l'admin authentifié peut lire/modifier/supprimer.
       match /orders/{orderId} {
         allow create: if true;
         allow read, update, delete: if request.auth != null
           && request.auth.token.email == "nkamambararayan@gmail.com";
       }
       // Tarifs : lecture publique (affichage des prix), écriture admin uniquement.
       match /settings/{settingId} {
         allow read: if true;
         allow write: if request.auth != null
           && request.auth.token.email == "nkamambararayan@gmail.com";
       }
     }
   }
   ```
6. **Configurer les règles de sécurité Storage** (Storage → Règles) :
   ```js
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /orders/{orderId}/{fileName} {
         allow write: if true;   // upload initial de la photo client (formulaire public)
         allow read: if true;    // permet l'affichage des miniatures/téléchargements
       }
     }
   }
   ```
   ⚠️ Ces règles restent permissives pour rester compatibles avec un site 100% statique (aucun backend). Pour un contrôle plus strict, envisager d'ajouter un jeton de sécurité (App Check) ou de limiter l'écriture aux formats image uniquement.

### 📦 Fichiers liés à Firebase
| Fichier | Rôle |
|---|---|
| `js/firebase-config.js` | Initialise Firebase (app, Firestore, Storage, Auth, Analytics) — module ES partagé par tout le site |
| `js/data.js` | Catalogue des services + lecture/écriture de la grille tarifaire dans Firestore (`settings/delay_pricing`) |
| `js/orders-service.js` | Toutes les opérations sur les commandes : création, upload photo (Storage), lecture, mise à jour de statut, suppression |
| `js/admin.js` | Panneau admin : garde d'authentification Firebase Auth, tableau de bord, gestion des commandes et des tarifs |
| `admin-login.html` | Connexion via `signInWithEmailAndPassword` (Firebase Auth) |

---

## 🗺️ Entrées / pages du site

| Page | Chemin | Paramètres |
|---|---|---|
| Accueil | `index.html` | — |
| Catalogue de services | `services.html` | `#service_id` (ancre optionnelle) |
| Commande | `order.html` | `?service=<id>&delay=<id>` (pré-remplissage optionnel) |
| Paiement | `payment.html` | `?order=<id>&amount=<prix>` (affiché après une commande) |
| Connexion admin | `admin-login.html` | — |
| Panneau admin | `admin.html` | — (protégé par Firebase Authentication) |

**Identifiants admin** :
- Email : `nkamambararayan@gmail.com`
- Mot de passe : défini directement dans **Firebase Authentication** (Console Firebase → Authentication → Users). Aucun mot de passe n'est plus stocké en clair dans le code source.

✅ L'authentification est désormais gérée par **Firebase Authentication** (véritable service d'authentification, avec sessions sécurisées, hashing des mots de passe côté serveur Google, et protection anti brute-force). Seul le compte dont l'email correspond à `nkamambararayan@gmail.com` (variable `ADMIN_EMAIL` dans `js/data.js`) est autorisé à accéder au panneau `admin.html`.

---

## 🗄️ Données & stockage (Firebase)

Le site utilise **Firebase** comme backend de données (pas de serveur personnalisé) :
- **Firestore** pour les données structurées (commandes, tarifs)
- **Firebase Storage** pour les fichiers binaires (photos client / photos retouchées)
- **Firebase Authentication** pour l'accès admin

### Collection Firestore `orders`
| Champ | Type | Description |
|---|---|---|
| client_name | string | Nom du client |
| phone | string | Téléphone |
| email | string | Email |
| service_id / service_name | string | Service commandé |
| delay_label / delay_hours | string / number | Délai choisi |
| price / currency | number / string | Prix calculé automatiquement |
| photo_url | string | URL Firebase Storage de la photo client |
| photo_name | string | Nom original du fichier |
| retouched_photo_url | string | URL Firebase Storage de la photo retouchée (ajoutée par l'admin) |
| status | string | En attente / En cours / Terminée |
| payment_method | string | Orange Money / MTN Mobile Money / Non renseigné |
| notes | string | Instructions particulières du client |
| created_at / updated_at | timestamp | Gérés automatiquement par Firestore (`serverTimestamp()`) |

### Document Firestore `settings/delay_pricing`
| Champ | Type | Description |
|---|---|---|
| delays | array | Grille tarifaire complète `[{id, label, hours, price}, ...]` |
| updated_at | timestamp | Date de dernière modification |

### Firebase Storage — arborescence des fichiers
```
orders/
  {orderId}/
    client_{nom-du-fichier}.jpg      → photo envoyée par le client
    retouched_{nom-du-fichier}.jpg   → photo finalisée uploadée par l'admin
```

---

## 🎨 Design

- Palette **noir / or / blanc** (feel "studio photo de luxe")
- Typographies : **Playfair Display** (titres) + **Inter** (corps de texte)
- Composants : cartes services, sliders avant/après, animations au scroll (reveal), boutons dorés avec effets hover, panneau admin type dashboard SaaS
- 100% responsive : mobile-first, testé sur mobile / tablette / desktop
- Icônes : Font Awesome 6

---

## 🚧 Fonctionnalités non implémentées (limites du site statique)

Ce site étant **100% statique** (HTML/CSS/JS + Firebase), les éléments suivants nécessiteraient un backend applicatif (Cloud Functions ou serveur) et ne sont donc **pas inclus** :
- Envoi automatique d'emails/SMS de notification à l'administrateur ou au client (réalisable via une Cloud Function Firebase déclenchée à la création d'une commande, non incluse ici)
- Vérification automatique des paiements Orange Money / MTN Mobile Money (nécessite une intégration API bancaire tierce)
- Nettoyage automatique des fichiers Storage lors de la suppression d'une commande (à implémenter via Cloud Function `onDelete`)
- Compression/optimisation serveur des images uploadées (le traitement reste basé sur le navigateur, taille max recommandée : 10 Mo)
- Retouche photo automatisée par IA (le service reste un travail manuel effectué par l'équipe, la commande sert à collecter la demande)

## 🔭 Recommandations pour la suite

1. **Notifications** : ajouter une Cloud Function Firebase (`onCreate` sur `orders`) qui envoie un email à `nkamambararayan@gmail.com` via une extension Firebase ("Trigger Email") à chaque nouvelle commande.
2. **Sécurité renforcée** : activer **Firebase App Check** pour protéger Firestore/Storage contre les abus de bots, et durcir les règles de sécurité (voir section Configuration Firebase).
3. **Historique client** : ajouter une page "Suivi de commande" où le client peut entrer son email/téléphone pour retrouver ses commandes stockées dans Firestore.
4. **Multi-langue** : ajouter une bascule FR/EN si la clientèle s'internationalise.
5. **Galerie avant/après enrichie** : permettre à l'admin d'ajouter de nouveaux exemples avant/après directement depuis le panneau admin (upload vers Storage + document Firestore dédié).

---

## 📁 Structure du projet

```
index.html              → Page d'accueil
services.html           → Catalogue des services
order.html              → Formulaire de commande
payment.html            → Instructions de paiement
admin-login.html        → Connexion admin
admin.html              → Panneau d'administration
css/
  └── style.css         → Feuille de style principale (thème luxury)
js/
  ├── firebase-config.js  → Initialisation Firebase (app, Firestore, Storage, Auth, Analytics)
  ├── data.js             → Catalogue des services + tarification dynamique (Firestore)
  ├── orders-service.js   → CRUD des commandes + upload photos (Firestore + Storage)
  ├── main.js             → Comportements communs (nav, sliders, animations)
  └── admin.js            → Logique complète du panneau admin (Firebase Auth + Firestore + Storage)
images/                 → Visuels (hero, services, avant/après, textures)
```

ℹ️ Les fichiers `js/data.js`, `js/orders-service.js`, `js/firebase-config.js` et `js/admin.js` sont des **modules ES** (`import`/`export`) et doivent être chargés avec `<script type="module">`. C'est déjà configuré sur toutes les pages du site.

## 📩 Contact

Toutes les commandes et l'accès administrateur sont liés à :
**nkamambararayan@gmail.com**

---

## 🚀 Déploiement

Pour publier ce site en ligne, rendez-vous dans l'onglet **Publish** de la plateforme. Il gérera automatiquement le déploiement et vous fournira l'URL publique de votre site.
