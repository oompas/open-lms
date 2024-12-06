const getCurrentTimestampTz = () => {
    const now = new Date();
    const isoString = now.toISOString();  // E.g. '2024-09-25T20:12:40.923Z'

    // Replace 'T' with space and keep the precision of the timestamp
    return isoString.replace('T', ' ').replace('Z', '+00');
};

/**
 * Converts an array of objects (with the same keys & no embedded objects) into a CSV string
 */
const toCSV = (json: { [key: string]: any }[]) => {
    let csv = "";
    const keys = (json[0] && Object.keys(json[0])) || [];
    csv += keys.join(',') + '\n';
    for (let line of json) {
        csv += keys.map(key => line[key]).join(',') + '\n';
    }
    return csv;
}

export { getCurrentTimestampTz, toCSV };
