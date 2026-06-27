import { getSiteUrl } from './siteUrl';

// Cloudflare R2 Configuration
const R2_CONFIG = {
  accountId: process.env.R2_ACCOUNT_ID || "5f29e48300ae379ebe15c20185d15ac8",
  accessKeyId: process.env.R2_ACCESS_KEY_ID || "cd3b2f027722b69c38f2f9ebf3663228",
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "5e2207a33647f195c2616ebb6f2ad4b8c421c629756c9459186b8988af1a8073",
  bucketName: process.env.R2_BUCKET_NAME || "meteorit-indonesia",
  publicUrl: process.env.R2_PUBLIC_URL || "https://pub-a60a40fd84104aa089d4cd04cdb98d19.r2.dev",
  s3Endpoint: process.env.R2_S3_ENDPOINT || "https://5f29e48300ae379ebe15c20185d15ac8.r2.cloudflarestorage.com"
};

export const R2_CORS_RULES = `<?xml version="1.0" encoding="UTF-8"?>
<CORSConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
    <CORSRule>
        <AllowedOrigin>*</AllowedOrigin>
        <AllowedMethod>GET</AllowedMethod>
        <AllowedMethod>HEAD</AllowedMethod>
        <AllowedHeader>*</AllowedHeader>
        <ExposeHeader>ETag</ExposeHeader>
        <MaxAgeSeconds>3000</MaxAgeSeconds>
    </CORSRule>
    <CORSRule>
        <AllowedOrigin>${getSiteUrl()}</AllowedOrigin>
        <AllowedOrigin>https://*.vercel.app</AllowedOrigin>
        <AllowedMethod>GET</AllowedMethod>
        <AllowedMethod>PUT</AllowedMethod>
        <AllowedMethod>POST</AllowedMethod>
        <AllowedMethod>DELETE</AllowedMethod>
        <AllowedMethod>HEAD</AllowedMethod>
        <AllowedHeader>*</AllowedHeader>
        <ExposeHeader>ETag</ExposeHeader>
        <MaxAgeSeconds>3000</MaxAgeSeconds>
    </CORSRule>
</CORSConfiguration>`;

export default R2_CONFIG;
