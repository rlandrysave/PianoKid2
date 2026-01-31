// script.js - Piano complet avec notes passant sous la ligne

const noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const noteNamesFR = { 'C': 'DO', 'D': 'RÉ', 'E': 'MI', 'F': 'FA', 'G': 'SOL', 'A': 'LA', 'B': 'SI' };
const noteColors = { 'C': '#FF0000', 'D': '#FF7F00', 'E': '#FFFF00', 'F': '#00FF00', 'G': '#0000FF', 'A': '#4B0082', 'B': '#8B00FF' };

let gameLoopTimeout;
let currentSpeed = 4;
window.isPro = true

let selectedRole = 'enfant';
let selectedEmoji = '🎹';
let audioContext, notesOnScreen = [], isPaused = false, currentMode = 'step';
let totalNotesInLevel = 0, notesValidated = 0;
let profiles = JSON.parse(localStorage.getItem('pk_profiles')) || [{name: "Apprenti", color: "#00f2ff", avatar: "🎹", role: "enfant", completed: []}];
let currentProfileName = localStorage.getItem('pk_current') || "Apprenti";
let currentLevelTitle = "", isMicActive = false;
let audioAnalyser, microphoneStream, pitchBuffer = new Float32Array(2048);
let colorMode = 'debutant';

// Variables pour partitions
let partitionTranslator = null;
let currentImportDifficulty = 'normal';
let currentImportTranspose = 0;
let selectedPartitionFile = null;

const availableEmojis = ['🎹', '🎵', '🎶', '🎼', '🎸', '🎺', '🎻', '🥁', '🎷', '🦁', '🐯', '🐶', '🐱', '🦄', '🚀', '⭐', '🔥', '💎'];

