import type { SiteLanguage } from '../i18n';

export type VisiMisiTranslation = {
  title: string;
  visionLabel: string;
  visionText: string;
  missionLabel: string;
  missionItems: string[];
  valuesTitle: string;
  valuesSubtitle: string;
  timelineTitle: string;
  timelineSubtitle: string;
  ctaTitle: string;
  ctaSubtitle: string;
  ctaEncyc: string;
  ctaCommunity: string;
};

const visiMisiTextBase = {
  id: {
    title: 'Visi & Misi',
    visionLabel: 'Visi',
    visionText: 'Menjadi portal Live Space Dashboard berbahasa Indonesia pertama yang memadukan edukasi meteorit dengan data antariksa real-time, sehingga setiap warga Indonesia dapat memahami dan menikmati keajaiban alam semesta.',
    missionLabel: 'Misi',
    missionItems: [
      'Menyajikan data NASA, ESA, dan lembaga antariksa dunia dalam bahasa Indonesia yang mudah dipahami',
      'Membangun komunitas astronomi Indonesia yang inklusif, aktif, dan berbasis pengetahuan',
      'Mendukung literasi sains nasional melalui konten edukasi meteorit, komet, dan fenomena antariksa',
      'Menyediakan data real-time (ISS, astronot, APOD, NEO) yang akurat dan terverifikasi',
      'Menjadi referensi terpercaya bagi pelajar, peneliti, dan penggemar astronomi Indonesia',
    ],
    valuesTitle: 'Nilai-Nilai Kami',
    valuesSubtitle: 'Prinsip yang memandu setiap keputusan dan inovasi di Meteorit Indonesia',
    timelineTitle: 'Perjalanan Kami',
    timelineSubtitle: 'Tonggak penting dalam perkembangan Meteorit Indonesia',
    ctaTitle: 'Bergabunglah dalam Perjalanan Antariksa Ini',
    ctaSubtitle: 'Bersama komunitas astronomi Indonesia, mari kita eksplorasi alam semesta dan tingkatkan literasi sains bangsa.',
    ctaEncyc: '🪨 Jelajahi Ensiklopedia',
    ctaCommunity: '🤝 Gabung Komunitas',
  },
  en: {
    title: 'Vision & Mission',
    visionLabel: 'Vision',
    visionText: 'To become the first Indonesian-language Live Space Dashboard portal that combines meteorite education with real-time space data, so every Indonesian can understand and enjoy the wonders of the universe.',
    missionLabel: 'Mission',
    missionItems: [
      'Present data from NASA, ESA, and world space agencies in easy-to-understand Indonesian',
      'Build an inclusive, active, and knowledge-based Indonesian astronomy community',
      'Support national science literacy through meteorite, comet, and space phenomena educational content',
      'Provide accurate and verified real-time data (ISS, astronauts, APOD, NEO)',
      'Become a trusted reference for Indonesian students, researchers, and astronomy enthusiasts',
    ],
    valuesTitle: 'Our Values',
    valuesSubtitle: 'Principles guiding every decision and innovation at Meteorit Indonesia',
    timelineTitle: 'Our Journey',
    timelineSubtitle: 'Key milestones in the development of Meteorit Indonesia',
    ctaTitle: 'Join Us in This Space Journey',
    ctaSubtitle: 'Together with the Indonesian astronomy community, let\'s explore the universe and advance our nation\'s science literacy.',
    ctaEncyc: '🪨 Explore Encyclopedia',
    ctaCommunity: '🤝 Join Community',
  },
  ms: {
    title: 'Visi & Misi',
    visionLabel: 'Visi',
    visionText: 'Menjadi portal Live Space Dashboard berbahasa Indonesia pertama yang menggabungkan pendidikan meteorit dengan data angkasa real-time, supaya setiap rakyat Indonesia dapat memahami dan menikmati keajaiban alam semesta.',
    missionLabel: 'Misi',
    missionItems: [
      'Menyajikan data NASA, ESA, dan agensi angkasa dunia dalam bahasa yang mudah difahami',
      'Membina komuniti astronomi Indonesia yang inklusif, aktif, dan berasaskan pengetahuan',
      'Menyokong literasi sains nasional melalui kandungan pendidikan meteorit, komet, dan fenomena angkasa',
      'Menyediakan data real-time (ISS, angkasawan, APOD, NEO) yang tepat dan disahkan',
      'Menjadi rujukan terpercaya bagi pelajar, penyelidik, dan peminat astronomi Indonesia',
    ],
    valuesTitle: 'Nilai-Nilai Kami',
    valuesSubtitle: 'Prinsip yang membimbing setiap keputusan dan inovasi di Meteorit Indonesia',
    timelineTitle: 'Perjalanan Kami',
    timelineSubtitle: 'Pencapaian penting dalam perkembangan Meteorit Indonesia',
    ctaTitle: 'Sertailah Perjalanan Angkasa Ini',
    ctaSubtitle: 'Bersama komuniti astronomi Indonesia, mari kita terokai alam semesta dan tingkatkan literasi sains bangsa.',
    ctaEncyc: '🪨 Jelajahi Ensiklopedia',
    ctaCommunity: '🤝 Sertai Komuniti',
  },
  zh: {
    title: '愿景与使命',
    visionLabel: '愿景',
    visionText: '成为第一个印度尼西亚语 Live Space Dashboard 门户，将陨石教育与实时太空数据相结合，让每位印度尼西亚人都能理解和欣赏宇宙的奇迹。',
    missionLabel: '使命',
    missionItems: [
      '以易于理解的印度尼西亚语呈现 NASA、ESA 和世界航天机构的数据',
      '建立一个包容、活跃、基于知识的印度尼西亚天文社区',
      '通过陨石、彗星和太空现象的教育内容支持国家科学素养',
      '提供准确、经过验证的实时数据（ISS、宇航员、APOD、NEO）',
      '成为印度尼西亚学生、研究人员和天文爱好者的可信参考',
    ],
    valuesTitle: '我们的价值观',
    valuesSubtitle: '指导 Meteorit Indonesia 每个决策和创新的原则',
    timelineTitle: '我们的历程',
    timelineSubtitle: 'Meteorit Indonesia 发展中的重要里程碑',
    ctaTitle: '加入这段太空旅程',
    ctaSubtitle: '与印度尼西亚天文社区一起，探索宇宙，提升国家科学素养。',
    ctaEncyc: '🪨 探索百科全书',
    ctaCommunity: '🤝 加入社区',
  },
  ja: {
    title: 'ビジョンとミッション',
    visionLabel: 'ビジョン',
    visionText: '隕石教育とリアルタイム宇宙データを組み合わせた、インドネシア語初のLive Space Dashboardポータルになり、すべてのインドネシア人が宇宙の不思議を理解し楽しめるようにすること。',
    missionLabel: 'ミッション',
    missionItems: [
      'NASA、ESA、世界の宇宙機関のデータを分かりやすいインドネシア語で提供する',
      '包括的で活発な知識ベースのインドネシア天文学コミュニティを構築する',
      '隕石、彗星、宇宙現象に関する教育コンテンツを通じて国家の科学リテラシーを支援する',
      '正確で検証済みのリアルタイムデータ（ISS、宇宙飛行士、APOD、NEO）を提供する',
      'インドネシアの学生、研究者、天文学愛好者のための信頼できる参考資料になる',
    ],
    valuesTitle: '私たちの価値観',
    valuesSubtitle: 'Meteorit Indonesiaのすべての決定とイノベーションを導く原則',
    timelineTitle: '私たちの歩み',
    timelineSubtitle: 'Meteorit Indonesiaの発展における重要なマイルストーン',
    ctaTitle: 'この宇宙の旅に参加しよう',
    ctaSubtitle: 'インドネシアの天文学コミュニティとともに、宇宙を探索し、国の科学リテラシーを向上させましょう。',
    ctaEncyc: '🪨 百科事典を探索',
    ctaCommunity: '🤝 コミュニティに参加',
  },
};

