import multer from 'multer';

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        console.log('\n=== FILE UPLOAD STARTED ===');
        console.log(`[Multer] Destination directory: ./public/temp`);
        console.log(`[File Info] Original name: ${file.originalname}`);
        console.log(`[File Info] MIME type: ${file.mimetype}`);
        cb(null, './public/temp');
    },
    filename: function (req, file, cb) {
        console.log(`[Naming] Using original filename: ${file.originalname}`);
        cb(null, file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    console.log(`[Validation] Checking file type for ${file.originalname}`);
    // Add your file type validation logic here
    cb(null, true);
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 1024 * 1024 * 5 // 5MB
    }
});

// Add event listeners for upload process
upload.single('file').on('file', (req, file) => {
    console.log(`[Upload] Started processing file: ${file.originalname}`);
});

upload.single('file').on('limit', () => {
    console.error('[Error] File size exceeds limit');
});

upload.single('file').on('error', (err) => {
    console.error('[Upload Error]', err);
    console.error('[Error Details]', err.stack);
});

upload.single('file').on('end', () => {
    console.log('[Upload] File processing completed');
    console.log('=== FILE UPLOAD FINISHED ===\n');
});

export const uploadMiddleware = upload;

// Alternative usage example:
// export const upload = multer({ 
//     storage,
//     fileFilter,
//     limits: { fileSize: 5000000 }
// });