const DATA = {
    cours: [
        { titre: "1. DO - RÉ - MI (Main Droite)", diff: 'easy', notes: [{note:'C4',f:1,d:400},{note:'D4',f:2,d:400},{note:'E4',f:3,d:400},{note:'D4',f:2,d:400},{note:'C4',f:1,d:400}] },
        { titre: "2. La Main Droite complète (DO-SOL)", diff: 'easy', notes: [{note:'C4',f:1,d:400},{note:'D4',f:2,d:400},{note:'E4',f:3,d:400},{note:'F4',f:4,d:400},{note:'G4',f:5,d:400}] },
        { titre: "3. La Main Gauche (DO3-SOL3)", diff: 'easy', notes: [
            {note:'C3',m:'G',f:5,d:400},
            {note:'D3',m:'G',f:4,d:400},
            {note:'E3',m:'G',f:3,d:400},
            {note:'F3',m:'G',f:2,d:400},
            {note:'G3',m:'G',f:1,d:400}
        ]},
        { titre: "4. Extension : Le LA (6 notes)", diff: 'easy', notes: [{note:'C4',f:1,d:400},{note:'E4',f:3,d:400},{note:'G4',f:5,d:400},{note:'A4',f:5,d:400},{note:'G4',f:4,d:400}] },
        { titre: "5. Saut d'Octave (DO3 à DO4)", diff: 'medium', notes: [{note:'C3',m:'G',f:1,d:400},{note:'C4',m:'D',f:1,d:400},{note:'C3',m:'G',f:1,d:400},{note:'C4',m:'D',f:1,d:400}] },
        { titre: "6. Accords de base (DO Majeur)", diff: 'medium', notes: [{note:'C4',f:1,d:1200},{note:'E4',f:3,d:1200},{note:'G4',f:5,d:1200}] },
        { titre: "7. Passage du Pouce (Gamme de DO)", diff: 'medium', notes: [{note:'C4',f:1,d:400},{note:'D4',f:2,d:400},{note:'E4',f:3,d:400},{note:'F4',f:1,d:400},{note:'G4',f:2,d:400},{note:'A4',f:3,d:400},{note:'B4',f:4,d:400},{note:'C5',f:5,d:400}] },
        { titre: "8. Les Touches Noires (FA#)", diff: 'hard', notes: [{note:'D4',f:1,d:400},{note:'F#4',f:3,d:400},{note:'A4',f:5,d:400}] },
        { titre: "9. Arpège Simple", diff: 'hard', notes: [{note:'C4',f:1,d:600},{note:'E4',f:2,d:600},{note:'G4',f:3,d:600},{note:'C5',f:5,d:600}] },
        { titre: "10. Coordination des mains", diff: 'hard', notes: [{note:'C3',m:'G',f:1,d:400},{note:'C4',m:'D',f:1,d:400},{note:'E3',m:'G',f:3,d:400},{note:'E4',m:'D',f:3,d:400}] }
    ],
    exercices: [
        { titre: "1. Vélocité Hanon n°1", diff: 'medium', notes: [{note:'C4',f:1,d:300},{note:'E4',f:2,d:300},{note:'F4',f:3,d:300},{note:'G4',f:4,d:300},{note:'A4',f:5,d:300}] },
        { titre: "2. Le Crabe (Indépendance)", diff: 'medium', notes: [{note:'C4',f:1,d:300},{note:'D4',f:2,d:300},{note:'C4',f:1,d:300},{note:'E4',f:3,d:300}] },
        { titre: "3. Force du Petit Doigt", diff: 'medium', notes: [{note:'G4',f:5,d:300},{note:'F4',f:4,d:300},{note:'G4',f:5,d:300},{note:'E4',f:3,d:300}] },
        { titre: "4. Triolets rapides", diff: 'medium', notes: [{note:'C4',f:1,d:200},{note:'D4',f:2,d:200},{note:'E4',f:3,d:200},{note:'C4',f:1,d:200},{note:'D4',f:2,d:200},{note:'E4',f:3,d:200}] },
        { titre: "5. Écart de Quarte", diff: 'medium', notes: [{note:'C4',f:1,d:400},{note:'F4',f:4,d:400},{note:'C4',f:1,d:400},{note:'F4',f:4,d:400}] },
        { titre: "6. Octaves Alternées", diff: 'hard', notes: [{note:'C3',f:1,d:400},{note:'C4',f:5,d:400},{note:'D3',f:1,d:400},{note:'D4',f:5,d:400}] },
        { titre: "7. Gamme Chromatique", diff: 'hard', notes: [{note:'C4',f:1,d:250},{note:'C#4',f:3,d:250},{note:'D4',f:1,d:250},{note:'D#4',f:3,d:250}] },
        { titre: "8. Accords de 4 notes", diff: 'hard', notes: [{note:'C4',f:1,d:800},{note:'E4',f:2,d:800},{note:'G4',f:3,d:800},{note:'B4',f:5,d:800}] },
        { titre: "9. Vitesse Pouce-Index", diff: 'hard', notes: [{note:'C4',f:1,d:200},{note:'D4',f:2,d:200},{note:'C4',f:1,d:200},{note:'D4',f:2,d:200}] },
        { titre: "10. Le Grand Final", diff: 'hard', notes: [{note:'C4',f:1,d:500},{note:'G4',f:5,d:500},{note:'C5',f:1,d:500},{note:'G5',f:5,d:500}] }
    ],
    apprentissage: [
        { titre: "Loreen - Tattoo", diff: 'hard', notes: [{note:'A3', f:1, d:600}, {note:'C4', f:2, d:600}, {note:'E4', f:4, d:1200}, {note:'A3', f:1, d:600}, {note:'C4', f:2, d:600}, {note:'E4', f:4, d:1200}] },
        { titre: "Metallica - Nothing Else Matters", diff: 'medium', notes: [{note:'E2', f:1, d:400}, {note:'G3', f:2, d:400}, {note:'B3', f:3, d:400}, {note:'E4', f:5, d:1200}] },
        { titre: "Pirates des Caraïbes", diff: 'hard', notes: [{note:'A3', f:1, d:500}, {note:'C4', f:2, d:250}, {note:'D4', f:3, d:500}, {note:'D4', f:3, d:500}] },
        { titre: "Axel F", diff: 'hard', notes: [{note:'D4', f:1, m:'D', d:400}, {note:'F4', f:3, m:'D', d:300}, {note:'D4', f:1, m:'D', d:200}] }
    ],
    musique: [
        { titre: "Hallelujah", diff: 'easy', notes: [{note:'E4', f:1, d:600}, {note:'G4', f:3, d:300}, {note:'G4', f:3, d:600}] },
        { titre: "ATC - All Around The World", diff: 'easy', notes: [{note:'C4', d:300}, {note:'D4', d:300}, {note:'E4', d:300}] },
        { titre: "Eiffel 65 - Blue", diff: 'medium', notes: [{note:'G4', d:200}, {note:'A4', d:200}, {note:'B4', d:200}] },
        { titre: "ABBA - Gimme!", diff: 'medium', notes: [{note:'D4', d:200}, {note:'E4', d:200}, {note:'F4', d:200}] },
        { titre: "a-ha - Take On Me", diff: 'hard', notes: [{note:'B3', d:200}, {note:'B3', d:200}, {note:'E4', d:200}] },
        { titre: "O-Zone - Dragostea Din Tei", diff: 'medium', notes: [{note:'B4', d:300}, {note:'A4', d:300}, {note:'G4', d:300}] },
        { titre: "Gigi D'Agostino", diff: 'hard', notes: [{note:'A4', d:200}, {note:'G4', d:200}, {note:'A4', d:200}] },
        { titre: "Rick Astley", diff: 'medium', notes: [{note:'C4', d:200}, {note:'D4', d:200}, {note:'F4', d:200}] },
   { 
    titre: "Pirates des Caraïbes", 
    diff: 'hard', 
    emoji: "🏴‍☠️",
    notes: [
        // --- LE THEME CELEBRE (Le bon rythme) ---
        {note: "A3", t: 0, d: 150, f: 1}, 
        {note: "C4", t: 150, d: 150, f: 2},
        {note: "D4", t: 300, d: 400, f: 3}, // La note longue
        {note: "D4", t: 800, d: 400, f: 3}, 
        
        {note: "D4", t: 1300, d: 150, f: 3}, 
        {note: "E4", t: 1450, d: 150, f: 4},
        {note: "F4", t: 1600, d: 400, f: 5}, // La note longue
        {note: "F4", t: 2100, d: 400, f: 5},

        {note: "F4", t: 2600, d: 150, f: 5}, 
        {note: "G4", t: 2750, d: 150, f: 1},
        {note: "E4", t: 2900, d: 400, f: 3}, 
        {note: "E4", t: 3400, d: 400, f: 3},

        {note: "D4", t: 3900, d: 150, f: 2}, 
        {note: "C4", t: 4050, d: 150, f: 1},
        {note: "D4", t: 4200, d: 800, f: 2}, // Fin de la première boucle

        // --- DEUXIEME PARTIE (Plus intense) ---
        {note: "A3", t: 5200, d: 150}, 
        {note: "C4", t: 5350, d: 150},
        {note: "D4", t: 5500, d: 400}, 
        {note: "D4", t: 6000, d: 400},

        {note: "D4", t: 6500, d: 150}, 
        {note: "E4", t: 6650, d: 150},
        {note: "F4", t: 6800, d: 400}, 
        {note: "F4", t: 7300, d: 400},

        {note: "F4", t: 7800, d: 150}, 
        {note: "G4", t: 7950, d: 150},
        {note: "A4", t: 8100, d: 400}, 
        {note: "A4", t: 8600, d: 400},

        {note: "Bb4", t: 9100, d: 150}, 
        {note: "A4", t: 9250, d: 150},
        {note: "G4", t: 9400, d: 300},
        {note: "A4", t: 9700, d: 800}
    ] 
},
{ 
    titre: "Axel F", 
    diff: 'hard', 
    emoji: "🏎️",
    notes: [
        {note: "D4", t: 0, d: 300}, 
        {note: "F4", t: 400, d: 200}, 
        {note: "D4", t: 750, d: 200}, 
        {note: "D4", t: 950, d: 100}, 
        {note: "G4", t: 1100, d: 200}, 
        {note: "D4", t: 1450, d: 200}, 
        {note: "C4", t: 1800, d: 200},

        {note: "D4", t: 2200, d: 300}, 
        {note: "A4", t: 2600, d: 200}, 
        {note: "D4", t: 2950, d: 200}, 
        {note: "D4", t: 3150, d: 100}, 
        {note: "Bb4", t: 3300, d: 200}, 
        {note: "A4", t: 3650, d: 200}, 
        {note: "F4", t: 4000, d: 200},

        {note: "D4", t: 4400, d: 200}, 
        {note: "A4", t: 4750, d: 200}, 
        {note: "D5", t: 5100, d: 300},
        {note: "D4", t: 5500, d: 200}, 
        {note: "C4", t: 5850, d: 200}, 
        {note: "C4", t: 6050, d: 100}, 
        {note: "E4", t: 6200, d: 200}, 
        {note: "D4", t: 6550, d: 800}
    ] 
},{ 
    titre: "Harry Potter", 
    diff: 'hard', 
    emoji: "⚡",
    notes: [
        // --- MÉLODIE MYSTÉRIQUE (Intro) ---
        {note: "B3", t: 0, d: 200, f: 1}, 
        {note: "E4", t: 400, d: 300, f: 2}, 
        {note: "G4", t: 700, d: 150, f: 4}, 
        {note: "F#4", t: 850, d: 150, f: 3},
        {note: "E4", t: 1000, d: 450, f: 2}, 
        {note: "B4", t: 1500, d: 250, f: 5},
        {note: "A4", t: 1800, d: 800, f: 4}, // Note de lave longue

        {note: "F#4", t: 2800, d: 450, f: 3},
        {note: "E4", t: 3300, d: 300, f: 2}, 
        {note: "G4", t: 3600, d: 150, f: 4}, 
        {note: "F#4", t: 3750, d: 150, f: 3},
        {note: "D#4", t: 3900, d: 450, f: 2}, 
        {note: "F4", t: 4400, d: 250, f: 3},
        {note: "B3", t: 4700, d: 800, f: 1},

        // --- DEUXIÈME PARTIE ---
        {note: "B3", t: 5700, d: 200}, 
        {note: "E4", t: 6100, d: 300}, 
        {note: "G4", t: 6400, d: 150}, 
        {note: "F#4", t: 6550, d: 150},
        {note: "E4", t: 6700, d: 450}, 
        {note: "B4", t: 7200, d: 250},
        {note: "D5", t: 7500, d: 400}, 
        {note: "C#5", t: 8000, d: 400},
        {note: "C5", t: 8500, d: 400},

        // --- FINAL ÉPIQUE ---
        {note: "G#4", t: 9000, d: 200}, 
        {note: "C5", t: 9300, d: 300}, 
        {note: "B4", t: 9600, d: 150}, 
        {note: "Bb4", t: 9750, d: 150},
        {note: "Bb3", t: 10000, d: 400}, 
        {note: "G4", t: 10500, d: 200},
        {note: "E4", t: 10800, d: 1200} // Énorme jet de lave final !
    ] 
}
    ],
    partitions: [
        { titre: "📤 Importer MusicXML/MIDI", diff: 'custom', type: 'import', action: 'openPartitionModal' },
        { titre: "🎼 Bibliothèque de partitions", diff: 'custom', type: 'library', action: 'openLibrary' }
    ]
};

