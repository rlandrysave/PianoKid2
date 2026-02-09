// script.js - Piano complet corrigé avec progression et déblocage

const noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const noteNamesFR = { 'C': 'DO', 'D': 'RÉ', 'E': 'MI', 'F': 'FA', 'G': 'SOL', 'A': 'LA', 'B': 'SI' };
const noteColors = { 'C': '#FF0000', 'D': '#FF7F00', 'E': '#FFFF00', 'F': '#007c00', 'G': '#7700ff', 'A': '#00ffff', 'B': '#8B00FF' };

function getFrequency(note) {
    if (!note) return null;
    const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const octave = parseInt(note.slice(-1));
    const noteName = note.slice(0, -1);
    const keyNumber = notes.indexOf(noteName);
    if (keyNumber === -1) return null;
    return 440 * Math.pow(2, (keyNumber - 9 + (octave - 4) * 12) / 12);
}
let gameLoopTimeout;
let currentSpeed = 4;
window.isPro = true;
let sessionTimings = [];
let sessionErrors = 0;
let selectedRole = 'enfant';
let selectedEmoji = '🎹';
let audioContext, notesOnScreen = [], isPaused = false, currentMode = 'step';
let totalNotesInLevel = 0, notesValidated = 0;
let profiles = JSON.parse(localStorage.getItem('pk_profiles')) || [{name: "Apprenti", color: "#00f2ff", avatar: "🎹", role: "enfant", completed: []}];
let currentProfileName = localStorage.getItem('pk_current') || "Apprenti";
let currentLevelTitle = "", isMicActive = false;
let audioAnalyser, microphoneStream, pitchBuffer = new Float32Array(2048);
let colorMode = 'debutant';
let currentLevelDiff = 'medium';
let partitionTranslator = null;
let currentImportDifficulty = 'normal';
let currentImportTranspose = 0;
let selectedPartitionFile = null;
let currentLevelData = null; // Stockage des données du niveau actuel
let currentTabType = 'cours'; // Pour savoir dans quelle catégorie on est
let currentSubLevel = 1; // 1 pour facile (.1), 2 pour normal (.2)
let activeChordNotes = new Set();
const DATA = {
   cours: [
    { id: "c1", title: "1. DO - RÉ - MI (Main Droite)", icon: "🟢", diff: 'easy', notes: [{note:'C4',f:1,d:400},{note:'D4',f:2,d:400},{note:'E4',f:3,d:400},{note:'D4',f:2,d:400},{note:'C4',f:1,d:400},{note:'D4',f:2,d:400},{note:'E4',f:3,d:400},{note:'D4',f:2,d:400},{note:'C4',f:1,d:800}] },
    { id: "c2", title: "2. La Main Droite complète (DO-SOL)", icon: "🖐️", diff: 'easy', notes: [{note:'C4',f:1,d:400},{note:'D4',f:2,d:400},{note:'E4',f:3,d:400},{note:'F4',f:4,d:400},{note:'G4',f:5,d:600},{note:'F4',f:4,d:400},{note:'E4',f:3,d:400},{note:'D4',f:2,d:400},{note:'C4',f:1,d:800},{note:'E4',f:3,d:400},{note:'G4',f:5,d:800}] },
    { id: "c3", title: "3. La Main Gauche (DO3-SOL3)", icon: "🤚", diff: 'easy', notes: [{note:'C3',m:'G',f:5,d:400},{note:'D3',m:'G',f:4,d:400},{note:'E3',m:'G',f:3,d:400},{note:'F3',m:'G',f:2,d:400},{note:'G3',m:'G',f:1,d:600},{note:'F3',m:'G',f:2,d:400},{note:'E3',m:'G',f:3,d:400},{note:'D3',m:'G',f:4,d:400},{note:'C3',m:'G',f:5,d:800}]},
    { id: "c4", title: "4. Extension : Le LA (6 notes)", icon: "🚀", diff: 'easy', notes: [{note:'C4',f:1,d:400},{note:'E4',f:3,d:400},{note:'G4',f:5,d:400},{note:'A4',f:5,d:400},{note:'G4',f:5,d:400},{note:'F4',f:4,d:400},{note:'E4',f:3,d:400},{note:'D4',f:2,d:400},{note:'C4',f:1,d:800}] },
    { id: "c5", title: "5. Saut d'Octave (DO3 à DO4)", icon: "🦘", diff: 'medium', notes: [{note:'C3',m:'G',f:1,d:400},{note:'C4',m:'D',f:1,d:400},{note:'C3',m:'G',f:1,d:400},{note:'C4',m:'D',f:1,d:400},{note:'E3',m:'G',f:3,d:400},{note:'E4',m:'D',f:3,d:400},{note:'G3',m:'G',f:5,d:400},{note:'G4',m:'D',f:5,d:800}] },
    { id: "c6", title: "6. Accords de base (DO Majeur)", icon: "🎹", diff: 'medium', notes: [{note:'C4',f:1,d:800},{note:'E4',f:3,d:800},{note:'G4',f:5,d:800},{note:'C4',f:1,d:400},{note:'E4',f:3,d:400},{note:'G4',f:5,d:800},{note:'G4',f:5,d:400},{note:'E4',f:3,d:400},{note:'C4',f:1,d:800}] },
    { id: "c7", title: "7. Passage du Pouce (Gamme)", icon: "🔄", diff: 'medium', notes: [{note:'C4',f:1,d:400},{note:'D4',f:2,d:400},{note:'E4',f:3,d:400},{note:'F4',f:1,d:400},{note:'G4',f:2,d:400},{note:'A4',f:3,d:400},{note:'B4',f:4,d:400},{note:'C5',f:5,d:800},{note:'B4',f:4,d:400},{note:'A4',f:3,d:400},{note:'G4',f:2,d:400},{note:'F4',f:1,d:400},{note:'E4',f:3,d:400},{note:'D4',f:2,d:400},{note:'C4',f:1,d:800}] },
    { id: "c8", title: "8. Les Touches Noires (FA#)", icon: "🖤", diff: 'hard', notes: [{note:'D4',f:1,d:400},{note:'F#4',f:3,d:400},{note:'A4',f:5,d:400},{note:'F#4',f:3,d:400},{note:'D4',f:1,d:400},{note:'E4',f:2,d:400},{note:'F#4',f:3,d:400},{note:'G4',f:4,d:800}] },
    { id: "c9", title: "9. Arpège Simple", icon: "✨", diff: 'hard', notes: [{note:'C4',f:1,d:400},{note:'E4',f:2,d:400},{note:'G4',f:3,d:400},{note:'C5',f:5,d:600},{note:'G4',f:3,d:400},{note:'E4',f:2,d:400},{note:'C4',f:1,d:800},{note:'E4',f:2,d:400},{note:'G4',f:3,d:400},{note:'C5',f:5,d:800}] },
    { id: "c10", title: "10. Coordination des mains", icon: "⚖️", diff: 'hard', notes: [{note:'C3',m:'G',f:1,d:400},{note:'C4',m:'D',f:1,d:400},{note:'E3',m:'G',f:3,d:400},{note:'E4',m:'D',f:3,d:400},{note:'G3',m:'G',f:5,d:400},{note:'G4',m:'D',f:5,d:400},{note:'C4',m:'D',f:1,d:800}] },
    { id: "c11", title: "11. Intervalles de Tierces", icon: "🪜", diff: 'medium', notes: [{note:'C4',f:1,d:400},{note:'E4',f:3,d:400},{note:'D4',f:2,d:400},{note:'F4',f:4,d:400},{note:'E4',f:3,d:400},{note:'G4',f:5,d:400},{note:'F4',f:4,d:400},{note:'D4',f:2,d:400},{note:'C4',f:1,d:800}] },
    { id: "c12", title: "12. Accords Mineurs (LA min)", icon: "🎻", diff: 'medium', notes: [{note:'A3',f:1,d:800},{note:'C4',f:2,d:800},{note:'E4',f:4,d:800},{note:'A3',f:1,d:400},{note:'C4',f:2,d:400},{note:'E4',f:4,d:800},{note:'E4',f:4,d:400},{note:'C4',f:2,d:400},{note:'A3',f:1,d:800}] },
    { id: "c13", title: "13. Basse Fondamentale", icon: "🎸", diff: 'hard', notes: [{note:'C3',m:'G',f:5,d:600},{note:'G2',m:'G',f:1,d:600},{note:'C3',m:'G',f:5,d:600},{note:'G2',m:'G',f:1,d:600},{note:'F2',m:'G',f:4,d:600},{note:'G2',m:'G',f:1,d:600},{note:'C3',m:'G',f:5,d:1200}] },
    { id: "c14", title: "14. Noires et Croches", icon: "🥁", diff: 'medium', notes: [{note:'C4',f:1,d:400},{note:'D4',f:2,d:200},{note:'E4',f:3,d:200},{note:'F4',f:4,d:400},{note:'G4',f:5,d:400},{note:'F4',f:4,d:200},{note:'E4',f:3,d:200},{note:'D4',f:2,d:400},{note:'C4',f:1,d:800}] },
    { id: "c15", title: "15. La Gamme de SOL (FA#)", icon: "☀️", diff: 'hard', notes: [{note:'G4',f:1,d:400},{note:'A4',f:2,d:400},{note:'B4',f:3,d:400},{note:'C5',f:1,d:400},{note:'D5',f:2,d:400},{note:'E5',f:3,d:400},{note:'F#5',f:4,d:400},{note:'G5',f:5,d:800}] },
    { id: "c16", title: "16. Le Rythme Pointé", icon: "⚡", diff: 'hard', notes: [{note:'C4',f:1,d:600},{note:'D4',f:2,d:200},{note:'E4',f:3,d:800},{note:'F4',f:4,d:600},{note:'G4',f:5,d:200},{note:'A4',f:5,d:800}] },
    { id: "c17", title: "17. Accords de SOL Majeur", icon: "🎼", diff: 'medium', notes: [{note:'G3',f:1,d:800},{note:'B3',f:3,d:800},{note:'D4',f:5,d:800},{note:'G3',f:1,d:400},{note:'B3',f:3,d:400},{note:'D4',f:5,d:800}] },
    { id: "c18", title: "18. Renversement d'Accord", icon: "🙃", diff: 'hard', notes: [{note:'E4',f:1,d:800},{note:'G4',f:2,d:800},{note:'C5',f:5,d:800},{note:'G4',f:1,d:800},{note:'C5',f:3,d:800},{note:'E5',f:5,d:800}] },
    { id: "c19", title: "19. Gamme de LA Mineur", icon: "🌑", diff: 'hard', notes: [{note:'A3',f:1,d:400},{note:'B3',f:2,d:400},{note:'C4',f:3,d:400},{note:'D4',f:1,d:400},{note:'E4',f:2,d:400},{note:'F4',f:3,d:400},{note:'G4',f:4,d:400},{note:'A4',f:5,d:800}] },
    { id: "c20", title: "20. Mains Ensemble : Octaves", icon: "🏆", diff: 'hard', notes: [{note:'C3',m:'G',f:1,d:400},{note:'C4',m:'D',f:1,d:400},{note:'D3',m:'G',f:2,d:400},{note:'D4',m:'D',f:2,d:400},{note:'E3',m:'G',f:3,d:400},{note:'E4',m:'D',f:3,d:400},{note:'F3',m:'G',f:4,d:400},{note:'F4',m:'D',f:4,d:400},{note:'G3',m:'G',f:5,d:400},{note:'G4',m:'D',f:5,d:800}] }
],   
exercices: [
        { title: "1. Vélocité Hanon n°1", icon: "🏃", diff: 'medium', notes: [{note:'C4',f:1,d:300},{note:'E4',f:2,d:300},{note:'F4',f:3,d:300},{note:'G4',f:4,d:300},{note:'A4',f:5,d:300},{note:'G4',f:4,d:300},{note:'F4',f:3,d:300},{note:'E4',f:2,d:300},{note:'C4',f:1,d:600}] },
        { title: "2. Le Crabe (Indépendance)", icon: "🦀", diff: 'medium', notes: [{note:'C4',f:1,d:300},{note:'D4',f:2,d:300},{note:'C4',f:1,d:300},{note:'E4',f:3,d:300},{note:'C4',f:1,d:300},{note:'F4',f:4,d:300},{note:'C4',f:1,d:300},{note:'G4',f:5,d:600}] },
        { title: "3. Force du Petit Doigt", icon: "💪", diff: 'medium', notes: [{note:'G4',f:5,d:300},{note:'F4',f:4,d:300},{note:'G4',f:5,d:300},{note:'E4',f:3,d:300},{note:'G4',f:5,d:300},{note:'D4',f:2,d:300},{note:'G4',f:5,d:600}] },
        { title: "4. Triolets rapides", icon: "⚡", diff: 'medium', notes: [{note:'C4',f:1,d:200},{note:'D4',f:2,d:200},{note:'E4',f:3,d:200},{note:'D4',f:2,d:200},{note:'E4',f:3,d:200},{note:'F4',f:4,d:200},{note:'E4',f:3,d:200},{note:'F4',f:4,d:200},{note:'G4',f:5,d:400}] },
        { title: "5. Écart de Quarte", icon: "📐", diff: 'medium', notes: [{note:'C4',f:1,d:400},{note:'F4',f:4,d:400},{note:'D4',f:2,d:400},{note:'G4',f:5,d:400},{note:'E4',f:3,d:400},{note:'A4',f:5,d:800}] },
        { title: "6. Octaves Alternées", icon: "🎹", diff: 'hard', notes: [{note:'C3',f:1,d:400},{note:'C4',f:5,d:400},{note:'D3',f:1,d:400},{note:'D4',f:5,d:400},{note:'E3',f:1,d:400},{note:'E4',f:5,d:400},{note:'C3',f:1,d:800}] },
        { title: "7. Gamme Chromatique", icon: "🌈", diff: 'hard', notes: [{note:'C4',f:1,d:250},{note:'C#4',f:3,d:250},{note:'D4',f:1,d:250},{note:'D#4',f:3,d:250},{note:'E4',f:1,d:250},{note:'F4',f:2,d:250},{note:'F#4',f:3,d:500}] },
        { title: "8. Accords de 4 notes", icon: "🎼", diff: 'hard', notes: [{note:'C4',f:1,d:800},{note:'E4',f:1,d:800},{note:'G4',f:3,d:800},{note:'B4',f:5,d:800},{note:'F4',f:1,d:800},{note:'A4',f:2,d:800},{note:'C5',f:3,d:800},{note:'E5',f:5,d:1200}] },
        { title: "9. Vitesse Pouce-Index", icon: "✌️", diff: 'hard', notes: [{note:'C4',f:1,d:200},{note:'D4',f:2,d:200},{note:'C4',f:1,d:200},{note:'D4',f:2,d:200},{note:'E4',f:1,d:200},{note:'F4',f:2,d:200},{note:'E4',f:1,d:200},{note:'F4',f:2,d:400}] },
        { title: "10. Le Grand Final", icon: "🏆", diff: 'hard', notes: [{note:'C4',f:1,d:500},{note:'G4',f:5,d:500},{note:'E4',f:3,d:500},{note:'C5',f:5,d:500},{note:'G4',f:3,d:500},{note:'E4',f:1,d:500},{note:'C4',f:1,d:1000}] },
        { title: "11. Tenues de notes (1-2)", icon: "📍", diff: 'medium', notes: [{note:'C4',f:1,d:800},{note:'D4',f:2,d:200},{note:'E4',f:3,d:200},{note:'D4',f:2,d:200},{note:'C4',f:1,d:800}] },
        { title: "12. Articulation Legato", icon: "🎻", diff: 'medium', notes: [{note:'C4',f:1,d:400},{note:'E4',f:1,d:100},{note:'G4',f:1,d:100},{note:'C4',f:1,d:400},{note:'E4',f:1,d:100},{note:'G4',f:1,d:800}] },
        { title: "13. Grand Saut (C4-C5)", icon: "🏹", diff: 'hard', notes: [{note:'C4',f:1,d:300},{note:'C5',f:5,d:300},{note:'G4',f:3,d:300},{note:'C4',f:1,d:300},{note:'C5',f:5,d:300},{note:'G4',f:3,d:600}] },
        { title: "14. Renforcement 4-5", icon: "🏋️", diff: 'hard', notes: [{note:'F4',f:4,d:200},{note:'G4',f:5,d:200},{note:'F4',f:4,d:200},{note:'G4',f:5,d:200},{note:'A4',f:5,d:200},{note:'G4',f:4,d:200},{note:'F4',f:3,d:400}] },
        { title: "15. Le Trille Rapide", icon: "🐦", diff: 'hard', notes: [{note:'C4',f:2,d:150},{note:'D4',f:3,d:150},{note:'C4',f:2,d:150},{note:'D4',f:3,d:150},{note:'C4',f:2,d:150},{note:'D4',f:3,d:150},{note:'C4',f:2,d:600}] },
        { title: "16. Doubles Notes (Tierces)", icon: "♊", diff: 'hard', notes: [{note:'C4',f:1,d:400},{note:'E4',f:3,d:400},{note:'D4',f:2,d:400},{note:'F4',f:4,d:400},{note:'E4',f:3,d:400},{note:'G4',f:5,d:800}] },
        { title: "17. Croisement de mains", icon: "❌", diff: 'hard', notes: [{note:'C3',m:'G',f:1,d:400},{note:'G3',m:'D',f:1,d:400},{note:'E4',m:'G',f:1,d:400},{note:'C3',m:'G',f:1,d:400},{note:'G3',m:'D',f:1,d:400}] },
        { title: "18. Accords Brisés", icon: "💔", diff: 'medium', notes: [{note:'C4',f:1,d:200},{note:'E4',f:3,d:200},{note:'G4',f:5,d:200},{note:'E4',f:3,d:200},{note:'C4',f:1,d:200},{note:'E4',f:3,d:200},{note:'G4',f:5,d:600}] },
        { title: "19. Saut de Quinte", icon: "🎯", diff: 'hard', notes: [{note:'C4',f:1,d:300},{note:'G4',f:5,d:300},{note:'C4',f:1,d:300},{note:'G4',f:5,d:300},{note:'D4',f:2,d:300},{note:'A4',f:5,d:600}] },
        { title: "20. Accélération", icon: "🏎️", diff: 'hard', notes: [{note:'C4',d:400},{note:'D4',d:300},{note:'E4',d:200},{note:'F4',d:100},{note:'G4',d:100},{note:'A4',d:100},{note:'B4',d:100},{note:'C5',d:800}] }
    ],
apprentissage: [
        { title: "Hallelujah", icon: "🙏", diff: 'easy', notes: [{note:'E4',f:1,d:600},{note:'G4',f:3,d:300},{note:'G4',f:3,d:600},{note:'A4',f:4,d:300},{note:'A4',f:4,d:300},{note:'G4',f:3,d:800}] },
        { title: "Ode à la Joie", icon: "🇪🇺", diff: 'easy', notes: [{note: "E4", d: 400, f: 3}, {note: "E4", d: 400, f: 3}, {note: "F4", d: 400, f: 4}, {note: "G4", d: 400, f: 5}, {note: "G4", d: 400, f: 5}, {note: "F4", d: 400, f: 4}, {note: "E4", d: 400, f: 3}, {note: "D4", d: 400, f: 2}, {note: "C4", d: 400, f: 1}, {note: "C4", d: 400, f: 1}, {note: "D4", d: 400, f: 2}, {note: "E4", d: 400, f: 3}, {note: "E4", d: 600, f: 3}, {note: "D4", d: 200, f: 2}, {note: "D4", d: 800, f: 2}] },
        { title: "Jurassic Park", icon: "🦖", diff: 'hard', notes: [{note: "Bb3", d: 400, f: 1}, {note: "A3", d: 400, f: 2}, {note: "Bb3", d: 400, f: 1}, {note: "F3", d: 800, f: 1}, {note: "Bb3", d: 400, f: 1}, {note: "A3", d: 400, f: 2}, {note: "Bb3", d: 400, f: 1}, {note: "F3", d: 800, f: 1}, {note: "Bb3", d: 400}, {note: "A3", d: 400}, {note: "C4", d: 400}, {note: "Bb3", d: 200}, {note: "A3", d: 800}] },
        { title: "Harry Potter", icon: "⚡", diff: 'hard', notes: [{note: "B3", d: 200}, {note: "E4", d: 300}, {note: "G4", d: 150}, {note: "F#4", d: 150}, {note: "E4", d: 450}, {note: "B4", d: 250}, {note: "A4", d: 800}, {note: "F#4", d: 450}, {note: "E4", d: 300}, {note: "G4", d: 150}, {note: "F#4", d: 150}, {note: "D#4", d: 450}, {note: "F4", d: 250}, {note: "B3", d: 800}] },
        { title: "Pirates des Caraïbes", icon: "🏴‍☠️", diff: 'hard', notes: [{note: "A3", d: 150}, {note: "C4", d: 150}, {note: "D4", d: 400}, {note: "D4", d: 400}, {note: "D4", d: 150}, {note: "E4", d: 150}, {note: "F4", d: 400}, {note: "F4", d: 400}, {note: "F4", d: 150}, {note: "G4", d: 150}, {note: "E4", d: 400}, {note: "E4", d: 400}, {note: "D4", d: 150}, {note: "C4", d: 150}, {note: "D4", d: 800}] },
        { title: "Interstellar", icon: "🚀", diff: 'hard', notes: [{note: "A4", d: 350}, {note: "E4", d: 350}, {note: "A4", d: 350}, {note: "E4", d: 350}, {note: "B4", d: 350}, {note: "E4", d: 350}, {note: "C5", d: 350}, {note: "E4", d: 350}, {note: "A4", d: 350}, {note: "E4", d: 350}, {note: "A4", d: 800}] },
        { title: "Imagine (Intro)", icon: "🕊️", diff: 'medium', notes: [{note: "C4", d: 400}, {note: "E4", d: 400}, {note: "G4", d: 400}, {note: "E4", d: 200}, {note: "G4", d: 200}, {note: "C4", d: 400}, {note: "F4", d: 400}, {note: "A4", d: 400}, {note: "F4", d: 200}, {note: "A4", d: 200}] },
        { title: "Bella Ciao", icon: "🎭", diff: 'medium', notes: [{note: "E4", d: 200}, {note: "A4", d: 200}, {note: "B4", d: 200}, {note: "C5", d: 200}, {note: "A4", d: 600}, {note: "E4", d: 200}, {note: "A4", d: 200}, {note: "B4", d: 200}, {note: "C5", d: 200}, {note: "A4", d: 600}, {note: "A4", d: 200}, {note: "C5", d: 200}, {note: "B4", d: 200}, {note: "A4", d: 200}, {note: "E5", d: 800}] },
        { title: "Tetris Theme", icon: "🧱", diff: 'medium', notes: [{note:'E4',d:400},{note:'B3',d:200},{note:'C4',d:200},{note:'D4',d:400},{note:'C4',d:200},{note:'B3',d:200},{note:'A3',d:400},{note:'A3',d:200},{note:'C4',d:200},{note:'E4',d:400},{note:'D4',d:200},{note:'C4',d:200},{note:'B3',d:400}] },
        { title: "Mario Bros Theme", icon: "🍄", diff: 'hard', notes: [{note:'E5',d:150},{note:'E5',d:300},{note:'E5',d:300},{note:'C5',d:150},{note:'E5',d:300},{note:'G5',d:600},{note:'G4',d:600}] },
        { title: "Au Clair de la Lune", icon: "🌙", diff: 'easy', notes: [{note:'C4',d:400},{note:'C4',d:400},{note:'C4',d:400},{note:'D4',d:400},{note:'E4',d:800},{note:'D4',d:800},{note:'C4',d:400},{note:'E4',d:400},{note:'D4',d:400},{note:'D4',d:400},{note:'C4',d:1200}] },
        { title: "Une Souris Verte", icon: "🐭", diff: 'easy', notes: [{note:'G4',d:200},{note:'G4',d:200},{note:'G4',d:200},{note:'E4',d:400},{note:'C4',d:400},{note:'G4',d:200},{note:'G4',d:200},{note:'G4',d:200},{note:'E4',d:400},{note:'C4',d:400}] },
        { title: "Frère Jacques", icon: "🔔", diff: 'easy', notes: [{note:'C4',d:400},{note:'D4',d:400},{note:'E4',d:400},{note:'C4',d:400},{note:'C4',d:400},{note:'D4',d:400},{note:'E4',d:400},{note:'C4',d:400},{note:'E4',d:400},{note:'F4',d:400},{note:'G4',d:800}] },
        { title: "Libérée Délivrée", icon: "❄️", diff: 'hard', notes: [{note:'F4',d:200},{note:'G4',d:200},{note:'G#4',d:400},{note:'G#4',d:200},{note:'G4',d:200},{note:'F4',d:200},{note:'F4',d:400},{note:'F4',d:200},{note:'C5',d:800},{note:'Bb4',d:800}] },
        { title: "Star Wars", icon: "⚔️", diff: 'hard', notes: [{note:'G4',d:600},{note:'D5',d:600},{note:'C5',d:200},{note:'B4',d:200},{note:'A4',d:200},{note:'G5',d:600},{note:'D5',d:400},{note:'C5',d:200},{note:'B4',d:200},{note:'A4',d:200},{note:'G5',d:800}] },
        { title: "Shape of You", icon: "➗", diff: 'medium', notes: [{note:'C#4',d:200},{note:'E4',d:200},{note:'C#4',d:200},{note:'C#4',d:200},{note:'E4',d:200},{note:'C#4',d:200},{note:'C#4',d:200},{note:'E4',d:200},{note:'C#4',d:200},{note:'D#4',d:400}] },
        { title: "Bad Guy - Billie Eilish", icon: "😈", diff: 'medium', notes: [{note:'G3',d:200},{note:'G3',d:200},{note:'D4',d:200},{note:'G3',d:200},{note:'G3',d:200},{note:'D4',d:200},{note:'G3',d:200},{note:'F3',d:200},{note:'E3',d:200},{note:'Eb3',d:400}] },
        { title: "La Lettre à Élise", icon: "💌", diff: 'hard', notes: [{note:'E5',d:200},{note:'D#5',d:200},{note:'E5',d:200},{note:'D#5',d:200},{note:'E5',d:200},{note:'B4',d:200},{note:'D5',d:200},{note:'C5',d:200},{note:'A4',d:800}] },
        { title: "Game of Thrones", icon: "👑", diff: 'hard', notes: [{note:'G4',d:600},{note:'C4',d:600},{note:'Eb4',d:200},{note:'F4',d:200},{note:'G4',d:600},{note:'C4',d:600},{note:'Eb4',d:200},{note:'F4',d:200},{note:'D4',d:1200}] },
        { title: "Smooth Criminal", icon: "🕴️", diff: 'hard', notes: [{note:'A3',d:200},{note:'A3',d:100},{note:'A3',d:100},{note:'G3',d:100},{note:'A3',d:100},{note:'B3',d:200},{note:'B3',d:100},{note:'B3',d:100},{note:'A3',d:100},{note:'B3',d:100},{note:'C4',d:200},{note:'C4',d:100},{note:'C4',d:100},{note:'B3',d:100},{note:'G3',d:100},{note:'A3',d:400}] }
    ],
musique: [
        { title: "Hallelujah", icon: "🙏", diff: 'easy', notes: [{note:'E4',f:1,d:600},{note:'G4',f:3,d:300},{note:'G4',f:3,d:600},{note:'A4',f:4,d:300},{note:'A4',f:4,d:300},{note:'G4',f:3,d:800}] },
        { title: "Ode à la Joie", icon: "🇪🇺", diff: 'easy', notes: [{note: "E4", d: 400, f: 3}, {note: "E4", d: 400, f: 3}, {note: "F4", d: 400, f: 4}, {note: "G4", d: 400, f: 5}, {note: "G4", d: 400, f: 5}, {note: "F4", d: 400, f: 4}, {note: "E4", d: 400, f: 3}, {note: "D4", d: 400, f: 2}, {note: "C4", d: 400, f: 1}, {note: "C4", d: 400, f: 1}, {note: "D4", d: 400, f: 2}, {note: "E4", d: 400, f: 3}, {note: "E4", d: 600, f: 3}, {note: "D4", d: 200, f: 2}, {note: "D4", d: 800, f: 2}] },
        { title: "Au Clair de la Lune", icon: "🌙", diff: 'easy', notes: [{note:'C4',d:400},{note:'C4',d:400},{note:'C4',d:400},{note:'D4',d:400},{note:'E4',d:800},{note:'D4',d:800},{note:'C4',d:400},{note:'E4',d:400},{note:'D4',d:400},{note:'D4',d:400},{note:'C4',d:1200}] },
        { title: "Une Souris Verte", icon: "🐭", diff: 'easy', notes: [{note:'G4',d:200},{note:'G4',d:200},{note:'G4',d:200},{note:'E4',d:400},{note:'C4',d:400},{note:'G4',d:200},{note:'G4',d:200},{note:'G4',d:200},{note:'E4',d:400},{note:'C4',d:400}] },
        { title: "Frère Jacques", icon: "🔔", diff: 'easy', notes: [{note:'C4',d:400},{note:'D4',d:400},{note:'E4',d:400},{note:'C4',d:400},{note:'C4',d:400},{note:'D4',d:400},{note:'E4',d:400},{note:'C4',d:400},{note:'E4',d:400},{note:'F4',d:400},{note:'G4',d:800}] },
        { title: "Imagine (Intro)", icon: "🕊️", diff: 'medium', notes: [{note: "C4", d: 400}, {note: "E4", d: 400}, {note: "G4", d: 400}, {note: "E4", d: 200}, {note: "G4", d: 200}, {note: "C4", d: 400}, {note: "F4", d: 400}, {note: "A4", d: 400}, {note: "F4", d: 200}, {note: "A4", d: 200}] },
        { title: "Bella Ciao", icon: "🎭", diff: 'medium', notes: [{note: "E4", d: 200}, {note: "A4", d: 200}, {note: "B4", d: 200}, {note: "C5", d: 200}, {note: "A4", d: 600}, {note: "E4", d: 200}, {note: "A4", d: 200}, {note: "B4", d: 200}, {note: "C5", d: 200}, {note: "A4", d: 600}, {note: "A4", d: 200}, {note: "C5", d: 200}, {note: "B4", d: 200}, {note: "A4", d: 200}, {note: "E5", d: 800}] },
        { title: "Tetris Theme", icon: "🧱", diff: 'medium', notes: [{note:'E4',d:400},{note:'B3',d:200},{note:'C4',d:200},{note:'D4',d:400},{note:'C4',d:200},{note:'B3',d:200},{note:'A3',d:400},{note:'A3',d:200},{note:'C4',d:200},{note:'E4',d:400},{note:'D4',d:200},{note:'C4',d:200},{note:'B3',d:400}] },
        { title: "Shape of You", icon: "➗", diff: 'medium', notes: [{note:'C#4',d:200},{note:'E4',d:200},{note:'C#4',d:200},{note:'C#4',d:200},{note:'E4',d:200},{note:'C#4',d:200},{note:'C#4',d:200},{note:'E4',d:200},{note:'C#4',d:200},{note:'D#4',d:400}] },
        { title: "Bad Guy", icon: "😈", diff: 'medium', notes: [{note:'G3',d:200},{note:'G3',d:200},{note:'D4',d:200},{note:'G3',d:200},{note:'G3',d:200},{note:'D4',d:200},{note:'G3',d:200},{note:'F3',d:200},{note:'E3',d:200},{note:'Eb3',d:400}] },
        { title: "Jurassic Park", icon: "🦖", diff: 'hard', notes: [{note: "Bb3", d: 400, f: 1}, {note: "A3", d: 400, f: 2}, {note: "Bb3", d: 400, f: 1}, {note: "F3", d: 800, f: 1}, {note: "Bb3", d: 400, f: 1}, {note: "A3", d: 400, f: 2}, {note: "Bb3", d: 400, f: 1}, {note: "F3", d: 800, f: 1}, {note: "Bb3", d: 400}, {note: "A3", d: 400}, {note: "C4", d: 400}, {note: "Bb3", d: 200}, {note: "A3", d: 800}] },
        { title: "Harry Potter", icon: "⚡", diff: 'hard', notes: [{note: "B3", d: 200}, {note: "E4", d: 300}, {note: "G4", d: 150}, {note: "F#4", d: 150}, {note: "E4", d: 450}, {note: "B4", d: 250}, {note: "A4", d: 800}, {note: "F#4", d: 450}, {note: "E4", d: 300}, {note: "G4", d: 150}, {note: "F#4", d: 150}, {note: "D#4", d: 450}, {note: "F4", d: 250}, {note: "B3", d: 800}] },
        { title: "Pirates des Caraïbes", icon: "🏴‍☠️", diff: 'hard', notes: [{note: "A3", d: 150}, {note: "C4", d: 150}, {note: "D4", d: 400}, {note: "D4", d: 400}, {note: "D4", d: 150}, {note: "E4", d: 150}, {note: "F4", d: 400}, {note: "F4", d: 400}, {note: "F4", d: 150}, {note: "G4", d: 150}, {note: "E4", d: 400}, {note: "E4", d: 400}, {note: "D4", d: 150}, {note: "C4", d: 150}, {note: "D4", d: 800}] },
        { title: "Interstellar", icon: "🚀", diff: 'hard', notes: [{note: "A4", d: 350}, {note: "E4", d: 350}, {note: "A4", d: 350}, {note: "E4", d: 350}, {note: "B4", d: 350}, {note: "E4", d: 350}, {note: "C5", d: 350}, {note: "E4", d: 350}, {note: "A4", d: 350}, {note: "E4", d: 350}, {note: "A4", d: 800}] },
        { title: "Mario Bros", icon: "🍄", diff: 'hard', notes: [{note:'E5',d:150},{note:'E5',d:300},{note:'E5',d:300},{note:'C5',d:150},{note:'E5',d:300},{note:'G5',d:600},{note:'G4',d:600}] },
        { title: "Libérée Délivrée", icon: "❄️", diff: 'hard', notes: [{note:'F4',d:200},{note:'G4',d:200},{note:'G#4',d:400},{note:'G#4',d:200},{note:'G4',d:200},{note:'F4',d:200},{note:'F4',d:400},{note:'F4',d:200},{note:'C5',d:800},{note:'Bb4',d:800}] },
        { title: "Star Wars", icon: "⚔️", diff: 'hard', notes: [{note:'G4',d:600},{note:'D5',d:600},{note:'C5',d:200},{note:'B4',d:200},{note:'A4',d:200},{note:'G5',d:600},{note:'D5',d:400},{note:'C5',d:200},{note:'B4',d:200},{note:'A4',d:200},{note:'G5',d:800}] },
        { title: "Lettre à Élise", icon: "💌", diff: 'hard', notes: [{note:'E5',d:200},{note:'D#5',d:200},{note:'E5',d:200},{note:'D#5',d:200},{note:'E5',d:200},{note:'B4',d:200},{note:'D5',d:200},{note:'C5',d:200},{note:'A4',d:800}] },
        { title: "Game of Thrones", icon: "👑", diff: 'hard', notes: [{note:'G4',d:600},{note:'C4',d:600},{note:'Eb4',d:200},{note:'F4',d:200},{note:'G4',d:600},{note:'C4',d:600},{note:'Eb4',d:200},{note:'F4',d:200},{note:'D4',d:1200}] },
        { title: "Smooth Criminal", icon: "🕴️", diff: 'hard', notes: [{note:'A3',d:200},{note:'A3',d:100},{note:'A3',d:100},{note:'G3',d:100},{note:'A3',d:100},{note:'B3',d:200},{note:'B3',d:100},{note:'B3',d:100},{note:'A3',d:100},{note:'B3',d:100},{note:'C4',d:200},{note:'C4',d:100},{note:'C4',d:100},{note:'B3',d:100},{note:'G3',d:100},{note:'A3',d:400}] }
    ],
accords: [
  {
    title: "1. Le Trio de Cristal",
    notes: [{ notes: ['C4', 'E4', 'G4'], fingers: [1, 3, 5], d: 1500 }]
  },
  {
    title: "2. L'Ombre de la Forêt",
    notes: [{ notes: ['A3', 'C4', 'E4'], fingers: [1, 2, 4], d: 1500 }]
  },
  {
    title: "3. Le Souffle du Matin",
    notes: [{ notes: ['G3', 'B3', 'D4'], fingers: [1, 2, 4], d: 1500 }]
  },
  {
    title: "4. La Citadelle de Fer",
    notes: [{ notes: ['F3', 'A3', 'C4'], fingers: [1, 3, 5], d: 1500 }]
  },
  {
    title: "5. La Brume du Soir",
    notes: [{ notes: ['E3', 'G3', 'B3'], fingers: [1, 2, 4], d: 1500 }]
  },
  {
    title: "6. L'Éclat du Rubis",
    notes: [{ notes: ['D3', 'F#3', 'A3'], fingers: [1, 3, 5], d: 1500 }]
  },
  {
    title: "7. Le Miroir de l'Eau",
    notes: [{ notes: ['Bb3', 'D4', 'F4'], fingers: [1, 2, 4], d: 1500 }]
  },
  {
    title: "8. La Marche Solennelle",
    notes: [{ notes: ['E3', 'A3', 'C4'], fingers: [1, 3, 4], d: 1500 }]
  },
  {
    title: "9. Le Rêve de Saphir",
    notes: [{ notes: ['C4', 'F4', 'A4'], fingers: [1, 3, 5], d: 1500 }]
  },
  {
    title: "10. Le Pic de Glace",
    notes: [{ notes: ['B2', 'D#3', 'F#3'], fingers: [1, 2, 4], d: 1500 }]
  },
  {
    title: "11. L'Aube Dorée",
    notes: [{ notes: ['G3', 'C4', 'E4'], fingers: [1, 2, 5], d: 1500 }]
  },
  {
    title: "12. Le Murmure Antique",
    notes: [{ notes: ['D3', 'F3', 'A3'], fingers: [1, 2, 4], d: 1500 }]
  },
  {
    title: "13. La Danse des Elfes",
    notes: [{ notes: ['A3', 'D4', 'F#4'], fingers: [1, 2, 5], d: 1500 }]
  },
  {
    title: "14. La Porte des Cieux",
    notes: [{ notes: ['C3', 'G3', 'C4'], fingers: [1, 3, 5], d: 1500 }]
  },
  {
    title: "15. Le Secret du Désert",
    notes: [{ notes: ['E3', 'G#3', 'B3'], fingers: [1, 3, 5], d: 1500 }]
  },
  {
    title: "16. La Valse de Velours",
    notes: [{ notes: ['F3', 'Ab3', 'C4'], fingers: [1, 2, 4], d: 1500 }]
  },
  {
    title: "17. L'Écho de l'Océan",
    notes: [{ notes: ['G3', 'C4', 'D4'], fingers: [1, 3, 4], d: 1500 }]
  },
  {
    title: "18. La Nuit de nacre",
    notes: [{ notes: ['B3', 'E4', 'G#4'], fingers: [1, 2, 4], d: 1500 }]
  },
  {
    title: "19. Le Vent du Nord",
    notes: [{ notes: ['D3', 'G3', 'B3'], fingers: [1, 3, 5], d: 1500 }]
  },
  {
    title: "20. L'Hymne Éternel",
    notes: [{ notes: ['C4', 'E4', 'G4', 'C5'], fingers: [1, 2, 4, 5], d: 2000 }]
  }
],
    partitions: [
    { title: "Importer MusicXML", icon: "📤", diff: 'custom', special: "import" },
    { title: "Bibliothèque", icon: "📚", diff: 'custom', special: "library" },
    // On peut même ajouter des partitions déjà présentes
    { title: "Lettre à Élise (Partition)", icon: "🎼", diff: 'hard', special: "game", folder: "song", id: 17 }
]
};

