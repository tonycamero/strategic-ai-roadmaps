import { Router } from 'express';
import multer from 'multer';
import { authenticate, requireTenantAccess, requireRole } from '../middleware/auth';
import * as documentsController from '../controllers/documents.controller.ts';

const router = Router();

// Configure multer for file uploads
const upload = multer({ 
  dest: '/tmp/uploads', // Temporary storage
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
});

// READ-ONLY: All tenant members can view documents
router.get('/', authenticate, requireTenantAccess(), documentsController.listDocuments);
router.get('/:id', authenticate, requireTenantAccess(), documentsController.getDocument);
router.get('/:id/download', authenticate, requireTenantAccess(), documentsController.downloadDocument);

// OWNER-ONLY: Upload and delete
router.post('/upload', authenticate, requireRole('owner', 'superadmin'), upload.single('file'), documentsController.uploadDocument);
router.delete('/:id', authenticate, requireRole('owner', 'superadmin'), documentsController.deleteDocument);

export default router;
