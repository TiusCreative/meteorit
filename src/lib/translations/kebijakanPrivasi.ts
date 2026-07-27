import { kebijakanPrivasiTextRu } from './kebijakanPrivasiRu';
import { kebijakanPrivasiTextFr } from './kebijakanPrivasiFr';
import type { SiteLanguage } from '../i18n';

export type KebijakanPrivasiTranslation = {
  title: string;
  lastUpdated: string;
  introTitle: string;
  introP1: string;
  introP2: string;
  collectTitle: string;
  collectP1Title: string;
  collectP1Desc: string;
  collectP1Items: string[];
  collectP2Title: string;
  collectP2Desc: string;
  collectP2Items: string[];
  collectP3Title: string;
  collectP3Desc: string;
  collectP3Items: string[];
  collectP3Note: string;
  useTitle: string;
  useDesc: string;
  useItems: string[];
  protectTitle: string;
  protectDesc: string;
  protectItems: string[];
  protectNote: string;
  shareTitle: string;
  shareDesc: string;
  shareItems: string[];
  shareNote: string;
  rightsTitle: string;
  rightsDesc: string;
  rightsItems: string[];
  rightsNote: string;
  retentionTitle: string;
  retentionP1: string;
  retentionP2: string;
  retentionItems: string[];
  childrenTitle: string;
  childrenP1: string;
  childrenP2: string;
  changesTitle: string;
  changesP1: string;
  changesP2: string;
  contactTitle: string;
  contactDesc: string;
  emailLabel: string;
  addressLabel: string;
  addressDesc: string;
};

