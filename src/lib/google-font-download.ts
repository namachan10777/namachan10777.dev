export interface FontConfig {
    family: string;
    weight: number;
}

export async function downloadGoogleFont(font: FontConfig): Promise<ArrayBuffer> {
    const cssUrl = `https://fonts.googleapis.com/css2?family=${font.family.replace(' ', '+')}:wght@${font.weight}&display=swap`;
    const cssResponse = await fetch(cssUrl);
    const css = await cssResponse.text();
    const url = /url\((https:\/\/.+)\) format/.exec(css)![1]!;
    const response = await fetch(url);
    const body = await response.arrayBuffer();
    return body;
}
