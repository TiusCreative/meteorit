import type { SiteLanguage } from '../i18n';

export type TentangTranslation = {
  title: string;
  visionLabel: string;
  visionText: string;
  missionLabel: string;
  missionItems: string[];
  historyLabel: string;
  historyText: string;
  partnersLabel: string;
  partnerRole: string;
  joinLabel: string;
  joinText: string;
  ctaContact: string;
  ctaForum: string;
};

const tentangTextBase = {
  id: {
    title: 'Tentang Meteorit Indonesia',
    visionLabel: 'Visi Kami',
    visionText: 'Menjadi pusat informasi dan komunitas astronomi terpercaya di Indonesia yang mendorong minat masyarakat terhadap ilmu astronomi, khususnya tentang meteorit dan benda-benda langit lainnya.',
    missionLabel: 'Misi Kami',
    missionItems: [
      'Menyediakan ensiklopedia meteorit yang komprehensif dan mudah diakses',
      'Membangun komunitas penggemar astronomi yang aktif dan saling mendukung',
      'Menyediakan platform untuk diskusi dan pertukaran pengetahuan tentang meteorit',
      'Meningkatkan kesadaran masyarakat tentang pentingnya pelestarian meteorit',
      'Menjadi jembatan antara kolektor, peneliti, dan penggemar meteorit'
    ],
    historyLabel: 'Sejarah Kami',
    historyText: 'Meteorit Indonesia didirikan pada tahun 2023 oleh sekelompok penggemar astronomi yang ingin menciptakan platform yang dapat diakses oleh semua orang untuk mempelajari tentang meteorit. Kami mulai sebagai forum kecil dan telah berkembang menjadi sumber daya komprehensif dengan ribuan anggota dari seluruh Indonesia.',
    partnersLabel: 'Mitra Kami',
    partnerRole: 'Mitra Data API',
    joinLabel: 'Bergabung dengan Kami',
    joinText: 'Kami selalu mencari individu yang bersemangat untuk bergabung dengan tim kami. Jika Anda tertarik dengan astronomi, meteorit, atau ingin berkontribusi pada komunitas kami, silakan hubungi kami.',
    ctaContact: 'Hubungi Kami',
    ctaForum: 'Bergabung di Forum'
  },
  en: {
    title: 'About Meteorit Indonesia',
    visionLabel: 'Our Vision',
    visionText: 'To become a trusted astronomy information center and community in Indonesia that inspires public interest in astronomy, specifically regarding meteorites and other celestial bodies.',
    missionLabel: 'Our Mission',
    missionItems: [
      'Provide a comprehensive and easily accessible meteorite encyclopedia',
      'Build an active and mutually supportive community of astronomy enthusiasts',
      'Provide a platform for discussion and exchange of knowledge about meteorites',
      'Increase public awareness of the importance of meteorite preservation',
      'Bridge collectors, researchers, and meteorite enthusiasts'
    ],
    historyLabel: 'Our History',
    historyText: 'Meteorit Indonesia was founded in 2023 by a group of astronomy enthusiasts who wanted to create a platform accessible to everyone to learn about meteorites. We started as a small forum and have grown into a comprehensive resource with thousands of members from all over Indonesia.',
    partnersLabel: 'Our Partners',
    partnerRole: 'Data API Partner',
    joinLabel: 'Join Us',
    joinText: 'We are always looking for passionate individuals to join our team. If you are interested in astronomy, meteorites, or want to contribute to our community, please contact us.',
    ctaContact: 'Contact Us',
    ctaForum: 'Join the Forum'
  },
  ms: {
    title: 'Tentang Meteorit Indonesia',
    visionLabel: 'Visi Kami',
    visionText: 'Menjadi pusat maklumat dan komuniti astronomi terpercaya di Indonesia yang mendorong minat masyarakat terhadap ilmu astronomi, terutamanya mengenai meteorit dan benda angkasa lain.',
    missionLabel: 'Misi Kami',
    missionItems: [
      'Menyediakan ensiklopedia meteorit yang komprehensif dan mudah diakses',
      'Membina komuniti peminat astronomi yang aktif dan saling menyokong',
      'Menyediakan platform untuk perbincangan dan pertukaran pengetahuan tentang meteorit',
      'Meningkatkan kesedaran masyarakat tentang kepentingan pemuliharaan meteorit',
      'Menjadi jambatan antara pengumpul, penyelidik, dan peminat meteorit'
    ],
    historyLabel: 'Sejarah Kami',
    historyText: 'Meteorit Indonesia diasaskan pada tahun 2023 oleh sekumpulan peminat astronomi yang ingin mencipta platform yang boleh diakses oleh semua orang untuk belajar tentang meteorit. Kami bermula sebagai forum kecil dan telah berkembang menjadi sumber komprehensif dengan ribuan ahli dari seluruh Indonesia.',
    partnersLabel: 'Rakan Kongsi Kami',
    partnerRole: 'Rakan Data API',
    joinLabel: 'Sertai Kami',
    joinText: 'Kami sentiasa mencari individu yang bersemangat untuk menyertai pasukan kami. Jika anda berminat dengan astronomi, meteorit, atau ingin menyumbang kepada komuniti kami, sila hubungi kami.',
    ctaContact: 'Hubungi Kami',
    ctaForum: 'Sertai Forum'
  },
  zh: {
    title: '关于 Meteorit Indonesia',
    visionLabel: '我们的愿景',
    visionText: '成为印度尼西亚值得信赖的天文信息中心和社区，激发公众对天文学的兴趣，特别是关于陨石和其他天体的知识。',
    missionLabel: '我们的使命',
    missionItems: [
      '提供全面且易于获取的陨石百科全书',
      '建立一个活跃且相互支持的天文爱好者社区',
      '提供一个关于陨石知识讨论和交流的平台',
      '提高公众对保护陨石重要性的认识',
      '在收藏家、研究人员和陨石爱好者之间架起桥梁'
    ],
    historyLabel: '我们的历史',
    historyText: 'Meteorit Indonesia 成立于 2023 年，由一群天文学爱好者创立，他们希望创建一个每个人都可以访问的平台来了解陨石。我们开始时是一个小论坛，现已发展成为拥有来自印度尼西亚各地数千名成员的全面资源。',
    partnersLabel: '我们的合作伙伴',
    partnerRole: '数据 API 合作伙伴',
    joinLabel: '加入我们',
    joinText: '我们一直在寻找充满激情的人加入我们的团队。如果您对天文学、陨石感兴趣，或者想为我们的社区做出贡献，请联系我们。',
    ctaContact: '联系我们',
    ctaForum: '加入论坛'
  },
  ja: {
    title: 'Meteorit Indonesia について',
    visionLabel: '私たちのビジョン',
    visionText: 'インドネシアで信頼される天文学情報センターおよびコミュニティとなり、天文学、特に隕石やその他の天体に対する人々の関心を高めること。',
    missionLabel: '私たちのミッション',
    missionItems: [
      '包括的でアクセスしやすい隕石百科事典の提供',
      '活発で相互にサポートし合う天文学愛好家のコミュニティの構築',
      '隕石に関する議論と知識の交換のためのプラットフォームの提供',
      '隕石保存 of 重要性に対する一般の意識向上',
      '収集家、研究者、および隕石愛好家の架け橋となること'
    ],
    historyLabel: '私たちの沿革',
    historyText: 'Meteorit Indonesiaは、誰もが隕石について学べるプラットフォームを作りたいと考えた天文学愛好家のグループによって2023年に設立されました。小さなフォーラムから始まり、現在ではインドネシア全土から数千人のメンバーが集まる包括的なリソースへと成長しました。',
    partnersLabel: 'パートナー',
    partnerRole: 'データ API パートナー',
    joinLabel: '参加する',
    joinText: '私たちは常に、チームに加わってくれる熱意ある人材を求めています。天文学や隕石に興味がある方、またはコミュニティに貢献したい方は、ぜひご連絡ください。',
    ctaContact: 'お問い合わせ',
    ctaForum: 'フォーラムに参加'
  }
};