// === CLASSE PARSER MIDI ===
class PartitionTranslator {
    constructor(containerId) {
        this.containerId = containerId;
        this.currentNotes = [];
        this.transposition = 0;
    }

    async loadFromFile(file) {
        if (file.name.endsWith('.mid') || file.name.endsWith('.midi')) {
            return await this.loadMidi(file);
        } else {
            throw new Error("MusicXML nécessite une librairie externe. Utilisez MIDI.");
        }
    }

    async loadMidi(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const midiData = new Uint8Array(e.target.result);
                    this.parseMidi(midiData);
                    resolve(this.currentNotes);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }

    parseMidi(data) {
        const notes = [];
        let pos = 0;
        
        const readUint32 = () => { const val = (data[pos] << 24) | (data[pos+1] << 16) | (data[pos+2] << 8) | data[pos+3]; pos += 4; return val >>> 0; };
        const readUint16 = () => { const val = (data[pos] << 8) | data[pos+1]; pos += 2; return val; };
        const readVarLen = () => { let val = 0; let byte; do { byte = data[pos++]; val = (val << 7) | (byte & 0x7F); } while (byte & 0x80); return val; };

        if (data.length < 14 || data[0] !== 0x4D || data[1] !== 0x54 || data[2] !== 0x68 || data[3] !== 0x64) {
            throw new Error("En-tête MIDI invalide");
        }
        
        pos = 4;
        const headerLen = readUint32();
        const format = readUint16();
        const numTracks = readUint16();
        const division = readUint16();
        let ticksPerQuarter = division & 0x7FFF;
        
        pos = 8 + headerLen;
        const activeNotes = new Map();
        
        for (let track = 0; track < numTracks; track++) {
            if (pos + 8 > data.length) break;
            if (data[pos] !== 0x4D || data[pos+1] !== 0x54 || data[pos+2] !== 0x72 || data[pos+3] !== 0x6B) break;
            
            pos += 4;
            const trackLen = readUint32();
            const trackEnd = pos + trackLen;
            let trackTime = 0;
            let runningStatus = 0;
            let currentTempo = 500000;
            
            while (pos < trackEnd && pos < data.length) {
                const delta = readVarLen();
                trackTime += delta;
                if (pos >= data.length) break;
                
                let status = data[pos];
                if (status & 0x80) { runningStatus = status; pos++; } else { status = runningStatus; }
                
                const type = status & 0xF0;
                const channel = status & 0x0F;
                
                if (type === 0x90) {
                    if (pos + 1 >= data.length) break;
                    const note = data[pos++];
                    const velocity = data[pos++];
                    if (velocity > 0) {
                        const noteKey = `${channel}-${note}`;
                        if (!activeNotes.has(noteKey)) activeNotes.set(noteKey, []);
                        activeNotes.get(noteKey).push({ startTime: trackTime, velocity: velocity, channel: channel });
                    } else {
                        this.endNote(notes, activeNotes, channel, note, trackTime, ticksPerQuarter, currentTempo);
                    }
                } else if (type === 0x80) {
                    if (pos + 1 >= data.length) break;
                    const note = data[pos++]; const velocity = data[pos++];
                    this.endNote(notes, activeNotes, channel, note, trackTime, ticksPerQuarter, currentTempo);
                } else if (status === 0xFF) {
                    if (pos >= data.length) break;
                    const metaType = data[pos++];
                    const len = readVarLen();
                    if (metaType === 0x51 && len === 3) { currentTempo = (data[pos] << 16) | (data[pos+1] << 8) | data[pos+2]; }
                    else if (metaType === 0x2F) { break; }
                    pos += len;
                } else if (status === 0xF0 || status === 0xF7) {
                    const len = readVarLen(); pos += len;
                } else {
                    let dataBytes = 2;
                    if (type === 0xC0 || type === 0xD0) dataBytes = 1;
                    if (pos + dataBytes > data.length) break;
                    pos += dataBytes;
                }
            }
        }
        
        notes.forEach(n => {
            const spt = n.tempo ? (n.tempo / 1000000 / ticksPerQuarter) : (500000 / ticksPerQuarter / 1000000);
            n.time = n.startTick * spt;
            n.duration = n.durationTicks * spt;
            delete n.startTick; delete n.durationTicks; delete n.tempo;
        });
        
        notes.sort((a, b) => a.time - b.time);
        this.currentNotes = notes;
        return notes;
    }

    endNote(notes, activeNotes, channel, note, endTime, ticksPerQuarter, currentTempo) {
        const noteKey = `${channel}-${note}`;
        if (activeNotes.has(noteKey) && activeNotes.get(noteKey).length > 0) {
            const startEvent = activeNotes.get(noteKey).shift();
            const duration = endTime - startEvent.startTime;
            if (duration > 0) {
                const noteName = this.midiNoteToName(note);
                const isRightHand = channel === 0 || note >= 60;
                notes.push({
                    midi: note,
                    noteName: noteName,
                    fullName: noteName,
                    startTick: startEvent.startTime,
                    durationTicks: duration,
                    tempo: currentTempo,
                    velocity: startEvent.velocity,
                    channel: channel,
                    hand: isRightHand ? 'D' : 'G',
                    isBlack: noteName.includes('#')
                });
            }
        }
    }

    midiNoteToName(midi) {
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const octave = Math.floor(midi / 12) - 1;
        return `${notes[midi % 12]}${octave}`;
    }

    convertToGameFormat(speedMultiplier = 1) {
        return this.currentNotes.map((note) => {
            const durationMs = Math.max(200, Math.min(3000, note.duration * 1000 / speedMultiplier));
            return {
                note: note.noteName,
                f: note.midi >= 60 ? 1 : 5,
                m: note.hand || (note.midi >= 60 ? 'D' : 'G'),
                d: durationMs,
                time: note.time,
                midi: note.midi
            };
        });
    }

    transpose(semitones) {
        this.transposition += semitones;
        this.currentNotes = this.currentNotes.map(note => ({
            ...note,
            midi: note.midi + semitones,
            noteName: this.midiNoteToName(note.midi + semitones)
        }));
        return this.currentNotes;
    }
}

// === INITIALISATION ===
window.onload = () => { 
    initPiano(); 
    updateProfileDisplay(); 
    switchTab('cours'); 
    
    const micBtn = document.getElementById('mic-toggle');
    if(micBtn) micBtn.onclick = toggleMic;
    
    setupMIDI();
    setupPartitionTranslator();
};

function setupPartitionTranslator() {
    partitionTranslator = new PartitionTranslator('osmd-container');
    const fileInput = document.getElementById('partition-file-input');
    if (fileInput) {
        fileInput.addEventListener('change', handlePartitionFileSelect);
    }
}

function handlePartitionFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        selectedPartitionFile = file;
        const nameEl = document.getElementById('selected-file-name');
        if (nameEl) nameEl.textContent = `📄 ${file.name}`;
    }
}

function setImportDifficulty(level, btn) {
    currentImportDifficulty = level;
    document.querySelectorAll('.difficulty-selector .diff-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
}

function transposeImport(semitones) {
    currentImportTranspose += semitones;
    const el = document.getElementById('transpose-value');
    if (el) el.textContent = currentImportTranspose;
}

async function loadPartitionFile() {
    if (!selectedPartitionFile) {
        alert('Veuillez d\'abord sélectionner un fichier');
        return;
    }

    try {
        const scoreViewer = document.getElementById('score-viewer-container');
        
        // 1. Afficher et charger OSMD
        if (selectedPartitionFile.name.match(/\.(xml|mxl|musicxml)$/i)) {
            scoreViewer.style.display = 'block';
            const osmd = new opensheetmusicdisplay.OpenSheetMusicDisplay("osmd-container", {
                drawTitle: false,
                autoResize: true
            });
            const reader = new FileReader();
            reader.onload = async (e) => {
                await osmd.load(e.target.result);
                osmd.render();
            };
            reader.readAsText(selectedPartitionFile);
        } else {
            scoreViewer.style.display = 'none';
        }

        // 2. Traduction et lancement (ton code original)
        await partitionTranslator.loadFromFile(selectedPartitionFile);
        const gameNotes = partitionTranslator.convertToGameFormat(currentSpeed / 4);
        
        closePartitionModal();
        startGame({ titre: selectedPartitionFile.name, notes: gameNotes }, 'auto');
        
    } catch (error) {
        console.error(error);
    }
}

function openPartitionModal() {
    const modal = document.getElementById('partition-modal');
    if (modal) {
        modal.style.display = 'flex';
        selectedPartitionFile = null;
        currentImportTranspose = 0;
        const fileNameEl = document.getElementById('selected-file-name');
        if (fileNameEl) fileNameEl.textContent = '';
        const transposeEl = document.getElementById('transpose-value');
        if (transposeEl) transposeEl.textContent = '0';
    }
}

function closePartitionModal() {
    const modal = document.getElementById('partition-modal');
    if (modal) modal.style.display = 'none';
}

function openLibrary() {
    alert('Bibliothèque en développement');
}

function setupEmojiPicker() {
    const picker = document.getElementById('emoji-picker');
    if (!picker) return;
    picker.innerHTML = ''; 
    availableEmojis.forEach(emoji => {
        const span = document.createElement('span');
        span.classList.add('emoji-opt');
        span.innerText = emoji;
        if (emoji === selectedEmoji) span.classList.add('selected');
        span.onclick = () => {
            document.querySelectorAll('.emoji-opt').forEach(el => el.classList.remove('selected'));
            span.classList.add('selected');
            selectedEmoji = emoji;
        };
        picker.appendChild(span);
    });
}

function setRole(role) {
    selectedRole = role;
    const enfantBtn = document.getElementById('role-enfant');
    const adulteBtn = document.getElementById('role-adulte');
    if (enfantBtn) enfantBtn.classList.remove('active');
    if (adulteBtn) adulteBtn.classList.remove('active');
    if (role === 'enfant' && enfantBtn) enfantBtn.classList.add('active');
    else if (role === 'adulte' && adulteBtn) adulteBtn.classList.add('active');
}

function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => alert(`Erreur : ${err.message}`));
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
    }
}

function initPiano() {
    const p = document.getElementById('piano'); 
    if (!p) return;
    p.innerHTML = ''; 
    let whiteKeyPosition = 0;
    
    if (colorMode === 'expert') p.classList.add('expert-mode');
    else p.classList.remove('expert-mode');
    
    [2,3,4,5,6].forEach(oct => {
        noteStrings.forEach(n => {
            if(oct === 6 && n !== 'C') return;
            const isB = n.includes('#'), k = document.createElement('div');
            k.className = `key ${isB ? 'black' : 'white'}`; 
            k.dataset.note = n+oct;
            if(!isB) {
                if (colorMode !== 'expert') {
                    k.innerHTML = `<span style="color: ${noteColors[n]}">${noteNamesFR[n]}</span>`;
                }
                k.style.left = `${whiteKeyPosition}px`; 
                whiteKeyPosition += 55;
            } else { 
                k.style.left = `${whiteKeyPosition - 55 + 27.5 - 15}px`; 
            }
            k.onmousedown = () => handleKeyPress(n+oct, true);
            p.appendChild(k);
        });
    });
    p.style.width = `${whiteKeyPosition + 40}px`;
}

function switchTab(tabType) {
    const g = document.getElementById('content-grid'); 
    if (!g) return;
    g.innerHTML = '';
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        const onclickAttr = btn.getAttribute('onclick');
        if (onclickAttr && onclickAttr.includes(`'${tabType}'`)) {
            btn.classList.add('active');
        }
    });

    const currentP = profiles.find(p => p.name === currentProfileName) || profiles[0];
    const completed = currentP.completed || [];
    const isEnfant = currentP.role === 'enfant';
    const items = DATA[tabType] || [];

    items.forEach((item, index) => {
        let isPremium = false;
        if (!isPro) {
            if ((tabType === 'cours' || tabType === 'exercices') && index >= 3) isPremium = true;
            else if ((tabType === 'apprentissage' || tabType === 'musique') && index >= 2) isPremium = true;
        }
        
        const isLocked = isEnfant && index > 0 && !completed.includes(items[index-1]?.titre);
        
        const card = document.createElement('div'); 
        card.className = 'card';
        
        if (item.type === 'import') {
            card.style.cssText = 'background: linear-gradient(135deg, #1a1a2e, #2d1b4e); border: 2px solid var(--accent);';
            card.innerHTML = `<div style="font-size:2rem; margin-bottom:10px;">${item.titre.split(' ')[0]}</div><div style="font-weight:bold;">${item.titre.substring(2)}</div>`;
            card.onclick = () => openPartitionModal();
        } else if (isPremium) {
            card.style.cssText = 'background: linear-gradient(135deg, #1a1a2e, #2d1b4e) !important; border: 2px solid gold !important;';
            card.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;"><b style="color:${item.diff === 'easy' ? '#2ecc71' : item.diff === 'medium' ? '#f1c40f' : '#e74c3c'}; font-size:10px;">${item.diff.toUpperCase()}</b><span style="font-size:20px; animation:pulse 2s infinite;">💎</span></div><div style="font-weight:bold; color:gold; text-shadow:0 0 10px rgba(255,215,0,0.5);">VERSION PRO</div><div style="font-size:0.8rem; color:#888;">${item.titre}</div>`;
            card.onclick = () => openPricing();
        } else if (isLocked) {
            card.className += ' locked';
            card.style.opacity = '0.4';
            card.innerHTML = `<div style="display:flex; justify-content:space-between; margin-bottom:8px;"><b style="color:#666; font-size:10px;">LOCKED</b><span>🔒</span></div><div style="font-weight:bold; color:#666;">Terminez le niveau précédent</div>`;
        } else {
            const isDone = completed.includes(item.titre);
            card.innerHTML = `<div style="display:flex; justify-content:space-between; margin-bottom:8px;"><b style="color:${item.diff === 'easy' ? '#2ecc71' : item.diff === 'medium' ? '#f1c40f' : '#e74c3c'}; font-size:10px;">${item.diff.toUpperCase()}</b>${isDone ? '✅' : ''}</div><div style="font-weight:bold;">${item.titre}</div>`;
            card.onclick = () => {
                currentLevelTitle = item.titre; 
                const scoreViewer = document.getElementById('score-viewer-container');
                if (scoreViewer) scoreViewer.style.display = 'none';
                startGame(item, tabType === 'musique' ? 'auto' : 'step');
            };
        }
        g.appendChild(card);
    });
}

