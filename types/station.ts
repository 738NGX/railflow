export interface Name {
  kanji: string;      // Japanese Kanji representation
  hiragana?: string;  // Japanese Hiragana representation
  english: string;    // English representation
  chinese?: string;   // Chinese representation
  korean?: string;    // Korean representation
}

export interface Exit {
  id: number;         // Unique exit ID
  name: Name;         // Exit name in multiple languages
}

export interface StationNumbering {
  letter: string;     // Line letter (e.g., "JY")
  number: string;     // Station number (e.g., "01")
  color: string;      // Color code for the line
  type: 'JRE' | 'Subway' | 'Shinkansen700' | 'ShinkansenE5';
}

export interface PlatformObject {
  type: 'DownStairs' | 'UpStairs' | 'DownEscalator' | 'UpEscalator' | 'Elevator';
  direction: 'Front' | 'Opposite'
  pos: 'Front' | 'Center' | 'Back';
}

export interface PlatformBlock {
  exit: number;                           // Exit ID this block is associated with
  units: { objects: PlatformObject[] }[]; // List of platform units with objects
}

export interface Platform {
  id: number;                     // Unique platform ID
  name: Name;                     // Platform name in multiple languages
  doorside: 'Left' | 'Right';     // Side where doors open
  blocks: PlatformBlock[];        // List of platform blocks
}

export interface Station {
  id: number,                               // Unique station ID
  update: { year: number, month: number },  // Last info update date
  name: Name & { code?: string },           // Station name with optional IATA code (e.g., "TYO")
  tags: string[];                           // Tags associated with the station
  exits: Exit[];                            // List of exits at the station
  platforms: Platform[];                    // List of platforms at the station
}
