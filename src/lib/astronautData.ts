import { fetchJsonFromR2 } from './r2Client';

export type AstronautStatus = 'active' | 'upcoming' | 'returned';

export interface AstronautProfile {
  id: string;
  name: string;
  craft: string;
  country: string;
  agency: string;
  role: string;
  launchDate: string;
  biography: string;
  imageUrl: string;
  status: AstronautStatus;
  mission?: string;
  returnDate?: string;
  source?: string;
  updatedAt?: string;
}

export interface AstronautDataset {
  updatedAt: string;
  source: string;
  summary: {
    active: number;
    upcoming: number;
    returned: number;
    total: number;
  };
  astronauts: AstronautProfile[];
}

export const FALLBACK_ASTRONAUTS: AstronautProfile[] = [
  {
    id: 'jasmin-moghbeli',
    name: 'Jasmin Moghbeli',
    craft: 'ISS',
    country: 'Amerika Serikat',
    agency: 'NASA',
    role: 'Commander',
    launchDate: '2023-08-26',
    returnDate: '2024-03-12',
    status: 'returned',
    mission: 'SpaceX Crew-7 / Expedition 69-70',
    imageUrl: 'https://image.pollinations.ai/prompt/professional%20portrait%20NASA%20astronaut%20Jasmin%20Moghbeli%20space%20suit?width=400&height=500&nologo=true',
    biography: 'Jasmin Moghbeli adalah astronot NASA dan pilot uji Korps Marinir Amerika Serikat. Ia pernah memimpin misi SpaceX Crew-7 menuju ISS, menjalankan eksperimen mikrogravitasi, observasi Bumi, dan operasi stasiun harian bersama kru internasional.'
  },
  {
    id: 'andreas-mogensen',
    name: 'Andreas Mogensen',
    craft: 'ISS',
    country: 'Denmark',
    agency: 'ESA',
    role: 'Commander',
    launchDate: '2023-08-26',
    returnDate: '2024-03-12',
    status: 'returned',
    mission: 'SpaceX Crew-7 / Huginn',
    imageUrl: 'https://image.pollinations.ai/prompt/professional%20portrait%20ESA%20astronaut%20Andreas%20Mogensen%20space%20suit?width=400&height=500&nologo=true',
    biography: 'Andreas Mogensen adalah astronot ESA asal Denmark dan pernah menjadi komandan ISS. Misinyanya menekankan eksperimen fisiologi manusia, demonstrasi teknologi, dan edukasi sains untuk publik Eropa.'
  },
  {
    id: 'satoshi-furukawa',
    name: 'Satoshi Furukawa',
    craft: 'ISS',
    country: 'Jepang',
    agency: 'JAXA',
    role: 'Flight Engineer',
    launchDate: '2023-08-26',
    returnDate: '2024-03-12',
    status: 'returned',
    mission: 'SpaceX Crew-7',
    imageUrl: 'https://image.pollinations.ai/prompt/professional%20portrait%20JAXA%20astronaut%20Satoshi%20Furukawa%20space%20suit?width=400&height=500&nologo=true',
    biography: 'Satoshi Furukawa adalah dokter bedah dan astronot JAXA. Selama bertugas di ISS, ia mendukung eksperimen biomedis, teknologi antariksa, dan kegiatan edukasi dari modul Kibo Jepang.'
  },
  {
    id: 'konstantin-borisov',
    name: 'Konstantin Borisov',
    craft: 'ISS',
    country: 'Rusia',
    agency: 'Roscosmos',
    role: 'Mission Specialist',
    launchDate: '2023-08-26',
    returnDate: '2024-03-12',
    status: 'returned',
    mission: 'SpaceX Crew-7',
    imageUrl: 'https://image.pollinations.ai/prompt/professional%20portrait%20Roscosmos%20cosmonaut%20Konstantin%20Borisov%20space%20suit?width=400&height=500&nologo=true',
    biography: 'Konstantin Borisov adalah kosmonot Roscosmos yang terbang ke ISS bersama Crew-7. Ia menjadi contoh kerja sama lintas negara dalam operasi stasiun, riset mikrogravitasi, dan pemeliharaan sistem orbital.'
  },
  {
    id: 'zena-cardman',
    name: 'Zena Cardman',
    craft: 'ISS',
    country: 'Amerika Serikat',
    agency: 'NASA',
    role: 'Commander',
    launchDate: '2026-08-01',
    status: 'upcoming',
    mission: 'SpaceX Crew Mission',
    imageUrl: 'https://image.pollinations.ai/prompt/professional%20portrait%20NASA%20astronaut%20Zena%20Cardman%20space%20suit?width=400&height=500&nologo=true',
    biography: 'Zena Cardman adalah astronot NASA dengan latar belakang biologi dan ilmu kelautan. Ia dipersiapkan untuk misi mendatang ke ISS, tempat ia akan mendukung penelitian kehidupan dalam mikrogravitasi dan operasi laboratorium orbital.'
  },
  {
    id: 'mike-fincke',
    name: 'Mike Fincke',
    craft: 'ISS',
    country: 'Amerika Serikat',
    agency: 'NASA',
    role: 'Pilot',
    launchDate: '2026-08-01',
    status: 'upcoming',
    mission: 'SpaceX Crew Mission',
    imageUrl: 'https://image.pollinations.ai/prompt/professional%20portrait%20NASA%20astronaut%20Mike%20Fincke%20space%20suit?width=400&height=500&nologo=true',
    biography: 'Mike Fincke adalah astronot veteran NASA dengan pengalaman panjang di ISS dan spacewalk. Dalam daftar misi mendatang, ia membawa keahlian operasi stasiun, pelatihan kru, dan keselamatan penerbangan manusia.'
  }
];

export function buildAstronautDataset(astronauts: AstronautProfile[], source = 'R2 JSON'): AstronautDataset {
  const summary = astronauts.reduce(
    (acc, astronaut) => {
      acc[astronaut.status] += 1;
      acc.total += 1;
      return acc;
    },
    { active: 0, upcoming: 0, returned: 0, total: 0 }
  );

  return {
    updatedAt: new Date().toISOString(),
    source,
    summary,
    astronauts
  };
}

export function getFallbackAstronautDataset(): AstronautDataset {
  return buildAstronautDataset(FALLBACK_ASTRONAUTS, 'Fallback lokal Meteorit Indonesia');
}

export async function loadAstronautDataset(): Promise<AstronautDataset> {
  const fromR2 = await fetchJsonFromR2<AstronautDataset>('data/astronauts/astronauts.json');
  if (fromR2?.astronauts?.length) {
    return {
      ...fromR2,
      summary: fromR2.summary || buildAstronautDataset(fromR2.astronauts).summary
    };
  }

  return getFallbackAstronautDataset();
}

export async function getAstronautBySlug(slug: string): Promise<AstronautProfile | null> {
  const dataset = await loadAstronautDataset();
  return dataset.astronauts.find((astronaut) => astronaut.id === slug) || null;
}
