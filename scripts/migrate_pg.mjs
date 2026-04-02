import pg from 'pg'
const { Client } = pg

async function run() {
  const connectionString = "postgresql://postgres.snozedmxpwufqzvzrmmw:1q2w3e4r!!rmsghd92!!@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  })
  
  await client.connect()
  console.log('Connected to DB natively...')

  try {
    const res = await client.query(`SELECT id, exposure_level, expired_at, vvip_expired_at, vip_expired_at, normal_expired_at FROM "Job" WHERE expired_at IS NOT NULL`)
    const jobs = res.rows
    
    console.log(`Found ${jobs.length} jobs to migrate...`)
    let count = 0;

    for (const job of jobs) {
      if (job.vvip_expired_at || job.vip_expired_at || job.normal_expired_at) {
        continue;
      }

      let vvip = null;
      let vip = null;
      let normal = null;
      const e = job.expired_at;

      if (job.exposure_level === 'VVIP') {
        vvip = e; vip = e; normal = e;
      } else if (job.exposure_level === 'VIP') {
        vip = e; normal = e;
      } else {
        normal = e;
      }

      await client.query(
        `UPDATE "Job" SET vvip_expired_at = $1, vip_expired_at = $2, normal_expired_at = $3 WHERE id = $4`,
        [vvip, vip, normal, job.id]
      )
      count++;
      if (count % 100 === 0) console.log(`Migrated ${count} jobs...`);
    }

    console.log(`Migration done! Updated ${count} records.`)
  } catch (err) {
    console.error(err)
  } finally {
    await client.end()
  }
}

run()
