import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createBuckets() {
    const buckets = ['business-certs', 'job-images', 'logos', 'job-content']

    for (const bucket of buckets) {
        console.log(`Checking bucket: ${bucket}...`)
        const { data, error } = await supabase.storage.getBucket(bucket)

        if (error && error.message.includes('not found')) {
            console.log(`Creating bucket: ${bucket}...`)
            const { error: createError } = await supabase.storage.createBucket(bucket, {
                public: true,
                allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
                fileSizeLimit: 5242880 // 5MB
            })
            if (createError) {
                console.error(`Error creating bucket ${bucket}:`, createError.message)
            } else {
                console.log(`Bucket ${bucket} created successfully.`)
            }
        } else if (error) {
            console.error(`Error checking bucket ${bucket}:`, error.message)
        } else {
            console.log(`Bucket ${bucket} already exists.`)
        }
    }
}

createBuckets()
