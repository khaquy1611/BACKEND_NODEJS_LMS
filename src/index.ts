import express from 'express'
import path from 'path'
import dotenv from 'dotenv'
dotenv.config()

const app = express()
const port = process.env.PORT || 3000
const hostName = process.env.HOST_NAME || 'localhost'
// config template engine
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

app.get('/', (req, res) => {
  res.render('sample')
})

app.get('/abc', (req, res) => {
  res.send('Check ABC!')
})

app.listen(port, () => {
  console.log(`Example app listening on ${hostName}/${port}`)
})