function openPricing() {
    const modal = document.getElementById('pricing-modal');
    if (modal) modal.style.display = 'flex';
}

function closePricing() {
    const modal = document.getElementById('pricing-modal');
    if (modal) modal.style.display = 'none';
}

function unlockPro() {
    const userEmail = document.getElementById('display-username')?.innerText;
    if (userEmail === "Invité" || userEmail === "Apprenti") {
        alert("Crée un compte gratuit avant de passer PRO !");
        const authModal = document.getElementById('auth-modal');
        if (authModal) authModal.style.display = 'flex';
        return;
    }
    window.location.href = "https://buy.stripe.com/test_00w5kDcHu8tPe7P9rI7ss00";
}

function getNoteColor(note) {
    if (colorMode === 'expert') return '#ff0000';
    if (colorMode === 'intermediaire') return '#00d9ff';
    const base = note.replace(/[0-9#]/g, '');
    return noteColors[base] || '#00f2ff';
}
// REMPLACEZ votre fonction createNoteEvaporation par celle-ci :
function createNoteEvaporation(x, y, color, noteHeight) {
    const fZone = document.getElementById('fall-zone');
    if (!fZone || !x || !y) return;
    
    const isLong = noteHeight > 100;
    // La taille de l'effet dépend de la hauteur de la note
    const dynamicSize = isLong ? Math.min(100, noteHeight / 1.5) : 40;

    // 1. BULLE D'ÉNERGIE PRINCIPALE
    const glow = document.createElement('div');
    glow.className = 'note-glow-up';
    glow.style.left = x + 'px';
    glow.style.top = y + 'px';
    glow.style.width = '20px'; // Départ petit
    glow.style.backgroundColor = color;
    glow.style.boxShadow = `0 0 ${dynamicSize}px ${color}`;
    
    // On passe la hauteur à l'animation CSS via une variable
    glow.style.setProperty('--travel-height', `${noteHeight}px`);
    glow.style.setProperty('--final-size', `${dynamicSize}px`);

    fZone.appendChild(glow);
    setTimeout(() => glow.remove(), 1000);

    // 2. ÉTINCELLES ASCENDANTES
    const particleCount = isLong ? 15 : 8;
    for (let i = 0; i < particleCount; i++) {
        const p = document.createElement('div');
        p.className = 'rising-spark';
        p.style.left = (x + (Math.random() - 0.5) * 40) + 'px';
        p.style.top = y + 'px';
        p.style.backgroundColor = 'white';
        p.style.boxShadow = `0 0 10px ${color}`;
        
        // Vitesse et hauteur aléatoire pour le côté organique
        const duration = 0.5 + Math.random() * 0.5;
        const drift = (Math.random() - 0.5) * 50;
        
        p.style.setProperty('--up-dist', `${noteHeight + 50}px`);
        p.style.setProperty('--drift-x', `${drift}px`);
        p.style.animationDuration = duration + 's';

        fZone.appendChild(p);
        setTimeout(() => p.remove(), duration * 1000);
    }
}
// OPTIMISATION CRUCIALE : Modifiez aussi votre fonction drop() 
// pour qu'elle soit plus fluide (remplacez votre animate) :

const animate = () => {
    const currentEl = document.getElementById(noteId);
    if (!currentEl) return;

    // OPTIMISATION : Utiliser transform au lieu de top quand possible
    if(!isPaused || o.ok) {
        o.y += currentSpeed;
        // Si la note est jouée (ok), on utilise transform pour plus de perf
        if(o.ok) {
            currentEl.style.transform = `translateY(${o.y}px)`;
        } else {
            currentEl.style.top = o.y + "px";
        }
    }
    
    const bottomOfNote = o.y + o.h;
    const hitLineY = hitLine ? hitLine.offsetTop : (fZone.offsetHeight - 20);
    
    if(currentMode === 'auto' && bottomOfNote >= hitLineY && !o.ok) { 
        handleKeyPress(o.note, false);
        // PAS DE return ici - la note continue
    }
    
    if(currentMode === 'step' && bottomOfNote >= hitLineY && !o.ok) { 
        isPaused = true; 
        o.y = hitLineY - o.h; 
        currentEl.style.top = o.y + "px";
    }

    // Nettoyage optimisé
    if(o.y > fZone.offsetHeight + 200) {
        if(currentEl.parentNode) currentEl.remove();
        const idx = notesOnScreen.findIndex(n => n.id === noteId);
        if (idx > -1) notesOnScreen.splice(idx, 1);
    } else {
        requestAnimationFrame(animate);
    }
};
function handleKeyPress(note, isManual = false) {
    // 1. Animation de la touche du piano (en bas)
    const k = document.querySelector(`.key[data-note="${note}"]`);
    if(k) { 
        const color = getNoteColor(note);
        k.style.backgroundColor = color;
        k.style.boxShadow = `0 0 20px ${color}, 0 0 40px white`; // Ajout d'éclat blanc
        k.style.transform = 'translateY(2px)';
        k.classList.add('active'); // Force la classe active
        
        setTimeout(() => {
            k.style.backgroundColor = "";
            k.style.boxShadow = "";
            k.style.transform = "";
            k.classList.remove('active');
        }, 150);
    }

    // 2. Trouver la note correspondante à l'écran qui n'est pas encore validée
    const t = notesOnScreen.find(n => n.note === note && !n.ok);
    
    if(t) {
        // Jouer le son
        const noteDuration = (t.d || 400) / 1000;
        playNoteSound(getFreq(note), noteDuration);
        
        // Marquer comme jouée (validée)
        t.ok = true; 
        notesValidated++;
        
        // Gestion visuelle de la note qui tombe
        const fZone = document.getElementById('fall-zone');
        const noteElement = document.getElementById(t.id);
        
        if(noteElement && fZone) {
            const noteLeft = parseInt(noteElement.style.left) || 0;
            const noteWidth = parseInt(noteElement.style.width) || 40;
            const centerX = noteLeft + noteWidth / 2;
            const hitLineY = document.getElementById('hit-line')?.offsetTop || (fZone.offsetHeight - 20);
            const noteHeight = t.h || 80;
            const color = getNoteColor(note);

            // A. Créer les particules (l'explosion visuelle)
            createNoteEvaporation(centerX, hitLineY, color, noteHeight);
            
            // B. MODIFICATION IMPORTANTE : 
            // Au lieu de cacher la note, on la transforme pour montrer qu'elle est "Réussie"
            
            // 1. On la rend bien brillante et visible
            noteElement.style.transition = 'box-shadow 0.1s ease, background 0.1s ease'; // Transition rapide
            noteElement.style.opacity = '1'; // On assure qu'elle reste visible
            noteElement.style.zIndex = '100'; // Elle passe devant les autres
            
            // 2. Effet "Gold/Lumière" pour valider
            noteElement.style.boxShadow = `0 0 30px ${color}, 0 0 10px #fff, inset 0 0 10px #fff`;
            noteElement.style.background = `linear-gradient(180deg, #fff 0%, ${color} 40%, ${color} 100%)`;
            noteElement.style.borderColor = "#fff";

            // 3. (Optionnel) Petit effet de "pop" (légère augmentation de taille)
            noteElement.style.transform = 'scale(1.05)'; 

            // Note : On ne supprime pas l'élément ici, la fonction 'animate' s'en chargera 
            // quand la note sortira de l'écran par le bas.
        }
        
        // Libérer la pause en mode step (si activé)
        isPaused = false; 
        
        // Vérifier si le niveau est terminé
        if(notesValidated === totalNotesInLevel) { 
            saveProgress(currentLevelTitle); 
            setTimeout(() => { 
                alert("Bravo ! Niveau terminé ! 🎹✨"); 
                quitGame(); 
            }, 1000); 
        }
    } else if(isManual) {
        // Son si joué manuellement sans note à l'écran (jeu libre)
        playNoteSound(getFreq(note), 0.3);
    }
}

// Effet d'évaporation colorée selon le thème
function createThemeEvaporation(x, y, color) {
    const fZone = document.getElementById('fall-zone');
    if (!fZone) return;
    
    // Créer 8 à 12 "fantômes" de notes qui s'élèvent
    const ghostCount = 10;
    
    for (let i = 0; i < ghostCount; i++) {
        const ghost = document.createElement('div');
        
        // Dimensions similaires aux notes (mais plus petites/étirées)
        const width = 15 + Math.random() * 20;
        const height = 30 + Math.random() * 40;
        
        // Position de départ dispersée
        const offsetX = (Math.random() - 0.5) * 40;
        const startX = x + offsetX - (width / 2);
        
        // Trajectoire ascendante avec dérive latérale
        const riseHeight = 80 + Math.random() * 100;
        const drift = (Math.random() - 0.5) * 60;
        const rotation = (Math.random() - 0.5) * 30;
        const duration = 1.2 + Math.random() * 0.8;
        const delay = i * 0.08; // Décalage en cascade
        
        // Style : Note transparente, floutée, même couleur
        ghost.style.cssText = `
            position: absolute;
            left: ${startX}px;
            top: ${y}px;
            width: ${width}px;
            height: ${height}px;
            background: linear-gradient(180deg, 
                ${color}00 0%, 
                ${color}44 20%, 
                ${color}66 50%, 
                ${color}44 80%, 
                ${color}00 100%);
            border: 1px solid ${color}44;
            border-radius: 8px;
            box-shadow: 
                0 0 10px ${color}33,
                inset 0 0 20px ${color}22;
            opacity: 0;
            filter: blur(2px);
            pointer-events: none;
            z-index: 100;
            transform: translateY(0) rotate(0deg);
            animation: ghostNoteRise ${duration}s ease-out ${delay}s forwards;
            --rise-y: -${riseHeight}px;
            --drift: ${drift}px;
            --rot: ${rotation}deg;
        `;
        
        fZone.appendChild(ghost);
        setTimeout(() => ghost.remove(), (duration + delay) * 1000);
    }
    
    // Quelques "paillettes" carrées/rectangulaires pour la texture
    for (let i = 0; i < 15; i++) {
        const spark = document.createElement('div');
        const size = 2 + Math.random() * 4;
        const startX = x + (Math.random() - 0.5) * 30;
        const delay = Math.random() * 0.3;
        
        spark.style.cssText = `
            position: absolute;
            left: ${startX}px;
            top: ${y}px;
            width: ${size}px;
            height: ${size}px;
            background: ${color};
            opacity: 0;
            filter: blur(0.5px);
            pointer-events: none;
            z-index: 101;
            animation: noteSparkle 1s ease-out ${delay}s forwards;
            --tx: ${(Math.random() - 0.5) * 40}px;
            --ty: -${60 + Math.random() * 80}px;
        `;
        
        fZone.appendChild(spark);
        setTimeout(() => spark.remove(), (1 + delay) * 1000);
    }
    
    // CSS
    if (!document.getElementById('ghost-note-styles')) {
        const style = document.createElement('style');
        style.id = 'ghost-note-styles';
        style.textContent = `
            @keyframes ghostNoteRise {
                0% {
                    transform: translateY(0) translateX(0) rotate(0deg) scale(0.8);
                    opacity: 0;
                }
                20% {
                    opacity: 0.6;
                }
                50% {
                    transform: translateY(calc(var(--rise-y) * 0.5)) translateX(calc(var(--drift) * 0.5)) rotate(calc(var(--rot) * 0.5)) scale(1);
                    opacity: 0.4;
                }
                100% {
                    transform: translateY(var(--rise-y)) translateX(var(--drift)) rotate(var(--rot)) scale(0.3);
                    opacity: 0;
                    filter: blur(8px);
                }
            }
            
            @keyframes noteSparkle {
                0% {
                    transform: translate(-50%, -50%) scale(0);
                    opacity: 0;
                }
                30% {
                    opacity: 0.8;
                }
                100% {
                    transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

function playNoteSound(f, duration = 0.5) { 
    if(!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') audioContext.resume();
    
    const o = audioContext.createOscillator();
    const g = audioContext.createGain(); 
    
    o.frequency.value = f; 
    o.type = 'triangle';
    
    const now = audioContext.currentTime;
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.3, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, now + duration);
    
    o.connect(g); 
    g.connect(audioContext.destination); 
    
    o.start(now); 
    o.stop(now + duration); 
}
// === FONCTION CRITIQUE : NOTES AVEC VAPEUR CONTINUE ===
function drop(nData) {
    const fZone = document.getElementById('fall-zone');
    const targetKey = document.querySelector(`.key[data-note="${nData.note}"]`);
    const hitLine = document.getElementById('hit-line');
    if(!targetKey || !fZone || !hitLine) return;

    const noteDuration = nData.d || 400;
    const calculatedHeight = Math.max(80, (noteDuration / 8) * (currentSpeed / 3));
    const noteId = 'note-' + Math.random().toString(36).substr(2, 9);

    const keyRect = targetKey.getBoundingClientRect();
    const fZoneRect = fZone.getBoundingClientRect();
    const leftPos = keyRect.left - fZoneRect.left + 3;
    const width = keyRect.width - 6;

    const o = { 
        ...nData, 
        y: -calculatedHeight - 30,
        ok: false, 
        id: noteId, 
        h: calculatedHeight
    };
    notesOnScreen.push(o);

    const el = document.createElement('div');
    el.id = noteId;
    el.className = 'falling-note';
    
    // Détermination de la couleur
    const noteBase = nData.note.replace(/[0-9#]/g, '');
    let baseColor = noteColors[noteBase] || '#00f2ff';
if (colorMode === 'expert') {
    baseColor = '#ff0000'; // Rouge Lave
    // On crée une couleur de traînée plus sombre, comme de la roche en fusion
    trailColor = 'rgba(255, 60, 0, 0.8)'; 
}
    else if (colorMode === 'intermediaire') baseColor = '#00f5ff';

    // Style de la note (ton style actuel)
    el.style.cssText = `
        position: absolute;
        left: ${leftPos}px;
        width: ${width}px;
        height: ${calculatedHeight}px;
        top: ${o.y}px;
        border-radius: 15px 15px 8px 8px;
        border: 2px solid rgba(255, 255, 255, 0.6);
        background: linear-gradient(180deg, rgba(255,255,255,0.4) 0%, ${baseColor}66 100%);
        z-index: 50;
    `;

    // Contenu (Doigté et Nom de note)
    const hand = nData.m || (parseInt(nData.note.slice(-1)) <= 3 ? 'G' : 'D');
    const finger = nData.f || 1;
    const displayNote = noteNamesFR[noteBase] || noteBase;
    
    el.innerHTML = colorMode === 'expert' ? '' : `
        <div style="position: absolute; top: -12px; left: 50%; transform: translateX(-50%); padding: 4px 12px; border-radius: 20px; background: ${baseColor}; color: #000; font-weight: bold; border: 2px solid white;">${hand}${finger}</div>
        <div style="position: absolute; bottom: -12px; left: 50%; transform: translateX(-50%); padding: 3px 10px; border-radius: 12px; background: white; color: #000; font-weight: bold; border: 1px solid ${baseColor};">${displayNote}</div>
    `;

    fZone.appendChild(el);
    const hitLineY = hitLine.offsetTop;

    const animate = () => {
        const currentEl = document.getElementById(noteId);
        if (!currentEl) return;

        if(!isPaused || o.ok) {
            o.y += currentSpeed;
            currentEl.style.top = o.y + "px";
        }
        
        const bottomOfNote = o.y + o.h;

        // --- SECTION AJOUTÉE : EFFET DE VAPEUR CONTINUE ---
        // Si la note est validée (o.ok) et qu'elle traverse la ligne d'impact
        if (o.ok && bottomOfNote >= hitLineY && o.y <= hitLineY + 20) {
            const centerX = leftPos + (width / 2);
            // On appelle ta fonction de vapeur
            createContinuousSteam(centerX, hitLineY, baseColor);
        }
        // --------------------------------------------------
        
        if(currentMode === 'auto' && bottomOfNote >= hitLineY && !o.ok) { 
            handleKeyPress(o.note, false);
        }
        
        if(currentMode === 'step' && bottomOfNote >= hitLineY && !o.ok) { 
            isPaused = true; 
            o.y = hitLineY - o.h; 
            currentEl.style.top = o.y + "px";
        }

        if(o.y > fZone.offsetHeight + 200) {
            if(currentEl.parentNode) currentEl.remove();
            const idx = notesOnScreen.findIndex(n => n.id === noteId);
            if (idx > -1) notesOnScreen.splice(idx, 1);
        } else {
            requestAnimationFrame(animate);
        }
    }; 
    
    requestAnimationFrame(animate);
}
function startGame(data, mode) {
    clearTimeout(gameLoopTimeout);
    const fZone = document.getElementById('fall-zone');
    
    if (fZone) {
        fZone.innerHTML = '';
        const hitLine = document.createElement('div');
        hitLine.id = 'hit-line';
        hitLine.style.cssText = `
            position: absolute; bottom: 10px; left: 0; width: 100%; height: 4px;
            background: linear-gradient(90deg, transparent, #fff, var(--accent) 50%, #fff, transparent);
            box-shadow: 0 0 15px var(--accent), 0 0 30px #ff00ff;
            z-index: 999; pointer-events: none;
        `;
        fZone.appendChild(hitLine);
    }
    
    notesOnScreen = []; 
    const mainMenu = document.getElementById('main-menu');
    const gameContainer = document.getElementById('game-container');
    if(mainMenu) mainMenu.style.display='none'; 
    if(gameContainer) gameContainer.style.display='flex';
    
    setTimeout(() => {
        const pianoEl = document.getElementById('piano');
        if (pianoEl && fZone) {
            fZone.style.width = pianoEl.offsetWidth + "px";
        }
    }, 100);
    
    notesValidated = 0; 
    totalNotesInLevel = data.notes.length; 
    isPaused = false; 
    currentMode = mode;
    
    let i = 0;
    const next = () => {
        if (isPaused) { gameLoopTimeout = setTimeout(next, 100); return; }
        if(i < data.notes.length) {
            drop(data.notes[i]); 
            i++;
            gameLoopTimeout = setTimeout(next, data.notes[i-1].d || 800);
        }
    };
    next();
}

function setSpeed(speed) {
    currentSpeed = speed;
    document.querySelectorAll('.speed-controls button').forEach(btn => btn.classList.remove('active'));
    if(event && event.target) event.target.classList.add('active');
}

function quitGame() {
    clearTimeout(gameLoopTimeout);
    const mainMenu = document.getElementById('main-menu');
    const gameContainer = document.getElementById('game-container');
    const fZone = document.getElementById('fall-zone');
    
    if(mainMenu) mainMenu.style.display = 'block'; 
    if(gameContainer) gameContainer.style.display = 'none'; 
    if(fZone) fZone.innerHTML = '';
    
    const scoreViewer = document.getElementById('score-viewer-container');
    if(scoreViewer) scoreViewer.style.display = 'none';
    
    notesOnScreen = []; 
    isPaused = true;

    const activeTabBtn = document.querySelector('.tab-btn.active');
    if (activeTabBtn) {
        const onclickAttr = activeTabBtn.getAttribute('onclick');
        if (onclickAttr) {
            const match = onclickAttr.match(/'([^']+)'/);
            if (match && typeof switchTab === 'function') switchTab(match[1]); 
        }
    }
}

// === Profils ===
function updateProfileDisplay() {
    const list = document.getElementById('profiles-list'); 
    if (list) {
        list.innerHTML = '';
        profiles.forEach((p, index) => {
            const item = document.createElement('div'); 
            item.className = 'profile-item';
            item.style.borderLeft = `4px solid ${p.color}`;
            item.innerHTML = `<span>${p.avatar} ${p.name} ${p.name === currentProfileName ? '✅' : ''}</span><button onclick="deleteProfile(${index}, event)" class="btn-del">❌</button>`;
            item.onclick = () => selectProfile(p.name); 
            list.appendChild(item);
        });
    }
    const curr = profiles.find(p => p.name === currentProfileName) || profiles[0];
    const displayUser = document.getElementById('display-username');
    if (displayUser) displayUser.textContent = curr.name;
    document.documentElement.style.setProperty('--accent', curr.color);
}

function createNewProfile() {
    const input = document.getElementById('input-username');
    const name = input?.value.trim();
    if (name) {
        profiles.push({ name: name, color: '#00f2ff', avatar: selectedEmoji, role: selectedRole, completed: [] });
        localStorage.setItem('pk_profiles', JSON.stringify(profiles));
        updateProfileDisplay();
        if (input) input.value = '';
        closeProfileModal();
    }
}

function deleteProfile(i, e) { 
    e.stopPropagation(); 
    if(profiles.length > 1 && confirm("Supprimer ce profil ?")) { 
        profiles.splice(i, 1); 
        localStorage.setItem('pk_profiles', JSON.stringify(profiles)); 
        updateProfileDisplay(); 
    } 
}

function selectProfile(n) { 
    currentProfileName = n; 
    localStorage.setItem('pk_current', n); 
    updateProfileDisplay(); 
    closeProfileModal(); 
    switchTab('cours'); 
}

function openProfileModal() {
    const currentName = document.getElementById('display-username')?.innerText;
    const authModal = document.getElementById('auth-modal');
    const profileModal = document.getElementById('profile-modal');
    if (currentName === "Invité" || currentName === "Apprenti") {
        if (authModal) authModal.style.display = 'flex';
    } else {
        if (profileModal) profileModal.style.display = 'flex';
        setupEmojiPicker();
    }
}

function closeProfileModal() { 
    const modal = document.getElementById('profile-modal');
    if (modal) modal.style.display = 'none'; 
}

function saveProgress(title) {
    const currentP = profiles.find(p => p.name === currentProfileName);
    if(currentP) {
        if(!currentP.completed) currentP.completed = [];
        if(!currentP.completed.includes(title)) {
            currentP.completed.push(title);
            localStorage.setItem('pk_profiles', JSON.stringify(profiles));
        }
    }
}

function getFreq(n) { 
    const noteName = n.slice(0, -1);
    const octave = parseInt(n.slice(-1));
    const semitones = noteStrings.indexOf(noteName) + (octave - 4) * 12 - 9;
    return 440 * Math.pow(2, semitones / 12); 
}

// === Microphone ===
async function toggleMic() {
    const btn = document.getElementById('mic-toggle');
    if (!isMicActive) {
        try {
            microphoneStream = await navigator.mediaDevices.getUserMedia({ 
                audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: false } 
            });

            if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
            if (audioContext.state === 'suspended') await audioContext.resume();

            const source = audioContext.createMediaStreamSource(microphoneStream);
            audioAnalyser = audioContext.createAnalyser(); 
            audioAnalyser.fftSize = 2048; 
            source.connect(audioAnalyser);

            isMicActive = true; 
            if (btn) { btn.textContent = "🎤 Micro ON"; btn.classList.add('mic-active'); }
            
            const detect = () => {
                if (!isMicActive) return;
                audioAnalyser.getFloatTimeDomainData(pitchBuffer);
                let f = autoCorrelate(pitchBuffer, audioContext.sampleRate);
                if (f !== -1 && f > 60 && f < 2000) {
                    let n = getNoteFromFreq(f); 
                    if (n) handleKeyPress(n); 
                }
                requestAnimationFrame(detect);
            }; 
            detect();
        } catch (err) { alert("Impossible d'activer le micro : " + err.message); }
    } else {
        isMicActive = false; 
        if (btn) { btn.textContent = "🎤 Micro OFF"; btn.classList.remove('mic-active'); }
        if (microphoneStream) microphoneStream.getTracks().forEach(t => t.stop());
    }
}

function autoCorrelate(b, s) {
    let rms = 0; 
    for(let i=0; i<b.length; i++) rms += b[i]*b[i]; 
    rms = Math.sqrt(rms/b.length);
    if(rms < 0.01) return -1;
    
    let r1=0, r2=b.length-1, thres=0.2;
    for(let i=0; i<b.length/2; i++) if(Math.abs(b[i])<thres){r1=i;break;}
    for(let i=1; i<b.length/2; i++) if(Math.abs(b[b.length-i])<thres){r2=b.length-i;break;}
    if (r2 <= r1) return -1;
    
    let b2 = b.slice(r1,r2);
    let c = new Float32Array(b2.length);
    for(let i=0; i<b2.length; i++) for(let j=0; j<b2.length-i; j++) c[i] += b2[j]*b2[j+i];
    
    let d=0; while(d < c.length - 1 && c[d]>c[d+1]) d++;
    let maxv=-1, maxp=-1; 
    for(let i=d; i<b2.length; i++) if(c[i]>maxv){maxv=c[i];maxp=i;}
    if (maxp <= 0 || maxp >= c.length - 1) return -1;
    
    const x1 = c[maxp-1], x2 = c[maxp], x3 = c[maxp+1];
    const a = (x1 + x3 - 2*x2) / 2;
    const b_coeff = (x3 - x1) / 2;
    if (a === 0) return s / maxp;
    const peak = maxp - b_coeff / (2 * a);
    return s / peak;
}

function getNoteFromFreq(f) {
    if (f < 50 || f > 4000) return null;
    const n = 69 + 12 * Math.log2(f / 440); 
    const rounded = Math.round(n);
    if(isNaN(rounded)) return null;
    return noteStrings[rounded % 12] + (Math.floor(rounded/12)-1);
}

// === MIDI Hardware ===
function setupMIDI() {
    if (navigator.requestMIDIAccess) {
        navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
    }
}

function onMIDISuccess(midiAccess) {
    console.log("MIDI prêt !");
    for (let input of midiAccess.inputs.values()) {
        input.onmidimessage = handleMIDIMessage;
    }
    midiAccess.onstatechange = (e) => { if(e.port.state === 'connected') setupMIDI(); };
}

function onMIDIFailure() { console.log("MIDI non disponible."); }

function handleMIDIMessage(event) {
    const [command, note, velocity] = event.data;
    if (command === 144 && velocity > 0) {
        const noteName = midiNoteToName(note);
        handleKeyPress(noteName);
    }
}

function midiNoteToName(midiNumber) {
    const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const octave = Math.floor(midiNumber / 12) - 1;
    return notes[midiNumber % 12] + octave; 
}

function toggleColorMode() {
    const btn = document.getElementById('color-mode-btn');
    if (!btn) return;
    if (colorMode === 'debutant') {
        colorMode = 'intermediaire';
        btn.textContent = "Intermédiaire";
        btn.style.color = "#2196F3";
} else if (colorMode === 'intermediaire') {
    colorMode = 'expert';
    btn.textContent = "Expert"; // Nouveau nom
    btn.style.color = "#ff0000"; 
} else {
        colorMode = 'debutant';
        btn.textContent = "Débutant";
        btn.style.color = "var(--accent)";
    }
    initPiano();
}
function createNoteImpact(x, y, color) {
    const fZone = document.getElementById('fall-zone');
    if (!fZone) return;
    const ring = document.createElement('div');
    ring.className = 'impact-ring-massive';
    ring.style.left = x + 'px';
    ring.style.top = y + 'px';
    ring.style.borderColor = color;
    ring.style.boxShadow = `0 0 30px ${color}`;
    fZone.appendChild(ring);
    setTimeout(() => ring.remove(), 600);
}

function createContinuousSteam(x, y, color) {
    const fZone = document.getElementById('fall-zone');
    if (!fZone) return;
    const steam = document.createElement('div');
    steam.className = 'note-steam';
    steam.style.left = (x + (Math.random() - 0.5) * 30) + 'px';
    steam.style.top = y + 'px';
    steam.style.backgroundColor = color;
    fZone.appendChild(steam);
    setTimeout(() => steam.remove(), 800);
}
// ==========================================
// EXPORTS GLOBAUX - DERNIER BLOC DU FICHIER
// ==========================================

window.openPartitionModal = openPartitionModal;
window.closePartitionModal = closePartitionModal;
window.loadPartitionFile = loadPartitionFile;
window.setImportDifficulty = setImportDifficulty;
window.transposeImport = transposeImport;
window.openLibrary = openLibrary;
window.toggleColorMode = toggleColorMode;
window.toggleFullScreen = toggleFullScreen;
window.switchTab = switchTab;
window.setSpeed = setSpeed;
window.openProfileModal = openProfileModal;
window.closeProfileModal = closeProfileModal;
window.createNewProfile = createNewProfile;
window.deleteProfile = deleteProfile;
window.selectProfile = selectProfile;
window.setRole = setRole;
window.openPricing = openPricing;
window.closePricing = closePricing;
window.unlockPro = unlockPro;
window.quitGame = quitGame;
