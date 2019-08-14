import * as multer from 'multer';
import { resolve } from 'dns';

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

}
export default new FileUploads;

