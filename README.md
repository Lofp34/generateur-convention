# Generateur de conventions SLS

WebApp Next.js pour saisir les informations d'une convention de formation, enregistrer les participants dans Neon (PostgreSQL) et generer un PDF base sur le modele fourni.

## Demarrage local

1) Installer les dependances :

```bash
npm install
```

2) Ajouter les variables d'environnement :

```bash
cp .env.example .env
```

Puis renseigner `DATABASE_URL` (Neon).

3) Generer le client Prisma et lancer les migrations :

```bash
npm run prisma:generate
npm run prisma:migrate
```

4) Demarrer le serveur :

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Deploiement Vercel + Neon

1) Pousser le repo GitHub.
2) Creer un projet Vercel sur ce repo (Root Directory par defaut).
3) Ajouter la variable `DATABASE_URL` dans Vercel (Neon).
4) La build lance automatiquement `prisma generate` et execute `prisma migrate deploy` si `DATABASE_URL` est definie.

## Fichiers PDF

- Template PDF : `templates/convention.pdf`
- Signature : `templates/signature.png`

Ces fichiers sont integres au build Vercel pour la generation PDF serverless.
