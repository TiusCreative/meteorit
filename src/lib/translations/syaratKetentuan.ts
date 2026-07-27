import { syaratKetentuanTextRu } from './syaratKetentuanRu';
import { syaratKetentuanTextFr } from './syaratKetentuanFr';
import type { SiteLanguage } from '../i18n';

export type SyaratKetentuanTranslation = {
  title: string;
  lastUpdated: string;
  licensingTitle: string;
  licensingDesc: string;
  nasaApiTitle: string;
  nasaApiItems: string[];
  spacedevsTitle: string;
  spacedevsItems: string[];
  opennotifyTitle: string;
  opennotifyItems: string[];
  stellariumTitle: string;
  stellariumItems: string[];
  licensingNote: string;
  introTitle: string;
  introP1: string;
  introP2: string;
  useTitle: string;
  eligibilityTitle: string;
  eligibilityDesc: string;
  accountTitle: string;
  accountDesc: string;
  contentTitle: string;
  contentDesc: string;
  contentItems: string[];
  rightsTitle: string;
  rightsDesc: string;
  intellectualTitle: string;
  intellectualP1: string;
  intellectualP2: string;
  intellectualItems: string[];
  forumTitle: string;
  forumDesc: string;
  forumItems: string[];
  donationTitle: string;
  donationDesc: string;
  premiumDesc: string;
  liabilityTitle: string;
  liabilityDesc: string;
  liabilityItems: string[];
  contactTitle: string;
  contactDesc: string;
};

