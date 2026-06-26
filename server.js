const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = 3000;

// ================================================================
//  MIDDLEWARE
// ================================================================
app.use(cors());
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true, limit: '500mb' }));

// ================================================================
//  CONFIGURAÇÃO DE UPLOAD (MULTER)
// ================================================================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const cleanName = file.originalname.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '');
        cb(null, Date.now() + '-' + cleanName);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 500 * 1024 * 1024 } // 500MB
});

// ================================================================
//  SERVIÇÃO DE FICHEIROS ESTÁTICOS
// ================================================================
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// ================================================================
//  BASE DE DADOS
// ================================================================
const DATA_FILE = path.join(__dirname, 'movies.json');
const USERS_FILE = path.join(__dirname, 'users.json');

function readMovies() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            const defaultMovies = [
                { id: 'd1', title: 'Winter is Coming', poster: 'https://picsum.photos/seed/got1/200/300', video: 'https://www.w3schools.com/html/mov_bbb.mp4', subtitle: '', blobId: null, subtitleBlobId: null, genre: 'Seriado', country: 'EUA', premiumOnly: true, series: 'Game of Thrones', season: 1, episode: 1, group: '', synopsis: 'O episódio piloto da série mais famosa da HBO.' },
                { id: 'd2', title: 'The Kingsroad', poster: 'https://picsum.photos/seed/got2/200/300', video: 'https://www.w3schools.com/html/mov_bbb.mp4', subtitle: '', blobId: null, subtitleBlobId: null, genre: 'Seriado', country: 'EUA', premiumOnly: true, series: 'Game of Thrones', season: 1, episode: 2, group: '', synopsis: 'A família Stark viaja para Kings Landing.' },
                { id: 'd3', title: 'Lord Snow', poster: 'https://picsum.photos/seed/got3/200/300', video: 'https://www.w3schools.com/html/mov_bbb.mp4', subtitle: '', blobId: null, subtitleBlobId: null, genre: 'Seriado', country: 'EUA', premiumOnly: true, series: 'Game of Thrones', season: 1, episode: 3, group: '', synopsis: 'Jon Snow chega à Muralha.' },
                { id: 'd4', title: 'Maputo Connection', poster: 'https://picsum.photos/seed/moz1/200/300', video: 'https://www.w3schools.com/html/mov_bbb.mp4', subtitle: '', blobId: null, subtitleBlobId: null, genre: 'Ação', country: 'Moçambique', premiumOnly: false, series: '', season: 0, episode: 0, group: '', synopsis: 'Ação e aventura nas ruas de Maputo.' }
            ];
            fs.writeFileSync(DATA_FILE, JSON.stringify(defaultMovies, null, 2));
            return defaultMovies;
        }
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (error) {
        console.error('Erro ao ler filmes:', error);
        return [];
    }
}

function writeMovies(movies) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(movies, null, 2));
}

function readUsers() {
    try {
        if (!fs.existsSync(USERS_FILE)) {
            const defaultUsers = [
                { id: 'admin1', name: 'Administrador', email: 'admin@mozfilmes.com', password: 'Admin123!', phone: '870544332', isAdmin: true, plan: null, planExpiry: null },
                { id: 'user1', name: 'Joaquim Duarte', email: 'joaquim@mozfilmes.com', password: '123456', phone: '841234567', isAdmin: false, plan: null, planExpiry: null }
            ];
            fs.writeFileSync(USERS_FILE, JSON.stringify(defaultUsers, null, 2));
            return defaultUsers;
        }
        return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    } catch (error) {
        console.error('Erro ao ler utilizadores:', error);
        return [];
    }
}

function writeUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// ================================================================
//  ROTAS DA API
// ================================================================

// Upload de vídeo
app.post('/api/upload-video', upload.single('video'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Nenhum ficheiro enviado' });
        }
        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        console.log('✅ Vídeo carregado:', fileUrl);
        res.json({ success: true, url: fileUrl, filename: req.file.filename });
    } catch (error) {
        console.error('Erro no upload de vídeo:', error);
        res.status(500).json({ error: 'Erro ao fazer upload: ' + error.message });
    }
});

// Upload de capa
app.post('/api/upload-poster', upload.single('poster'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Nenhum ficheiro enviado' });
        }
        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        console.log('✅ Capa carregada:', fileUrl);
        res.json({ success: true, url: fileUrl, filename: req.file.filename });
    } catch (error) {
        console.error('Erro no upload de capa:', error);
        res.status(500).json({ error: 'Erro ao fazer upload: ' + error.message });
    }
});

// Listar filmes
app.get('/api/movies', (req, res) => {
    const movies = readMovies();
    res.json(movies);
});

// Adicionar filme
app.post('/api/movies', (req, res) => {
    const movies = readMovies();
    const newMovie = req.body;
    if (movies.find(m => m.id === newMovie.id)) {
        return res.status(400).json({ error: 'Filme já existe' });
    }
    movies.push(newMovie);
    writeMovies(movies);
    console.log('✅ Filme adicionado:', newMovie.title);
    res.json(newMovie);
});

// Eliminar filme
app.delete('/api/movies/:id', (req, res) => {
    const id = req.params.id;
    let movies = readMovies();
    const movieToDelete = movies.find(m => m.id === id);
    if (!movieToDelete) {
        return res.status(404).json({ error: 'Filme não encontrado' });
    }
    if (id.startsWith('d')) {
        return res.status(400).json({ error: 'Não é possível eliminar filmes padrão' });
    }
    movies = movies.filter(m => m.id !== id);
    writeMovies(movies);
    console.log('🗑️ Filme eliminado:', id);
    res.json({ success: true, id });
});

// Atualizar filme
app.put('/api/movies/:id', (req, res) => {
    const id = req.params.id;
    let movies = readMovies();
    const index = movies.findIndex(m => m.id === id);
    if (index === -1) {
        return res.status(404).json({ error: 'Filme não encontrado' });
    }
    movies[index] = { ...movies[index], ...req.body };
    writeMovies(movies);
    console.log('📝 Filme atualizado:', movies[index].title);
    res.json(movies[index]);
});

// Estatísticas do servidor
app.get('/api/stats', (req, res) => {
    const movies = readMovies();
    const users = readUsers();
    res.json({
        totalMovies: movies.length,
        totalUsers: users.length,
        totalPremium: movies.filter(m => m.premiumOnly).length,
        totalFree: movies.filter(m => !m.premiumOnly).length,
        serverTime: new Date().toISOString()
    });
});

// Listar utilizadores
app.get('/api/users', (req, res) => {
    const users = readUsers();
    res.json(users);
});

// ================================================================
//  INICIAR SERVIDOR
// ================================================================
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Servidor MOZFilmes rodando em:`);
    console.log(`   Local: http://localhost:${PORT}`);
    console.log(`   📱 Acesse: http://127.0.0.1:${PORT}`);
    console.log(`📁 Dados: ${DATA_FILE}`);
    console.log(`📁 Uploads: ${path.join(__dirname, 'uploads')}`);
    console.log(`👥 Utilizadores: ${USERS_FILE}\n`);
});
