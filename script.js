// script.js - Piano complet avec notes passant sous la ligne

const noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const noteNamesFR = { 'C': 'DO', 'D': 'RÉ', 'E': 'MI', 'F': 'FA', 'G': 'SOL', 'A': 'LA', 'B': 'SI' };
const noteColors = { 'C': '#FF0000', 'D': '#FF7F00', 'E': '#FFFF00', 'F': '#00FF00', 'G': '#0000FF', 'A': '#4B0082', 'B': '#8B00FF' };

let gameLoopTimeout;
let currentSpeed = 4;
window.isPro = window.isPro || false;

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
        { titre: "Rick Astley", diff: 'medium', notes: [{note:'C4', d:200}, {note:'D4', d:200}, {note:'F4', d:200}] }
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
        alert('Veuillez d\'abord sélectionner un fichier MIDI');
        return;
    }

    try {
        console.log("Chargement:", selectedPartitionFile.name);
        await partitionTranslator.loadFromFile(selectedPartitionFile);
        
        if (currentImportTranspose !== 0) {
            partitionTranslator.transpose(currentImportTranspose);
        }
        
        const gameNotes = partitionTranslator.convertToGameFormat(currentSpeed / 4);
        console.log("Notes converties:", gameNotes.length);
        
        closePartitionModal();
        
        const partitionData = {
            titre: `🎼 ${selectedPartitionFile.name.replace(/\.[^/.]+$/, '')}`,
            diff: 'custom',
            notes: gameNotes
        };
        
        currentLevelTitle = partitionData.titre;
        const scoreViewer = document.getElementById('score-viewer-container');
        if (scoreViewer) scoreViewer.style.display = 'none';
        
        startGame(partitionData, 'auto');
        
    } catch (error) {
        alert('Erreur lors du chargement: ' + error.message);
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
    if (colorMode === 'expert') return '#ff4500';
    if (colorMode === 'intermediaire') return '#00d9ff';
    const base = note.replace(/[0-9#]/g, '');
    return noteColors[base] || '#00f2ff';
}
// REMPLACEZ votre fonction createNoteEvaporation par celle-ci :
function createNoteEvaporation(x, y, color, noteHeight) {
    const fZone = document.getElementById('fall-zone');
    if (!fZone || !x || !y) return;
    
    const isLong = noteHeight > 120;
    const points = isLong ? Math.min(6, Math.floor(noteHeight / 20)) : 1;
    
    // 1. PARTICULES PROGRESSIVES (votre code qui marche)
    for (let pos = 0; pos < points; pos++) {
        const progress = pos / (points - 1 || 1);
        const yPos = y - (noteHeight * progress * 0.9);
        const delay = pos * 60; // Plus rapide (60ms au lieu de 80ms)
        
        setTimeout(() => {
            if (!document.getElementById('fall-zone')) return;
            
            // Plus de particules pour les notes longues
            const particleCount = isLong ? 8 : 5;
            
            for(let i = 0; i < particleCount; i++) {
                const p = document.createElement('div');
                const size = 2 + Math.random() * 3;
                const spreadX = (Math.random() - 0.5) * (isLong ? 40 : 30);
                
                p.style.cssText = `
                    position: absolute;
                    left: ${x + spreadX}px;
                    top: ${yPos}px;
                    width: ${size}px;
                    height: ${size}px;
                    background: ${color};
                    border-radius: 50%;
                    box-shadow: 0 0 ${size * 2}px ${color}, 0 0 ${size * 4}px ${color}66;
                    pointer-events: none;
                    z-index: 60;
                    opacity: 0;
                    animation: riseFade ${0.5 + Math.random() * 0.3}s ease-out forwards;
                    --rise: -${30 + Math.random() * 40}px;
                `;
                
                fZone.appendChild(p);
                setTimeout(() => { if(p.parentNode) p.remove(); }, 800);
            }
            
            // 2. TRAÎNÉES VERTICALES (uniquement pour notes longues, 1 sur 2)
            if(isLong && pos % 2 === 0) {
                const trail = document.createElement('div');
                trail.style.cssText = `
                    position: absolute;
                    left: ${x + (Math.random() - 0.5) * 20}px;
                    top: ${yPos}px;
                    width: 2px;
                    height: ${30 + Math.random() * 20}px;
                    background: linear-gradient(to top, ${color}88, transparent);
                    border-radius: 50%;
                    pointer-events: none;
                    z-index: 59;
                    opacity: 0;
                    animation: trailUp 0.7s ease-out forwards;
                `;
                fZone.appendChild(trail);
                setTimeout(() => { if(trail.parentNode) trail.remove(); }, 700);
            }
        }, delay);
    }
    
    // 3. VAGUE LUMINEUSE qui remonte vite (pour les longues)
    if(isLong) {
        const wave = document.createElement('div');
        wave.style.cssText = `
            position: absolute;
            left: ${x}px;
            top: ${y}px;
            width: 35px;
            height: ${noteHeight}px;
            background: linear-gradient(to top, ${color}00, ${color}55, ${color}00);
            transform: translate(-50%, 0);
            pointer-events: none;
            z-index: 58;
            filter: blur(5px);
            opacity: 0;
            animation: waveClimb 0.8s ease-out forwards;
        `;
        fZone.appendChild(wave);
        setTimeout(() => { if(wave.parentNode) wave.remove(); }, 800);
    }
    
    // 4. EXPLOSION AU POINT D'IMPACT (toujours)
    for(let i = 0; i < 12; i++) {
        const p = document.createElement('div');
        const angle = Math.random() * Math.PI;
        const power = 20 + Math.random() * 40;
        
        p.style.cssText = `
            position: absolute;
            left: ${x}px;
            top: ${y}px;
            width: 2px;
            height: 2px;
            background: white;
            border-radius: 50%;
            box-shadow: 0 0 4px ${color};
            pointer-events: none;
            z-index: 61;
            animation: impactPop 0.4s ease-out forwards;
            --tx: ${Math.cos(angle) * power}px;
            --ty: ${-Math.sin(angle) * power}px;
        `;
        fZone.appendChild(p);
        setTimeout(() => { if(p.parentNode) p.remove(); }, 400);
    }
    
    // CSS (inchangé + ajouts)
    if (!document.getElementById('simple-evap')) {
        const s = document.createElement('style');
        s.id = 'simple-evap';
        s.textContent = `
            @keyframes riseFade {
                0% { transform: translate(-50%, 0) scale(1); opacity: 0.9; }
                100% { transform: translate(-50%, var(--rise)) scale(0); opacity: 0; }
            }
            @keyframes trailUp {
                0% { transform: translate(-50%, 0) scaleY(1); opacity: 0.6; }
                100% { transform: translate(-50%, -40px) scaleY(0); opacity: 0; }
            }
            @keyframes waveClimb {
                0% { transform: translate(-50%, 0) scaleY(0); opacity: 0.8; }
                100% { transform: translate(-50%, -${noteHeight}px) scaleY(1); opacity: 0; }
            }
            @keyframes impactPop {
                0% { transform: translate(-50%, -50%) translate(0, 0); opacity: 1; }
                100% { transform: translate(-50%, -50%) translate(var(--tx), var(--ty)); opacity: 0; }
            }
        `;
        document.head.appendChild(s);
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
    // Animation de la touche du piano
    const k = document.querySelector(`.key[data-note="${note}"]`);
    if(k) { 
        const color = getNoteColor(note);
        k.style.backgroundColor = color;
        k.style.boxShadow = `0 0 20px ${color}`;
        k.style.transform = 'translateY(2px)';
        
        setTimeout(() => {
            k.style.backgroundColor = "";
            k.style.boxShadow = "";
            k.style.transform = "";
        }, 150);
    }

    // Trouver la note correspondante à l'écran
    const t = notesOnScreen.find(n => n.note === note && !n.ok);
    
    if(t) {
        const noteDuration = (t.d || 400) / 1000;
        playNoteSound(getFreq(note), noteDuration);
        
        // Marquer comme jouée
        t.ok = true; 
        notesValidated++;
        
        const fZone = document.getElementById('fall-zone');
        const noteElement = document.getElementById(t.id);
        
// Dans handleKeyPress, remplacez l'appel par :
if(noteElement && fZone) {
    const noteLeft = parseInt(noteElement.style.left) || 0;
    const noteWidth = parseInt(noteElement.style.width) || 40;
    const centerX = noteLeft + noteWidth / 2;
    const hitLineY = document.getElementById('hit-line')?.offsetTop || (fZone.offsetHeight - 20);
    
    // Récupérer la hauteur de la note depuis l'objet t (o.h)
    const noteHeight = t.h || 80;
    
    // Évaporation adaptée à la longueur
    createNoteEvaporation(centerX, hitLineY, getNoteColor(note), noteHeight);
    
    // Dissolution visuelle de la note elle-même
    noteElement.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    noteElement.style.opacity = '0.1';
    noteElement.style.transform = 'scale(0.95)';
    noteElement.style.zIndex = '1';
    
    // Nettoyer après
    setTimeout(() => {
        noteElement.style.willChange = 'auto';
    }, 1000);
}
        
        // Libérer la pause en mode step
        isPaused = false; 
        
        // Fin du niveau
        if(notesValidated === totalNotesInLevel) { 
            saveProgress(currentLevelTitle); 
            setTimeout(() => { 
                alert("Bravo ! Niveau terminé !"); 
                quitGame(); 
            }, 1000); 
        }
    } else if(isManual) {
        // Son si joué manuellement sans note à l'écran
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

// === FONCTION CRITIQUE MODIFIÉE : NOTES PASSANT SOUS LA LIGNE ===
function drop(nData) {
    const fZone = document.getElementById('fall-zone');
    const targetKey = document.querySelector(`.key[data-note="${nData.note}"]`);
    if(!targetKey || !fZone) return;

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
    
    let baseColor, trailColor;
    const noteBase = nData.note.replace(/[0-9#]/g, '');
    
    if (colorMode === 'expert') {
        baseColor = '#ff4500';
        trailColor = 'rgba(255, 100, 0, 0.9)';
    } else if (colorMode === 'intermediaire') {
        baseColor = '#00f5ff';
        trailColor = 'rgba(0, 245, 255, 0.8)';
    } else {
        baseColor = noteColors[noteBase] || '#00f2ff';
        trailColor = baseColor + 'CC';
    }

el.style.cssText = `
    position: absolute;
    left: ${leftPos}px;
    width: ${width}px;
    height: ${calculatedHeight}px;
    top: ${o.y}px;
    border-radius: 15px 15px 8px 8px;
    border: 2px solid rgba(255, 255, 255, 0.6);
    border-bottom: 3px solid rgba(255, 255, 255, 0.4);
    box-shadow: 
        0 0 20px ${baseColor}66,
        0 0 40px ${baseColor}33,
        inset 0 0 15px rgba(255, 255, 255, 0.3),
        inset 0 -5px 10px rgba(0, 0, 0, 0.2);
    background: linear-gradient(180deg, 
        rgba(255, 255, 255, 0.4) 0%,
        ${baseColor}66 20%,
        ${baseColor}44 50%,
        ${baseColor}22 80%,
        rgba(255, 255, 255, 0.1) 100%);
    opacity: 0.6;
    backdrop-filter: blur(2px);
    z-index: 50;
`;

    const hand = nData.m || (parseInt(nData.note.slice(-1)) <= 3 ? 'G' : 'D');
    const finger = nData.f || 1;
    const displayNote = noteNamesFR[noteBase] || noteBase;

    let noteContent = '';
    
    if (colorMode === 'expert') {
        noteContent = `
            ${calculatedHeight > 100 ? `
            <div style="position: absolute; top: 20%; left: 50%; transform: translateX(-50%);
                        width: 60%; height: 60%; 
                        background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.3), transparent);
                        opacity: 0.5; pointer-events: none; filter: blur(1px);"></div>
            ` : ''}
            <div style="position: absolute; top: 5px; left: 50%; transform: translateX(-50%);
                        width: 80%; height: 20px; background: rgba(255,255,255,0.6);
                        border-radius: 50%; filter: blur(3px); opacity: 0.8;"></div>
        `;
    } else {
        noteContent = `
            <div style="position: absolute; top: -12px; left: 50%; transform: translateX(-50%); 
                        padding: 4px 12px; border-radius: 20px; font-size: 14px; z-index: 20;
                        min-width: 30px; text-align: center; letter-spacing: 1px; font-weight: bold;
                        background: ${baseColor}; color: #000; border: 2px solid white; 
                        box-shadow: 0 0 15px ${baseColor}, 0 2px 5px rgba(0,0,0,0.3);">
                ${hand}${finger}
            </div>
            
            <div style="position: absolute; bottom: -12px; left: 50%; transform: translateX(-50%); 
                        padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: bold; 
                        z-index: 20; background: rgba(255,255,255,0.95); color: #000; 
                        border: 1px solid ${baseColor}; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
                ${displayNote}${nData.note.includes('#') ? '#' : ''}
            </div>
            
            ${calculatedHeight > 100 ? `
            <div style="position: absolute; top: 30%; left: 50%; transform: translateX(-50%);
                        width: 2px; height: 40%; background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.8), transparent);
                        opacity: 0.6; pointer-events: none;"></div>
            ` : ''}
        `;
    }

    el.innerHTML = noteContent;
    fZone.appendChild(el);

    const hitLine = document.getElementById('hit-line');
    const hitLineY = hitLine ? hitLine.offsetTop : (fZone.offsetHeight - 20);

    const animate = () => {
        const currentEl = document.getElementById(noteId);
        if (!currentEl) return;

        // Continue d'animer même si la note est jouée (o.ok = true)
        if(!isPaused || o.ok) {
            o.y += currentSpeed;
            currentEl.style.top = o.y + "px";
        }
        
        const bottomOfNote = o.y + o.h;
        
if(currentMode === 'auto' && bottomOfNote >= hitLineY && !o.ok) { 
    handleKeyPress(o.note, false);
    // PAS DE return ici ! La note doit continuer de descendre
}
        
        if(currentMode === 'step' && bottomOfNote >= hitLineY && !o.ok) { 
            isPaused = true; 
            o.y = hitLineY - o.h; 
            currentEl.style.top = o.y + "px";
        }

        // Supprimer seulement quand sorti en bas (sous le piano)
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
        btn.textContent = "🔥 EXPERT";
        btn.style.color = "#ff00ff";
    } else {
        colorMode = 'debutant';
        btn.textContent = "Débutant";
        btn.style.color = "var(--accent)";
    }
    initPiano();
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
