import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Database from "better-sqlite3";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("database.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS visits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_number TEXT UNIQUE,
    status TEXT DEFAULT 'pending',
    address TEXT,
    short_description TEXT,
    problem_description TEXT,
    actions_taken TEXT,
    observations TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    visit_id INTEGER,
    url TEXT,
    caption TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE
  );
`);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/visits", (req, res) => {
    const visits = db.prepare("SELECT * FROM visits ORDER BY created_at DESC").all();
    res.json(visits);
  });

  app.get("/api/visits/:id", (req, res) => {
    const visit = db.prepare("SELECT * FROM visits WHERE id = ?").get(req.params.id);
    if (!visit) return res.status(404).json({ error: "Visit not found" });
    
    const photos = db.prepare("SELECT * FROM photos WHERE visit_id = ?").all(req.params.id);
    res.json({ ...visit, photos });
  });

  app.post("/api/visits", (req, res) => {
    const { status, address, short_description, problem_description, actions_taken, observations } = req.body;
    const report_number = `TV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    
    const info = db.prepare(`
      INSERT INTO visits (report_number, status, address, short_description, problem_description, actions_taken, observations)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(report_number, status || 'pending', address, short_description, problem_description, actions_taken, observations);
    
    res.json({ id: info.lastInsertRowid, report_number });
  });

  app.put("/api/visits/:id", (req, res) => {
    const { status, address, short_description, problem_description, actions_taken, observations } = req.body;
    db.prepare(`
      UPDATE visits 
      SET status = ?, address = ?, short_description = ?, problem_description = ?, actions_taken = ?, observations = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, address, short_description, problem_description, actions_taken, observations, req.params.id);
    
    res.json({ success: true });
  });

  app.delete("/api/visits/:id", (req, res) => {
    db.prepare("DELETE FROM visits WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Photo Routes
  app.post("/api/visits/:id/photos", (req, res) => {
    const { url, caption } = req.body;
    const info = db.prepare(`
      INSERT INTO photos (visit_id, url, caption)
      VALUES (?, ?, ?)
    `).run(req.params.id, url, caption);
    
    res.json({ id: info.lastInsertRowid });
  });

  app.delete("/api/photos/:id", (req, res) => {
    db.prepare("DELETE FROM photos WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
