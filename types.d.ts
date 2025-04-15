type Statistics = {
    cpuUsage: number
    ramUsage: number
    storageUsage: number;
}

type StaticData = {
    totalStorage: number
    cpuModel: string
    totalMem:number
}

interface Window {
    electron: {
        subscribeStatistics: (callback: (statistics: Statistics) => void) => void;
        getStaticData: () => Promise<StaticData>;
    }
}