function initAudio() {
    try {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log("AudioContext créé, état:", audioContext.state);
        }

        if (audioContext.state === 'suspended') {
            audioContext.resume().then(() => {
                console.log("Audio débloqué ! État :", audioContext.state);
            }).catch(err => {
                console.error("Erreur lors du resume:", err);
            });
        }

        return audioContext;

    } catch (e) {
        console.error("Erreur initAudio:", e);
        return null;
    }
}

function setupAudioActivation() {
    const activateAudio = async () => {
        if (!audioContext) {
            initAudio();
        }
        if (audioContext && audioContext.state === 'suspended') {
            try {
                await audioContext.resume();
                console.log("Audio activé par interaction utilisateur");
            } catch (e) {
                console.error("Échec activation:", e);
            }
        }
    };

    ['click', 'touchstart', 'keydown'].forEach(event => {
        document.addEventListener(event, activateAudio, { once: true });
    });
}

window.onload = () => {
    initPiano();
    updateProfileDisplay();
    switchTab('cours');

    const micBtn = document.getElementById('mic-toggle');
    if(micBtn) micBtn.onclick = toggleMic;

    setupMIDI();
    setupPartitionTranslator();
    setupAudioActivation();
};
function toggleSettings() {
    const modal = document.getElementById('settings-modal');
    const isVisible = modal.style.display === 'flex';
    modal.style.display = isVisible ? 'none' : 'flex';
    
    if (!isVisible) {
        openSettingsTab('profile'); // Ouvre le premier onglet par défaut
        updateProfilesList();       // Rafraîchit les données
    }
}

