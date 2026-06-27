# Deployment Guide for Meteorit Indonesia

## Prerequisites

Before deploying, make sure you have:

1. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
2. **GitHub Account** - For connecting your repository
3. **Firebase Project** - Set up at [firebase.google.com](https://firebase.google.com)
4. **Cloudflare R2** - Set up at [cloudflare.com](https://cloudflare.com)
5. **Midtrans Account** - For payment processing

## Step 1: Prepare Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK
FIREBASE_ADMIN_PRIVATE_KEY=your_private_key
FIREBASE_ADMIN_CLIENT_EMAIL=your_client_email
FIREBASE_ADMIN_CLIENT_ID=your_client_id
FIREBASE_ADMIN_PROJECT_ID=your_project_id

# Cloudflare R2 Configuration
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=your_bucket_name
R2_PUBLIC_URL=your_public_url
R2_S3_ENDPOINT=your_s3_endpoint

# API Keys
NASA_API_KEY=your_nasa_api_key
GROQ_API_KEY=your_groq_api_key
OPENROUTER_API_KEY=your_openrouter_api_key
MISTRAL_API_KEY=your_mistral_api_key

# Midtrans Payment Gateway
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=your_client_key
MIDTRANS_SERVER_KEY=your_server_key

# Cron Job Secret
CRON_SECRET=your_cron_secret

# Google Analytics & Adsense
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=your_ga_id
NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID=your_adsense_id
NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID=your_gtm_id

# Next.js Configuration
NEXT_PUBLIC_SITE_URL=https://meteorit.my.id
```

## Step 2: Set Up Firebase

### 2.1 Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project" and follow the instructions
3. Enable Firebase Authentication (Google provider)
4. Enable Firestore Database
5. Enable Storage

### 2.2 Set Up Firebase Security Rules

Deploy the security rules from `firebase.rules.json`:

```bash
firebase deploy --only firestore:rules
```

### 2.3 Generate Service Account Key

1. Go to Project Settings > Service Accounts
2. Click "Generate new private key"
3. Save the JSON file and add the credentials to your `.env.local` file

## Step 3: Set Up Cloudflare R2

### 3.1 Create R2 Bucket
1. Go to [Cloudflare R2](https://dash.cloudflare.com/?to=/:account/r2)
2. Click "Create bucket"
3. Name it `meteorit-indonesia`

### 3.2 Configure CORS

Use the `r2-cors.xml` file to set up CORS rules:

```bash
# Using AWS CLI with R2
aws s3api put-bucket-cors --bucket meteorit-indonesia --cors-configuration file://r2-cors.xml --endpoint-url https://your-account-id.r2.cloudflarestorage.com
```

### 3.3 Create Access Keys
1. Go to R2 > Manage R2 API Tokens
2. Click "Create API Token"
3. Save the Access Key ID and Secret Access Key to your `.env.local` file

## Step 4: Set Up Midtrans

1. Sign up at [Midtrans](https://midtrans.com)
2. Go to Dashboard > Settings > Access Keys
3. Copy the Client Key and Server Key to your `.env.local` file
4. Enable production mode when ready

## Step 5: Deploy to Vercel

### 5.1 Connect GitHub Repository
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New" > "Project"
3. Select your GitHub repository
4. Click "Import"

### 5.2 Configure Project Settings
1. Go to Project Settings
2. Add all environment variables from your `.env.local` file
3. Set the following build settings:
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

### 5.3 Set Up Domain (Optional)
1. Go to Project Settings > Domains
2. Add your custom domain
3. Follow the DNS configuration instructions

## Step 6: Set Up Cron Jobs

### 6.1 Vercel Cron Jobs
1. Go to your Vercel project
2. Click on "Cron Jobs" tab
3. Add a new cron job:
   - **Path**: `/api/cron`
   - **Schedule**: `0 0 * * *` (Every day at midnight)
   - **Branch**: `main` (or your production branch)

### 6.2 Manual Trigger
You can also trigger the cron job manually by visiting:
```
https://your-domain.vercel.app/api/cron?secret=your_cron_secret
```

## Step 7: Post-Deployment Setup

### 7.1 Initialize Database
1. Go to your admin dashboard
2. Navigate to "Settings" > "Backup & Restore"
3. Click "Create Backup" to initialize the database

### 7.2 Set Up Admin User
1. Go to your admin dashboard
2. Navigate to "User Management"
3. Create your first admin user

### 7.3 Configure Donation Options
1. Go to "Donation Management"
2. Set up donation amounts and Midtrans configuration

### 7.4 Configure Ad Placements
1. Go to "Ad Management"
2. Set up Google Adsense and manual ads
3. Configure ad placements

## Step 8: Monitoring and Maintenance

### 8.1 Set Up Monitoring
1. Connect Google Analytics
2. Set up error monitoring (Sentry or similar)
3. Configure uptime monitoring

### 8.2 Regular Backups
1. Schedule regular database backups
2. Test restore procedure periodically

### 8.3 Performance Optimization
1. Monitor page load times
2. Optimize images and assets
3. Implement caching strategies

## Troubleshooting

### Common Issues

#### 1. Firebase Authentication Not Working
- Check if Firebase config is correct in `.env.local`
- Verify that Google provider is enabled in Firebase Console
- Check CORS settings

#### 2. Cloudflare R2 Access Denied
- Verify R2 credentials in `.env.local`
- Check bucket permissions
- Ensure CORS is properly configured

#### 3. Cron Job Not Running
- Verify cron secret matches
- Check Vercel cron job logs
- Test manual trigger

#### 4. Midtrans Payment Failed
- Check if Midtrans is in production mode
- Verify client and server keys
- Check callback URLs

## Security Best Practices

1. **Never commit `.env.local` to Git**
2. Use Vercel's environment variable encryption
3. Rotate API keys regularly
4. Enable Firebase App Check
5. Implement rate limiting
6. Use HTTPS everywhere
7. Keep dependencies updated

## Scaling

### For Increased Traffic
1. Upgrade Vercel plan for more bandwidth
2. Implement CDN for static assets
3. Use Cloudflare caching
4. Consider database sharding

### For Additional Features
1. Add more AI content generation
2. Implement user subscriptions
3. Add e-commerce functionality
4. Integrate more NASA APIs

## Support

For issues and questions:
- Email: support@meteorit-indonesia.com
- GitHub Issues: https://github.com/your-repo/meteorit-indonesia/issues
- Documentation: `${NEXT_PUBLIC_SITE_URL}/docs`

© 2026 Meteorit Indonesia. All rights reserved.
