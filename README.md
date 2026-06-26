# WifiShare 📡

Application web (React + Vite + Supabase) permettant de partager et trouver du Wifi pres de soi, en RDC et ailleurs.

**Lien de l'application :** https://wifishare-nine.vercel.app

**Concepteur :** MBvictor
**Contact :** kivuculturehub@gmail.com — +243972212629

---

## 🎯 Concept

Une personne qui a besoin d'internet voit sur une carte les hotes Wifi disponibles autour d'elle. Elle choisit un hote, indique une duree (5min / 1h / 1 jour), envoie une demande. L'hote accepte, le client paie (cash ou mobile money), puis l'hote partage le vrai mot de passe Wifi.

---

## ✅ Fonctionnalites

### Authentification
- Inscription / connexion par email + mot de passe (Supabase Auth)
- Confirmation par email a l'inscription
- Mot de passe oublie (lien de reinitialisation)
- Mode demo : connexion anonyme sans creer de compte
- Page d'intro "Comment ca fonctionne" avant la connexion

### Annonces (cote hote)
- Creer une annonce : nom du Wifi, type (routeur/hotspot), tarifs (heure/jour/5min/10min), description, horaires
- Position GPS detectee automatiquement (pas de saisie manuelle)
- Modifier ou supprimer son annonce
- Activer / desactiver la visibilite (en ligne / hors ligne)
- Mot de passe Wifi reel renseigne par l'hote (jamais visible avant paiement confirme)

### Recherche (cote client)
- Carte interactive (Leaflet + OpenStreetMap)
- Curseur de rayon de recherche reglable (1 a 50 km)
- Vue Liste ou vue Carte
- Filtre par type (routeur / hotspot)
- Note moyenne (etoiles) et badge "Verifie" (3+ avis) affiches sur chaque annonce
- Sa propre annonce est automatiquement exclue de sa propre liste client

### Reservations et paiement
- Le client envoie une demande de reservation
- L'hote accepte ou refuse
- Statuts : en attente -> acceptee -> payee
- Paiement en cash ou mobile money, confirme manuellement par l'hote ("Paiement recu")
- Le mot de passe Wifi reel n'est revele au client qu'apres confirmation du paiement
- Le client peut annuler une demande (en attente ou meme apres acceptation)
- L'hote peut annuler une reservation depuis "Conversations actives"

### Chat
- Chat en temps reel (Supabase Realtime) entre client et hote, lie a chaque reservation
- Vue "Conversations actives" cote hote, listant toutes les reservations acceptees/payees
- L'hote peut effacer une conversation
- Numeros de telephone affiches entre client et hote une fois la reservation acceptee

### Notifications
- Notification en temps reel (son + banniere) pour toute nouvelle demande ou nouveau message
- Notification navigateur native (meme app en arriere-plan), si autorisee
- Banniere cliquable qui ouvre directement la conversation concernee

### Avis et confiance
- Le client peut laisser un avis (etoiles + commentaire) apres usage
- Note moyenne et badge "Verifie" visibles dans la liste/carte
- Systeme de signalement : le client peut signaler un hote, l'hote peut signaler un client

### Partage
- Bouton "Partager sur WhatsApp" pour qu'un hote diffuse son annonce a ses contacts

### Robustesse et accessibilite
- Detection de la perte de connexion internet (banniere d'alerte)
- PWA (Progressive Web App) : installable sur l'ecran d'accueil, icone personnalisee
- Cache offline des fichiers de l'app (chargement plus rapide, moins de donnees consommees apres la premiere visite)
- HTTPS (necessaire pour la geolocalisation)

---

## 🛠️ Stack technique

- **Frontend :** React + Vite
- **Carte :** Leaflet + OpenStreetMap (react-leaflet)
- **Backend / Base de donnees :** Supabase (PostgreSQL, Auth, Realtime, Row Level Security)
- **Hebergement :** Vercel
- **Icones :** lucide-react
- **PWA :** vite-plugin-pwa

### Tables principales (Supabase)
- `profiles` — informations utilisateur (nom, telephone)
- `listings` — annonces Wifi (tarifs, position, nom et mot de passe Wifi)
- `reservations` — demandes de reservation et leur statut
- `messages` — chat entre client et hote
- `reviews` — avis et notes
- `reports` — signalements d'abus

---

## ⚠️ Limites connues

- **Mot de passe Wifi** : l'hote doit configurer manuellement le meme mot de passe sur son propre hotspot telephone. L'application ne peut pas modifier automatiquement les reglages systeme du telephone (limite technique des applications web).
- **Plusieurs clients simultanes** : si l'hote accepte plusieurs clients en meme temps, ils partagent le meme mot de passe Wifi. Rien n'empeche techniquement qu'un client le partage a d'autres personnes non payantes — c'est une limite de confiance, pas un bug.
- **Paiement Mobile Money** : non integre directement dans l'app (necessite un compte marchand chez un agregateur, demarche administrative a faire separement). Le paiement se fait actuellement en cash ou via transfert Mobile Money classique, confirme manuellement.
- **Fonctionnement hors-ligne** : l'application necessite une connexion internet pour fonctionner pleinement (recherche d'hotes, paiement, chat). Une fois l'app installee et chargee une premiere fois, l'interface se charge plus vite et consomme moins de donnees, mais les donnees en temps reel necessitent toujours une connexion.

---

## 📬 Feedback

Un lien "Envoyer un commentaire ou une suggestion au concepteur" est disponible en bas de l'application, ou directement par email : kivuculturehub@gmail.com

## 🔗 Liens Kivu Culture Hub

- https://kivu-culture-hub-78805.web.app
- https://kivujobia.web.app/