import * as fs from 'fs';
import * as path from 'path';

const FILENAME = '.devnotes';

export function devnotesPathForFile(filePath: string): string {
    const dir = path.dirname(filePath);
    return path.join(dir, FILENAME);
}

export async function readDevnotesForFile(filePath: string): Promise<string> {
    const devPath = devnotesPathForFile(filePath);
    try {
        const buf = await fs.promises.readFile(devPath, 'utf8');
        return buf;
    } catch {
        return '';
    }
}

export async function writeDevnotesForFile(filePath: string, content: string): Promise<void> {
    const devPath = devnotesPathForFile(filePath);
    await fs.promises.writeFile(devPath, content, 'utf8');
}

export function devnotesPathForActiveFile(activeFilePath: string): string {
    return devnotesPathForFile(activeFilePath);
}
