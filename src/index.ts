import express from 'express'
import dotenv from 'dotenv'
import mysql from 'mysql2'
dotenv.config()
import configViewEngine from './config/viewEngine'
import webRoutes from './routes/web'

const app = express()
const port = process.env.PORT || 3000
const hostName = process.env.HOST_NAME || 'localhost'
// config template engine
configViewEngine(app)
app.use('/api/v1', webRoutes)

const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'test'
})
connection.query('SELECT * FROM Users u', function (err, results, fields) {
  console.log('>>>>>results=', results) // results contains rows returned by server
  console.log('>>>>>fields=', fields) // fields contains extra meta data about results, if available
})

app.listen(port, () => {
  console.log(`Example app listening on ${hostName}/${port}`)
})
