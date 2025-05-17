import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import uploadRoutes from './routes/upload.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//console.log(process.env);
// Menyajikan file statis dari build frontend (untuk produksi)
app.use(express.static(path.join(__dirname, '../public')));

// Rute API
app.use('/upload', uploadRoutes);

// Menangani semua rute lain dan menyajikan index.html (untuk SPA)
app.get('/*splat', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