export const visiMisiText: Record<SiteLanguage, VisiMisiTranslation> = {
  ...visiMisiTextBase,
  ru: {
  "title": "Миссия и Видение",
  "visionLabel": "Видение",
  "visionText": "Стать первым индонезийским порталом Live Space Dashboard, который сочетает образование в области метеоритов с данными о космосе в реальном времени, чтобы каждый индонезиец мог понять и наслаждаться чудесами Вселенной.",
  "missionLabel": "Миссия",
  "missionItems": [
    "Представлять данные от NASA, ESA и мировых космических агентств на индонезийском языке в легко понимаемой форме",
    "Создавать инклюзивное, активное и знание-ориентированное индонезийское астрономическое сообщество",
    "Содействовать национальной научной грамотности посредством образовательного контента о метеоритах, кометах и космических явлениях",
    "Предоставлять точные и проверенные данные в реальном времени (МКС, астронавты, APOD, NEO)",
    "Стать надежным источником информации для индонезийских студентов, исследователей и энтузиастов астрономии"
  ],
  "valuesTitle": "Наши Ценности",
  "valuesSubtitle": "Принципы, которыми руководствуются все решения и инновации в Meteorit Indonesia",
  "timelineTitle": "Наша История",
  "timelineSubtitle": "Ключевые вехи в развитии Meteorit Indonesia",
  "ctaTitle": "Присоединяйтесь к нам в этом космическом путешествии",
  "ctaSubtitle": "Вместе с индонезийским астрономическим сообществом давайте исследуем Вселенную и продвигаем научную грамотность нашей нации.",
  "ctaEncyc": "🪨 Изучить Энциклопедию",
  "ctaCommunity": "🤝 Присоединиться к Сообществу"
},
  fr: {
  "title": "Vision & Mission",
  "visionLabel": "Vision",
  "visionText": "Devenir le premier portail de tableau de bord d'espace en temps réel en indonésien qui combine l'éducation sur les météorites avec des données spatiales en temps réel, afin que chaque Indonésien puisse comprendre et apprécier les merveilles de l'univers.",
  "missionLabel": "Mission",
  "missionItems": [
    "Présenter des données de la NASA, de l'ESA et des agences spatiales mondiales en indonésien facile à comprendre",
    "Construire une communauté d'astronomie indonésienne inclusive, active et basée sur les connaissances",
    "Soutenir l'alphabétisation scientifique nationale grâce à des contenus éducatifs sur les météorites, les comètes et les phénomènes spatiaux",
    "Fournir des données en temps réel précises et vérifiées (ISS, astronautes, APOD, NEO)",
    "Devenir une référence fiable pour les étudiants, les chercheurs et les passionnés d'astronomie indonésiens"
  ],
  "valuesTitle": "Nos Valeurs",
  "valuesSubtitle": "Principes qui guident chaque décision et innovation chez Meteorit Indonésie",
  "timelineTitle": "Notre Parcours",
  "timelineSubtitle": "Jalons clés dans le développement de Meteorit Indonésie",
  "ctaTitle": "Rejoignez-nous dans ce voyage spatial",
  "ctaSubtitle": "Avec la communauté d'astronomie indonésienne, explorons l'univers et faisons progresser l'alphabétisation scientifique de notre nation.",
  "ctaEncyc": "🪨 Explorer l'encyclopédie",
  "ctaCommunity": "🤝 Rejoindre la communauté"
}
};