const kebijakanPrivasiTextBase = {
  id: {
    title: 'Kebijakan Privasi',
    lastUpdated: 'Terakhir diperbarui: 23 Juni 2026',
    introTitle: 'Pendahuluan',
    introP1: 'Di Meteorit Indonesia, kami menghargai privasi Anda dan berkomitmen untuk melindungi informasi pribadi Anda. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, mengungkapkan, dan melindungi informasi Anda ketika Anda menggunakan website kami.',
    introP2: 'Dengan menggunakan website kami, Anda setuju dengan pengumpulan dan penggunaan informasi sesuai dengan Kebijakan Privasi ini.',
    collectTitle: 'Informasi yang Kami Kumpulkan',
    collectP1Title: '1. Informasi Pribadi',
    collectP1Desc: 'Kami dapat mengumpulkan informasi pribadi yang Anda berikan secara sukarela ketika Anda:',
    collectP1Items: [
      'Membuat akun (nama, alamat email, dll.)',
      'Berpartisipasi di forum (postingan, komentar)',
      'Mengirim pesan melalui formulir kontak',
      'Melakukan donasi (informasi pembayaran)',
      'Berlangganan newsletter (alamat email)'
    ],
    collectP2Title: '2. Informasi Non-Pribadi',
    collectP2Desc: 'Kami secara otomatis mengumpulkan informasi non-pribadi seperti:',
    collectP2Items: [
      'Alamat IP dan informasi browser',
      'Halaman yang dikunjungi dan waktu kunjungan',
      'Informasi perangkat (tipe, OS, dll.)',
      'Data analitik penggunaan website'
    ],
    collectP3Title: '3. Cookie dan Teknologi Pelacakan',
    collectP3Desc: 'Kami menggunakan cookie dan teknologi serupa untuk:',
    collectP3Items: [
      'Meningkatkan pengalaman pengguna',
      'Menganalisis penggunaan website',
      'Menyimpan preferensi pengguna',
      'Menargetkan iklan yang relevan'
    ],
    collectP3Note: 'Anda dapat menonaktifkan cookie melalui pengaturan browser, tetapi ini mungkin mempengaruhi fungsionalitas website.',
    useTitle: 'Cara Kami Menggunakan Informasi Anda',
    useDesc: 'Kami menggunakan informasi yang kami kumpulkan untuk tujuan berikut:',
    useItems: [
      'Menyediakan dan memelihara layanan kami',
      'Meningkatkan pengalaman pengguna',
      'Berkomunikasi dengan Anda (email, notifikasi)',
      'Memproses transaksi donasi',
      'Menganalisis penggunaan website',
      'Mencegah penipuan dan penyalahgunaan',
      'Memenuhi kewajiban hukum'
    ],
    protectTitle: 'Bagaimana Kami Melindungi Informasi Anda',
    protectDesc: 'Kami menerapkan langkah-langkah keamanan yang wajar untuk melindungi informasi pribadi Anda dari akses yang tidak sah, perubahan, pengungkapan, atau penghancuran, termasuk:',
    protectItems: [
      'Enkripsi data sensitif',
      'Kontrol akses yang ketat',
      'Pemantauan keamanan secara teratur',
      'Pembaruan keamanan berkala'
    ],
    protectNote: 'Meskipun kami berusaha melindungi informasi Anda, tidak ada metode transmisi atau penyimpanan elektronik yang 100% aman. Kami tidak dapat menjamin keamanan absolut.',
    shareTitle: 'Berbagi Informasi dengan Pihak Ketiga',
    shareDesc: 'Kami tidak menjual atau menyewakan informasi pribadi Anda kepada pihak ketiga. Namun, kami dapat berbagi informasi dengan:',
    shareItems: [
      'Penyedia layanan: Pihak ketiga yang membantu kami mengoperasikan website (hosting, analitik, pembayaran)',
      'Kewajiban hukum: Jika diperlukan oleh hukum atau untuk melindungi hak kami',
      'Transaksi bisnis: Jika terjadi penggabungan, akuisisi, atau penjualan aset'
    ],
    shareNote: 'Kami hanya berbagi informasi yang diperlukan dan memastikan pihak ketiga tersebut mematuhi standar privasi yang ketat.',
    rightsTitle: 'Hak Anda',
    rightsDesc: 'Anda memiliki hak-hak berikut terkait dengan informasi pribadi Anda:',
    rightsItems: [
      'Akses: Meminta salinan informasi pribadi yang kami simpan',
      'Perbaikan: Meminta koreksi informasi yang tidak akurat',
      'Penghapusan: Meminta penghapusan informasi dalam kondisi tertentu',
      'Penolakan: Menolak pemrosesan informasi Anda dalam kondisi tertentu',
      'Portabilitas: Meminta transfer informasi Anda ke layanan lain'
    ],
    rightsNote: 'Untuk mengekspresikan hak-hak Anda, silakan hubungi kami melalui email: privacy@meteorit-indonesia.com',
    retentionTitle: 'Retensi Data',
    retentionP1: 'Kami akan menyimpan informasi pribadi Anda hanya selama diperlukan untuk tujuan yang dijelaskan dalam Kebijakan Privasi ini, kecuali diperlukan oleh hukum.',
    retentionP2: 'Kriteria yang kami gunakan untuk menentukan periode retensi termasuk:',
    retentionItems: [
      'Apakah informasi masih diperlukan untuk menyediakan layanan',
      'Apakah ada kewajiban hukum untuk menyimpan data',
      'Apakah ada permintaan penghapusan dari Anda'
    ],
    childrenTitle: 'Kebijakan Privasi Anak',
    childrenP1: 'Layanan kami tidak ditujukan untuk anak di bawah usia 13 tahun. Kami tidak secara sengaja mengumpulkan informasi pribadi dari anak di bawah usia 13 tahun. Jika kami mengetahui bahwa kami telah mengumpulkan informasi pribadi dari anak di bawah usia 13 tahun tanpa verifikasi izin orang tua, kami akan mengambil langkah untuk menghapus informasi tersebut secepat mungkin.',
    childrenP2: 'Jika Anda adalah orang tua atau wali dan Anda mengetahui bahwa anak Anda telah memberikan kami dengan informasi pribadi, silakan hubungi kami sehingga kami dapat mengambil tindakan yang diperlukan.',
    changesTitle: 'Perubahan pada Kebijakan Privasi',
    changesP1: 'Kami dapat memperbarui Kebijakan Privasi kami dari waktu ke waktu. Kami akan memberitahukan Anda tentang perubahan dengan mempublikasikan Kebijakan Privasi yang baru di halaman ini.',
    changesP2: 'Kami menyarankan Anda untuk meninjau Kebijakan Privasi ini secara berkala untuk perubahan apa pun. Perubahan pada Kebijakan Privasi ini efektif ketika diposting di halaman ini.',
    contactTitle: 'Hubungi Kami',
    contactDesc: 'Jika Anda memiliki pertanyaan tentang Kebijakan Privasi ini, silakan hubungi kami:',
    emailLabel: 'Email',
    addressLabel: 'Alamat',
    addressDesc: 'Perum Puri Cikarang Hijau, Bekasi, Jawa Barat 17530, Indonesia'
  },
  en: {
    title: 'Privacy Policy',
    lastUpdated: 'Last updated: June 23, 2026',
    introTitle: 'Introduction',
    introP1: 'At Meteorit Indonesia, we value your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website.',
    introP2: 'By using our website, you agree to the collection and use of information in accordance with this Privacy Policy.',
    collectTitle: 'Information We Collect',
    collectP1Title: '1. Personal Information',
    collectP1Desc: 'We may collect personal information that you voluntarily provide when you:',
    collectP1Items: [
      'Create an account (name, email address, etc.)',
      'Participate in the forum (posts, comments)',
      'Send messages through the contact form',
      'Make donations (payment information)',
      'Subscribe to the newsletter (email address)'
    ],
    collectP2Title: '2. Non-Personal Information',
    collectP2Desc: 'We automatically collect non-personal information such as:',
    collectP2Items: [
      'IP address and browser information',
      'Pages visited and visit times',
      'Device information (type, OS, etc.)',
      'Website usage analytics data'
    ],
    collectP3Title: '3. Cookies and Tracking Technologies',
    collectP3Desc: 'We use cookies and similar technologies to:',
    collectP3Items: [
      'Enhance user experience',
      'Analyze website usage',
      'Save user preferences',
      'Target relevant advertisements'
    ],
    collectP3Note: 'You can disable cookies through your browser settings, but this may affect website functionality.',
    useTitle: 'How We Use Your Information',
    useDesc: 'We use the information we collect for the following purposes:',
    useItems: [
      'Provide and maintain our services',
      'Enhance user experience',
      'Communicate with you (emails, notifications)',
      'Process donation transactions',
      'Analyze website usage',
      'Prevent fraud and abuse',
      'Fulfill legal obligations'
    ],
    protectTitle: 'How We Protect Your Information',
    protectDesc: 'We implement reasonable security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction, including:',
    protectItems: [
      'Encryption of sensitive data',
      'Strict access controls',
      'Regular security monitoring',
      'Periodic security updates'
    ],
    protectNote: 'Although we strive to protect your information, no method of transmission or electronic storage is 100% secure. We cannot guarantee absolute security.',
    shareTitle: 'Sharing Information with Third Parties',
    shareDesc: 'We do not sell or rent your personal information to third parties. However, we may share information with:',
    shareItems: [
      'Service providers: Third parties that help us operate the website (hosting, analytics, payments)',
      'Legal obligations: If required by law or to protect our rights',
      'Business transactions: In the event of a merger, acquisition, or asset sale'
    ],
    shareNote: 'We only share necessary information and ensure these third parties comply with strict privacy standards.',
    rightsTitle: 'Your Rights',
    rightsDesc: 'You have the following rights regarding your personal information:',
    rightsItems: [
      'Access: Request a copy of the personal information we store',
      'Correction: Request correction of inaccurate information',
      'Deletion: Request deletion of information under certain conditions',
      'Objection: Object to the processing of your information under certain conditions',
      'Portability: Request transfer of your information to another service'
    ],
    rightsNote: 'To express your rights, please contact us via email: privacy@meteorit-indonesia.com',
    retentionTitle: 'Data Retention',
    retentionP1: 'We will retain your personal information only for as long as is necessary for the purposes set out in this Privacy Policy, unless required by law.',
    retentionP2: 'The criteria we use to determine retention periods include:',
    retentionItems: [
      'Whether the information is still needed to provide services',
      'Whether there is a legal obligation to retain the data',
      'Whether there is a deletion request from you'
    ],
    childrenTitle: 'Children\'s Privacy Policy',
    childrenP1: 'Our service is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If we learn that we have collected personal information from a child under 13 without verification of parental consent, we will take steps to remove that information as quickly as possible.',
    childrenP2: 'If you are a parent or guardian and you are aware that your child has provided us with personal information, please contact us so that we can take necessary actions.',
    changesTitle: 'Changes to the Privacy Policy',
    changesP1: 'We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.',
    changesP2: 'We advise you to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.',
    contactTitle: 'Contact Us',
    contactDesc: 'If you have any questions about this Privacy Policy, please contact us:',
    emailLabel: 'Email',
    addressLabel: 'Address',
    addressDesc: 'Perum Puri Cikarang Hijau, Bekasi, West Java 17530, Indonesia'
  },
  ms: {
    title: 'Dasar Privasi',
    lastUpdated: 'Terakhir dikemas kini: 23 Jun 2026',
    introTitle: 'Pendahuluan',
    introP1: 'Di Meteorit Indonesia, kami menghargai privasi anda dan berkomitmen untuk melindungi maklumat peribadi anda. Dasar Privasi ini menjelaskan bagaimana kami mengumpul, menggunakan, mendedahkan, dan melindungi maklumat anda apabila anda menggunakan laman web kami.',
    introP2: 'Dengan menggunakan laman web kami, anda bersetuju dengan pengumpulan dan penggunaan maklumat mengikut Dasar Privasi ini.',
    collectTitle: 'Maklumat yang Kami Kumpul',
    collectP1Title: '1. Maklumat Peribadi',
    collectP1Desc: 'Kami mungkin mengumpul maklumat peribadi yang anda berikan secara sukarela apabila anda:',
    collectP1Items: [
      'Membina akaun (nama, alamat email, dll.)',
      'Mengambil bahagian di forum (postingan, komen)',
      'Menghantar mesej melalui borang hubungan',
      'Melakukan derma (maklumat pembayaran)',
      'Melanggan newsletter (alamat email)'
    ],
    collectP2Title: '2. Maklumat Bukan Peribadi',
    collectP2Desc: 'Kami secara automatik mengumpul maklumat bukan peribadi seperti:',
    collectP2Items: [
      'Alamat IP dan maklumat penyemak imbas',
      'Halaman yang dilawati dan masa lawatan',
      'Maklumat peranti (jenis, OS, dll.)',
      'Data analitik penggunaan laman web'
    ],
    collectP3Title: '3. Kuki dan Teknologi Penjejakan',
    collectP3Desc: 'Kami menggunakan kuki dan teknologi serupa untuk:',
    collectP3Items: [
      'Meningkatkan pengalaman pengguna',
      'Menganalisis penggunaan laman web',
      'Menyimpan pilihan pengguna',
      'Menyasarkan iklan yang relevan'
    ],
    collectP3Note: 'Anda boleh menyahaktifkan kuki melalui tetapan penyemak imbas anda, tetapi ini mungkin menjejaskan fungsi laman web.',
    useTitle: 'Cara Kami Menggunakan Maklumat Anda',
    useDesc: 'Kami menggunakan maklumat yang kami kumpul untuk tujuan berikut:',
    useItems: [
      'Menyediakan dan mengekalkan perkhidmatan kami',
      'Meningkatkan pengalaman pengguna',
      'Berkomunikasi dengan anda (email, pemberitahuan)',
      'Memproses transaksi derma',
      'Menganalisis penggunaan laman web',
      'Mencegah penipuan dan penyalahgunaan',
      'Memenuhi kewajipan undang-undang'
    ],
    protectTitle: 'Bagaimana Kami Melindungi Maklumat Anda',
    protectDesc: 'Kami melaksanakan langkah keselamatan yang wajar untuk melindungi maklumat peribadi anda daripada akses yang tidak dibenarkan, perubahan, pendedahan, atau pemusnahan, termasuk:',
    protectItems: [
      'Enkripsi data sensitif',
      'Kawalan akses yang ketat',
      'Pemantauan keselamatan secara berkala',
      'Kemas kini keselamatan berkala'
    ],
    protectNote: 'Walaupun kami berusaha untuk melindungi maklumat anda, tiada kaedah penghantaran atau penyimpanan elektronik yang 100% selamat. Kami tidak dapat menjamin keselamatan mutlak.',
    shareTitle: 'Berkongsi Maklumat dengan Pihak Ketiga',
    shareDesc: 'Kami tidak menjual atau menyewakan maklumat peribadi anda kepada pihak ketiga. Walau bagaimanapun, kami mungkin berkongsi maklumat dengan:',
    shareItems: [
      'Penyedia perkhidmatan: Pihak ketiga yang membantu kami mengendalikan laman web (hosting, analitik, pembayaran)',
      'Kewajipan undang-undang: Jika diperlukan oleh undang-undang atau untuk melindungi hak kami',
      'Transaksi perniagaan: Sekiranya berlaku penggabungan, pengambilalihan, atau penjualan aset'
    ],
    shareNote: 'Kami hanya berkongsi maklumat yang diperlukan dan memastikan pihak ketiga tersebut mematuhi piawaian privasi yang ketat.',
    rightsTitle: 'Hak Anda',
    rightsDesc: 'Anda mempunyai hak-hak berikut berkaitan dengan maklumat peribadi anda:',
    rightsItems: [
      'Akses: Meminta salinan maklumat peribadi yang kami simpan',
      'Pembetulan: Meminta pembetulan maklumat yang tidak tepat',
      'Pemadaman: Meminta pemadaman maklumat di bawah syarat tertentu',
      'Bantahan: Membantah pemprosesan maklumat anda di bawah syarat tertentu',
      'Portabiliti: Meminta pemindahan maklumat anda ke perkhidmatan lain'
    ],
    rightsNote: 'Untuk menyatakan hak anda, sila hubungi kami melalui email: privacy@meteorit-indonesia.com',
    retentionTitle: 'Retensi Data',
    retentionP1: 'Kami akan menyimpan maklumat peribadi anda hanya selama yang diperlukan untuk tujuan yang dijelaskan dalam Dasar Privasi ini, melainkan diperlukan oleh undang-undang.',
    retentionP2: 'Kriteria yang kami gunakan untuk menentukan tempoh retensi termasuk:',
    retentionItems: [
      'Sama ada maklumat masih diperlukan untuk menyediakan perkhidmatan',
      'Sama ada terdapat kewajipan undang-undang untuk menyimpan data',
      'Sama ada terdapat permintaan pemadaman daripada anda'
    ],
    childrenTitle: 'Dasar Privasi Kanak-Kanak',
    childrenP1: 'Perkhidmatan kami tidak ditujukan untuk kanak-kanak di bawah umur 13 tahun. Kami tidak sengaja mengumpul maklumat peribadi daripada kanak-kanak di bawah umur 13 tahun. Jika kami mengetahui bahawa kami telah mengumpul maklumat peribadi daripada kanak-kanak di bawah umur 13 tahun tanpa pengesahan kebenaran ibu bapa, kami akan mengambil langkah untuk memadam maklumat tersebut secepat mungkin.',
    childrenP2: 'Jika anda adalah ibu bapa atau penjaga dan anda menyedari bahawa anak anda telah memberikan kami maklumat peribadi, sila hubungi kami supaya kami boleh mengambil tindakan yang diperlukan.',
    changesTitle: 'Perubahan pada Dasar Privasi',
    changesP1: 'Kami mungkin mengemas kini Dasar Privasi kami dari semasa ke semasa. Kami akan memberitahu anda tentang sebarang perubahan dengan menerbitkan Dasar Privasi yang baharu di halaman ini.',
    changesP2: 'Kami menasihatkan anda untuk menyemak Dasar Privasi ini secara berkala untuk sebarang perubahan. Perubahan pada Dasar Privasi ini berkuat kuasa apabila ia disiarkan di halaman ini.',
    contactTitle: 'Hubungi Kami',
    contactDesc: 'Jika anda mempunyai sebarang soalan tentang Dasar Privasi ini, sila hubungi kami:',
    emailLabel: 'Email',
    addressLabel: 'Alamat',
    addressDesc: 'Perum Puri Cikarang Hijau, Bekasi, Jawa Barat 17530, Indonesia'
  },
  zh: {
    title: '隐私政策',
    lastUpdated: '最后更新：2026年6月23日',
    introTitle: '前言',
    introP1: '在 Meteorit Indonesia，我们非常重视您的隐私并致力于保护您的个人信息。本隐私政策解释了当您使用我们的网站时，我们如何收集、使用、披露和保护您的信息。',
    introP2: '通过使用我们的网站，您同意根据本隐私政策收集和使用信息。',
    collectTitle: '我们收集的信息',
    collectP1Title: '1. 个人信息',
    collectP1Desc: '我们可能会收集您在以下情况下自愿提供的个人信息：',
    collectP1Items: [
      '创建账户（姓名、电子邮箱等）',
      '参与论坛（发帖、评论）',
      '通过联系表单发送消息',
      '进行捐助（付款信息）',
      '订阅新闻通讯（邮箱地址）'
    ],
    collectP2Title: '2. 非个人信息',
    collectP2Desc: '我们会自动收集非个人信息，例如：',
    collectP2Items: [
      'IP 地址和浏览器信息',
      '访问的页面和访问时间',
      '设备信息（类型、操作系统等）',
      '网站使用情况分析数据'
    ],
    collectP3Title: '3. Cookies 和追踪技术',
    collectP3Desc: '我们使用 Cookies 和类似技术来：',
    collectP3Items: [
      '提升用户体验',
      '分析网站使用情况',
      '保存用户偏好',
      '定向投放相关广告'
    ],
    collectP3Note: '您可以通过浏览器设置禁用 Cookies，但这可能会影响网站的部分功能。',
    useTitle: '我们如何使用您的信息',
    useDesc: '我们收集信息用于以下目的：',
    useItems: [
      '提供并维护我们的服务',
      '提升用户体验',
      '与您沟通（电子邮件、通知）',
      '处理捐助交易',
      '分析网站使用情况',
      '预防欺诈和滥用',
      '履行法律义务'
    ],
    protectTitle: '我们如何保护您的信息',
    protectDesc: '我们采取合理的安全措施保护您的个人信息免遭未经授权的访问、篡改、披露或销毁，包括：',
    protectItems: [
      '敏感数据加密',
      '严格的访问控制',
      '定期安全监控',
      '定期安全更新'
    ],
    protectNote: '尽管我们尽力保护您的信息，但没有任何一种电子传输或存储方法是 100% 安全的。我们无法保证绝对的安全。',
    shareTitle: '与第三方共享信息',
    shareDesc: '我们不会向第三方出售或出租您的个人信息。但是，我们可能会与以下各方共享信息：',
    shareItems: [
      '服务提供商：帮助我们运营网站的第三方（托管、分析、支付）',
      '法律义务：根据法律要求或为了保护我们的权利',
      '业务交易：在合并、收购或资产出售的情况下'
    ],
    shareNote: '我们仅共享必要的信息，并确保这些第三方遵守严格的隐私标准。',
    rightsTitle: '您的权利',
    rightsDesc: '关于您的个人信息，您拥有以下权利：',
    rightsItems: [
      '访问：请求获取我们保存的您的个人信息副本',
      '更正：请求更正不准确的信息',
      '删除：在特定条件下请求删除您的信息',
      '反对：在特定条件下反对处理您的信息',
      '移植：请求将您的信息转移到其他服务'
    ],
    rightsNote: '如需行使您的权利，请通过电子邮件与我们联系：privacy@meteorit-indonesia.com',
    retentionTitle: '数据保留',
    retentionP1: '我们仅在为本隐私政策所述目的所必需的时间内保留您的个人信息，除非法律另有要求。',
    retentionP2: '我们用于确定保留期限的条件包括：',
    retentionItems: [
      '该信息是否仍是提供服务所必需的',
      '是否存在保留数据的法律义务',
      '是否存在您的删除请求'
    ],
    childrenTitle: '儿童隐私政策',
    childrenP1: '我们的服务不面向 13 岁以下的儿童。我们不会故意收集 13 岁以下儿童的个人信息。如果我们发现我们在未验证家长同意的情况下收集了 13 岁以下儿童的个人信息，我们将采取步骤尽快删除该信息。',
    childrenP2: '如果您是家长或监护人，并且您知道您的孩子已向我们提供了个人信息，请与我们联系，以便我们采取必要行动。',
    changesTitle: '隐私政策的变更',
    changesP1: '我们可能会不时更新我们的隐私政策。我们将通过在此页面上发布新的隐私政策来通知您任何变更。',
    changesP2: '我们建议您定期查看本隐私政策以获取任何变更。本隐私政策的变更自发布在此页面之日起生效。',
    contactTitle: '联系我们',
    contactDesc: '如果您对本隐私政策有任何疑问，请联系我们：',
    emailLabel: '电子邮箱',
    addressLabel: '地址',
    addressDesc: 'Perum Puri Cikarang Hijau, 勿加泗, 西爪哇 17530, 印度尼西亚'
  },
  ja: {
    title: 'プライバシーポリシー',
    lastUpdated: '最終更新日：2026年6月23日',
    introTitle: 'はじめに',
    introP1: 'Meteorit Indonesiaでは、お客様のプライバシーを尊重し、個人情報の保護に努めています。本プライバシーポリシーは、お客様が当ウェブサイトを使用する際、当方がお客様の情報をどのように収集、使用、開示、および保護するかについて説明するものです。',
    introP2: '当ウェブサイトを使用することにより、お客様は本プライバシーポリシーに従った情報の収集および使用に同意したものとみなされます。',
    collectTitle: '収集する情報',
    collectP1Title: '1. 個人情報',
    collectP1Desc: '当方は、以下の場合にお客様が自主的に提供する個人情報を収集することがあります。',
    collectP1Items: [
      'アカウント作成（氏名、メールアドレスなど）',
      'フォーラムへの参加（投稿、コメント）',
      'お問い合わせフォームによるメッセージ送信',
      '寄付の実施（支払い情報）',
      'ニュースレターの購読（メールアドレス）'
    ],
    collectP2Title: '2. 非個人情報',
    collectP2Desc: '当方は、以下のような非個人情報を自動的に収集します。',
    collectP2Items: [
      'IP アドレスおよびブラウザ情報',
      '閲覧したページおよび訪問時間',
      'デバイス情報（タイプ、OSなど）',
      'ウェブサイト使用状況分析データ'
    ],
    collectP3Title: '3. クッキーおよび追跡技術',
    collectP3Desc: '当方は、以下を目的としてクッキーおよび同様の技術を使用します。',
    collectP3Items: [
      'ユーザー体験の向上',
      'ウェブサイト使用状況の分析',
      'ユーザー設定の保存',
      '関連性の高い広告の提示'
    ],
    collectP3Note: 'ブラウザ設定によりクッキーを無効にすることができますが、これによりウェブサイトの機能の一部が影響を受ける場合があります。',
    useTitle: '情報の使用方法',
    useDesc: '当方は、収集した情報を以下の目的で使用します。',
    useItems: [
      '当サービスの提供および維持',
      'ユーザー体験の向上',
      'お客様との通信（メール、通知）',
      '寄付取引の処理',
      'ウェブサイト使用状況の分析',
      '不正行為および悪用の防止',
      '法的義務の遵守'
    ],
    protectTitle: '情報の保護方法',
    protectDesc: '当方は、お客様の個人情報を不正アクセス、改ざん、開示、または破壊から保護するため、以下を含む合理的なセキュリティ対策を実施しています。',
    protectItems: [
      '機密データの暗号化',
      '厳格なアクセス制御',
      '定期的なセキュリティ監視',
      '定期的なセキュリティアップデート'
    ],
    protectNote: 'お客様の情報の保護に努めておりますが、インターネット上の送信方法または電子保管方法は100%安全ではありません。絶対的なセキュリティを保証することはできません。',
    shareTitle: '第三者との情報共有',
    shareDesc: '当方は、お客様の個人情報を第三者に販売または賃貸することはありません。ただし、以下の場合に情報を共有することがあります。',
    shareItems: [
      'サービスプロバイダー：ウェブサイトの運営を支援する第三者（ホスティング、分析、決済）',
      '法的義務：法律で要求される場合、または当方の権利を保護する場合',
      '事業取引：合併、買収、または資産売却の場合'
    ],
    shareNote: '必要最低限の情報のみを共有し、これらの第三者が厳格なプライバシー基準を遵守することを保証します。',
    rightsTitle: 'お客様の権利',
    rightsDesc: 'お客様は、ご自身の個人情報に関して以下の権利を有します。',
    rightsItems: [
      'アクセス：保存されている個人情報のコピーの請求',
      '訂正：不正確な情報の訂正の請求',
      '消去：特定の条件下での情報の削除の請求',
      '異議立て：特定の条件下での情報の処理に対する異議申し立て',
      'データ移行：他のサービスへの情報の移行の請求'
    ],
    rightsNote: '権利を行使するには、メール（privacy@meteorit-indonesia.com）にてご連絡ください。',
    retentionTitle: 'データ保持',
    retentionP1: '当方は、本プライバシーポリシーに定める目的のために必要な期間に限り、お客様の個人情報を保持します（法律で義務付けられている場合を除く）。',
    retentionP2: '保持期間を決定するために使用する基準には以下が含まれます。',
    retentionItems: [
      'サービスを提供するために情報が引き続き必要であるか',
      'データを保持する法的義務があるか',
      'お客様からの削除請求があるか'
    ],
    childrenTitle: '児童のプライバシーポリシー',
    childrenP1: '当サービスは13歳未満の児童を対象としていません。当方は、13歳未満の児童から意図的に個人情報を収集することはありません。親の同意の確認なしに13歳未満の児童から個人情報を収集したことが判明した場合、できるだけ速やかにその情報を削除する措置を講じます。',
    childrenP2: '保護者の方で、お子様が個人情報を提供したことに気付かれた場合は、必要な措置を講じますのでご連絡ください。',
    changesTitle: 'プライバシーポリシーの変更',
    changesP1: '当方は、プライバシーポリシーを随時更新することがあります。変更があった場合は、このページに新しいプライバシーポリシーを掲載することにより通知します。',
    changesP2: 'プライバシーポリシーに変更がないか定期的に確認することをお勧めします。本プライバシーポリシーの変更は、このページに掲載された時点から有効になります。',
    contactTitle: 'お問い合わせ',
    contactDesc: '本プライバシーポリシーに関するご質問がある場合は、ご連絡ください。',
    emailLabel: 'メールアドレス',
    addressLabel: '住所',
    addressDesc: 'Perum Puri Cikarang Hijau, ブカシ, 西ジャワ 17530, インドネシア'
  }
};

export const kebijakanPrivasiText: Record<SiteLanguage, KebijakanPrivasiTranslation> = {
  ...kebijakanPrivasiTextBase,
  ru: kebijakanPrivasiTextRu,
  fr: kebijakanPrivasiTextFr
};