function openSettingsTab(tabName) {
    // Cache toutes les sections
    document.querySelectorAll('.set-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Affiche la section cliquée
    document.getElementById('set-' + tabName).style.display = 'block';
    
    // Si c'est l'onglet progrès ou stats, on lance les fonctions de calcul
    if (tabName === 'progres') updateProgressModal();
    if (tabName === 'stats') renderStatsCharts();
}
function setupPartitionTranslator() {
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

function openPartitionModal() {
    const modal = document.getElementById('partition-modal');
    if (modal) {
        modal.style.display = 'flex';
        selectedPartitionFile = null;
        const fileNameEl = document.getElementById('selected-file-name');
        if (fileNameEl) fileNameEl.textContent = '';
    }
}

function closePartitionModal() {
    const modal = document.getElementById('partition-modal');
    if (modal) modal.style.display = 'none';
}

async function loadPartitionFile() {
    alert('Import en développement');
    closePartitionModal();
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
    const piano = document.getElementById('piano');
    if (!piano) return;
    piano.innerHTML = '';

    let whiteKeyIndex = 0;
    const whiteKeyWidth = 55;

    for (let octave = 2; octave <= 6; octave++) {
        noteStrings.forEach((note) => {
            const isBlack = note.includes('#');
            const key = document.createElement('div');
            key.className = `key ${isBlack ? 'black' : 'white'}`;
            key.dataset.note = note + octave;

            if (isBlack) {
                const blackKeyWidth = 34;
                const position = (whiteKeyIndex * whiteKeyWidth) - (blackKeyWidth / 2);
                key.style.left = position + 'px';
            } else {
                whiteKeyIndex++;
            }

            key.addEventListener('mousedown', (e) => {
                e.preventDefault();
                playNote(note + octave);
            });

            key.addEventListener('mouseup', (e) => {
                e.preventDefault();
                stopNote(note + octave);
            });

            key.addEventListener('mouseleave', () => {
                stopNote(note + octave);
            });

            key.addEventListener('touchstart', (e) => {
                e.preventDefault();
                playNote(note + octave);
            });

            key.addEventListener('touchend', (e) => {
                e.preventDefault();
                stopNote(note + octave);
            });key.addEventListener('mouseup', (e) => {
    e.preventDefault();
    stopNote(note + octave);
    window.currentDetectedNote = null; // On vide la détection
});

key.addEventListener('touchend', (e) => {
    e.preventDefault();
    stopNote(note + octave);
    window.currentDetectedNote = null;
});

            const label = document.createElement('div');
            label.className = 'key-label';
            const noteLetter = note.replace('#', '');
            let frName = noteNamesFR[noteLetter] || noteLetter;
            label.textContent = isBlack ? frName + '#' : frName;
            key.appendChild(label);
            piano.appendChild(key);

        });
    }
}function colorizePianoKeys() {
    const keys = document.querySelectorAll('.key');
    keys.forEach(key => {
        const note = key.dataset.note; // ex: "C4", "F#3"
        if (!note) return;

        const baseNote = note.replace(/[0-9#]/g, ''); // Extrait juste la lettre (C, D, E...)
        const color = noteColors[baseNote];

        if (key.classList.contains('white')) {
            // Touches blanches : fond coloré très pastel
            key.style.background = `linear-gradient(to bottom, ${color}30 0%, ${color}15 100%)`;
            key.style.borderBottom = `4px solid ${color}`;
            key.style.borderColor = `${color}80`;

            // Garde le label visible
            const label = key.querySelector('.key-label');
            if (label) {
                label.style.color = color;
                label.style.fontWeight = 'bold';
                label.style.textShadow = `0 0 5px ${color}50`;
            }
        } else {
            // Touches noires : bordure et top colorés
            key.style.background = `linear-gradient(to bottom, #1a1a1a 0%, #000 100%)`;
            key.style.borderTop = `3px solid ${color}`;
            key.style.boxShadow = `0 -2px 10px ${color}60, inset 0 -5px 10px rgba(0,0,0,0.8)`;

            const label = key.querySelector('.key-label');
            if (label) {
                label.style.color = color;
                label.style.fontWeight = 'bold';
            }
        }
    });
}

function switchTab(tabType) {
    const g = document.getElementById('content-grid');
    if (!g) return;
    currentTabType = tabType; // Sauvegarder le type d'onglet actuel
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
        }

        // Logique de verrouillage : débloqué si cours précédent terminé ou si c'est le premier
        const isLocked = isEnfant && index > 0 && !completed.includes(items[index-1]?.titre);

        const card = document.createElement('div');
        card.className = 'card';

        if (item.type === 'import') {
            card.style.cssText = 'background: linear-gradient(135deg, #1a1a2e, #2d1b4e); border: 2px solid var(--accent);';
            card.innerHTML = `<div style="font-size:2rem; margin-bottom:10px;">${item.titre.split(' ')[0]}</div><div style="font-weight:bold;">${item.titre.substring(2)}</div>`;
            card.onclick = () => openPartitionModal();
        } else if (isPremium) {
            card.innerHTML = `<div style="color:gold; font-weight:bold;">VERSION PRO</div><div>${item.titre}</div>`;
            card.onclick = () => openPricing();
        } else if (isLocked) {
            card.className += ' locked';
            card.style.opacity = '0.4';
            card.style.cursor = 'not-allowed';
            card.innerHTML = `<div>🔒 Verrouillé<br><small>Terminez "${items[index-1]?.titre}" pour débloquer</small></div>`;
        } else {
            const isDone = completed.includes(item.titre);
            const statusIcon = isDone ? '✅ Terminé' : '';
            card.style.cursor = 'pointer';
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <b style="color:${item.diff === 'easy' ? '#2ecc71' : item.diff === 'medium' ? '#f1c40f' : '#e74c3c'};">
                        ${item.diff.toUpperCase()}
                    </b>
                    <span style="font-size:0.9em; color:#2ecc71; font-weight:bold;">${statusIcon}</span>
                </div>
                <div style="font-weight:bold; margin-top:5px;">${item.titre}</div>
                ${isDone ? '<div style="font-size:0.8em; color:#aaa; margin-top:5px;">Rejouer ce cours</div>' : ''}
            `;
            card.onclick = () => {
                currentLevelTitle = item.titre;
                currentLevelData = item; // Sauvegarder les données du niveau
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

function getNoteColor(note) {
    if (colorMode === 'intermediaire') return '#00d9ff';
    const base = note.replace(/[0-9#]/g, '');
    return noteColors[base] || '#00f2ff';
}

function createNoteEvaporation(x, y, color, noteHeight) {
    const fZone = document.getElementById('fall-zone');
    if (!fZone || !x || !y) return;

    const isLong = noteHeight > 100;
    const intensity = isLong ? 1.3 : 1;

    const core = document.createElement('div');
    core.style.cssText = `
        position: absolute;
        left: ${x}px;
        top: ${y}px;
        width: ${25 * intensity}px;
        height: ${25 * intensity}px;
        background: radial-gradient(circle, white 0%, ${color} 50%, transparent 70%);
        border-radius: 50%;
        transform: translate(-50%, -50%);
        pointer-events: none;
        z-index: 100;
        filter: blur(1px);
        animation: coreEvaporate ${0.8 + intensity * 0.3}s ease-out forwards;
    `;
    fZone.appendChild(core);
    setTimeout(() => core.remove(), 1100);

    const column = document.createElement('div');
    column.style.cssText = `
        position: absolute;
        left: ${x}px;
        top: ${y}px;
        width: ${15 * intensity}px;
        height: ${noteHeight * 0.8}px;
        background: linear-gradient(to top, ${color}dd, ${color}66, transparent);
        transform: translate(-50%, -100%);
        pointer-events: none;
        z-index: 95;
        filter: blur(4px);
        opacity: 0.8;
        animation: columnRise ${0.6 + intensity * 0.2}s ease-out forwards;
    `;
    fZone.appendChild(column);
    setTimeout(() => column.remove(), 800);

    const sparkCount = Math.floor((isLong ? 16 : 8) * intensity);
    for (let i = 0; i < sparkCount; i++) {
        const spark = document.createElement('div');
        const size = 3 + Math.random() * 4;
        const drift = (Math.random() - 0.5) * 20;
        const upDist = noteHeight + 30 + Math.random() * 80;
        const duration = 0.7 + Math.random() * 0.5;
        const delay = Math.random() * 0.1;

        spark.style.cssText = `
            position: absolute;
            left: ${x + drift}px;
            top: ${y}px;
            width: ${size}px;
            height: ${size}px;
            background: ${Math.random() > 0.4 ? color : '#fff'};
            border-radius: 50%;
            transform: translate(-50%, -50%);
            pointer-events: none;
            z-index: 98;
            box-shadow: 0 0 ${size * 2}px ${color};
            animation: sparkRise ${duration}s ease-out ${delay}s forwards;
        `;

        spark.style.setProperty('--up-dist', `${upDist}px`);
        fZone.appendChild(spark);
        setTimeout(() => spark.remove(), (duration + delay) * 1000);
    }

    const vaporCount = isLong ? 3 : 1;
    for (let i = 0; i < vaporCount; i++) {
        setTimeout(() => {
            const vapor = document.createElement('div');
            vapor.style.cssText = `
                position: absolute;
                left: ${x}px;
                top: ${y - 20}px;
                width: ${30 + i * 10}px;
                height: ${40 + i * 10}px;
                background: radial-gradient(ellipse, ${color}40, transparent);
                border-radius: 50%;
                transform: translate(-50%, -50%);
                pointer-events: none;
                z-index: 94;
                filter: blur(8px);
                animation: vaporRise ${1 + i * 0.3}s ease-out forwards;
            `;
            fZone.appendChild(vapor);
            setTimeout(() => vapor.remove(), 1300 + i * 300);
        }, i * 100);
    }
}

function startNoteSteam(x, color, duration, noteHeight) {
    const fZone = document.getElementById('fall-zone');
    if (!fZone) return;

    const isLong = noteHeight > 100;
    const startTime = Date.now();

    const emitter = document.createElement('div');
    emitter.style.cssText = `
        position: absolute;
        left: ${x}px;
        top: ${window.innerHeight - 180}px;
        width: 60px;
        height: 30px;
        pointer-events: none;
        z-index: 90;
        transform: translateX(-50%);
    `;
    fZone.appendChild(emitter);

    const particleInterval = setInterval(() => {
        if (Date.now() - startTime >= duration) {
            clearInterval(particleInterval);
            emitter.style.transition = 'opacity 0.3s';
            emitter.style.opacity = '0';
            setTimeout(() => emitter.remove(), 300);
            return;
        }

        if (Math.random() > 0.6) {
            const big = document.createElement('div');
            const size = 25 + Math.random() * 20;
            big.style.cssText = `
                position: absolute;
                left: ${50 + (Math.random() - 0.5) * 40}%;
                bottom: 0;
                width: ${size}px;
                height: ${size}px;
                background: radial-gradient(circle, ${color}33, transparent);
                border-radius: 50%;
                filter: blur(6px);
                pointer-events: none;
                z-index: 89;
                animation: steamBig ${1.2 + Math.random() * 0.8}s ease-out forwards;
            `;
            big.style.setProperty('--rise', `-${80 + Math.random() * 120}px`);
            big.style.setProperty('--drift', `${(Math.random() - 0.5) * 60}px`);
            emitter.appendChild(big);
            setTimeout(() => big.remove(), 2000);
        }

        const bubble = document.createElement('div');
        const size = (8 + Math.random() * 15) * (isLong ? 1.3 : 1);
        bubble.style.cssText = `
            position: absolute;
            left: ${50 + (Math.random() - 0.5) * 30}%;
            bottom: ${Math.random() * 10}px;
            width: ${size}px;
            height: ${size}px;
            background: radial-gradient(circle, ${color}ff 0%, ${color}88 50%, transparent 70%);
            border: 1px solid ${color};
            border-radius: 50%;
            filter: blur(1px);
            pointer-events: none;
            z-index: 95;
            animation: steamBubble ${0.6 + Math.random() * 0.5}s ease-out forwards;
        `;
        bubble.style.setProperty('--rise-h', `-${60 + Math.random() * 100}px`);
        bubble.style.setProperty('--drift-x', `${(Math.random() - 0.5) * 40}px`);
        emitter.appendChild(bubble);
        setTimeout(() => bubble.remove(), 1100);

    }, 25);

    setTimeout(() => {
        clearInterval(particleInterval);
        if (emitter.parentNode) {
            emitter.style.opacity = '0';
            setTimeout(() => emitter.remove(), 300);
        }
    }, duration + 300);
}

function flashHitLine(x, color) {
    const hitLine = document.getElementById('hit-line');
    if (!hitLine) return;

    const flash = document.createElement('div');
    flash.style.cssText = `
        position: absolute;
        left: ${x}px;
        top: 50%;
        width: 80px;
        height: 6px;
        background: radial-gradient(ellipse at center, white 0%, ${color} 40%, transparent 80%);
        transform: translate(-50%, -50%);
        pointer-events: none;
        border-radius: 50%;
        box-shadow: 0 0 30px ${color}, 0 0 60px ${color};
        animation: lineFlash 0.5s ease-out forwards;
        z-index: 10000;
    `;

    hitLine.appendChild(flash);

    const originalBoxShadow = hitLine.style.boxShadow;
    hitLine.style.transition = 'all 0.1s';
    hitLine.style.boxShadow = `0 0 40px ${color}, 0 0 80px ${color}, 0 0 120px white`;
    hitLine.style.height = '6px';

    setTimeout(() => {
        hitLine.style.boxShadow = '0 0 15px var(--accent), 0 0 30px #ff00ff';
        hitLine.style.height = '4px';
    }, 200);

    setTimeout(() => {
        if(flash.parentNode) flash.remove();
    }, 500);
}

function centerPianoOnNote(noteName) {
    // Ne fonctionne que sur mobile/tablette (écran < 1024px)
    if (window.innerWidth >= 1024) return;
    
    const container = document.getElementById('piano-container');
    const key = document.querySelector(`.key[data-note="${noteName}"]`);
    
    if (!container || !key) return;
    
    // Calculer la position pour centrer la touche
    const containerWidth = container.offsetWidth;
    const keyLeft = key.offsetLeft;
    const keyWidth = key.offsetWidth;
    
    const scrollLeft = keyLeft - (containerWidth / 2) + (keyWidth / 2);
    
    container.scrollTo({
        left: Math.max(0, scrollLeft),
        behavior: 'smooth'
    });
}

function drop(nData) {
    const fZone = document.getElementById('fall-zone');
    const hitLine = document.getElementById('hit-line');

    if (!fZone || !hitLine) return;

    // Vérifie si c'est un accord (plusieurs notes) ou une note simple
    const isChord = Array.isArray(nData.notes) && nData.notes.length > 0;
    const notesToPlay = isChord ? nData.notes : [nData.note];
    const fingers = isChord ? (nData.fingers || nData.f || []) : [nData.f];
    const hands = isChord ? (nData.hands || nData.m || []) : [nData.m];
    
    const duration = nData.d || 400;
    
    ensureNoteVisible(notesToPlay[0]);
    
    setTimeout(() => {
        const noteId = 'note-' + Math.random().toString(36).substr(2, 9);
        const calculatedHeight = Math.max(80, (duration / 8) * (currentSpeed / 3));
        
        const noteObj = { 
            id: noteId,
            notes: notesToPlay,
            fingers: fingers,
            hands: hands,
            y: -calculatedHeight - 30, 
            ok: false, 
            played: false, 
            h: calculatedHeight, 
            d: duration,
            isChord: isChord,
            detectedNotes: new Set(),  // Pour suivre quelles notes ont été détectées
            isWaiting: false           // Pour savoir si l'accord est en attente
        };
        
        notesOnScreen.push(noteObj);

        // Crée les éléments visuels
        const noteElements = [];
        const hitLineY = hitLine.offsetTop;
        
        notesToPlay.forEach((noteName, index) => {
            const targetKey = document.querySelector(`.key[data-note="${noteName}"]`);
            if (!targetKey) return;

            const keyRect = targetKey.getBoundingClientRect();
            const fZoneRect = fZone.getBoundingClientRect();
            const leftPos = keyRect.left - fZoneRect.left + 3;
            const width = keyRect.width - 6;
            
            const color = getNoteColor(noteName);
            const hand = hands[index] || (parseInt(noteName.slice(-1)) <= 3 ? 'G' : 'D');
            const finger = fingers[index] || 1;
            const noteBase = noteName.replace(/[0-9#]/g, '');
            const displayNote = noteNamesFR[noteBase] || noteBase;

            const el = document.createElement('div');
            el.id = noteId + '-' + index;
            el.className = 'falling-note chord-note';
            el.dataset.note = noteName;
            el.dataset.parentId = noteId;
            el.dataset.index = index;
            
            el.style.cssText = `
                position: absolute;
                left: ${leftPos}px;
                width: ${width}px;
                height: ${calculatedHeight}px;
                top: ${noteObj.y}px;
                border-radius: 15px 15px 8px 8px;
                border: 2px solid rgba(255,255,255,0.6);
                background: linear-gradient(180deg, rgba(255,255,255,0.4) 0%, ${color}66 100%);
                z-index: 50;
                transition: filter 0.2s, transform 0.2s;
            `;

            el.innerHTML = `
                <div style="position:absolute;top:-12px;left:50%;transform:translateX(-50%);padding:4px 12px;border-radius:20px;background:${color};color:#000;font-weight:bold;border:2px solid white;white-space:nowrap;font-size:0.8rem;">${hand}${finger}</div>
                <div style="position:absolute;bottom:-12px;left:50%;transform:translateX(-50%);padding:3px 10px;border-radius:12px;background:white;color:#000;font-weight:bold;border:1px solid ${color};white-space:nowrap;font-size:0.75rem;">${displayNote}</div>
            `;

            fZone.appendChild(el);
            noteElements.push({ el, noteName, leftPos, color, hand, finger, index });
        });

        // Animation de chute
        const animate = () => {
            const currentObj = notesOnScreen.find(n => n.id === noteId);
            if (!currentObj) {
                noteElements.forEach(ne => { if(ne.el.parentNode) ne.el.remove(); });
                return;
            }

            const bottomOfNote = currentObj.y + currentObj.h;
            const tolerance = 30; // Zone de tolérance autour de la ligne

            // === LOGIQUE POUR ACCORDS ===
            if (currentObj.isChord && currentMode === 'step') {
                
                // L'accord atteint la ligne de hit
                if (bottomOfNote >= hitLineY - tolerance && !currentObj.ok && !currentObj.isWaiting) {
                    currentObj.isWaiting = true;
                    currentObj.y = hitLineY - currentObj.h; // Bloque sur la ligne
                    
                    // Met à jour la position visuelle
                    noteElements.forEach(ne => {
                        ne.el.style.top = currentObj.y + "px";
                    });
                    
                    // Effet visuel : l'accord "pulse" pour montrer qu'il attend
                    noteElements.forEach(ne => {
                        ne.el.style.animation = "pulse 0.5s ease-in-out infinite";
                        ne.el.style.border = "3px solid #fff";
                    });
                }
                
                // Si l'accord est en attente sur la ligne
                if (currentObj.isWaiting && !currentObj.ok) {
                    // Vérifie quelles notes sont jouées en ce moment
                    currentObj.notes.forEach((noteName, idx) => {
                        const isDetected = (typeof noteActive !== 'undefined' && noteActive === noteName) || 
                                           (window.currentDetectedNote === noteName);
                        
                        if (isDetected && !currentObj.detectedNotes.has(noteName)) {
                            currentObj.detectedNotes.add(noteName);
                            
                            // Effet visuel sur la note détectée
                            const noteEl = document.getElementById(noteId + '-' + idx);
                            if (noteEl) {
                                noteEl.style.filter = "brightness(1.5)";
                                noteEl.style.boxShadow = "0 0 20px #00ff00";
                            }
                        }
                    });
                    
                    // Vérifie si toutes les notes sont détectées
                    const allDetected = currentObj.notes.every(n => currentObj.detectedNotes.has(n));
                    
                    if (allDetected) {
                        // SUCCÈS ! Toutes les notes de l'accord sont jouées
                        currentObj.ok = true;
                        currentObj.played = true;
                        currentObj.isWaiting = false;
                        
                        // Arrête l'animation pulse
                        noteElements.forEach(ne => {
                            ne.el.style.animation = "";
                            ne.el.style.filter = "brightness(2) saturate(2)";
                            ne.el.style.border = "3px solid #00ff00";
                            ne.el.style.boxShadow = "0 0 30px #00ff00";
                        });
                        
                        // Joue les sons de l'accord
                        currentObj.notes.forEach((note, idx) => {
                            const freq = getFrequency(note);
                            if (freq) {
                                setTimeout(() => {
                                    playNoteSound(freq, currentObj.d / 1000);
                                    highlightPianoKey(note);
                                }, idx * 20);
                            }
                        });
                        
                        // Valide l'accord (stats et effets)
                        validateChord(currentObj, noteElements);
                        updateStats(currentObj, true);
                        
                        // Continue la chute après un court délai
                        setTimeout(() => {
                            currentObj.isWaiting = false;
                        }, 100);
                    }
                    
                    // Reste sur la ligne tant que pas toutes les notes jouées
                    return requestAnimationFrame(animate);
                }
            }
            
            // === LOGIQUE POUR NOTES SIMPLES (inchangée) ===
            else if (!currentObj.isChord && currentMode === 'step' && bottomOfNote >= hitLineY && !currentObj.ok) {
                isPaused = true;
                currentObj.y = hitLineY - currentObj.h;
                
                noteElements.forEach(ne => {
                    ne.el.style.top = currentObj.y + "px";
                });

                const isDetected = (typeof noteActive !== 'undefined' && noteActive === currentObj.notes[0]) || 
                                   (window.currentDetectedNote === currentObj.notes[0]);

                if (isDetected) {
                    currentObj.ok = true;
                    currentObj.played = true;
                    isPaused = false;
                    
                    noteElements.forEach(ne => {
                        ne.el.style.filter = "brightness(2) saturate(2)";
                        ne.el.style.border = "3px solid white";
                    });
                    
                    const freq = getFrequency(currentObj.notes[0]);
                    if (freq) playNoteSound(freq, currentObj.d / 1000);
                    
                    validateNote(currentObj.notes[0], true);
                }
            }
            
            // === MODE AUTO (inchangé) ===
            else if (currentMode === 'auto' && bottomOfNote >= hitLineY && !currentObj.played) {
                currentObj.played = true;
                currentObj.ok = true;
                
                currentObj.notes.forEach((note, idx) => {
                    const freq = getFrequency(note);
                    if (freq) {
                        playNoteSound(freq, currentObj.d / 1000);
                        setTimeout(() => highlightPianoKey(note), idx * 20);
                    }
                });
                
                validateChord(currentObj, noteElements);
            }

            // Mouvement normal (si pas en pause et pas en attente d'accord)
            if (!isPaused && !currentObj.isWaiting) {
                currentObj.y += currentSpeed;
                noteElements.forEach(ne => {
                    ne.el.style.top = currentObj.y + "px";
                });
            }

            // Ajustement X dynamique pour mobile
            if (window.innerWidth < 1024) {
                noteElements.forEach(ne => {
                    const currentKey = document.querySelector(`.key[data-note="${ne.noteName}"]`);
                    if (currentKey) {
                        const cKeyRect = currentKey.getBoundingClientRect();
                        const fZoneRect = fZone.getBoundingClientRect();
                        ne.el.style.left = (cKeyRect.left - fZoneRect.left + 3) + "px";
                    }
                });
            }

            // Suppression quand sort de l'écran
            if (currentObj.y > fZone.offsetHeight + 100) {
                noteElements.forEach(ne => { if(ne.el.parentNode) ne.el.remove(); });
                const idx = notesOnScreen.findIndex(n => n.id === noteId);
                if (idx > -1) notesOnScreen.splice(idx, 1);
            } else {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
        
    }, 300);
}
function validateChord(chordObj, noteElements) {
    const fZone = document.getElementById('fall-zone');
    const hitLine = document.getElementById('hit-line');
    
    notesValidated += chordObj.notes.length;
    
    // Effets visuels pour chaque note de l'accord
    noteElements.forEach((ne, index) => {
        const el = ne.el;
        
        // Animation de validation
        el.style.boxShadow = `0 0 50px ${ne.color}, 0 0 20px #fff`;
        el.style.background = "white";
        el.style.transform = 'scale(1.2)';
        el.style.zIndex = "1000";
        el.style.transition = 'all 0.1s ease';

        // Suppression progressive
        setTimeout(() => {
            el.style.opacity = '0';
            setTimeout(() => {
                if(el.parentNode) el.remove();
            }, 200);
        }, 100 + index * 50);

        // Effets sur la ligne de hit
        if (fZone && hitLine) {
            const flash = document.createElement('div');
            flash.style.cssText = `
                position: absolute;
                left: ${ne.leftPos + 25}px;
                top: 50%;
                width: 80px;
                height: 6px;
                background: radial-gradient(ellipse at center, white 0%, ${ne.color} 40%, transparent 80%);
                transform: translate(-50%, -50%);
                pointer-events: none;
                border-radius: 50%;
                box-shadow: 0 0 30px ${ne.color}, 0 0 60px ${ne.color};
                animation: lineFlash 0.5s ease-out forwards;
                z-index: 10000;
            `;
            hitLine.appendChild(flash);
            setTimeout(() => flash.remove(), 500);
        }

        // Vapeur/effet pour chaque note
        if (typeof startNoteSteam === 'function') {
            startNoteSteam(ne.leftPos + 25, ne.color, chordObj.d, chordObj.h);
        }
    });

    // Effet spécial pour accord réussi
    if (typeof createNoteEvaporation === 'function') {
        const centerX = noteElements.reduce((sum, ne) => sum + ne.leftPos, 0) / noteElements.length;
        createNoteEvaporation(centerX + 25, hitLine.offsetTop, '#ffd700', chordObj.h);
    }
}
function startGame(folder, index) {
    const ctx = initAudio();
    if (ctx && ctx.state === 'suspended') {
        ctx.resume();
    }

    // 1. Récupérer les données
    let data;
    if (folder === 'ecole') data = DATA.cours[index];
    else if (folder === 'labo') data = DATA.exercices[index];
    else if (folder === 'apprentissage') data = DATA.apprentissage[index];
    else if (folder === 'musique') data = DATA.musique[index];
    else if (folder === 'accords') data = DATA.accords[index];
    else if (folder === 'partitions') data = DATA.partitions[index];

    if (!data || !data.notes) {
        console.error("Données introuvables !");
        return;
    }

    // 2. Configurer le MODE
    if (folder === 'musique') {
        currentMode = 'auto'; // Nouveau mode automatique
    } else if (folder === 'ecole' || folder === 'labo' || folder === 'apprentissage' || folder === 'accords') {
        currentMode = 'step'; // Mode pas à pas (attend le joueur)
    } else {
        currentMode = 'normal';
    }

    // 3. Préparer l'interface
    clearTimeout(gameLoopTimeout);
    const fZone = document.getElementById('fall-zone');
    if (fZone) {
        fZone.innerHTML = '';
        const hitLine = document.createElement('div');
        hitLine.id = 'hit-line';
        hitLine.style.cssText = `position:absolute;bottom:10px;left:0;width:100%;height:4px;background:linear-gradient(90deg,transparent,#fff,var(--accent)50%,#fff,transparent);box-shadow:0 0 15px var(--accent),0 0 30px #ff00ff;z-index:999;pointer-events:none;`;
        fZone.appendChild(hitLine);
    }

    const menu = document.getElementById('folder-content') || document.getElementById('main-menu');
    const gameContainer = document.getElementById('game-container');
    
    if (menu) menu.style.display = 'none';
    if (gameContainer) gameContainer.style.display = 'flex';

    // 4. Reset des variables
    notesOnScreen = [];
    notesValidated = 0;
    totalNotesInLevel = data.notes.length;
    currentLevelData = data; 
    isPaused = false;

    console.log(`Niveau démarré en mode ${currentMode}: ${data.title}`);

    // 5. Boucle d'envoi des notes
    let i = 0;
    const next = () => {
        // Si le jeu est en pause (parce qu'une note attend sur la ligne), on attend avant d'envoyer la suivante
        if (isPaused) {
            gameLoopTimeout = setTimeout(next, 100);
            return;
        }
        
        if(i < data.notes.length) {
            drop(data.notes[i]); 
            i++;
            gameLoopTimeout = setTimeout(next, data.notes[i-1].d || 800);
        } else {
            // On vérifie si tout est fini après un petit délai
            setTimeout(checkLevelEnd, 3000);
        }
    };
    next();
}
// Nouvelle fonction pour vérifier si le niveau est terminé (toutes notes validées)
function checkLevelEnd() {
    // Vérifier s'il reste des notes à l'écran ou en attente de validation
    const remainingNotes = notesOnScreen.length;

    if (remainingNotes === 0 && notesValidated >= totalNotesInLevel) {
        // Niveau terminé !
        setTimeout(() => {
            showLevelComplete();
        }, 500);
    } else {
        // Vérifier encore dans 500ms
        setTimeout(checkLevelEnd, 500);
    }
}

// Afficher l'écran de fin de niveau
// Afficher l'écran de fin de niveau (SANS le bandeau de légende en bas)
function showLevelComplete() {
    const wasAlreadyCompleted = saveProgress(currentLevelTitle);

    const modal = document.createElement('div');
    modal.id = 'level-complete-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100%;
        background: rgba(0,0,0,0.85);
        display: flex; flex-direction: column;
        justify-content: center; align-items: center;
        z-index: 10000;
        animation: fadeIn 0.4s ease-out;
        backdrop-filter: blur(8px);
    `;

    const currentP = profiles.find(p => p.name === currentProfileName) || profiles[0];
    const sessions = currentP.stats?.sessions || [];
    const lastSession = sessions[0] || { accuracy: 0, streak: 0 };
    const accuracy = lastSession.accuracy || 0;

    let grade = 'C', gradeColor = '#ff6b6b', gradeLabel = 'À travailler';
    if (accuracy >= 95) { grade = 'S'; gradeColor = '#00f2ff'; gradeLabel = 'Parfait !'; }
    else if (accuracy >= 90) { grade = 'A'; gradeColor = '#2ecc71'; gradeLabel = 'Excellent'; }
    else if (accuracy >= 80) { grade = 'B'; gradeColor = '#f1c40f'; gradeLabel = 'Bien'; }

    // Trouve le niveau suivant
    let hasNext = false;
    let nextIdx = -1;
    let nextFolder = '';
    
    const map = {'cours':'ecole','exercices':'labo','apprentissage':'apprentissage','musique':'musique'};
    for (let cat in map) {
        const idx = DATA[cat].findIndex(i => (i.title || i.titre) === currentLevelTitle);
        if (idx !== -1 && idx + 1 < DATA[cat].length) {
            hasNext = true;
            nextIdx = idx + 1;
            nextFolder = map[cat];
            break;
        }
    }

    modal.innerHTML = `
        <div style="background: linear-gradient(145deg, rgba(20,20,30,0.95), rgba(30,30,45,0.95)); padding: 30px; border-radius: 20px; border: 2px solid ${gradeColor}; text-align: center; max-width: 350px; width: 90%;">
            <div style="width: 70px; height: 70px; margin: 0 auto 15px; border-radius: 50%; border: 4px solid ${gradeColor}; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: bold; color: ${gradeColor};">${grade}</div>
            <div style="font-size: 0.85rem; color: ${gradeColor}; font-weight: 600; margin-bottom: 5px; text-transform: uppercase;">${gradeLabel}</div>
            <h3 style="color: #fff; margin: 0 0 5px 0; font-size: 1.3rem;">Niveau Complété !</h3>
            <p style="color: rgba(255,255,255,0.6); margin: 0 0 25px 0; font-size: 0.9rem;">${currentLevelTitle}</p>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 25px;">
                <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 10px;">
                    <div style="font-size: 0.7rem; color: rgba(255,255,255,0.4);">Précision</div>
                    <div style="font-size: 1.3rem; font-weight: bold; color: ${gradeColor};">${accuracy}%</div>
                </div>
                <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 10px;">
                    <div style="font-size: 0.7rem; color: rgba(255,255,255,0.4);">Streak</div>
                    <div style="font-size: 1.3rem; font-weight: bold; color: #fff;">${lastSession.streak || 0} 🔥</div>
                </div>
            </div>
            <div style="display: flex; gap: 10px;">
                <button id="btn-close" style="flex: 1; padding: 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.3); background: transparent; color: #fff; font-size: 0.9rem; cursor: pointer;">✕ Fermer</button>
                ${hasNext ? `<button id="btn-next" style="flex: 1; padding: 12px; border-radius: 10px; border: none; background: ${gradeColor}; color: #000; font-size: 0.9rem; font-weight: bold; cursor: pointer;">▶ Suivant</button>` : ''}
            </div>
        </div>
        <style>
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        </style>
    `;

    document.body.appendChild(modal);

    // Événements - VERSION SIMPLIFIÉE ET DIRECTE
    document.getElementById('btn-close').onclick = function() {
        modal.remove();
        quitGame();
        document.getElementById('main-folders').style.display = 'block';
    };
    
    if (hasNext) {
        document.getElementById('btn-next').onclick = function() {
            modal.remove();
            startGame(nextFolder, nextIdx);
        };
    }

    playVictorySound();
}
// Jouer un son de victoire
function playVictorySound() {
    try {
        const ctx = initAudio();
        if (!ctx) return;

        const now = ctx.currentTime;

        // Accord majeur ascendant (C-E-G-C)
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.value = freq;

            gain.gain.setValueAtTime(0, now + i*0.1);
            gain.gain.linearRampToValueAtTime(0.2, now + i*0.1 + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i*0.1 + 0.8);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now + i*0.1);
            osc.stop(now + i*0.1 + 1);
        });
    } catch(e) {
        console.error("Erreur son victoire:", e);
    }
}

// Passer au niveau suivant
function continueToNextLevel() {
    closeLevelComplete();

    const items = DATA[currentTabType] || [];
    const currentIndex = items.findIndex(item => item.titre === currentLevelTitle);
    const nextItem = items[currentIndex + 1];

    if (nextItem) {
        currentLevelTitle = nextItem.titre;
        currentLevelData = nextItem;
        startGame(nextItem, currentTabType === 'musique' ? 'auto' : 'step');
    }
}

// Fermer le modal et retourner au menu
function closeLevelComplete() {
    const modal = document.getElementById('level-complete-modal');
    if (modal) {
        modal.remove();
    }
    quitGame();
    // Rafraîchir l'affichage pour montrer le niveau débloqué
    switchTab(currentTabType);
}

function setSpeed(speed) {
    currentSpeed = speed;
}

function quitGame() {
    clearTimeout(gameLoopTimeout);
    
    const gameContainer = document.getElementById('game-container');
    const fZone = document.getElementById('fall-zone');
    
    if(gameContainer) gameContainer.style.display = 'none';
    if(fZone) fZone.innerHTML = '<div id="hit-line"></div>';

    notesOnScreen = [];
    isPaused = true;
    currentMode = 'step';
    
    // Supprime tout modal résiduel
    document.querySelectorAll('#level-complete-modal, #bilan-modal, #bilan-rhythm-modal').forEach(m => m.remove());
}
function playNote(noteName) {
    if (!audioContext) {
        initAudio();
    }

    // 1. Feedback visuel immédiat (la touche s'allume)
    const keyEl = document.querySelector(`.key[data-note="${noteName}"]`);
    if (keyEl) {
        const color = getNoteColor(noteName);
        keyEl.classList.add('active');
        keyEl.style.backgroundColor = color;
        keyEl.style.boxShadow = `0 0 20px ${color}, 0 0 40px white`;

        setTimeout(() => {
            keyEl.classList.remove('active');
            keyEl.style.backgroundColor = "";
            keyEl.style.boxShadow = "";
        }, 200);
    }

    // 2. Essayer de valider une note tombante (sans jouer le son pour éviter le double)
    const validated = validateNote(noteName, true);

    // 3. Si pas de note validée (faux ou mode libre), jouer le son quand même
    if (!validated) {
        const freq = getFrequency(noteName);
        if (freq) {
            playNoteSound(freq, 0.5);
        }
    }

    // 4. En mode STEP, si on a validé, il faut débloquer le jeu
    if (validated && currentMode === 'step') {
        isPaused = false;
    }
}

window.playNote = playNote;

function stopNote(note) {
    const keyEl = document.querySelector(`[data-note="${note}"]`);
    if (keyEl) {
        keyEl.classList.remove('active');
        keyEl.style.backgroundColor = "";
        keyEl.style.boxShadow = "";
    }
}

function validateNote(playedNote, skipSound = false) {
    if (currentMode === 'auto') return false;

    const hitLine = document.getElementById('hit-line');
    const hitLineY = hitLine ? hitLine.offsetTop : 450;
    
    // Cherche d'abord si cette note fait partie d'un accord en attente
    const pendingChord = notesOnScreen.find(n => {
        if (n.ok || !n.isChord) return false;
        const noteBottom = n.y + n.h;
        const lineTop = hitLineY - 50;
        const lineBottom = hitLineY + 50;
        const isOnLine = noteBottom >= lineTop && noteBottom <= lineBottom;
        // Vérifie si la note jouée fait partie de l'accord
        return isOnLine && n.notes.includes(playedNote);
    });

    // Si c'est un accord, vérifie si toutes les notes sont jouées
    if (pendingChord) {
        // Marque cette note comme détectée (temporairement)
        if (!pendingChord.detectedNotes) pendingChord.detectedNotes = new Set();
        pendingChord.detectedNotes.add(playedNote);
        
        // Vérifie si toutes les notes de l'accord sont détectées
        const allDetected = pendingChord.notes.every(n => pendingChord.detectedNotes.has(n));
        
        if (allDetected) {
            // Succès ! Toutes les notes de l'accord sont jouées
            pendingChord.ok = true;
            pendingChord.played = true;
            isPaused = false;
            
            // Joue les sons si pas déjà fait
            if (!skipSound) {
                pendingChord.notes.forEach((note, idx) => {
                    const freq = getFrequency(note);
                    if (freq) setTimeout(() => playNoteSound(freq, pendingChord.d / 1000), idx * 30);
                });
            }
            
            // Effets visuels
            const noteElements = [];
            pendingChord.notes.forEach((note, idx) => {
                const el = document.getElementById(pendingChord.id + '-' + idx);
                const targetKey = document.querySelector(`.key[data-note="${note}"]`);
                if (el && targetKey) {
                    const color = getNoteColor(note);
                    noteElements.push({ el, leftPos: parseInt(el.style.left), color, noteName: note });
                    el.style.filter = "brightness(2) saturate(2)";
                    el.style.border = "3px solid white";
                }
            });
            
            validateChord(pendingChord, noteElements);
            updateStats(pendingChord, true);
            return true;
        }
        
        // Sinon, attend les autres notes (pas encore de retour)
        return false;
    }

    // Note simple (pas un accord)
    let pendingNote = notesOnScreen.find(n => {
        if (n.ok || n.isChord) return false;
        const noteBottom = n.y + n.h;
        const lineTop = hitLineY - 30;
        const lineBottom = hitLineY + 30;
        const isOnLine = noteBottom >= lineTop && noteBottom <= lineBottom;
        return !n.ok && n.notes[0] === playedNote && isOnLine;
    });

    if (!pendingNote) {
        // Faux ou trop tôt/tard
        if (currentMode === 'step' && typeof currentSession !== 'undefined') {
            currentSession.notesMissed++;
            currentSession.streak = 0;
            updateStreakDisplay();
        }
        return false;
    }

    // Note simple trouvée
    pendingNote.ok = true;
    pendingNote.played = true;
    isPaused = false;

    // Stats
    updateStats(pendingNote, false);

    // Son
    if (!skipSound) {
        const freq = getFrequency(playedNote);
        if (freq) playNoteSound(freq, (pendingNote.d || 400) / 1000);
    }

    // Effets visuels
    const el = document.getElementById(pendingNote.id + '-0');
    const color = getNoteColor(playedNote);
    
    if(el) {
        el.style.boxShadow = `0 0 50px ${color}, 0 0 20px #fff`;
        el.style.background = "white";
        el.style.transform = 'scale(1.2)';
        el.style.zIndex = "1000";

        setTimeout(() => {
            el.style.opacity = '0';
            setTimeout(() => {
                if(el.parentNode) el.remove();
                const idx = notesOnScreen.findIndex(n => n.id === pendingNote.id);
                if(idx > -1) notesOnScreen.splice(idx, 1);
            }, 200);
        }, 100);
    }

    // Effets ligne et vapeur
    const k = document.querySelector(`.key[data-note="${playedNote}"]`);
    const fZone = document.getElementById('fall-zone');
    if(k && fZone) {
        const keyRect = k.getBoundingClientRect();
        const fZoneRect = fZone.getBoundingClientRect();
        const centerX = (keyRect.left - fZoneRect.left) + (keyRect.width / 2);

        if (typeof flashHitLine === 'function') flashHitLine(centerX, color);
        if (typeof startNoteSteam === 'function') startNoteSteam(centerX, color, pendingNote.d || 400, pendingNote.h || 40);
    }

    return true;
}

// Fonction helper pour les stats
function updateStats(noteObj, isChord) {
    if (typeof currentSession === 'undefined') return;
    
    const hitLine = document.getElementById('hit-line');
    const hitLineY = hitLine ? hitLine.offsetTop : 450;
    
    noteObj.notes.forEach((note, idx) => {
        const isLeftHand = (noteObj.hands && noteObj.hands[idx] === 'G') || 
                          (!noteObj.hands && parseInt(note.slice(-1)) <= 3);
        const handData = isLeftHand ? currentSession.left : currentSession.right;

        handData.notesHit++;
        
        if (!isChord || idx === 0) { // Compte le streak une seule fois pour les accords
            currentSession.streak++;
            if (currentSession.streak > currentSession.maxStreak) {
                currentSession.maxStreak = currentSession.streak;
            }
        }

        const noteBottom = noteObj.y + noteObj.h;
        const diff = Math.abs(noteBottom - hitLineY);
        const accuracy = Math.max(0, 100 - (diff / 2));
        handData.accuracy.push(accuracy);
        handData.timing.push(diff);
    });
    
    updateStreakDisplay();
}

function playNoteSound(frequency, duration = 0.5) {
    try {
        const ctx = initAudio();
        if (!ctx) {
            console.warn("Impossible d'obtenir l'AudioContext");
            return;
        }

        if (ctx.state === 'suspended') {
            console.log("Audio suspendu, tentative de reprise...");
            ctx.resume().then(() => {
                playNoteSound(frequency, duration);
            }).catch(e => console.error("Erreur resume:", e));
            return;
        }

        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.frequency.value = frequency;
        oscillator.type = 'triangle';

        const now = ctx.currentTime;

        const attack = 0.02;
        const decay = 0.1;
        const sustainLevel = 0.3;
        const release = Math.max(0.1, duration - attack - decay);

        if (duration <= attack + decay) {
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
        } else {
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.4, now + attack);
            gainNode.gain.linearRampToValueAtTime(sustainLevel, now + attack + decay);
            gainNode.gain.setValueAtTime(sustainLevel, now + duration - release);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
        }

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.start(now);
        oscillator.stop(now + duration);

    } catch (err) {
        console.error("Erreur playNoteSound:", err);
    }
}

