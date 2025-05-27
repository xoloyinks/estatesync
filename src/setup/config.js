import dotenv from 'dotenv'
dotenv.config({
    path: '../../.env', override: false
})


const CONFIG = {
    ENV: {
        ACCESS_TOKEN_SECRET: process.env.AWS_SECRET_ACCESS_KEY,
        ACCESS_TOKEN: process.env.AWS_ACCESS_KEY,
        AWS_REGION: process.env.AWS_REGION,
        AWS_BUCKET_NAME: process.env.AWS_BUCKET_NAME
    }   
}

export default CONFIG;