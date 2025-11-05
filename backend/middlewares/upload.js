const multer = require('multer');
const path = require('path');

// Set up storage engine
const storage = multer.diskStorage({
    destination: function(req,file,cb){
        cb(null,path.join(__dirname,'../uploads'));
    },
    filename: function(req,file,cb){
        cb(null,Date.now()+ '-'+ file.originalname);
    }
})

const upload = multer({ storage: storage });

module.exports = upload;