const syaratKetentuanTextBase = {
  id: {
    title: 'Syarat & Ketentuan',
    lastUpdated: 'Terakhir diperbarui: 25 Juni 2026',
    licensingTitle: 'Lisensi & Atribusi Data NASA dan Pihak Ketiga',
    licensingDesc: 'Website ini menggunakan data dari lembaga antariksa resmi dan penyedia API publik. Semua data digunakan sesuai ketentuan lisensi masing-masing penyedia:',
    nasaApiTitle: '🌌 NASA Open APIs (api.nasa.gov)',
    nasaApiItems: [
      'APOD (Astronomy Picture of the Day): Gambar bebas digunakan untuk tujuan edukasi dan non-komersial. Hak cipta fotografer ditampilkan sesuai ketentuan NASA.',
      'NASA EPIC: Foto Bumi dari satelit DSCOVR dalam domain publik (Public Domain) sesuai kebijakan NASA.',
      'NASA NeoWs: Data Near Earth Objects tersedia untuk penggunaan bebas sesuai syarat API NASA.',
      'Semua data NASA digunakan sesuai kebijakan penggunaan NASA.'
    ],
    spacedevsTitle: '🚀 The Space Devs — Launch Library 2',
    spacedevsItems: [
      'Data jadwal peluncuran roket diperoleh dari The Space Devs Launch Library 2 API.',
      'Digunakan sesuai ketentuan The Space Devs untuk penggunaan non-komersial dan edukasi.'
    ],
    opennotifyTitle: '🛰️ Open Notify API',
    opennotifyItems: [
      'Data posisi ISS real-time dan daftar astronot diperoleh dari Open Notify.',
      'API ini bersifat open dan bebas digunakan untuk tujuan edukasi dan non-komersial.'
    ],
    stellariumTitle: '🌠 Stellarium Web',
    stellariumItems: [
      'Fitur Langit Malam menggunakan embed dari Stellarium Web yang berlisensi open-source (GNU GPLv2+).'
    ],
    licensingNote: 'Catatan: Meteorit Indonesia bukan afiliasi resmi NASA, The Space Devs, atau Open Notify. Data disajikan untuk tujuan edukasi dan literasi sains bagi masyarakat Indonesia.',
    introTitle: 'Pendahuluan',
    introP1: 'Selamat datang di Meteorit Indonesia. Dengan mengakses dan menggunakan website kami, Anda setuju untuk terikat oleh syarat dan ketentuan berikut. Jika Anda tidak setuju dengan syarat dan ketentuan ini, harap tidak menggunakan website kami.',
    introP2: 'Syarat dan ketentuan ini dapat berubah kapan saja tanpa pemberitahuan sebelumnya. Penggunaan Anda yang berkelanjutan terhadap website setelah perubahan tersebut berarti Anda menerima perubahan tersebut.',
    useTitle: 'Penggunaan Website',
    eligibilityTitle: '1. Kelayakan',
    eligibilityDesc: 'Anda harus berusia minimal 13 tahun untuk menggunakan layanan kami. Jika Anda berusia di bawah 18 tahun, Anda harus mendapatkan izin dari orang tua atau wali.',
    accountTitle: '2. Akun Pengguna',
    accountDesc: 'Untuk mengakses fitur tertentu, Anda mungkin perlu membuat akun. Anda bertanggung jawab untuk menjaga kerahasiaan informasi akun Anda dan semua aktivitas yang terjadi di bawah akun Anda.',
    contentTitle: '3. Konten Pengguna',
    contentDesc: 'Anda bertanggung jawab penuh atas konten yang Anda unggah atau bagikan. Anda setuju untuk tidak mengunggah konten yang:',
    contentItems: [
      'Melanggar hukum atau peraturan yang berlaku',
      'Mengandung materi yang menyinggung, cabul, atau kekerasan',
      'Melanggar hak kekayaan intelektual orang lain',
      'Mengandung virus atau malware',
      'Digunakan untuk spam atau iklan yang tidak diinginkan'
    ],
    rightsTitle: '4. Hak Kami',
    rightsDesc: 'Kami berhak untuk menghapus konten atau menonaktifkan akun yang melanggar syarat dan ketentuan ini tanpa pemberitahuan sebelumnya.',
    intellectualTitle: 'Hak Kekayaan Intelektual',
    intellectualP1: 'Semua konten di website Meteorit Indonesia yang dibuat secara original, termasuk teks editorial, logo, dan desain website, adalah properti kami atau dilisensikan kepada kami dan dilindungi oleh hukum hak cipta.',
    intellectualP2: 'Data dari NASA dan pihak ketiga digunakan sesuai lisensi masing-masing (lihat bagian Lisensi & Atribusi di atas). Anda tidak diperbolehkan untuk:',
    intellectualItems: [
      'Menggunakan konten original kami untuk tujuan komersial tanpa izin tertulis',
      'Mengubah atau mendistribusikan konten original kami tanpa izin',
      'Menggunakan logo atau merek dagang kami tanpa izin'
    ],
    forumTitle: 'Forum Komunitas',
    forumDesc: 'Dengan berpartisipasi di forum komunitas kami, Anda setuju untuk:',
    forumItems: [
      'Menghormati pendapat dan privasi anggota lain',
      'Tidak mengunggah konten yang melanggar hukum atau menyinggung',
      'Tidak melakukan spam atau promosi yang tidak relevan',
      'Tidak menggunakan bahasa kasar atau menghina',
      'Mematuhi semua aturan forum yang ditetapkan oleh admin'
    ],
    donationTitle: 'Donasi dan Langganan',
    donationDesc: 'Donasi yang Anda berikan adalah sukarela dan tidak dapat dikembalikan. Dengan berdonasi, Anda membantu kami mempertahankan dan mengembangkan layanan kami.',
    premiumDesc: 'Untuk langganan premium, pembayaran akan diproses melalui sistem pembayaran yang aman. Langganan dapat dibatalkan kapan saja, tetapi tidak ada pengembalian dana untuk periode yang sudah berlalu.',
    liabilityTitle: 'Pembatasan Tanggung Jawab',
    liabilityDesc: 'Meteorit Indonesia tidak bertanggung jawab atas:',
    liabilityItems: [
      'Kerugian atau kerusakan yang timbul dari penggunaan website kami',
      'Konten yang diunggah oleh pengguna lain',
      'Kesalahan atau ketidakakuratan dalam data pihak ketiga (NASA, dll.)',
      'Gangguan atau kegagalan teknis pada layanan kami atau API pihak ketiga'
    ],
    contactTitle: 'Hubungi Kami',
    contactDesc: 'Jika Anda memiliki pertanyaan tentang syarat dan ketentuan ini, silakan hubungi kami melalui Email atau Telegram.'
  },
  en: {
    title: 'Terms & Conditions',
    lastUpdated: 'Last updated: June 25, 2026',
    licensingTitle: 'NASA and Third-Party Data Licensing & Attribution',
    licensingDesc: 'This website utilizes data from official space agencies and public API providers. All data is used in accordance with the license terms of each respective provider:',
    nasaApiTitle: '🌌 NASA Open APIs (api.nasa.gov)',
    nasaApiItems: [
      'APOD (Astronomy Picture of the Day): Images are free to use for educational and non-commercial purposes. Photographer copyright is shown according to NASA parameters.',
      'NASA EPIC: Earth images from the DSCOVR satellite are in the public domain (Public Domain) according to NASA policy.',
      'NASA NeoWs: Near Earth Objects data is available for free use under NASA API terms.',
      'All NASA data is used in accordance with the NASA usage policy.'
    ],
    spacedevsTitle: '🚀 The Space Devs — Launch Library 2',
    spacedevsItems: [
      'Rocket launch schedule data is obtained from The Space Devs Launch Library 2 API.',
      'Used in accordance with The Space Devs terms for non-commercial and educational use.'
    ],
    opennotifyTitle: '🛰️ Open Notify API',
    opennotifyItems: [
      'Real-time ISS position data and astronaut lists are obtained from Open Notify.',
      'This API is open and free to use for educational and non-commercial purposes.'
    ],
    stellariumTitle: '🌠 Stellarium Web',
    stellariumItems: [
      'The Night Sky feature uses an embed from Stellarium Web licensed under open-source (GNU GPLv2+).'
    ],
    licensingNote: 'Note: Meteorit Indonesia is not an official affiliate of NASA, The Space Devs, or Open Notify. Data is presented for educational and scientific literacy purposes for the public.',
    introTitle: 'Introduction',
    introP1: 'Welcome to Meteorit Indonesia. By accessing and using our website, you agree to be bound by the following terms and conditions. If you do not agree with these terms and conditions, please do not use our website.',
    introP2: 'These terms and conditions may change at any time without prior notice. Your continued use of the website after such changes signifies your acceptance of those changes.',
    useTitle: 'Website Use',
    eligibilityTitle: '1. Eligibility',
    eligibilityDesc: 'You must be at least 13 years old to use our service. If you are under 18 years old, you must obtain permission from a parent or guardian.',
    accountTitle: '2. User Account',
    accountDesc: 'To access certain features, you may need to create an account. You are responsible for maintaining the confidentiality of your account information and all activities that occur under your account.',
    contentTitle: '3. User Content',
    contentDesc: 'You are fully responsible for the content you upload or share. You agree not to upload content that:',
    contentItems: [
      'Violates applicable laws or regulations',
      'Contains offensive, obscene, or violent material',
      'Infringes the intellectual property rights of others',
      'Contains viruses or malware',
      'Is used for spam or unsolicited advertising'
    ],
    rightsTitle: '4. Our Rights',
    rightsDesc: 'We reserve the right to remove content or disable accounts that violate these terms and conditions without prior notice.',
    intellectualTitle: 'Intellectual Property Rights',
    intellectualP1: 'All original content created on the Meteorit Indonesia website, including editorial text, logos, and website design, is our property or licensed to us and protected by copyright laws.',
    intellectualP2: 'Data from NASA and third parties is used under their respective licenses (see the Licensing & Attribution section above). You are not permitted to:',
    intellectualItems: [
      'Use our original content for commercial purposes without written permission',
      'Modify or distribute our original content without permission',
      'Use our logo or trademark without permission'
    ],
    forumTitle: 'Community Forum',
    forumDesc: 'By participating in our community forum, you agree to:',
    forumItems: [
      'Respect the opinions and privacy of other members',
      'Not upload illegal or offensive content',
      'Not spam or post irrelevant promotions',
      'Not use harsh or insulting language',
      'Comply with all forum rules set by the admin'
    ],
    donationTitle: 'Donations and Subscriptions',
    donationDesc: 'Donations you make are voluntary and non-refundable. By donating, you help us maintain and develop our services.',
    premiumDesc: 'For premium subscriptions, payment will be processed through a secure payment system. Subscriptions can be canceled at any time, but there are no refunds for past periods.',
    liabilityTitle: 'Limitation of Liability',
    liabilityDesc: 'Meteorit Indonesia is not responsible for:',
    liabilityItems: [
      'Losses or damages arising from the use of our website',
      'Content uploaded by other users',
      'Errors or inaccuracies in third-party data (NASA, etc.)',
      'Technical disruptions or failures of our services or third-party APIs'
    ],
    contactTitle: 'Contact Us',
    contactDesc: 'If you have any questions about these terms and conditions, please contact us via Email or Telegram.'
  },
  ms: {
    title: 'Syarat & Ketentuan',
    lastUpdated: 'Terakhir dikemas kini: 25 Jun 2026',
    licensingTitle: 'Pelesenan & Atribusi Data NASA dan Pihak Ketiga',
    licensingDesc: 'Laman web ini menggunakan data dari agensi angkasa rasmi dan penyedia API awam. Semua data digunakan mengikut terma lesen setiap penyedia masing-masing:',
    nasaApiTitle: '🌌 NASA Open APIs (api.nasa.gov)',
    nasaApiItems: [
      'APOD (Astronomy Picture of the Day): Imej bebas digunakan untuk tujuan pendidikan dan bukan komersial. Hak cipta jurugambar dipaparkan mengikut terma NASA.',
      'NASA EPIC: Foto Bumi dari satelit DSCOVR dalam domain awam (Public Domain) mengikut dasar NASA.',
      'NASA NeoWs: Data Near Earth Objects tersedia untuk penggunaan bebas mengikut syarat API NASA.',
      'Semua data NASA digunakan mengikut dasar penggunaan NASA.'
    ],
    spacedevsTitle: '🚀 The Space Devs — Launch Library 2',
    spacedevsItems: [
      'Data jadual pelancaran roket diperoleh dari The Space Devs Launch Library 2 API.',
      'Digunakan mengikut ketentuan The Space Devs untuk penggunaan bukan komersial dan pendidikan.'
    ],
    opennotifyTitle: '🛰️ Open Notify API',
    opennotifyItems: [
      'Data posisi ISS real-time dan senarai angkasawan diperoleh dari Open Notify.',
      'API ini bersifat terbuka dan bebas digunakan untuk tujuan pendidikan dan bukan komersial.'
    ],
    stellariumTitle: '🌠 Stellarium Web',
    stellariumItems: [
      'Ciri Langit Malam menggunakan embed dari Stellarium Web yang berlesen sumber terbuka (GNU GPLv2+).'
    ],
    licensingNote: 'Nota: Meteorit Indonesia bukan sekutu rasmi NASA, The Space Devs, atau Open Notify. Data disajikan untuk tujuan pendidikan dan literasi sains bagi masyarakat umum.',
    introTitle: 'Pendahuluan',
    introP1: 'Selamat datang ke Meteorit Indonesia. Dengan mengakses dan menggunakan laman web kami, anda bersetuju untuk terikat dengan syarat dan ketentuan berikut. Jika anda tidak bersetuju dengan syarat dan ketentuan ini, sila jangan gunakan laman web kami.',
    introP2: 'Syarat dan ketentuan ini boleh berubah pada bila-bila masa tanpa pemberitahuan terlebih dahulu. Penggunaan berterusan anda terhadap laman web selepas perubahan tersebut bermakna anda menerima perubahan tersebut.',
    useTitle: 'Penggunaan Laman Web',
    eligibilityTitle: '1. Kelayakan',
    eligibilityDesc: 'Anda mesti berumur sekurang-kurangnya 13 tahun untuk menggunakan perkhidmatan kami. Jika anda berumur di bawah 18 tahun, anda mesti mendapatkan kebenaran daripada ibu bapa atau penjaga.',
    accountTitle: '2. Akaun Pengguna',
    accountDesc: 'Untuk mengakses ciri tertentu, anda mungkin perlu membuat akaun. Anda bertanggungjawab untuk menjaga kerahsiaan maklumat akaun anda dan semua aktiviti yang berlaku di bawah akaun anda.',
    contentTitle: '3. Kandungan Pengguna',
    contentDesc: 'Anda bertanggungjawab sepenuhnya ke atas kandungan yang anda muat naik atau kongsi. Anda bersetuju untuk tidak memuat naik kandungan yang:',
    contentItems: [
      'Melanggar undang-undang atau peraturan yang berlaku',
      'Mengandungi bahan yang menyinggung, lucah, atau ganas',
      'Melanggar hak harta intelek orang lain',
      'Mengandungi virus atau malware',
      'Digunakan untuk spam atau iklan yang tidak diingini'
    ],
    rightsTitle: '4. Hak Kami',
    rightsDesc: 'Kami berhak untuk memadam kandungan atau menyahaktifkan akaun yang melanggar syarat dan ketentuan ini tanpa pemberitahuan terlebih dahulu.',
    intellectualTitle: 'Hak Harta Intelek',
    intellectualP1: 'Semua kandungan asli di laman web Meteorit Indonesia, termasuk teks editorial, logo, dan reka bentuk laman web, adalah hak milik kami atau dilesenkan kepada kami dan dilindungi oleh undang-undang hak cipta.',
    intellectualP2: 'Data dari NASA dan pihak ketiga digunakan di bawah lesen masing-masing (lihat bahagian Pelesenan & Atribusi di atas). Anda tidak dibenarkan untuk:',
    intellectualItems: [
      'Menggunakan kandungan asli kami untuk tujuan komersial tanpa kebenaran bertulis',
      'Mengubah atau mengedarkan kandungan asli kami tanpa kebenaran',
      'Menggunakan logo atau tanda dagangan kami tanpa kebenaran'
    ],
    forumTitle: 'Forum Komuniti',
    forumDesc: 'Dengan mengambil bahagian di forum komuniti kami, anda bersetuju untuk:',
    forumItems: [
      'Menghormati pendapat dan privasi ahli lain',
      'Tidak memuat naik kandungan yang melanggar undang-undang atau menyinggung',
      'Tidak melakukan spam atau promosi yang tidak relevan',
      'Tidak menggunakan bahasa kasar atau menghina',
      'Mematuhi semua peraturan forum yang ditetapkan oleh admin'
    ],
    donationTitle: 'Derma dan Langganan',
    donationDesc: 'Derma yang anda berikan adalah sukarela dan tidak boleh dikembalikan. Dengan menderma, anda membantu kami mengekalkan dan mengembangkan perkhidmatan kami.',
    premiumDesc: 'Untuk langganan premium, pembayaran akan diproses melalui sistem pembayaran yang selamat. Langganan boleh dibatalkan pada bila-bila masa, tetapi tiada bayaran balik untuk tempoh yang telah berlalu.',
    liabilityTitle: 'Had Liabiliti',
    liabilityDesc: 'Meteorit Indonesia tidak bertanggungjawab terhadap:',
    liabilityItems: [
      'Kerugian atau kerosakan yang timbul daripada penggunaan laman web kami',
      'Kandungan yang dimuat naik oleh pengguna lain',
      'Kesilapan atau ketidaktepatan dalam data pihak ketiga (NASA, dll.)',
      'Gangguan atau kegagalan teknikal pada perkhidmatan kami atau API pihak ketiga'
    ],
    contactTitle: 'Hubungi Kami',
    contactDesc: 'Jika anda mempunyai sebarang soalan tentang syarat dan ketentuan ini, sila hubungi kami melalui E-mel atau Telegram.'
  },
  zh: {
    title: '条款与条件',
    lastUpdated: '最后更新：2026年6月25日',
    licensingTitle: 'NASA 及第三方数据许可与署名',
    licensingDesc: '本网站使用来自官方航天机构和公共 API 提供商的数据。所有数据均根据各提供商的许可条款使用：',
    nasaApiTitle: '🌌 NASA 开放 API (api.nasa.gov)',
    nasaApiItems: [
      'APOD (每日天文图): 图像可免费用于教育和非商业目的。摄影师版权根据 NASA 规定显示。',
      'NASA EPIC: 根据 NASA 政策，来自 DSCOVR 卫星的地球图像属于公共领域 (Public Domain)。',
      'NASA NeoWs: 近地天体数据可根据 NASA API 条款免费使用。',
      '所有 NASA 数据均根据 NASA 使用政策使用。'
    ],
    spacedevsTitle: '🚀 The Space Devs — Launch Library 2',
    spacedevsItems: [
      '火箭发射计划数据获取自 The Space Devs Launch Library 2 API。',
      '根据 The Space Devs 条款用于非商业和教育目的。'
    ],
    opennotifyTitle: '🛰️ Open Notify API',
    opennotifyItems: [
      '实时 ISS 位置数据和宇航员列表获取自 Open Notify。',
      '此 API 开放且可免费用于教育和非商业目的。'
    ],
    stellariumTitle: '🌠 Stellarium Web',
    stellariumItems: [
      '夜空功能使用源自 Stellarium Web 的嵌入，该软件根据开源协议 (GNU GPLv2+) 授权。'
    ],
    licensingNote: '注意：Meteorit Indonesia 不是 NASA、The Space Devs 或 Open Notify 的官方分支机构。数据呈现仅用于公众教育和科学素养目的。',
    introTitle: '前言',
    introP1: '欢迎来到 Meteorit Indonesia。通过访问和使用我们的网站，您同意受以下条款和条件的约束。如果您不同意这些条款和条件，请不要使用我们的网站。',
    introP2: '这些条款和条件可能会随时更改，恕不另行通知。您在更改后继续使用网站即表示您接受这些更改。',
    useTitle: '网站使用',
    eligibilityTitle: '1. 资格',
    eligibilityDesc: '您必须年满 13 周岁才能使用我们的服务。如果您未满 18 周岁，则必须获得父母或监护人的许可。',
    accountTitle: '2. 用户账户',
    accountDesc: '要访问某些功能，您可能需要创建一个账户。您有责任维护账户信息的机密性以及在您账户下发生的所有活动。',
    contentTitle: '3. 用户内容',
    contentDesc: '您对您上传或分享的内容负全部责任。您同意不上传以下内容：',
    contentItems: [
      '违反适用法律或法规',
      '包含侮辱性、淫秽或暴力内容',
      '侵犯他人的知识产权',
      '包含病毒或恶意软件',
      '用于垃圾邮件或未经请求的广告'
    ],
    rightsTitle: '4. 我们的权利',
    rightsDesc: '我们保留在不事先通知的情况下删除违反这些条款和内容的用户内容或停用账户的权利。',
    intellectualTitle: '知识产权',
    intellectualP1: '在 Meteorit Indonesia 网站上创建的所有原创内容，包括编辑文本、徽标和网站设计，均为我们的财产或授权给我们，并受版权法保护。',
    intellectualP2: '来自 NASA 和第三方的数据在各自的许可下使用（参见上面的许可与署名部分）。您不得：',
    intellectualItems: [
      '未经书面许可，将我们的原创内容用于商业目的',
      '未经许可修改或分发我们的原创内容',
      '未经许可使用我们的徽标或商标'
    ],
    forumTitle: '社区论坛',
    forumDesc: '参与我们的社区论坛即表示您同意：',
    forumItems: [
      '尊重其他成员的意见和隐私',
      '不上传违法或侮辱性内容',
      '不发送垃圾邮件或发布不相关的广告促销',
      '不使用粗俗或侮辱性语言',
      '遵守管理员制定的所有论坛规则'
    ],
    donationTitle: '捐助与订阅',
    donationDesc: '您的捐助是自愿的，且不可退还。通过捐助，您帮助我们维护和开发我们的服务。',
    premiumDesc: '对于尊享订阅，付款将通过安全的付款系统进行处理。订阅可以随时取消，但过去的时段概不退款。',
    liabilityTitle: '责任限制',
    liabilityDesc: 'Meteorit Indonesia 不对以下情况负责：',
    liabilityItems: [
      '因使用我们网站而引起的损失或损害',
      '其他用户上传的内容',
      '第三方数据中的错误或不准确（NASA等）',
      '我们的服务或第三方 API 的技术中断或故障'
    ],
    contactTitle: '联系我们',
    contactDesc: '如果您对这些条款和条件有任何疑问，请通过电子邮件或 Telegram 与我们联系。'
  },
  ja: {
    title: '利用規約',
    lastUpdated: '最終更新日：2026年6月25日',
    licensingTitle: 'NASAおよびサードパーティデータのライセンスと帰属',
    licensingDesc: '本ウェブサイトは、公式の宇宙機関および公開APIプロバイダーからのデータを使用しています。すべてのデータは、各プロバイダーのライセンス条項に従って使用されています。',
    nasaApiTitle: '🌌 NASA Open APIs (api.nasa.gov)',
    nasaApiItems: [
      'APOD (Today\'s Astronomy Picture): 画像は教育および非商業目的で自由に使用できます。写真家の著作権はNASAの規定に従って表示されます。',
      'NASA EPIC: DSCOVR衛星からの地球の写真は、NASAのポリシーに従ってパブリックドメイン（Public Domain）に属します。',
      'NASA NeoWs: 近地天体データは、NASA APIの条件に従って自由に使用できます。',
      'すべてのNASAデータは、NASAの使用ポリシーに従って使用されています。'
    ],
    spacedevsTitle: '🚀 The Space Devs — Launch Library 2',
    spacedevsItems: [
      'ロケットの打ち上げスケジュールデータは、The Space Devs Launch Library 2 APIから取得しています。',
      '非商業および教育目的での使用に関するThe Space Devsの規定に従って使用されています。'
    ],
    opennotifyTitle: '🛰️ Open Notify API',
    opennotifyItems: [
      'リアルタイムのISS位置データと宇宙飛行士のリストは、Open Notifyから取得しています。',
      'このAPIはオープンであり、教育および非商業目的で自由に使用できます。'
    ],
    stellariumTitle: '🌠 Stellarium Web',
    stellariumItems: [
      '夜空機能は、オープンソース（GNU GPLv2+）ライセンスに基づくStellarium Webの埋め込みを使用しています。'
    ],
    licensingNote: '注意：Meteorit IndonesiaはNASA、The Space Devs、またはOpen Notifyの公式提携機関ではありません。データは一般への教育および科学リテラシーの目的で提示されています。',
    introTitle: 'はじめに',
    introP1: 'Meteorit Indonesiaへようこそ。当ウェブサイトにアクセスして使用することにより、以下の利用規約に拘束されることに同意したことになります。これらの利用規約に同意しない場合は、当ウェブサイトを使用しないでください。',
    introP2: 'これらの利用規約は、事前の通知なしにいつでも変更される場合があります。変更後もウェブサイトの使用を継続することにより、変更を受け入れたものとみなされます。',
    useTitle: 'ウェブサイトの使用',
    eligibilityTitle: '1. 資格',
    eligibilityDesc: '当サービスを利用するには、13歳以上である必要があります。18歳未満の場合は、親または保護者の許可を得る必要があります。',
    accountTitle: '2. ユーザーアカウント',
    accountDesc: '特定の機能にアクセスするには、アカウントを作成する必要がある場合があります。アカウント情報の機密性の維持、およびアカウントの下で行われるすべての活動に対する責任はユーザー自身にあります。',
    contentTitle: '3. ユーザーコンテンツ',
    contentDesc: 'ユーザー自身がアップロードまたは共有するコンテンツについて、すべての責任を負います。以下のようなコンテンツをアップロードしないことに同意するものとします。',
    contentItems: [
      '適用される法律または規制に違反するもの',
      '侮辱的、わいせつ、または暴力的な内容を含むもの',
      '他人の知的財産権を侵害するもの',
      'ウイルスやマルウェアを含むもの',
      'スパムや迷惑広告に使用されるもの'
    ],
    rightsTitle: '4. 当方の権利',
    rightsDesc: '当方は事前の通知なしに、これらの利用規約に違反するコンテンツの削除、またはアカウントを無効にする権利を留保します。',
    intellectualTitle: '知的財産権',
    intellectualP1: '編集テキスト、ロゴ、ウェブサイトのデザインを含め、Meteorit Indonesiaウェブサイト上で作成されたすべてのオリジナルコンテンツは、当方の財産またはライセンス供与されたものであり、著作権法によって保護されています。',
    intellectualP2: 'NASAおよびサードパーティからのデータは、それぞれのライセンスに基づいて使用されます（上記のライセンスと帰属のセクションを参照）。以下を行うことは許可されません。',
    intellectualItems: [
      '書面による許可なしに、商業目的で当方のオリジナルコンテンツを使用すること',
      '許可なしに当方のオリジナルコンテンツを変更または配布すること',
      '許可なしに当方のロゴまたは商標を使用すること'
    ],
    forumTitle: 'コミュニティフォーラム',
    forumDesc: '当コミュニティフォーラムに参加することにより、以下に同意するものとします。',
    forumItems: [
      '他のメンバーの意見とプライバシーを尊重すること',
      '違法または侮辱的なコンテンツをアップロードしないこと',
      'スパムや無関係な宣伝を送信しないこと',
      '乱暴な言葉や侮辱的な言葉を使用しないこと',
      '管理者が定めるすべてのフォーラム規則に従うこと'
    ],
    donationTitle: '寄付と購読',
    donationDesc: 'ご支援は自発的なものであり、返金はできません。寄付をすることにより、当サービスの維持および開発を支援することになります。',
    premiumDesc: 'プレミアム購読の場合、支払いは安全な支払いシステムを通じて処理されます。購読はいつでも解約できますが、過去の期間に対する返金はありません。',
    liabilityTitle: '免責事項',
    liabilityDesc: 'Meteorit Indonesiaは、以下について責任を負いません。',
    liabilityItems: [
      '当ウェブサイトの使用から生じる損失または損害',
      '他のユーザーによってアップロードされたコンテンツ',
      'サードパーティデータ（NASAなど）の誤りまたは不正確さ',
      '当方のサービスまたはサードパーティAPIの技術的な中断または障害'
    ],
    contactTitle: 'お問い合わせ',
    contactDesc: 'これらの利用規約についてご質問がある場合は、メールまたはTelegramにてお問い合わせください。'
  }
};

export const syaratKetentuanText: Record<SiteLanguage, SyaratKetentuanTranslation> = {
  ...syaratKetentuanTextBase,
  ru: syaratKetentuanTextRu,
  fr: syaratKetentuanTextFr
};
