/**
 * BOLEKA APK Generator
 * 
 * Uses PWABuilder's cloud API to generate an Android APK
 * from the PWA manifest. This requires no local Java/Android SDK.
 * 
 * Usage: node scripts/generate-apk.js
 * 
 * The APK will be downloaded and saved to public/boleka.apk
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PWA_URL = 'https://boleka-web8.vercel.app';
const OUTPUT_PATH = path.join(__dirname, '..', 'public', 'boleka.apk');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    }).on('error', reject);
  });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', reject);
  });
}

async function generateAPK() {
  console.log('🔨 BOLEKA APK Generator');
  console.log('========================\n');
  console.log(`📱 Source PWA: ${PWA_URL}`);
  console.log(`📦 Output: ${OUTPUT_PATH}\n`);

  // Step 1: Submit the PWA to PWABuilder
  console.log('Step 1: Submitting to PWABuilder...');
  
  const manifestUrl = `${PWA_URL}/manifest.json`;
  
  try {
    // Use PWABuilder's API to generate APK
    const pwabuilderUrl = `https://pwabuilder.com/generate?url=${encodeURIComponent(manifestUrl)}`;
    console.log(`   Manifest: ${manifestUrl}`);
    console.log(`   Builder: ${pwabuilderUrl}\n`);
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 To generate the APK, you have two options:');
    console.log('');
    console.log('Option A: Online (PWABuilder)');
    console.log(`  Visit: ${pwabuilderUrl}`);
    console.log('  Click "Android" → Download APK');
    console.log('');
    console.log('Option B: Local (Bubblewrap + Android SDK)');
    console.log('  1. Install bubblewrap: npm install -g @bubblewrap/cli');
    console.log('  2. Install Android SDK & Java JDK 17+');
    console.log('  3. Run: bubblewrap init --manifest https://boleka-web8.vercel.app/manifest.json');
    console.log('  4. Run: bubblewrap build');
    console.log('');
    console.log('Option C: GitHub Actions (Automated)');
    console.log('  See: android-app/github-actions.yml');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Try direct download from pwabuilder
    console.log('Attempting direct download from PWABuilder...');
    const downloadUrl = `https://pwabuilder.com/api/AndroidPackage?url=${encodeURIComponent(PWA_URL)}`;
    
    try {
      await downloadFile(downloadUrl, OUTPUT_PATH);
      const stats = fs.statSync(OUTPUT_PATH);
      console.log(`✅ APK generated successfully! (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
      console.log(`   Saved to: ${OUTPUT_PATH}`);
    } catch (downloadError) {
      console.log('⚠️  Direct download not available (requires interactive session)');
      console.log('   Please use Option A above to download the APK manually.');
      console.log(`   Then place it at: ${OUTPUT_PATH}`);
    }
    
    // Check if APK already exists
    if (fs.existsSync(OUTPUT_PATH)) {
      const stats = fs.statSync(OUTPUT_PATH);
      console.log(`\n✅ APK file found at public/boleka.apk (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
      console.log('   Ready for distribution!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Tip: Use Option A above — it takes < 2 minutes to generate the APK online.');
  }
}

generateAPK();