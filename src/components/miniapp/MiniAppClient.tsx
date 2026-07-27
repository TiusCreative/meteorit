"use client";

import { useEffect, useState, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Script from 'next/script';
import { useTheme } from 'next-themes';
import { 
  Radio, 
  Image as ImageIcon, 
  BookOpen, 
  Camera, 
  Calculator, 
  FileText, 
  Heart, 
  Search, 
  Filter, 
  Compass, 
  MapPin, 
  Download, 
  Share2, 
  RefreshCw, 
  X, 
  ChevronRight, 
  User, 
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  Bell,
  Home
} from 'lucide-react';

import NeoTracker from '../monitoring/NeoTracker';
import FireballFeed from '../monitoring/FireballFeed';
import SpaceWeather from '../monitoring/SpaceWeather';
import MarsGallery from '../monitoring/MarsGallery';
import EpicEarth from '../monitoring/EpicEarth';

import { useSiteLanguage } from '@/lib/useSiteLanguage';
import { SiteLanguage, languageOptions } from '@/lib/i18n';

// Import ISSMap dynamically to bypass SSR
const ISSMap = dynamic(() => import('../ISSMap'), { ssr: false, loading: () => (
  <div className="w-full h-48 bg-slate-950/80 rounded-xl flex items-center justify-center border border-slate-800">
    <div className="w-8 h-8 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin"></div>
  </div>
)});

const tDict = {
  id: {
    loadingText: 'Memuat data sains terpadu...',
    errorTitle: 'Error Memuat Data',
    tryAgain: 'Coba Lagi',
    offlineBadge: 'OFFLINE',
    activeBadge: 'AKTIF',
    issTrackerTitle: 'Live ISS Orbit Tracker',
    latitude: 'LINTANG (LAT)',
    longitude: 'BUJUR (LON)',
    astronautsTitle: 'Astronot di Antariksa',
    astronautsSub: 'Saat ini berada di stasiun luar angkasa (ISS/Tiangong)',
    kru: 'Kru',
    spaceControl: '🚀 Space Mission Control',
    countdownDays: 'Hari',
    countdownHours: 'Jam',
    countdownMinutes: 'Menit',
    countdownSeconds: 'Detik',
    targetNet: 'Target NET',
    countingDown: 'Menghitung mundur...',
    earthquakeTitle: '🌋 Gempa Bumi Terkini (BMKG)',
    siagaMag: 'SIAGA M ≥ 5',
    magnitude: 'MAGNITUDO',
    depth: 'KEDALAMAN',
    potensi: 'POTENSI',
    locationRegion: 'LOKASI & WILAYAH',
    timeWib: 'WAKTU (WIB)',
    feltMmi: 'DIRASAKAN (MMI)',
    weatherTitle: '🌎 Live Cuaca & Angin Permukaan',
    scanWeather: '📡 Pindai Cuaca',
    scanning: 'Pindai...',
    loading: 'Memuat...',
    weatherPlaceholder: 'Cari Kota / Koordinat (contoh: Surabaya atau -7.2,112.7)',
    searchBtn: 'Cari',
    weatherCondition: 'Kondisi',
    feelsLike: 'FEELS LIKE',
    windSpeed: 'KECEPATAN ANGIN',
    humidity: 'KELEMBAPAN',
    clouds: 'TUTUPAN AWAN',
    fetchingWeather: 'Mengambil data cuaca stasiun terdekat...',
    skyAlertsTitle: 'Peringatan Langit Terbaru',
    shareBtn: 'Bagikan ke Media Sosial',
    closeBtn: 'Tutup',
    shareOverlayTitle: 'Bagikan Ke Media Sosial',
    calculatorTitle: '☄️ Kalkulator Dampak Tabrakan Meteorit',
    massLabel: 'Massa Asteroid (kg)',
    velocityLabel: 'Kecepatan Hantaman (km/s)',
    angleLabel: 'Sudut Tabrakan (derajat)',
    targetLabel: 'Jenis Target Hantaman',
    rockTarget: 'Lapisan Batuan Keras',
    soilTarget: 'Tanah Gembur / Sedimen',
    waterTarget: 'Samudra / Air Dalam',
    calculateBtn: 'Hitung Dampak Hantaman',
    calcResultTitle: 'HASIL ESTIMASI HANTAMAN',
    calcEnergy: 'ENERGI PELEPASAN',
    calcCrater: 'DIAMETER KAWAH',
    calcRisk: 'TINGKAT RISIKO',
    gpsTitle: '📡 Sistem Utilitas Lapangan & Watermark GPS',
    gpsSubtitle: 'Ambil foto batu temuan di lapangan untuk menimpa koordinat GPS, timestamp, dan kompas secara otomatis ke dalam foto sebagai bukti otentik lokasi penemuan.',
    activateCamera: 'Aktifkan Kamera',
    uploadHp: 'Unggah Foto HP',
    photoTips: '💡 Tip Seluler: Jika tombol kamera diblokir oleh sistem perizinan Telegram, Anda dapat mengeklik Unggah Foto HP lalu pilih Kamera / Ambil Foto untuk memotret langsung dengan kamera bawaan HP Anda.',
    verifyTitle: '🪨 Pengajuan Verifikasi & Kurasi Temuan',
    verifySubtitle: 'Ajukan hasil temuan batuan luar angkasa Anda untuk diverifikasi secara awal oleh tim ahli kami dan komunitas internasional.',
    nameLabel: 'Nama Lengkap Pengaju',
    emailLabel: 'Alamat Email',
    weightLabel: 'Estimasi Berat Temuan (gram)',
    locationLabel: 'Lokasi Penemuan / Koordinat',
    descLabel: 'Deskripsi Fisik & Kondisi Temuan',
    descPlaceholder: 'Sebutkan warna, sifat kemagnetan (menempel magnet atau tidak), tekstur dalam, lubang peleburan (fusion crust), dll...',
    submitBtn: 'Ajukan Data Temuan',
    verifySuccess: '✓ Pengajuan Berhasil Dikirim!',
    verifySuccessSub: 'Terima kasih! Data temuan Anda telah berhasil didaftarkan di sistem kurasi kami. Tim kurator akan meninjau dan menghubungi Anda melalui email dalam waktu 3-5 hari kerja.',
    donationTitle: 'Donasi & Keanggotaan Premium',
    donationSubtitle: 'Bantu pengembangan portal data Meteorit Indonesia! Donasi Anda membantu pembiayaan API NASA, server real-time, dan riset edukasi sains.',
    donationQris: 'Bayar Instan QRIS / Lokal (Midtrans)',
    donationPaypal: 'Pay via PayPal (USD)',
    officialName: 'NAMA RESMI',
    classification: 'KLASIFIKASI',
    massWeight: 'MASSA / BERAT',
    yearFallen: 'TAHUN JATUH',
    coordinatesFallen: 'KOORDINAT JATUH',
    eventTimeUtc: 'WAKTU PERISTIWA (UTC)',
    eventCoordinates: 'KOORDINAT KEJADIAN',
    energyExplosion: 'ENERGI LEDAKAN (TNT)',
    entryAltitude: 'KETINGGIAN MASUK',
    velocity: 'KECEPATAN',
    officialNameAstronaut: 'NAMA RESMI',
    country: 'NEGARA',
    agency: 'AGENCY',
    role: 'ROLE',
    launchDate: 'TANGGAL PELUNCURAN',
    published: 'Terbit',
  },
  en: {
    loadingText: 'Loading integrated science data...',
    errorTitle: 'Error Loading Data',
    tryAgain: 'Try Again',
    offlineBadge: 'OFFLINE',
    activeBadge: 'ACTIVE',
    issTrackerTitle: 'Live ISS Orbit Tracker',
    latitude: 'LATITUDE (LAT)',
    longitude: 'LONGITUDE (LON)',
    astronautsTitle: 'Astronauts in Space',
    astronautsSub: 'Currently aboard space stations (ISS/Tiangong)',
    kru: 'Crew',
    spaceControl: '🚀 Space Mission Control',
    countdownDays: 'Days',
    countdownHours: 'Hours',
    countdownMinutes: 'Mins',
    countdownSeconds: 'Secs',
    targetNet: 'Target NET',
    countingDown: 'Counting down...',
    earthquakeTitle: '🌋 Latest Earthquake (BMKG)',
    siagaMag: 'ALERT M ≥ 5',
    magnitude: 'MAGNITUDE',
    depth: 'DEPTH',
    potensi: 'POTENTIAL',
    locationRegion: 'LOCATION & REGION',
    timeWib: 'TIME (WIB)',
    feltMmi: 'FELT (MMI)',
    weatherTitle: '🌎 Live Weather & Surface Wind',
    scanWeather: '📡 Scan Weather',
    scanning: 'Scanning...',
    loading: 'Loading...',
    weatherPlaceholder: 'Search City / Coordinates (e.g. London or 51.5,-0.1)',
    searchBtn: 'Search',
    weatherCondition: 'Condition',
    feelsLike: 'FEELS LIKE',
    windSpeed: 'WIND SPEED',
    humidity: 'HUMIDITY',
    clouds: 'CLOUD COVER',
    fetchingWeather: 'Fetching weather data from nearest station...',
    skyAlertsTitle: 'Latest Space Alerts',
    shareBtn: 'Share to Social Media',
    closeBtn: 'Close',
    shareOverlayTitle: 'Share to Social Media',
    calculatorTitle: '☄️ Meteorite Impact Calculator',
    massLabel: 'Asteroid Mass (kg)',
    velocityLabel: 'Impact Velocity (km/s)',
    angleLabel: 'Impact Angle (degrees)',
    targetLabel: 'Impact Target Type',
    rockTarget: 'Hard Rock Layer',
    soilTarget: 'Loose Soil / Sediment',
    waterTarget: 'Ocean / Deep Water',
    calculateBtn: 'Calculate Impact',
    calcResultTitle: 'ESTIMATED IMPACT RESULTS',
    calcEnergy: 'RELEASED ENERGY',
    calcCrater: 'CRATER DIAMETER',
    calcRisk: 'RISK LEVEL',
    gpsTitle: '📡 Field Utility System & GPS Watermark',
    gpsSubtitle: 'Take a photo of the meteorite find in the field to overlay GPS coordinates, timestamp, and compass onto the photo as authentic proof.',
    activateCamera: 'Activate Camera',
    uploadHp: 'Upload Phone Photo',
    photoTips: '💡 Mobile Tip: If the camera button is blocked by Telegram permission system, click Upload Phone Photo and select Camera / Take Photo to shoot using your phone\'s native camera.',
    verifyTitle: '🪨 Verification Request & Curation',
    verifySubtitle: 'Submit your space rock find to be verified by our team of experts and the international community.',
    nameLabel: 'Full Name of Submitter',
    emailLabel: 'Email Address',
    weightLabel: 'Estimated Weight of Find (grams)',
    locationLabel: 'Find Location / Coordinates',
    descLabel: 'Physical Description & Condition',
    descPlaceholder: 'Mention color, magnetic properties (magnetic attraction), inner texture, fusion crust, etc...',
    submitBtn: 'Submit Verification Data',
    verifySuccess: '✓ Request Successfully Sent!',
    verifySuccessSub: 'Thank you! Your find data has been successfully registered. Our curation team will review and contact you via email within 3-5 business days.',
    donationTitle: 'Donation & Premium Membership',
    donationSubtitle: 'Support the development of Meteorit Indonesia! Your donation helps fund NASA APIs, real-time servers, and educational science research.',
    donationQris: 'Instant QRIS / Local (Midtrans)',
    donationPaypal: 'Pay via PayPal (USD)',
    officialName: 'OFFICIAL NAME',
    classification: 'CLASSIFICATION',
    massWeight: 'MASS / WEIGHT',
    yearFallen: 'YEAR FALLEN',
    coordinatesFallen: 'FALL COORDINATES',
    eventTimeUtc: 'EVENT TIME (UTC)',
    eventCoordinates: 'EVENT COORDINATES',
    energyExplosion: 'EXPLOSION ENERGY (TNT)',
    entryAltitude: 'ENTRY ALTITUDE',
    velocity: 'VELOCITY',
    officialNameAstronaut: 'OFFICIAL NAME',
    country: 'COUNTRY',
    agency: 'AGENCY',
    role: 'ROLE',
    launchDate: 'LAUNCH DATE',
    published: 'Published',
  },
  ms: {
    loadingText: 'Memuat data sains bersepadu...',
    errorTitle: 'Ralat Memuatkan Data',
    tryAgain: 'Cuba Lagi',
    offlineBadge: 'OFFLINE',
    activeBadge: 'AKTIF',
    issTrackerTitle: 'Penjejak Orbit ISS Langsung',
    latitude: 'LINTANG (LAT)',
    longitude: 'BUJUR (LON)',
    astronautsTitle: 'Angkasawan di Angkasa',
    astronautsSub: 'Kini berada di stesen angkasa (ISS/Tiangong)',
    kru: 'Krew',
    spaceControl: '🚀 Kawalan Misi Angkasa',
    countdownDays: 'Hari',
    countdownHours: 'Jam',
    countdownMinutes: 'Minit',
    countdownSeconds: 'Saat',
    targetNet: 'Sasaran NET',
    countingDown: 'Mengira mundur...',
    earthquakeTitle: '🌋 Gempa Bumi Terkini (BMKG)',
    siagaMag: 'SIAGA M ≥ 5',
    magnitude: 'MAGNITUDO',
    depth: 'KEDALAMAN',
    potensi: 'POTENSI',
    locationRegion: 'LOKASI & WILAYAH',
    timeWib: 'WAKTU (WIB)',
    feltMmi: 'DIRASAKAN (MMI)',
    weatherTitle: '🌎 Cuaca & Angin Permukaan Langsung',
    scanWeather: '📡 Imbas Cuaca',
    scanning: 'Mengimbas...',
    loading: 'Memuatkan...',
    weatherPlaceholder: 'Cari Kota / Koordinat (contoh: Kuala Lumpur atau 3.1,101.6)',
    searchBtn: 'Cari',
    weatherCondition: 'Keadaan',
    feelsLike: 'FEELS LIKE',
    windSpeed: 'KELAJUAN ANGIN',
    humidity: 'KELEMBAPAN',
    clouds: 'TUTUPAN AWAN',
    fetchingWeather: 'Mengambil data cuaca stesen terdekat...',
    skyAlertsTitle: 'Amaran Angkasa Terkini',
    shareBtn: 'Kongsi ke Media Sosial',
    closeBtn: 'Tutup',
    shareOverlayTitle: 'Kongsi ke Media Sosial',
    calculatorTitle: '☄️ Kalkulator Impak Meteorit',
    massLabel: 'Jisim Asteroid (kg)',
    velocityLabel: 'Kelajuan Impak (km/s)',
    angleLabel: 'Sudut Hantaman (darjah)',
    targetLabel: 'Jenis Sasaran Impak',
    rockTarget: 'Lapisan Batuan Keras',
    soilTarget: 'Tanah Gembur / Sedimen',
    waterTarget: 'Laut / Air Dalam',
    calculateBtn: 'Kira Impak Hantaman',
    calcResultTitle: 'HASIL ANGGARAN IMPAK',
    calcEnergy: 'TENAGA PELEPASAN',
    calcCrater: 'DIAMETER KAWAH',
    calcRisk: 'TAHAP RISIKO',
    gpsTitle: '📡 Sistem Utiliti Medan & Watermark GPS',
    gpsSubtitle: 'Ambil foto meteorit yang ditemui untuk menindan koordinat GPS, timestamp, dan kompas secara automatik pada foto sebagai bukti sahih lokasi penemuan.',
    activateCamera: 'Aktifkan Kamera',
    uploadHp: 'Muat Naik Foto Telefon',
    photoTips: '💡 Petua Mudah Alih: Jika butang kamera disekat oleh keizinan Telegram, klik Muat Naik Foto Telefon dan pilih Kamera / Ambil Foto untuk mengambil gambar menggunakan kamera asal telefon anda.',
    verifyTitle: '🪨 Permintaan Pengesahan & Kurasi Temuan',
    verifySubtitle: 'Hantar data batuan angkasa anda untuk disahkan oleh pasukan pakar kami dan komuniti antarabangsa.',
    nameLabel: 'Nama Penuh Pengaju',
    emailLabel: 'Alamat E-mel',
    weightLabel: 'Anggaran Berat Temuan (gram)',
    locationLabel: 'Lokasi Penemuan / Koordinat',
    descLabel: 'Keterangan Fizikal & Keadaan Temuan',
    descPlaceholder: 'Nyatakan warna, sifat magnet (menarik magnet atau tidak), tekstur dalaman, fusion crust, dll...',
    submitBtn: 'Hantar Data Pengesahan',
    verifySuccess: '✓ Permintaan Berjaya Dihantar!',
    verifySuccessSub: 'Terima kasih! Data penemuan anda telah berjaya didaftarkan. Pasukan kurator kami akan menyemak dan menghubungi anda melalui e-mel dalam tempoh 3-5 hari bekerja.',
    donationTitle: 'Donasi & Keahlian Premium',
    donationSubtitle: 'Sokong pembangunan portal data Meteorit Indonesia! Derma anda membantu membiayai API NASA, pelayan masa nyata, dan penyelidikan sains pendidikan.',
    donationQris: 'Bayar QRIS / Tempatan (Midtrans)',
    donationPaypal: 'Bayar via PayPal (USD)',
    officialName: 'NAMA RASMI',
    classification: 'KLASIFIKASI',
    massWeight: 'JISIM / BERAT',
    yearFallen: 'TAHUN JATUH',
    coordinatesFallen: 'KOORDINAT JATUH',
    eventTimeUtc: 'WAKTU PERISTIWA (UTC)',
    eventCoordinates: 'KOORDINAT KEJADIAN',
    energyExplosion: 'TENAGA LETUPAN (TNT)',
    entryAltitude: 'KETINGGIAN MASUK',
    velocity: 'KELAJUAN',
    officialNameAstronaut: 'NAMA RASMI',
    country: 'NEGARA',
    agency: 'AGENSI',
    role: 'PERANAN',
    launchDate: 'TARIKH PELUNCURAN',
    published: 'Diterbitkan',
  },
  zh: {
    loadingText: '正在加载综合科学数据...',
    errorTitle: '加载数据出错',
    tryAgain: '重试',
    offlineBadge: '离线',
    activeBadge: '活跃',
    issTrackerTitle: 'ISS 空间站实时轨迹追踪',
    latitude: '纬度 (LAT)',
    longitude: '经度 (LON)',
    astronautsTitle: '太空中的宇航员',
    astronautsSub: '当前在载人空间站中运行 (ISS/天宫)',
    kru: '乘组',
    spaceControl: '🚀 太空任务控制中心',
    countdownDays: '天',
    countdownHours: '小时',
    countdownMinutes: '分钟',
    countdownSeconds: '秒',
    targetNet: '预计发射时间 (NET)',
    countingDown: '正在倒计时...',
    earthquakeTitle: '🌋 BMKG 最新地震警报',
    siagaMag: '警报 M ≥ 5',
    magnitude: '震级',
    depth: '震源深度',
    potensi: '海啸风险',
    locationRegion: '震中位置与地区',
    timeWib: '时间 (WIB)',
    feltMmi: '烈度 (MMI)',
    weatherTitle: '🌎 实时天气与地面风速',
    scanWeather: '📡 扫描天气',
    scanning: '扫描中...',
    loading: '加载中...',
    weatherPlaceholder: '搜索城市/坐标 (例如: 北京 或 39.9,116.4)',
    searchBtn: '搜索',
    weatherCondition: '天候状况',
    feelsLike: '体感温度',
    windSpeed: '风速',
    humidity: '湿度',
    clouds: '云量',
    fetchingWeather: '正在从最近的气象站获取数据...',
    skyAlertsTitle: '最新太空警报',
    shareBtn: '分享至社交媒体',
    closeBtn: '关闭',
    shareOverlayTitle: '分享至社交媒体',
    calculatorTitle: '☄️ 陨石撞击坑模拟计算器',
    massLabel: '小行星质量 (kg)',
    velocityLabel: '撞击速度 (km/s)',
    angleLabel: '撞击角度 (度)',
    targetLabel: '撞击目标表面',
    rockTarget: '硬质岩石层',
    soilTarget: '松软土壤/沉积物',
    waterTarget: '深海/水体',
    calculateBtn: '模拟计算撞击能量',
    calcResultTitle: '撞击模拟预估结果',
    calcEnergy: '释放能量',
    calcCrater: '陨石坑直径',
    calcRisk: '风险等级',
    gpsTitle: '📡 野外考察系统与 GPS 水印相机',
    gpsSubtitle: '拍摄野外发现的陨石照片，系统将自动在照片中嵌入 GPS 坐标、时间戳和罗盘方向，作为发现地点的真实科学凭证。',
    activateCamera: '激活相机',
    uploadHp: '上传手机照片',
    photoTips: '💡 手机提示：如果相机按钮被 Telegram 权限拦截，您可以点击“上传手机照片”，然后选择“相机/拍照”直接使用手机原生相机拍摄。',
    verifyTitle: '🪨 陨石送检申请与实物鉴定',
    verifySubtitle: '提交您发现的陨石数据，由我们的专家团队和国际陨石社区进行初步筛查和科学鉴定。',
    nameLabel: '申请人真实姓名',
    emailLabel: '电子邮箱地址',
    weightLabel: '送检实物估重 (克)',
    locationLabel: '发现地点/详细坐标',
    descLabel: '外观特征与物理性状描述',
    descPlaceholder: '请注明外表颜色、磁性强弱（是否吸铁）、内部质地、熔壳特征（Fusion crust）等...',
    submitBtn: '提交申请表单',
    verifySuccess: '✓ 申请提交成功！',
    verifySuccessSub: '谢谢！您的发现数据已成功登记。我们的鉴定师团队将在 3-5 个工作日内通过电子邮件与您取得联系。',
    donationTitle: '捐赠与高级会员通道',
    donationSubtitle: '支持印尼陨石数据门户的发展！您的捐赠将用于 NASA 接口维护、实时服务器运行以及太空科学普及。',
    donationQris: 'QRIS 扫码快捷支付 (印尼本地)',
    donationPaypal: '通过 PayPal 支付 (美金)',
    officialName: '官方命名',
    classification: '分类学归属',
    massWeight: '质量/重量',
    yearFallen: '坠落年份',
    coordinatesFallen: '坠落坐标',
    eventTimeUtc: '事件发生时间 (UTC)',
    eventCoordinates: '事件坐标',
    energyExplosion: '爆炸当量 (TNT)',
    entryAltitude: '空爆高度',
    velocity: '运行速度',
    officialNameAstronaut: '官方名称',
    country: '国籍',
    agency: '所属航天局',
    role: '舱内角色',
    launchDate: '发射日期',
    published: '发布时间',
  },
  ja: {
    loadingText: '科学データの統合ロード中...',
    errorTitle: 'データロードエラー',
    tryAgain: 'もう一度試す',
    offlineBadge: 'オフライン',
    activeBadge: 'アクティブ',
    issTrackerTitle: 'ISS 宇宙ステーション軌道追跡',
    latitude: '緯度 (LAT)',
    longitude: '経度 (LON)',
    astronautsTitle: '宇宙にいる宇宙飛行士',
    astronautsSub: '現在、有人宇宙ステーションで活動中 (ISS/天宮)',
    kru: 'クルー',
    spaceControl: '🚀 管制センターミッション',
    countdownDays: '日',
    countdownHours: '時間',
    countdownMinutes: '分',
    countdownSeconds: '秒',
    targetNet: '予定時刻 (NET)',
    countingDown: 'カウントダウン中...',
    earthquakeTitle: '🌋 最新の地震情報 (BMKG)',
    siagaMag: '警報 M ≥ 5',
    magnitude: 'マグニチュード',
    depth: '震源の深さ',
    potensi: '津波の有無',
    locationRegion: '震央地・震源',
    timeWib: '発生時刻 (WIB)',
    feltMmi: '震度 (MMI)',
    weatherTitle: '🌎 リアルタイム天气と地上風速',
    scanWeather: '📡 天気をスキャン',
    scanning: 'スキャン中...',
    loading: 'ロード中...',
    weatherPlaceholder: '都市・座標を検索 (例: 東京 または 35.6,139.7)',
    searchBtn: '検索',
    weatherCondition: '天気概況',
    feelsLike: '体感温度',
    windSpeed: '風速',
    humidity: '湿度',
    clouds: '雲量',
    fetchingWeather: '最寄りの観測所から気象データを取得中...',
    skyAlertsTitle: '最新の天文災害アラート',
    shareBtn: 'SNSで共有',
    closeBtn: '閉じる',
    shareOverlayTitle: 'SNSで共有',
    calculatorTitle: '☄️ 隕石クレーター衝突シミュレーター',
    massLabel: '小惑星の質量 (kg)',
    velocityLabel: '衝突速度 (km/s)',
    angleLabel: '衝突角度 (度)',
    targetLabel: '衝突対象の地表の種類',
    rockTarget: '硬い岩石層',
    soilTarget: '柔らかい土壌・堆積物',
    waterTarget: '海洋・深水',
    calculateBtn: '衝突シミュレーションを実行',
    calcResultTitle: 'シミュレーション予測結果',
    calcEnergy: '放出エネルギー',
    calcCrater: 'クレーター直径',
    calcRisk: 'リスクレベル',
    gpsTitle: '📡 野外調査システム＆GPS透かしカメラ',
    gpsSubtitle: '野外で発見した隕石候補の写真を撮影すると、GPS座標、タイムスタンプ、コンパス情報が写真に自動で透かし合成され、発見場所の確実な科学的証明になります。',
    activateCamera: 'カメラを起動',
    uploadHp: 'スマホから写真を選択',
    photoTips: '💡 スマホのアドバイス：Telegramのアクセス権限によりカメラ起動がブロックされた場合、「スマホから写真を選択」をクリックし、「カメラ/写真撮影」を選んでスマホ標準のカメラで撮影してください。',
    verifyTitle: '🪨 隕石鑑定申請と科学的キュレーション',
    verifySubtitle: '発見した隕石候補のデータを提出し、専門家チームおよび国際隕石コミュニティによる初期スクリーニングと鑑定を受けます。',
    nameLabel: '申請者氏名（フルネーム）',
    emailLabel: 'メールアドレス',
    weightLabel: '推定重量 (グラム)',
    locationLabel: '発見場所/詳細な座標',
    descLabel: '外観的特徴および状態の説明',
    descPlaceholder: '表面の色、磁性の有無（磁石にくっつくか）、内部の質感、溶融地殻（Fusion crust）の特徴など...',
    submitBtn: '申請書を送信',
    verifySuccess: '✓ 申請書の送信が完了しました！',
    verifySuccessSub: 'ご送信ありがとうございました！発見された隕石候補のデータがシステムに登録されました。鑑定士チームが内容を確認し、3〜5営業日以内にメールでご連絡いたします。',
    donationTitle: '寄付とプレミアムメンバーシップ',
    donationSubtitle: '支援インドネシア隕石データポータルの開発を支援！あなたの寄付は、NASA APIの維持、リアルタイムサーバーの運用、および宇宙科学の普及活動に役立てられます。',
    donationQris: 'QRIS クイック決済 (インドネシア国内向け)',
    donationPaypal: 'PayPalで支払う (USD)',
    officialName: '公式名',
    classification: '分類',
    massWeight: '質量/重量',
    yearFallen: '落下年',
    coordinatesFallen: '落下座標',
    eventTimeUtc: 'イベント発生時刻 (UTC)',
    eventCoordinates: 'イベント座標',
    energyExplosion: '爆発エネルギー (TNT)',
    entryAltitude: '空爆高度',
    velocity: '速度',
    officialNameAstronaut: '公式名称',
    country: '国籍',
    agency: '所属宇宙機関',
    role: '役割',
    launchDate: '打ち上げ日',
    published: '発行日',
  },
  ru: {
    loadingText: 'Загрузка комплексных научных данных...',
    errorTitle: 'Ошибка загрузки данных',
    tryAgain: 'Попробовать снова',
    offlineBadge: 'ОФФЛАЙН',
    activeBadge: 'АКТИВЕН',
    issTrackerTitle: 'Отслеживание орбиты МКС',
    latitude: 'ШИРОТА (LAT)',
    longitude: 'ДОЛГОТА (LON)',
    astronautsTitle: 'Космонавты в космосе',
    astronautsSub: 'В настоящее время на орбитальной станции (МКС/Тяньгун)',
    kru: 'Экипаж',
    spaceControl: '🚀 Контроль космической миссии',
    countdownDays: 'Дн',
    countdownHours: 'Ч',
    countdownMinutes: 'Мин',
    countdownSeconds: 'Сек',
    targetNet: 'Целевое время (NET)',
    countingDown: 'Обратный отсчет...',
    earthquakeTitle: '🌋 Последнее землетрясение (BMKG)',
    siagaMag: 'Предупреждение M ≥ 5',
    magnitude: 'Магнитуда',
    depth: 'Глубина',
    potensi: 'Угроза цунами',
    locationRegion: 'Эпицентр/Регион',
    timeWib: 'Время события (WIB)',
    feltMmi: 'Ощущалось (MMI)',
    weatherTitle: '🌎 Погода и скорость ветра в реальном времени',
    scanWeather: '📡 Сканировать погоду',
    scanning: 'Сканирование...',
    loading: 'Загрузка...',
    weatherPlaceholder: 'Поиск города/координат (например, Москва или 55.75,37.61)',
    searchBtn: 'Найти',
    weatherCondition: 'Погодные условия',
    feelsLike: 'Ощущается как',
    windSpeed: 'Скорость ветра',
    humidity: 'Влажность',
    clouds: 'Облачность',
    fetchingWeather: 'Получение данных с ближайшей метеостанции...',
    skyAlertsTitle: 'Оповещения об угрозах из космоса',
    shareBtn: 'Поделиться',
    closeBtn: 'Закрыть',
    shareOverlayTitle: 'Поделиться новостью',
    calculatorTitle: '☄️ Симулятор падения астероидов и метеоритов',
    massLabel: 'Масса астероида (кг)',
    velocityLabel: 'Скорость столкновения (км/с)',
    angleLabel: 'Угол столкновения (градусы)',
    targetLabel: 'Тип поверхности мишени',
    rockTarget: 'Твердая горная порода',
    soilTarget: 'Мягкая почва/осадочные породы',
    waterTarget: 'Океан/глубокая вода',
    calculateBtn: 'Запустить симуляцию столкновения',
    calcResultTitle: 'Прогнозируемые результаты симуляции',
    calcEnergy: 'Выделенная энергия',
    calcCrater: 'Диаметр кратера',
    calcRisk: 'Уровень риска',
    gpsTitle: '📡 Система полевых исследований и GPS-камера',
    gpsSubtitle: 'Сделайте снимок найденного метеорита. Система автоматически наложит на фото GPS-координаты, временную метку и компас для подтверждения места находки.',
    activateCamera: 'Включить камеру',
    uploadHp: 'Загрузить фото с телефона',
    photoTips: '💡 Совет: Если доступ к камере заблокирован разрешениями Telegram, нажмите «Загрузить фото с телефона» и выберите «Камера / Сделать снимок» для съемки через стандартное приложение камеры телефона.',
    verifyTitle: '🪨 Заявка на проверку и научную аттестацию метеоритов',
    verifySubtitle: 'Отправьте данные о вашей находке для прохождения первичного анализа и подтверждения экспертной группой.',
    nameLabel: 'ФИО заявителя',
    emailLabel: 'Электронная почта',
    weightLabel: 'Оценочный вес (в граммах)',
    locationLabel: 'Место обнаружения / координаты',
    descLabel: 'Описание внешнего вида и физических свойств',
    descPlaceholder: 'Цвет поверхности, наличие магнитных свойств, текстура, состояние коры плавления (Fusion crust)...',
    submitBtn: 'Отправить заявку',
    verifySuccess: '✓ Заявка успешно отправлена!',
    verifySuccessSub: 'Спасибо за ваше обращение! Данные вашей находки зарегистрированы. Экспертная группа рассмотрит информацию и ответит вам по почте в течение 3–5 рабочих дней.',
    donationTitle: 'Поддержка проекта и Premium-доступ',
    donationSubtitle: 'Поддержите развитие индонезийского портала метеоритов! Ваши пожертвования идут на обслуживание API NASA, аренду серверов и популяризацию науки.',
    donationQris: 'Оплата через QRIS (внутри Индонезии)',
    donationPaypal: 'Оплата через PayPal (USD)',
    officialName: 'Официальное имя',
    classification: 'Классификация',
    massWeight: 'Масса/Вес',
    yearFallen: 'Год падения',
    coordinatesFallen: 'Координаты падения',
    eventTimeUtc: 'Время события (UTC)',
    eventCoordinates: 'Координаты события',
    energyExplosion: 'Энергия взрыва (ТНТ)',
    entryAltitude: 'Высота взрыва',
    velocity: 'Скорость',
    officialNameAstronaut: 'Официальное имя',
    country: 'Гражданство',
    agency: 'Космическое агентство',
    role: 'Роль в экипаже',
    launchDate: 'Дата запуска',
    published: 'Опубликовано',
  },
  fr: {
    loadingText: 'Chargement des données scientifiques intégrées...',
    errorTitle: 'Erreur lors du chargement des données',
    tryAgain: 'Réessayer',
    offlineBadge: 'HORS LIGNE',
    activeBadge: 'ACTIF',
    issTrackerTitle: 'Suivi de l\'orbite de l\'ISS en direct',
    latitude: 'LATITUDE (LAT)',
    longitude: 'LONGITUDE (LON)',
    astronautsTitle: 'Astronautes dans l\'espace',
    astronautsSub: 'Actuellement sur la station orbitale (ISS/Tiangong)',
    kru: 'Équipage',
    spaceControl: '🚀 Contrôle de mission spatiale',
    countdownDays: 'Jours',
    countdownHours: 'H',
    countdownMinutes: 'Min',
    countdownSeconds: 'Sec',
    targetNet: 'Heure cible (NET)',
    countingDown: 'Compte à rebours...',
    earthquakeTitle: '🌋 Dernier séisme (BMKG)',
    siagaMag: 'Alerte M ≥ 5',
    magnitude: 'Magnitude',
    depth: 'Profondeur',
    potensi: 'Menace de tsunami',
    locationRegion: 'Épicentre / Région',
    timeWib: 'Heure de l\'événement (WIB)',
    feltMmi: 'Ressenti (MMI)',
    weatherTitle: '🌎 Météo et vitesse du vent en direct',
    scanWeather: '📡 Scanner la météo',
    scanning: 'Scan en cours...',
    loading: 'Chargement...',
    weatherPlaceholder: 'Rechercher une ville/coordonnées (ex: Paris ou 48.85,2.35)',
    searchBtn: 'Rechercher',
    weatherCondition: 'Conditions météo',
    feelsLike: 'Température ressentie',
    windSpeed: 'Vitesse du vent',
    humidity: 'Humidité',
    clouds: 'Couverture nuageuse',
    fetchingWeather: 'Récupération des données météorologiques de la station la plus proche...',
    skyAlertsTitle: 'Alertes sur les menaces spatiales',
    shareBtn: 'Partager',
    closeBtn: 'Fermer',
    shareOverlayTitle: 'Partager',
    calculatorTitle: '☄️ Simulateur d\'impact de cratère météoritique',
    massLabel: 'Masse de l\'astéroïde (kg)',
    velocityLabel: 'Vitesse d\'impact (km/s)',
    angleLabel: 'Angle d\'impact (degrés)',
    targetLabel: 'Type de surface de la cible',
    rockTarget: 'Roche solide',
    soilTarget: 'Sol meuble / Sédiments',
    waterTarget: 'Océan / Eau profonde',
    calculateBtn: 'Lancer la simulation d\'impact',
    calcResultTitle: 'Résultats de simulation prévus',
    calcEnergy: 'Énergie libérée',
    calcCrater: 'Diamètre du cratère',
    calcRisk: 'Niveau de risque',
    gpsTitle: '📡 Système de recherche sur le terrain et caméra GPS',
    gpsSubtitle: 'Prenez une photo de votre météorite suspecte. Le système inscrira automatiquement les coordonnées GPS, l\'heure et la boussole pour authentifier le lieu de découverte.',
    activateCamera: 'Activer la caméra',
    uploadHp: 'Téléverser depuis le téléphone',
    photoTips: '💡 Astuce : Si l\'accès à la caméra est bloqué par les autorisations Telegram, cliquez sur « Téléverser depuis le téléphone » et choisissez « Caméra / Prendre une photo » pour utiliser la caméra native du téléphone.',
    verifyTitle: '🪨 Demande d\'expertise scientifique et d\'authentification de météorites',
    verifySubtitle: 'Soumettez les données de votre découverte pour un premier filtrage et une authentification scientifique par notre équipe.',
    nameLabel: 'Nom complet du demandeur',
    emailLabel: 'Adresse e-mail',
    weightLabel: 'Poids estimé (en grammes)',
    locationLabel: 'Lieu de découverte / coordonnées',
    descLabel: 'Description des caractéristiques physiques',
    descPlaceholder: 'Couleur de surface, présence de magnétisme (adhère à l\'aimant), texture interne, caractéristiques de la croûte de fusion...',
    submitBtn: 'Envoyer la demande',
    verifySuccess: '✓ Demande envoyée avec succès !',
    verifySuccessSub: 'Merci ! Les données de votre découverte ont été enregistrées. Notre équipe d\'experts examinera votre demande et vous contactera par e-mail sous 3 à 5 jours ouvrés.',
    donationTitle: 'Dons et Adhésion Premium',
    donationSubtitle: 'Soutenez le développement du portail des météorites d\'Indonésie ! Vos dons aident à maintenir les API de la NASA, les serveurs et à diffuser la science.',
    donationQris: 'Paiement rapide via QRIS (Indonésie uniquement)',
    donationPaypal: 'Payer via PayPal (USD)',
    officialName: 'Nom officiel',
    classification: 'Classification',
    massWeight: 'Masse / Poids',
    yearFallen: 'Année de chute',
    coordinatesFallen: 'Coordonnées de chute',
    eventTimeUtc: 'Heure de l\'événement (UTC)',
    eventCoordinates: 'Coordonnées de l\'événement',
    energyExplosion: 'Énergie de l\'explosion (TNT)',
    entryAltitude: 'Altitude d\'explosion',
    velocity: 'Vitesse',
    officialNameAstronaut: 'Nom officiel',
    country: 'Nationalité',
    agency: 'Agence spatiale',
    role: 'Rôle dans l\'équipage',
    launchDate: 'Date de lancement',
    published: 'Publié le',
  }
};

type TabName = 'radar' | 'monitor' | 'kamus' | 'utilitas' | 'verifikasi';
type FilterType = 'semua' | 'blog' | 'komet' | 'peristiwa' | 'astronot' | 'glosarium' | 'fireball' | 'meteorites' | 'gallery-apod';

function WeatherCanvas({ condition }: { condition: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 250);
    let height = (canvas.height = 70);

    const handleResize = () => {
      if (canvas && canvas.parentElement) {
        width = canvas.width = canvas.parentElement.clientWidth || 250;
      }
    };
    window.addEventListener('resize', handleResize);

    const particles: any[] = [];
    const conditionLower = condition.toLowerCase();
    const isRain = conditionLower.includes('hujan') || conditionLower.includes('rain') || conditionLower.includes('gerimis') || conditionLower.includes('drizzle') || conditionLower.includes('petir') || conditionLower.includes('thunder');
    const isSnow = conditionLower.includes('snow') || conditionLower.includes('salju');
    const isCloudy = conditionLower.includes('cloud') || conditionLower.includes('awan') || conditionLower.includes('mendung') || conditionLower.includes('fog') || conditionLower.includes('kabut') || conditionLower.includes('mist');
    const isClear = !isRain && !isSnow && !isCloudy;

    const clouds = [
      { x: 20, y: 15, r: 15, speed: 0.1 },
      { x: 90, y: 10, r: 20, speed: 0.07 },
      { x: 180, y: 20, r: 14, speed: 0.12 },
    ];

    let flash = 0;

    const createParticle = () => {
      if (isRain) {
        return {
          x: Math.random() * width,
          y: -10,
          vy: 4 + Math.random() * 3,
          vx: -1 + Math.random() * 2,
          l: 5 + Math.random() * 4,
        };
      }
      return null;
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Background Gradient
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      if (isClear) {
        grad.addColorStop(0, '#0284c7');
        grad.addColorStop(1, '#0c4a6e');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Sun
        ctx.beginPath();
        ctx.arc(width - 30, 25, 10, 0, Math.PI * 2);
        ctx.fillStyle = '#fbbf24';
        ctx.fill();
      } else {
        grad.addColorStop(0, '#1e293b');
        grad.addColorStop(1, '#0f172a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      }

      // Draw Clouds
      if (isCloudy || isRain) {
        ctx.fillStyle = isRain ? 'rgba(71, 85, 105, 0.7)' : 'rgba(226, 232, 240, 0.6)';
        clouds.forEach((c) => {
          c.x += c.speed;
          if (c.x - c.r > width) c.x = -c.r;
          ctx.beginPath();
          ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
          ctx.arc(c.x + c.r * 0.6, c.y - c.r * 0.4, c.r * 0.8, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // Lightning
      if (conditionLower.includes('petir') || conditionLower.includes('thunder')) {
        if (Math.random() < 0.015) flash = 1;
        if (flash > 0) {
          ctx.fillStyle = `rgba(255, 255, 255, ${flash})`;
          ctx.fillRect(0, 0, width, height);
          flash -= 0.08;

          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(Math.random() * width, 5);
          ctx.lineTo(Math.random() * width, height / 2);
          ctx.lineTo(Math.random() * width, height - 5);
          ctx.stroke();
        }
      }

      // Rain particles
      if (isRain && particles.length < 30) {
        const p = createParticle();
        if (p) particles.push(p);
      }

      ctx.strokeStyle = '#38bdf8';
      particles.forEach((p, idx) => {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + p.vx, p.y + p.l);
        ctx.stroke();

        p.y += p.vy;
        p.x += p.vx;
        if (p.y > height) {
          particles[idx] = createParticle() || p;
          particles[idx].y = 0;
        }
      });

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
    };
  }, [condition]);

  return <canvas ref={canvasRef} className="w-full h-[70px] rounded-xl shadow-inner bg-slate-950 block" />;
}

export default function MiniAppClient() {
  const { theme, setTheme } = useTheme();
  
  // Language States & Handlers
  const language = useSiteLanguage();
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  
  const handleLanguageChange = (lang: SiteLanguage) => {
    localStorage.setItem('meteorit-language', lang);
    document.cookie = `meteorit-locale=${lang}; path=/; max-age=31536000; SameSite=Lax`;
    window.dispatchEvent(new Event('meteorit-language-change'));
  };

  // App States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tgUser, setTgUser] = useState<{ first_name?: string; username?: string } | null>(null);
  
  // API Data States
  const [data, setData] = useState<{
    iss: { latitude: number; longitude: number; timestamp: number; source: string } | null;
    astronauts: any[];
    astronautCount: number;
    apod: any;
    articles: any[];
    meteorites: any[];
    glossary: any[];
    earthquake: any | null;
  }>({
    iss: null,
    astronauts: [],
    astronautCount: 0,
    apod: null,
    articles: [],
    meteorites: [],
    glossary: [],
    earthquake: null
  });

  const [activeTab, setActiveTab] = useState<TabName>('radar');
  const [isOffline, setIsOffline] = useState(false);

  // Search & Filtering States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('semua');
  const [selectedItem, setSelectedItem] = useState<any | null>(null); // For detail modals

  // Social Share & Launch Countdown & Weather States
  const [launch, setLaunch] = useState<any | null>(null);
  const [launchLoading, setLaunchLoading] = useState(true);
  const [countdown, setCountdown] = useState<{ d: number; h: number; m: number; s: number } | null>(null);
  const [weather, setWeather] = useState<any | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherSearchInput, setWeatherSearchInput] = useState('');
  const [shareOpenItem, setShareOpenItem] = useState<{ title: string; text: string; url: string } | null>(null);
  const [enso, setEnso] = useState<any>(null);


  // Dynamic client-side translations states
  const [translatedApod, setTranslatedApod] = useState<{ title: string; explanation: string } | null>(null);
  const [astronautTransCache, setAstronautTransCache] = useState<Record<string, { biography: string; role: string; country: string }>>({});
  const [meteoriteTransCache, setMeteoriteTransCache] = useState<Record<string, { name: string; description: string }>>({});
  const [glossaryTransCache, setGlossaryTransCache] = useState<Record<string, { term: string; definition: string; example: string }>>({});
  const [articleTransCache, setArticleTransCache] = useState<Record<string, { title: string; excerpt: string; content?: string }>>({});
  const [translatedRadar, setTranslatedRadar] = useState<{
    earthquake?: { region: string; tsunamiPotential: string; felt?: string };
    launch?: { name: string; desc: string };
  } | null>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showMeteorAnim, setShowMeteorAnim] = useState(true);
  const [meteorFade, setMeteorFade] = useState(false);

  // Auto hide shooting meteor animation after 5.5s + 0.7s fade out
  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setMeteorFade(true);
    }, 5500);
    const unmountTimer = setTimeout(() => {
      setShowMeteorAnim(false);
    }, 6200);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(unmountTimer);
    };
  }, []);

  // Monitor keyboard focus to hide footer menu on mobile viewports
  useEffect(() => {
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        setIsInputFocused(true);
      }
    };
    const handleBlur = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        setIsInputFocused(false);
      }
    };
    document.addEventListener('focusin', handleFocus);
    document.addEventListener('focusout', handleBlur);
    return () => {
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('focusout', handleBlur);
    };
  }, []);

  // APOD Client-side On-the-fly Translator
  useEffect(() => {
    if (!data?.apod) return;
    const apod = data.apod;
    const loc = language;

    const tTitle = apod.title?.[loc];
    const tExp = apod.explanation?.[loc];

    if (tTitle && tExp) {
      setTranslatedApod({ title: tTitle, explanation: tExp });
      return;
    }

    let isMounted = true;
    fetch(`/api/apod/translate?id=${apod.id}&locale=${loc}`)
      .then(res => res.json())
      .then(res => {
        if (isMounted && res.title && res.explanation) {
          setTranslatedApod({ title: res.title, explanation: res.explanation });
        }
      })
      .catch(err => {
        console.warn('Failed to translate APOD on the fly in miniapp:', err);
        if (isMounted) {
          setTranslatedApod({
            title: apod.title?.en || apod.title?.id || '',
            explanation: apod.explanation?.en || apod.explanation?.id || ''
          });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [language, data?.apod]);

  // Astronaut Client-side On-the-fly Translator
  useEffect(() => {
    if (!selectedItem || selectedItem._type !== 'astronot') return;
    const slug = selectedItem.id;
    const loc = language;

    if (loc === 'id') return;

    const cacheKey = `${slug}_${loc}`;
    if (astronautTransCache[cacheKey]) return;

    let isMounted = true;
    const query = new URLSearchParams({
      slug: slug,
      locale: loc,
      biography: selectedItem.biography || '',
      role: selectedItem.role || '',
      country: selectedItem.country || ''
    });

    fetch(`/api/astronot/translate?${query.toString()}`)
      .then(res => res.json())
      .then(res => {
        if (isMounted && res.biography) {
          setAstronautTransCache(prev => ({
            ...prev,
            [cacheKey]: {
              biography: res.biography,
              role: res.role || selectedItem.role,
              country: res.country || selectedItem.country
            }
          }));
        }
      })
      .catch(err => console.warn('Failed to translate astronaut in miniapp:', err));

    return () => {
      isMounted = false;
    };
  }, [selectedItem, language, astronautTransCache]);

  // Meteorite Client-side On-the-fly Translator
  useEffect(() => {
    if (!selectedItem || selectedItem._type !== 'meteorit') return;
    const id = selectedItem.id;
    const loc = language;
    if (loc === 'id') return;  // ID already has translated_description

    const cacheKey = `${id}_${loc}`;
    if (meteoriteTransCache[cacheKey]) return;

    let isMounted = true;
    fetch(`/api/meteorite/translate?id=${encodeURIComponent(id)}&locale=${loc}`)
      .then(res => res.json())
      .then(res => {
        if (isMounted && res.description) {
          setMeteoriteTransCache(prev => ({
            ...prev,
            [cacheKey]: {
              name: res.name || selectedItem.name || '',
              description: res.description
            }
          }));
        }
      })
      .catch(err => console.warn('Failed to translate meteorite in miniapp:', err));

    return () => {
      isMounted = false;
    };
  }, [selectedItem, language, meteoriteTransCache]);

  // Dynamic Glossary and Article Translator for Selected Item
  useEffect(() => {
    if (!selectedItem) return;
    const id = selectedItem.id;
    const loc = language;
    if (loc === 'id') return;

    const cacheKey = `${id}_${loc}`;

    if (selectedItem._type === 'glosarium') {
      if (glossaryTransCache[cacheKey]) return;
      let isMounted = true;
      fetch(`/api/glossary/translate?id=${encodeURIComponent(id)}&locale=${loc}`)
        .then(res => res.json())
        .then(res => {
          if (isMounted && res.term && res.definition) {
            setGlossaryTransCache(prev => ({
              ...prev,
              [cacheKey]: {
                term: res.term,
                definition: res.definition,
                example: res.example || selectedItem.example?.id || ''
              }
            }));
          }
        })
        .catch(err => console.warn('Failed to translate glossary in miniapp:', err));

      return () => { isMounted = false; };
    }

    if (selectedItem._type === 'artikel') {
      if (articleTransCache[cacheKey]) return;
      let isMounted = true;
      const cat = selectedItem.category?.toLowerCase() || '';
      let coll = 'articles';

      fetch(`/api/articles/translate?id=${encodeURIComponent(id)}&locale=${loc}&collection=${coll}`)
        .then(res => res.json())
        .then(res => {
          if (isMounted && res.title && res.excerpt) {
            setArticleTransCache(prev => ({
              ...prev,
              [cacheKey]: {
                title: res.title,
                excerpt: res.excerpt
              }
            }));
          }
        })
        .catch(err => console.warn('Failed to translate article in miniapp:', err));

      return () => { isMounted = false; };
    }
  }, [selectedItem, language, glossaryTransCache, articleTransCache]);

  // Dynamic Live Radar Translator (BMKG Earthquake & Space Launch Countdown)
  useEffect(() => {
    const loc = language;
    if (loc === 'id') {
      setTranslatedRadar(null);
      return;
    }

    if (!data.earthquake && !launch) return;

    let isMounted = true;
    const body = {
      locale: loc,
      earthquake: data.earthquake ? {
        region: data.earthquake.region,
        tsunamiPotential: data.earthquake.tsunamiPotential,
        felt: data.earthquake.felt || ''
      } : undefined,
      launch: launch ? {
        name: launch.name,
        desc: launch.desc
      } : undefined
    };

    fetch('/api/miniapp/translate-radar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
      .then(res => res.json())
      .then(res => {
        if (isMounted && (res.earthquake || res.launch)) {
          setTranslatedRadar(res);
        }
      })
      .catch(err => console.warn('Failed to translate radar details in miniapp:', err));

    return () => {
      isMounted = false;
    };
  }, [language, data.earthquake, launch]);

  
  const curT = tDict[language] || tDict['id'];

  const getTranslatedCategory = (cat: string) => {
    if (!cat) return language === 'zh' ? '文章' : language === 'ja' ? '記事' : (language === 'ru' || language === 'fr') ? 'Article' : language === 'en' ? 'Article' : 'Artikel';
    const c = cat.toLowerCase();
    if (c.includes('panduan')) return language === 'zh' ? '指南' : language === 'ja' ? 'ガイド' : (language === 'ru' || language === 'fr' || language === 'en') ? 'Guide' : 'Panduan';
    if (c.includes('sejarah')) return language === 'zh' ? '历史' : language === 'ja' ? '历史' : (language === 'ru' || language === 'fr' || language === 'en') ? 'History' : 'Sejarah';
    if (c.includes('edukasi')) return language === 'zh' ? '教育' : language === 'ja' ? '教育' : (language === 'ru' || language === 'fr' || language === 'en') ? 'Education' : 'Edukasi';
    if (c.includes('trivia')) return 'Trivia';
    if (c.includes('peristiwa')) return language === 'zh' ? '自然事件' : language === 'ja' ? '自然イベント' : (language === 'ru' || language === 'fr' || language === 'en') ? 'Natural Event' : 'Peristiwa Alam';
    if (c.includes('komet') || c.includes('asteroid')) return language === 'zh' ? '彗星与小行星' : language === 'ja' ? '彗星・小惑星' : (language === 'ru' || language === 'fr' || language === 'en') ? 'Comet & Asteroid' : 'Komet & Asteroid';
    if (c.includes('bola api') || c.includes('fireball')) return language === 'zh' ? '火球记录' : language === 'ja' ? '火球' : (language === 'ru' || language === 'fr' || language === 'en') ? 'Fireball' : 'Bola Api';
    if (c.includes('galeri') || c.includes('apod')) return language === 'zh' ? 'APOD 图库' : language === 'ja' ? 'APOD' : (language === 'ru' || language === 'fr' || language === 'en') ? 'APOD Gallery' : 'Galeri APOD';
    if (c.includes('meteorit') || c.includes('meteorite')) return language === 'zh' ? '陨石目录' : language === 'ja' ? '隕石カタログ' : (language === 'ru' || language === 'fr' || language === 'en') ? 'Meteorite Catalog' : language === 'ms' ? 'Katalog Meteorit' : 'Katalog Meteorit';
    if (c.includes('glosarium') || c.includes('glossary') || c.includes('dictionary') || c.includes('kamus')) return language === 'zh' ? '术语表' : language === 'ja' ? '用語集' : language === 'ru' ? 'Глоссарий' : language === 'fr' ? 'Glossaire' : language === 'en' ? 'Glossary' : 'Glosarium';
    if (c.includes('astronot') || c.includes('astronaut') || c.includes('angkasawan')) return language === 'zh' ? '宇航员' : language === 'ja' ? '宇宙飛行士' : language === 'ru' ? 'Космонавт' : language === 'fr' ? 'Astronaute' : language === 'en' ? 'Astronaut' : language === 'ms' ? 'Angkasawan' : 'Astronot';
    return cat;
  };

  // Prevent background scrolling when detail modal is open
  useEffect(() => {
    if (selectedItem || shareOpenItem) {
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100vh';
    } else {
      document.body.style.overflow = '';
      document.body.style.height = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.height = '';
    };
  }, [selectedItem, shareOpenItem]);


  // Web Push Settings State
  const [pushStatus, setPushStatus] = useState<'default' | 'granted' | 'denied' | 'unsupported'>('default');
  const [pushLoading, setPushLoading] = useState(false);

  // Day/Night Theme Mode State
  const [isDayMode, setIsDayMode] = useState(false);

  // Monitor Sub-tab active state
  const [monitorSubTab, setMonitorSubTab] = useState<'apod' | 'neo' | 'fireball' | 'weather' | 'mars' | 'epic'>('apod');

  // Normalisasi URL gambar untuk peranti seluler agar tidak memuat localhost
  const normalizeImageUrl = (url: string) => {
    if (!url) return '';
    let cleanUrl = url.replace(/^http:\/\/(localhost|127\.0\.0\.1):3000/, '');
    
    // Proxy Cloudflare R2 dev subdomain agar tidak terkena pemblokiran rate limit
    if (/^https:\/\/pub-[a-zA-Z0-9]+\.r2\.dev\//.test(cleanUrl)) {
      return `/api/r2-proxy?url=${encodeURIComponent(cleanUrl)}`;
    }
    
    return cleanUrl;
  };

  // Geolocation & Watermark States
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsData, setGpsData] = useState<{ lat: number; lon: number; accuracy?: number } | null>(null);
  const [gpsManual, setGpsManual] = useState({ lat: '-6.2000', lon: '106.8166' });
  const [altitude, setAltitude] = useState('0');
  const [direction, setDirection] = useState('0'); // Compass
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [watermarkedImage, setWatermarkedImage] = useState<string | null>(null);
  const [isWatermarking, setIsWatermarking] = useState(false);
  
  // Calculator States
  const [calcInput, setCalcInput] = useState({
    mass: '500',
    velocity: '18',
    angle: '45',
    target: 'rock'
  });
  const [calcResult, setCalcResult] = useState<{
    energyMt: number;
    craterDiameter: number;
    level: string;
    description: string;
  } | null>(null);

  // Verification Form States
  const [verifyForm, setVerifyForm] = useState({
    name: '',
    email: '',
    weight: '',
    location: '',
    description: ''
  });
  const [verifySuccess, setVerifySuccess] = useState(false);
  const [verifyImage, setVerifyImage] = useState<string | null>(null);

  // Donation Amount State
  const [donationAmount, setDonationAmount] = useState('50000');

  // Refs for camera watermark
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Fetch all data
  const fetchMiniAppData = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      
      // Load cache first
      const cached = localStorage.getItem('miniapp-data-cache');
      if (cached && !forceRefresh) {
        const parsed = JSON.parse(cached);
        setData(parsed);
        setLoading(false);
      }

      // Fetch fresh data
      const res = await fetch('/api/miniapp/data');
      if (!res.ok) throw new Error('Gagal terhubung ke API server.');
      
      const payload = await res.json();
      if (payload.success) {
        setData(payload);
        localStorage.setItem('miniapp-data-cache', JSON.stringify(payload));
        setIsOffline(false);
      } else {
        throw new Error(payload.error || 'Terjadi kesalahan sistem.');
      }
    } catch (err) {
      console.error(err);
      setIsOffline(true);
      // Load fallback cache if error
      const cached = localStorage.getItem('miniapp-data-cache');
      if (cached) {
        setData(JSON.parse(cached));
      } else {
        setError('Gagal memuat data. Silakan periksa koneksi internet Anda.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMiniAppData();
    fetchUpcomingLaunch();
    
    async function fetchEnso() {
      try {
        const res = await fetch('/api/cuaca/enso');
        if (res.ok) {
          const payload = await res.json();
          if (payload.success) setEnso(payload.data);
        }
      } catch {}
    }
    fetchEnso();

    
    // Fetch cached last location or default to Jakarta on load
    if (typeof window !== 'undefined') {
      const cachedLat = localStorage.getItem('miniapp-last-lat');
      const cachedLon = localStorage.getItem('miniapp-last-lon');
      if (cachedLat && cachedLon) {
        fetchWeatherData(parseFloat(cachedLat), parseFloat(cachedLon));
      } else {
        fetchWeatherData(-6.2088, 106.8456);
      }
    } else {
      fetchWeatherData(-6.2088, 106.8456);
    }

    if (typeof window !== 'undefined') {
      if ('Notification' in window) {
        setPushStatus(Notification.permission);
      } else {
        setPushStatus('unsupported');
      }
    }
    
    // Auto refresh ISS position every 10 seconds in background
    const timer = setInterval(async () => {
      try {
        const res = await fetch('/api/space/live');
        if (res.ok) {
          const payload = await res.json();
          if (payload.success && payload.iss) {
            setData(prev => ({
              ...prev,
              iss: payload.iss
            }));
          }
        }
      } catch (err) {
        console.warn('ISS live update failed:', err);
      }
    }, 10000);

    // Check offline status
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Get initial geolocation
    requestGpsLocation();

    // Check compass orientation
    if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
      const handleOrientation = (e: DeviceOrientationEvent) => {
        const heading = (e as any).webkitCompassHeading || e.alpha || 0;
        setDirection(Math.round(heading).toString());
      };
      window.addEventListener('deviceorientation', handleOrientation);
      return () => {
        window.removeEventListener('deviceorientation', handleOrientation);
      };
    }

    return () => {
      clearInterval(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Countdown timer effect
  useEffect(() => {
    if (!launch?.net) return;
    const interval = setInterval(() => {
      const diff = new Date(launch.net).getTime() - Date.now();
      if (diff <= 0) {
        setCountdown({ d: 0, h: 0, m: 0, s: 0 });
        clearInterval(interval);
        return;
      }
      setCountdown({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000)
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [launch]);

  // Sync HTML class list with theme mode
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const html = document.documentElement;
      if (isDayMode) {
        html.classList.add('light');
        html.style.colorScheme = 'light';
      } else {
        html.classList.remove('light');
        html.style.colorScheme = 'dark';
      }
    }
  }, [isDayMode]);

  // Handle Telegram WebApp Script Init
  const handleTgInit = () => {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      const tg = (window as any).Telegram.WebApp;
      tg.ready();
      tg.expand();
      
      // Get user profile if inside TG
      if (tg.initDataUnsafe?.user) {
        setTgUser(tg.initDataUnsafe.user);
      }

      // Apply theme params
      const params = tg.themeParams;
      if (params) {
        // Apply Telegram colors to CSS variables dynamically
        document.documentElement.style.setProperty('--background', params.bg_color || '#020617');
        document.documentElement.style.setProperty('--foreground', params.text_color || '#f8fafc');
        
        // Sync app dark/light mode based on TG theme
        if (params.bg_color) {
          const isDark = isColorDark(params.bg_color);
          setIsDayMode(!isDark);
        }
      }
    }
  };

  // Helper to determine if hex color is dark
  const isColorDark = (hexColor: string) => {
    const c = hexColor.substring(1);
    const rgb = parseInt(c, 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luma < 128;
  };

  // Fetch Rocket Launch from RocketLaunch.Live
  const fetchUpcomingLaunch = async () => {
    try {
      setLaunchLoading(true);
      const res = await fetch('https://fdo.rocketlaunch.live/json/launches/next/1');
      if (res.ok) {
        const payload = await res.json();
        const r = payload?.result?.[0];
        if (r) {
          setLaunch({
            name: r.name || 'Misi Peluncuran Roket',
            net: r.net || r.win_open || new Date(Date.now() + 3 * 86400000).toISOString(),
            rocket: r.vehicle?.name || 'Falcon 9',
            provider: r.provider?.name || 'SpaceX',
            desc: r.launch_description || 'Peluncuran satelit luar antariksa komersial.'
          });
          return;
        }
      }
      setLaunch(getFallbackLaunch());
    } catch (e) {
      setLaunch(getFallbackLaunch());
    } finally {
      setLaunchLoading(false);
    }
  };

  const getFallbackLaunch = () => {
    const target = new Date();
    target.setDate(target.getDate() + 3);
    target.setHours(14, 30, 0, 0);
    return {
      name: 'Falcon 9 — Starlink Misi',
      net: target.toISOString(),
      rocket: 'Falcon 9 Block 5',
      provider: 'SpaceX',
      desc: 'Misi peluncuran satelit Starlink komersial untuk memperluas jaringan internet global.'
    };
  };

  // Fetch Weather & Wind data from OpenWeather API
  const fetchWeatherData = async (latOrQuery?: number | string, lon?: number) => {
    try {
      setWeatherLoading(true);
      let url = '';
      if (typeof latOrQuery === 'string') {
        url = `/api/nasa/openweather?q=${encodeURIComponent(latOrQuery)}`;
      } else if (typeof latOrQuery === 'number' && typeof lon === 'number') {
        url = `/api/nasa/openweather?lat=${latOrQuery}&lon=${lon}`;
      } else {
        url = `/api/nasa/openweather?lat=-6.2088&lon=106.8456`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const payload = await res.json();
        if (payload.success && payload.data) {
          setWeather(payload.data);
          if (typeof window !== 'undefined') {
            localStorage.setItem('miniapp-last-lat', String(payload.data.lat));
            localStorage.setItem('miniapp-last-lon', String(payload.data.lon));
          }
        }
      }
    } catch (e) {
      console.warn('Weather fetch failed:', e);
    } finally {
      setWeatherLoading(false);
    }
  };

  // Social Share Handler (uses native web share or custom overlay fallback)
  const handleShare = async (item: any) => {
    const slug = item.id;
    const isApod = slug.startsWith('apod-');
    const shareUrl = isApod 
      ? `https://meteorit.my.id/apod/${slug.replace('apod-', '')}`
      : item._type === 'astronot' 
        ? `https://meteorit.my.id/astronot/${item.id}`
        : item._type === 'meteorit'
          ? `https://meteorit.my.id/ensiklopedia/${item.id}`
          : `https://meteorit.my.id/blog/${item.id}`;

    const shareTitle = item._title || 'Meteorit Indonesia';
    const shareText = item._desc || 'Lihat info menarik di portal astronomi dan meteorit Indonesia!';

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        console.log('[Share] Native share successful');
      } catch (err) {
        console.log('[Share] Native share failed/cancelled:', err);
      }
    } else {
      setShareOpenItem({
        title: shareTitle,
        text: shareText,
        url: shareUrl
      });
    }
  };

  // Web Push Notification Subscribe Handler
  const handleTogglePush = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('Peramban Anda tidak mendukung notifikasi push.');
      return;
    }

    setPushLoading(true);
    try {
      const permission = await Notification.requestPermission();
      setPushStatus(permission);
      
      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        const { initializeApp } = await import('firebase/app');
        const { getMessaging, getToken } = await import('firebase/messaging');
        const { collection, addDoc, query, where, getDocs } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebaseConfig');
        
        const firebaseConfig = {
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCgxsEmC4G-5n9VSl7uRhSRIOebReN7-BU",
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "meteorit-indonesia.firebaseapp.com",
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "meteorit-indonesia",
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "meteorit-indonesia.firebasestorage.app",
          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "83461705969",
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:83461705969:web:778621d5f596662357d950"
        };
        
        const app = initializeApp(firebaseConfig);
        const messaging = getMessaging(app);
        
        const token = await getToken(messaging, {
          serviceWorkerRegistration: registration,
          vapidKey: 'BHG4GE88B9uwBvUevktVh_PiawkyPRTa-SnvpzUpqjVFXBg6IF4b-BWfoJtx28Abs0ZyG5urcTcvtOr7s8dPQ4o'
        });
        
        if (token) {
          const q = query(collection(db, 'fcm_tokens'), where('token', '==', token));
          const snap = await getDocs(q);
          if (snap.empty) {
            await addDoc(collection(db, 'fcm_tokens'), {
              token,
              createdAt: new Date().toISOString(),
              platform: 'web_pwa_miniapp'
            });
          }
          alert('Notifikasi push berhasil diaktifkan!');
        }
      } else {
        alert('Izin notifikasi ditolak.');
      }
    } catch (err) {
      console.error('[Web Push] Gagal berlangganan:', err);
      alert('Gagal mengaktifkan notifikasi: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setPushLoading(false);
    }
  };

  // Geolocation Handler
  const requestGpsLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsData({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        });
        setGpsManual({
          lat: pos.coords.latitude.toFixed(4),
          lon: pos.coords.longitude.toFixed(4)
        });
        if (pos.coords.altitude) {
          setAltitude(Math.round(pos.coords.altitude).toString());
        }
        setGpsLoading(false);
        // Load weather based on coordinates
        fetchWeatherData(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Hook to bind stream when videoRef becomes available in the DOM
  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current) {
      try {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play().catch(e => {
          console.warn("Failed to play video stream automatically:", e);
        });
      } catch (e) {
        console.error("Failed to bind stream to video element:", e);
      }
    }
  }, [cameraActive]);

  // Camera Handlers
  const startCamera = async () => {
    setCameraError(null);
    console.log('Attempting to initialize camera. Protocol:', typeof window !== 'undefined' ? window.location.protocol : 'unknown');
    
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const isNotHttps = typeof window !== 'undefined' && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
      const errMsg = isNotHttps 
        ? 'Akses kamera diblokir karena halaman tidak dimuat via HTTPS. Silakan gunakan koneksi HTTPS aman.'
        : 'Browser ini tidak mendukung akses kamera langsung (API MediaDevices tidak tersedia).';
      console.error(errMsg);
      setCameraError(errMsg);
      return;
    }

    try {
      const constraints = {
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      };
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (e) {
        console.warn('Failed to get rear camera, trying fallback to any webcam...', e);
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } }
        });
      }
      
      streamRef.current = stream;
      setCameraActive(true);
    } catch (err: any) {
      console.error('Camera access failed with error:', err);
      const isNotHttps = typeof window !== 'undefined' && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
      let friendlyMessage = 'Gagal mengakses kamera. Silakan pastikan izin kamera diaktifkan atau Anda dapat mengunggah foto dari galeri.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        friendlyMessage = 'Izin akses kamera ditolak. Silakan berikan izin kamera pada browser/aplikasi Telegram Anda.';
      } else if (isNotHttps) {
        friendlyMessage = 'Gagal mengakses kamera. Diperlukan koneksi HTTPS aman untuk membuka kamera di perangkat HP jaringan lokal.';
      }
      setCameraError(friendlyMessage);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsWatermarking(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    // Set canvas dimensions to video frame size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Apply Watermark overlay
    applyWatermarkToCanvas(canvas, ctx);

    // Convert canvas to image url
    const imgUrl = canvas.toDataURL('image/jpeg', 0.85);
    setWatermarkedImage(imgUrl);
    setIsWatermarking(false);
    stopCamera();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Resize canvas to image size
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        // Draw uploaded image
        ctx.drawImage(img, 0, 0);

        // Watermark it
        applyWatermarkToCanvas(canvas, ctx);

        const imgUrl = canvas.toDataURL('image/jpeg', 0.85);
        setWatermarkedImage(imgUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const applyWatermarkToCanvas = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
    const latText = gpsData ? gpsData.lat.toFixed(6) : parseFloat(gpsManual.lat).toFixed(6);
    const lonText = gpsData ? gpsData.lon.toFixed(6) : parseFloat(gpsManual.lon).toFixed(6);
    const now = new Date();
    const timeText = now.toLocaleString('id-ID', { hour12: false }) + ' WIB';
    
    const pad = Math.round(canvas.width * 0.03);
    const fontSize = Math.round(canvas.width * 0.026);
    const boxHeight = Math.round(fontSize * 6.5);
    
    // Draw bottom metadata banner background with translucent dark fill
    ctx.fillStyle = 'rgba(2, 6, 23, 0.75)';
    ctx.fillRect(0, canvas.height - boxHeight, canvas.width, boxHeight);
    
    // Draw border separator on top of metadata box
    ctx.strokeStyle = '#0ea5e9'; // Cyan border
    ctx.lineWidth = Math.max(1, Math.round(canvas.width * 0.003));
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - boxHeight);
    ctx.lineTo(canvas.width, canvas.height - boxHeight);
    ctx.stroke();

    // Draw text coordinates and info
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${fontSize}px sans-serif`;
    
    // Title Line (Logo / Name)
    ctx.fillStyle = '#0ea5e9'; // Cyan Accent
    ctx.fillText('🪨 METEORIT INDONESIA FINDER', pad, canvas.height - boxHeight + fontSize * 1.5);
    
    // Metadata lines
    ctx.fillStyle = '#f8fafc';
    ctx.font = `${fontSize * 0.85}px monospace`;
    ctx.fillText(`GPS KOORDINAT: Lat ${latText}, Lon ${lonText}`, pad, canvas.height - boxHeight + fontSize * 3.1);
    ctx.fillText(`WAKTU TEMUAN : ${timeText}`, pad, canvas.height - boxHeight + fontSize * 4.4);
    
    const directionStr = getDirectionLabel(Number(direction));
    ctx.fillText(`KETINGGIAN   : ${altitude} mdpl | ARAH: ${direction}° (${directionStr})`, pad, canvas.height - boxHeight + fontSize * 5.6);
  };

  const getDirectionLabel = (heading: number) => {
    const directions = ['UTARA', 'TIMUR LAUT', 'TIMUR', 'TENGGARA', 'SELATAN', 'BARAT DAYA', 'BARAT', 'BARAT LAUT'];
    const index = Math.round(((heading % 360) / 45)) % 8;
    return directions[index];
  };

  // Impact Calculator Handler
  const handleCalculateImpact = (e: React.FormEvent) => {
    e.preventDefault();
    const mass = parseFloat(calcInput.mass);
    const velocity = parseFloat(calcInput.velocity); // km/s
    const angle = parseFloat(calcInput.angle);
    const target = calcInput.target;

    if (isNaN(mass) || isNaN(velocity) || isNaN(angle)) return;

    // Convert velocity to m/s
    const vMs = velocity * 1000;
    // Kinetic Energy: E = 0.5 * m * v^2 (Joules)
    const energyJoules = 0.5 * mass * vMs * vMs;
    // Convert Joules to Megatons (1 Megaton TNT = 4.184e15 Joules)
    const energyMt = energyJoules / 4.184e15;

    // Crater diameter scaling estimation (simplified scaling law)
    // D = 1.2 * (E_Joules)^0.25 * sin(angle)^0.33 * scaling_factor
    let targetFactor = 1.0;
    if (target === 'soil') targetFactor = 1.25;
    if (target === 'water') targetFactor = 1.5;

    const angleRad = (angle * Math.PI) / 180;
    const craterDiameter = 0.015 * Math.pow(energyJoules, 0.25) * Math.pow(Math.sin(angleRad), 0.33) * targetFactor; // km

    // Assessment description
    let level = '';
    let description = '';

    const levels = {
      id: {
        safe: 'Aman (Mikrometeorit)',
        low: 'Rendah (Ledakan Udara)',
        med: 'Sedang (Kerusakan Regional)',
        high: 'Bahaya Tinggi (Kerusakan Global)'
      },
      en: {
        safe: 'Safe (Micrometeorite)',
        low: 'Low (Airburst)',
        med: 'Moderate (Regional Damage)',
        high: 'High Danger (Global Catastrophe)'
      },
      ms: {
        safe: 'Selamat (Mikrometeorit)',
        low: 'Rendah (Letupan Udara)',
        med: 'Sederhana (Kerosakan Serantau)',
        high: 'Bahaya Tinggi (Bencana Global)'
      },
      zh: {
        safe: '安全 (微陨石)',
        low: '较低风险 (空爆)',
        med: '中等风险 (区域性破坏)',
        high: '极高危险 (全球性灾难)'
      },
      ja: {
        safe: '安全 (微小隕石)',
        low: '低い危険度 (空中爆発)',
        med: '中程度の危険度 (局所的損害)',
        high: '極めて高い危険度 (地球規模の災害)'
      }
    };

    const descs = {
      id: {
        safe: 'Objek berukuran kecil ini akan terbakar habis di atmosfer dan meninggalkan debu meteorik halus.',
        low: 'Menghasilkan bola api terang dan dentuman sonik kuat di langit. Kemungkinan serpihan kecil jatuh ke permukaan.',
        med: 'Ledakan dahsyat serupa meteor Chelyabinsk atau Tunguska. Kaca jendela pecah, pohon-pohon rata, dan memicu kawah lokal.',
        high: 'Hantaman hebat dapat memicu bencana global, kawah raksasa, gempa bumi tektonik, tsunami masif (jika jatuh di laut), dan kegelapan atmosfer.'
      },
      en: {
        safe: 'This small object will burn up completely in the atmosphere, leaving only fine meteoric dust.',
        low: 'Produces a bright fireball and strong sonic boom in the sky. Small fragments may fall to the surface.',
        med: 'Powerful airburst similar to the Chelyabinsk or Tunguska meteor. Shatters glass, flattens trees, and leaves a local crater.',
        high: 'Severe impact that could trigger global disaster, a giant crater, tectonic earthquakes, massive tsunamis (if in ocean), and atmospheric blackout.'
      },
      ms: {
        safe: 'Objek kecil ini akan terbakar sepenuhnya di atmosfera, meninggalkan debu meteorik yang halus.',
        low: 'Menghasilkan bola api terang dan letupan sonik kuat di langit. Serpihan kecil berpotensi jatuh ke permukaan.',
        med: 'Letupan udara kuat serupa meteor Chelyabinsk atau Tunguska. Memecahkan tingkap kaca, menumbangkan pokok, dan meninggalkan kawah tempatan.',
        high: 'Hantaman hebat boleh mencetuskan bencana global, kawah gergasi, gempa bumi tektonik, tsunami besar (jika jatuh di laut), dan kegelapan atmosfera.'
      },
      zh: {
        safe: '该微小物体将在大气层中完全烧毁，仅留下微细的流星尘埃。',
        low: '在空中产生明亮的火球和强烈的音爆。可能有微小碎片坠落到地表。',
        med: '类似于车里雅宾斯克或通古斯大爆炸的强力空爆。会导致窗户破碎、树木倒塌，并形成局部撞击坑。',
        high: '极其严重的撞击，可能引发全球性灾难、形成巨型陨石坑、引发板块地震、海啸（如坠入海洋）以及大气层长期变黑遮蔽阳光。'
      },
      ja: {
        safe: 'この小さな物体は天体突入時に大気圏で完全に燃え尽き、微細な流星塵だけを残します。',
        low: '空で明るい火球と強力な衝撃音を生成します。小さな破片が地表に落下する可能性があります。',
        med: 'チェリャビンスク隕石やツングースカ大爆発と同様の強力な空中爆発です。ガラス窓を砕き、森林をなぎ倒し、局所的なクレーターを形成します。',
        high: '地球規模の災害、巨大クレーターの形成、大地震、大津波（海に落下した場合）、大気汚染による太陽光遮断による地球の寒冷化を引き起こす恐れがあります。'
      }
    };

    const l = (levels as any)[language] || levels['en'];
    const d = (descs as any)[language] || descs['en'];

    if (energyMt < 0.001) {
      level = l.safe;
      description = d.safe;
    } else if (energyMt >= 0.001 && energyMt < 0.1) {
      level = l.low;
      description = d.low;
    } else if (energyMt >= 0.1 && energyMt < 50) {
      level = l.med;
      description = d.med;
    } else {
      level = l.high;
      description = d.high;
    }

    setCalcResult({
      energyMt,
      craterDiameter,
      level,
      description
    });
  };

  // Verification Form Submit
  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyForm.name || !verifyForm.description) return;
    setVerifySuccess(true);
    setVerifyForm({ name: '', email: '', weight: '', location: '', description: '' });
    setVerifyImage(null);
  };

  // Filter content
  const getFilteredItems = () => {
    let list: any[] = [];

    // Filter 1: Glosarium
    if (selectedFilter === 'semua' || selectedFilter === 'glosarium') {
      const glossaryMapped = (data.glossary || []).map(g => {
        const cacheKey = `${g.id}_${language}`;
        const cached = glossaryTransCache[cacheKey];
        return {
          ...g,
          _type: 'glosarium',
          _title: cached?.term || g.term?.[language] || g.term?.id || g.term?.en || 'Istilah',
          _desc: cached?.definition || g.definition?.[language] || g.definition?.id || g.definition?.en || ''
        };
      });
      list = [...list, ...glossaryMapped];
    }

    // Filter 2: Astronot
    if (selectedFilter === 'semua' || selectedFilter === 'astronot') {
      const astronautMapped = (data.astronauts || []).map(a => {
        const cacheKey = `${a.id}_${language}`;
        const cached = astronautTransCache[cacheKey];
        return {
          ...a,
          _type: 'astronot',
          _title: a.name,
          _desc: cached?.biography || a.biography || ''
        };
      });
      list = [...list, ...astronautMapped];
    }

    // Filter 3: Articles (Blog, Komet, Peristiwa, Fireball, Gallery APOD)
    const articlesFiltered = (data.articles || []).filter(art => {
      const cat = art.category?.toLowerCase() || '';
      
      if (selectedFilter === 'blog') {
        return ['panduan', 'sejarah', 'edukasi', 'trivia', 'peristiwa'].includes(cat) || !cat;
      }
      if (selectedFilter === 'komet') {
        return cat.includes('komet') || cat.includes('asteroid');
      }
      if (selectedFilter === 'peristiwa') {
        return cat.includes('peristiwa alam') || cat.includes('eonet');
      }
      if (selectedFilter === 'fireball') {
        return cat.includes('bola api') || cat.includes('fireball');
      }
      if (selectedFilter === 'gallery-apod') {
        return cat === 'galeri apod';
      }
      return selectedFilter === 'semua';
    }).map(art => {
      const cacheKey = `${art.id}_${language}`;
      const cached = articleTransCache[cacheKey];
      const trans = (art.translations?.[language] || {}) as any;
      const fallbackEn = art.translations?.['en'] || {};

      let title = art.title;
      let excerpt = art.excerpt || '';
      let content = art.content || '';

      if (language !== 'id') {
        title = cached?.title || trans.title || fallbackEn.title || art.title;
        excerpt = cached?.excerpt || trans.excerpt || fallbackEn.excerpt || art.excerpt || '';
        content = cached?.content || trans.content || fallbackEn.content || art.content || '';
      }

      return {
        ...art,
        _type: 'artikel',
        _title: title,
        _desc: excerpt,
        content: content
      };
    });

    list = [...list, ...articlesFiltered];

    // Filter 4: Katalog Meteorit
    if (selectedFilter === 'semua' || selectedFilter === 'meteorites') {
      const meteoritesMapped = (data.meteorites || []).map(m => {
        const trans = (m.translations?.[language] || {}) as any;
        const fallbackEnName = m.translations?.['en']?.name || '';
        // Untuk semua bahasa: pakai translated_description (teks panjang ID) sebagai fallback terbaik
        // Terjemahan on-demand akan menggantikan ini saat item dipilih via resolvedItem
        let desc: string;
        if (language === 'id') {
          desc = m.translated_description || m.description || '';
        } else {
          // Coba terjemahan bahasa target, lalu fallback ke teks panjang Indonesia
          desc = trans.description || m.translated_description || m.description || '';
        }
        const title = trans.name || fallbackEnName || m.translated_name || m.name || '';
        const cat = language === 'zh' ? '陨石目录' : language === 'ja' ? '隕石カタログ' : (language === 'ru' || language === 'fr' || language === 'en') ? 'Meteorite Catalog' : language === 'ms' ? 'Katalog Meteorit' : 'Katalog Meteorit';
        return {
          ...m,
          _type: 'meteorit',
          _title: title,
          _desc: desc,
          category: cat
        };
      });
      list = [...list, ...meteoritesMapped];
    }

    // Apply search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(item => 
        item._title?.toLowerCase().includes(q) || 
        item._desc?.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q)
      );
    }

    return list;
  };

  const filteredItems = getFilteredItems();

  // Batch Translator for List Items (Visible Cards)
  useEffect(() => {
    const loc = language;
    if (loc === 'id') return;

    let isMounted = true;

    // Ambil 4 item peringatan langit terbaru
    const skyAlertsItems = data.articles.filter(a => {
      const cat = a.category?.toLowerCase() || '';
      return cat.includes('bola api') || cat.includes('fireball') || cat.includes('peristiwa alam') || cat.includes('eonet');
    }).slice(0, 4).map(a => ({ ...a, _type: 'artikel' }));

    // Gabungkan dengan filteredItems dari search list
    const allItemsToTranslate = [...filteredItems, ...skyAlertsItems];

    // Ambil maksimal 8 item teratas dari list yang belum diterjemahkan
    const pendingItems = allItemsToTranslate
      .filter(item => {
        const cacheKey = `${item.id}_${loc}`;
        if (item._type === 'glosarium') {
          return !item.term?.[loc] && !glossaryTransCache[cacheKey];
        }
        if (item._type === 'artikel') {
          const trans = item.translations?.[loc];
          const isFallback = trans?.content && (
            trans.content.includes('terjemahan otomatis') || 
            trans.content.includes('belum tersedia') || 
            trans.content.startsWith('Catatan:')
          );
          const needsTranslate = !trans?.title || !trans?.content || isFallback;
          return needsTranslate && !articleTransCache[cacheKey];
        }
        if (item._type === 'astronot') {
          return !astronautTransCache[cacheKey];
        }
        return false;
      })
      .slice(0, 8);

    if (pendingItems.length === 0) return;

    const translateBatch = async () => {
      for (const item of pendingItems) {
        if (!isMounted) break;
        const cacheKey = `${item.id}_${loc}`;

        if (item._type === 'glosarium') {
          try {
            const res = await fetch(`/api/glossary/translate?id=${encodeURIComponent(item.id)}&locale=${loc}`);
            if (res.ok && isMounted) {
              const data = await res.json();
              if (data.term && data.definition) {
                setGlossaryTransCache(prev => ({
                  ...prev,
                  [cacheKey]: {
                    term: data.term,
                    definition: data.definition,
                    example: data.example || item.example?.id || ''
                  }
                }));
              }
            }
          } catch (e) {
            console.warn('Failed batch translate glossary:', e);
          }
        }

        if (item._type === 'artikel') {
          try {
            const cat = item.category?.toLowerCase() || '';
            let coll = 'articles';

            if (cat.includes('komet') || cat.includes('asteroid')) {
              coll = 'komet_articles';
            } else if (cat.includes('bola api') || cat.includes('fireball')) {
              coll = 'fireball_articles';
            } else if (cat.includes('peristiwa alam') || cat.includes('eonet')) {
              coll = 'eonet_articles';
            } else if (cat.includes('mars') || cat.includes('planet mars')) {
              coll = 'mars_articles';
            }

            const res = await fetch(`/api/articles/translate?id=${encodeURIComponent(item.id)}&locale=${loc}&collection=${coll}`);
            if (res.ok && isMounted) {
              const data = await res.json();
              if (data.title && data.excerpt) {
                setArticleTransCache(prev => ({
                  ...prev,
                  [cacheKey]: {
                    title: data.title,
                    excerpt: data.excerpt,
                    content: data.content
                  }
                }));
              }
            }
          } catch (e) {
            console.warn('Failed batch translate article:', e);
          }
        }

        if (item._type === 'astronot') {
          try {
            const query = new URLSearchParams({
              slug: item.id,
              locale: loc,
              biography: item.biography || '',
              role: item.role || '',
              country: item.country || ''
            });
            const res = await fetch(`/api/astronot/translate?${query.toString()}`);
            if (res.ok && isMounted) {
              const data = await res.json();
              if (data.biography) {
                setAstronautTransCache(prev => ({
                  ...prev,
                  [cacheKey]: {
                    biography: data.biography,
                    role: data.role || item.role,
                    country: data.country || item.country
                  }
                }));
              }
            }
          } catch (e) {
            console.warn('Failed batch translate astronaut:', e);
          }
        }

        // Delay 800ms antar request agar tidak membebani rate limit Groq API
        await new Promise(resolve => setTimeout(resolve, 800));
      }
    };

    translateBatch();

    return () => {
      isMounted = false;
    };
  }, [filteredItems, language, glossaryTransCache, articleTransCache, astronautTransCache]);

  const resolvedItem = useMemo(() => {
    if (!selectedItem) return null;
    const item = { ...selectedItem };

    if (item._type === 'glosarium') {
      const cacheKey = `${item.id}_${language}`;
      const cached = glossaryTransCache[cacheKey];
      if (language === 'id') {
        item._title = item.term?.id || item.term?.en || item._title;
        item._desc = item.definition?.id || item.definition?.en || item._desc;
      } else {
        item._title = cached?.term || item.term?.[language] || item.term?.id || item.term?.en || item._title;
        item._desc = cached?.definition || item.definition?.[language] || item.definition?.id || item.definition?.en || item._desc;
      }
    } else if (item._type === 'meteorit') {
      const trans = (item.translations?.[language] || {}) as any;
      const fallbackEnName = item.translations?.['en']?.name || '';
      item._title = trans.name || fallbackEnName || item.translated_name || item.name || '';
      // Cek cache terjemahan on-demand terlebih dahulu
      const cacheKey = `${item.id}_${language}`;
      const cached = meteoriteTransCache[cacheKey];
      if (cached) {
        item._title = cached.name || item._title;
        item._desc = cached.description;
      } else if (language === 'id') {
        item._desc = item.translated_description || item.description || '';
      } else if (language === 'en') {
        item._desc = item.description || item.translated_description || '';
      } else {
        // Fallback ke terjemahan target, lalu ke deskripsi Inggris asli, baru ke Indonesia
        item._desc = trans.description || item.description || item.translated_description || '';
      }
    } else if (item._type === 'artikel') {
      const cacheKey = `${item.id}_${language}`;
      const cached = articleTransCache[cacheKey];
      const trans = item.translations?.[language] || {};
      const fallbackEn = item.translations?.['en'] || {};
      
      if (language === 'id') {
        item._title = item.title;
        item._desc = item.excerpt || '';
        item.content = item.content || '';
      } else {
        item._title = cached?.title || trans.title || fallbackEn.title || item.title || item._title;
        item._desc = cached?.excerpt || trans.excerpt || fallbackEn.excerpt || item.excerpt || item._desc;
        item.content = cached?.content || trans.content || fallbackEn.content || item.content || '';
      }
    } else if (item._type === 'astronot') {
      const cacheKey = `${item.id}_${language}`;
      const cached = astronautTransCache[cacheKey];
      if (cached) {
        item.country = cached.country;
        item.role = cached.role;
        item._desc = cached.biography;
      }
    }
    return item;
  }, [selectedItem, language, astronautTransCache, meteoriteTransCache, glossaryTransCache, articleTransCache]);

  return (
    <div className={`w-full max-w-md mx-auto shadow-2xl flex flex-col font-sans transition-all ${
      isDayMode ? 'theme-light bg-white text-black' : 'bg-slate-950 text-white'
    }`} style={{ height: '100dvh', minHeight: '-webkit-fill-available' }}>
      {/* Premium Opening Meteor Flying Splash Screen Animation */}
      {showMeteorAnim && (
        <div className={`meteor-splash pointer-events-none ${meteorFade ? 'opacity-0' : 'opacity-100'}`}>
          <div className="meteor-projectile" />
          <div className="text-center space-y-4 animate-pulse">
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              <img src="/logo.png" alt="Logo" className="w-16 h-16 object-contain z-10" />
              <div className="absolute inset-0 bg-cyan-500/10 rounded-full blur-xl animate-ping" />
            </div>
            <h2 className="text-lg font-black tracking-widest text-cyan-400 font-mono uppercase bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-indigo-300">
              METEORIT INDONESIA
            </h2>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
              {language === 'zh' ? '正在探索宇宙...' : language === 'ja' ? '宇宙を探索中...' : language === 'ru' ? 'ИССЛЕДУЕМ ВСЕЛЕННУЮ...' : language === 'fr' ? 'EXPLORATION DE L\'UNIVERS...' : language === 'en' ? 'EXPLORING THE UNIVERSE...' : 'MENJELAJAHI ALAM SEMESTA...'}
            </p>
          </div>
        </div>
      )}
      {/* CSS Overrides untuk Mode Siang */}
      <style dangerouslySetInnerHTML={{ __html: `
        .theme-light {
          background-color: #ffffff !important;
          color: #0f172a !important;
        }
        .theme-light header {
          background-color: #ffffff !important;
          border-color: #e2e8f0 !important;
        }
        .theme-light header h1 {
          background: none !important;
          color: #0f172a !important;
          -webkit-text-fill-color: unset !important;
        }
        .theme-light header p {
          color: #475569 !important;
        }
        .theme-light main {
          background-color: #ffffff !important;
        }
        /* Mengubah semua background card abu-abu menjadi putih bersih (#ffffff) sesuai permintaan */
        .theme-light .bg-slate-900,
        .theme-light .bg-slate-900\\/80,
        .theme-light .bg-slate-900\\/60,
        .theme-light .bg-slate-900\\/40,
        .theme-light .bg-slate-900\\/60:hover,
        .theme-light .bg-slate-900\\/40:hover,
        .theme-light .dashboard-card,
        .theme-light .dashboard-card:hover {
          background-color: #ffffff !important;
          border-color: #cbd5e1 !important;
          color: #0f172a !important;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03) !important;
        }
        .theme-light .bg-slate-950,
        .theme-light .bg-slate-950\\/80,
        .theme-light .bg-slate-950\\/50,
        .theme-light .bg-slate-950\\/45,
        .theme-light .bg-slate-950\\/90,
        .theme-light .bg-slate-950\\/80,
        .theme-light .bg-slate-950\\/60 {
          background-color: #ffffff !important;
          border-color: #cbd5e1 !important;
          color: #0f172a !important;
        }
        .theme-light .text-white,
        .theme-light .text-slate-100,
        .theme-light .text-slate-200,
        .theme-light .text-slate-350,
        .theme-light .text-slate-300 {
          color: #0f172a !important;
        }
        .theme-light .text-slate-400 {
          color: #334155 !important;
        }
        .theme-light .text-slate-500 {
          color: #64748b !important;
        }
        .theme-light .border-slate-800,
        .theme-light .border-slate-850 {
          border-color: #cbd5e1 !important;
        }
        .theme-light input,
        .theme-light textarea,
        .theme-light select {
          background-color: #ffffff !important;
          border-color: #cbd5e1 !important;
          color: #0f172a !important;
        }
        .theme-light select option {
          background-color: #ffffff !important;
          color: #0f172a !important;
        }
        .theme-light nav {
          background-color: #ffffff !important;
          border-color: #cbd5e1 !important;
        }
        .theme-light nav button span {
          color: #64748b !important;
        }
        .theme-light nav button span.text-cyan-400,
        .theme-light nav button .text-cyan-400 {
          color: #0891b2 !important;
        }
        .theme-light nav button svg {
          color: #64748b !important;
        }
        .theme-light nav button svg.text-cyan-400 {
          color: #0891b2 !important;
        }
        .theme-light .hover\\:bg-slate-900:hover {
          background-color: #f1f5f9 !important;
        }
        .theme-light .border-slate-800\\/80 {
          border-color: #cbd5e1 !important;
        }
        .theme-light .bg-sky-950\\/50 {
          background-color: #e0f2fe !important;
          color: #0369a1 !important;
        }
        .theme-light .bg-purple-950 {
          background-color: #f3e8ff !important;
          color: #7e22ce !important;
        }
        .theme-light .bg-cyan-950 {
          background-color: #ecfeff !important;
          color: #0e7490 !important;
        }
        .theme-light .bg-orange-500\\/10 {
          background-color: #ffedd5 !important;
          color: #c2410c !important;
        }
        .theme-light .bg-red-500\\/10 {
          background-color: #fee2e2 !important;
          color: #b91c1c !important;
        }
        .theme-light .bg-slate-900:not(header):not(nav) {
          background-color: #ffffff !important;
        }
        .theme-light .bg-slate-900.border-t.border-slate-800 {
          background-color: #ffffff !important;
          border-color: #cbd5e1 !important;
        }
        .theme-light .bg-slate-900.border.border-slate-850 {
          background-color: #ffffff !important;
          border-color: #cbd5e1 !important;
        }
        /* Peringatan langit banner override */
        .theme-light .bg-red-950\\/40,
        .theme-light .bg-red-950 {
          background-color: #fee2e2 !important;
          border-color: #fca5a5 !important;
          color: #b91c1c !important;
        }
        .theme-light .text-red-400 {
          color: #b91c1c !important;
        }
        .theme-light .text-red-300\\/70 {
          color: #7f1d1d !important;
        }
        .theme-light .hazard-card {
          background-color: #fef2f2 !important;
          border-color: #fca5a5 !important;
        }
        .theme-light .orbit-dot {
          background-color: #0891b2 !important;
        }
        @keyframes meteor-fly {
          0% {
            transform: translate(380px, -380px) rotate(-45deg);
            opacity: 0;
          }
          8% {
            opacity: 1;
          }
          88% {
            opacity: 1;
          }
          100% {
            transform: translate(-550px, 550px) rotate(-45deg);
            opacity: 0;
          }
        }
        @keyframes meteor-sparkle {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 35px rgba(239, 68, 68, 1)) drop-shadow(0 0 60px rgba(249, 115, 22, 0.9)) drop-shadow(0 0 90px rgba(254, 240, 138, 0.6)); }
          50% { transform: scale(1.5); filter: drop-shadow(0 0 50px rgba(249, 115, 22, 1)) drop-shadow(0 0 90px rgba(254, 240, 138, 1)) drop-shadow(0 0 120px rgba(239, 68, 68, 0.8)); }
        }
        @keyframes fireball-pulse {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        .meteor-splash {
          position: fixed;
          inset: 0;
          z-index: 100;
          background-color: #020617;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          transition: opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .meteor-projectile {
          position: absolute;
          width: 320px;
          height: 10px;
          background: linear-gradient(90deg, rgba(239,68,68,0) 0%, rgba(220,38,38,0.4) 20%, rgba(249,115,22,1) 55%, rgba(254,240,138,1) 100%);
          border-radius: 999px;
          box-shadow: 0 0 20px rgba(249,115,22,0.6), 0 0 40px rgba(239,68,68,0.4);
          animation: meteor-fly 5s cubic-bezier(0.15, 0.8, 0.4, 1) forwards;
        }
        .meteor-projectile::before {
          content: '';
          position: absolute;
          left: 0;
          top: -3px;
          width: 60%;
          height: 16px;
          background: linear-gradient(90deg, rgba(239,68,68,0) 0%, rgba(239,68,68,0.3) 100%);
          border-radius: 999px;
          filter: blur(6px);
        }
        .meteor-projectile::after {
          content: '';
          position: absolute;
          right: -8px;
          top: -18px;
          width: 44px;
          height: 44px;
          background: radial-gradient(circle, #ffffff 0%, #fff7ed 15%, #fef08a 35%, #f97316 60%, rgba(239,68,68,0.3) 85%, transparent 100%);
          border-radius: 50%;
          box-shadow: 0 0 30px 8px #facc15, 0 0 60px 16px #f97316, 0 0 100px 24px #ef4444, 0 0 140px 32px rgba(239,68,68,0.3);
          animation: meteor-sparkle 0.4s infinite alternate;
        }
      ` }} />

      {/* Script Telegram WebApp SDK */}
      <Script 
        src="https://telegram.org/js/telegram-web-app.js" 
        strategy="afterInteractive"
        onLoad={handleTgInit}
      />

      {/* HEADER MINI APP */}
      <header className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between sticky top-0 z-40">
        <a href="/" className="flex items-center gap-2 hover:opacity-85 transition-opacity">
          <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-slate-950/40 border border-slate-800">
            <img src="/logo.png" alt="Meteorit Indonesia Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-indigo-300">
              METEORIT INDONESIA
            </h1>
            <p className="text-[10px] text-slate-400">
              {tgUser ? `${language === 'zh' ? '您好' : language === 'ja' ? 'こんにちは' : language === 'en' ? 'Hello' : 'Halo'}, ${tgUser.first_name || tgUser.username}` : 'PWA Portable Dashboard'}
            </p>
          </div>
        </a>
        <div className="flex items-center gap-2">
          {/* Home Link */}
          <a
            href="/"
            className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700/50 text-slate-300 hover:text-white rounded-lg transition-all flex items-center justify-center shadow-sm"
            style={{ width: '28px', height: '28px' }}
            title="Kembali ke Beranda / Back to Home"
          >
            <Home className="w-3.5 h-3.5" />
          </a>

          {isOffline && (
            <span className="text-[9px] bg-red-950 border border-red-800 text-red-300 px-2 py-0.5 rounded-full font-bold">
              {curT.offlineBadge}
            </span>
          )}
          
          {/* Pemilih Bahasa */}
          <div className="relative">
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700/50 text-slate-300 rounded-lg transition-all text-[11px] font-black tracking-wider flex items-center gap-1"
              style={{ height: '28px' }}
              title="Pilih Bahasa / Select Language"
            >
              <span>🌐</span>
              <span className="uppercase">{language}</span>
            </button>
            
            {langMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setLangMenuOpen(false)}
                />
                <div className="absolute right-0 mt-1.5 w-36 bg-slate-900 border border-slate-800 rounded-lg shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-100">
                  {languageOptions.map((opt) => (
                    <button
                      key={opt.code}
                      onClick={() => {
                        handleLanguageChange(opt.code);
                        setLangMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs transition-all flex items-center justify-between hover:bg-slate-800/80 ${
                        language === opt.code 
                          ? 'text-cyan-400 bg-cyan-950/20 font-black' 
                          : 'text-slate-300 hover:text-slate-100 font-medium'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {language === opt.code && <span className="text-[10px]">✓</span>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Tombol Switcher Mode Siang / Malam */}
          <button 
            onClick={() => setIsDayMode(!isDayMode)}
            className={`p-1.5 rounded-lg border transition-all text-xs flex items-center justify-center`}
            style={{ width: '28px', height: '28px' }}
            title={isDayMode ? "Aktifkan Mode Malam" : "Aktifkan Mode Siang"}
          >
            {isDayMode ? '🌙' : '☀️'}
          </button>

          <button 
            onClick={() => fetchMiniAppData(true)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg transition-all"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* CORE LOADING STATE */}
      {loading && !data.apod && (
        <div className="flex-grow flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
          <p className="text-xs text-slate-400">{curT.loadingText}</p>
        </div>
      )}

      {/* APP VIEWS BASED ON TAB - Scrollable area */}
      <main className="flex-1 overflow-y-auto p-4" style={{ WebkitOverflowScrolling: 'touch' }}>
        {error && !data.apod && (
          <div className="bg-red-950/40 border border-red-900/50 p-4 rounded-xl text-center text-xs text-red-300 my-8">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-red-400" />
            <p className="font-bold">{curT.errorTitle}</p>
            <p className="mt-1">{error}</p>
            <button 
              onClick={() => fetchMiniAppData(true)}
              className="mt-3 px-4 py-1.5 bg-red-900/80 hover:bg-red-800 rounded-lg font-bold text-white transition-all"
            >
              {curT.tryAgain}
            </button>
          </div>
        )}

        {/* TAB 1: RADAR SPACE */}
        {activeTab === 'radar' && data.iss && (
          <div className="space-y-4 animate-fadeIn">
            {/* Live ISS Card */}
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <h2 className="text-xs font-black text-cyan-400 tracking-wider uppercase">{curT.issTrackerTitle}</h2>
                </div>
                <span className="text-[10px] text-green-400 font-bold bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                  {curT.activeBadge}
                </span>
              </div>

              {/* Dynamic Leaflet Map */}
              <div className="h-44 rounded-xl overflow-hidden relative">
                <ISSMap position={data.iss} history={[]} />
              </div>

              {/* Coordinates Grid */}
              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2">
                  <p className="text-[9px] text-slate-500 font-bold uppercase">{curT.latitude}</p>
                  <p className="font-mono font-bold text-cyan-300 mt-0.5">{data.iss.latitude.toFixed(4)}°</p>
                </div>
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2">
                  <p className="text-[9px] text-slate-500 font-bold uppercase">{curT.longitude}</p>
                  <p className="font-mono font-bold text-cyan-300 mt-0.5">{data.iss.longitude.toFixed(4)}°</p>
                </div>
              </div>
            </div>

            {/* Promo Card linking to Weather PWA */}
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 space-y-3 text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-base">☁️</span>
                <h3 className="text-xs font-black text-cyan-400 tracking-wider uppercase">
                  {language === 'zh' ? 'BMKG 天气与夜空预测 PWA' :
                   language === 'ja' ? 'BMKG 天気＆夜空予報 PWA' :
                   language === 'en' ? 'BMKG Weather & Night Sky PWA' :
                   language === 'ms' ? 'PWA Cuaca & Langit Malam BMKG' :
                   language === 'ru' ? 'PWA погоды и ночного неба BMKG' :
                   language === 'fr' ? 'PWA météo et ciel nocturne BMKG' :
                   'PWA Cuaca & Langit Malam BMKG'}
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {language === 'zh' ? '监测实时天气、星空云量预测、月相、BMKG灾害预警和空间天气 data。' :
                 language === 'ja' ? 'リアルタイム天気、星空雲量予報、月相、BMKG警報、宇宙天気データを追跡。' :
                 language === 'en' ? 'Track real-time weather, cloud star-gazing forecasts, moon phases, BMKG disaster warnings, and space weather.' :
                 language === 'ms' ? 'Pantau cuaca masa nyata, ramalan awan bintang, fasa bulan, amaran ekstrem BMKG, dan cuaca antariksa.' :
                 language === 'ru' ? 'Отслеживайте погоду, прогноз облачности, фазы луны, предупреждения BMKG и космическую погоду.' :
                 language === 'fr' ? 'Suivez la météo, les prévisions de couverture nuageuse, les phases de la lune, les alertes BMKG et la météo spatiale.' :
                 'Pantau cuaca real-time, prakiraan awan untuk observasi bintang, fase bulan, peringatan cuaca ekstrem BMKG, dan data cuaca antariksa.'}
              </p>
              <a
                href="/cuaca"
                className="w-full text-center block bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 rounded-xl text-xs transition-all duration-300 shadow-sm"
              >
                {language === 'zh' ? '打开天气预报 PWA →' :
                 language === 'ja' ? '天気予報 PWA を開く →' :
                 language === 'en' ? 'Open Weather Forecast PWA →' :
                 language === 'ms' ? 'Buka Ramalan Cuaca PWA →' :
                 language === 'ru' ? 'Открыть прогноз погоды PWA →' :
                 language === 'fr' ? 'Ouvrir la prévision météo PWA →' :
                 'Buka Prakiraan Cuaca PWA →'}
              </a>
            </div>

            {/* Astronauts Count Card */}
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-purple-400 uppercase tracking-wider">{curT.astronautsTitle}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{curT.astronautsSub}</p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-purple-300 to-purple-600 font-mono">
                  {data.astronautCount || 10}
                </span>
                <span className="text-slate-400 text-xs font-bold ml-1">{curT.kru}</span>
              </div>
            </div>

            {/* SPACE MISSION CONTROL: LAUNCH COUNTDOWN */}
            {launch && (
              <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider">{curT.spaceControl}</span>
                  </div>
                  <span className="text-[9px] text-slate-400 font-bold">{launch.provider}</span>
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">{translatedRadar?.launch?.name || launch.name}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">{translatedRadar?.launch?.desc || launch.desc}</p>
                </div>
                
                {/* Countdown Display */}
                {countdown ? (
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-slate-950 border border-slate-850 p-2 rounded-xl">
                      <span className="block text-sm font-black text-amber-400 font-mono">{countdown.d}</span>
                      <span className="text-[8px] text-slate-500 font-bold uppercase">{curT.countdownDays}</span>
                    </div>
                    <div className="bg-slate-950 border border-slate-850 p-2 rounded-xl">
                      <span className="block text-sm font-black text-amber-400 font-mono">{String(countdown.h).padStart(2, '0')}</span>
                      <span className="text-[8px] text-slate-500 font-bold uppercase">{curT.countdownHours}</span>
                    </div>
                    <div className="bg-slate-950 border border-slate-850 p-2 rounded-xl">
                      <span className="block text-sm font-black text-amber-400 font-mono">{String(countdown.m).padStart(2, '0')}</span>
                      <span className="text-[8px] text-slate-500 font-bold uppercase">{curT.countdownMinutes}</span>
                    </div>
                    <div className="bg-slate-950 border border-slate-850 p-2 rounded-xl">
                      <span className="block text-sm font-black text-amber-400 font-mono">{String(countdown.s).padStart(2, '0')}</span>
                      <span className="text-[8px] text-slate-500 font-bold uppercase">{curT.countdownSeconds}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-2 text-slate-500 text-[10px]">{curT.countingDown}</div>
                )}
                
                <div className="text-[9px] text-slate-500 text-center">
                  {curT.targetNet}: {new Date(launch.net).toLocaleString(
                    language === 'id' ? 'id-ID' :
                    language === 'ms' ? 'ms-MY' :
                    language === 'zh' ? 'zh-CN' :
                    language === 'ja' ? 'ja-JP' :
                    language === 'ru' ? 'ru-RU' :
                    language === 'fr' ? 'fr-FR' :
                    'en-US',
                    { dateStyle: 'medium', timeStyle: 'short' }
                  )}
                </div>
              </div>
            )}

            {/* BMKG AUTOGEMPA (Gempa Bumi Terkini) */}
            {data.earthquake && (
              <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400">
                      {curT.earthquakeTitle}
                    </span>
                  </div>
                  {data.earthquake.magnitude >= 5.0 && (
                    <span className="text-[9px] bg-red-950 text-red-400 border border-red-800 px-1.5 py-0.5 rounded-full font-bold animate-pulse">
                      {curT.siagaMag}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-slate-950 border border-slate-850 p-2 rounded-xl">
                    <span className="text-[8px] text-slate-500 font-bold block uppercase">{curT.magnitude}</span>
                    <span className="text-sm font-black text-slate-100 font-mono">{data.earthquake.magnitude.toFixed(1)} SR</span>
                  </div>
                  <div className="bg-slate-950 border border-slate-850 p-2 rounded-xl">
                    <span className="text-[8px] text-slate-500 font-bold block uppercase">{curT.depth}</span>
                    <span className="text-xs font-black text-slate-200 font-mono">{data.earthquake.depth}</span>
                  </div>
                  <div className="bg-slate-950 border border-slate-850 p-2 rounded-xl">
                    <span className="text-[8px] text-slate-500 font-bold block uppercase">{curT.potensi}</span>
                    <span className="text-[9px] font-bold text-slate-300 leading-tight block mt-1">
                      {translatedRadar?.earthquake?.tsunamiPotential || data.earthquake.tsunamiPotential}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div>
                    <span className="text-[8px] text-slate-500 font-bold block">{curT.locationRegion}</span>
                    <span className="font-bold text-slate-200">
                      {translatedRadar?.earthquake?.region || data.earthquake.region}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[8px] text-slate-500 font-bold block">{curT.timeWib}</span>
                      <span className="text-[9px] font-mono text-slate-300">{data.earthquake.dateTime}</span>
                    </div>
                    <div>
                      <span className="text-[8px] text-slate-500 font-bold block">{curT.feltMmi}</span>
                      <span className="text-[9px] font-bold text-slate-300">
                        {translatedRadar?.earthquake?.felt || data.earthquake.felt || '-'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* LIVE WEATHER & WIND MONITOR (Cuaca & Angin) */}
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black text-cyan-400 uppercase tracking-wider">{curT.weatherTitle}</span>
                </div>
                <button 
                  onClick={requestGpsLocation} 
                  disabled={gpsLoading || weatherLoading}
                  className="text-[9px] text-cyan-400 font-bold bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-800/40 px-2 py-0.5 rounded-full transition-all"
                >
                  {gpsLoading ? curT.scanning : weatherLoading ? curT.loading : curT.scanWeather}
                </button>
              </div>

              {/* Weather search form */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (weatherSearchInput.trim()) {
                    fetchWeatherData(weatherSearchInput);
                  }
                }}
                className="flex gap-2"
              >
                <input 
                  type="text"
                  placeholder={curT.weatherPlaceholder}
                  value={weatherSearchInput}
                  onChange={(e) => setWeatherSearchInput(e.target.value)}
                  className="flex-grow pl-3 pr-2 py-1.5 bg-slate-950 border border-slate-850 focus:border-cyan-600 rounded-lg text-[10px] text-white placeholder-slate-500 outline-none transition-all"
                />
                <button 
                  type="submit"
                  disabled={weatherLoading}
                  className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-black text-[10px] font-black rounded-lg transition-all"
                >
                  {curT.searchBtn}
                </button>
              </form>

              {weather ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black text-slate-200">{weather.city || 'Lokasi Terpindai'}, {weather.country || 'ID'}</h4>
                      <p className="text-[10px] text-slate-400 capitalize mt-0.5">{curT.weatherCondition}: {weather.description}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-slate-100 font-mono">{weather.temp}°C</span>
                      <p className="text-[8px] text-slate-500 font-bold">{curT.feelsLike}: {weather.feels_like}°C</p>
                    </div>
                  </div>

                  {/* Weather Canvas Animation inside Miniapp Card */}
                  <div className="overflow-hidden rounded-xl">
                    <WeatherCanvas condition={weather.description} />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-slate-950 border border-slate-850 p-2 rounded-xl">
                      <span className="text-[8px] text-slate-500 font-bold block uppercase">{curT.windSpeed}</span>
                      <span className="text-xs font-black text-slate-200 font-mono">{weather.wind_speed} m/s</span>
                    </div>
                    <div className="bg-slate-950 border border-slate-850 p-2 rounded-xl">
                      <span className="text-[8px] text-slate-500 font-bold block uppercase">{curT.humidity}</span>
                      <span className="text-xs font-black text-slate-200 font-mono">{weather.humidity}%</span>
                    </div>
                    <div className="bg-slate-950 border border-slate-850 p-2 rounded-xl">
                      <span className="text-[8px] text-slate-500 font-bold block uppercase">{curT.clouds}</span>
                      <span className="text-xs font-black text-slate-200 font-mono">{weather.clouds}%</span>
                    </div>
                  </div>

                  {/* ENSO Status in Miniapp */}
                  {enso && (
                    <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl space-y-1 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Status ENSO Iklim</span>
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                          enso.status === 'El Niño' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                          enso.status === 'La Niña' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          'bg-green-500/10 text-green-400 border border-green-500/20'
                        }`}>
                          {enso.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-300 leading-relaxed">
                        {enso.description}
                      </p>
                      <div className="text-[8px] text-slate-500 flex justify-between pt-1">
                        <span>Anomali: {enso.nino34_anomaly >= 0 ? '+' : ''}{enso.nino34_anomaly.toFixed(2)} °C</span>
                        <span>Sumber: NOAA CPC</span>
                      </div>
                    </div>
                  )}

                  {/* Link to Full Weather PWA */}
                  <div className="pt-2">

                    <a 
                      href="/cuaca" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-black font-extrabold text-[10px] uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md"
                    >
                      <span>Buka PWA Cuaca Utama (Fitur Lengkap)</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-slate-500 text-xs">
                  {curT.fetchingWeather}
                </div>
              )}
            </div>

            {/* Fireball & Eonet Alerts Feed */}
            <div className="space-y-2">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider px-1">{curT.skyAlertsTitle}</h3>
              
              {data.articles.filter(a => {
                const cat = a.category?.toLowerCase() || '';
                return cat.includes('bola api') || cat.includes('fireball') || cat.includes('peristiwa alam') || cat.includes('eonet');
              }).slice(0, 4).map(a => {
                const cacheKey = `${a.id}_${language}`;
                const cached = articleTransCache[cacheKey];
                const trans = (a.translations?.[language] || {}) as any;
                const fallbackEn = a.translations?.['en'] || {};

                let title = a.title;
                let excerpt = a.excerpt || '';
                let content = a.content || '';

                if (language !== 'id') {
                  title = cached?.title || trans.title || fallbackEn.title || a.title;
                  excerpt = cached?.excerpt || trans.excerpt || fallbackEn.excerpt || a.excerpt || '';
                  content = cached?.content || trans.content || fallbackEn.content || a.content || '';
                }

                const alert = {
                  ...a,
                  title,
                  excerpt,
                  content
                };
                return (
                  <div 
                    key={alert.id}
                    onClick={() => setSelectedItem(alert)}
                    className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-cyan-950 rounded-xl p-3.5 flex items-start gap-3 transition-all cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-950 flex-shrink-0 border border-slate-800">
                      <img 
                        src={normalizeImageUrl(alert.image) || 'https://placehold.co/100x105/020617/f59e0b?text=Fireball'} 
                        alt="" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${
                          alert.category.includes('Bola Api') ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {language === 'zh' ? (alert.category.includes('Bola Api') ? '火球与陨石' : '自然事件') :
                           language === 'ja' ? (alert.category.includes('Bola Api') ? '火球レポート' : '自然イベント') :
                           language === 'ru' ? (alert.category.includes('Bola Api') ? 'Огненный шар' : 'Природное событие') :
                           language === 'fr' ? (alert.category.includes('Bola Api') ? 'Boule de feu' : 'Événement naturel') :
                           language === 'en' ? (alert.category.includes('Bola Api') ? 'Fireball' : 'Natural Event') :
                           language === 'ms' ? (alert.category.includes('Bola Api') ? 'Bola Api' : 'Peristiwa Alam') :
                           alert.category}
                        </span>
                        <span className="text-[8px] text-slate-500 font-bold">{alert.date}</span>
                      </div>
                      <p className="text-xs font-bold text-slate-200 mt-1 leading-tight">{alert.title}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{alert.excerpt}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600 mt-3 flex-shrink-0" />
                  </div>
                );
              })}
            </div>
            {/* Safe spacing for bottom footer */}
            <div className="h-20" />
          </div>
        )}

        {/* TAB 2: MONITOR (NEO, Fireball, Space Weather, Mars, EPIC, APOD) */}
        {activeTab === 'monitor' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Sub-navigation bar for Monitor */}
            <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none text-[10px] font-bold">
              {[
                { id: 'apod', label: '🌌 APOD NASA' },
                { id: 'neo', label: language === 'zh' ? '🛸 接近地球小行星' : language === 'ja' ? '🛸 小惑星NEO' : language === 'ru' ? '🛸 Астероид NEO' : language === 'fr' ? '🛸 Astéroïde NEO' : language === 'en' ? '🛸 Asteroid NEO' : '🛸 Asteroid NEO' },
                { id: 'fireball', label: language === 'zh' ? '🔥 火球记录' : language === 'ja' ? '🔥 火球レポート' : language === 'ru' ? '🔥 Огненные шары' : language === 'fr' ? '🔥 Boules de feu' : language === 'en' ? '🔥 Fireballs' : language === 'ms' ? '🔥 Bola Api' : '🔥 Bola Api' },
                { id: 'weather', label: language === 'zh' ? '☀️ 空间天气' : language === 'ja' ? '☀️ 宇宙天気' : language === 'ru' ? '☀️ Космическая погода' : language === 'fr' ? '☀️ Météo spatiale' : language === 'en' ? '☀️ Space Weather' : language === 'ms' ? '☀️ Cuaca Angkasa' : '☀️ Cuaca Antariksa' },
                { id: 'mars', label: language === 'zh' ? '🪐 火星照片' : language === 'ja' ? '🪐 火星の画像' : language === 'ru' ? '🪐 Фото Марса' : language === 'fr' ? '🪐 Photos de Mars' : language === 'en' ? '🪐 Mars Photos' : language === 'ms' ? '🪐 Foto Mars' : '🪐 Foto Mars' },
                { id: 'epic', label: language === 'zh' ? '🌎 EPIC 地球实时' : language === 'ja' ? '🌎 EPIC 地球画像' : language === 'ru' ? '🌎 EPIC Земля' : language === 'fr' ? '🌎 EPIC Terre' : language === 'en' ? '🌎 EPIC Earth' : '🌎 EPIC Bumi' }
              ].map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setMonitorSubTab(sub.id as any)}
                  className={`px-3 py-1.5 rounded-full border flex-shrink-0 transition-all ${
                    monitorSubTab === sub.id 
                      ? 'bg-cyan-600 border-cyan-500 text-black font-extrabold shadow-md' 
                      : isDayMode 
                        ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>

            {/* Monitor Sub-tab Content */}
            <div className="mt-1 animate-fadeIn">
              {monitorSubTab === 'apod' && data.apod && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                  {/* Media Container */}
                  <div className="relative aspect-video bg-slate-950 border-b border-slate-800 flex items-center justify-center">
                    {data.apod.media_type === 'video' ? (
                      <iframe 
                        src={data.apod.image_url} 
                        className="w-full h-full"
                        allowFullScreen
                        title="APOD Video"
                      />
                    ) : (
                      <img 
                        src={normalizeImageUrl(data.apod.image_url)} 
                        alt={translatedApod?.title || data.apod.title?.[language] || data.apod.title?.id || data.apod.title?.en} 
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute top-2 right-2 bg-slate-950/80 px-2 py-0.5 rounded-md border border-slate-800 text-[8px] text-slate-400 font-bold">
                      APOD NASA
                    </div>
                  </div>

                  {/* APOD Content */}
                  <div className="p-4 space-y-3">
                    <div>
                      <span className="text-[8px] text-cyan-400 font-bold uppercase tracking-wider font-mono">
                        NASA Astronomy Picture of the Day
                      </span>
                      <h2 className="text-sm font-black text-white mt-0.5">
                        {translatedApod?.title || data.apod.title?.[language] || data.apod.title?.id || data.apod.title?.en}
                      </h2>
                      <div className="flex items-center gap-3 mt-1.5 text-[9px] text-slate-500 font-bold">
                        <span>📅 {data.apod.id}</span>
                        <span>📷 © {data.apod.copyright || 'NASA Public Domain'}</span>
                      </div>
                    </div>

                    <div className="border-t border-slate-800 pt-3">
                      <p className="text-xs text-slate-300 leading-relaxed text-justify whitespace-pre-line">
                        {translatedApod?.explanation || data.apod.explanation?.[language] || data.apod.explanation?.id || data.apod.explanation?.en}
                      </p>
                    </div>

                    {data.apod.media_type !== 'video' && (
                      <a 
                        href={data.apod.image_url}
                        download={`APOD-${data.apod.id}.jpg`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full mt-2 flex items-center justify-center gap-1.5 py-2.5 bg-cyan-950/50 hover:bg-cyan-900 border border-cyan-800/40 text-cyan-400 rounded-xl text-xs font-bold transition-all"
                      >
                        <Download className="w-3.5 h-3.5" />
                        {language === 'zh' ? '下载高清壁纸图片' : language === 'ja' ? '壁紙画像をダウンロード (HD)' : language === 'en' ? 'Download Wallpaper Image (HD)' : language === 'ms' ? 'Muat Turun Gambar Latar (HD)' : 'Unduh Gambar Wallpaper (HD)'}
                      </a>
                    )}
                  </div>
                </div>
              )}

              {monitorSubTab === 'neo' && <NeoTracker language={language} />}
              {monitorSubTab === 'fireball' && <FireballFeed language={language} />}
              {monitorSubTab === 'weather' && <SpaceWeather language={language} />}
              {monitorSubTab === 'mars' && <MarsGallery language={language} />}
              {monitorSubTab === 'epic' && <EpicEarth language={language} />}
            </div>
            {/* Safe spacing for bottom footer */}
            <div className="h-20" />
          </div>
        )}

        {activeTab === 'kamus' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Search Bar & Dropdown Select */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input 
                  type="text"
                  placeholder={
                    language === 'zh' ? '搜索文章、术语表、宇航员...' :
                    language === 'ja' ? '記事、用語集、宇宙飛行士を検索...' :
                    language === 'en' ? 'Search articles, dictionary, astronauts...' :
                    language === 'ms' ? 'Cari artikel, kamus, angkasawan...' :
                    'Cari artikel, kamus, astronot...'
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600 rounded-xl text-xs text-white placeholder-slate-500 outline-none transition-all"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-3 p-0.5 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filter Dropdown Select */}
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1">
                <Filter className="w-3.5 h-3.5 text-cyan-500" />
                <select 
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value as FilterType)}
                  className="bg-transparent text-xs text-slate-300 outline-none w-full py-1 cursor-pointer font-bold"
                >
                  <option value="semua" className="bg-slate-950 text-white">
                    {language === 'zh' ? '🗂 全部内容' : language === 'ja' ? '🗂 すべて' : language === 'en' ? '🗂 All Content' : language === 'ms' ? '🗂 Semua Kandungan' : '🗂 Semua Konten'}
                  </option>
                  <option value="blog" className="bg-slate-950 text-white">
                    {language === 'zh' ? '📝 博客文章' : language === 'ja' ? '📝 ブログ記事' : language === 'en' ? '📝 Blog Articles' : '📝 Artikel Blog'}
                  </option>
                  <option value="komet" className="bg-slate-950 text-white">
                    {language === 'zh' ? '☄️ 彗星与小行星文章' : language === 'ja' ? '☄️ 彗星・小惑星の記事' : language === 'en' ? '☄️ Comet & Asteroid Articles' : '☄️ Artikel Komet & Asteroid'}
                  </option>
                  <option value="peristiwa" className="bg-slate-950 text-white">
                    {language === 'zh' ? '🌍 自然事件 (EONET)' : language === 'ja' ? '🌍 自然災害・イベント (EONET)' : language === 'en' ? '🌍 Natural Events (EONET)' : '🌍 Peristiwa Alam (EONET)'}
                  </option>
                  <option value="astronot" className="bg-slate-950 text-white">
                    {language === 'zh' ? '👨‍🚀 宇航员资料' : language === 'ja' ? '👨‍🚀 宇宙飛行士プロフィール' : language === 'en' ? '👨‍🚀 Astronaut Profiles' : language === 'ms' ? '👨‍🚀 Profil Angkasawan' : '👨‍🚀 Profil Astronot'}
                  </option>
                  <option value="glosarium" className="bg-slate-950 text-white">
                    {language === 'zh' ? '📖 术语表' : language === 'ja' ? '📖 用語集' : language === 'en' ? '📖 Glossary / Dictionary' : '📖 Glosarium / Kamus'}
                  </option>
                  <option value="fireball" className="bg-slate-950 text-white">
                    {language === 'zh' ? '🔥 火球文章' : language === 'ja' ? '🔥 火球レポート' : language === 'en' ? '🔥 Fireball Articles' : language === 'ms' ? '🔥 Artikel Bola Api' : '🔥 Artikel Fireball (Bola Api)'}
                  </option>
                  <option value="meteorites" className="bg-slate-950 text-white">
                    {language === 'zh' ? '🪨 陨石目录' : language === 'ja' ? '🪨 隕石カタログ' : language === 'en' ? '🪨 Meteorite Catalog' : language === 'ms' ? '🪨 Katalog Meteorit' : '🪨 Katalog Meteorit'}
                  </option>
                  <option value="gallery-apod" className="bg-slate-950 text-white">
                    {language === 'zh' ? '🌌 APOD 图库' : language === 'ja' ? '🌌 APOD ギャラリー' : language === 'en' ? '🌌 APOD Gallery' : '🌌 Galeri APOD'}
                  </option>
                </select>
              </div>
            </div>

            {/* Results Count */}
            <p className="text-[10px] text-slate-500 font-bold px-1">
              {language === 'zh' ? `显示 ${filteredItems.length} 个搜索结果` :
               language === 'ja' ? `${filteredItems.length} 件の検索結果を表示中` :
               language === 'en' ? `Showing ${filteredItems.length} search results` :
               language === 'ms' ? `Memaparkan ${filteredItems.length} hasil carian` :
               `Menampilkan ${filteredItems.length} hasil pencarian`}
            </p>

            {/* Grid List Results */}
            <div className="space-y-2.5">
              {filteredItems.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  {language === 'zh' ? '没有找到符合您搜索条件的内容。' :
                   language === 'ja' ? '検索条件に一致するコンテンツが見つかりませんでした。' :
                   language === 'en' ? 'No content matches your search query.' :
                   language === 'ms' ? 'Tiada kandungan yang sepadan dengan carian anda.' :
                   'Tidak ada konten yang cocok dengan pencarian Anda.'}
                </div>
              ) : (
                filteredItems.map((item, idx) => {
                  if (item._type === 'glosarium') {
                    return (
                      <div 
                        key={item.id || idx}
                        onClick={() => setSelectedItem(item)}
                        className="p-3 bg-slate-900/40 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/60 rounded-xl space-y-1 cursor-pointer transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] bg-cyan-950 text-cyan-400 border border-cyan-800/40 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono">
                            {language === 'zh' ? '词条: ' : language === 'ja' ? '用語: ' : language === 'en' ? 'GLOSSARY: ' : 'KAMUS: '}{getTranslatedCategory(item.category)}
                          </span>
                          <span className="text-[10px] text-slate-600 font-bold">#Glossary</span>
                        </div>
                        <p className="text-xs font-black text-slate-100">{item._title}</p>
                        <p className="text-[10px] text-slate-400 line-clamp-2">{item._desc}</p>
                      </div>
                    );
                  }

                  if (item._type === 'astronot') {
                    const cacheKey = `${item.id}_${language}`;
                    const cached = astronautTransCache[cacheKey];
                    const country = cached?.country || item.country;
                    const role = cached?.role || item.role;
                    return (
                      <div 
                        key={item.id || idx}
                        onClick={() => setSelectedItem(item)}
                        className="p-3 bg-slate-900/40 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/60 rounded-xl flex items-center gap-3 cursor-pointer transition-all"
                      >
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-950 border border-slate-800 flex-shrink-0 flex items-center justify-center">
                          {item.imageUrl ? (
                            <img src={normalizeImageUrl(item.imageUrl)} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-5 h-5 text-slate-600" />
                          )}
                        </div>
                        <div className="flex-grow">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[8px] bg-purple-950 text-purple-400 border border-purple-800/40 px-2 py-0.5 rounded-full font-bold uppercase">
                              {language === 'zh' ? '宇航员' : language === 'ja' ? '宇宙飛行士' : language === 'en' ? 'ASTRONAUT' : 'ASTRONOT'}
                            </span>
                            <span className="text-[9px] text-slate-500 font-bold">{item.agency} ({country})</span>
                          </div>
                          <p className="text-xs font-black text-slate-100 mt-0.5">{item._title}</p>
                          <p className="text-[10px] text-slate-400 line-clamp-1">{role} - {language === 'zh' ? '任务' : language === 'ja' ? 'ミッション' : language === 'en' ? 'Mission' : 'Misi'}: {item.craft}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
                      </div>
                    );
                  }

                  if (item._type === 'meteorit') {
                    return (
                      <div 
                        key={item.id || idx}
                        onClick={() => setSelectedItem(item)}
                        className="p-3 bg-slate-900/40 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/60 rounded-xl flex items-center gap-3 cursor-pointer transition-all"
                      >
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 flex-shrink-0">
                          <img 
                            src={normalizeImageUrl(item.image_url) || 'https://placehold.co/100x100/020617/f59e0b?text=Meteorit'} 
                            alt="" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-grow">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[8px] bg-cyan-950 text-cyan-400 border border-cyan-800/40 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                              {language === 'zh' ? '陨石: ' : language === 'ja' ? '隕石: ' : language === 'en' ? 'METEORITE: ' : 'METEORIT: '}{item.recclass}
                            </span>
                            <span className="text-[8px] text-slate-500 font-bold">{item.year}</span>
                          </div>
                          <p className="text-xs font-black text-slate-100 mt-0.5 leading-tight">{item._title}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{item._desc}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
                      </div>
                    );
                  }

                  // default: artikel (blog, fireball, eonet, komet)
                  return (
                    <div 
                      key={item.id || idx}
                      onClick={() => setSelectedItem(item)}
                      className="p-3 bg-slate-900/40 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/60 rounded-xl flex items-start gap-3 cursor-pointer transition-all"
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 flex-shrink-0">
                        <img 
                          src={normalizeImageUrl(item.image) || 'https://placehold.co/100x100/020617/0ea5e9?text=Space'} 
                          alt="" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-grow">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[8px] bg-emerald-950 text-emerald-400 border border-emerald-800/40 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                            {getTranslatedCategory(item.category)}
                          </span>
                          <span className="text-[8px] text-slate-500 font-bold">{item.date}</span>
                        </div>
                        <p className="text-xs font-black text-slate-100 mt-0.5 leading-tight">{item._title}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{item._desc}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-600 mt-3 flex-shrink-0" />
                    </div>
                  );
                })
              )}
            </div>
            {/* Safe spacing for bottom footer */}
            <div className="h-20" />
          </div>
        )}

        {/* TAB 4: FIELD UTILITIES (COMPASS & GEOLOCATION WATERMARK) */}
        {activeTab === 'utilitas' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Impact Calculator Widget */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-amber-400" />
                <h2 className="text-xs font-black text-amber-400 tracking-wider uppercase">{curT.calculatorTitle}</h2>
              </div>
              
              <form onSubmit={handleCalculateImpact} className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[9px] text-slate-400 font-bold block mb-1">{curT.massLabel.toUpperCase()}</label>
                  <input 
                    type="number"
                    value={calcInput.mass}
                    onChange={(e) => setCalcInput(prev => ({ ...prev, mass: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-white"
                    placeholder="e.g. 500"
                    required
                  />
                </div>
                <div>
                  <label className="text-[9px] text-slate-400 font-bold block mb-1">{curT.velocityLabel.toUpperCase()}</label>
                  <input 
                    type="number"
                    value={calcInput.velocity}
                    onChange={(e) => setCalcInput(prev => ({ ...prev, velocity: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-white"
                    placeholder="e.g. 18"
                    required
                  />
                </div>
                <div>
                  <label className="text-[9px] text-slate-400 font-bold block mb-1">{curT.angleLabel.toUpperCase()}</label>
                  <input 
                    type="number"
                    max="90"
                    min="1"
                    value={calcInput.angle}
                    onChange={(e) => setCalcInput(prev => ({ ...prev, angle: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-white"
                    placeholder="e.g. 45"
                    required
                  />
                </div>
                <div>
                  <label className="text-[9px] text-slate-400 font-bold block mb-1">{curT.targetLabel.toUpperCase()}</label>
                  <select
                    value={calcInput.target}
                    onChange={(e) => setCalcInput(prev => ({ ...prev, target: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-white font-bold"
                  >
                    <option value="rock">🪨 {curT.rockTarget}</option>
                    <option value="soil">🌱 {curT.soilTarget}</option>
                    <option value="water">💧 {curT.waterTarget}</option>
                  </select>
                </div>
                <button 
                  type="submit"
                  className="col-span-2 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-black transition-all mt-1"
                >
                  {curT.calculateBtn}
                </button>
              </form>

              {/* Calc Results Display */}
              {calcResult && (
                <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 space-y-2 mt-2">
                  <div className="flex items-center justify-between text-xs border-b border-slate-900 pb-1.5">
                    <span className="text-slate-400 font-bold">{curT.calcRisk}:</span>
                    <span className={`font-black px-2 py-0.5 rounded ${
                      calcResult.level.includes('Aman') || calcResult.level.includes('Safe') || calcResult.level.includes('Selamat') || calcResult.level.includes('安全') ? 'bg-green-500/10 text-green-400' :
                      calcResult.level.includes('Rendah') || calcResult.level.includes('Low') || calcResult.level.includes('低い') || calcResult.level.includes('较低') ? 'bg-yellow-500/10 text-yellow-400' :
                      calcResult.level.includes('Sedang') || calcResult.level.includes('Moderate') || calcResult.level.includes('Sederhana') || calcResult.level.includes('中等') || calcResult.level.includes('中程度') ? 'bg-orange-500/10 text-orange-400' : 'bg-red-500/10 text-red-400'
                    }`}>
                      {calcResult.level}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-[9px] text-slate-500 font-bold">{curT.calcEnergy}</p>
                      <p className="font-mono font-bold text-amber-300 mt-0.5">{calcResult.energyMt.toFixed(4)} Megaton</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-500 font-bold">{curT.calcCrater}</p>
                      <p className="font-mono font-bold text-amber-300 mt-0.5">{(calcResult.craterDiameter * 1000).toFixed(1)} Meter</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed border-t border-slate-900 pt-1.5 italic">
                    {calcResult.description}
                  </p>
                </div>
              )}
            </div>

            {/* Field Geotag Watermark Camera */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-cyan-400" />
                  <h2 className="text-xs font-black text-cyan-400 tracking-wider uppercase">{language === 'zh' ? '水印相机' : language === 'ja' ? '透かしカメラ' : language === 'en' ? 'Watermark Camera' : 'Kamera Watermark'}</h2>
                </div>
                <button 
                  onClick={requestGpsLocation}
                  className="text-[9px] flex items-center gap-1 text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 px-2 py-0.5 rounded-full border border-cyan-500/20"
                >
                  <MapPin className="w-2.5 h-2.5" />
                  {gpsLoading ? 'GPS...' : (language === 'zh' ? '扫描位置' : language === 'ja' ? '位置をスキャン' : language === 'en' ? 'Scan Location' : language === 'ms' ? 'Imbas Lokasi' : 'Pindai Lokasi')}
                </button>
              </div>

              <p className="text-[10px] text-slate-400 leading-relaxed">
                {curT.gpsSubtitle}
              </p>

              {/* Video Camera Container */}
              {cameraActive ? (
                <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-slate-800">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted
                    className="w-full h-full object-cover"
                  />
                  <button 
                    onClick={capturePhoto}
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full border-4 border-white bg-cyan-500/80 hover:bg-cyan-500 flex items-center justify-center shadow-lg transition-all"
                  >
                    <Camera className="w-5 h-5 text-white" />
                  </button>
                  <button 
                    onClick={stopCamera}
                    className="absolute top-2 right-2 p-1.5 bg-slate-950/80 hover:bg-slate-950 text-white rounded-lg border border-slate-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 text-center">
                  <button 
                    onClick={startCamera}
                    className="flex flex-col items-center justify-center p-4 bg-slate-950 hover:bg-slate-900 border border-slate-800/80 rounded-xl gap-2 transition-all group"
                  >
                    <Camera className="w-6 h-6 text-cyan-400 group-hover:scale-105 transition-all" />
                    <span className="text-[10px] font-bold text-slate-300">{curT.activateCamera}</span>
                  </button>
                  <label className="flex flex-col items-center justify-center p-4 bg-slate-950 hover:bg-slate-900 border border-slate-800/80 rounded-xl gap-2 transition-all cursor-pointer group">
                    <Download className="w-6 h-6 text-purple-400 rotate-180 group-hover:scale-105 transition-all" />
                    <span className="text-[10px] font-bold text-slate-300">{curT.uploadHp}</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload} 
                      className="hidden" 
                    />
                  </label>
                </div>
              )}

              {!cameraActive && (
                <p className="text-[9px] text-slate-500 text-center leading-relaxed mt-1">
                  {curT.photoTips}
                </p>
              )}

              {cameraError && (
                <p className="text-[9px] text-red-400 italic text-center">{cameraError}</p>
              )}

              {/* GPS Manual Fallbacks if Geolocation denied or manual customization wanted */}
              <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 space-y-2 text-xs">
                <span className="text-[9px] text-slate-500 font-black tracking-wider uppercase block">
                  {language === 'zh' ? '手动自定义元数据（如有需要）' : language === 'ja' ? '手動メタデータ設定（必要な場合）' : language === 'en' ? 'Manual Metadata Customization (If Needed)' : 'Kustomisasi Metadata Manual (Jika Perlu)'}
                </span>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] text-slate-400 font-bold block mb-1">LATITUDE</label>
                    <input 
                      type="text" 
                      value={gpsData ? gpsData.lat.toFixed(6) : gpsManual.lat}
                      onChange={(e) => {
                        setGpsData(null);
                        setGpsManual(prev => ({ ...prev, lat: e.target.value }));
                      }}
                      className="w-full bg-slate-900 border border-slate-800 p-1.5 rounded text-white font-mono text-[10px]"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 font-bold block mb-1">LONGITUDE</label>
                    <input 
                      type="text" 
                      value={gpsData ? gpsData.lon.toFixed(6) : gpsManual.lon}
                      onChange={(e) => {
                        setGpsData(null);
                        setGpsManual(prev => ({ ...prev, lon: e.target.value }));
                      }}
                      className="w-full bg-slate-900 border border-slate-800 p-1.5 rounded text-white font-mono text-[10px]"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 font-bold block mb-1">ALTITUDE (MSL)</label>
                    <input 
                      type="number" 
                      value={altitude}
                      onChange={(e) => setAltitude(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 p-1.5 rounded text-white font-mono text-[10px]"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 font-bold block mb-1">{language === 'zh' ? '罗盘方向角度 (0-360°)' : language === 'ja' ? 'コンパス角度 (0-360°)' : language === 'en' ? 'COMPASS ANGLE (0-360°)' : 'SUDUT KOMPAS (0-360°)'}</label>
                    <input 
                      type="number" 
                      min="0"
                      max="360"
                      value={direction}
                      onChange={(e) => setDirection(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 p-1.5 rounded text-white font-mono text-[10px]"
                    />
                  </div>
                </div>
              </div>

              {/* Watermark Result Modal / View */}
              {watermarkedImage && (
                <div className="bg-slate-950 border border-cyan-900/50 rounded-xl p-3 space-y-3 relative overflow-hidden animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-1.5">
                    <span className="text-xs text-cyan-400 font-bold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> {language === 'zh' ? '水印结果' : language === 'ja' ? '透かし合成結果' : language === 'en' ? 'Watermark Result' : 'Hasil Watermark'}
                    </span>
                    <button 
                      onClick={() => setWatermarkedImage(null)}
                      className="text-slate-500 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="aspect-video w-full rounded-lg overflow-hidden border border-slate-800 bg-black">
                    <img src={watermarkedImage} alt="Watermarked" className="w-full h-full object-contain" />
                  </div>

                  <a 
                    href={watermarkedImage}
                    download={`MeteoritIndonesia-${Date.now()}.jpg`}
                    className="w-full flex items-center justify-center gap-1.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {language === 'zh' ? '保存照片到手机' : language === 'ja' ? 'スマホに写真を保存' : language === 'en' ? 'Save Photo to Phone' : language === 'ms' ? 'Simpan Foto ke Telefon' : 'Simpan Foto ke Ponsel'}
                  </a>
                </div>
              )}
            </div>
            
            {/* Hidden canvas for drawing watermarks */}
            <canvas ref={canvasRef} className="hidden" />
            {/* Safe spacing for bottom footer */}
            <div className="h-20" />
          </div>
        )}

        {/* TAB 5: VERIFIKASI & DONASI */}
        {activeTab === 'verifikasi' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Verifikasi Form Card */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-purple-400" />
                <h2 className="text-xs font-black text-purple-400 tracking-wider uppercase">{curT.verifyTitle}</h2>
              </div>
              
              <p className="text-[10px] text-slate-400 leading-relaxed">
                {curT.verifySubtitle}
              </p>

              {verifySuccess ? (
                <div className="bg-green-950/40 border border-green-900/50 p-4 rounded-xl text-center text-xs text-green-300">
                  <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <p className="font-bold">{curT.verifySuccess}</p>
                  <p className="mt-1 text-slate-400">{curT.verifySuccessSub}</p>
                  <button 
                    onClick={() => setVerifySuccess(false)}
                    className="mt-3 px-4 py-1.5 bg-green-900/80 hover:bg-green-800 text-white rounded-lg font-bold transition-all"
                  >
                    {language === 'zh' ? '提交新报告' : language === 'ja' ? '新しい報告を送信' : language === 'en' ? 'Submit New Report' : 'Kirim Laporan Baru'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleVerifySubmit} className="space-y-2.5 text-xs">
                  <div>
                    <label className="text-[9px] text-slate-400 font-bold block mb-1">{curT.nameLabel.toUpperCase()}</label>
                    <input 
                      type="text"
                      value={verifyForm.name}
                      onChange={(e) => setVerifyForm(p => ({ ...p, name: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-white"
                      placeholder={language === 'zh' ? '您的姓名' : language === 'ja' ? 'お名前' : language === 'en' ? 'Your Name' : 'Nama Anda'}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 font-bold block mb-1">{curT.emailLabel.toUpperCase()}</label>
                    <input 
                      type="email"
                      value={verifyForm.email}
                      onChange={(e) => setVerifyForm(p => ({ ...p, email: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-white"
                      placeholder="email@example.com"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] text-slate-400 font-bold block mb-1">{curT.weightLabel.toUpperCase()}</label>
                      <input 
                        type="text"
                        value={verifyForm.weight}
                        onChange={(e) => setVerifyForm(p => ({ ...p, weight: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-white"
                        placeholder="e.g. 150g"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-400 font-bold block mb-1">{curT.locationLabel.toUpperCase()}</label>
                      <input 
                        type="text"
                        value={verifyForm.location}
                        onChange={(e) => setVerifyForm(p => ({ ...p, location: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-white"
                        placeholder="e.g. Lampung"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 font-bold block mb-1">{curT.descLabel.toUpperCase()}</label>
                    <textarea 
                      value={verifyForm.description}
                      onChange={(e) => setVerifyForm(p => ({ ...p, description: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-white h-16 resize-none"
                      placeholder={curT.descPlaceholder}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 font-bold block mb-1">{language === 'zh' ? '上传陨石图片' : language === 'ja' ? '隕石の画像をアップロード' : language === 'en' ? 'UPLOAD FIND IMAGE' : 'UNGGAH GAMBAR BATUAN'}</label>
                    {verifyImage ? (
                      <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-800 bg-black">
                        <img src={verifyImage} alt="Temuan" className="w-full h-full object-contain" />
                        <button 
                          onClick={() => setVerifyImage(null)}
                          className="absolute top-2 right-2 p-1 bg-red-950/80 hover:bg-red-950 text-white rounded border border-red-800"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <label className="w-full h-14 bg-slate-950 border border-dashed border-slate-800 rounded-lg flex items-center justify-center cursor-pointer hover:border-slate-700 transition-all">
                        <span className="text-[10px] text-slate-500 font-bold">{language === 'zh' ? '从手机相册选择图片' : language === 'ja' ? 'スマホのギャラリーから画像を選択' : language === 'en' ? 'Select Image from Phone Gallery' : 'Pilih Gambar dari Galeri HP'}</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                              const r = new FileReader();
                              r.onload = (ev) => setVerifyImage(ev.target?.result as string);
                              r.readAsDataURL(f);
                            }
                          }}
                          className="hidden" 
                        />
                      </label>
                    )}
                  </div>
                  <button 
                    type="submit"
                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black transition-all mt-1"
                  >
                    {curT.submitBtn}
                  </button>
                </form>
              )}
            </div>

            {/* Push Notification Settings Card */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-cyan-400" />
                <h2 className="text-xs font-black text-cyan-400 tracking-wider uppercase">{language === 'zh' ? '小程序推送通知' : language === 'ja' ? 'ミニアプリプッシュ通知' : language === 'en' ? 'Mini App Push Notifications' : 'Notifikasi Push Mini App'}</h2>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                {language === 'zh' ? '开启即时推送通知，第一时间获取新陨石流星坠落报告、BMKG 地震警报及最新的太空科学新闻。' : language === 'ja' ? 'インスタントプッシュ通知を有効にして、新しい隕石火球の落下レポート、BMKG地震警告、および最新の宇宙ニュースをいち早く受け取ります。' : language === 'en' ? 'Enable instant push notifications to get real-time alerts for new meteor fireballs, BMKG earthquake warnings, and space news.' : 'Aktifkan pemberitahuan instan langsung ke perangkat Anda untuk update jatuhan bola api meteorit baru, status peringatan gempa BMKG, dan berita luar angkasa lainnya.'}
              </p>
              
              <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-850">
                <span className="text-xs text-slate-300 font-bold">{language === 'zh' ? '太空与地震通知' : language === 'ja' ? '宇宙＆地震通知' : language === 'en' ? 'Space & Earthquake Alerts' : 'Notifikasi Antariksa & Gempa'}</span>
                <button
                  onClick={handleTogglePush}
                  disabled={pushLoading || pushStatus === 'unsupported'}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-wide uppercase transition-all ${
                    pushStatus === 'granted'
                      ? 'bg-green-950/40 border border-green-800/40 text-green-400'
                      : pushStatus === 'denied'
                        ? 'bg-red-950/40 border border-red-800/40 text-red-400'
                        : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                  }`}
                >
                  {pushLoading
                    ? curT.loading
                    : pushStatus === 'granted'
                      ? (language === 'zh' ? '已开启 ✅' : language === 'ja' ? '有効 ✅' : language === 'en' ? 'Active ✅' : 'Aktif ✅')
                      : pushStatus === 'denied'
                        ? (language === 'zh' ? '已拒绝 ❌' : language === 'ja' ? '拒否 ❌' : language === 'en' ? 'Denied ❌' : 'Ditolak ❌')
                        : pushStatus === 'unsupported'
                          ? (language === 'zh' ? '不支持' : language === 'ja' ? '非対応' : language === 'en' ? 'Unsupported' : 'Tidak Didukung')
                          : (language === 'zh' ? '开启 🔔' : language === 'ja' ? '有効にする 🔔' : language === 'en' ? 'Enable 🔔' : 'Aktifkan 🔔')}
                </button>
              </div>
            </div>

            {/* Donation Card */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3 text-center">
              <div className="flex items-center justify-center gap-1.5 text-rose-500">
                <Heart className="w-4 h-4 fill-rose-500 animate-pulse" />
                <h2 className="text-xs font-black tracking-wider uppercase">{curT.donationTitle}</h2>
              </div>
              
              <p className="text-[10px] text-slate-400 leading-relaxed max-w-xs mx-auto">
                {curT.donationSubtitle}
              </p>

              {/* Donation Options Grid */}
              <div className="grid grid-cols-3 gap-2">
                {['25000', '50000', '100000'].map(val => (
                  <button 
                    key={val}
                    onClick={() => setDonationAmount(val)}
                    className={`py-2 rounded-lg text-xs font-mono font-bold border transition-all ${
                      donationAmount === val 
                        ? 'bg-rose-950/50 border-rose-600 text-rose-300' 
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    Rp {parseInt(val).toLocaleString('id-ID')}
                  </button>
                ))}
              </div>

              {/* Checkout Links */}
              <div className="space-y-2 pt-2">
                <a 
                  href={`/donations?amount=${donationAmount}`}
                  className="w-full block text-center py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black transition-all"
                >
                  {curT.donationQris}
                </a>
                <a 
                  href={`https://paypal.me/meteoritindonesia/${Math.round(parseInt(donationAmount)/15000)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full block text-center py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 rounded-xl text-xs font-bold transition-all"
                >
                  {curT.donationPaypal}
                </a>
              </div>
            </div>
            
            {/* Safe spacing for bottom footer */}
            <div className="h-20" />
          </div>
        )}
      </main>

      {/* BOTTOM TAB NAVIGATION BAR */}
      {!isInputFocused && (
        <nav
          className="relative z-50 flex-shrink-0 w-full bg-slate-900/95 border-t border-slate-800 flex items-center justify-around pt-2 pb-4 px-1 safe-bottom"
          style={{ minHeight: '60px' }}
        >
          {[
            { id: 'radar', icon: Radio, label: language === 'zh' ? '雷达' : language === 'ja' ? 'レーダー' : language === 'ru' ? 'Радар' : 'Radar' },
            { id: 'monitor', icon: Compass, label: language === 'zh' ? '空间监测' : language === 'ja' ? '宇宙監視' : language === 'ru' ? 'Монитор' : language === 'fr' ? 'Surveill.' : language === 'en' ? 'Monitoring' : language === 'ms' ? 'Pemantauan' : 'Pemantauan' },
            { id: 'kamus', icon: BookOpen, label: language === 'zh' ? '术语表' : language === 'ja' ? '用語集' : language === 'ru' ? 'Словарь' : language === 'fr' ? 'Dictionn.' : language === 'en' ? 'Dictionary' : 'Kamus' },
            { id: 'utilitas', icon: Camera, label: language === 'zh' ? '工具' : language === 'ja' ? 'ツール' : language === 'ru' ? 'Инструм.' : language === 'fr' ? 'Outils' : language === 'en' ? 'Tools' : 'Alat' },
            { id: 'verifikasi', icon: Heart, label: language === 'zh' ? '支持' : language === 'ja' ? 'サポート' : language === 'ru' ? 'Поддержка' : language === 'fr' ? 'Soutien' : language === 'en' ? 'Support' : language === 'ms' ? 'Sokong' : 'Dukung' }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  try {
                    if (tab.id !== 'utilitas') {
                      stopCamera();
                    }
                  } catch (e) {
                    console.warn('Error stopping camera:', e);
                  }
                  setActiveTab(tab.id as TabName);
                }}
                className="flex flex-col items-center py-1 px-3.5 transition-all text-center rounded-xl"
                style={{ width: '20%', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
              >
                <Icon className={`w-4 h-4 transition-all ${
                  isActive ? 'text-cyan-400 scale-110 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]' : 'text-slate-500 hover:text-slate-400'
                }`} />
                <span className={`text-[8px] mt-0.5 font-bold tracking-wider ${
                  isActive ? 'text-cyan-400 font-extrabold' : 'text-slate-500'
                }`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </nav>
      )}

      {/* DETAIL MODAL OVERLAY */}
      {resolvedItem && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[60] flex items-start md:items-center justify-center p-4 overflow-y-auto select-none animate-fadeIn"
          onClick={() => setSelectedItem(null)}
        >
          <div 
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl max-h-[90vh] md:max-h-[85vh] overflow-y-auto flex flex-col pb-6 select-text shadow-2xl my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Modal Image Header */}
            <div className="relative aspect-video bg-black flex-shrink-0">
              <img 
                src={normalizeImageUrl(resolvedItem.image || resolvedItem.imageUrl || resolvedItem.image_url) || 'https://placehold.co/800x450/020617/0ea5e9?text=Space'} 
                alt="" 
                className="w-full h-full object-cover"
              />
              <button 
                onClick={() => setSelectedItem(null)}
                className="absolute top-3 right-3 p-2 bg-slate-950/80 hover:bg-slate-950 text-white rounded-full border border-slate-800 shadow-md transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              <div className="space-y-1">
                <span className="text-[8px] bg-cyan-950 text-cyan-400 border border-cyan-800/40 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono">
                  {getTranslatedCategory(resolvedItem.category || resolvedItem.craft || resolvedItem._type)}
                </span>
                <h3 className="text-sm font-black text-white leading-tight">
                  {resolvedItem._title}
                </h3>
                {resolvedItem.date && (
                  <p className="text-[9px] text-slate-500 font-bold">{language === 'zh' ? '发布于: ' : language === 'ja' ? '公開日: ' : language === 'en' ? 'Published: ' : 'Terbit: '}{resolvedItem.date}</p>
                )}
              </div>

              {/* Technical / Info Details */}
              {resolvedItem._type === 'astronot' && (
                <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[8px] text-slate-500 font-bold block">{language === 'zh' ? '国家' : language === 'ja' ? '国名' : language === 'en' ? 'COUNTRY' : 'NEGARA'}</span>
                    <span className="font-bold text-slate-200">{resolvedItem.country}</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-500 font-bold block">{language === 'zh' ? '航天机构' : language === 'ja' ? '宇宙機関' : language === 'en' ? 'SPACE AGENCY' : 'LEMBAGA ANTARIKSA'}</span>
                    <span className="font-bold text-slate-200">{resolvedItem.agency}</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-500 font-bold block">{language === 'zh' ? '角色 / 职务' : language === 'ja' ? '役割 / 職務' : language === 'en' ? 'ROLE / POSITION' : 'PERAN / JABATAN'}</span>
                    <span className="font-bold text-slate-200">{resolvedItem.role}</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-500 font-bold block">{language === 'zh' ? '发射时间' : language === 'ja' ? '打ち上げ日' : language === 'en' ? 'LAUNCH DATE' : 'PELUNCURAN'}</span>
                    <span className="font-bold text-slate-200">{resolvedItem.launchDate}</span>
                  </div>
                </div>
              )}

              {resolvedItem._type === 'meteorit' && (
                <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[8px] text-slate-500 font-bold block">{language === 'zh' ? '官方名称' : language === 'ja' ? '公式名' : language === 'en' ? 'OFFICIAL NAME' : 'NAMA RESMI'}</span>
                    <span className="font-bold text-slate-200">{resolvedItem.name}</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-500 font-bold block">{curT.classification}</span>
                    <span className="font-bold text-slate-200">{resolvedItem.recclass}</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-500 font-bold block">{curT.massWeight}</span>
                    <span className="font-bold text-slate-200">{resolvedItem.mass}</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-500 font-bold block">{curT.yearFallen}</span>
                    <span className="font-bold text-slate-200">{resolvedItem.year}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[8px] text-slate-500 font-bold block">{curT.coordinatesFallen}</span>
                    <span className="font-mono font-bold text-slate-200">
                      {resolvedItem.lat !== '0' && resolvedItem.long !== '0' 
                        ? `${parseFloat(resolvedItem.lat).toFixed(4)}°, ${parseFloat(resolvedItem.long).toFixed(4)}°` 
                        : (language === 'zh' ? '未知' : language === 'ja' ? '不明' : language === 'ru' ? 'Неизвестно' : language === 'fr' ? 'Inconnu' : language === 'en' ? 'Unknown' : 'Tidak diketahui')}
                    </span>
                  </div>
                </div>
              )}

              {resolvedItem.fireball_data && (
                <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 grid grid-cols-2 gap-2.5 text-xs">
                  <div className="col-span-2">
                    <span className="text-[8px] text-slate-500 font-bold block">{curT.eventTimeUtc}</span>
                    <span className="font-mono font-bold text-slate-200">{resolvedItem.fireball_data.event_date}</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-500 font-bold block">{curT.eventCoordinates}</span>
                    <span className="font-mono font-bold text-slate-200">
                      {resolvedItem.fireball_data.lat}° {resolvedItem.fireball_data.lat_dir}, {resolvedItem.fireball_data.lon}° {resolvedItem.fireball_data.lon_dir}
                    </span>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-500 font-bold block">{curT.energyExplosion}</span>
                    <span className="font-mono font-bold text-slate-200">{resolvedItem.fireball_data.energy_kt} kiloton</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-500 font-bold block">{curT.entryAltitude}</span>
                    <span className="font-mono font-bold text-slate-200">{resolvedItem.fireball_data.alt ? `${resolvedItem.fireball_data.alt} km` : 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-500 font-bold block">{curT.velocity}</span>
                    <span className="font-mono font-bold text-slate-200">{resolvedItem.fireball_data.vel ? `${resolvedItem.fireball_data.vel} km/s` : 'N/A'}</span>
                  </div>
                </div>
              )}

              {/* Description Content */}
              <div className="border-t border-slate-800 pt-4">
                {resolvedItem.content ? (
                  // Simple display of content or description
                  <p className="text-xs text-slate-300 leading-relaxed text-justify whitespace-pre-line font-medium">
                    {resolvedItem.content.replace(/Source: NASA Open Data.*/, '').trim()}
                  </p>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-300 leading-relaxed text-justify whitespace-pre-line font-medium">
                      {resolvedItem._desc}
                    </p>
                    {resolvedItem.example && (
                      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs italic text-slate-400">
                        <span className="text-[9px] text-slate-500 font-bold block uppercase not-italic mb-0.5">
                          {language === 'zh' ? '使用示例' : language === 'ja' ? '使用例' : language === 'en' ? 'EXAMPLE USAGE' : 'CONTOH PENGGUNAAN'}
                        </span>
                        "{resolvedItem.example?.[language] || resolvedItem.example?.id || resolvedItem.example?.en}"
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Share actions */}
              <div className="border-t border-slate-800 pt-4 flex gap-3 text-xs">
                <button 
                  onClick={() => handleShare(resolvedItem)}
                  className="flex-grow flex items-center justify-center gap-1.5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold transition-all"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  {language === 'zh' ? '分享至社交媒体' : language === 'ja' ? 'SNSに共有' : language === 'en' ? 'Share to Social Media' : 'Bagikan ke Media Sosial'}
                </button>
                <button 
                  onClick={() => setSelectedItem(null)}
                  className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all"
                >
                  {language === 'zh' ? '关闭' : language === 'ja' ? '閉じる' : language === 'en' ? 'Close' : 'Tutup'}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* SHARE FALLBACK OVERLAY */}
      {shareOpenItem && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[70] flex items-end justify-center p-4 select-none touch-none animate-fadeIn"
          onClick={() => setShareOpenItem(null)}
        >
          <div 
            className="w-full max-w-sm bg-slate-900 border border-slate-850 rounded-2xl p-4 space-y-4 shadow-2xl select-text touch-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-[10px] font-black text-cyan-400 tracking-wider uppercase">{language === 'zh' ? '分享至社交媒体' : language === 'ja' ? 'SNSに共有' : language === 'en' ? 'Share to Social Media' : 'Bagikan Ke Media Sosial'}</span>
              <button onClick={() => setShareOpenItem(null)} className="text-slate-500 hover:text-white">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <a 
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareOpenItem.text + '\n' + shareOpenItem.url)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 p-3 bg-slate-950 border border-slate-850 rounded-xl hover:border-green-800 text-green-400 transition-all font-bold"
              >
                💚 WhatsApp
              </a>
              <a 
                href={`https://t.me/share/url?url=${encodeURIComponent(shareOpenItem.url)}&text=${encodeURIComponent(shareOpenItem.text)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 p-3 bg-slate-950 border border-slate-850 rounded-xl hover:border-sky-800 text-sky-400 transition-all font-bold"
              >
                💙 Telegram
              </a>
              <a 
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareOpenItem.url)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 p-3 bg-slate-950 border border-slate-850 rounded-xl hover:border-blue-800 text-blue-400 transition-all font-bold col-span-2"
              >
                💙 Facebook
              </a>
              <button 
                onClick={() => {
                  if (typeof navigator !== 'undefined') {
                    navigator.clipboard.writeText(`${shareOpenItem.text}\n\n${shareOpenItem.url}`);
                    alert(language === 'zh' ? '链接已复制到剪贴板！' : language === 'ja' ? 'リンクをクリップボードにコピーしました！' : language === 'en' ? 'Link copied to clipboard!' : 'Tautan disalin ke papan klip!');
                  }
                  setShareOpenItem(null);
                }}
                className="w-full flex items-center justify-center gap-2 p-3 bg-slate-800 rounded-xl text-white hover:bg-slate-700 transition-all font-bold col-span-2"
              >
                📋 {language === 'zh' ? '复制链接' : language === 'ja' ? 'リンクをコピー' : language === 'en' ? 'Copy Link' : 'Salin Tautan'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
