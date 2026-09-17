import fs from 'fs';
import path from 'path';
import { db } from '../../storage/DatabaseAdapter';
import { aiEngine } from './AIEngine';
import { instagramWebEngine } from '../engine/InstagramWebEngine';

async function runCron() {
  console.log('====================================================');
  console.log('🚀 OpenIG Cloud 4K Auto-Poster (Autonomous Cron)');
  console.log('⏰ Timestamp:', new Date().toISOString());
  console.log('====================================================');

  const rawSession = process.env.INSTAGRAM_SESSION_ID?.trim();
  const sessionIdEnv = (rawSession && rawSession !== 'true' && rawSession !== 'false' && rawSession.length > 5)
    ? rawSession
    : '29180762911%3A8GHBcWmlbEFceL%3A23%3AAYlJwNdrLqQwzCb8JiwPoU_CJ_3y6CJGmzFfRNHACg';

  const rawUserId = process.env.INSTAGRAM_USER_ID?.trim();
  const dsUserId = (rawUserId && rawUserId !== 'true' && rawUserId !== 'false' && rawUserId.length > 3)
    ? rawUserId
    : '29180762911';

  const rawUsername = process.env.INSTAGRAM_USERNAME?.trim();
  const username = (rawUsername && rawUsername !== 'true' && rawUsername !== 'false' && rawUsername.length > 2)
    ? rawUsername
    : 'shivamkumar12323229';

  console.log(`👤 Target Instagram Account: @${username} (UID: ${dsUserId})`);
  const sessionId = `ig_${username}_cloud`;
  db.upsertSession({
    id: sessionId,
    username,
    displayName: username,
    status: 'READY',
    authType: 'cookies',
    cookies: {
      sessionid: sessionIdEnv,
      ds_user_id: dsUserId
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  const hour = new Date().getUTCHours();
  let chosenCategory = 'life_reality';
  if (hour >= 4 && hour < 12) {
    chosenCategory = 'life_reality';
  } else if (hour >= 12 && hour < 17) {
    chosenCategory = 'silent_hustle';
  } else {
    chosenCategory = 'time_trust';
  }

  console.log(`\n🎯 Selected Category: ${chosenCategory}`);
  const authorHandle = `@${username}`;

  console.log('✨ Generating S+ Grade 4K Quote Card...');
  const quoteResult = await aiEngine.generateEmotionalQuote(chosenCategory, undefined, authorHandle);
  console.log(`⭐ Critic Rating: ${quoteResult.criticScore.overallRating}/100 [${quoteResult.criticScore.grade}]`);
  const fileToUpload = (quoteResult.videoReelPath && fs.existsSync(quoteResult.videoReelPath))
    ? quoteResult.videoReelPath
    : quoteResult.localImagePath;

  console.log(`\n🚀 Uploading Post/Reel (${path.basename(fileToUpload)}) with Full Trending Audio live to Instagram Web...`);
  const uploadResult = await instagramWebEngine.uploadRealPost(sessionId, fileToUpload, quoteResult.caption);
  console.log('Upload Response:', uploadResult);

  if (uploadResult.success) {
    console.log('🎉 SUCCESS: Post published live to Instagram!');
    process.exit(0);
  } else {
    console.error('❌ Upload Failed:', uploadResult.message);
    process.exit(1);
  }
}

runCron().catch((err) => {
  console.error('Fatal Cron Error:', err);
  process.exit(1);
});
