# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## Mobile app and offline support

The public website can be installed from a supported mobile browser using **نزّل تطبيق الوجيه**. On iPhone, use Safari's **Share → Add to Home Screen**. The installed version opens in its own app window.

After the first online visit, the service worker caches the app shell and loaded static files; the public team and showcase product lists are also kept on the device. Booking submissions, account sign-in, and admin changes still require an internet connection.

Before deploying, apply the Supabase migration `20261120150000_add_public_showcase_products.sql`. Admins can then manage the public catalog from **Settings → Public Showcase Products**; the existing team editor remains under **Team Management**.

### Installed app update notifications

Installed users can receive push notifications for commits pushed to `main`, including while the app is closed. Push delivery requires notification permission, a deployed service worker, and the one-time setup below:

1. Generate a VAPID key pair with `npx web-push generate-vapid-keys`.
2. Apply `supabase/migrations/20261123223000_add_app_update_push_subscriptions.sql` to the Supabase project.
3. Generate a random deploy token locally (for example, `openssl rand -hex 32`). Set the Supabase Edge Function secrets `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (for example, `mailto:admin@example.com`), and `PUSH_DEPLOY_TOKEN`. Deploy `notify-app-update` with `supabase functions deploy notify-app-update --project-ref koqcjwhawmftoavlobiy`.
4. Add `VITE_VAPID_PUBLIC_KEY` to the production app's build environment and redeploy the app.
5. Add GitHub Actions repository secrets `SUPABASE_PROJECT_URL` (the Supabase project URL), `SUPABASE_ANON_KEY` (the project's public anon/publishable key), and `PUSH_DEPLOY_TOKEN` (the same token configured in Supabase).

The private VAPID key and deploy token must only be stored as server/GitHub secrets, never in the app build or source code. Users must allow notifications in the installed app to subscribe.
