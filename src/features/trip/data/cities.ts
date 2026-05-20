export type City = {
  id: string
  name: string
  countryCode: string
  prefecture: string
  travelRegion: string
}

const JAPAN_CITIES: City[] = [
  // 관동
  { id: 'jp-tokyo',     name: '도쿄',    countryCode: 'JP', prefecture: '도쿄도',    travelRegion: '관동' },
  { id: 'jp-yokohama',  name: '요코하마', countryCode: 'JP', prefecture: '가나가와현', travelRegion: '관동' },
  { id: 'jp-kamakura',  name: '가마쿠라', countryCode: 'JP', prefecture: '가나가와현', travelRegion: '관동' },
  { id: 'jp-nikko',     name: '닛코',    countryCode: 'JP', prefecture: '도치기현',   travelRegion: '관동' },
  { id: 'jp-hakone',    name: '하코네',   countryCode: 'JP', prefecture: '가나가와현', travelRegion: '관동' },
  { id: 'jp-chiba',     name: '치바',    countryCode: 'JP', prefecture: '치바현',    travelRegion: '관동' },
  { id: 'jp-saitama',   name: '사이타마', countryCode: 'JP', prefecture: '사이타마현', travelRegion: '관동' },

  // 관서
  { id: 'jp-osaka',     name: '오사카',  countryCode: 'JP', prefecture: '오사카부',   travelRegion: '관서' },
  { id: 'jp-kyoto',     name: '교토',    countryCode: 'JP', prefecture: '교토부',    travelRegion: '관서' },
  { id: 'jp-kobe',      name: '고베',    countryCode: 'JP', prefecture: '효고현',    travelRegion: '관서' },
  { id: 'jp-nara',      name: '나라',    countryCode: 'JP', prefecture: '나라현',    travelRegion: '관서' },
  { id: 'jp-himeji',    name: '히메지',   countryCode: 'JP', prefecture: '효고현',    travelRegion: '관서' },
  { id: 'jp-wakayama',  name: '와카야마', countryCode: 'JP', prefecture: '와카야마현', travelRegion: '관서' },

  // 규슈
  { id: 'jp-fukuoka',   name: '후쿠오카', countryCode: 'JP', prefecture: '후쿠오카현', travelRegion: '규슈' },
  { id: 'jp-nagasaki',  name: '나가사키', countryCode: 'JP', prefecture: '나가사키현', travelRegion: '규슈' },
  { id: 'jp-kumamoto',  name: '구마모토', countryCode: 'JP', prefecture: '구마모토현', travelRegion: '규슈' },
  { id: 'jp-beppu',     name: '벳푸',    countryCode: 'JP', prefecture: '오이타현',   travelRegion: '규슈' },
  { id: 'jp-yufuin',    name: '유후인',   countryCode: 'JP', prefecture: '오이타현',   travelRegion: '규슈' },
  { id: 'jp-kagoshima', name: '가고시마', countryCode: 'JP', prefecture: '가고시마현', travelRegion: '규슈' },

  // 중부
  { id: 'jp-nagoya',      name: '나고야',    countryCode: 'JP', prefecture: '아이치현',  travelRegion: '중부' },
  { id: 'jp-kanazawa',    name: '가나자와',  countryCode: 'JP', prefecture: '이시카와현', travelRegion: '중부' },
  { id: 'jp-takayama',    name: '다카야마',  countryCode: 'JP', prefecture: '기후현',    travelRegion: '중부' },
  { id: 'jp-shirakawago', name: '시라카와고', countryCode: 'JP', prefecture: '기후현',   travelRegion: '중부' },
  { id: 'jp-shizuoka',    name: '시즈오카',  countryCode: 'JP', prefecture: '시즈오카현', travelRegion: '중부' },
  { id: 'jp-matsumoto',   name: '마쓰모토',  countryCode: 'JP', prefecture: '나가노현',  travelRegion: '중부' },

  // 홋카이도
  { id: 'jp-sapporo',   name: '삿포로',   countryCode: 'JP', prefecture: '홋카이도', travelRegion: '홋카이도' },
  { id: 'jp-otaru',     name: '오타루',   countryCode: 'JP', prefecture: '홋카이도', travelRegion: '홋카이도' },
  { id: 'jp-hakodate',  name: '하코다테', countryCode: 'JP', prefecture: '홋카이도', travelRegion: '홋카이도' },
  { id: 'jp-furano',    name: '후라노',   countryCode: 'JP', prefecture: '홋카이도', travelRegion: '홋카이도' },
  { id: 'jp-asahikawa', name: '아사히카와', countryCode: 'JP', prefecture: '홋카이도', travelRegion: '홋카이도' },

  // 주고쿠
  { id: 'jp-hiroshima', name: '히로시마', countryCode: 'JP', prefecture: '히로시마현', travelRegion: '주고쿠' },
  { id: 'jp-miyajima',  name: '미야지마', countryCode: 'JP', prefecture: '히로시마현', travelRegion: '주고쿠' },
  { id: 'jp-okayama',   name: '오카야마', countryCode: 'JP', prefecture: '오카야마현', travelRegion: '주고쿠' },
  { id: 'jp-kurashiki', name: '구라시키', countryCode: 'JP', prefecture: '오카야마현', travelRegion: '주고쿠' },

  // 시코쿠
  { id: 'jp-takamatsu', name: '다카마쓰', countryCode: 'JP', prefecture: '가가와현',   travelRegion: '시코쿠' },
  { id: 'jp-matsuyama', name: '마쓰야마', countryCode: 'JP', prefecture: '에히메현',   travelRegion: '시코쿠' },
  { id: 'jp-kochi',     name: '고치',    countryCode: 'JP', prefecture: '고치현',    travelRegion: '시코쿠' },
  { id: 'jp-tokushima', name: '도쿠시마', countryCode: 'JP', prefecture: '도쿠시마현', travelRegion: '시코쿠' },

  // 오키나와
  { id: 'jp-naha',       name: '나하',    countryCode: 'JP', prefecture: '오키나와현', travelRegion: '오키나와' },
  { id: 'jp-ishigaki',   name: '이시가키', countryCode: 'JP', prefecture: '오키나와현', travelRegion: '오키나와' },
  { id: 'jp-miyakojima', name: '미야코지마', countryCode: 'JP', prefecture: '오키나와현', travelRegion: '오키나와' },
]

export const CITIES_BY_COUNTRY: Record<string, City[]> = {
  JP: JAPAN_CITIES,
}

export function getCitiesByCountry(countryCode: string): City[] {
  return CITIES_BY_COUNTRY[countryCode] ?? []
}