function getFreq(n) {
    const noteName = n.slice(0, -1);
    const octave = parseInt(n.slice(-1));
    const semitones = noteStrings.indexOf(noteName) + (octave - 4) * 12 - 9;
    return 440 * Math.pow(2, semitones / 12);
}

function updateProfileDisplay() {
    // Met à jour la liste des profils dans le modal
    const list = document.getElementById('profiles-list');
    if (list) {
        list.innerHTML = '';
        profiles.forEach((p, index) => {
            const item = document.createElement('div');
            item.className = 'profile-item';
            item.style.borderLeft = `4px solid ${p.color || '#00f2ff'}`;
            item.innerHTML = `<span>${p.avatar || '🎹'} ${p.name} ${p.name === currentProfileName ? '✅' : ''}</span><button onclick="deleteProfile(${index}, event)" class="btn-del">❌</button>`;
            item.onclick = () => selectProfile(p.name);
            list.appendChild(item);
        });
    }
    
    // Trouve le profil actuel
    const curr = profiles.find(p => p.name === currentProfileName) || profiles[0] || { name: 'Invité', color: '#00f2ff', avatar: '🎹' };
    
    // Met à jour la barre en haut à droite (user-name et login-btn)
    const userNameEl = document.getElementById('user-name');
    const loginBtnEl = document.getElementById('login-btn');
    
    if (userNameEl) {
        userNameEl.textContent = curr.name;
    }
    
    if (loginBtnEl) {
        // Si le profil a un email = connecté
        if (curr.email) {
            loginBtnEl.textContent = '✓ Connecté';
            loginBtnEl.style.color = '#2ecc71';
            loginBtnEl.style.borderColor = '#2ecc71';
            loginBtnEl.onclick = () => {
                // Ouvre directement le menu au lieu du modal auth
                toggleMenu();
                // Passe à l'onglet profil
                setTimeout(() => openSettingsTab({currentTarget: document.querySelector('[onclick*=\"tab-profile\"]')}, 'tab-profile'), 100);
            };
        } else {
            loginBtnEl.textContent = 'Connexion';
            loginBtnEl.style.color = '';
            loginBtnEl.style.borderColor = '';
            loginBtnEl.onclick = () => {
                // Ouvre le menu pour se connecter
                toggleMenu();
                setTimeout(() => openSettingsTab({currentTarget: document.querySelector('[onclick*=\"tab-profile\"]')}, 'tab-profile'), 100);
            };
        }
    }
    
    // Met à jour la couleur du thème
    document.documentElement.style.setProperty('--accent', curr.color || '#00f2ff');
    
    // Met à jour aussi le menu latéral
    updateMenuProfileDisplay();
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
    const profileModal = document.getElementById('profile-modal');
    if (profileModal) {
        profileModal.style.display = 'flex';
        setupEmojiPicker();
    }
}

function closeProfileModal() {
    const modal = document.getElementById('profile-modal');
    if (modal) modal.style.display = 'none';
}

// CORRECTION: La fonction retourne maintenant un booléen indiquant si c'était une nouvelle completion
function saveProgress(title) {
    const currentP = profiles.find(p => p.name === currentProfileName);
    if(currentP) {
        if(!currentP.completed) currentP.completed = [];
        const wasAlreadyCompleted = currentP.completed.includes(title);

        if(!wasAlreadyCompleted) {
            currentP.completed.push(title);
            localStorage.setItem('pk_profiles', JSON.stringify(profiles));
            console.log("Progression sauvegardée:", title);
            return false; // C'était une nouvelle completion
        }
        return true; // C'était déjà complété
    }
    return true;
}

async function toggleMic() {
    const btn = document.getElementById('mic-toggle');
    if (!isMicActive) {
        try {
            microphoneStream = await navigator.mediaDevices.getUserMedia({
                audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: false }
            });

            initAudio();
            const source = audioContext.createMediaStreamSource(microphoneStream);
            audioAnalyser = audioContext.createAnalyser();
            audioAnalyser.fftSize = 2048;
            source.connect(audioAnalyser);

            isMicActive = true;
            if (btn) {
                btn.textContent = "🎤 Micro ON";
                btn.classList.add('mic-active');
            }

            let lastNoteTime = 0;
            const detect = () => {
                if (!isMicActive) return;
                audioAnalyser.getFloatTimeDomainData(pitchBuffer);

                let sum = 0;
                for (let i = 0; i < pitchBuffer.length; i++) sum += pitchBuffer[i] * pitchBuffer[i];
                const rms = Math.sqrt(sum / pitchBuffer.length);

                if (rms < 0.02) { requestAnimationFrame(detect); return; }

                let f = autoCorrelate(pitchBuffer, audioContext.sampleRate);
                if (f !== -1 && f > 60 && f < 2000) {
                    let n = getNoteFromFreq(f);
                    if (n) {
                        const now = Date.now();
                        if (n !== lastNoteTime.note || (now - lastNoteTime.time > 150)) {
                            if (currentMode === 'step') validateNote(n);
                            lastNoteTime = {note: n, time: now};
                        }
                    }
                }
                requestAnimationFrame(detect);
            };
            detect();

        } catch (err) {
            alert("Impossible d'activer le micro : " + err.message);
        }
    } else {
        isMicActive = false;
        if (btn) {
            btn.textContent = "🎤 Micro OFF";
            btn.classList.remove('mic-active');
        }
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
    return s / (maxp - b_coeff/(2*a));
}

function getNoteFromFreq(f) {
    if (f < 50 || f > 4000) return null;
    const n = 69 + 12 * Math.log2(f / 440);
    const rounded = Math.round(n);
    if(isNaN(rounded)) return null;
    return noteStrings[rounded % 12] + (Math.floor(rounded/12)-1);
}

function setupMIDI() {
    if (navigator.requestMIDIAccess) {
        navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
    }
}

function onMIDISuccess(midiAccess) {
    for (let input of midiAccess.inputs.values()) {
        input.onmidimessage = handleMIDIMessage;
    }
}

function onMIDIFailure() { console.log("MIDI non disponible."); }

function handleMIDIMessage(event) {
    const [command, note, velocity] = event.data;
    if (command === 144 && velocity > 0) {
        const noteName = midiNoteToName(note);
        validateNote(noteName);
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
        btn.style.color = "#00d9ff";
    } else {
        colorMode = 'debutant';
        btn.textContent = "Débutant";
    }
}
// Ajoutez ceci dans script.js

// ==========================================
// SYSTÈME DE SUIVI D'EVOLUTION
// ==========================================

let currentSession = {
    startTime: null,
    notesHit: 0,
    notesMissed: 0,
    streak: 0,
    maxStreak: 0,
    levelName: '',
    accuracy: []
};

const BADGES = [
    { id: 'first_note', icon: '🎹', name: 'Première Note', condition: (s) => s.totalNotes >= 1 },
    { id: 'beginner', icon: '🌱', name: 'Débutant', condition: (s) => s.totalNotes >= 50 },
    { id: 'intermediate', icon: '🎵', name: 'Intermédiaire', condition: (s) => s.totalNotes >= 200 },
    { id: 'expert', icon: '🎶', name: 'Expert', condition: (s) => s.totalNotes >= 500 },
    { id: 'master', icon: '👑', name: 'Maître', condition: (s) => s.totalNotes >= 1000 },
    { id: 'streak_10', icon: '🔥', name: 'Série de 10', condition: (s) => s.maxStreak >= 10 },
    { id: 'streak_25', icon: '⚡', name: 'Série de 25', condition: (s) => s.maxStreak >= 25 },
    { id: 'perfect', icon: '💎', name: 'Perfection', condition: (s) => s.sessions.some(ses => ses.accuracy === 100) },
    { id: 'persistent', icon: '📅', name: 'Assidu', condition: (s) => s.sessions.length >= 7 },
    { id: 'speed_demon', icon: '🚀', name: 'Rapide', condition: (s) => s.sessions.some(ses => ses.speed === 'Rapide⚡' && ses.accuracy > 80) }
];

// Initialiser les stats au démarrage d'un niveau
function initSessionTracking(levelTitle) {
    currentSession = {
        startTime: Date.now(),
        levelName: levelTitle,
        left: { notesHit: 0, notesMissed: 0, accuracy: [], timing: [] },
        right: { notesHit: 0, notesMissed: 0, accuracy: [], timing: [] },
        maxStreak: 0, // Streak global (pas séparé par main pour simplifier)
        streak: 0
    };
    updateStreakDisplay();
}

// Mettre à jour l'affichage du streak
function updateStreakDisplay() {
    let streakEl = document.getElementById('streak-indicator');
    if (!streakEl) {
        streakEl = document.createElement('div');
        streakEl.id = 'streak-indicator';
        streakEl.className = 'streak-indicator';
        document.body.appendChild(streakEl);
    }

    if (currentSession.streak > 2) {
        streakEl.textContent = `🔥 ${currentSession.streak}`;
        streakEl.classList.add('active');

        // Effet visuel spécial pour les gros streaks
        if (currentSession.streak >= 10) {
            streakEl.style.background = 'linear-gradient(135deg, #ff0080, #ff8c00)';
            streakEl.style.boxShadow = '0 0 30px #ff0080';
        }
    } else {
        streakEl.classList.remove('active');
    }
}

// Remplacer la fonction validateNote existante pour ajouter le tracking
const originalValidateNote = validateNote;
validateNote = function(playedNote) {
    const result = originalValidateNote(playedNote);

    // Si la validation a réussi (note trouvée et correcte)
    const pendingNote = notesOnScreen.find(n => !n.ok && n.played && n.note === playedNote);
    if (pendingNote) {
        // Succès
        currentSession.notesHit++;
        currentSession.streak++;
        if (currentSession.streak > currentSession.maxStreak) {
            currentSession.maxStreak = currentSession.streak;
        }

        // Calculer la précision de timing (0-100%)
        const fZone = document.getElementById('fall-zone');
        const hitLine = document.getElementById('hit-line');
        if (fZone && hitLine) {
            const hitLineY = hitLine.offsetTop;
            const noteBottom = pendingNote.y + pendingNote.h;
            const diff = Math.abs(noteBottom - hitLineY);
            const accuracy = Math.max(0, 100 - (diff / 2)); // Plus c'est proche de 0, mieux c'est
            currentSession.accuracy.push(accuracy);
        }
    } else {
        // Échec
        currentSession.notesMissed++;
        currentSession.streak = 0;
    }

    updateStreakDisplay();
    return result;
};

// Sauvegarder la session à la fin du niveau
const originalShowLevelComplete = showLevelComplete;
showLevelComplete = function() {
    // Calcule les temps et scores finaux
    const sessionDuration = Math.round((Date.now() - currentSession.startTime) / 1000); // en secondes

    // Calcule les moyennes pour chaque main
    const leftAcc = currentSession.left.accuracy.length > 0
        ? Math.round(currentSession.left.accuracy.reduce((a,b)=>a+b,0) / currentSession.left.accuracy.length)
        : 0;
    const rightAcc = currentSession.right.accuracy.length > 0
        ? Math.round(currentSession.right.accuracy.reduce((a,b)=>a+b,0) / currentSession.right.accuracy.length)
        : 0;
    const leftTime = currentSession.left.timing.length > 0
        ? Math.round(currentSession.left.timing.reduce((a,b)=>a+b,0) / currentSession.left.timing.length)
        : 0;
    const rightTime = currentSession.right.timing.length > 0
        ? Math.round(currentSession.right.timing.reduce((a,b)=>a+b,0) / currentSession.right.timing.length)
        : 0;

    const totalNotes = currentSession.left.notesHit + currentSession.right.notesHit +
                       currentSession.left.notesMissed + currentSession.right.notesMissed;

    // Prépare les données de session
    const sessionData = {
        date: new Date().toISOString(),
        level: currentSession.levelName,
        duration: Math.round(sessionDuration / 60), // en minutes pour l'affichage
        totalNotes: totalNotes,
        leftAccuracy: leftAcc,
        rightAccuracy: rightAcc,
        leftTiming: leftTime,
        rightTiming: rightTime,
        // Moyennes globales pour compatibilité
        accuracy: Math.round((leftAcc + rightAcc) / 2) || 0,
        timing: Math.round((leftTime + rightTime) / 2) || 0,
        speed: getSpeedLabel(currentSpeed),
        streak: currentSession.maxStreak
    };

    // SAUVEGARDE LES STATS (c'est cette ligne qui manquait probablement)
    saveSessionStats(sessionData);

    // Sauvegarde aussi la progression de déblocage
    saveProgress(currentSession.levelName);

    // Appelle la fonction originale qui affiche le modal
    return originalShowLevelComplete();
};

function getSpeedLabel(speed) {
    if (speed <= 2) return 'Lent🐢';
    if (speed >= 7) return 'Rapide⚡';
    return 'Normal🚶';
}

// Sauvegarder dans localStorage par profil
function saveSessionStats(sessionData) {
    const currentP = profiles.find(p => p.name === currentProfileName);
    if (!currentP) return;

    if (!currentP.stats) {
        currentP.stats = { sessions: [] };
    }

    // Récupérer la catégorie actuelle (cours, exercices, apprentissage, musique)
    // currentTabType est défini dans switchTab
    const category = currentTabType || 'cours';

    // Enrichir les données de session avec la catégorie
    const sessionWithMeta = {
        ...sessionData,
        category: category,
        timestamp: Date.now(),
        id: Date.now().toString(36) + Math.random().toString(36).substr(2)
    };

    // Ajouter au début du tableau (plus récent d'abord)
    currentP.stats.sessions.unshift(sessionWithMeta);

    // Garder seulement les 50 dernières sessions pour ne pas surcharger le stockage
    if (currentP.stats.sessions.length > 50) {
        currentP.stats.sessions = currentP.stats.sessions.slice(0, 50);
    }

    localStorage.setItem('pk_profiles', JSON.stringify(profiles));
    console.log(`💾 Stats sauvegardées: ${sessionData.level} [${category}]`);
}

