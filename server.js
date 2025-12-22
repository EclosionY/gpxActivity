
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

const GPX_DIR = path.resolve(process.cwd(), 'gpx');
const ACTIVITY_DIR = path.resolve(process.cwd(), 'activities');

[GPX_DIR, ACTIVITY_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

app.use(express.json({ limit: '50mb' }));

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    next();
});

let trackSummaries = [];
let activityList = [];

const refreshCache = () => {
    try {
        const trackFiles = fs.readdirSync(GPX_DIR);
        trackSummaries = trackFiles
            .filter(file => file.endsWith('.json'))
            .map(file => {
                try {
                    const content = fs.readFileSync(path.join(GPX_DIR, file), 'utf-8');
                    const { points, ...summary } = JSON.parse(content);
                    return summary;
                } catch (e) { return null; }
            })
            .filter(Boolean)
            .sort((a, b) => new Date(b.startTime || 0).getTime() - new Date(a.startTime || 0).getTime());

        const activityFiles = fs.readdirSync(ACTIVITY_DIR);
        activityList = activityFiles
            .filter(file => file.endsWith('.json'))
            .map(file => {
                try {
                    const content = fs.readFileSync(path.join(ACTIVITY_DIR, file), 'utf-8');
                    return JSON.parse(content);
                } catch (e) { return null; }
            })
            .filter(Boolean)
            .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

        console.log(`[Cache] 更新完成。轨迹: ${trackSummaries.length}, 活动: ${activityList.length}`);
    } catch (err) { console.error(err); }
};

refreshCache();

// Track APIs
app.get('/api/tracks', (req, res) => res.json(trackSummaries));
app.get('/api/tracks/:id', (req, res) => {
    const filePath = path.join(GPX_DIR, `${req.params.id}.json`);
    if (fs.existsSync(filePath)) res.json(JSON.parse(fs.readFileSync(filePath, 'utf-8')));
    else res.status(404).json({ error: 'Not found' });
});
app.post('/api/tracks', (req, res) => {
    const track = req.body;
    fs.writeFileSync(path.join(GPX_DIR, `${track.id}.json`), JSON.stringify(track, null, 2));
    refreshCache();
    res.status(201).json({ success: true });
});
app.delete('/api/tracks/:id', (req, res) => {
    const filePath = path.join(GPX_DIR, `${req.params.id}.json`);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        refreshCache();
        res.json({ success: true });
    } else res.status(404).json({ error: 'Not found' });
});

// Activity APIs
app.get('/api/activities', (req, res) => res.json(activityList));
app.get('/api/activities/:id', (req, res) => {
    const filePath = path.join(ACTIVITY_DIR, `${req.params.id}.json`);
    if (fs.existsSync(filePath)) res.json(JSON.parse(fs.readFileSync(filePath, 'utf-8')));
    else res.status(404).json({ error: 'Not found' });
});
app.post('/api/activities', (req, res) => {
    const act = req.body;
    fs.writeFileSync(path.join(ACTIVITY_DIR, `${act.id}.json`), JSON.stringify(act, null, 2));
    refreshCache();
    res.status(201).json({ success: true });
});
app.delete('/api/activities/:id', (req, res) => {
    const filePath = path.join(ACTIVITY_DIR, `${req.params.id}.json`);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        refreshCache();
        res.json({ success: true });
    } else res.status(404).json({ error: 'Not found' });
});

const distPath = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(distPath)) app.use(express.static(distPath));

app.get('*', (req, res) => {
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) res.sendFile(indexPath);
    else res.status(404).send('Please build frontend first.');
});

app.listen(PORT, () => console.log(`🚀 Server: http://localhost:${PORT}`));
