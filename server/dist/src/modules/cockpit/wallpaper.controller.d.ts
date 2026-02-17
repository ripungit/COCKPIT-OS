import { CockpitService } from './cockpit.service';
export declare class WallpaperController {
    private readonly cockpitService;
    constructor(cockpitService: CockpitService);
    getWallpaper(userId: string): Promise<{
        wallpaperId: number;
    }>;
    updateWallpaper(userId: string, wallpaperId: number): Promise<{
        wallpaperId: number | null;
    }>;
}
