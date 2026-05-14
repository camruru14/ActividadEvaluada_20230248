import dotenv from "dotenv"

export const config = {
    db:{
        URI: process.env.DB_URI
    },
    JWT:{
        Secret: process.env.JWT_Secret_key
    },
    email:{
        user_email:process-env.USER_EMAIL,
        user_password: process.env.USER_PASSWORD
    }
}