function renderStats(filterCategory = 'all') {
    const currentP = profiles.find(p => p.name === currentProfileName);
    let sessions = currentP?.stats?.sessions || [];

    // Filtrer par catégorie si ce n'est pas 'all'
    if (filterCategory !== 'all') {
        sessions = sessions.filter(s => s.category === filterCategory);
    }

    // Prendre les 10 dernières sessions pour l'affichage
    const recentSessions = sessions.slice(0, 10).reverse();

    // Injecter le sélecteur de catégorie s'il n'existe pas encore
    const modalContent = document.querySelector('#stats-modal .modal-content');
    let selectorContainer = document.getElementById('stats-category-selector');
    if (!selectorContainer) {
        selectorContainer = document.createElement('div');
        selectorContainer.id = 'stats-category-selector';
        // Insérer après le titre h3
        const title = modalContent.querySelector('h3');
        if (title && title.nextSibling) {
            modalContent.insertBefore(selectorContainer, title.nextSibling);
        } else {
            modalContent.appendChild(selectorContainer);
        }
    }

    // Créer les boutons de catégories
    const categories = [
        { key: 'all', label: '📊 Tout', color: '#fff' },
        { key: 'cours', label: '📚 Cours', color: '#00f2ff' },
        { key: 'exercices', label: '💪 Exercices', color: '#ff9f43' },
        { key: 'apprentissage', label: '🎵 Apprentissage', color: '#a29bfe' },
        { key: 'musique', label: '🎼 Musiques', color: '#fd79a8' }
    ];

    selectorContainer.innerHTML = `
        <div style="display: flex; gap: 8px; margin: 20px 0; flex-wrap: wrap; justify-content: center;">
            ${categories.map(cat => `
                <button onclick="renderStats('${cat.key}')"
                    style="
                        padding: 8px 14px;
                        border-radius: 20px;
                        border: 2px solid ${filterCategory === cat.key ? cat.color : 'rgba(255,255,255,0.2)'};
                        background: ${filterCategory === cat.key ? cat.color + '30' : 'transparent'};
                        color: ${filterCategory === cat.key ? cat.color : '#fff'};
                        cursor: pointer;
                        font-size: 0.8rem;
                        font-weight: ${filterCategory === cat.key ? 'bold' : 'normal'};
                        transition: all 0.3s ease;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    "
                    onmouseover="this.style.borderColor='${cat.color}'; this.style.transform='translateY(-2px)'"
                    onmouseout="this.style.borderColor='${filterCategory === cat.key ? cat.color : 'rgba(255,255,255,0.2)'}'; this.style.transform='translateY(0)'">
                    ${cat.label}
                </button>
            `).join('')}
        </div>
        <div style="text-align: center; margin-bottom: 15px; font-size: 0.75rem; color: #666; text-transform: uppercase; letter-spacing: 1px;">
            ${filterCategory === 'all' ? 'Vue globale' : `Vue: ${categories.find(c => c.key === filterCategory)?.label || filterCategory}`}
            • ${sessions.length} session${sessions.length > 1 ? 's' : ''}
        </div>
    `;

    // Gestion du cas où il n'y a pas de données
    if (recentSessions.length === 0) {
        const emptyMsg = filterCategory === 'all'
            ? 'Complétez un niveau pour voir vos statistiques'
            : `Aucune session enregistrée dans "${categories.find(c => c.key === filterCategory)?.label || filterCategory}"`;

        document.getElementById('avg-precision').innerHTML = `
            <span style="color:#666;font-size:0.85rem; display: flex; align-items: center; justify-content: center; gap: 8px;">
                <span style="font-size: 1.2rem;">📈</span> ${emptyMsg}
            </span>
        `;
        document.getElementById('avg-rhythm').innerHTML = `<span style="color:#666;font-size:0.85rem">--</span>`;

        document.getElementById('precision-chart').innerHTML = `
            <div style="display:flex; flex-direction: column; align-items:center; justify-content:center; height:100%; color:#555; font-size:0.9rem; gap: 10px;">
                <span style="font-size: 2.5rem; opacity: 0.5;">🎯</span>
                <span style="text-align: center; line-height: 1.4;">${emptyMsg}</span>
            </div>
        `;
        document.getElementById('rhythm-chart').innerHTML = '';
        return;
    }

    // Calculer les moyennes pour les stats affichées en haut
    const lastSession = recentSessions[recentSessions.length - 1]; // La plus récente

    // Affichage des moyennes Main Droite / Main Gauche de la dernière session
    const leftAcc = lastSession.leftAccuracy || lastSession.accuracy || 0;
    const rightAcc = lastSession.rightAccuracy || lastSession.accuracy || 0;
    const leftTime = lastSession.leftTiming || lastSession.timing || 0;
    const rightTime = lastSession.rightTiming || lastSession.timing || 0;

    // Affichage avec barres miniatures
    const createMiniBar = (val, color, max = 100) => {
        const width = Math.min(100, (val / max) * 100);
        return `<div style="display:inline-block;width:25px;height:3px;background:rgba(255,255,255,0.2);border-radius:2px;margin-right:5px;vertical-align:middle;">
            <div style="width:${width}%;height:100%;background:${color};border-radius:2px;box-shadow:0 0 5px ${color}"></div>
        </div>`;
    };

    document.getElementById('avg-precision').innerHTML = `
        <div style="display:flex; gap:20px; justify-content:center; align-items:center; flex-wrap: wrap;">
            <div style="text-align: center;">
                <div style="font-size: 0.65rem; color: #00f2ff; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 3px;">Main Droite</div>
                <div style="font-size: 1.1rem; font-weight: bold; color: #00f2ff;">
                    ${createMiniBar(rightAcc, '#00f2ff')} ${rightAcc}%
                </div>
            </div>
            <div style="width: 1px; height: 25px; background: rgba(255,255,255,0.1);"></div>
            <div style="text-align: center;">
                <div style="font-size: 0.65rem; color: #ff4b2b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 3px;">Main Gauche</div>
                <div style="font-size: 1.1rem; font-weight: bold; color: #ff4b2b;">
                    ${createMiniBar(leftAcc, '#ff4b2b')} ${leftAcc}%
                </div>
            </div>
        </div>
    `;

    document.getElementById('avg-rhythm').innerHTML = `
        <div style="display:flex; gap:20px; justify-content:center; align-items:center; flex-wrap: wrap;">
            <div style="text-align: center;">
                <div style="font-size: 0.65rem; color: #00f2ff; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 3px;">Droite</div>
                <div style="font-size: 1rem; font-weight: bold; color: #00f2ff;">${rightTime}ms</div>
            </div>
            <div style="width: 1px; height: 20px; background: rgba(255,255,255,0.1);"></div>
            <div style="text-align: center;">
                <div style="font-size: 0.65rem; color: #ff4b2b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 3px;">Gauche</div>
                <div style="font-size: 1rem; font-weight: bold; color: #ff4b2b;">${leftTime}ms</div>
            </div>
        </div>
    `;

    // Générer les graphiques avec les sessions filtrées
    document.getElementById('precision-chart').innerHTML = createDualLineChart(recentSessions, 'accuracy', '%', '#00f2ff', '#ff4b2b');
    document.getElementById('rhythm-chart').innerHTML = createDualLineChart(recentSessions, 'timing', 'ms', '#00f2ff', '#ff4b2b', true);

    // Ajouter un historique textuel sous les graphiques (optionnel mais pratique)
    const historyContainer = document.getElementById('session-history-container');
    if (historyContainer) {
        historyContainer.innerHTML = recentSessions.map(s => {
            const catColors = { 'cours': '#00f2ff', 'exercices': '#ff9f43', 'apprentissage': '#a29bfe', 'musique': '#fd79a8' };
            const color = catColors[s.category] || '#fff';
            const date = new Date(s.date || s.timestamp);
            const dateStr = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

            return `
                <div style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px 12px;
                    margin: 5px 0;
                    background: rgba(255,255,255,0.03);
                    border-radius: 8px;
                    border-left: 3px solid ${color};
                    font-size: 0.85rem;
                ">
                    <div style="flex: 1; text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        <span style="color: ${color}; font-weight: bold; font-size: 0.7rem; text-transform: uppercase; margin-right: 8px;">${s.category}</span>
                        <span style="color: #fff;">${s.level}</span>
                    </div>
                    <div style="text-align: right; min-width: 80px;">
                        <div style="color: ${s.accuracy >= 90 ? '#2ecc71' : s.accuracy >= 80 ? '#f1c40f' : '#ff6b6b'}; font-weight: bold;">
                            ${s.accuracy}%
                        </div>
                        <div style="font-size: 0.7rem; color: #666;">${dateStr}</div>
                    </div>
                </div>
            `;
        }).join('');
    }
}
// Vérifier et attribuer les badges
function checkBadges() {
    const currentP = profiles.find(p => p.name === currentProfileName);
    if (!currentP || !currentP.stats) return;

    const newBadges = [];
    BADGES.forEach(badge => {
        if (!currentP.stats.badges.includes(badge.id) && badge.condition(currentP.stats)) {
            currentP.stats.badges.push(badge.id);
            newBadges.push(badge);
        }
    });

    if (newBadges.length > 0) {
        localStorage.setItem('pk_profiles', JSON.stringify(profiles));
        showBadgeNotification(newBadges);
    }
}

// Notification de nouveau badge
function showBadgeNotification(badges) {
    badges.forEach((badge, index) => {
        setTimeout(() => {
            const notif = document.createElement('div');
            notif.style.cssText = `
                position: fixed;
                top: ${100 + index * 100}px;
                right: 20px;
                background: linear-gradient(135deg, #ffd700, #ff8c00);
                color: #000;
                padding: 20px;
                border-radius: 15px;
                box-shadow: 0 0 30px rgba(255, 215, 0, 0.5);
                z-index: 10000;
                animation: slideInRight 0.5s ease-out;
                font-weight: bold;
            `;
            notif.innerHTML = `🏆 Nouveau Badge !<br><span style="font-size: 2rem;">${badge.icon}</span> ${badge.name}`;
            document.body.appendChild(notif);

            setTimeout(() => {
                notif.style.animation = 'slideOutRight 0.5s ease-in';
                setTimeout(() => notif.remove(), 500);
            }, 3000);
        }, index * 200);
    });
}

// Ouvrir le modal de stats
function openStatsModal() {
    const modal = document.getElementById('stats-modal');
    if (modal) {
        modal.style.display = 'flex';
        renderStats();
    }
}

function closeStatsModal() {
    const modal = document.getElementById('stats-modal');
    if (modal) modal.style.display = 'none';
}

function renderStats() {
    const currentP = profiles.find(p => p.name === currentProfileName);
    const sessions = currentP?.stats?.sessions?.slice(0, 10).reverse() || [];

    if (sessions.length === 0) {
        document.getElementById('avg-precision').innerHTML = '<span style="color:#666;font-size:0.8em">Jouez un cours pour voir les stats</span>';
        document.getElementById('avg-rhythm').innerHTML = '<span style="color:#666;font-size:0.8em">Aucune donnée</span>';
        document.getElementById('precision-chart').innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#555;font-size:0.9rem;flex-direction:column;gap:10px;"><span style="font-size:2rem;">📊</span><span>Complétez un niveau pour voir votre progression</span></div>';
        document.getElementById('rhythm-chart').innerHTML = '';
        return;
    }

    const last = sessions[sessions.length-1];

    // Affichage amélioré avec barres de progression visuelles
    const createMiniBar = (val, color, max = 100) => {
        const width = Math.min(100, (val / max) * 100);
        return `<div style="display:inline-block;width:30px;height:4px;background:rgba(255,255,255,0.2);border-radius:2px;margin-right:5px;vertical-align:middle;">
            <div style="width:${width}%;height:100%;background:${color};border-radius:2px;box-shadow:0 0 5px ${color}"></div>
        </div>`;
    };

    document.getElementById('avg-precision').innerHTML = `
        <div style="display:flex;gap:15px;justify-content:center;align-items:center;">
            <span style="color:#00f2ff">${createMiniBar(last.rightAccuracy || 0, '#00f2ff')} MD ${last.rightAccuracy || 0}%</span>
            <span style="color:rgba(255,255,255,0.3)">|</span>
            <span style="color:#ff4b2b">${createMiniBar(last.leftAccuracy || 0, '#ff4b2b')} MG ${last.leftAccuracy || 0}%</span>
        </div>
    `;

    document.getElementById('avg-rhythm').innerHTML = `
        <div style="display:flex;gap:15px;justify-content:center;align-items:center;">
            <span style="color:#00f2ff">MD ${last.rightTiming || 0}ms</span>
            <span style="color:rgba(255,255,255,0.3)">|</span>
            <span style="color:#ff4b2b">MG ${last.leftTiming || 0}ms</span>
        </div>
    `;

    // Génère les beaux graphiques
    document.getElementById('precision-chart').innerHTML = createDualLineChart(sessions, 'accuracy', '%', '#00f2ff', '#ff4b2b');
    document.getElementById('rhythm-chart').innerHTML = createDualLineChart(sessions, 'timing', 'ms', '#00f2ff', '#ff4b2b', true);
}function resetStats() {
    if (!confirm('Êtes-vous sûr de vouloir effacer toutes vos statistiques ?\nCette action est irréversible.')) {
        return;
    }

    const currentP = profiles.find(p => p.name === currentProfileName);
    if (currentP && currentP.stats) {
        // Réinitialise uniquement les sessions, garde les autres stats si besoin
        currentP.stats.sessions = [];
        currentP.stats.maxStreak = 0;
        currentP.stats.totalNotes = 0;
        currentP.stats.totalTime = 0;
        currentP.stats.dailyProgress = {};
        currentP.stats.badges = [];

        localStorage.setItem('pk_profiles', JSON.stringify(profiles));

        // Rafraîchit l'affichage
        renderStats();

        // feedback visuel
        const btn = document.querySelector('#stats-modal button[onclick="resetStats()"]');
        const originalText = btn.innerHTML;
        btn.innerHTML = '✓ Effacé';
        btn.style.color = '#2ecc71';
        btn.style.borderColor = '#2ecc71';

        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.color = '#888';
            btn.style.borderColor = '#666';
        }, 2000);
    }
}

// N'oubliez pas d'exporter la fonction
window.resetStats = resetStats;
function createDualLineChart(sessions, dataKey, unit, colorRight, colorLeft, invertScale = false) {
    if (sessions.length < 2) {
        return '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#555;font-size:0.8rem">Besoin de 2+ sessions</div>';
    }

    const width = 400; // Plus grand pour meilleure qualité
    const height = 200;
    const padding = { top: 20, right: 20, bottom: 40, left: 40 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Données
    const rightValues = sessions.map(s => s[dataKey + 'Right'] || s[dataKey] || 0);
    const leftValues = sessions.map(s => s[dataKey + 'Left'] || s[dataKey] || 0);
    const allValues = [...rightValues, ...leftValues];

    // Échelle
    let max = Math.max(...allValues, dataKey === 'accuracy' ? 100 : 200);
    let min = 0;
    if (dataKey === 'accuracy') min = Math.max(0, Math.min(...allValues) - 10);
    const range = max - min || 1;

    const getX = (i) => padding.left + (i / (sessions.length - 1)) * chartWidth;
    const getY = (val) => padding.top + chartHeight - ((val - min) / range) * chartHeight;

    // Créer ligne lissée (courbe de Bézier)
    const createSmoothPath = (values) => {
        if (values.length === 0) return '';
        const points = values.map((val, i) => [getX(i), getY(val)]);

        if (points.length === 1) return `M ${points[0][0]} ${points[0][1]}`;

        let d = `M ${points[0][0]} ${points[0][1]}`;

        for (let i = 1; i < points.length; i++) {
            const prev = points[i-1];
            const curr = points[i];
            const next = points[i+1] || curr;

            // Points de contrôle pour Bézier
            const cp1x = prev[0] + (curr[0] - prev[0]) * 0.5;
            const cp1y = prev[1];
            const cp2x = curr[0] - (next[0] - prev[0]) * 0.2;
            const cp2y = curr[1];

            d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr[0]} ${curr[1]}`;
        }
        return d;
    };

    // Créer zone sous courbe (pour dégradé)
    const createAreaPath = (values) => {
        const linePath = createSmoothPath(values);
        if (!linePath) return '';
        const lastX = getX(values.length - 1);
        const firstX = getX(0);
        const bottomY = padding.top + chartHeight;
        return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
    };

    // Grille horizontale
    let gridLines = '';
    for (let i = 0; i <= 4; i++) {
        const y = padding.top + (chartHeight * i / 4);
        const value = Math.round(max - (range * i / 4));
        gridLines += `
            <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}"
                  stroke="rgba(255,255,255,0.1)" stroke-width="1" stroke-dasharray="4,4"/>
            <text x="${padding.left - 10}" y="${y + 4}" fill="rgba(255,255,255,0.5)"
                  font-size="10" text-anchor="end">${value}</text>
        `;
    }

    // Légende en bas
    const legendY = height - 10;

    return `
        <svg viewBox="0 0 ${width} ${height}" style="width:100%; height:100%;" preserveAspectRatio="none">
            <defs>
                <linearGradient id="gradR-${dataKey}" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:${colorRight};stop-opacity:0.4" />
                    <stop offset="100%" style="stop-color:${colorRight};stop-opacity:0" />
                </linearGradient>
                <linearGradient id="gradL-${dataKey}" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:${colorLeft};stop-opacity:0.4" />
                    <stop offset="100%" style="stop-color:${colorLeft};stop-opacity:0" />
                </linearGradient>
                <filter id="glow-${dataKey}">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                    <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
            </defs>

            <!-- Grille -->
            ${gridLines}

            <!-- Zones ombrées -->
            <path d="${createAreaPath(rightValues)}" fill="url(#gradR-${dataKey})" opacity="0.6" />
            <path d="${createAreaPath(leftValues)}" fill="url(#gradL-${dataKey})" opacity="0.6" />

            <!-- Lignes principales avec effet glow -->
            <path d="${createSmoothPath(rightValues)}" fill="none" stroke="${colorRight}"
                  stroke-width="3" filter="url(#glow-${dataKey})" stroke-linecap="round"/>
            <path d="${createSmoothPath(leftValues)}" fill="none" stroke="${colorLeft}"
                  stroke-width="3" filter="url(#glow-${dataKey})" stroke-linecap="round"/>

            <!-- Points -->
            ${rightValues.map((val, i) => `
                <circle cx="${getX(i)}" cy="${getY(val)}" r="4" fill="${colorRight}" stroke="white" stroke-width="2"
                        filter="url(#glow-${dataKey})">
                    <title>${sessions[i].level}: ${Math.round(val)}${unit}</title>
                </circle>
            `).join('')}
            ${leftValues.map((val, i) => `
                <circle cx="${getX(i)}" cy="${getY(val)}" r="4" fill="${colorLeft}" stroke="white" stroke-width="2"
                        filter="url(#glow-${dataKey})">
                    <title>${sessions[i].level}: ${Math.round(val)}${unit}</title>
                </circle>
            `).join('')}

            <!-- Légende -->
            <text x="${width/2 - 60}" y="${legendY}" fill="${colorRight}" font-size="12" font-weight="bold" text-anchor="middle">
                ● Main Droite
            </text>
            <text x="${width/2 + 60}" y="${legendY}" fill="${colorLeft}" font-size="12" font-weight="bold" text-anchor="middle">
                ● Main Gauche
            </text>

            <!-- Ligne de seuil pour précision (ligne des 80%) -->
            ${dataKey === 'accuracy' ? `
                <line x1="${padding.left}" y1="${getY(80)}" x2="${width - padding.right}" y2="${getY(80)}"
                      stroke="rgba(255,255,255,0.3)" stroke-width="1" stroke-dasharray="2,2"/>
                <text x="${width - padding.right + 5}" y="${getY(80) + 4}" fill="rgba(255,255,255,0.5)" font-size="9">80%</text>
            ` : ''}
        </svg>
    `;
}function createLineChart(sessions, dataKey, unit, color) {
    if (sessions.length < 2) {
        return '<div style="display:flex; align-items:center; justify-content:center; height:100%; color:#555; font-size:0.8rem;">Besoin de plus de sessions</div>';
    }

    const values = sessions.map(s => s[dataKey] || 0);
    const max = Math.max(...values, dataKey === 'accuracy' ? 100 : 200);
    const min = Math.min(...values, 0);
    const range = max - min || 1;

    const width = 100;
    const height = 100;
    const padding = 10;

    // Crée les points SVG
    let points = '';
    const stepX = (width - 2 * padding) / (values.length - 1);

    values.forEach((val, i) => {
        const x = padding + i * stepX;
        const y = height - padding - ((val - min) / range) * (height - 2 * padding);
        points += `${x},${y} `;
    });

    // Crée les cercles pour chaque point
    let circles = '';
    values.forEach((val, i) => {
        const x = padding + i * stepX;
        const y = height - padding - ((val - min) / range) * (height - 2 * padding);
        circles += `<circle cx="${x}" cy="${y}" r="3" fill="${color}" stroke="white" stroke-width="1">
            <title>${Math.round(val)}${unit} - ${sessions[i].level}</title>
        </circle>`;
    });

    return `
        <svg viewBox="0 0 100 100" style="width:100%; height:100%;" preserveAspectRatio="none">
            <defs>
                <linearGradient id="grad-${dataKey}" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:${color};stop-opacity:0.3" />
                    <stop offset="100%" style="stop-color:${color};stop-opacity:0" />
                </linearGradient>
            </defs>
            <!-- Zone remplie sous la courbe -->
            <polygon points="${points} ${padding + (values.length-1)*stepX},${height} ${padding},${height}"
                     fill="url(#grad-${dataKey})" />
            <!-- Ligne de la courbe -->
            <polyline points="${points}"
                     fill="none"
                     stroke="${color}"
                     stroke-width="2"
                     stroke-linecap="round"
                     stroke-linejoin="round"/>
            ${circles}
        </svg>
    `;
}
function renderChart(dailyProgress) {
    const container = document.getElementById('progress-chart');
    container.innerHTML = '';

    const days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().split('T')[0]);
    }

    const maxValue = Math.max(...days.map(d => dailyProgress[d] || 0), 10);

    days.forEach((day, index) => {
        const value = dailyProgress[day] || 0;
        const height = (value / maxValue) * 100;
        const bar = document.createElement('div');
        bar.className = 'chart-bar';
        bar.style.height = height + '%';
        bar.setAttribute('data-value', value);

        const label = document.createElement('div');
        label.className = 'chart-label';
        label.textContent = ['D', 'L', 'M', 'M', 'J', 'V', 'S'][new Date(day).getDay()];
        label.style.left = ((index + 0.5) / 7 * 100) + '%';

        container.appendChild(bar);
        container.appendChild(label);
    });
}

function renderSessionHistory(sessions) {
    const container = document.getElementById('session-history');
    if (!sessions || sessions.length === 0) {
        container.innerHTML = '<p style="color: #888; text-align: center;">Aucune session enregistrée</p>';
        return;
    }

    container.innerHTML = sessions.slice(0, 10).map(session => {
        const date = new Date(session.date);
        const dateStr = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
        const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

        let grade = 'C';
        let color = '#e74c3c';
        if (session.accuracy >= 95) { grade = 'S'; color = '#00f2ff'; }
        else if (session.accuracy >= 90) { grade = 'A'; color = '#2ecc71'; }
        else if (session.accuracy >= 80) { grade = 'B'; color = '#f1c40f'; }

        return `
            <div class="session-item">
                <div class="session-info">
                    <h4>${session.level}</h4>
                    <p>${dateStr} à ${timeStr} • ${session.duration}min • ${session.speed}</p>
                </div>
                <div class="session-score">
                    <div class="score-value" style="color: ${color};">${grade}</div>
                    <div class="score-label">${session.accuracy}%</div>
                </div>
            </div>
        `;
    }).join('');
}

function renderBadges(unlockedBadges) {
    const container = document.getElementById('badges-container');
    container.innerHTML = BADGES.map(badge => {
        const isUnlocked = unlockedBadges.includes(badge.id);
        return `
            <div class="badge-item ${isUnlocked ? 'unlocked' : ''}" title="${badge.name}">
                ${badge.icon}
                <div class="badge-name">${badge.name}</div>
            </div>
        `;
    }).join('');
}

const originalStartGame = startGame;
startGame = function(data, mode) {
    // Initialise le tracking avec le nom du niveau
    initSessionTracking(data.titre);

    // Appelle la fonction originale
    return originalStartGame(data, mode);
};

// Ajouter le bouton dans la barre de profil
document.addEventListener('DOMContentLoaded', () => {
    const profileLeft = document.querySelector('.profile-left');
    if (profileLeft) {
        const statsBtn = document.createElement('button');
        statsBtn.innerHTML = '📊 Stats';
        statsBtn.onclick = openStatsModal;
        statsBtn.style.cssText = 'background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 0 15px; border-radius: 12px; height: 42px; cursor: pointer;';
        profileLeft.appendChild(statsBtn);
    }// Fermer les modals en cliquant sur le fond noir (hors du contenu)
document.querySelectorAll('.modal, .modal-overlay').forEach(modal => {
    modal.addEventListener('click', function(e) {
        if (e.target === this) { // Si on clique sur le fond, pas sur le contenu
            this.style.display = 'none';
        }
    });
});

// Bouton retour Android pour fermer les modals
document.addEventListener('backbutton', function(e) {
    const openModals = document.querySelectorAll('.modal[style*="flex"], .modal-overlay[style*="flex"], #stats-modal[style*="flex"], #profile-modal[style*="flex"]');

    if (openModals.length > 0) {
        e.preventDefault(); // Empêche de quitter l'app
        openModals.forEach(m => m.style.display = 'none'); // Ferme le modal
    } else {
        // Sinon quitte l'app normalement
        if (confirm('Quitter PianoKid ?')) {
            navigator.app.exitApp(); // Sur Android WebView
        }
    }
}, false);
});

// Export pour le HTML
window.openStatsModal = openStatsModal;
window.closeStatsModal = closeStatsModal;
// EXPORTS
window.openPartitionModal = openPartitionModal;
window.closePartitionModal = closePartitionModal;
window.loadPartitionFile = loadPartitionFile;
window.setImportDifficulty = setImportDifficulty;
window.transposeImport = transposeImport;
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
window.unlockPro = () => {};
window.quitGame = quitGame;
window.handleAuth = () => {};
window.handleGoogleAuth = () => {};
window.handleLogout = () => {};
window.toggleAuthMode = () => {};
window.initAudio = initAudio;
window.continueToNextLevel = continueToNextLevel;
window.closeLevelComplete = closeLevelComplete;
function completeLevel() {
    const currentP = profiles.find(p => p.name === currentProfileName);
    if (!currentP) return;

    // LOGIQUE DES SOUS-NIVEAUX
    if (currentSubLevel === 1) {
        // On a fini le .1, on passe au .2 du MÊME cours
        currentSubLevel = 2;

        // Message de transition
        const msg = document.createElement('div');
        msg.innerHTML = "✨ NIVEAU 1.1 COMPLÉTÉ !<br><small>Passage au niveau 1.2 (Normal)</small>";
        msg.style = "position:fixed; top:20%; left:50%; transform:translate(-50%,-50%); background:rgba(0,0,0,0.85); color:#00f2ff; padding:20px; border-radius:15px; border:2px solid #00f2ff; z-index:10000; text-align:center; font-weight:bold; font-family:sans-serif;";
        document.body.appendChild(msg);
        setTimeout(() => msg.remove(), 2000);

        // On recharge le même cours (le titre s'actualisera en 1.2)
        loadLevel(currentLevelIndex);

    } else {
        // On a fini le .2, on réinitialise le sous-niveau et on passe au cours suivant
        currentSubLevel = 1;

        // Sauvegarde de la progression dans le profil
        if (!currentP.stats.unlockedLevels.includes(currentLevelIndex + 1)) {
            currentP.stats.unlockedLevels.push(currentLevelIndex + 1);
        }

        currentLevelIndex++;
        saveProfiles();

        if (currentLevelIndex < levels.length) {
            loadLevel(currentLevelIndex);
        } else {
            alert("Félicitations ! Parcours terminé !");
            goBackToMenu();
        }
    }
}
// ==========================================
// MODAL PROGRESSION - Ajouté proprement
// ==========================================

function openProgressModal() {
    const modal = document.getElementById('progress-modal');
    if (modal) {
        renderProgressModal();
        modal.style.display = 'flex';
    }
}

function closeProgressModal() {
    const modal = document.getElementById('progress-modal');
    if (modal) modal.style.display = 'none';
}

function calculateDetailedProgress() {
    const currentP = profiles.find(p => p.name === currentProfileName);
    if (!currentP) return null;

    const completed = currentP.completed || [];
    const sessions = currentP.stats?.sessions || [];

    // Compter par catégorie
    const coursTotal = DATA.cours.filter(c => !c.type).length;
    const exercicesTotal = DATA.exercices.length;
    const apprentissageTotal = DATA.apprentissage.length;
    const musiqueTotal = DATA.musique.length;

    const coursDone = completed.filter(t => DATA.cours.some(c => c.titre === t && !c.type)).length;
    const exercicesDone = completed.filter(t => DATA.exercices.some(e => e.titre === t)).length;
    const apprentissageDone = completed.filter(t => DATA.apprentissage.some(a => a.titre === t)).length;
    const musiqueDone = completed.filter(t => DATA.musique.some(m => m.titre === t)).length;

    const totalLevels = coursTotal + exercicesTotal + apprentissageTotal + musiqueTotal;
    const totalDone = coursDone + exercicesDone + apprentissageDone + musiqueDone;
    const remaining = totalLevels - totalDone;

    // Calculer temps moyen
    let avgTime = 15;
    if (sessions.length > 0) {
        const totalTime = sessions.reduce((sum, s) => sum + (s.duration || 15), 0);
        avgTime = totalTime / sessions.length;
    }

    // Vitesse
    let levelsPerWeek = 2;
    if (sessions.length >= 2) {
        const first = new Date(sessions[sessions.length-1]?.date || sessions[sessions.length-1]?.timestamp || Date.now());
        const last = new Date(sessions[0]?.date || sessions[0]?.timestamp || Date.now());
        const weeks = Math.max(1, (last - first) / (1000 * 60 * 60 * 24 * 7));
        levelsPerWeek = Math.max(0.5, sessions.length / weeks);
    }

    return {
        cours: { done: coursDone, total: coursTotal, label: 'Cours', icon: '📚', color: '#00f2ff' },
        exercices: { done: exercicesDone, total: exercicesTotal, label: 'Exercices', icon: '💪', color: '#ff9f43' },
        apprentissage: { done: apprentissageDone, total: apprentissageTotal, label: 'Apprentissage', icon: '🎵', color: '#a29bfe' },
        musique: { done: musiqueDone, total: musiqueTotal, label: 'Musiques', icon: '🎼', color: '#fd79a8' },
        totalDone: totalDone,
        totalLevels: totalLevels,
        remaining: remaining,
        progress: totalLevels > 0 ? Math.round((totalDone / totalLevels) * 100) : 0,
        avgTime: Math.round(avgTime),
        estimatedHours: Math.round((remaining * avgTime / 60) * 10) / 10,
        estimatedWeeks: Math.round((remaining / levelsPerWeek) * 10) / 10,
        levelsPerWeek: Math.round(levelsPerWeek * 10) / 10
    };
}

function renderProgressModal() {
    console.log("=== RENDER PROGRESS MODAL ===");
    
    const currentP = profiles.find(p => p.name === currentProfileName) || profiles[0];
    if (!currentP) {
        console.error("Pas de profil trouvé");
        return;
    }

    const sessions = currentP.stats?.sessions || [];
    const completed = currentP.completed || [];
    const totalNotes = sessions.reduce((sum, s) => sum + (s.totalNotes || 0), 0);
    
    console.log("Sessions:", sessions.length, "Completed:", completed.length, "Total notes:", totalNotes);

    // --- BARRE PRINCIPALE ---
    const totalLevels = DATA.cours.length + DATA.exercices.length + DATA.apprentissage.length + DATA.musique.length;
    const pct = Math.round((completed.length / totalLevels) * 100) || 0;
    
    document.getElementById('progress-main-text').innerHTML = `
        <div style="font-size:2rem; font-weight:bold; color:var(--accent);">${pct}%</div>
        <div style="color:#888; font-size:0.9rem;">${completed.length}/${totalLevels} niveaux complétés</div>
    `;
    document.getElementById('progress-bar-fill').style.width = pct + '%';

    // --- BADGES ---
    const badges = [
        {id:'first_note', icon:'🎹', name:'Première Note', cond: totalNotes >= 1},
        {id:'beginner', icon:'🌱', name:'Débutant', cond: totalNotes >= 50},
        {id:'intermediate', icon:'🎵', name:'Intermédiaire', cond: totalNotes >= 200},
        {id:'expert', icon:'🎶', name:'Expert', cond: totalNotes >= 500},
        {id:'master', icon:'👑', name:'Maître', cond: totalNotes >= 1000},
        {id:'streak_10', icon:'🔥', name:'Série 10', cond: sessions.some(s => s.streak >= 10)},
        {id:'streak_25', icon:'⚡', name:'Série 25', cond: sessions.some(s => s.streak >= 25)},
        {id:'perfect', icon:'💎', name:'Perfection', cond: sessions.some(s => s.accuracy === 100)},
        {id:'persistent', icon:'📅', name:'Assidu', cond: sessions.length >= 7},
        {id:'speed', icon:'🚀', name:'Rapide', cond: sessions.some(s => s.speed === 'Rapide⚡' && s.accuracy > 80)}
    ];

    const unlockedBadges = currentP.stats?.badges || [];
    
    document.getElementById('progress-badges-grid').innerHTML = badges.map(b => {
        const isUnlocked = b.cond || unlockedBadges.includes(b.id);
        return `
            <div title="${b.name}" style="
                aspect-ratio:1; 
                background:${isUnlocked ? 'rgba(0,242,255,0.2)' : 'rgba(255,255,255,0.05)'}; 
                border:2px solid ${isUnlocked ? 'var(--accent)' : 'rgba(255,255,255,0.1)'}; 
                border-radius:10px; 
                display:flex; 
                align-items:center; 
                justify-content:center; 
                font-size:1.5rem;
                opacity:${isUnlocked ? 1 : 0.3};
                cursor:help;
                transition:transform 0.2s;
            " onmouseover="if(${isUnlocked}) this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                ${b.icon}
            </div>
        `;
    }).join('');

    // --- STATS RAPIDES ---
    const avgAcc = sessions.length > 0 
        ? Math.round(sessions.reduce((sum, s) => sum + (s.accuracy || 0), 0) / sessions.length)
        : 0;
    const bestStreak = Math.max(...sessions.map(s => s.maxStreak || 0), 0);
    
    document.getElementById('progress-quick-stats').innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:10px; padding:8px; background:rgba(0,0,0,0.2); border-radius:8px;">
            <span style="color:#888;">Précision moy.</span>
            <span style="color:var(--accent); font-weight:bold;">${avgAcc}%</span>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:10px; padding:8px; background:rgba(0,0,0,0.2); border-radius:8px;">
            <span style="color:#888;">Meilleure série</span>
            <span style="color:#ffaa00; font-weight:bold;">${bestStreak} 🔥</span>
        </div>
        <div style="display:flex; justify-content:space-between; padding:8px; background:rgba(0,0,0,0.2); border-radius:8px;">
            <span style="color:#888;">Total notes</span>
            <span style="color:#00ff88; font-weight:bold;">${totalNotes}</span>
        </div>
    `;

    // --- GRAPHIQUE 7 JOURS ---
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().split('T')[0]);
    }
    
    const maxDay = Math.max(...days.map(d => {
        const daySess = sessions.filter(s => (s.date || '').startsWith(d));
        return daySess.reduce((sum, s) => sum + (s.totalNotes || 0), 0);
    }), 10);

    document.getElementById('progress-chart').innerHTML = days.map(d => {
        const daySess = sessions.filter(s => (s.date || '').startsWith(d));
        const dayNotes = daySess.reduce((sum, s) => sum + (s.totalNotes || 0), 0);
        const dayAcc = daySess.length > 0 
            ? Math.round(daySess.reduce((sum, s) => sum + (s.accuracy || 0), 0) / daySess.length)
            : 0;
        const height = dayNotes > 0 ? Math.max(10, (dayNotes / maxDay) * 100) : 5;
        const color = dayAcc >= 90 ? '#00ff88' : dayAcc >= 70 ? 'var(--accent)' : dayAcc >= 50 ? '#ffaa00' : '#ff4b2b';
        
        return `
            <div style="
                flex:1; 
                height:${height}%; 
                background:${dayNotes > 0 ? color : 'rgba(255,255,255,0.1)'}; 
                border-radius:4px 4px 0 0;
                position:relative;
                cursor:help;
            " title="${d}: ${dayNotes} notes, ${dayAcc}% précision">
                ${dayNotes > 0 ? `<div style="position:absolute; top:-15px; left:50%; transform:translateX(-50%); font-size:0.6rem; color:${color};">${dayNotes}</div>` : ''}
            </div>
        `;
    }).join('');

    // --- COMPARAISON MAINS ---
    const leftAcc = sessions.length > 0 
        ? Math.round(sessions.slice(-5).reduce((sum, s) => sum + (s.leftAccuracy || s.accuracy || 0), 0) / Math.min(5, sessions.length))
        : 0;
    const rightAcc = sessions.length > 0 
        ? Math.round(sessions.slice(-5).reduce((sum, s) => sum + (s.rightAccuracy || s.accuracy || 0), 0) / Math.min(5, sessions.length))
        : 0;

    document.getElementById('progress-hands').innerHTML = `
        <div style="text-align:center; padding:15px; background:rgba(255,75,43,0.1); border-radius:12px; border:2px solid rgba(255,75,43,0.3);">
            <div style="font-size:2rem;">🤚</div>
            <div style="color:#ff4b2b; font-weight:bold; margin:5px 0;">GAUCHE</div>
            <div style="font-size:1.8rem; color:#fff;">${leftAcc}%</div>
            <div style="margin-top:8px; background:rgba(0,0,0,0.3); border-radius:4px; height:8px;">
                <div style="width:${leftAcc}%; height:100%; background:#ff4b2b; border-radius:4px;"></div>
            </div>
        </div>
        <div style="text-align:center; padding:15px; background:rgba(0,242,255,0.1); border-radius:12px; border:2px solid rgba(0,242,255,0.3);">
            <div style="font-size:2rem;">🖐️</div>
            <div style="color:var(--accent); font-weight:bold; margin:5px 0;">DROITE</div>
            <div style="font-size:1.8rem; color:#fff;">${rightAcc}%</div>
            <div style="margin-top:8px; background:rgba(0,0,0,0.3); border-radius:4px; height:8px;">
                <div style="width:${rightAcc}%; height:100%; background:var(--accent); border-radius:4px;"></div>
            </div>
        </div>
    `;

    console.log("=== RENDER DONE ===");
}

