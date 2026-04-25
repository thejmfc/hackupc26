export interface Capital {
    name: string;
    countryName: string;
    isoCode: string;
    coords: [number, number];
}

export async function fetchCapitals(): Promise<Capital[]> {
    const res = await fetch('https://restcountries.com/v3.1/all?fields=name,capital,capitalInfo,cca2');
    const data = await res.json();
    return data
        .filter((c: any) => c.capitalInfo?.latlng?.length === 2)
        .map((c: any) => ({
            name: c.capital?.[0] ?? c.name.common,
            countryName: c.name.common,
            isoCode: c.cca2 as string,
            coords: [c.capitalInfo.latlng[1], c.capitalInfo.latlng[0]] as [number, number],
        }));
}
