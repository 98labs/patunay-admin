import fs from 'fs';
import os from 'os';
import { BrowserWindow } from 'electron';

const POLLING_INTERVAL = 500;

export function pollResources(mainWindow: BrowserWindow) {
    setInterval( async() => {
        const cpuUsage = await getCpuUsage();
        const ramUsage = getRamUsage();
        const storageData = getStorageData();
        mainWindow.webContents.send('statistics', {
            cpuUsage,
            ramUsage,
            storageUsage: storageData.usage
        })
    }, POLLING_INTERVAL);
}

export const getStatisticData = () => {
    const totalStorage = getStorageData().total;
    const cpuInfo = os.cpus()[0];
    const cpuModel = cpuInfo ? cpuInfo.model : 'Unknown CPU';
    const totalMem = Math.floor(os.totalmem() / (1024 * 1024)); // Convert to MB
    return {
        totalStorage,
        cpuModel,
        totalMem
    };
}

const getCpuUsage = async () => {
    // Use Node.js built-in process.cpuUsage() for CPU metrics
    const startUsage = process.cpuUsage();
    
    // Wait a bit to get meaningful CPU usage
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const endUsage = process.cpuUsage(startUsage);
    const totalUsage = endUsage.user + endUsage.system;
    
    // Convert to percentage (this is approximate)
    return Math.min(totalUsage / 100000, 1); // Normalize to 0-1
}

const getRamUsage = () => {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    return (totalMem - freeMem) / totalMem;
}
 
const getStorageData = () => {
    const stats = fs.statfsSync(process.platform === 'win32' ? 'C://' : '/');
    const total = stats.bsize * stats.blocks;
    const free = stats.bsize * stats.bfree;

    return {
        total: Math.floor(total / 1000000000),
        usage: 1 - free / total,
    }
}