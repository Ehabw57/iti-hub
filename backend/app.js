const express  = require('express')
const dotenv = require('dotenv')

dotenv.config()
const app = express()

const PORT = process.env.PORT || 3030

app.get('/', (req, res) => {
  res.json({message: 'Hello, itihub'})
})

app.listen(PORT, ()=> {
  console.log(`Server is running on http://localhost:${PORT}`)
})
