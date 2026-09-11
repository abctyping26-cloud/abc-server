# ABC Server Base

Modular Node.js / Express backend server written in TypeScript with MongoDB (Mongoose), providing a unified API layer for:
- **`abctyping`**: Commercial frontend application (defaults to `http://localhost:3000`)
- **`abc-admin`**: Administrative dashboard application (defaults to `http://localhost:3001`)

---

## 🛠️ Features

- **TypeScript & ESM**: Modern Node.js setup with ES modules, full type-checking, and strict compilation.
- **MongoDB & Mongoose**: Connection lifecycle management with event logging, retry handling, and TypeScript schemas.
- **Fast Dev Loop**: Powered by [`tsx`](https://github.com/privatenumber/tsx) for fast TypeScript execution and watch mode (`npm run dev`).
- **Security & Logging**:
  - Helmet for secure HTTP response headers.
  - CORS preconfigured for commercial and admin frontend origins.
  - Morgan for HTTP request logging.
- **Error Handling**: Global 404 handler and structured JSON error middleware.
- **Modular Routing**: Clean separation between commercial (`/api/v1/client`), admin (`/api/v1/admin`), and system health (`/health`, `/api/v1/health`).
- **Render.com Ready**: Blueprint (`render.yaml`) included for continuous deployment.

---

## 📁 Directory Structure

```text
server/
├── .env.example          # Environment variable template
├── .env                  # Local environment configuration
├── .gitignore            # Git ignore rules for node_modules/dist
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── README.md             # Server documentation
└── src/
    ├── app.ts            # Express application factory & middleware setup
    ├── index.ts          # Server entry point & graceful shutdown
    ├── config/           # Configuration & database
    │   ├── database.ts   # Mongoose connection manager
    │   └── index.ts      # Typed environment variables
    ├── controllers/      # Route handler logic
    │   ├── admin.controller.ts
    │   ├── client.controller.ts
    │   └── health.controller.ts
    ├── middlewares/      # Express middlewares
    │   ├── errorHandler.ts
    │   └── notFoundHandler.ts
    ├── models/           # Mongoose schemas & TypeScript models
    │   └── user.model.ts
    └── routes/           # Express routers
        ├── admin.routes.ts
        ├── client.routes.ts
        ├── health.routes.ts
        └── index.ts
```

---

## 🚀 Getting Started Locally

### 1. Install Dependencies

From the `server` directory:

```bash
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` if not already present:

```bash
cp .env.example .env
```

Default variables:
- `PORT`: Port the server runs on (defaults to `5000`)
- `NODE_ENV`: Runtime environment (`development` or `production`)
- `CLIENT_URL`: Origin for commercial Next.js app (`http://localhost:3000`)
- `ADMIN_URL`: Origin for admin Next.js app (`http://localhost:3001`)
- `MONGODB_URI`: MongoDB connection string (`mongodb://127.0.0.1:27017/abc_db` or Atlas URI)

### 3. Running in Development

```bash
npm run dev
```

The server will start at `http://localhost:5000` with hot-reloading on file changes.

### 4. Building & Running in Production

```bash
# Typecheck and build TypeScript to dist/
npm run build

# Start the compiled server
npm start
```

---

## ☁️ Setting Up MongoDB Atlas (Cloud Database)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and register or log in.
2. Click **Create a Deployment** and choose the **M0 Free Cluster**.
3. Under **Security Quickstart**:
   - Create a database user (e.g. `abc_admin`) and generate/save a secure password.
   - Under **Where would you like to connect from?**, choose **Network Access** and add `0.0.0.0/0` (Allow Access from Anywhere) so Render can connect to it.
4. Click **Connect** → **Drivers** (Node.js).
5. Copy the connection string. It looks like:
   ```text
   mongodb+srv://<username>:<password>@cluster0.abc.mongodb.net/abc_db?retryWrites=true&w=majority
   ```
6. Replace `<username>` and `<password>` with your database user credentials.

---

## 🚢 Deploying to Render.com

You can deploy using either **Option A (Render Blueprint - recommended)** or **Option B (Manual Web Service)**:

### Option A: Using `render.yaml` Blueprint (Recommended)

1. Push your repository to GitHub.
2. Open your [Render Dashboard](https://dashboard.render.com).
3. Click **New +** → **Blueprint**.
4. Connect your GitHub repository. Render detects the root `render.yaml` file automatically.
5. Provide the values for the environment variables:
   - `MONGODB_URI`: Paste your MongoDB Atlas connection string.
   - `CLIENT_URL`: URL of your deployed `abctyping` site (e.g., on Vercel).
   - `ADMIN_URL`: URL of your deployed `abc-admin` site.
6. Click **Apply**. Render will automatically build and deploy `abc-server`.

### Option B: Manual Web Service Setup

1. In Render Dashboard, click **New +** → **Web Service**.
2. Connect your GitHub repository.
3. Configure the settings:
   - **Name**: `abc-server`
   - **Root Directory**: `server`
   - **Environment / Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
4. Under **Environment Variables**, add:
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: Your MongoDB Atlas URI string
   - `CLIENT_URL`: Your commercial frontend URL
   - `ADMIN_URL`: Your admin frontend URL
5. Click **Create Web Service**.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Server health check (uptime, node version, timestamp) |
| `GET` | `/api/v1/health` | Health check under API prefix |
| `GET` | `/api/v1/client/ping` | Commercial client API starter endpoint |
| `GET` | `/api/v1/admin/ping` | Admin API starter endpoint |