export const tentangText: Record<SiteLanguage, TentangTranslation> = {
  ...tentangTextBase,
  ru: {
  "title": "О Meteorit Indonesia",
  "visionLabel": "Наша Видение",
  "visionText": "Стать доверенным центром информации по астрономии и сообществом в Индонезии, который вдохновляет общественный интерес к астрономии, в частности, касающийся метеоритов и других небесных тел.",
  "missionLabel": "Наша Миссия",
  "missionItems": [
    "Предоставить всестороннюю и легко доступную энциклопедию метеоритов",
    "Создать активное и взаимно поддерживающее сообщество энтузиастов астрономии",
    "Предоставить платформу для обсуждения и обмена знаниями о метеоритах",
    "Повысить осведомленность общества об важности сохранения метеоритов",
    "Связать коллекционеров, исследователей и энтузиастов метеоритов"
  ],
  "historyLabel": "Наша История",
  "historyText": "Meteorit Indonesia была основана в 2023 году группой энтузиастов астрономии, которые хотели создать платформу, доступную всем, чтобы узнать о метеоритах. Мы начали как небольшой форум и выросли в всесторонний ресурс с тысячами участников со всей Индонезии.",
  "partnersLabel": "Наши Партнеры",
  "partnerRole": "Партнер API данных",
  "joinLabel": "Присоединяйтесь к нам",
  "joinText": "Мы всегда ищем страстных людей, чтобы присоединиться к нашей команде. Если вы интересуетесь астрономией, метеоритами или хотите внести свой вклад в наше сообщество, пожалуйста, свяжитесь с нами.",
  "ctaContact": "Свяжитесь с нами",
  "ctaForum": "Присоединяйтесь к форуму"
},
  fr: {
  "title": "À propos de Meteorit Indonésie",
  "visionLabel": "Notre Vision",
  "visionText": "Devenir un centre d'information astronomique de confiance et une communauté en Indonésie qui inspire l'intérêt du public pour l'astronomie, en particulier en ce qui concerne les météorites et les autres corps célestes.",
  "missionLabel": "Notre Mission",
  "missionItems": [
    "Fournir une encyclopédie de météorites complète et facilement accessible",
    "Construire une communauté active et mutuellement solidaire d'amateurs d'astronomie",
    "Fournir une plateforme pour la discussion et l'échange de connaissances sur les météorites",
    "Augmenter la sensibilisation du public à l'importance de la préservation des météorites",
    "Réunir les collectionneurs, les chercheurs et les amateurs de météorites"
  ],
  "historyLabel": "Notre Histoire",
  "historyText": "Meteorit Indonésie a été fondée en 2023 par un groupe d'amateurs d'astronomie qui voulaient créer une plateforme accessible à tous pour apprendre sur les météorites. Nous avons commencé comme un petit forum et sommes devenus une ressource complète avec des milliers de membres de toute l'Indonésie.",
  "partnersLabel": "Nos Partenaires",
  "partnerRole": "Partenaire de l'API de données",
  "joinLabel": "Rejoignez-nous",
  "joinText": "Nous sommes toujours à la recherche d'individus passionnés pour rejoindre notre équipe. Si vous êtes intéressé par l'astronomie, les météorites, ou si vous souhaitez contribuer à notre communauté, veuillez nous contacter.",
  "ctaContact": "Contactez-nous",
  "ctaForum": "Rejoignez le Forum"
}
};
