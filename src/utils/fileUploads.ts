import * as multer from 'multer';
import * as fs from 'fs';

export class FileUploads {

    public uploadFile() {
        try {
            const storage = multer.diskStorage({
                destination: (req, file, cb) => {
                    cb(null, 'public/uploads/images')
                },
                filename: (req, file, cb) => {
                    let splited = file.originalname.split('.');
                    if (splited.length) {
                        cb(null, Date.now() + '.' + splited[splited.length - 1]);
                    } else {
                        cb(null, Date.now() + file.originalname);
                    }
                }
            });
            const upload = multer({ storage: storage });
            return upload;
        } catch (e) {
            console.log('uploadFile', e);
        }

    }

    public removeFile(filename) {
        try {
            const path = `public/uploads/images/${filename}`;
            fs.unlink(path, (err) => {
                if (err) {
                    console.error(err)
                    return
                }
                console.log('Image Deleted');
            });
        } catch (e) {
            console.log('removeFile', e);
        }
    }

}
export default new FileUploads;