// Fonction d'ouverture
function openProgressModal() {
    console.log("Opening progress modal...");
    const modal = document.getElementById('progress-modal');
    if (!modal) {
        console.error("Modal progress non trouvé!");
        return;
    }
    modal.style.display = 'flex';
    renderProgressModal();
}

function closeProgressModal() {
    document.getElementById('progress-modal').style.display = 'none';
}
function startApp() {
    document.getElementById('welcome-screen').style.display = 'none';
    // On affiche les dossiers au lieu de l'ancien menu
    document.getElementById('main-folders').style.display = 'block';
    
    // Initialise l'audio
    if (typeof Tone !== 'undefined' && Tone.context.state !== 'running') {
        Tone.start();
    }
}// Fonction pour gérer la connexion / inscription par mail
function handleLogin(type) {
    const email = document.getElementById('user-email').value;
    const pass = document.getElementById('user-pass').value;

    if (!email || !pass) {
        alert("Oups ! Il manque l'email ou le mot de passe.");
        return;
    }

    // On transforme l'email en nom de profil (ex: 'julien@mail.com' -> 'julien')
    const profileName = email.split('@')[0];

    // On cherche si ce profil existe déjà
    let existingProfile = profiles.find(p => p.email === email);

    if (!existingProfile && type === 'signup') {
        // Création d'un nouveau profil
        const newProfile = {
            name: profileName,
            email: email,
            completed: [],
            stats: { sessions: [] },
            avatar: "🎹",
            role: "enfant"
        };
        profiles.push(newProfile);
        saveProfiles();
        alert("Compte créé ! Bienvenue " + profileName);
    } else if (!existingProfile && type === 'connect') {
        alert("Ce compte n'existe pas encore. Clique sur S'inscrire !");
        return;
    }

    // Connexion
    currentProfileName = profileName;
    localStorage.setItem('pk_current', currentProfileName);
    startApp();
}

// N'oublie pas la fonction de sauvegarde
function saveProfiles() {
    localStorage.setItem('pk_profiles', JSON.stringify(profiles));
}// ==========================================
// DÉFILEMENT AUTO DU PIANO VERS LES NOTES
// ==========================================

// Vérifie si une touche est visible dans le piano container
function isKeyVisible(keyElement) {
    const container = document.getElementById('piano-container');
    if (!container || !keyElement) return false;
    
    const containerRect = container.getBoundingClientRect();
    const keyRect = keyElement.getBoundingClientRect();
    
    // Marge de sécurité (50px)
    const margin = 50;
    
    return (
        keyRect.left >= containerRect.left + margin &&
        keyRect.right <= containerRect.right - margin
    );
}

// Défile le piano pour centrer une touche
function scrollPianoToKey(keyElement) {
    const container = document.getElementById('piano-container');
    if (!container || !keyElement) return;
    
    // Calculer la position pour centrer la touche
    const containerWidth = container.offsetWidth;
    const keyLeft = keyElement.offsetLeft;
    const keyWidth = keyElement.offsetWidth;
    
    const scrollLeft = keyLeft - (containerWidth / 2) + (keyWidth / 2);
    
    // Défiler avec animation fluide
    container.scrollTo({
        left: Math.max(0, scrollLeft),
        behavior: 'smooth'
    });
}


function isKeyVisible(keyElement) {
    const container = document.getElementById('piano-container');
    if (!container || !keyElement) return true; // Par défaut visible
    
    const containerRect = container.getBoundingClientRect();
    const keyRect = keyElement.getBoundingClientRect();
    const margin = 50;
    
    return (
        keyRect.left >= containerRect.left + margin &&
        keyRect.right <= containerRect.right - margin
    );
}

function scrollPianoToKey(keyElement) {
    const container = document.getElementById('piano-container');
    if (!container || !keyElement) return;
    
    const containerWidth = container.offsetWidth;
    const keyLeft = keyElement.offsetLeft;
    const keyWidth = keyElement.offsetWidth;
    
    const scrollLeft = keyLeft - (containerWidth / 2) + (keyWidth / 2);
    
    container.scrollTo({
        left: Math.max(0, scrollLeft),
        behavior: 'smooth'
    });
}

function getLevelNoteRange() {
    if (notesOnScreen.length === 0) return null;
    
    const activeNotes = notesOnScreen.filter(function(n) { return !n.ok; });
    if (activeNotes.length === 0) return null;
    
    const minY = Math.min.apply(null, activeNotes.map(function(n) { return n.y; }));
    const maxY = Math.max.apply(null, activeNotes.map(function(n) { return n.y + n.h; }));
    
    return { min: minY, max: maxY, count: activeNotes.length };
}

// Calcule le meilleur décalage pour voir toutes les notes importantes
function calculateBestOffset() {
    const fZone = document.getElementById('fall-zone');
    const hitLine = document.getElementById('hit-line');
    if (!fZone || !hitLine) return 0;
    
    const zoneHeight = fZone.offsetHeight;
    const hitLineY = hitLine.offsetTop;
    
    const range = getLevelNoteRange();
    if (!range) return 0;
    
    // Hauteur disponible pour les notes (sans la zone du piano)
    const availableHeight = hitLineY - 20;
    
    // Si toutes les notes tiennent dans la zone visible, recentrer
    const totalNotesHeight = range.max - range.min;
    
    if (totalNotesHeight <= availableHeight && range.min >= -50) {
        // Tout est visible, pas besoin de décaler
        return 0;
    }
    
    // Cas 1: Notes très hautes (comme Cours 3 - Do3, Ré3...)
    // Il faut monter la vue (décalage négatif)
    if (range.min < -100) {
        // Laisser de la marge en haut pour voir arriver les notes
        return -(range.min - ZONE_MARGIN_TOP);
    }
    
    // Cas 2: Beaucoup de notes éparpillées
    // Centrer la vue sur le groupe de notes actives
    const notesCenter = (range.min + range.max) / 2;
    const viewportCenter = availableHeight / 2;
    
    let offset = -(notesCenter - viewportCenter);
    
    // Limiter pour ne pas aller trop haut (notes au-dessus du spawn)
    offset = Math.min(0, offset);
    
    // Limiter pour ne pas aller trop bas (ne pas cacher la ligne de hit)
    const maxOffset = -(range.max - availableHeight + ZONE_MARGIN_BOTTOM);
    offset = Math.max(maxOffset, offset);
    
    return offset;
}

// Met à jour le viewport avec animation fluide
function updateZoneViewport() {
    const fZone = document.getElementById('fall-zone');
    if (!fZone) return;
    
    targetZoneOffset = calculateBestOffset();
    
    // Animation douce vers la cible
    const diff = targetZoneOffset - zoneOffset;
    
    if (Math.abs(diff) > 1) {
        // Interpolation pour mouvement fluide
        zoneOffset += diff * 0.12;
        fZone.style.transform = 'translateY(' + zoneOffset + 'px)';
    } else if (Math.abs(zoneOffset - targetZoneOffset) > 0.5) {
        zoneOffset = targetZoneOffset;
        fZone.style.transform = 'translateY(' + zoneOffset + 'px)';
    }
}

// Prédit où seront les prochaines notes et pré-positionne
function predictAndScroll(data) {
    if (!data || !data.notes || data.notes.length === 0) return;
    
    const fZone = document.getElementById('fall-zone');
    const hitLine = document.getElementById('hit-line');
    if (!fZone || !hitLine) return;
    
    // Analyser les premières notes du niveau
    const firstNotes = data.notes.slice(0, 3); // Premières 3 notes
    
    // Calculer la hauteur moyenne des premières notes
    let totalHeight = 0;
    firstNotes.forEach(function(note) {
        const duration = note.d || 400;
        const height = Math.max(80, (duration / 8) * (currentSpeed / 3));
        totalHeight += height;
    });
    
    const avgHeight = totalHeight / firstNotes.length;
    
    // Si les notes sont hautes (octave 3 ou moins), pré-décaler
    const hasLowNotes = firstNotes.some(function(note) {
        const octave = parseInt(note.n.match(/[0-9]/)[0]);
        return octave <= 3;
    });
    
    // Appliquer un décalage initial si nécessaire
    if (hasLowNotes) {
        targetZoneOffset = avgHeight + ZONE_MARGIN_TOP;
        zoneOffset = targetZoneOffset;
        fZone.style.transform = 'translateY(' + zoneOffset + 'px)';
    }
}

// ==========================================
// DÉFILEMENT PIANO (horizontal)
// ==========================================

function ensureNoteVisible(noteName) {
    // Uniquement sur mobile/tablette
    if (window.innerWidth >= 1024) return;
    
    const key = document.querySelector('.key[data-note="' + noteName + '"]');
    if (!key) return;
    
    const container = document.getElementById('piano-container');
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const keyRect = key.getBoundingClientRect();
    const margin = 60;
    
    const isVisible = (
        keyRect.left >= containerRect.left + margin &&
        keyRect.right <= containerRect.right - margin
    );
    
    if (!isVisible) {
        const containerWidth = container.offsetWidth;
        const keyLeft = key.offsetLeft;
        const keyWidth = key.offsetWidth;
        
        const scrollLeft = keyLeft - (containerWidth / 2) + (keyWidth / 2);
        
        container.scrollTo({
            left: Math.max(0, scrollLeft),
            behavior: 'smooth'
        });
    }
}
// Exports
window.openProgressModal = openProgressModal;
window.closeProgressModal = closeProgressModal;
;// Cette fonction doit être appelée par tes boutons Débutant / Intermédiaire
function filterCourses(category) {
    console.log("Filtrage par :", category); // Pour vérifier dans la console
    
    // On met à jour l'affichage des cours avec la catégorie choisie
    renderCourses(category);
    
    // Si tu es dans le menu, on le ferme pour voir le résultat
    if (document.getElementById('side-menu').classList.contains('open')) {
        toggleMenu();
    }
}

// Vérifie que ta fonction renderCourses utilise bien le paramètre
function renderCourses(category = 'all') {
    const container = document.getElementById('courses-container');
    if (!container) return;

    container.innerHTML = '';
    
    // Filtrage
    const filtered = category === 'all' 
        ? DATA.cours 
        : DATA.cours.filter(c => c.difficulty === category);

    // Si "filtered" est vide, c'est que le nom de la catégorie est mal orthographié
    filtered.forEach((course, index) => {
        // ... (ton code de création de carte de cours actuel)
    });
}
// MENU LATÉRAL PARAMÈTRES - CORRIGÉ


function toggleMenu() {
    console.log("Toggle menu plein écran");
    
    const menuFullscreen = document.getElementById('menu-fullscreen');
    
    if (!menuFullscreen) {
        console.error("Menu fullscreen non trouvé!");
        return;
    }
    
    const isVisible = menuFullscreen.style.display === 'flex';
    
    if (isVisible) {
        // Ferme le menu
        menuFullscreen.style.display = 'none';
        document.body.style.overflow = '';
    } else {
        // Ouvre le menu plein écran
        menuFullscreen.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        updateMenuData(); // Met à jour les données
    }
}

function updateMenuData() {
    // Met à jour le profil
    const currentP = profiles.find(p => p.name === currentProfileName) || profiles[0];
    if (!currentP) return;
    
    const nameEl = document.getElementById('menu-profile-name');
    const roleEl = document.getElementById('menu-profile-role');
    const avatarEl = document.getElementById('menu-profile-avatar');
    
    if (nameEl) nameEl.textContent = currentP.name || 'Invité';
    if (roleEl) roleEl.textContent = currentP.role === 'enfant' ? 'Enfant' : 'Adulte';
    if (avatarEl) avatarEl.textContent = currentP.avatar || '🎹';
    
    // Met à jour la progression
    const done = currentP.completed ? currentP.completed.length : 0;
    const total = DATA.cours.length + DATA.exercices.length + DATA.apprentissage.length + DATA.musique.length;
    
    const progressText = document.getElementById('menu-progress-text');
    const progressFill = document.getElementById('menu-progress-fill');
    
    if (progressText) progressText.textContent = `${done}/${total} niveaux`;
    if (progressFill) progressFill.style.width = `${(done/total*100) || 0}%`;
    
    // Vérifie connexion
    const hasEmail = !!currentP.email;
    const loginForm = document.getElementById('menu-login-form');
    const loggedIn = document.getElementById('menu-logged-in');
    
    if (loginForm && loggedIn) {
        loginForm.style.display = hasEmail ? 'none' : 'block';
        loggedIn.style.display = hasEmail ? 'block' : 'none';
    }
}
// ==========================================
// EXPORTS GLOBAUX
// ==========================================

window.toggleMenu = toggleMenu;
window.openSettingsTab = openSettingsTab;
window.updateSettingsData = updateSettingsData;
window.openPartitionModal = openPartitionModal;
window.closePartitionModal = closePartitionModal;
window.loadPartitionFile = loadPartitionFile;
window.setImportDifficulty = setImportDifficulty;
window.transposeImport = transposeImport;
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
window.unlockPro = () => {};
window.quitGame = quitGame;
window.handleAuth = () => {};
window.handleGoogleAuth = () => {};
window.handleLogout = () => {};
window.handleLogin = handleLogin;
window.toggleAuthMode = () => {};
window.initAudio = initAudio;
window.continueToNextLevel = continueToNextLevel;
window.closeLevelComplete = closeLevelComplete;
window.openProgressModal = openProgressModal;
window.closeProgressModal = closeProgressModal;
window.resetStats = resetStats;
window.closeStatsModal = closeStatsModal;
window.openStatsModal = openStatsModal;
window.startApp = startApp;
window.filterCourses = filterCourses;
window.renderCourses = renderCourses;
window.switchTab = switchTab;// ==========================================
// CONNEXION DANS LE MENU LATÉRAL
// ==========================================

function handleMenuLogin(type) {
    const email = document.getElementById('menu-email').value;
    const pass = document.getElementById('menu-password').value;

    if (!email || !pass) {
        alert("Veuillez entrer un email et un mot de passe");
        return;
    }

    const profileName = email.split('@')[0];
    let existingProfile = profiles.find(p => p.email === email);

    if (!existingProfile && type === 'signup') {
        // Création nouveau profil
        const newProfile = {
            name: profileName,
            email: email,
            completed: [],
            stats: { sessions: [] },
            avatar: "🎹",
            role: "enfant"
        };
        profiles.push(newProfile);
        localStorage.setItem('pk_profiles', JSON.stringify(profiles));
        alert("Compte créé ! Bienvenue " + profileName);
    } else if (!existingProfile && type === 'connect') {
        alert("Ce compte n'existe pas. Cliquez sur S'inscrire !");
        return;
    }

    // Connexion
    currentProfileName = profileName;
    localStorage.setItem('pk_current', currentProfileName);
    
    // Met à jour l'affichage
    updateMenuProfileDisplay();
    updateProfileDisplay();
    
    // Affiche la section connecté
    document.getElementById('login-form-section').style.display = 'none';
    document.getElementById('logged-in-section').style.display = 'block';
}

function handleMenuGoogleAuth() {
    // Appelle ta fonction existante
    if (typeof handleGoogleAuth === 'function') {
        handleGoogleAuth();
    } else {
        alert("Google Auth en cours de développement...");
    }
}

function handleMenuLogout() {
    if (typeof handleLogout === 'function') {
        handleLogout();
    }
    currentProfileName = "Invité";
    localStorage.removeItem('pk_current');
    
    // Réinitialise l'affichage
    document.getElementById('login-form-section').style.display = 'block';
    document.getElementById('logged-in-section').style.display = 'none';
    updateMenuProfileDisplay();
}

