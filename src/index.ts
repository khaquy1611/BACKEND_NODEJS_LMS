import express from 'express'
import dotenv from 'dotenv'

dotenv.config()
import configViewEngine from './config/viewEngine'
import webRoutes from './routes/web'
import connection from './config/database'

const app = express()
const port = process.env.PORT || 3000
const hostName = process.env.HOST_NAME || 'localhost'
// config template engine
configViewEngine(app)
app.use('/api/v1', webRoutes)

connection.query('SELECT * FROM Users u', function (err, results, fields) {
  console.log('>>>>>results=', results) // results contains rows returned by server
  console.log('>>>>>fields=', fields) // fields contains extra meta data about results, if available
})

app.listen(port, () => {
  console.log(`Example app listening on ${hostName}/${port}`)
})
