
import { RefRange } from '../types';

export const parseDateValue = (dateString: string): Date => {
    // Attempt to parse YYYY-MM-DD
    const partsYMD = dateString.split('-');
    if (partsYMD.length === 3 && partsYMD[0].length === 4) {
        return new Date(parseInt(partsYMD[0],10), parseInt(partsYMD[1],10) - 1, parseInt(partsYMD[2],10));
    }
    // Attempt to parse DD/MM/YYYY
    const partsDMY = dateString.split('/');
    if (partsDMY.length === 3) {
        return new Date(parseInt(partsDMY[2],10), parseInt(partsDMY[1],10) - 1, parseInt(partsDMY[0],10));
    }
    // Fallback for other simple date formats if necessary, or just use new Date()
    return new Date(dateString);
};

export const parseRefRangeString = (refRangeStr: string | null): RefRange => {
    if (!refRangeStr || typeof refRangeStr !== 'string') return { min: null, max: null, text: 'N/A' };

    let cleanedStr = refRangeStr.replace(',', '.'); // Normalize decimal separator

    // Format: [min-max] or [ min - max ]
    let match = cleanedStr.match(/\[\s*([\d.]+)\s*-\s*([\d.]+)\s*\]/);
    if (match) {
        return { 
            min: parseFloat(match[1]), 
            max: parseFloat(match[2]),
            text: refRangeStr
        };
    }

    // Format: min-max or  min - max (without brackets)
    match = cleanedStr.match(/^([\d.]+)\s*-\s*([\d.]+)$/);
    if (match) {
        return { 
            min: parseFloat(match[1]), 
            max: parseFloat(match[2]),
            text: refRangeStr
        };
    }
    
    // Format: < value or <= value
    match = cleanedStr.match(/<\s*=?\s*([\d.]+)/);
    if (match) {
        return { min: null, max: parseFloat(match[1]), text: refRangeStr };
    }

    // Format: > value or >= value
    match = cleanedStr.match(/>\s*=?\s*([\d.]+)/);
    if (match) {
        return { min: parseFloat(match[1]), max: null, text: refRangeStr };
    }
    
    // Format: Insuf:val1-val2 Suf:val3-val4 or similar for Vitamin D
    // We prioritize "Suficiencia" or "Suf" range if available
    const sufPattern = /(?:Suficiencia|Suf)\s*:\s*([\d.]+)(?:\s*-\s*([\d.]+))?/;
    match = cleanedStr.match(sufPattern);
    if (match) {
        const minVal = parseFloat(match[1]);
        const maxVal = match[2] ? parseFloat(match[2]) : null; // Max might be open-ended like "Suf:20-100" or just "Suf:>20"
        return { min: minVal, max: maxVal, text: refRangeStr };
    }
    
    // Fallback for single numbers in ranges like "[0-5]" where 0 is min, 5 is max. Already handled by first regex.
    // If it's just a text like "N/A" or some other unparsable format
    return { min: null, max: null, text: refRangeStr };
};
