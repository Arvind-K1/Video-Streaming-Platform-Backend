import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/temp')
    },
    filename: function (req, file, cb) {
        cb(null,file.originalname)
    }
})

export const upload = multer({storage: storage})
//As both storage name is same so we can also write as 
// const upload = multer({storage,})