function updateMenuProfileDisplay() {
    const profile = profiles.find(p => p.name === currentProfileName) || { name: 'Invité', role: 'enfant', avatar: '🎹' };
    
    // Met à jour le menu latéral
    const nameEl = document.getElementById('menu-profile-name');
    const roleEl = document.getElementById('menu-profile-role');
    const avatarEl = document.getElementById('menu-profile-avatar');
    
    if (nameEl) nameEl.textContent = profile.name;
    if (roleEl) roleEl.textContent = profile.role === 'enfant' ? 'Enfant' : 'Adulte';
    if (avatarEl) avatarEl.textContent = profile.avatar || '🎹';
    
    // Vérifie si connecté (a un email)
    const hasEmail = !!profile.email;
    const loginSection = document.getElementById('login-form-section');
    const loggedSection = document.getElementById('logged-in-section');
    
    if (loginSection && loggedSection) {
        if (hasEmail) {
            loginSection.style.display = 'none';
            loggedSection.style.display = 'block';
        } else {
            loginSection.style.display = 'block';
            loggedSection.style.display = 'none';
        }
    }
    
    // Synchronise aussi la barre du haut
    const userNameEl = document.getElementById('user-name');
    const loginBtnEl = document.getElementById('login-btn');
    
    if (userNameEl) userNameEl.textContent = profile.name;
    
    if (loginBtnEl) {
        if (hasEmail) {
            loginBtnEl.textContent = '✓ Connecté';
            loginBtnEl.style.color = '#2ecc71';
            loginBtnEl.style.borderColor = '#2ecc71';
        } else {
            loginBtnEl.textContent = 'Connexion';
            loginBtnEl.style.color = '';
            loginBtnEl.style.borderColor = '';
        }
    }
}

// Met à jour quand on ouvre le menu
const originalUpdateSettingsData = updateSettingsData;
updateSettingsData = function() {
    originalUpdateSettingsData();
    updateMenuProfileDisplay();
};

// Export
window.handleMenuLogin = handleMenuLogin;
window.handleMenuGoogleAuth = handleMenuGoogleAuth;
window.handleMenuLogout = handleMenuLogout;
window.updateMenuProfileDisplay = updateMenuProfileDisplay;// ==========================================
// GESTION DES 4 DOSSIERS
// ==========================================

let currentFolder = null;
function openFolder(folderName) {
    const foldersDiv = document.getElementById('main-folders');
    const contentDiv = document.getElementById('folder-content');
    const grid = document.getElementById('folder-grid');
    const titleHeader = document.getElementById('folder-title');

    foldersDiv.style.display = 'none';
    contentDiv.style.display = 'block';
    titleHeader.innerText = folderName.toUpperCase();
    
    grid.innerHTML = '';

    let items = [];
    if (folderName === 'ecole') items = DATA.cours;
    if (folderName === 'labo') items = DATA.exercices;
    if (folderName === 'apprentissage') items = DATA.apprentissage;
    if (folderName === 'musique') items = DATA.musique;
    if (folderName === 'accords') items = DATA.accords;
    if (folderName === 'partitions') items = DATA.partitions;

    if (!items || items.length === 0) {
        grid.innerHTML = '<p style="color:gray;">Aucun contenu trouvé ici.</p>';
        return;
    }

    // Récupère le profil actuel pour vérifier les cours complétés
    const currentP = profiles.find(p => p.name === currentProfileName) || profiles[0];
    const completed = currentP.completed || [];

    items.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'card';
        
        // --- SYSTÈME DE VERROUILLAGE ---
        // Seuls les 3 premiers cours sont gratuits
        const isFree = index < 3;
        
        // Un cours est débloqué si:
        // 1. C'est un cours gratuit (index < 3)
        // 2. OU le cours précédent est complété
        let isUnlocked = isFree;
        
        if (!isFree && index > 0) {
            const prevItem = items[index - 1];
            const prevTitle = prevItem.title || prevItem.titre;
            isUnlocked = completed.includes(prevTitle);
        }
        
        const itemTitle = item.title || item.titre;
        const isCompleted = completed.includes(itemTitle);
        
        const texteAffiche = itemTitle || `Leçon ${index + 1}`;
        const iconeAffiche = item.icon || item.emoji || '🎹';
        const diffColor = item.diff === 'easy' ? '#2ecc71' : item.diff === 'medium' ? '#f1c40f' : item.diff === 'hard' ? '#e74c3c' : '#888';

        if (!isUnlocked) {
            // COURS VERROUILLÉ
            card.className = 'card locked';
            card.style.cssText = 'opacity:0.4; cursor:not-allowed; filter:grayscale(1); border:1px dashed #555; pointer-events:none;';
            
            const prevItem = items[index - 1];
            const prevName = prevItem ? (prevItem.title || prevItem.titre) : 'le cours précédent';
            
            card.innerHTML = `
                <div style="font-size:2rem; margin-bottom:5px; opacity:0.5;">🔒</div>
                <div class="card-title" style="color:#666;">${texteAffiche}</div>
                <div style="font-size:0.65rem; color:#ff4b2b; margin-top:5px; text-align:center;">
                    Terminez "${prevName}" pour débloquer
                </div>
            `;
            
        } else {
            // COURS DÉBLOQUÉ
            const statusIcon = isCompleted ? '✅' : '';
            const statusText = isCompleted ? '<div style="color:#2ecc71; font-size:0.75rem; margin-top:3px;">Complété</div>' : '';
            
            card.innerHTML = `
                <div class="card-icon">${iconeAffiche}</div>
                <div class="card-title">${texteAffiche} ${statusIcon}</div>
                <div style="font-size:0.7rem; color:${diffColor}; opacity:0.9; margin-top:3px;">
                    ${(item.diff || 'NORMAL').toUpperCase()}
                </div>
                ${statusText}
            `;

            card.onclick = () => {
                if (item.special === "import") {
                    openPartitionModal(); 
                } else {
                    startGame(folderName, index);
                }
            };
        }

        grid.appendChild(card);
    });
}
function backToFolders() {
    document.getElementById('folder-content').style.display = 'none';
    document.getElementById('main-folders').style.display = 'block';
}

function showFolderTab(tabName) {
    document.querySelectorAll('#folder-tabs .tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.toLowerCase().includes(tabName)) {
            btn.classList.add('active');
        }
    });
    
    const grid = document.getElementById('folder-grid');
    grid.innerHTML = '';
    
    let items = [];
    
    if (tabName === 'cours') items = DATA.cours || [];
    else if (tabName === 'facile1') items = (DATA.cours || []).filter(c => c.difficulty === 'facile1');
    else if (tabName === 'facile2') items = (DATA.cours || []).filter(c => c.difficulty === 'facile2');
    else if (tabName === 'facile3') items = (DATA.cours || []).filter(c => c.difficulty === 'facile3');
    else if (tabName === 'exercices') items = DATA.exercices || [];
    else if (tabName === 'musique') items = DATA.musique || [];
    else if (tabName === 'hits') items = DATA.hits || [];
    
    items.forEach((item, idx) => {
        const div = document.createElement('div');
        div.className = 'card';
        div.onclick = () => startGame(item.type || 'cours', idx);
        
        const isCompleted = (profiles.find(p => p.name === currentProfileName)?.completed || []).includes(item.id);
        
        div.innerHTML = `
            <div class="card-badge">${item.difficulty || 'NORMAL'}</div>
            <div class="card-icon">${item.icon || '🎹'}</div>
            <div class="card-title">${item.title}</div>
            <div class="card-desc">${item.desc || ''}</div>
            ${isCompleted ? '<div class="card-completed">✓</div>' : ''}
        `;
        
        grid.appendChild(div);
    });
}

function updateFolderBadges() {
    const profile = profiles.find(p => p.name === currentProfileName);
    const completed = profile?.completed?.length || 0;
    const total = DATA.cours?.length || 20;
    
    const badgeEcole = document.getElementById('badge-ecole');
    if (badgeEcole) badgeEcole.textContent = `${completed}/${total}`;
}

// Modifie startApp
const originalStartApp = startApp;
startApp = function() {
    document.getElementById('welcome-screen').style.display = 'none';
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('main-folders').style.display = 'block';
    updateProfileDisplay();
    updateFolderBadges();
};
function renderCoursByLevel() {
    const grid = document.getElementById('folder-grid');
    grid.innerHTML = '';
    
    const niveaux = [
        { id: 'facile1', nom: 'Facile 1', icon: '🔰' },
        { id: 'facile2', nom: 'Facile 2', icon: '⭐' },
        { id: 'facile3', nom: 'Facile 3', icon: '⭐⭐' },
        { id: 'normal', nom: 'Normal', icon: '🎵' },
        { id: 'difficile', nom: 'Difficile', icon: '🔥' }
    ];
    
    niveaux.forEach(niveau => {
        const coursDuNiveau = (DATA.cours || []).filter(c => 
            (c.difficulty || 'normal') === niveau.id
        );
        
        if (coursDuNiveau.length === 0) return;
        
        const section = document.createElement('div');
        section.style.marginBottom = '40px';
        
        const titre = document.createElement('h3');
        titre.innerHTML = `${niveau.icon} ${niveau.nom}`;
        titre.style.cssText = 'color: var(--accent); margin: 30px 0 20px 0; padding-bottom: 10px; border-bottom: 2px solid rgba(0,242,255,0.3); font-size: 1.3rem; text-transform: uppercase; letter-spacing: 2px;';
        section.appendChild(titre);
        
        const coursGrid = document.createElement('div');
        coursGrid.className = 'grid';
        coursGrid.style.display = 'grid';
        coursGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(150px, 1fr))';
        coursGrid.style.gap = '15px';
        
        coursDuNiveau.forEach((cours) => {
            const globalIndex = DATA.cours.indexOf(cours);
            const div = document.createElement('div');
            div.className = 'card';
            div.onclick = () => startGame('cours', globalIndex);
            
            const isCompleted = (profiles.find(p => p.name === currentProfileName)?.completed || []).includes(cours.id);
            
            div.innerHTML = `
                <div class="card-icon">${cours.icon || '🎹'}</div>
                <div class="card-title">${cours.title}</div>
                ${isCompleted ? '<div style="position:absolute;top:10px;right:10px;color:#2ecc71;font-size:1.2rem;">✓</div>' : ''}
            `;
            coursGrid.appendChild(div);
        });
        
        section.appendChild(coursGrid);
        grid.appendChild(section);
    });
}

window.renderCoursByLevel = renderCoursByLevel;
window.openFolder = openFolder;
window.backToFolders = backToFolders;
window.showFolderTab = showFolderTab;function renderCoursByLevel() {
    const grid = document.getElementById('folder-grid');
    grid.innerHTML = '';
    
    // Les niveaux
    const niveaux = [
        { id: 'facile1', nom: 'Facile 1', icon: '🔰' },
        { id: 'facile2', nom: 'Facile 2', icon: '⭐' },
        { id: 'facile3', nom: 'Facile 3', icon: '⭐⭐' },
        { id: 'normal', nom: 'Normal', icon: '🎵' },
        { id: 'difficile', nom: 'Difficile', icon: '🔥' }
    ];
    
    niveaux.forEach(niveau => {
        // Cherche les cours de ce niveau
        const coursDuNiveau = (DATA.cours || []).filter(c => 
            (c.difficulty || 'normal') === niveau.id
        );
        
        if (coursDuNiveau.length === 0) return;
        
        // Crée la section
        const section = document.createElement('div');
        section.style.marginBottom = '40px';
        
        // Titre du niveau
        const titre = document.createElement('h3');
        titre.innerHTML = `${niveau.icon} ${niveau.nom}`;
        titre.style.cssText = 'color: var(--accent); margin: 30px 0 20px 0; padding-bottom: 10px; border-bottom: 2px solid rgba(0,242,255,0.3); font-size: 1.3rem; text-transform: uppercase; letter-spacing: 2px;';
        section.appendChild(titre);
        
        // Les cours
        const coursGrid = document.createElement('div');
        coursGrid.className = 'grid';
        coursGrid.style.display = 'grid';
        coursGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(150px, 1fr))';
        coursGrid.style.gap = '15px';
        
        coursDuNiveau.forEach((cours) => {
            const globalIndex = DATA.cours.indexOf(cours);
            const div = document.createElement('div');
            div.className = 'card';
            div.onclick = () => startGame('cours', globalIndex);
            
            const isCompleted = (profiles.find(p => p.name === currentProfileName)?.completed || []).includes(cours.id);
            
            div.innerHTML = `
                <div class="card-icon">${cours.icon || '🎹'}</div>
                <div class="card-title">${cours.title}</div>
                ${isCompleted ? '<div style="position:absolute;top:10px;right:10px;color:#2ecc71;font-size:1.2rem;">✓</div>' : ''}
            `;
            coursGrid.appendChild(div);
        });
        
        section.appendChild(coursGrid);
        grid.appendChild(section);
    });
}

window.renderCoursByLevel = renderCoursByLevel;function jouerNoteManuelle(note, elementHtml) {
    if (!note) return;

    // 1. Jouer le son du piano
    if (typeof playNoteSound === 'function') {
        playNoteSound(getFrequency(note), 0.5);
    }

    // 2. Allumer la touche visuellement
    const originalColor = elementHtml.style.backgroundColor;
    const noteColor = getNoteColor(note);
    elementHtml.classList.add('active');
    elementHtml.style.backgroundColor = noteColor;
    elementHtml.style.boxShadow = `0 0 20px ${noteColor}`;

    // 3. ICI : On simule la détection pour le jeu (mode STEP)
    // On met à jour la variable que la fonction 'drop' surveille
    window.currentDetectedNote = note; 
    if (typeof noteActive !== 'undefined') noteActive = note;

    // 4. Éteindre la touche et reset la détection après un court instant
    setTimeout(() => {
        elementHtml.classList.remove('active');
        elementHtml.style.backgroundColor = "";
        elementHtml.style.boxShadow = "";
        
        // On remet à zéro pour ne pas que ça valide la note suivante par erreur
        if (window.currentDetectedNote === note) window.currentDetectedNote = null;
        if (typeof noteActive !== 'undefined' && noteActive === note) noteActive = null;
    }, 200);
}function updateGlobalProgress() {
    const badges = document.querySelectorAll('.folder-badge');
    let total = 0;
    let completed = 0;

    badges.forEach(badge => {
        const values = badge.innerText.split('/'); // Récupère "0" et "20"
        completed += parseInt(values[0]);
        total += parseInt(values[1]);
    });

    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    const globalDisplay = document.getElementById('total-badge-count');
    if (globalDisplay) {
        globalDisplay.innerText = percent + "%";
    }
}

// Appelle la fonction au chargement
window.addEventListener('load', updateGlobalProgress);// Fonction pour jouer une note lors d'un clic ou appui tactile
function playNoteOnClick(note) {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    const freq = getFrequency(note); // Utilise votre fonction de calcul de fréquence
    if (!freq) return;

    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    osc.type = 'triangle'; // Son plus doux pour le piano
    osc.frequency.setValueAtTime(freq, audioContext.currentTime);
    
    gain.gain.setValueAtTime(0.5, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5); // Extinction du son

    osc.connect(gain);
    gain.connect(audioContext.destination);
    
    osc.start();
    osc.stop(audioContext.currentTime + 0.5);

    // Simule la détection pour le jeu (mode STEP)
    window.currentDetectedNote = note;
    setTimeout(() => {
        if (window.currentDetectedNote === note) window.currentDetectedNote = null;
    }, 200);
}

