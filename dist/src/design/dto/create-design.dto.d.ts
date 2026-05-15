export declare enum DesignCategory {
    INTERIOR = "INTERIOR",
    EXTERIOR = "EXTERIOR",
    LANDSCAPE = "LANDSCAPE",
    NEW_FLOORING = "NEW_FLOORING",
    FURNITURE_DESIGN = "FURNITURE_DESIGN"
}
export declare class CreateDesignDto {
    category: string;
    originalImageUrl: string;
    location: string;
    style: string;
    colorPalette: string;
    seedUsed?: bigint;
}