// Fonction pour initialiser les interactions sur les touches
function initPianoInteractions() {
    const keys = document.querySelectorAll('.key'); // Assurez-vous que vos touches ont la classe 'key'
    keys.forEach(key => {
        const note = key.getAttribute('data-note'); // Chaque touche doit avoir un attribut data-note (ex: "C4")
        
        // Gestion Souris
        key.addEventListener('mousedown', () => playNoteOnClick(note));
        
        // Gestion Tactile
        key.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Empêche le scroll lors de l'appui
            playNoteOnClick(note);
        });
    });
}
function playPianoSound(note) {
    if (!window.audioContext) {
        window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    const freq = getFrequency(note);
    if (!freq) return;

    const osc = window.audioContext.createOscillator();
    const gain = window.audioContext.createGain();

    osc.type = 'triangle'; // Un son doux
    osc.frequency.setValueAtTime(freq, window.audioContext.currentTime);

    gain.gain.setValueAtTime(0.2, window.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, window.audioContext.currentTime + 0.8);

    osc.connect(gain);
    gain.connect(window.audioContext.destination);

    osc.start();
    osc.stop(window.audioContext.currentTime + 0.8);
}
function renderPiano() {
    const piano = document.getElementById('piano');
    if (!piano) return;
    piano.innerHTML = '';

    const startOctave = 2;
    const endOctave = 6;

    for (let octave = startOctave; octave <= endOctave; octave++) {
        noteStrings.forEach(note => {
            const noteName = note + octave;
            const isBlack = note.includes('#');
            const key = document.createElement('div');
            key.className = `key ${isBlack ? 'black' : 'white'}`;
            key.dataset.note = noteName;

            const handleInteraction = (e) => {
                e.preventDefault();
                
                // 1. Jouer le son
                playPianoSound(noteName); 
                
                // 2. Allumer la touche visuellement
                highlightPianoKey(noteName);

                // 3. INJECTION DIRECTE POUR VALIDATION (Micro/MIDI/App)
                // On met à jour la variable globale que la fonction drop() surveille
                window.currentDetectedNote = noteName;

                // On laisse la note active 250ms pour laisser le temps au jeu de valider
                setTimeout(() => {
                    if (window.currentDetectedNote === noteName) {
                        window.currentDetectedNote = null;
                    }
                }, 250);
            };

            key.addEventListener('mousedown', handleInteraction);
            key.addEventListener('touchstart', handleInteraction, { passive: false });

            if (!isBlack) {
                const label = document.createElement('div');
                label.className = 'key-label';
                label.innerText = noteNamesFR[note] || note;
                key.appendChild(label);
            }
            piano.appendChild(key);
        });
    }
}function highlightPianoKey(note) {
    const elementHtml = document.querySelector(`.key[data-note="${note}"]`);
    if (!elementHtml) return;

    // Allumage visuel
    elementHtml.classList.add('active');
    const noteLetter = note.slice(0, -1);
    const color = noteColors[noteLetter] || 'var(--accent)';
    elementHtml.style.backgroundColor = color;
    elementHtml.style.boxShadow = `0 0 30px ${color}`;

    // --- VALIDATION POUR LE JEU ---
    // On met à jour les DEUX variables de détection pour être sûr
    window.currentDetectedNote = note;
    if (typeof noteActive !== 'undefined') noteActive = note;

    // Reset après 200ms
    setTimeout(() => {
        elementHtml.classList.remove('active');
        elementHtml.style.backgroundColor = "";
        elementHtml.style.boxShadow = "";
        
        if (window.currentDetectedNote === note) window.currentDetectedNote = null;
        if (typeof noteActive !== 'undefined' && noteActive === note) noteActive = null;
    }, 200);
}
// ==========================================
// FONCTION VALIDATE NOTE - VERSION CORRIGÉE
// ==========================================

function validateNote(playedNote, skipSound = false) {
    if (currentMode === 'auto') return false;

    const hitLine = document.getElementById('hit-line');
    const fZone = document.getElementById('fall-zone');
    
    if (!hitLine || !fZone) {
        console.error("Éléments de jeu non trouvés");
        return false;
    }
    
    const hitLineY = hitLine.offsetTop;
    const tolerance = 60; // Zone de tolérance en pixels (±60px)
    
    // RECHERCHE DE LA NOTE SUR LA LIGNE
    let pendingNote = notesOnScreen.find(n => {
        if (n.ok || n.isChord) return false;
        
        // Vérifie si c'est la bonne note
        if (n.notes[0] !== playedNote) return false;
        
        const noteBottom = n.y + n.h;
        const lineTop = hitLineY - tolerance;
        const lineBottom = hitLineY + tolerance;
        
        // La note doit être dans la zone de tolérance
        return noteBottom >= lineTop && noteBottom <= lineBottom;
    });

    // Si pas de note trouvée, vérifie si c'est un accord
    if (!pendingNote) {
        // Cherche un accord en attente
        const pendingChord = notesOnScreen.find(n => {
            if (n.ok || !n.isChord) return false;
            
            const noteBottom = n.y + n.h;
            const lineTop = hitLineY - tolerance;
            const lineBottom = hitLineY + tolerance;
            const isOnLine = noteBottom >= lineTop && noteBottom <= lineBottom;
            
            return isOnLine && n.notes.includes(playedNote);
        });

        if (pendingChord) {
            // Gestion des accords
            if (!pendingChord.detectedNotes) pendingChord.detectedNotes = new Set();
            pendingChord.detectedNotes.add(playedNote);
            
            // Effet visuel sur la note détectée
            const noteIndex = pendingChord.notes.indexOf(playedNote);
            const noteEl = document.getElementById(pendingChord.id + '-' + noteIndex);
            if (noteEl) {
                noteEl.style.filter = "brightness(1.5)";
                noteEl.style.boxShadow = "0 0 20px #00ff00";
            }
            
            // Vérifie si toutes les notes sont jouées
            const allDetected = pendingChord.notes.every(n => pendingChord.detectedNotes.has(n));
            
            if (allDetected) {
                // Succès ! Toutes les notes de l'accord sont jouées
                pendingChord.ok = true;
                pendingChord.played = true;
                isPaused = false;
                
                // Joue les sons
                if (!skipSound) {
                    pendingChord.notes.forEach((note, idx) => {
                        const freq = getFrequency(note);
                        if (freq) setTimeout(() => playNoteSound(freq, pendingChord.d / 1000), idx * 30);
                    });
                }
                
                // Effets visuels
                const noteElements = [];
                pendingChord.notes.forEach((note, idx) => {
                    const el = document.getElementById(pendingChord.id + '-' + idx);
                    if (el) {
                        const color = getNoteColor(note);
                        const targetKey = document.querySelector(`.key[data-note="${note}"]`);
                        const keyRect = targetKey.getBoundingClientRect();
                        const fZoneRect = fZone.getBoundingClientRect();
                        const leftPos = keyRect.left - fZoneRect.left + 3;
                        
                        noteElements.push({ el, leftPos, color, noteName: note });
                        el.style.filter = "brightness(2) saturate(2)";
                        el.style.border = "3px solid white";
                        el.style.boxShadow = "0 0 30px #00ff00";
                    }
                });
                
                validateChord(pendingChord, noteElements);
                updateStats(pendingChord, true);
                
                // Supprime les éléments après animation
                setTimeout(() => {
                    noteElements.forEach(ne => {
                        if (ne.el.parentNode) ne.el.remove();
                    });
                    const idx = notesOnScreen.findIndex(n => n.id === pendingChord.id);
                    if (idx > -1) notesOnScreen.splice(idx, 1);
                }, 200);
                
                return true;
            }
            
            return false; // Accord en cours, attend les autres notes
        }
        
        // Faux ou trop tôt/tard - feedback visuel optionnel
        const wrongNote = notesOnScreen.find(n => !n.ok && n.notes[0] === playedNote);
        if (wrongNote && currentMode === 'step') {
            const noteBottom = wrongNote.y + wrongNote.h;
            const diff = noteBottom - hitLineY;
            
            const targetKey = document.querySelector(`.key[data-note="${playedNote}"]`);
            if (targetKey) {
                const keyRect = targetKey.getBoundingClientRect();
                const fZoneRect = fZone.getBoundingClientRect();
                const x = keyRect.left - fZoneRect.left + keyRect.width / 2;
                const y = hitLineY;
                
                if (diff < -tolerance) {
                    showTimingFeedback(Math.abs(diff), x, y, 'early');
                } else if (diff > tolerance) {
                    showTimingFeedback(Math.abs(diff), x, y, 'late');
                }
            }
            
            if (typeof currentSession !== 'undefined') {
                currentSession.notesMissed++;
                currentSession.streak = 0;
                updateStreakDisplay();
            }
        }
        return false;
    }

    // --- NOTE SIMPLE TROUVÉE ET VALIDÉE ---
    
    // Calcule la précision
    const noteBottom = pendingNote.y + pendingNote.h;
    const diff = Math.abs(noteBottom - hitLineY);
    const accuracy = Math.max(0, 100 - (diff / 2));
    
    // AFFICHAGE DU FEEDBACK VISUEL
    const targetKey = document.querySelector(`.key[data-note="${playedNote}"]`);
    
    if (targetKey) {
        const keyRect = targetKey.getBoundingClientRect();
        const fZoneRect = fZone.getBoundingClientRect();
        const x = keyRect.left - fZoneRect.left + keyRect.width / 2;
        const y = hitLineY;
        
        showTimingFeedback(diff, x, y);
    }
    
    // Mise à jour des Stats
    if (typeof currentSession !== 'undefined') {
        const isLeftHand = pendingNote.hands && pendingNote.hands[0] === 'G';
        const handData = isLeftHand ? currentSession.left : currentSession.right;

        handData.notesHit++;
        currentSession.streak++;
        if (currentSession.streak > currentSession.maxStreak) {
            currentSession.maxStreak = currentSession.streak;
        }
        updateStreakDisplay();

        handData.accuracy.push(accuracy);
        handData.timing.push(diff);
    }

    // Validation Visuelle et Sonore
    notesValidated++;

    // Joue le son si nécessaire
    if (!skipSound) {
        const freq = getFrequency(playedNote);
        if (freq) playNoteSound(freq, (pendingNote.d || 400) / 1000);
    }

    // Animation de la note
    const el = document.getElementById(pendingNote.id + '-0');
    const color = getNoteColor ? getNoteColor(playedNote) : "#ffffff";

    if (el) {
        el.style.boxShadow = `0 0 50px ${color}, 0 0 20px #fff`;
        el.style.background = "white";
        el.style.transform = 'scale(1.3)';
        el.style.transition = '0.1s';

        setTimeout(() => {
            el.style.opacity = '0';
            setTimeout(() => {
                if (el && el.parentNode) el.remove();
                const idx = notesOnScreen.findIndex(n => n.id === pendingNote.id);
                if (idx > -1) notesOnScreen.splice(idx, 1);
            }, 100);
        }, 50);
    }

    // Effets ligne et vapeur
    if (targetKey && fZone) {
        const keyRect = targetKey.getBoundingClientRect();
        const fZoneRect = fZone.getBoundingClientRect();
        const centerX = (keyRect.left - fZoneRect.left) + (keyRect.width / 2);

        if (typeof flashHitLine === 'function') flashHitLine(centerX, color);
        if (typeof startNoteSteam === 'function') startNoteSteam(centerX, color, pendingNote.d || 400, pendingNote.h || 40);
    }

    // Débloque le jeu
    pendingNote.ok = true;
    pendingNote.played = true;
    isPaused = false;

    return true;
}
async function playNoteFromInterface(note) {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') await audioContext.resume();

    // Son du piano
    const freq = getFrequency(note);
    if (freq) {
        playNoteSound(freq, 0.5); // Utilise ta fonction existante
    }

    // VALIDATION : On appelle validateNote avec 'true' pour ne pas rejouer le son
    console.log("Tentative de validation tactile:", note);
    validateNote(note, true); 

    if (typeof highlightPianoKey === 'function') {
        highlightPianoKey(note);
    }
}
// ==========================================
// FONCTIONS DE FIN DE COURS - CORRIGÉES
// ==========================================

// Remplace toute la fonction closeCourse existante
function closeCourse() {
    console.log("Fermeture du cours...");
    
    // 1. Arrêt technique
    clearTimeout(gameLoopTimeout);
    notesOnScreen = [];
    isPaused = true;
    
// 2. Cache et SUPPRIME les fenêtres de fin
    const successScreen = document.getElementById('success-screen');
    if (successScreen) successScreen.style.display = 'none';

    // On cherche tous les modals qui pourraient avoir été créés dynamiquement
    const dynamicModals = document.querySelectorAll('#level-complete-modal, #bilan-modal, #bilan-rhythm-modal');
    dynamicModals.forEach(modal => modal.remove()); // On les supprime carrément
    // 3. NETTOYER la zone de jeu
    const fZone = document.getElementById('fall-zone');
    if (fZone) {
        fZone.innerHTML = '<div id="hit-line"></div>';
    }
    
    // 4. Retour au dossier actuel (pas au menu général)
    // On vérifie si on venait d'un dossier ou du menu principal
    const folderContent = document.getElementById('folder-content');
    const mainFolders = document.getElementById('main-folders');
    
    if (folderContent && folderContent.style.display === 'block') {
        // On était déjà dans un dossier, on y retourne
        // (normalement déjà visible, mais on s'assure)
        folderContent.style.display = 'block';
    } else if (mainFolders) {
        // Sinon on retourne à l'accueil des dossiers
        mainFolders.style.display = 'block';
        if (folderContent) folderContent.style.display = 'none';
    }
    
    // 5. Réactiver le scroll
    document.body.style.overflow = 'auto';
}

// Remplace nextLesson/nextCourse
function nextLesson() {
    console.log("Passage à la leçon suivante...");
    
    // Ferme l'écran de succès
    const successScreen = document.getElementById('success-screen');
    if (successScreen) successScreen.style.display = 'none';
    
    // Trouve le niveau actuel dans les données
    let currentCategory = null;
    let currentIndex = -1;
    
    // Cherche dans quelle catégorie on est
    const categories = ['cours', 'exercices', 'apprentissage', 'musique'];
    for (let cat of categories) {
        const idx = DATA[cat].findIndex(item => 
            (item.title || item.titre) === currentLevelTitle
        );
        if (idx !== -1) {
            currentCategory = cat;
            currentIndex = idx;
            break;
        }
    }
    
    if (currentCategory && currentIndex !== -1) {
        const nextIndex = currentIndex + 1;
        const items = DATA[currentCategory];
        
        if (nextIndex < items.length) {
            // Charge le niveau suivant
            const nextItem = items[nextIndex];
            currentLevelTitle = nextItem.title || nextItem.titre;
            currentLevelData = nextItem;
            
            // Détermine le folder correspondant
            const folderMap = {
                'cours': 'ecole',
                'exercices': 'labo',
                'apprentissage': 'apprentissage',
                'musique': 'musique'
            };
            
            startGame(folderMap[currentCategory], nextIndex);
        } else {
            // Plus de niveaux dans cette catégorie
            alert("Félicitations ! Vous avez terminé tous les niveaux de cette catégorie !");
            closeCourse();
        }
    } else {
        // Fallback si on ne trouve pas
        closeCourse();
    }
}

// Remplace closeLevelComplete (appelée par le bilan modal)
function closeLevelComplete(shouldRetry = false) {
    const bilanModal = document.getElementById('bilan-modal');
    const rhythmModal = document.getElementById('bilan-rhythm-modal');
    
    if (bilanModal) bilanModal.style.display = 'none';
    if (rhythmModal) rhythmModal.style.display = 'none';
    
    if (shouldRetry) {
        // Rejouer le même niveau
        // Retrouve les données du niveau actuel
        let currentCategory = null;
        let currentIndex = -1;
        
        const categories = ['cours', 'exercices', 'apprentissage', 'musique'];
        for (let cat of categories) {
            const idx = DATA[cat].findIndex(item => 
                (item.title || item.titre) === currentLevelTitle
            );
            if (idx !== -1) {
                currentCategory = cat;
                currentIndex = idx;
                break;
            }
        }
        
        if (currentCategory && currentIndex !== -1) {
            const folderMap = {
                'cours': 'ecole',
                'exercices': 'labo',
                'apprentissage': 'apprentissage',
                'musique': 'musique'
            };
            startGame(folderMap[currentCategory], currentIndex);
        }
    } else {
        // Retour au menu
        closeCourse();
    }
}

// Fonction utilitaire pour fermer le modal rythmique
function closeRhythmBilan(retry) {
    closeLevelComplete(retry);
}
// ==========================================
// FEEDBACK VISUEL DE TIMING - À AJOUTER
// ==========================================

// Fonction pour afficher le feedback de timing (Parfait/Tôt/Tard)
function showTimingFeedback(diff, x, y) {
    const fZone = document.getElementById('fall-zone');
    if (!fZone) return;
    
    // Détermine le type de feedback
    let text, color, icon;
    
    if (diff <= 6) {
        text = "PARFAIT !";
        color = "#00ff88"; // Vert néon
        icon = "✨";
    } else if (diff <= 12) {
        text = "BIEN";
        color = "#00f2ff"; // Cyan
        icon = "👍";
    } else if (noteBottom < hitLineY) {
        text = "TÔT !";
        color = "#ffaa00"; // Orange
        icon = "⏫";
    } else {
        text = "TARD !";
        color = "#ff4b2b"; // Rouge
        icon = "⏬";
    }
    
    // Crée l'élément de feedback
    const feedback = document.createElement('div');
    feedback.className = 'timing-feedback';
    feedback.innerHTML = `${icon}<br>${text}`;
    feedback.style.cssText = `
        position: absolute;
        left: ${x}px;
        top: ${y}px;
        transform: translate(-50%, -50%);
        color: ${color};
        font-weight: bold;
        font-size: 1.1rem;
        text-shadow: 0 0 10px ${color}, 0 0 20px ${color};
        pointer-events: none;
        z-index: 10000;
        text-align: center;
        animation: feedbackFloat 0.8s ease-out forwards;
        font-family: 'Segoe UI', sans-serif;
        letter-spacing: 1px;
    `;
    
    fZone.appendChild(feedback);
    
    // Supprime après l'animation
    setTimeout(() => {
        if (feedback.parentNode) feedback.remove();
    }, 800);
}

// Animation CSS à ajouter dans votre style.css ou ici en JS
const style = document.createElement('style');
style.textContent = `
    @keyframes feedbackFloat {
        0% { 
            transform: translate(-50%, -50%) scale(0.5); 
            opacity: 0; 
        }
        20% { 
            transform: translate(-50%, -50%) scale(1.3); 
            opacity: 1; 
        }
        100% { 
            transform: translate(-50%, -150%) scale(1); 
            opacity: 0; 
        }
    }
    
    /* Variantes de couleur pour plus d'impact */
    .timing-feedback.perfect { color: #00ff88; text-shadow: 0 0 15px #00ff88, 0 0 30px #00ff88; }
    .timing-feedback.good { color: #00f2ff; text-shadow: 0 0 15px #00f2ff; }
    .timing-feedback.early { color: #ffaa00; text-shadow: 0 0 15px #ffaa00; }
    .timing-feedback.late { color: #ff4b2b; text-shadow: 0 0 15px #ff4b2b; }
`;
document.head.appendChild(style);

function validateNote(playedNote, skipSound = false) {
    if (currentMode === 'auto') return false;

    const hitLine = document.getElementById('hit-line');
    const fZone = document.getElementById('fall-zone');
    
    if (!hitLine) {
        console.error("Hit line non trouvée");
        return false;
    }
    
    const hitLineY = hitLine.offsetTop;
    const tolerance = 50; // Tolérance augmentée pour plus de facilité
    
    // RECHERCHE DE LA NOTE SUR LA LIGNE
    // Cherche une note simple (pas un accord) qui correspond
    let pendingNote = notesOnScreen.find(n => {
        if (n.ok || n.isChord) return false;
        
        // Vérifie si la note jouée correspond à la première note du tableau
        const targetNote = n.notes[0];
        if (targetNote !== playedNote) return false;
        
        const noteBottom = n.y + n.h;
        const lineTop = hitLineY - tolerance;
        const lineBottom = hitLineY + tolerance;
        
        // La note doit être dans la zone de tolérance
        return noteBottom >= lineTop && noteBottom <= lineBottom;
    });

    // Si pas de note simple trouvée, cherche un accord
    if (!pendingNote) {
        const pendingChord = notesOnScreen.find(n => {
            if (n.ok || !n.isChord) return false;
            
            const noteBottom = n.y + n.h;
            const lineTop = hitLineY - tolerance;
            const lineBottom = hitLineY + tolerance;
            const isOnLine = noteBottom >= lineTop && noteBottom <= lineBottom;
            
            // Vérifie si la note jouée fait partie de l'accord
            return isOnLine && n.notes.includes(playedNote);
        });

        if (pendingChord) {
            // Gestion de l'accord
            if (!pendingChord.detectedNotes) pendingChord.detectedNotes = new Set();
            pendingChord.detectedNotes.add(playedNote);
            
            // Effet visuel sur la note détectée
            const noteIndex = pendingChord.notes.indexOf(playedNote);
            const noteEl = document.getElementById(pendingChord.id + '-' + noteIndex);
            if (noteEl) {
                noteEl.style.filter = "brightness(1.5)";
                noteEl.style.boxShadow = "0 0 20px #00ff00";
            }
            
            // Vérifie si toutes les notes de l'accord sont jouées
            const allDetected = pendingChord.notes.every(note => pendingChord.detectedNotes.has(note));
            
            if (allDetected) {
                // SUCCÈS - Toutes les notes de l'accord sont jouées
                pendingChord.ok = true;
                pendingChord.played = true;
                isPaused = false;
                
                // Joue les sons
                if (!skipSound) {
                    pendingChord.notes.forEach((note, idx) => {
                        const freq = getFrequency(note);
                        if (freq) setTimeout(() => playNoteSound(freq, pendingChord.d / 1000), idx * 20);
                    });
                }
                
                // Effets visuels pour l'accord
                const noteElements = [];
                pendingChord.notes.forEach((note, idx) => {
                    const el = document.getElementById(pendingChord.id + '-' + idx);
                    const targetKey = document.querySelector(`.key[data-note="${note}"]`);
                    if (el && targetKey) {
                        const keyRect = targetKey.getBoundingClientRect();
                        const fZoneRect = fZone.getBoundingClientRect();
                        const leftPos = keyRect.left - fZoneRect.left + 3;
                        const color = getNoteColor(note);
                        
                        noteElements.push({ el, leftPos, color, noteName: note });
                        el.style.filter = "brightness(2) saturate(2)";
                        el.style.border = "3px solid #00ff00";
                        el.style.boxShadow = "0 0 30px #00ff00";
                    }
                });
                
                // Appelle la validation d'accord si elle existe
                if (typeof validateChord === 'function') {
                    validateChord(pendingChord, noteElements);
                }
                
                // Met à jour les stats
                if (typeof updateStats === 'function') {
                    updateStats(pendingChord, true);
                }
                
                return true;
            }
            
            return false; // Accord en cours, attend les autres notes
        }
        
        // Feedback pour note jouée hors timing
        const wrongNote = notesOnScreen.find(n => !n.ok && !n.isChord && n.notes[0] === playedNote);
        if (wrongNote && currentMode === 'step') {
            const noteBottom = wrongNote.y + wrongNote.h;
            const diff = noteBottom - hitLineY;
            
            if (fZone) {
                const targetKey = document.querySelector(`.key[data-note="${playedNote}"]`);
                if (targetKey) {
                    const keyRect = targetKey.getBoundingClientRect();
                    const fZoneRect = fZone.getBoundingClientRect();
                    const x = keyRect.left - fZoneRect.left + keyRect.width / 2;
                    const y = hitLineY;
                    
                    if (diff < -tolerance) {
                        showTimingFeedback(Math.abs(diff), x, y, 'early');
                    } else if (diff > tolerance) {
                        showTimingFeedback(Math.abs(diff), x, y, 'late');
                    }
                }
            }
            
            // Pénalité stats
            if (typeof currentSession !== 'undefined') {
                currentSession.notesMissed++;
                currentSession.streak = 0;
                if (typeof updateStreakDisplay === 'function') {
                    updateStreakDisplay();
                }
            }
        }
        return false;
    }

    // --- NOTE SIMPLE TROUVÉE ET VALIDÉE ---
    
    // Calcule la précision
    const noteBottom = pendingNote.y + pendingNote.h;
    const diff = Math.abs(noteBottom - hitLineY);
    const accuracy = Math.max(0, 100 - (diff / 2));
    
    // Feedback visuel
    if (fZone) {
        const targetKey = document.querySelector(`.key[data-note="${playedNote}"]`);
        if (targetKey) {
            const keyRect = targetKey.getBoundingClientRect();
            const fZoneRect = fZone.getBoundingClientRect();
            const x = keyRect.left - fZoneRect.left + keyRect.width / 2;
            const y = hitLineY;
            
            showTimingFeedback(diff, x, y);
        }
    }
    
    // Mise à jour des stats
    if (typeof currentSession !== 'undefined') {
        const isLeftHand = pendingNote.hands && pendingNote.hands[0] === 'G';
        const handData = isLeftHand ? currentSession.left : currentSession.right;

        handData.notesHit++;
        currentSession.streak++;
        if (currentSession.streak > currentSession.maxStreak) {
            currentSession.maxStreak = currentSession.streak;
        }
        if (typeof updateStreakDisplay === 'function') {
            updateStreakDisplay();
        }

        handData.accuracy.push(accuracy);
        handData.timing.push(diff);
    }

    // Validation
    notesValidated++;

    // Joue le son
    if (!skipSound) {
        const freq = getFrequency(playedNote);
        if (freq) playNoteSound(freq, (pendingNote.d || 400) / 1000);
    }

    // Animation visuelle
    const el = document.getElementById(pendingNote.id + '-0');
    const color = getNoteColor ? getNoteColor(playedNote) : "#ffffff";

    if (el) {
        el.style.boxShadow = `0 0 50px ${color}, 0 0 20px #fff`;
        el.style.background = "white";
        el.style.transform = 'scale(1.2)';
        el.style.zIndex = "1000";
        el.style.transition = 'all 0.1s';

        setTimeout(() => {
            el.style.opacity = '0';
            setTimeout(() => {
                if (el && el.parentNode) el.remove();
                const idx = notesOnScreen.findIndex(n => n.id === pendingNote.id);
                if (idx > -1) notesOnScreen.splice(idx, 1);
            }, 100);
        }, 50);
    }

    // Effets sur la ligne
    const k = document.querySelector(`.key[data-note="${playedNote}"]`);
    if (k && fZone) {
        const keyRect = k.getBoundingClientRect();
        const fZoneRect = fZone.getBoundingClientRect();
        const centerX = (keyRect.left - fZoneRect.left) + (keyRect.width / 2);

        if (typeof flashHitLine === 'function') flashHitLine(centerX, color);
        if (typeof startNoteSteam === 'function') startNoteSteam(centerX, color, pendingNote.d || 400, pendingNote.h || 40);
    }

    // Débloque le jeu
    pendingNote.ok = true;
    pendingNote.played = true;
    isPaused = false;

    return true;
}

// Version améliorée de showTimingFeedback avec paramètre type optionnel
function showTimingFeedback(diff, x, y, forcedType = null) {
    const fZone = document.getElementById('fall-zone');
    if (!fZone) return;
    
    // Détermine le type de feedback
    let text, color, icon, type;
    
    if (forcedType) {
        type = forcedType;
        if (type === 'early') {
            text = "TÔT !";
            color = "#ffaa00";
            icon = "⏫";
        } else {
            text = "TARD !";
            color = "#ff4b2b";
            icon = "⏬";
        }
    } else if (diff <= 6) {
        type = 'perfect';
        text = "PARFAIT !";
        color = "#00ff88";
        icon = "✨";
    } else if (diff <= 12) {
        type = 'good';
        text = "BIEN !";
        color = "#00f2ff";
        icon = "👍";
    } else if (diff <= 20) {
        type = 'ok';
        text = "OK";
        color = "#ffff00";
        icon = "✓";
    } else {
        type = 'bad';
        text = "RATÉ";
        color = "#ff4444";
        icon = "✗";
    }
    
    // Crée l'élément
    const feedback = document.createElement('div');
    feedback.className = `timing-feedback ${type}`;
    feedback.innerHTML = `<div style="font-size:1.5rem;margin-bottom:3px;">${icon}</div><div>${text}</div>`;
    feedback.style.cssText = `
        position: absolute;
        left: ${x}px;
        top: ${y}px;
        transform: translate(-50%, -50%);
        color: ${color};
        font-weight: bold;
        font-size: 0.9rem;
        text-shadow: 0 0 10px ${color}, 0 0 20px ${color};
        pointer-events: none;
        z-index: 10000;
        text-align: center;
        animation: feedbackFloat 0.9s ease-out forwards;
        font-family: 'Segoe UI', sans-serif;
        letter-spacing: 1px;
        background: rgba(0,0,0,0.3);
        padding: 8px 15px;
        border-radius: 20px;
        border: 2px solid ${color};
        box-shadow: 0 0 20px ${color}40;
    `;
    
    fZone.appendChild(feedback);
    
    setTimeout(() => {
        if (feedback.parentNode) feedback.remove();
    }, 900);
}

// Exporte la fonction
window.showTimingFeedback = showTimingFeedback;
// Exporte les fonctions globales
window.closeCourse = closeCourse;
window.nextLesson = nextLesson;
window.closeLevelComplete = closeLevelComplete;
window.closeRhythmBilan = closeRhythmBilan;
// ==========================================
// DÉTECTION DE HAUTEUR (YIN Algorithm simplifié)
// ==========================================

function detectPitch(buffer, sampleRate) {
    const bufferSize = buffer.length;
    
    // Vérifie si le buffer est valide
    if (!buffer || bufferSize < 2) return -1;
    
    // Vérifie le niveau audio (évite de traiter le silence)
    let rms = 0;
    for (let i = 0; i < bufferSize; i++) {
        rms += buffer[i] * buffer[i];
    }
    rms = Math.sqrt(rms / bufferSize);
    
    // Seuil de silence (ajustable)
    if (rms < 0.01) return -1;
    
    // YIN Algorithm
    const threshold = 0.1; // Seuil de détection
    const maxPeriod = Math.floor(sampleRate / 50); // Fréquence min ~50Hz
    const minPeriod = Math.floor(sampleRate / 2000); // Fréquence max ~2000Hz
    
    // Différence cumulative normalisée (DF)
    const df = new Float32Array(maxPeriod);
    
    for (let tau = minPeriod; tau < maxPeriod; tau++) {
        let sum = 0;
        for (let i = 0; i < bufferSize - tau; i++) {
            const diff = buffer[i] - buffer[i + tau];
            sum += diff * diff;
        }
        df[tau] = sum;
    }
    
    // Différence cumulative moyenne (CMDF)
    let runningSum = 0;
    for (let tau = minPeriod; tau < maxPeriod; tau++) {
        runningSum += df[tau];
        if (runningSum === 0) {
            df[tau] = 1;
        } else {
            df[tau] = df[tau] * tau / runningSum;
        }
    }
    
    // Cherche le premier minimum sous le seuil
    let period = -1;
    for (let tau = minPeriod + 1; tau < maxPeriod; tau++) {
        if (df[tau] < threshold) {
            // Vérifie que c'est bien un minimum local
            if (df[tau] < df[tau - 1] && df[tau] < df[tau + 1]) {
                // Interpolation parabolique pour plus de précision
                const alpha = df[tau - 1];
                const beta = df[tau];
                const gamma = df[tau + 1];
                const p = 0.5 * (alpha - gamma) / (alpha - 2 * beta + gamma);
                period = tau + p;
                break;
            }
        }
    }
    
    // Si pas trouvé, prend le minimum global
    if (period === -1) {
        let minVal = Infinity;
        for (let tau = minPeriod; tau < maxPeriod; tau++) {
            if (df[tau] < minVal) {
                minVal = df[tau];
                period = tau;
            }
        }
        if (minVal >= threshold) return -1; // Pas assez clair
    }
    
    return sampleRate / period;
}

// ==========================================
// BOUCLE DE DÉTECTION MICROPHONE
// ==========================================

function startMicDetectionLoop() {
    if (!analyser || !micActive) return;
    
    const bufferLength = analyser.fftSize;
    const buffer = new Float32Array(bufferLength);
    
    function detectLoop() {
        if (!micActive) return;
        
        try {
            // Récupère les données audio
            analyser.getFloatTimeDomainData(buffer);
            
            // Détecte la fréquence
            const frequency = detectPitch(buffer, audioContext.sampleRate);
            
            if (frequency > 0) {
                // Convertit en note MIDI
                const noteNum = frequencyToMidiNote(frequency);
                
                // Vérifie que la note est dans la plage du piano (21-108)
                if (noteNum >= 21 && noteNum <= 108) {
                    // Anti-rebond simple
                    const now = Date.now();
                    if (now - lastDetectedNote.time > 100) { // 100ms minimum entre notes
                        if (noteNum !== lastDetectedNote.note) {
                            lastDetectedNote = { note: noteNum, time: now };
                            
                            console.log("Note détectée:", noteNum, "Freq:", frequency.toFixed(1), "Hz");
                            
                            // Valide la note dans le jeu
                            validateNote(noteNum, false);
                            
                            // Feedback visuel optionnel
                            const noteName = getNoteName(noteNum);
                            showMicFeedback(noteName);
                        }
                    }
                }
            }
        } catch (e) {
            console.error("Erreur détection:", e);
        }
        
        // Continue la boucle
        requestAnimationFrame(detectLoop);
    }
    
    detectLoop();
}

// ==========================================
// FONCTIONS UTILITAIRES
// ==========================================

function frequencyToMidiNote(frequency) {
    return Math.round(69 + 12 * Math.log2(frequency / 440));
}

function getNoteName(midiNote) {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(midiNote / 12) - 1;
    const noteIndex = midiNote % 12;
    return noteNames[noteIndex] + octave;
}

function showMicFeedback(noteName) {
    // Crée un feedback visuel temporaire
    const feedback = document.createElement('div');
    feedback.textContent = `🎤 ${noteName}`;
    feedback.style.cssText = `
        position: fixed;
        bottom: 100px;
        right: 20px;
        background: rgba(0, 242, 255, 0.9);
        color: #000;
        padding: 10px 20px;
        border-radius: 20px;
        font-weight: bold;
        font-size: 1.2rem;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(feedback);
    
    setTimeout(() => {
        feedback.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => feedback.remove(), 300);
    }, 800);
}

// Variable pour anti-rebond
let lastDetectedNote = { note: -1, time: 0 };
async function startMicrophone() {
    if (micActive) {
        stopMicrophone();
        return;
    }

    try {
        // Demande la permission microphone
        micStream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: false,
                autoGainControl: false,
                noiseSuppression: false,
                sampleRate: 44100
            }
        });

        // Crée le contexte audio si pas déjà fait
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        // Crée l'analyseur
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048; // Taille pour bonne précision
        analyser.smoothingTimeConstant = 0.8;

        // Connecte le micro à l'analyseur (PAS aux haut-parleurs !)
        const source = audioContext.createMediaStreamSource(micStream);
        source.connect(analyser);
        
        // IMPORTANT : Ne connecte PAS analyser à audioContext.destination
        // pour éviter le feedback audio

        micActive = true;
        
        // Met à jour le bouton
        const btn = document.getElementById('mic-btn');
        if (btn) {
            btn.classList.add('active');
            btn.innerHTML = '<span style="font-size:1.2rem;">🎤</span><span style="font-size:0.7rem;">ON</span>';
            btn.style.background = 'linear-gradient(135deg, #00f2ff, #00c8ff)';
            btn.style.boxShadow = '0 0 20px #00f2ff';
        }

        console.log("Microphone activé - Détection démarrée");
        
        // Démarre la boucle de détection
        startMicDetectionLoop();

    } catch (err) {
        console.error("Erreur microphone:", err);
        alert("Impossible d'accéder au microphone. Vérifiez les permissions.");
        micActive = false;
    }
}

function stopMicrophone() {
    micActive = false;
    
    if (micStream) {
        micStream.getTracks().forEach(track => track.stop());
        micStream = null;
    }
    
    // Met à jour le bouton
    const btn = document.getElementById('mic-btn');
    if (btn) {
        btn.classList.remove('active');
        btn.innerHTML = '<span style="font-size:1.2rem;">🎤</span><span style="font-size:0.7rem;">OFF</span>';
        btn.style.background = '';
        btn.style.boxShadow = '';
    }
    
    console.log("Microphone arrêté");
}
